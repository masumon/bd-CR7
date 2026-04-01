from decimal import Decimal

from pydantic import BaseModel, Field


class CustomerCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str | None = Field(default=None, max_length=20)
    email: str | None = Field(default=None, max_length=200)


class SaleItemInput(BaseModel):
    product_id: str
    quantity: int = Field(gt=0)


class SaleCreate(BaseModel):
    customer_id: str | None = None
    items: list[SaleItemInput] = Field(min_length=1)


class ProductUpsert(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    barcode: str = Field(min_length=4, max_length=80)
    purchase_price: Decimal = Field(ge=0)
    sell_price: Decimal = Field(gt=0)
    stock_qty: Decimal = Field(ge=0)
