from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from core.auth import UserContext, require_roles
from core.supabase import supabase_service

router = APIRouter()


class ContractorPaidAmountUpdate(BaseModel):
    paid_amount: Decimal = Field(ge=0)


class InventoryStockQtyUpdate(BaseModel):
    stock_qty: Decimal = Field(ge=0)


def _require_supabase():
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    return supabase_service


@router.patch("/payment/{contract_id}")
async def update_contractor_paid_amount(
    contract_id: str,
    payload: ContractorPaidAmountUpdate,
    user: UserContext = Depends(require_roles("admin", "maker")),
):
    client = _require_supabase()
    updated = (
        client.table("contractor_contracts")
        .update({"paid_amount": str(payload.paid_amount)})
        .eq("id", contract_id)
        .execute()
    )
    if not updated.data:
        raise HTTPException(status_code=404, detail="Contract not found")
    return {"id": contract_id, "paid_amount": str(payload.paid_amount)}


@router.patch("/stock/{product_id}")
async def update_inventory_stock_qty(
    product_id: str,
    payload: InventoryStockQtyUpdate,
    user: UserContext = Depends(require_roles("admin", "maker")),
):
    client = _require_supabase()
    updated = (
        client.table("products")
        .update({"stock_qty": str(payload.stock_qty)})
        .eq("id", product_id)
        .execute()
    )
    if not updated.data:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"id": product_id, "stock_qty": str(payload.stock_qty)}
