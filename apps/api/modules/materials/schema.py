"""
Materials Schemas - Request/Response Models for API
Implements data validation for materials and inventory
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum


class MaterialCategory(str, Enum):
    """Material categories"""
    CEMENT = "cement"
    STEEL = "steel"
    SAND = "sand"
    BRICKS = "bricks"
    CONCRETE = "concrete"
    ELECTRICAL = "electrical"
    PLUMBING = "plumbing"
    FINISHING = "finishing"
    OTHER = "other"


class TransactionType(str, Enum):
    """Stock transaction types"""
    PURCHASE = "purchase"
    ALLOCATION = "allocation"
    RETURN = "return"
    ADJUSTMENT = "adjustment"
    WASTE = "waste"


class AddMaterialRequest(BaseModel):
    """Request to add a new material"""
    name: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=500)
    unit: str = Field(..., min_length=1, max_length=20)
    category: MaterialCategory
    reorder_point: int = Field(..., ge=0)
    supplier_id: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Portland Cement Type I",
                "description": "High-quality cement for construction",
                "unit": "kg",
                "category": "cement",
                "reorder_point": 1000,
                "supplier_id": "sup_001"
            }
        }


class MaterialResponse(BaseModel):
    """Response containing material details"""
    id: str
    name: str
    description: str
    unit: str
    category: MaterialCategory
    reorder_point: int
    current_stock: float
    supplier_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class UpdateStockRequest(BaseModel):
    """Request to update material stock"""
    quantity_change: float
    transaction_type: TransactionType
    reference_id: str  # Purchase order, project ID, etc.
    notes: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "quantity_change": 500.0,
                "transaction_type": "purchase",
                "reference_id": "po_123",
                "notes": "Bulk purchase from supplier"
            }
        }


class AllocateMaterialRequest(BaseModel):
    """Request to allocate material to project"""
    material_id: str
    project_id: str
    quantity: float = Field(..., gt=0)
    
    class Config:
        json_schema_extra = {
            "example": {
                "material_id": "mat_001",
                "project_id": "proj_123",
                "quantity": 200.0
            }
        }


class InventoryReportResponse(BaseModel):
    """Comprehensive inventory report"""
    total_materials: int
    total_value: float
    low_stock_alerts: List[Dict]  # Materials below reorder point
    category_breakdown: Dict  # Materials by category
    recent_transactions: List[Dict]  # Last 10 stock transactions


class ReorderAlert(BaseModel):
    """Alert for materials needing reorder"""
    material_id: str
    material_name: str
    current_stock: float
    reorder_point: int
    supplier_id: Optional[str] = None
