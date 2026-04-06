from decimal import Decimal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException

from core.auth import UserContext, require_roles
from core.supabase import supabase_service
from schemas.import_supply import LCRecordCreate, LCStatusUpdate, LandedCostInput

router = APIRouter()


def _require_supabase():
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    return supabase_service


@router.post("/lc-records")
async def create_lc(payload: LCRecordCreate, user: UserContext = Depends(require_roles("admin", "maker"))):
    client = _require_supabase()
    lc_id = str(uuid4())
    client.table("lc_records").insert(
        {
            "id": lc_id,
            "supplier_name": payload.supplier_name,
            "lc_number": payload.lc_number,
            "currency": payload.currency.upper(),
            "amount": str(Decimal(payload.amount)),
            "expected_arrival": str(payload.expected_arrival),
            "created_by": user.user_id,
        }
    ).execute()
    return {"id": lc_id}


@router.get("/lc-records")
async def list_lc(user: UserContext = Depends(require_roles("admin", "maker", "checker"))):
    client = _require_supabase()
    rows = client.table("lc_records").select("id,supplier_name,lc_number,currency,amount,expected_arrival,status,created_at").order("created_at", desc=True).execute()
    return rows.data or []


@router.patch("/lc-records/{lc_id}/status")
async def update_lc_status(lc_id: str, payload: LCStatusUpdate, user: UserContext = Depends(require_roles("admin", "checker"))):
    client = _require_supabase()
    client.table("lc_records").update({"status": payload.status}).eq("id", lc_id).execute()
    return {"id": lc_id, "status": payload.status}


@router.delete("/lc-records/{lc_id}")
async def delete_lc_record(lc_id: str, user: UserContext = Depends(require_roles("admin", "maker"))):
    client = _require_supabase()
    deleted = client.table("lc_records").delete().eq("id", lc_id).execute()
    if not deleted.data:
        raise HTTPException(status_code=404, detail="LC record not found")
    return {"id": lc_id, "deleted": True}


@router.post("/landed-costs")
async def calculate_landed_cost(payload: LandedCostInput, user: UserContext = Depends(require_roles("admin", "maker"))):
    client = _require_supabase()
    total = Decimal(payload.goods_cost) + Decimal(payload.freight_cost) + Decimal(payload.insurance_cost) + Decimal(payload.duty_cost) + Decimal(payload.handling_cost)
    landed_id = str(uuid4())
    client.table("landed_costs").insert(
        {
            "id": landed_id,
            "lc_record_id": payload.lc_record_id,
            "goods_cost": str(Decimal(payload.goods_cost)),
            "freight_cost": str(Decimal(payload.freight_cost)),
            "insurance_cost": str(Decimal(payload.insurance_cost)),
            "duty_cost": str(Decimal(payload.duty_cost)),
            "handling_cost": str(Decimal(payload.handling_cost)),
            "total_cost": str(total),
            "created_by": user.user_id,
        }
    ).execute()
    return {"id": landed_id, "total_cost": str(total)}
