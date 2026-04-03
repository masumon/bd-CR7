from fastapi import APIRouter, Depends, HTTPException

from core.auth import UserContext, get_current_user
from core.supabase import supabase_anon, supabase_service
from core.exceptions import AuthError, RoleNotFoundError, MetadataError
from schemas.auth import AuthResponse, LoginRequest, RegisterRequest

router = APIRouter()

SELF_SERVICE_ROLE = "viewer"


def _extract_joined_role_name(user_row: dict) -> str:
    role_obj = user_row.get("roles")
    if isinstance(role_obj, dict):
        role_name = role_obj.get("name")
        if isinstance(role_name, str) and role_name.strip():
            return role_name.strip().lower()
    raise HTTPException(status_code=500, detail="User role mapping is invalid")


@router.post("/register", response_model=AuthResponse)
async def register(payload: RegisterRequest):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    existing = supabase_service.table("users").select("id").eq("email", payload.email).limit(1).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="Email already exists")

    role = supabase_service.table("roles").select("id,name").eq("name", SELF_SERVICE_ROLE).limit(1).execute()
    if not role.data:
        raise HTTPException(status_code=500, detail="Required roles are missing")
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
    except AuthError as exc:
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(exc)}") from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="Supabase registration failed") from exc

    user_obj = getattr(created, "user", None)
    if not user_obj or not user_obj.id:
        raise HTTPException(status_code=500, detail="Supabase user creation returned no user id")

    user_id = str(user_obj.id)

    supabase_service.table("users").upsert(
        {
            "id": user_id,
            "email": payload.email,
            "full_name": payload.full_name,
            "password_hash": "supabase_managed",
            "role_id": role_row["id"],
            "is_active": True,
        },
        on_conflict="id",
    ).execute()

    if supabase_anon is None:
        raise HTTPException(status_code=500, detail="Supabase client is not configured")

    login_result = supabase_anon.auth.sign_in_with_password({"email": payload.email, "password": payload.password})
    if not login_result.session:
        raise HTTPException(status_code=500, detail="Registration succeeded but session creation failed")

    return AuthResponse(access_token=login_result.session.access_token, user_id=user_id, role=role_row["name"])


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest):
    if supabase_anon is None:
        raise HTTPException(status_code=500, detail="Supabase client is not configured")
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    try:
        auth_result = supabase_anon.auth.sign_in_with_password({"email": payload.email, "password": payload.password})
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=401, detail="Invalid credentials") from exc

    if not auth_result.user or not auth_result.session:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    local_user = (
        supabase_service.table("users")
        .select("id,is_active,roles(name)")
        .eq("id", str(auth_result.user.id))
        .limit(1)
        .execute()
    )

    if not local_user.data:
        viewer = supabase_service.table("roles").select("id,name").eq("name", "viewer").limit(1).execute()
        if not viewer.data:
            raise HTTPException(status_code=500, detail="Viewer role is missing")
        viewer_role = viewer.data[0]
        supabase_service.table("users").upsert(
            {
                "id": str(auth_result.user.id),
                "email": payload.email,
                "full_name": auth_result.user.user_metadata.get("full_name") if auth_result.user.user_metadata else payload.email,
                "password_hash": "supabase_managed",
                "role_id": viewer_role["id"],
                "is_active": True,
            },
            on_conflict="id",
        ).execute()
        role_name = viewer_role["name"]
    else:
        role_name = _extract_joined_role_name(local_user.data[0])

    return AuthResponse(
        access_token=auth_result.session.access_token,
        user_id=str(auth_result.user.id),
        role=str(role_name),
    )


@router.post("/logout")
async def logout(user: UserContext = Depends(get_current_user)):
    return {"message": f"Logged out {user.user_id}"}


@router.get("/me")
async def me(user: UserContext = Depends(get_current_user)):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    profile = (
        supabase_service.table("users")
        .select("id,email,full_name,roles(name)")
        .eq("id", user.user_id)
        .limit(1)
        .execute()
    )
    if not profile.data:
        raise HTTPException(status_code=404, detail="User not found")
    profile_row = profile.data[0]
    role_name = _extract_joined_role_name(profile_row)
    return {
        "id": profile_row["id"],
        "email": profile_row.get("email"),
        "full_name": profile_row.get("full_name"),
        "role": role_name,
    }
