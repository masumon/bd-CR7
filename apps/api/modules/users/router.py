from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from core.auth import UserContext, get_current_user, require_roles
from core.supabase import supabase_service

router = APIRouter()


def _client_or_503():
    if supabase_service is None:
        raise HTTPException(status_code=503, detail="Supabase service client is not configured")
    return supabase_service


@router.get("/users")
async def list_users(user: UserContext = Depends(get_current_user)) -> list[dict[str, Any]]:
    client = _client_or_503()
    rows = client.table("users").select("id,email,full_name,is_active").limit(100).execute()
    return rows.data or []


@router.post("/users")
async def create_user(payload: dict[str, Any], user: UserContext = Depends(require_roles("super_admin", "admin"))) -> dict[str, Any]:
    client = _client_or_503()
    inserted = client.table("users").insert(payload).execute()
    return {"created": bool(inserted.data), "data": (inserted.data or [{}])[0]}


@router.get("/users/{user_id}")
async def get_user(user_id: str, user: UserContext = Depends(get_current_user)) -> dict[str, Any]:
    client = _client_or_503()
    row = client.table("users").select("*").eq("id", user_id).limit(1).execute()
    data = row.data or []
    if not data:
        raise HTTPException(status_code=404, detail="User not found")
    return data[0]


@router.patch("/users/{user_id}")
async def update_user(user_id: str, payload: dict[str, Any], user: UserContext = Depends(require_roles("super_admin", "admin"))) -> dict[str, Any]:
    client = _client_or_503()
    updated = client.table("users").update(payload).eq("id", user_id).execute()
    return {"updated": bool(updated.data), "data": (updated.data or [{}])[0]}


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, user: UserContext = Depends(require_roles("super_admin", "admin"))) -> dict[str, bool]:
    client = _client_or_503()
    client.table("users").delete().eq("id", user_id).execute()
    return {"deleted": True}


@router.get("/users/me/profile")
async def get_my_profile(user: UserContext = Depends(get_current_user)) -> dict[str, Any]:
    client = _client_or_503()
    row = client.table("users").select("id,email,full_name,phone,profile_image_url").eq("id", user.user_id).limit(1).execute()
    data = row.data or []
    if not data:
        raise HTTPException(status_code=404, detail="User profile not found")
    profile = data[0]
    profile.setdefault("user_code", None)
    return profile


@router.patch("/users/me/profile")
async def update_my_profile(payload: dict[str, Any], user: UserContext = Depends(get_current_user)) -> dict[str, Any]:
    client = _client_or_503()
    allowed_keys = {"full_name", "phone", "profile_image_url"}
    safe_payload = {k: v for k, v in payload.items() if k in allowed_keys}
    if not safe_payload:
        return {"updated": False, "data": {}}
    updated = client.table("users").update(safe_payload).eq("id", user.user_id).execute()
    return {"updated": bool(updated.data), "data": (updated.data or [{}])[0]}


@router.get("/users/me/preferences")
async def get_my_preferences(user: UserContext = Depends(get_current_user)) -> dict[str, Any]:
    client = _client_or_503()
    try:
        row = (
            client.table("workspace_preferences")
            .select("theme,language,notifications_enabled,offline_mode_enabled")
            .eq("user_id", user.user_id)
            .limit(1)
            .execute()
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Failed to load preferences: {exc}") from exc

    data = (row.data or [{}])[0]
    return {
        "theme": data.get("theme") or "dark",
        "language": data.get("language") or "en",
        "integrations": {
            "realtime": bool(data.get("notifications_enabled", True)),
            "offlineSync": bool(data.get("offline_mode_enabled", False)),
        },
    }


@router.patch("/users/me/preferences")
async def update_my_preferences(payload: dict[str, Any], user: UserContext = Depends(get_current_user)) -> dict[str, Any]:
    client = _client_or_503()
    raw_integrations = payload.get("integrations")
    integrations: dict[str, Any] = raw_integrations if isinstance(raw_integrations, dict) else {}
    theme_value = payload.get("theme")
    language_value = payload.get("language")
    realtime_value = integrations.get("realtime")
    offline_sync_value = integrations.get("offlineSync")

    upsert_payload: dict[str, Any] = {"user_id": user.user_id}
    if isinstance(theme_value, str) and theme_value in {"dark", "light"}:
        upsert_payload["theme"] = theme_value
    if isinstance(language_value, str) and language_value in {"bn", "en"}:
        upsert_payload["language"] = language_value
    if realtime_value is not None:
        upsert_payload["notifications_enabled"] = bool(realtime_value)
    if offline_sync_value is not None:
        upsert_payload["offline_mode_enabled"] = bool(offline_sync_value)

    try:
        result = (
            client.table("workspace_preferences")
            .upsert(upsert_payload, on_conflict="user_id")
            .execute()
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Failed to save preferences: {exc}") from exc

    data = (result.data or [{}])[0]
    return {
        "updated": bool(result.data),
        "theme": data.get("theme") or upsert_payload.get("theme") or "dark",
        "language": data.get("language") or upsert_payload.get("language") or "en",
        "integrations": {
            "realtime": bool(data.get("notifications_enabled", upsert_payload.get("notifications_enabled", True))),
            "offlineSync": bool(data.get("offline_mode_enabled", upsert_payload.get("offline_mode_enabled", False))),
        },
    }
