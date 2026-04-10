"""
Settings Schemas - Request/Response Models for API
Implements data validation for settings and preferences
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum


class SettingCategory(str, Enum):
    """Setting categories"""
    SYSTEM = "system"
    SECURITY = "security"
    NOTIFICATIONS = "notifications"
    INTEGRATIONS = "integrations"
    WORKFLOW = "workflow"


class Theme(str, Enum):
    """UI theme options"""
    LIGHT = "light"
    DARK = "dark"
    AUTO = "auto"


class Language(str, Enum):
    """Supported languages"""
    EN = "en"
    BN = "bn"
    ES = "es"
    FR = "fr"


class SystemSettings(BaseModel):
    """System-wide settings"""
    company_name: str
    timezone: str
    currency: str = "USD"
    date_format: str = "YYYY-MM-DD"
    working_hours_start: str = "09:00"
    working_hours_end: str = "17:00"
    auto_backup_enabled: bool = True
    backup_frequency: str = "daily"


class UserPreferences(BaseModel):
    """User-specific preferences"""
    theme: Theme = Theme.LIGHT
    language: Language = Language.EN
    items_per_page: int = Field(25, ge=10, le=100)
    dashboard_layout: str = "default"
    email_notifications: bool = True
    sms_notifications: bool = False


class NotificationSettings(BaseModel):
    """Notification preferences"""
    project_updates: bool = True
    payment_reminders: bool = True
    approval_requests: bool = True
    system_alerts: bool = True
    weekly_reports: bool = False
    email_digest: bool = True


class UpdateSettingRequest(BaseModel):
    """Request to update a setting"""
    key: str = Field(..., min_length=1, max_length=100)
    value: str = Field(..., min_length=1, max_length=500)
    category: Optional[SettingCategory] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "key": "company_name",
                "value": "BD CR7 Construction",
                "category": "system"
            }
        }


class UpdatePreferenceRequest(BaseModel):
    """Request to update user preference"""
    key: str = Field(..., min_length=1, max_length=100)
    value: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "key": "theme",
                "value": "dark"
            }
        }


class SettingsResponse(BaseModel):
    """Response containing settings"""
    system_settings: SystemSettings
    workspace_preferences: UserPreferences
    notification_settings: NotificationSettings
    last_updated: Optional[datetime] = None


class ResetSettingsRequest(BaseModel):
    """Request to reset settings"""
    scope: str = Field(..., pattern="^(user|system)$")
    confirm_reset: bool = True
    
    class Config:
        json_schema_extra = {
            "example": {
                "scope": "user",
                "confirm_reset": True
            }
        }


class SettingAuditLog(BaseModel):
    """Audit log for setting changes"""
    id: str
    setting_key: str
    old_value: Optional[str] = None
    new_value: str
    changed_by: str
    changed_at: datetime
    category: SettingCategory


# Aliases for router compatibility
SystemSettingCreate = UpdateSettingRequest
SystemSettingUpdate = UpdateSettingRequest
SystemSettingResponse = SystemSettings
UserPreferenceCreate = UpdatePreferenceRequest
UserPreferenceUpdate = UpdatePreferenceRequest
UserPreferenceResponse = UserPreferences
