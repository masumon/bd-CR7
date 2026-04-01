from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.supabase import supabase_anon, supabase_service

bearer = HTTPBearer(auto_error=False)


class UserContext(dict):
    @property
    def user_id(self) -> str:
        return self["user_id"]

    @property
    def role(self) -> str:
        return self["role"]


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> UserContext:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    if supabase_anon is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Supabase is not configured")

    try:
        auth_user = supabase_anon.auth.get_user(credentials.credentials)
        supabase_user_id = auth_user.user.id if auth_user and auth_user.user else None
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid bearer token") from exc

    if not supabase_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid bearer token")

    if supabase_service is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Supabase service client is not configured")

    user_res = (
        supabase_service.table("users")
        .select("id, role_id, is_active")
        .eq("id", supabase_user_id)
        .limit(1)
        .execute()
    )
    if not user_res.data:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User profile not found or inactive")
    user_row = user_res.data[0]
    if not user_row.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User profile not found or inactive")

    role_res = (
        supabase_service.table("roles")
        .select("name")
        .eq("id", user_row.get("role_id"))
        .limit(1)
        .execute()
    )
    role_name = role_res.data[0]["name"] if role_res.data else "viewer"

    return UserContext({"user_id": str(user_row["id"]), "role": str(role_name)})


def require_roles(*roles: str):
    def checker(user: UserContext = Depends(get_current_user)) -> UserContext:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return user

    return checker
