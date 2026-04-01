from decimal import Decimal
from uuid import uuid4

from fastapi import APIRouter, Depends

from core.auth import UserContext, require_roles
from core.db import fetch_all, tx
from schemas.import_supply import LCRecordCreate, LCStatusUpdate, LandedCostInput

router = APIRouter()


@router.post("/lc-records")
async def create_lc(payload: LCRecordCreate, user: UserContext = Depends(require_roles("admin", "maker"))):
    lc_id = str(uuid4())
    with tx() as conn:
        conn.exec_driver_sql(
            """
            INSERT INTO lc_records (id, supplier_name, lc_number, currency, amount, expected_arrival, created_by)
            VALUES (%s, %s, %s, %s, %s, %s::date, %s)
            """,
            (lc_id, payload.supplier_name, payload.lc_number, payload.currency.upper(), Decimal(payload.amount), payload.expected_arrival, user.user_id),
        )
    return {"id": lc_id}


@router.get("/lc-records")
async def list_lc(user: UserContext = Depends(require_roles("admin", "maker", "checker"))):
    rows = fetch_all(
        "SELECT id, supplier_name, lc_number, currency, amount, expected_arrival, status, created_at FROM lc_records ORDER BY created_at DESC"
    )
    return [dict(x) for x in rows]


@router.patch("/lc-records/{lc_id}/status")
async def update_lc_status(lc_id: str, payload: LCStatusUpdate, user: UserContext = Depends(require_roles("admin", "checker"))):
    with tx() as conn:
        conn.exec_driver_sql(
            "UPDATE lc_records SET status = %s, updated_at = NOW() WHERE id = %s",
            (payload.status, lc_id),
        )
    return {"id": lc_id, "status": payload.status}


@router.post("/landed-costs")
async def calculate_landed_cost(payload: LandedCostInput, user: UserContext = Depends(require_roles("admin", "maker"))):
    total = Decimal(payload.goods_cost) + Decimal(payload.freight_cost) + Decimal(payload.insurance_cost) + Decimal(payload.duty_cost) + Decimal(payload.handling_cost)
    landed_id = str(uuid4())

    with tx() as conn:
        conn.exec_driver_sql(
            """
            INSERT INTO landed_costs (
                id, lc_record_id, goods_cost, freight_cost, insurance_cost,
                duty_cost, handling_cost, total_cost, created_by
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                landed_id,
                payload.lc_record_id,
                Decimal(payload.goods_cost),
                Decimal(payload.freight_cost),
                Decimal(payload.insurance_cost),
                Decimal(payload.duty_cost),
                Decimal(payload.handling_cost),
                total,
                user.user_id,
            ),
        )
    return {"id": landed_id, "total_cost": str(total)}
