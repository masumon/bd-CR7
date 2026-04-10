"""
Materials Module Router — Architecture 2
Handles construction materials inventory: stock tracking, purchases, allocations.
"""
from __future__ import annotations

import logging
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query

from core.audit import audit_log
from core.auth import UserContext, get_current_user, require_roles
from core.supabase import supabase_service
from modules.materials.schema import AddMaterialRequest, UpdateStockRequest, AllocateMaterialRequest

router = APIRouter()
logger = logging.getLogger(__name__)


def _require_supabase():
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    return supabase_service


@router.get("")
async def list_materials(
    category: Optional[str] = Query(None),
    low_stock_only: bool = Query(False),
    limit: int = Query(100, ge=1, le=500),
    user: UserContext = Depends(get_current_user),
):
    """List all materials, optionally filtered by category or low-stock flag."""
    client = _require_supabase()
    q = (
        client.table("materials")
        .select("id,name,description,unit,category,current_stock,reorder_point,supplier_id,created_at")
        .order("name")
        .limit(limit)
    )
    if category:
        q = q.eq("category", category)

    try:
        result = q.execute()
        rows = result.data or []
    except Exception as exc:  # noqa: BLE001
        logger.error("materials_list_failed error=%s", exc)
        raise HTTPException(status_code=502, detail="Failed to fetch materials") from exc

    if low_stock_only:
        rows = [r for r in rows if (r.get("current_stock") or 0) <= (r.get("reorder_point") or 0)]

    return rows


@router.get("/{material_id}")
async def get_material(
    material_id: str,
    user: UserContext = Depends(get_current_user),
):
    """Retrieve a single material record."""
    client = _require_supabase()
    try:
        result = (
            client.table("materials")
            .select("*")
            .eq("id", material_id)
            .maybe_single()
            .execute()
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail="Failed to fetch material") from exc

    if not result.data:
        raise HTTPException(status_code=404, detail="Material not found")
    return result.data


@router.post("")
async def add_material(
    payload: AddMaterialRequest,
    user: UserContext = Depends(require_roles("admin", "maker")),
):
    """Add a new material to inventory."""
    client = _require_supabase()
    material_id = str(uuid4())
    try:
        result = client.table("materials").insert({
            "id": material_id,
            "name": payload.name,
            "description": payload.description,
            "unit": payload.unit,
            "category": payload.category.value,
            "reorder_point": payload.reorder_point,
            "current_stock": 0,
            "supplier_id": payload.supplier_id,
            "created_by": user.user_id,
        }).execute()
    except Exception as exc:  # noqa: BLE001
        logger.error("material_add_failed error=%s", exc)
        raise HTTPException(status_code=502, detail="Failed to add material") from exc

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to add material")

    audit_log(
        user_id=user.user_id,
        action="material.create",
        entity_type="material",
        entity_id=material_id,
        meta={"name": payload.name, "category": payload.category.value},
    )
    return result.data[0]


@router.post("/{material_id}/stock")
async def update_stock(
    material_id: str,
    payload: UpdateStockRequest,
    user: UserContext = Depends(require_roles("admin", "maker")),
):
    """Record a stock movement (purchase, allocation, adjustment, waste)."""
    client = _require_supabase()

    material = (
        client.table("materials")
        .select("id,current_stock,name")
        .eq("id", material_id)
        .maybe_single()
        .execute()
    )
    if not material.data:
        raise HTTPException(status_code=404, detail="Material not found")

    current = float(material.data.get("current_stock") or 0)
    new_stock = current + payload.quantity_change

    if new_stock < 0:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock. Available: {current}, Requested change: {payload.quantity_change}",
        )

    try:
        # Update stock level
        client.table("materials").update({"current_stock": new_stock}).eq("id", material_id).execute()
        # Log the transaction
        tx_id = str(uuid4())
        client.table("material_movements").insert({
            "id": tx_id,
            "material_id": material_id,
            "quantity_change": payload.quantity_change,
            "transaction_type": payload.transaction_type.value,
            "reference_id": payload.reference_id,
            "notes": payload.notes,
            "stock_after": new_stock,
            "recorded_by": user.user_id,
        }).execute()
    except Exception as exc:  # noqa: BLE001
        logger.error("stock_update_failed material_id=%s error=%s", material_id, exc)
        raise HTTPException(status_code=502, detail="Failed to update stock") from exc

    audit_log(
        user_id=user.user_id,
        action="material.stock_update",
        entity_type="material",
        entity_id=material_id,
        meta={"change": payload.quantity_change, "type": payload.transaction_type.value, "stock_after": new_stock},
    )
    return {"material_id": material_id, "new_stock": new_stock, "transaction_type": payload.transaction_type}


@router.get("/inventory/summary")
async def inventory_summary(
    user: UserContext = Depends(get_current_user),
):
    """Return a high-level inventory summary: total items, low-stock count, by category."""
    client = _require_supabase()
    try:
        result = client.table("materials").select("category,current_stock,reorder_point").execute()
        rows = result.data or []
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail="Failed to fetch inventory summary") from exc

    category_counts: dict = {}
    low_stock = 0
    for r in rows:
        cat = r.get("category", "other")
        category_counts[cat] = category_counts.get(cat, 0) + 1
        if (r.get("current_stock") or 0) <= (r.get("reorder_point") or 0):
            low_stock += 1

    return {
        "total_materials": len(rows),
        "low_stock_count": low_stock,
        "by_category": category_counts,
    }
