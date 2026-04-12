"""
Dynamic Service - Business Logic Layer
Manages custom_fields and workflow_configs backed by Supabase.
The router calls all public methods below; method signatures match exactly.
"""
from __future__ import annotations

from typing import Any, List, Optional
from uuid import uuid4

from fastapi import HTTPException


class DynamicService:
    def __init__(self, db_client: Any) -> None:
        self.db = db_client

    def _require_db(self) -> Any:
        if self.db is None:
            raise HTTPException(status_code=503, detail="Database client is not configured")
        return self.db

    # ── Custom Fields ──────────────────────────────────────────────────────────

    async def get_custom_fields(self, entity_type: Optional[str] = None) -> List[dict[str, Any]]:
        """Return active custom fields, optionally filtered by entity_type."""
        db = self._require_db()
        q = (
            db.table("custom_fields")
            .select("id,entity_type,name,label,type,required,options,validation_rules,order_index,is_active,created_at")
            .eq("is_active", True)
            .order("order_index")
        )
        if entity_type:
            q = q.eq("entity_type", entity_type)
        try:
            result = q.execute()
            return result.data or []
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=502, detail="Failed to fetch custom fields") from exc

    async def create_custom_field(self, field: Any) -> dict[str, Any]:
        """Insert a new custom field definition."""
        db = self._require_db()
        field_id = str(uuid4())
        row: dict[str, Any] = {
            "id": field_id,
            "entity_type": field.entity_type.value if hasattr(field.entity_type, "value") else str(field.entity_type),
            "name": field.field_name,
            "label": field.field_label,
            "type": field.field_type.value if hasattr(field.field_type, "value") else str(field.field_type),
            "required": field.required,
            "options": field.options,
            "validation_rules": field.validation_rules,
            "order_index": 0,
            "is_active": True,
        }
        try:
            result = db.table("custom_fields").insert(row).execute()
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=502, detail="Failed to create custom field") from exc
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create custom field")
        return result.data[0]

    async def update_custom_field(self, field_id: str, field: Any) -> dict[str, Any]:
        """Update an existing custom field."""
        db = self._require_db()
        update: dict[str, Any] = {
            "entity_type": field.entity_type.value if hasattr(field.entity_type, "value") else str(field.entity_type),
            "name": field.field_name,
            "label": field.field_label,
            "type": field.field_type.value if hasattr(field.field_type, "value") else str(field.field_type),
            "required": field.required,
            "options": field.options,
            "validation_rules": field.validation_rules,
        }
        try:
            result = db.table("custom_fields").update(update).eq("id", field_id).execute()
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=502, detail="Failed to update custom field") from exc
        if not result.data:
            raise HTTPException(status_code=404, detail="Custom field not found")
        return result.data[0]

    async def delete_custom_field(self, field_id: str) -> None:
        """Soft-delete a custom field by marking it inactive."""
        db = self._require_db()
        try:
            db.table("custom_fields").update({"is_active": False}).eq("id", field_id).execute()
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=502, detail="Failed to delete custom field") from exc

    # ── Workflow Configurations ────────────────────────────────────────────────

    async def get_workflow_configs(self, workflow_type: Optional[str] = None) -> List[dict[str, Any]]:
        """Return active workflow configs, optionally filtered by type."""
        db = self._require_db()
        q = (
            db.table("workflow_configs")
            .select("id,name,description,workflow_type,steps,applicable_entities,is_active,created_at")
            .eq("is_active", True)
            .order("created_at", desc=True)
        )
        if workflow_type:
            q = q.eq("workflow_type", workflow_type)
        try:
            result = q.execute()
            return result.data or []
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=502, detail="Failed to fetch workflow configurations") from exc

    async def create_workflow_config(self, config: Any) -> dict[str, Any]:
        """Insert a new workflow configuration."""
        db = self._require_db()
        config_id = str(uuid4())
        applicable = [
            e.value if hasattr(e, "value") else str(e)
            for e in config.applicable_entities
        ]
        row: dict[str, Any] = {
            "id": config_id,
            "name": config.name,
            "description": config.description,
            "workflow_type": "custom",
            "steps": config.steps,
            "applicable_entities": applicable,
            "is_active": True,
        }
        try:
            result = db.table("workflow_configs").insert(row).execute()
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=502, detail="Failed to create workflow configuration") from exc
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create workflow configuration")
        return result.data[0]

    async def update_workflow_config(self, config_id: str, config: Any) -> dict[str, Any]:
        """Update an existing workflow configuration."""
        db = self._require_db()
        update: dict[str, Any] = {}
        if hasattr(config, "config_data") and isinstance(config.config_data, dict):
            if "steps" in config.config_data:
                update["steps"] = config.config_data["steps"]
            if "name" in config.config_data:
                update["name"] = config.config_data["name"]
        if hasattr(config, "config_type") and config.config_type:
            update["workflow_type"] = (
                config.config_type.value if hasattr(config.config_type, "value") else str(config.config_type)
            )
        if not update:
            raise HTTPException(status_code=400, detail="No update fields provided")
        try:
            result = db.table("workflow_configs").update(update).eq("id", config_id).execute()
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=502, detail="Failed to update workflow configuration") from exc
        if not result.data:
            raise HTTPException(status_code=404, detail="Workflow configuration not found")
        return result.data[0]

    async def delete_workflow_config(self, config_id: str) -> None:
        """Soft-delete a workflow configuration."""
        db = self._require_db()
        try:
            db.table("workflow_configs").update({"is_active": False}).eq("id", config_id).execute()
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=502, detail="Failed to delete workflow configuration") from exc


def get_dynamic_service(db_client: Any) -> DynamicService:
    return DynamicService(db_client)
