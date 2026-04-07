import logging

from fastapi import APIRouter, Depends, HTTPException

from core.audit import audit_log
from core.auth import UserContext, get_current_user, require_roles
from core.supabase import supabase_service
from schemas.users import UserCreate, UserProfileUpdate, UserUpdate, WorkspacePreferencesPatch

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/me/profile")
async def get_my_profile(user: UserContext = Depends(get_current_user)):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    row = (
        supabase_service.table("users")
        .select("id,email,full_name,phone,user_code,profile_image_url,updated_at")
        .eq("id", user.user_id)
        .limit(1)
        .execute()
    )
    if not row.data:
        raise HTTPException(status_code=404, detail="User not found")
    return row.data[0]


@router.patch("/me/profile")
async def update_my_profile(payload: UserProfileUpdate, user: UserContext = Depends(get_current_user)):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    patch: dict[str, object] = {}
    if payload.full_name is not None:
        patch["full_name"] = payload.full_name.strip()
    if payload.phone is not None:
        patch["phone"] = payload.phone.strip() if payload.phone else None
    if payload.profile_image_url is not None:
        url = payload.profile_image_url.strip() if payload.profile_image_url else None
        if url and not url.startswith("https://res.cloudinary.com/"):
            raise HTTPException(status_code=400, detail="profile_image_url must be a Cloudinary URL")
        patch["profile_image_url"] = url

    if payload.user_code is not None:
        normalized_code = payload.user_code.strip().lower() if payload.user_code else None
        if normalized_code:
            code_row = (
                supabase_service.table("users")
                .select("id")
                .eq("user_code", normalized_code)
                .neq("id", user.user_id)
                .limit(1)
                .execute()
            )
            if code_row.data:
                raise HTTPException(status_code=409, detail="User ID already in use")
        patch["user_code"] = normalized_code

    if not patch:
        return {"message": "no changes provided"}

    supabase_service.table("users").update(patch).eq("id", user.user_id).execute()
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
async def list_users(
    user: UserContext = Depends(require_roles("admin", "super_admin")),
    limit: int = 50,
    offset: int = 0,
):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    if limit <= 0 or limit > 200:
        limit = 50
    if offset < 0:
        offset = 0
    rows = (
        supabase_service.table("users")
        .select("id,email,full_name,is_active,created_at,roles(name)")
        .order("created_at", desc=True)
        .limit(limit + 1)
        .offset(offset)
        .execute()
    )
    data = rows.data or []
    has_more = len(data) > limit
    return {
        "users": [
            {
                "id": r["id"],
                "email": r.get("email"),
                "full_name": r.get("full_name"),
                "is_active": r.get("is_active", True),
                "role": (r.get("roles") or {}).get("name", "") or None,
                "created_at": r.get("created_at"),
            }
            for r in data[:limit]
        ],
        "has_more": has_more,
        "next_offset": offset + limit if has_more else None,
    }


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

    new_id = str(created.user.id)
    audit_log(user_id=user.user_id, action="user.create", entity_type="user", entity_id=new_id,
              meta={"email": payload.email, "role": role_row["name"]})
    return {"id": new_id, "email": payload.email, "role": role_row["name"]}


@router.get("/{user_id}")
async def get_user(user_id: str, actor: UserContext = Depends(get_current_user)):
    if actor.role not in ("super_admin", "admin", "checker") and actor.user_id != user_id:
        raise HTTPException(status_code=403, detail="Insufficient role")

    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    row = (
        supabase_service.table("users")
        .select("id,email,full_name,phone,user_code,profile_image_url,is_active,created_at,updated_at,roles(name)")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    if not row.data:
        raise HTTPException(status_code=404, detail="User not found")
    profile = dict(row.data[0])
    role_obj = profile.pop("roles", None)
    role_name = (role_obj or {}).get("name") if isinstance(role_obj, dict) else None
    if not role_name:
        raise HTTPException(status_code=500, detail="User role mapping is invalid")
    profile["role"] = str(role_name).lower()
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
    audit_log(user_id=user.user_id, action="user.update", entity_type="user", entity_id=user_id,
              meta={k: str(v) for k, v in update_payload.items()})
    return {"message": "user updated"}


@router.delete("/{user_id}")
async def delete_user(user_id: str, user: UserContext = Depends(require_roles("admin"))):
    if user.user_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    # Verify user exists before any deletion
    existing = supabase_service.table("users").select("id").eq("id", user_id).limit(1).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="User not found")

    # Delete auth account FIRST — if this fails, the profile is still intact (no orphan)
    try:
        supabase_service.auth.admin.delete_user(user_id)
    except Exception as exc:  # noqa: BLE001
        logger.exception("users_delete_auth_failed user_id=%s", user_id)
        raise HTTPException(status_code=502, detail="Auth account deletion failed; profile preserved") from exc

    # Auth deleted — now remove the profile row
    supabase_service.table("users").delete().eq("id", user_id).execute()
    audit_log(user_id=user.user_id, action="user.delete", entity_type="user", entity_id=user_id)
    return {"message": "user deleted"}
