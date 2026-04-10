"""
Dynamic Schemas - Request/Response Models for API
Implements data validation for dynamic configurations and content
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum


class ConfigType(str, Enum):
    """Dynamic configuration types"""
    WORKFLOW = "workflow"
    FORM = "form"
    DASHBOARD = "dashboard"
    REPORT = "report"
    NOTIFICATION = "notification"
    INTEGRATION = "integration"


class FieldType(str, Enum):
    """Custom field types"""
    TEXT = "text"
    NUMBER = "number"
    DATE = "date"
    BOOLEAN = "boolean"
    SELECT = "select"
    MULTI_SELECT = "multi_select"
    FILE = "file"


class EntityType(str, Enum):
    """Entity types that can have custom fields"""
    PROJECT = "project"
    WORKER = "worker"
    MATERIAL = "material"
    CONTRACTOR = "contractor"
    TRANSACTION = "transaction"


class DynamicConfig(BaseModel):
    """Dynamic configuration structure"""
    type: ConfigType
    name: str
    description: Optional[str] = None
    config: Dict
    version: int = 1
    is_active: bool = True
    created_by: str
    created_at: datetime
    updated_at: Optional[datetime] = None


class CustomField(BaseModel):
    """Custom field definition"""
    id: str
    entity_type: EntityType
    name: str
    label: str
    type: FieldType
    required: bool = False
    options: Optional[List[str]] = None
    validation_rules: Optional[Dict] = None
    order: int = 0
    is_active: bool = True


class WorkflowStep(BaseModel):
    """Workflow step definition"""
    id: str
    name: str
    type: str  # "approval", "notification", "task", etc.
    config: Dict
    order: int
    required_roles: List[str] = []


class WorkflowTemplate(BaseModel):
    """Workflow template"""
    id: str
    name: str
    description: str
    steps: List[WorkflowStep]
    applicable_entities: List[EntityType]
    is_default: bool = False
    created_by: str
    created_at: datetime


class UpdateConfigRequest(BaseModel):
    """Request to update dynamic config"""
    config_type: ConfigType
    config_data: Dict
    version_comment: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "config_type": "workflow",
                "config_data": {
                    "name": "Custom Approval Flow",
                    "steps": [
                        {"name": "Manager Review", "type": "approval"},
                        {"name": "Final Approval", "type": "approval"}
                    ]
                },
                "version_comment": "Added final approval step"
            }
        }


class AddCustomFieldRequest(BaseModel):
    """Request to add custom field"""
    entity_type: EntityType
    field_name: str = Field(..., min_length=1, max_length=50)
    field_label: str = Field(..., min_length=1, max_length=100)
    field_type: FieldType
    required: bool = False
    options: Optional[List[str]] = None
    validation_rules: Optional[Dict] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "entity_type": "project",
                "field_name": "priority_level",
                "field_label": "Priority Level",
                "field_type": "select",
                "required": False,
                "options": ["Low", "Medium", "High", "Critical"]
            }
        }


class CreateWorkflowRequest(BaseModel):
    """Request to create custom workflow"""
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=500)
    steps: List[Dict] = Field(..., min_items=1)
    applicable_entities: List[EntityType] = Field(..., min_items=1)
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Custom Project Approval",
                "description": "Multi-step approval for large projects",
                "steps": [
                    {
                        "name": "Initial Review",
                        "type": "approval",
                        "config": {"approver_role": "manager"}
                    },
                    {
                        "name": "Final Approval",
                        "type": "approval",
                        "config": {"approver_role": "director"}
                    }
                ],
                "applicable_entities": ["project"]
            }
        }


class DynamicConfigResponse(BaseModel):
    """Response containing dynamic config"""
    configs: List[DynamicConfig]
    total_count: int


class CustomFieldsResponse(BaseModel):
    """Response containing custom fields"""
    fields: List[CustomField]
    entity_type: EntityType


# Aliases for router compatibility
CustomFieldCreate = AddCustomFieldRequest
CustomFieldUpdate = AddCustomFieldRequest
CustomFieldResponse = CustomField
WorkflowConfigCreate = CreateWorkflowRequest
WorkflowConfigUpdate = UpdateConfigRequest
WorkflowConfigResponse = WorkflowTemplate
