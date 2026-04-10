"""
Evidence Schemas - Request/Response Models for API
Implements data validation for evidence and compliance
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum


class EvidenceType(str, Enum):
    """Types of evidence"""
    DOCUMENT = "document"
    PHOTO = "photo"
    VIDEO = "video"
    CERTIFICATE = "certificate"
    REPORT = "report"
    INSPECTION = "inspection"
    OTHER = "other"


class EvidenceStatus(str, Enum):
    """Evidence review status"""
    PENDING_REVIEW = "pending_review"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    REQUIRES_REVISION = "requires_revision"


class ComplianceSeverity(str, Enum):
    """Compliance violation severity"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class SubmitEvidenceRequest(BaseModel):
    """Request to submit evidence"""
    project_id: str
    evidence_type: EvidenceType
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=1000)
    files: List[str] = Field(..., min_items=1)  # File URLs/paths
    compliance_requirements: List[str] = Field(default_factory=list)
    
    class Config:
        json_schema_extra = {
            "example": {
                "project_id": "proj_123",
                "evidence_type": "document",
                "title": "Foundation Inspection Report",
                "description": "Complete inspection report for building foundation",
                "files": ["https://cloudinary.com/file1.pdf", "https://cloudinary.com/file2.jpg"],
                "compliance_requirements": ["structural_integrity", "safety_standards"]
            }
        }


class EvidenceResponse(BaseModel):
    """Response containing evidence details"""
    id: str
    project_id: str
    evidence_type: EvidenceType
    title: str
    description: str
    files: List[str]
    submitted_by: str
    status: EvidenceStatus
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None


class ReviewEvidenceRequest(BaseModel):
    """Request to review evidence"""
    evidence_id: str
    approved: bool
    review_notes: str = Field(..., min_length=1, max_length=500)
    compliance_score: int = Field(..., ge=0, le=100)
    
    class Config:
        json_schema_extra = {
            "example": {
                "evidence_id": "ev_123",
                "approved": True,
                "review_notes": "All requirements met, documentation complete",
                "compliance_score": 95
            }
        }


class ComplianceStatusResponse(BaseModel):
    """Project compliance status"""
    project_id: str
    overall_compliance: float  # Percentage
    requirements_met: List[str]
    requirements_pending: List[str]
    requirements_failed: List[str]
    evidence_count: int
    last_review_date: Optional[datetime] = None


class ComplianceReportResponse(BaseModel):
    """Detailed compliance report"""
    project_id: str
    generated_at: datetime
    compliance_score: float
    evidence_summary: Dict  # By type and status
    requirement_details: List[Dict]  # Each requirement with evidence
    recommendations: List[str]
    next_review_date: Optional[datetime] = None


class FlagNonComplianceRequest(BaseModel):
    """Request to flag compliance violation"""
    project_id: str
    requirement: str = Field(..., min_length=1, max_length=200)
    severity: ComplianceSeverity
    description: str = Field(..., min_length=1, max_length=500)
    
    class Config:
        json_schema_extra = {
            "example": {
                "project_id": "proj_123",
                "requirement": "safety_standards",
                "severity": "high",
                "description": "Missing safety barrier documentation"
            }
        }


class ComplianceRecord(BaseModel):
    """Compliance violation record"""
    id: str
    project_id: str
    requirement: str
    severity: ComplianceSeverity
    description: str
    flagged_by: str
    flagged_at: datetime
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
