from decimal import Decimal

from pydantic import BaseModel, Field


class ExpenseCreate(BaseModel):
    account_id: str
    category_id: str
    amount: Decimal = Field(gt=0)
    description: str = Field(min_length=2, max_length=500)


class ApprovalAction(BaseModel):
    decision: str = Field(pattern="^(approved|rejected)$")
    note: str = Field(min_length=2, max_length=500)


class FundTransfer(BaseModel):
    from_account_id: str
    to_account_id: str
    amount: Decimal = Field(gt=0)
    reference: str = Field(min_length=2, max_length=120)
