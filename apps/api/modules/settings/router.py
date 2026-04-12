"""
Settings Module Router
System configuration and user preferences API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from functools import cache
from typing import Any, List
from datetime import datetime, timezone
import ipaddress
import json
import socket
import urllib.parse
import urllib.request
from core.auth import UserContext, get_current_user
from core.supabase import get_supabase_service, require_supabase_service
from .service import SettingsService
from .schema import (
    SystemSettingCreate,
    SystemSettingUpdate,
    SystemSettingResponse,
    UserPreferenceCreate,
    UserPreferenceUpdate,
    UserPreferenceResponse,
    Theme
)

router = APIRouter()


@cache
def _svc() -> SettingsService:
    return SettingsService(db_client=get_supabase_service())

GLOBAL_BACKUP_TABLES = ("users", "workspace_preferences", "biometric_credentials")


def _is_admin(role: str | None) -> bool:
    return str(role or "").strip().lower() in {"super_admin", "admin"}


def _load_rows_for_backup(table_name: str, user: UserContext) -> list[dict[str, Any]]:
    svc = require_supabase_service()

    query = svc.table(table_name).select("*")
    if not _is_admin(user.get("role")):
        if table_name == "users":
            query = query.eq("id", user.user_id)
        else:
            query = query.eq("user_id", user.user_id)
    result = query.execute()
    return result.data or []


def _restore_rows(table_name: str, rows: list[dict[str, Any]], user: UserContext) -> int:
    svc = require_supabase_service()
    if not rows:
        return 0

    sanitized: list[dict[str, Any]] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        if _is_admin(user.get("role")):
            sanitized.append(row)
            continue

        # Non-admin users may only restore their own rows.
        if table_name == "users":
            if str(row.get("id") or "") == user.user_id:
                row = {**row}
                # Non-admin cannot elevate role through restore payload.
                row.pop("role", None)
                sanitized.append(row)
        else:
            if str(row.get("user_id") or "") == user.user_id:
                sanitized.append(row)

    if not sanitized:
        return 0

    if table_name == "users":
        svc.table("users").upsert(sanitized, on_conflict="id").execute()
        return len(sanitized)
    if table_name == "workspace_preferences":
        svc.table("workspace_preferences").upsert(sanitized, on_conflict="user_id").execute()
        return len(sanitized)
    if table_name == "biometric_credentials":
        svc.table("biometric_credentials").upsert(sanitized, on_conflict="user_id,credential_id").execute()
        return len(sanitized)
    return 0


def _validate_backup_payload(payload: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    tables_obj = payload.get("tables")
    if not isinstance(tables_obj, dict):
        raise HTTPException(status_code=422, detail="Invalid backup payload: missing tables")

    normalized: dict[str, list[dict[str, Any]]] = {}
    for table_name in GLOBAL_BACKUP_TABLES:
        table_rows = tables_obj.get(table_name, [])
        if isinstance(table_rows, list):
            normalized[table_name] = [row for row in table_rows if isinstance(row, dict)]
        else:
            normalized[table_name] = []
    return normalized

@router.get("/system", response_model=List[SystemSettingResponse])
async def get_system_settings(current_user: dict = Depends(get_current_user)):
    """Get all system settings"""
    return await _svc().get_system_settings()

@router.post("/system", response_model=SystemSettingResponse)
async def create_system_setting(
    setting: SystemSettingCreate,
    current_user: UserContext = Depends(get_current_user)
):
    """Create a new system setting (admin only)"""
    if current_user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return await _svc().update_system_setting(setting.key, setting.value, current_user.user_id)

@router.put("/system/{setting_key}", response_model=SystemSettingResponse)
async def update_system_setting(
    setting_key: str,
    setting: SystemSettingUpdate,
    current_user: UserContext = Depends(get_current_user)
):
    """Update a system setting (admin only)"""
    if current_user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return await _svc().update_system_setting(setting_key, setting.value, current_user.user_id)

@router.delete("/system/{setting_key}")
async def delete_system_setting(
    setting_key: str,
    current_user: UserContext = Depends(get_current_user)
):
    """Delete a system setting (admin only)"""
    if current_user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    # Placeholder behavior until persistent settings catalog is implemented.
    return {"message": f"Setting '{setting_key}' delete queued"}

@router.get("/user")
async def get_workspace_preferences(current_user: UserContext = Depends(get_current_user)) -> dict[str, Any]:
    """Get current user's preferences"""
    return await _svc().get_workspace_preferences(current_user.user_id)

@router.post("/user")
async def create_user_preference(
    preference: UserPreferenceCreate,
    current_user: UserContext = Depends(get_current_user)
):
    """Create a user preference"""
    return await _svc().update_user_preference(current_user.user_id, preference.key, str(preference.value))

@router.put("/user/{preference_key}")
async def update_user_preference(
    preference_key: str,
    preference: UserPreferenceUpdate,
    current_user: UserContext = Depends(get_current_user)
):
    """Update a user preference"""
    return await _svc().update_user_preference(
        current_user.user_id, preference_key, str(preference.value)
    )

@router.delete("/user/{preference_key}")
async def delete_user_preference(
    preference_key: str,
    current_user: UserContext = Depends(get_current_user)
):
    """Delete a user preference"""
    return {"message": f"Preference '{preference_key}' delete queued"}

@router.get("/themes", response_model=List[str])
async def get_available_themes():
    """Get list of available themes"""
    return [theme.value for theme in Theme]


@router.get("/backup/providers")
async def backup_providers(current_user: UserContext = Depends(get_current_user)) -> dict[str, Any]:
    return {
        "providers": [
            {"id": "local", "label": "Local Device"},
            {"id": "google_drive", "label": "Google Drive"},
            {"id": "one_drive", "label": "Microsoft OneDrive"},
            {"id": "dropbox", "label": "Dropbox"},
            {"id": "other", "label": "Other Drive"},
        ],
        "role": current_user.get("role"),
    }


@router.post("/backup/export")
async def export_backup(payload: dict[str, Any], current_user: UserContext = Depends(get_current_user)) -> dict[str, Any]:
    requested_scope = str(payload.get("scope") or "auto").strip().lower()
    role_name = str(current_user.get("role") or "").strip().lower()
    is_admin = _is_admin(role_name)

    if requested_scope == "global" and not is_admin:
        raise HTTPException(status_code=403, detail="Global backup requires admin role")

    scope = "global" if (requested_scope == "global" and is_admin) else ("global" if is_admin and requested_scope == "auto" else "personal")
    tables: dict[str, list[dict[str, Any]]] = {}
    for table_name in GLOBAL_BACKUP_TABLES:
        tables[table_name] = _load_rows_for_backup(table_name, current_user)

    return {
        "version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "scope": scope,
        "generated_by": current_user.user_id,
        "role": role_name,
        "tables": tables,
    }


@router.post("/backup/restore")
async def restore_backup(payload: dict[str, Any], current_user: UserContext = Depends(get_current_user)) -> dict[str, Any]:
    tables = _validate_backup_payload(payload)
    restored_counts: dict[str, int] = {}
    for table_name in GLOBAL_BACKUP_TABLES:
        restored_counts[table_name] = _restore_rows(table_name, tables.get(table_name, []), current_user)

    return {
        "restored": True,
        "counts": restored_counts,
    }


def _assert_public_url(url: str) -> None:
    """Raise HTTPException if the URL resolves to a private/internal address (SSRF guard)."""
    parsed = urllib.parse.urlparse(url)
    hostname = parsed.hostname or ""
    if not hostname:
        raise HTTPException(status_code=422, detail="A valid backup URL is required")
    try:
        ip = ipaddress.ip_address(socket.gethostbyname(hostname))
    except (socket.gaierror, ValueError) as exc:
        raise HTTPException(status_code=422, detail="Could not resolve backup URL host") from exc
    if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
        raise HTTPException(status_code=422, detail="Backup URL must point to a public host")


@router.post("/backup/restore/from-url")
async def restore_backup_from_url(payload: dict[str, Any], current_user: UserContext = Depends(get_current_user)) -> dict[str, Any]:
    backup_url = str(payload.get("url") or "").strip()
    if not backup_url.lower().startswith("https://"):
        raise HTTPException(status_code=422, detail="A valid HTTPS backup URL is required")

    _assert_public_url(backup_url)

    try:
        with urllib.request.urlopen(backup_url, timeout=20) as response:  # noqa: S310
            raw = response.read().decode("utf-8")
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Failed to fetch backup URL: {exc}") from exc

    try:
        backup_payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=422, detail="Backup URL did not return valid JSON") from exc

    if not isinstance(backup_payload, dict):
        raise HTTPException(status_code=422, detail="Backup payload must be a JSON object")

    return await restore_backup(backup_payload, current_user)