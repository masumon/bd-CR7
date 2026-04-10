"""
Dynamic Module Router
Custom fields and workflow configurations API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List
from core.auth import get_current_user
from core.supabase import supabase_service
from .service import DynamicService
from .schema import (
    CustomFieldCreate,
    CustomFieldUpdate,
    CustomFieldResponse,
    WorkflowConfigCreate,
    WorkflowConfigUpdate,
    WorkflowConfigResponse,
    FieldType
)

router = APIRouter()
dynamic_service = DynamicService(db_client=supabase_service)

@router.get("/fields", response_model=List[CustomFieldResponse])
async def get_custom_fields(
    entity_type: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Get custom fields, optionally filtered by entity type"""
    return await dynamic_service.get_custom_fields(entity_type)

@router.post("/fields", response_model=CustomFieldResponse)
async def create_custom_field(
    field: CustomFieldCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new custom field (admin only)"""
    if current_user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return await dynamic_service.create_custom_field(field)

@router.put("/fields/{field_id}", response_model=CustomFieldResponse)
async def update_custom_field(
    field_id: str,
    field: CustomFieldUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a custom field (admin only)"""
    if current_user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return await dynamic_service.update_custom_field(field_id, field)

@router.delete("/fields/{field_id}")
async def delete_custom_field(
    field_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a custom field (admin only)"""
    if current_user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    await dynamic_service.delete_custom_field(field_id)
    return {"message": "Custom field deleted successfully"}

@router.get("/workflows", response_model=List[WorkflowConfigResponse])
async def get_workflow_configs(
    workflow_type: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Get workflow configurations, optionally filtered by type"""
    return await dynamic_service.get_workflow_configs(workflow_type)

@router.post("/workflows", response_model=WorkflowConfigResponse)
async def create_workflow_config(
    config: WorkflowConfigCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new workflow configuration (admin only)"""
    if current_user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return await dynamic_service.create_workflow_config(config)

@router.put("/workflows/{config_id}", response_model=WorkflowConfigResponse)
async def update_workflow_config(
    config_id: str,
    config: WorkflowConfigUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a workflow configuration (admin only)"""
    if current_user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return await dynamic_service.update_workflow_config(config_id, config)

@router.delete("/workflows/{config_id}")
async def delete_workflow_config(
    config_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a workflow configuration (admin only)"""
    if current_user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    await dynamic_service.delete_workflow_config(config_id)
    return {"message": "Workflow configuration deleted successfully"}

@router.get("/field-types", response_model=List[str])
async def get_field_types():
    """Get list of available field types"""
    return [field_type.value for field_type in FieldType]