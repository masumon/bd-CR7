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
    row = client.table("users").select("id,email,full_name,phone,user_code,profile_image_url").eq("id", user.user_id).limit(1).execute()
    data = row.data or []
    if not data:
        raise HTTPException(status_code=404, detail="User profile not found")
    return data[0]


@router.patch("/users/me/profile")
async def update_my_profile(payload: dict[str, Any], user: UserContext = Depends(get_current_user)) -> dict[str, Any]:
    client = _client_or_503()
    updated = client.table("users").update(payload).eq("id", user.user_id).execute()
    return {"updated": bool(updated.data), "data": (updated.data or [{}])[0]}


@router.get("/users/me/preferences")
async def get_my_preferences(user: UserContext = Depends(get_current_user)) -> dict[str, Any]:
    client = _client_or_503()
    row = client.table("user_preferences").select("preferences").eq("user_id", user.user_id).limit(1).execute()
    data = row.data or []
    return {"preferences": data[0].get("preferences", {}) if data else {}}


@router.patch("/users/me/preferences")
async def update_my_preferences(payload: dict[str, Any], user: UserContext = Depends(get_current_user)) -> dict[str, Any]:
    client = _client_or_503()
    result = client.table("user_preferences").upsert({"user_id": user.user_id, "preferences": payload}, on_conflict="user_id").execute()
    return {"updated": bool(result.data), "data": (result.data or [{}])[0]}
