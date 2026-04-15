from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from core.auth import UserContext, get_current_user, require_roles
from core.supabase import get_supabase_service, require_supabase_service

router = APIRouter()




@router.get("/users")
async def list_users(user: UserContext = Depends(require_roles("super_admin", "admin"))) -> list[dict[str, Any]]:
    client = require_supabase_service()
    try:
        rows = (
            client.table("users")
            .select("id,email,full_name,role,is_active,user_code")
            .limit(500)
            .execute()
        )
        data = rows.data or []
    except Exception:
        # Some environments may not have user_code yet.
        rows = (
            client.table("users")
            .select("id,email,full_name,role,is_active")
            .limit(500)
            .execute()
        )
        data = rows.data or []
        for row in data:
            row.setdefault("user_code", None)
    return data


@router.get("/users/list")
async def list_users_compat(user: UserContext = Depends(require_roles("super_admin", "admin"))) -> list[dict[str, Any]]:
    # Backward-compatible alias used by the settings User Management tab.
    return await list_users(user)


@router.post("/users")
async def create_user(payload: dict[str, Any], user: UserContext = Depends(require_roles("super_admin", "admin"))) -> dict[str, Any]:
    client = require_supabase_service()
    inserted = client.table("users").insert(payload).execute()
    return {"created": bool(inserted.data), "data": (inserted.data or [{}])[0]}


@router.get("/users/{user_id}")
async def get_user(user_id: str, user: UserContext = Depends(get_current_user)) -> dict[str, Any]:
    client = require_supabase_service()
    row = client.table("users").select("*").eq("id", user_id).limit(1).execute()
    data = row.data or []
    if not data:
        raise HTTPException(status_code=404, detail="User not found")
    return data[0]


@router.patch("/users/{user_id}")
async def update_user(user_id: str, payload: dict[str, Any], user: UserContext = Depends(require_roles("super_admin", "admin"))) -> dict[str, Any]:
    client = require_supabase_service()
    updated = client.table("users").update(payload).eq("id", user_id).execute()
    return {"updated": bool(updated.data), "data": (updated.data or [{}])[0]}


@router.patch("/users/{user_id}/role")
async def update_user_role(user_id: str, payload: dict[str, Any], user: UserContext = Depends(require_roles("super_admin", "admin"))) -> dict[str, Any]:
    client = require_supabase_service()
    role = str(payload.get("role") or "").strip().lower()
    allowed_roles = {"super_admin", "admin", "manager", "accountant", "supervisor", "engineer", "maker", "checker", "viewer", "worker"}
    if role not in allowed_roles:
        raise HTTPException(status_code=422, detail="Invalid role")

    updated = client.table("users").update({"role": role}).eq("id", user_id).execute()
    if not updated.data:
        raise HTTPException(status_code=404, detail="User not found")
    return {"updated": True, "data": updated.data[0]}


@router.patch("/users/{user_id}/status")
async def update_user_status(user_id: str, payload: dict[str, Any], user: UserContext = Depends(require_roles("super_admin", "admin"))) -> dict[str, Any]:
    client = require_supabase_service()
    if "is_active" not in payload:
        raise HTTPException(status_code=422, detail="is_active is required")

    is_active = bool(payload.get("is_active"))
    updated = client.table("users").update({"is_active": is_active}).eq("id", user_id).execute()
    if not updated.data:
        raise HTTPException(status_code=404, detail="User not found")
    return {"updated": True, "data": updated.data[0]}


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, user: UserContext = Depends(require_roles("super_admin", "admin"))) -> dict[str, bool]:
    client = require_supabase_service()
    if user_id == user.user_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    client.table("users").delete().eq("id", user_id).execute()
    return {"deleted": True}


@router.get("/users/me/profile")
async def get_my_profile(user: UserContext = Depends(get_current_user)) -> dict[str, Any]:
    client = require_supabase_service()
    row = client.table("users").select("id,email,full_name,phone,profile_image_url").eq("id", user.user_id).limit(1).execute()
    data = row.data or []
    if not data:
        raise HTTPException(status_code=404, detail="User profile not found")
    profile = data[0]
    profile.setdefault("user_code", None)
    return profile


@router.patch("/users/me/profile")
async def update_my_profile(payload: dict[str, Any], user: UserContext = Depends(get_current_user)) -> dict[str, Any]:
    client = require_supabase_service()
    allowed_keys = {"full_name", "phone", "profile_image_url"}
    safe_payload = {k: v for k, v in payload.items() if k in allowed_keys}
    if not safe_payload:
        return {"updated": False, "data": {}}
    updated = client.table("users").update(safe_payload).eq("id", user.user_id).execute()
    return {"updated": bool(updated.data), "data": (updated.data or [{}])[0]}


@router.get("/users/me/preferences")
async def get_my_preferences(user: UserContext = Depends(get_current_user)) -> dict[str, Any]:
    client = require_supabase_service()
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
    client = require_supabase_service()
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
