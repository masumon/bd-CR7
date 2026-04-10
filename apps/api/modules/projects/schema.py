"""
Projects Schemas - Request/Response Models for API
Implements data validation for projects, timelines, and resources
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ProjectStatus(str, Enum):
    """Project lifecycle status"""
    PLANNING = "planning"
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ProjectPhase(str, Enum):
    """Project timeline phases"""
    INITIATION = "initiation"
    PLANNING = "planning"
    EXECUTION = "execution"
    MONITORING = "monitoring"
    CLOSING = "closing"


class CreateProjectRequest(BaseModel):
    """Request to create a new project"""
    name: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=1000)
    start_date: datetime
    end_date: datetime
    budget: float = Field(..., gt=0)
    manager_id: str
    client_id: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "BD Tower Construction",
                "description": "High-rise building construction project",
                "start_date": "2024-01-15T00:00:00Z",
                "end_date": "2025-06-30T00:00:00Z",
                "budget": 5000000.00,
                "manager_id": "user_123",
                "client_id": "client_456"
            }
        }


class ProjectResponse(BaseModel):
    """Response containing project details"""
    id: str
    name: str
    description: str
    status: ProjectStatus
    start_date: datetime
    end_date: datetime
    budget: float
    manager_id: str
    client_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class UpdateTimelineRequest(BaseModel):
    """Request to update project timeline"""
    phase: ProjectPhase
    start_date: datetime
    end_date: datetime
    progress_percentage: int = Field(..., ge=0, le=100)
    
    class Config:
        json_schema_extra = {
            "example": {
                "phase": "execution",
                "start_date": "2024-03-01T00:00:00Z",
                "end_date": "2024-08-31T00:00:00Z",
                "progress_percentage": 45
            }
        }


class ResourceAllocation(BaseModel):
    """Material allocation for project"""
    material_id: str
    quantity: float = Field(..., gt=0)
    allocated_date: datetime


class AssignResourcesRequest(BaseModel):
    """Request to assign resources to project"""
    worker_ids: List[str]
    material_allocations: List[ResourceAllocation]
    
    class Config:
        json_schema_extra = {
            "example": {
                "worker_ids": ["worker_001", "worker_002"],
                "material_allocations": [
                    {
                        "material_id": "mat_001",
                        "quantity": 100.0,
                        "allocated_date": "2024-03-01T00:00:00Z"
                    }
                ]
            }
        }


class ProjectStatusResponse(BaseModel):
    """Comprehensive project status"""
    project: ProjectResponse
    timeline: List[Dict]  # Timeline phases with progress
    resources: Dict  # Workers and materials assigned
    budget_used: float
    overall_progress: int
