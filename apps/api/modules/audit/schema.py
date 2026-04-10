"""
Audit Schemas - Request/Response Models for API
Implements data validation for audit logs and compliance
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum


class AuditAction(str, Enum):
    """Audit action types"""
    CREATE = "CREATE"
    READ = "READ"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    EXPORT = "EXPORT"
    APPROVE = "APPROVE"
    REJECT = "REJECT"
    UPLOAD = "UPLOAD"
    DOWNLOAD = "DOWNLOAD"


class ResourceType(str, Enum):
    """Types of resources that can be audited"""
    USER = "user"
    PROJECT = "project"
    TRANSACTION = "transaction"
    MATERIAL = "material"
    WORKER = "worker"
    CONTRACTOR = "contractor"
    EVIDENCE = "evidence"
    REPORT = "report"
    SYSTEM = "system"


class AuditLogEntry(BaseModel):
    """Audit log entry"""
    id: str
    user_id: str
    action: AuditAction
    resource_type: ResourceType
    resource_id: str
    details: Dict
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: datetime


class AuditTrailRequest(BaseModel):
    """Request to retrieve audit trail"""
    resource_type: Optional[ResourceType] = None
    resource_id: Optional[str] = None
    user_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    limit: int = Field(100, ge=1, le=1000)
    
    class Config:
        json_schema_extra = {
            "example": {
                "resource_type": "project",
                "resource_id": "proj_123",
                "start_date": "2024-01-01T00:00:00Z",
                "end_date": "2024-03-31T23:59:59Z",
                "limit": 50
            }
        }


class AuditTrailResponse(BaseModel):
    """Response containing audit trail"""
    entries: List[AuditLogEntry]
    total_count: int
    has_more: bool
    filters_applied: Dict


class AnomalyAlert(BaseModel):
    """Detected anomaly in audit logs"""
    id: str
    type: str
    severity: str
    description: str
    affected_resources: List[Dict]
    detected_at: datetime
    recommended_actions: List[str]


class AuditReportRequest(BaseModel):
    """Request to generate audit report"""
    start_date: datetime
    end_date: datetime
    report_type: str = Field(..., min_length=1, max_length=50)
    filters: Optional[Dict] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "start_date": "2024-01-01T00:00:00Z",
                "end_date": "2024-03-31T23:59:59Z",
                "report_type": "user_activity",
                "filters": {"user_role": "admin"}
            }
        }


class AuditReportResponse(BaseModel):
    """Generated audit report"""
    report_id: str
    report_type: str
    generated_at: datetime
    summary: Dict
    details: Dict
    export_url: Optional[str] = None


class IntegrityCheckResult(BaseModel):
    """Data integrity check result"""
    check_type: str
    status: str  # "PASSED", "FAILED", "WARNING"
    details: str
    checked_at: datetime
    affected_records: Optional[int] = None
    recommended_action: Optional[str] = None


class SystemIntegrityResponse(BaseModel):
    """Overall system integrity status"""
    overall_status: str
    checks_performed: List[IntegrityCheckResult]
    checked_at: datetime
    next_check_scheduled: Optional[datetime] = None
