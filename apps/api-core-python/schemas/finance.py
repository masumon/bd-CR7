from decimal import Decimal

from pydantic import BaseModel, Field


class ExpenseCreate(BaseModel):
    account_id: str
    category_id: str
    amount: Decimal = Field(gt=0)
    description: str = Field(min_length=2, max_length=500)


class ExpenseUpdate(BaseModel):
    amount: Decimal = Field(gt=0)
    status: str = Field(pattern="^(pending|approved|rejected)$")
    description: str = Field(min_length=2, max_length=500)
    category: str | None = Field(default=None, min_length=1, max_length=120)
    subcategory: str | None = Field(default=None, min_length=1, max_length=120)


class ApprovalAction(BaseModel):
    decision: str = Field(pattern="^(approved|rejected)$")
    note: str = Field(min_length=2, max_length=500)


class FundTransfer(BaseModel):
    from_account_id: str
    to_account_id: str
    amount: Decimal = Field(gt=0)
    reference: str = Field(min_length=2, max_length=120, pattern=r"^[a-zA-Z0-9\-_\s]+$")


class FundEntryCreate(BaseModel):
    account_id: str
    amount: Decimal = Field(gt=0)
    reference: str = Field(min_length=2, max_length=120, pattern=r"^[a-zA-Z0-9\-_\s]+$")
    description: str | None = Field(default=None, max_length=500)
    receipt_url: str | None = Field(default=None, max_length=1000)
    transaction_date: str | None = None
    source_sender: str | None = Field(default=None, max_length=120)
    payment_method: str | None = Field(default=None, max_length=120)


class ManualExpenseCreate(BaseModel):
    account_id: str
    amount: Decimal = Field(gt=0)
    description: str = Field(min_length=2, max_length=500)
    status: str = Field(pattern="^(pending|approved)$")
    category: str | None = Field(default=None, max_length=120)
    subcategory: str | None = Field(default=None, max_length=120)
    expense_date: str | None = None
    paid_by: str | None = Field(default=None, max_length=120)
    receipt_url: str | None = Field(default=None, max_length=1000)
    proof_file_id: str | None = Field(default=None, max_length=120)
    approved_by: str | None = Field(default=None, max_length=120)
