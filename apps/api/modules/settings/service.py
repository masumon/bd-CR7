"""
Settings Service - Business Logic Layer
Reads/writes system_settings and workspace_preferences via Supabase service client.
"""
from __future__ import annotations

from typing import Any

from fastapi import HTTPException

_ALLOWED_PREFERENCE_KEYS = {"theme", "language", "notifications_enabled", "offline_mode_enabled"}


class SettingsService:
    def __init__(self, db_client: Any) -> None:
        self.db = db_client

    def _require_db(self) -> Any:
        if self.db is None:
            raise HTTPException(status_code=503, detail="Database client is not configured")
        return self.db

    # ── System settings (admin-only, stored in system_settings table) ──────────

    async def get_system_settings(self) -> list[dict[str, Any]]:
        """Return all system settings; sensitive values are masked."""
        db = self._require_db()
        try:
            result = (
                db.table("system_settings")
                .select("id,setting_key,setting_value,description,is_sensitive,updated_at")
                .order("setting_key")
                .execute()
            )
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=502, detail="Failed to fetch system settings") from exc

        rows: list[dict[str, Any]] = result.data or []
        return [
            {
                **row,
                "setting_value": "***" if row.get("is_sensitive") else row.get("setting_value"),
            }
            for row in rows
        ]

    async def update_system_setting(self, key: str, value: str, updated_by: str) -> dict[str, Any]:
        """Upsert a system setting by key."""
        db = self._require_db()
        try:
            result = (
                db.table("system_settings")
                .upsert(
                    {"setting_key": key, "setting_value": value, "updated_by": updated_by},
                    on_conflict="setting_key",
                )
                .execute()
            )
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=502, detail="Failed to update system setting") from exc
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to update system setting")
        row = result.data[0]
        if row.get("is_sensitive"):
            row = {**row, "setting_value": "***"}
        return row

    # ── Workspace preferences (per-user, stored in workspace_preferences) ──────

    async def get_workspace_preferences(self, user_id: str) -> dict[str, Any]:
        """Return this user's workspace preferences, or sensible defaults."""
        db = self._require_db()
        try:
            result = (
                db.table("workspace_preferences")
                .select("theme,language,notifications_enabled,offline_mode_enabled,updated_at")
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=502, detail="Failed to fetch workspace preferences") from exc

        if result.data:
            return result.data[0]
        return {
            "theme": "dark",
            "language": "en",
            "notifications_enabled": True,
            "offline_mode_enabled": False,
        }

    async def update_user_preference(self, user_id: str, key: str, value: str) -> dict[str, Any]:
        """Update a single workspace preference key for this user."""
        db = self._require_db()
        if key not in _ALLOWED_PREFERENCE_KEYS:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown preference key '{key}'. Allowed: {sorted(_ALLOWED_PREFERENCE_KEYS)}",
            )
        typed_value: Any = value
        if key in {"notifications_enabled", "offline_mode_enabled"}:
            typed_value = str(value).lower() in {"true", "1", "yes"}

        try:
            result = (
                db.table("workspace_preferences")
                .upsert({"user_id": user_id, key: typed_value}, on_conflict="user_id")
                .execute()
            )
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=502, detail="Failed to update workspace preference") from exc
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to update workspace preference")
        return result.data[0]


def get_settings_service(db_client: Any) -> SettingsService:
    return SettingsService(db_client)
