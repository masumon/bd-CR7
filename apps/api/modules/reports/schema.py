"""
Reports Schemas - Request/Response Models for API
Implements data validation for reports and analytics
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime, date
from enum import Enum


class ReportType(str, Enum):
    """Types of reports available"""
    PROJECT_PROGRESS = "project_progress"
    FINANCIAL_SUMMARY = "financial_summary"
    WORKFORCE_UTILIZATION = "workforce_utilization"
    INVENTORY_STATUS = "inventory_status"
    COMPLIANCE_STATUS = "compliance_status"
    AUDIT_TRAIL = "audit_trail"
    PERFORMANCE_METRICS = "performance_metrics"


class ExportFormat(str, Enum):
    """Report export formats"""
    PDF = "pdf"
    EXCEL = "excel"
    CSV = "csv"
    JSON = "json"


class DateRange(BaseModel):
    """Date range for report filtering"""
    start_date: date
    end_date: date


class GenerateReportRequest(BaseModel):
    """Request to generate a report"""
    report_type: ReportType
    project_id: Optional[str] = None
    date_range: Optional[DateRange] = None
    filters: Optional[Dict] = None  # Additional filters
    
    class Config:
        json_schema_extra = {
            "example": {
                "report_type": "project_progress",
                "project_id": "proj_123",
                "date_range": {
                    "start_date": "2024-01-01",
                    "end_date": "2024-03-31"
                },
                "filters": {"include_completed": True}
            }
        }


class ReportResponse(BaseModel):
    """Response containing generated report"""
    report_id: str
    report_type: ReportType
    generated_at: datetime
    data: Dict  # Report data structure
    metadata: Dict  # Report metadata (filters used, etc.)
    export_formats: List[ExportFormat]  # Available export formats


class FinancialSummaryReport(BaseModel):
    """Financial summary report structure"""
    period: DateRange
    total_revenue: float
    total_expenses: float
    net_profit: float
    project_breakdown: List[Dict]  # By project
    category_breakdown: List[Dict]  # By expense category
    trends: Dict  # Month-over-month trends


class WorkforceReport(BaseModel):
    """Workforce utilization report"""
    period: DateRange
    total_workers: int
    active_workers: int
    total_hours_worked: float
    average_hours_per_worker: float
    utilization_rate: float  # Percentage
    project_distribution: List[Dict]  # Hours by project
    skill_utilization: Dict  # Skills used vs available


class InventoryReport(BaseModel):
    """Inventory status report"""
    total_items: int
    total_value: float
    low_stock_items: int
    out_of_stock_items: int
    category_breakdown: List[Dict]
    recent_transactions: List[Dict]
    reorder_recommendations: List[Dict]


class ComplianceReport(BaseModel):
    """Compliance status report"""
    overall_compliance_score: float
    projects_reviewed: int
    requirements_met: int
    requirements_total: int
    violations_by_severity: Dict
    evidence_summary: Dict
    upcoming_reviews: List[Dict]


class ExportReportRequest(BaseModel):
    """Request to export a report"""
    report_id: str
    format: ExportFormat
    filename: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "report_id": "report_123",
                "format": "pdf",
                "filename": "monthly_report_march_2024"
            }
        }


class ReportMetadata(BaseModel):
    """Report metadata"""
    id: str
    type: ReportType
    created_at: datetime
    created_by: str
    parameters: Dict  # Generation parameters
    size_bytes: Optional[int] = None
    download_url: Optional[str] = None
