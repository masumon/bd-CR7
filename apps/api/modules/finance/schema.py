"""
Finance Schemas - Request/Response Models for API
Implements data validation for transactions, accounts, and approvals
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from decimal import Decimal
from datetime import datetime
from enum import Enum


class TransactionCategory(str, Enum):
    """Valid transaction categories"""
    REVENUE = "revenue"
    EXPENSE = "expense"
    TRANSFER = "transfer"
    ADJUSTMENT = "adjustment"
    PAYMENT = "payment"
    COLLECTION = "collection"


class TransactionStatus(str, Enum):
    """Transaction status lifecycle"""
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    POSTED = "posted"
    REJECTED = "rejected"
    REVERSED = "reversed"


class AccountType(str, Enum):
    """Chart of accounts types"""
    ASSET = "asset"
    LIABILITY = "liability"
    EQUITY = "equity"
    REVENUE = "revenue"
    EXPENSE = "expense"


class CreateTransactionRequest(BaseModel):
    """Request to create a new transaction"""
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    description: str = Field(..., min_length=1, max_length=500)
    category: TransactionCategory
    from_account_id: str
    to_account_id: str
    requires_approval: bool = False
    notes: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "amount": 5000.00,
                "description": "Material purchase - Cement Type C",
                "category": "expense",
                "from_account_id": "acc_001",
                "to_account_id": "acc_002",
                "requires_approval": True,
                "notes": "For Project Alpha construction"
            }
        }


class TransactionResponse(BaseModel):
    """Response containing transaction details"""
    id: str
    amount: Decimal
    description: str
    category: TransactionCategory
    status: TransactionStatus
    from_account_id: str
    to_account_id: str
    created_at: datetime
    created_by: str
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None


class PendingApprovalResponse(BaseModel):
    """Response containing pending transaction requiring approval"""
    transaction_id: str
    amount: Decimal
    description: str
    category: TransactionCategory
    created_at: datetime
    created_by: str
    from_account_id: str
    to_account_id: str


class ApprovalDecisionRequest(BaseModel):
    """Request to approve or reject a transaction"""
    transaction_id: str
    approved: bool
    notes: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "transaction_id": "txn_123abc",
                "approved": True,
                "notes": "Verified against invoice #INV-2024-001"
            }
        }


class AccountBalanceResponse(BaseModel):
    """Response containing account balance"""
    account_id: str
    account_name: str
    balance: Decimal
    currency: str = "USD"
    account_type: AccountType
    as_of: datetime
