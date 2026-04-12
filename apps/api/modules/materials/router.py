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
        .select("id,material_name,notes,unit,category,quantity,supplier_id,created_at,metadata")
        .order("material_name")
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
        rows = [
            r for r in rows
            if float(r.get("quantity") or 0)
            <= float(((r.get("metadata") if isinstance(r.get("metadata"), dict) else {}) or {}).get("reorder_point") or 0)
        ]

    return [
        {
            "id": r.get("id"),
            "name": r.get("material_name"),
            "description": r.get("notes") or "",
            "unit": r.get("unit"),
            "category": r.get("category"),
            "current_stock": r.get("quantity") or 0,
            "reorder_point": (((r.get("metadata") if isinstance(r.get("metadata"), dict) else {}) or {}).get("reorder_point") or 0),
            "supplier_id": r.get("supplier_id"),
            "created_at": r.get("created_at"),
        }
        for r in rows
    ]


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
            .select("id,material_name,notes,unit,category,quantity,supplier_id,created_at,updated_at,metadata")
            .eq("id", material_id)
            .maybe_single()
            .execute()
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail="Failed to fetch material") from exc

    if not result.data:
        raise HTTPException(status_code=404, detail="Material not found")
    row = result.data
    return {
        "id": row.get("id"),
        "name": row.get("material_name"),
        "description": row.get("notes") or "",
        "unit": row.get("unit"),
        "category": row.get("category"),
        "current_stock": row.get("quantity") or 0,
        "reorder_point": (((row.get("metadata") if isinstance(row.get("metadata"), dict) else {}) or {}).get("reorder_point") or 0),
        "supplier_id": row.get("supplier_id"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }


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
            "material_name": payload.name,
            "notes": payload.description,
            "unit": payload.unit,
            "category": payload.category.value,
            "quantity": 0,
            "supplier_id": payload.supplier_id,
            "created_by": user.user_id,
            "metadata": {"reorder_point": payload.reorder_point},
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
        .select("id,quantity,material_name")
        .eq("id", material_id)
        .maybe_single()
        .execute()
    )
    if not material.data:
        raise HTTPException(status_code=404, detail="Material not found")

    current = float(material.data.get("quantity") or 0)
    new_stock = current + payload.quantity_change

    if new_stock < 0:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock. Available: {current}, Requested change: {payload.quantity_change}",
        )

    try:
        # Update stock level
        client.table("materials").update({"quantity": new_stock}).eq("id", material_id).execute()
        # Log the transaction
        tx_id = str(uuid4())
        client.table("material_movements").insert({
            "id": tx_id,
            "material_id": material_id,
            "quantity_moved": payload.quantity_change,
            "movement_type": payload.transaction_type.value,
            "reason": payload.notes,
            "created_by": user.user_id,
            "metadata": {"reference_id": payload.reference_id, "stock_after": new_stock},
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
        result = client.table("materials").select("category,quantity,metadata").execute()
        rows = result.data or []
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail="Failed to fetch inventory summary") from exc

    category_counts: dict = {}
    low_stock = 0
    for r in rows:
        cat = r.get("category", "other")
        category_counts[cat] = category_counts.get(cat, 0) + 1
        metadata = r.get("metadata") if isinstance(r.get("metadata"), dict) else {}
        reorder_point = float(metadata.get("reorder_point") or 0)
        if reorder_point > 0 and float(r.get("quantity") or 0) <= reorder_point:
            low_stock += 1

    return {
        "total_materials": len(rows),
        "low_stock_count": low_stock,
        "by_category": category_counts,
    }
