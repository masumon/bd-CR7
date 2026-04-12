from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.supabase import get_supabase_anon, get_supabase_service, require_supabase_service

bearer = HTTPBearer(auto_error=False)


class UserContext(dict):
    @property
    def user_id(self) -> str:
        return self["user_id"]

    @property
    def role(self) -> str:
        return self["role"]


def _normalize_role_name(raw: str | None) -> str | None:
    if not isinstance(raw, str):
        return None
    role = raw.strip().lower()
    return role or None


def _extract_role_name(user_row: dict) -> str:
    direct_role = user_row.get("role")
    if isinstance(direct_role, str) and direct_role.strip():
        return direct_role.strip().lower()

    role_obj = user_row.get("roles")
    if isinstance(role_obj, dict):
        role_name = role_obj.get("name")
        if isinstance(role_name, str) and role_name.strip():
            return role_name.strip().lower()
    return "viewer"


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> UserContext:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    if get_supabase_anon() is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Supabase is not configured")

    try:
        auth_user = get_supabase_anon().auth.get_user(credentials.credentials)
        supabase_user = auth_user.user if auth_user and auth_user.user else None
        supabase_user_id = supabase_user.id if supabase_user else None
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid bearer token") from exc

    if not supabase_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid bearer token")

    svc = require_supabase_service()

    user_res = (
        svc.table("users")
        .select("id,is_active,role")
        .eq("id", str(supabase_user_id))
        .limit(1)
        .execute()
    )
    if not user_res.data:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User profile not found or inactive")
    user_row = user_res.data[0]
    if not user_row.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User profile not found or inactive")

    db_role_name = _extract_role_name(user_row)
    app_metadata = getattr(supabase_user, "app_metadata", {}) or {}
    claim_role_name = _normalize_role_name(app_metadata.get("role") if isinstance(app_metadata, dict) else None)
    if claim_role_name and claim_role_name != db_role_name:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Role claim mismatch; please re-authenticate")

    role_name = claim_role_name or db_role_name

    return UserContext({"user_id": str(user_row["id"]), "role": str(role_name)})


def require_roles(*roles: str):
    def checker(user: UserContext = Depends(get_current_user)) -> UserContext:
        if user.role == "super_admin":
            return user
        if user.role not in {role.lower() for role in roles}:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return user

    return checker
