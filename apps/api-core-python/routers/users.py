import logging

from fastapi import APIRouter, Depends, HTTPException

from core.auth import UserContext, get_current_user, require_roles
from core.supabase import supabase_service
from schemas.users import UserCreate, UserProfileUpdate, UserUpdate, WorkspacePreferencesPatch

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/me/profile")
async def get_my_profile(user: UserContext = Depends(get_current_user)):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    row = supabase_service.table("users").select("id,email,full_name,phone,updated_at").eq("id", user.user_id).limit(1).execute()
    if not row.data:
        raise HTTPException(status_code=404, detail="User not found")
    return row.data[0]


@router.patch("/me/profile")
async def update_my_profile(payload: UserProfileUpdate, user: UserContext = Depends(get_current_user)):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    supabase_service.table("users").update(
        {
            "full_name": payload.full_name,
            "phone": payload.phone,
        }
    ).eq("id", user.user_id).execute()
    return {"message": "profile updated"}


@router.get("/me/preferences")
async def get_my_preferences(user: UserContext = Depends(get_current_user)):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    pref = supabase_service.table("workspace_preferences").select("theme,language,integrations").eq("user_id", user.user_id).maybe_single().execute()
    return pref.data or {}


@router.patch("/me/preferences")
async def update_my_preferences(payload: WorkspacePreferencesPatch, user: UserContext = Depends(get_current_user)):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    patch: dict[str, object] = {"user_id": user.user_id}
    if payload.theme is not None:
        patch["theme"] = payload.theme
    if payload.language is not None:
        patch["language"] = payload.language
    if payload.integrations is not None:
        patch["integrations"] = payload.integrations

    supabase_service.table("workspace_preferences").upsert(patch, on_conflict="user_id").execute()
    return {"message": "preferences updated"}


@router.get("")
async def list_users(user: UserContext = Depends(require_roles("admin", "checker", "super_admin"))):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    # Single query with JOIN — eliminates the previous N+1 (two separate round-trips).
    rows = supabase_service.table("users").select("id,email,full_name,is_active,created_at,roles(name)").limit(500).execute()
    return [
        {
            "id": r["id"],
            "email": r.get("email"),
            "full_name": r.get("full_name"),
            "is_active": r.get("is_active", True),
            "role": (r.get("roles") or {}).get("name", "") or None,
            "created_at": r.get("created_at"),
        }
        for r in (rows.data or [])
    ]


@router.post("")
async def create_user(payload: UserCreate, user: UserContext = Depends(require_roles("admin"))):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    role = supabase_service.table("roles").select("id,name").eq("name", payload.role_name).limit(1).execute()
    if not role.data:
        raise HTTPException(status_code=400, detail="Invalid role")
    role_row = role.data[0]

    try:
        created = supabase_service.auth.admin.create_user(
            {
                "email": payload.email,
                "password": payload.password,
                "email_confirm": True,
                "user_metadata": {"full_name": payload.full_name},
            }
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="Supabase user creation failed") from exc

    if not created.user:
        raise HTTPException(status_code=500, detail="Supabase returned no user")

    supabase_service.table("users").upsert(
        {
            "id": str(created.user.id),
            "email": payload.email,
            "full_name": payload.full_name,
            "password_hash": "supabase_managed",
            "role_id": role_row["id"],
            "is_active": True,
        },
        on_conflict="id",
    ).execute()

    return {"id": str(created.user.id), "email": payload.email, "role": role_row["name"]}


@router.get("/{user_id}")
async def get_user(user_id: str, actor: UserContext = Depends(get_current_user)):
    if actor.role not in ("super_admin", "admin", "checker") and actor.user_id != user_id:
        raise HTTPException(status_code=403, detail="Insufficient role")

    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    row = supabase_service.table("users").select("id,email,full_name,is_active,role_id,created_at,updated_at").eq("id", user_id).limit(1).execute()
    if not row.data:
        raise HTTPException(status_code=404, detail="User not found")
    role_id = row.data[0].get("role_id")
    if role_id is None:
        raise HTTPException(status_code=500, detail="User role_id is null (data corruption)")
    role_res = supabase_service.table("roles").select("name").eq("id", row.data[0].get("role_id")).limit(1).execute()
    if not role_res.data:
        raise HTTPException(status_code=500, detail="User role mapping is invalid")
    role_name = str(role_res.data[0]["name"]).lower()
    profile = dict(row.data[0])
    profile["role"] = role_name
    profile.pop("role_id", None)
    return profile


@router.patch("/{user_id}")
async def update_user(user_id: str, payload: UserUpdate, user: UserContext = Depends(require_roles("admin"))):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    existing = supabase_service.table("users").select("id,role_id").eq("id", user_id).limit(1).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="User not found")

    role_id = existing.data[0].get("role_id")
    if payload.role_name:
        role = supabase_service.table("roles").select("id").eq("name", payload.role_name).limit(1).execute()
        if not role.data:
            raise HTTPException(status_code=400, detail="Invalid role")
        role_id = role.data[0]["id"]

    update_payload: dict[str, object] = {"role_id": role_id}
    if payload.full_name is not None:
        update_payload["full_name"] = payload.full_name
    if payload.is_active is not None:
        update_payload["is_active"] = payload.is_active

    supabase_service.table("users").update(update_payload).eq("id", user_id).execute()

    return {"message": "user updated"}


@router.delete("/{user_id}")
async def delete_user(user_id: str, user: UserContext = Depends(require_roles("admin"))):
    if user.user_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    deleted = supabase_service.table("users").delete().eq("id", user_id).execute()
    if not deleted.data:
        raise HTTPException(status_code=404, detail="User not found")

    # Keep operation resilient even if Supabase admin deletion fails.
    if supabase_service is not None:
        try:
            supabase_service.auth.admin.delete_user(user_id)
        except Exception as exc:  # noqa: BLE001
            logger.exception("users_delete_auth_cleanup_failed user_id=%s", user_id)
            raise HTTPException(status_code=502, detail="User deleted from profile but auth cleanup failed") from exc

    return {"message": "user deleted"}
