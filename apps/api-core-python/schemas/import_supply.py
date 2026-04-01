from decimal import Decimal

from pydantic import BaseModel, Field


class LCRecordCreate(BaseModel):
    supplier_name: str = Field(min_length=2, max_length=120)
    lc_number: str = Field(min_length=4, max_length=100)
    currency: str = Field(min_length=3, max_length=3)
    amount: Decimal = Field(gt=0)
    expected_arrival: str


class LandedCostInput(BaseModel):
    lc_record_id: str
    goods_cost: Decimal = Field(ge=0)
    freight_cost: Decimal = Field(ge=0)
    insurance_cost: Decimal = Field(ge=0)
    duty_cost: Decimal = Field(ge=0)
    handling_cost: Decimal = Field(ge=0)
