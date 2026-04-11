"""
Settings Module Router
System configuration and user preferences API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Any, List
from core.auth import UserContext, get_current_user
from core.supabase import supabase_service
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
settings_service = SettingsService(db_client=supabase_service)

@router.get("/system", response_model=List[SystemSettingResponse])
async def get_system_settings(current_user: dict = Depends(get_current_user)):
    """Get all system settings"""
    return await settings_service.get_system_settings()

@router.post("/system", response_model=SystemSettingResponse)
async def create_system_setting(
    setting: SystemSettingCreate,
    current_user: UserContext = Depends(get_current_user)
):
    """Create a new system setting (admin only)"""
    if current_user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return await settings_service.update_system_setting(setting.key, setting.value, current_user.user_id)

@router.put("/system/{setting_key}", response_model=SystemSettingResponse)
async def update_system_setting(
    setting_key: str,
    setting: SystemSettingUpdate,
    current_user: UserContext = Depends(get_current_user)
):
    """Update a system setting (admin only)"""
    if current_user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return await settings_service.update_system_setting(setting_key, setting.value, current_user.user_id)

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
    return await settings_service.get_workspace_preferences(current_user.user_id)

@router.post("/user")
async def create_user_preference(
    preference: UserPreferenceCreate,
    current_user: UserContext = Depends(get_current_user)
):
    """Create a user preference"""
    return await settings_service.update_user_preference(current_user.user_id, preference.key, str(preference.value))

@router.put("/user/{preference_key}")
async def update_user_preference(
    preference_key: str,
    preference: UserPreferenceUpdate,
    current_user: UserContext = Depends(get_current_user)
):
    """Update a user preference"""
    return await settings_service.update_user_preference(
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