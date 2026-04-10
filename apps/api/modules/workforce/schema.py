"""
Workforce Schemas - Request/Response Models for API
Implements data validation for workers, attendance, and payroll
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime, date
from decimal import Decimal
from enum import Enum


class WorkerStatus(str, Enum):
    """Worker employment status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    TERMINATED = "terminated"
    ON_LEAVE = "on_leave"


class WorkerRole(str, Enum):
    """Worker job roles"""
    LABORER = "laborer"
    MASON = "mason"
    ELECTRICIAN = "electrician"
    PLUMBER = "plumber"
    CARPENTER = "carpenter"
    SUPERVISOR = "supervisor"
    ENGINEER = "engineer"
    MANAGER = "manager"


class ContactInfo(BaseModel):
    """Worker contact information"""
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[Dict] = None


class AddWorkerRequest(BaseModel):
    """Request to add a new worker"""
    name: str = Field(..., min_length=1, max_length=200)
    role: WorkerRole
    hourly_rate: Decimal = Field(..., gt=0, decimal_places=2)
    skills: List[str] = Field(default_factory=list)
    contact_info: ContactInfo
    join_date: date
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "John Smith",
                "role": "mason",
                "hourly_rate": 25.00,
                "skills": ["bricklaying", "concrete work"],
                "contact_info": {
                    "phone": "+1234567890",
                    "email": "john@example.com",
                    "address": "123 Main St"
                },
                "join_date": "2024-01-15"
            }
        }


class WorkerResponse(BaseModel):
    """Response containing worker details"""
    id: str
    name: str
    role: WorkerRole
    hourly_rate: Decimal
    skills: List[str]
    contact_info: ContactInfo
    join_date: date
    status: WorkerStatus
    created_at: datetime
    updated_at: Optional[datetime] = None


class RecordAttendanceRequest(BaseModel):
    """Request to record worker attendance"""
    worker_id: str
    date: date
    hours_worked: float = Field(..., ge=0, le=24)
    project_id: Optional[str] = None
    notes: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "worker_id": "worker_001",
                "date": "2024-03-15",
                "hours_worked": 8.0,
                "project_id": "proj_123",
                "notes": "Worked on foundation"
            }
        }


class PayrollCalculationResponse(BaseModel):
    """Payroll calculation result"""
    worker_id: str
    period_start: date
    period_end: date
    total_hours: float
    regular_hours: float
    overtime_hours: float
    gross_pay: Decimal
    deductions: Decimal
    net_pay: Decimal
    breakdown: Dict  # Detailed calculation breakdown


class AssignWorkerRequest(BaseModel):
    """Request to assign worker to project"""
    worker_id: str
    project_id: str
    start_date: date
    end_date: Optional[date] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "worker_id": "worker_001",
                "project_id": "proj_123",
                "start_date": "2024-03-01",
                "end_date": "2024-06-30"
            }
        }


class WorkerPerformanceResponse(BaseModel):
    """Worker performance metrics"""
    worker_id: str
    attendance_rate: float  # Percentage
    average_hours_per_day: float
    efficiency_rating: float  # Percentage
    projects_completed: int
    skills_utilization: Dict  # Skills used vs available
    period: Dict  # Date range for metrics
