"""
Contractor Schemas - Request/Response Models for API
Implements data validation for contractors and contracts
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime, date
from decimal import Decimal
from enum import Enum


class ContractorStatus(str, Enum):
    """Contractor verification status"""
    PENDING_VERIFICATION = "pending_verification"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    SUSPENDED = "suspended"
    REJECTED = "rejected"


class ContractStatus(str, Enum):
    """Contract status"""
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    TERMINATED = "terminated"
    ON_HOLD = "on_hold"


class ContractType(str, Enum):
    """Types of contracts"""
    SUBCONTRACT = "subcontract"
    SUPPLY = "supply"
    SERVICE = "service"
    CONSULTING = "consulting"


class ContactInfo(BaseModel):
    """Contractor contact information"""
    company_name: str
    phone: str
    email: str
    address: str
    primary_contact: str
    website: Optional[str] = None


class LicenseInfo(BaseModel):
    """Contractor licensing information"""
    license_number: str
    issuing_authority: str
    expiry_date: date
    license_type: str


class InsuranceInfo(BaseModel):
    """Contractor insurance information"""
    provider: str
    policy_number: str
    coverage_amount: Decimal
    expiry_date: date
    insurance_type: str


class RegisterContractorRequest(BaseModel):
    """Request to register a new contractor"""
    name: str = Field(..., min_length=1, max_length=200)
    contact_info: ContactInfo
    specialization: List[str] = Field(..., min_items=1)
    license_info: LicenseInfo
    insurance_info: Optional[InsuranceInfo] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "ABC Construction Ltd",
                "contact_info": {
                    "company_name": "ABC Construction Ltd",
                    "phone": "+1234567890",
                    "email": "contact@abcconstruction.com",
                    "address": "123 Industrial Ave",
                    "primary_contact": "John Doe"
                },
                "specialization": ["electrical", "plumbing"],
                "license_info": {
                    "license_number": "LIC123456",
                    "issuing_authority": "State Construction Board",
                    "expiry_date": "2025-12-31",
                    "license_type": "General Contractor"
                }
            }
        }


class ContractorResponse(BaseModel):
    """Response containing contractor details"""
    id: str
    name: str
    contact_info: ContactInfo
    specialization: List[str]
    license_info: LicenseInfo
    insurance_info: Optional[InsuranceInfo] = None
    status: ContractorStatus
    registered_at: datetime
    approved_at: Optional[datetime] = None


class CreateContractRequest(BaseModel):
    """Request to create a contract"""
    contractor_id: str
    project_id: str
    contract_type: ContractType
    scope_of_work: str = Field(..., min_length=1, max_length=2000)
    contract_value: Decimal = Field(..., gt=0)
    start_date: date
    end_date: date
    payment_terms: Dict  # Payment schedule and terms
    
    class Config:
        json_schema_extra = {
            "example": {
                "contractor_id": "contr_123",
                "project_id": "proj_456",
                "contract_type": "subcontract",
                "scope_of_work": "Complete electrical installation for building",
                "contract_value": 50000.00,
                "start_date": "2024-03-01",
                "end_date": "2024-06-30",
                "payment_terms": {
                    "schedule": "monthly",
                    "retainage": 10,
                    "payment_upon_completion": 20
                }
            }
        }


class ContractResponse(BaseModel):
    """Response containing contract details"""
    id: str
    contractor_id: str
    project_id: str
    contract_type: ContractType
    scope_of_work: str
    contract_value: Decimal
    start_date: date
    end_date: date
    payment_terms: Dict
    status: ContractStatus
    created_at: datetime


class PaymentRequest(BaseModel):
    """Contractor payment request"""
    contract_id: str
    amount: Decimal = Field(..., gt=0)
    description: str = Field(..., min_length=1, max_length=500)
    work_completed: str = Field(..., min_length=1, max_length=1000)
    supporting_documents: List[str] = Field(default_factory=list)
    
    class Config:
        json_schema_extra = {
            "example": {
                "contract_id": "cont_123",
                "amount": 15000.00,
                "description": "Month 2 electrical work completion",
                "work_completed": "Completed wiring for floors 1-3",
                "supporting_documents": ["invoice.pdf", "progress_photos.zip"]
            }
        }


class ContractorPerformance(BaseModel):
    """Contractor performance metrics"""
    contractor_id: str
    contracts_completed: int
    on_time_delivery_rate: float  # Percentage
    quality_score: float  # 1-5 scale
    average_project_duration: int  # Days
    total_contract_value: Decimal
    payment_history: Dict  # On-time payment rate
