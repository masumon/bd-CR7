"""
Reports Module Router — Architecture 2
Generates cross-module aggregate reports from live database data.
All values come from real tables — zero hardcoded data.
"""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from core.auth import UserContext, get_current_user, require_roles
from core.supabase import get_supabase_service, require_supabase_service

router = APIRouter()
logger = logging.getLogger(__name__)




@router.get("/dashboard")
async def dashboard_stats(
    user: UserContext = Depends(get_current_user),
):
    """
    Real-time dashboard KPIs.
    Returns empty/zero values when no data exists — no hardcoded fallbacks.
    """
    client = require_supabase_service()
    try:
        projects_res = client.table("projects").select("id,status").execute()
        workers_res = client.table("workers").select("id,is_active").execute()
        expenses_res = (
            client.table("expenses")
            .select("amount,status")
            .eq("is_deleted", False)
            .execute()
        )
        materials_res = client.table("materials").select("id,category,quantity,metadata").execute()
    except Exception as exc:  # noqa: BLE001
        logger.error("dashboard_stats_failed error=%s", exc)
        raise HTTPException(status_code=502, detail="Failed to fetch dashboard statistics") from exc

    projects = projects_res.data or []
    workers = workers_res.data or []
    expenses = expenses_res.data or []
    materials = materials_res.data or []

    project_counts = {"total": len(projects), "completed": 0, "ongoing": 0, "pending": 0}
    for p in projects:
        s = (p.get("status") or "pending").lower()
        if s in project_counts:
            project_counts[s] += 1

    total_budget = sum(float(e.get("amount") or 0) for e in expenses)
    approved_spend = sum(float(e.get("amount") or 0) for e in expenses if e.get("status") == "approved")
    active_workers = sum(1 for w in workers if w.get("is_active", True))
    low_stock = 0
    for m in materials:
        qty = float(m.get("quantity") or 0)
        metadata = m.get("metadata") if isinstance(m.get("metadata"), dict) else {}
        reorder_point = float(metadata.get("reorder_point") or 0)
        if reorder_point > 0 and qty <= reorder_point:
            low_stock += 1

    return {
        "projects": project_counts,
        "finance": {
            "total_expenses": total_budget,
            "approved_spend": approved_spend,
            "pending_spend": total_budget - approved_spend,
        },
        "workforce": {
            "total_workers": len(workers),
            "active_workers": active_workers,
        },
        "materials": {
            "total_materials": len(materials),
            "low_stock_alerts": low_stock,
        },
    }


@router.get("/finance")
async def finance_report(
    project_id: Optional[str] = Query(None),
    user: UserContext = Depends(require_roles("admin", "checker", "accountant")),
):
    """Financial summary: total expenses by category, approval status breakdown."""
    client = require_supabase_service()
    try:
        q = (
            client.table("expenses")
            .select("amount,category,status,expense_date")
            .eq("is_deleted", False)
        )
        if project_id:
            q = q.eq("project_id", project_id)
        result = q.execute()
        rows = result.data or []
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail="Failed to fetch finance report") from exc

    by_category: dict = {}
    by_status: dict = {}
    total = 0.0
    for r in rows:
        amt = float(r.get("amount") or 0)
        cat = r.get("category", "other")
        status = r.get("status", "pending")
        by_category[cat] = by_category.get(cat, 0.0) + amt
        by_status[status] = by_status.get(status, 0.0) + amt
        total += amt

    return {
        "total_expenses": total,
        "by_category": by_category,
        "by_status": by_status,
        "transaction_count": len(rows),
    }


@router.get("/workforce")
async def workforce_report(
    user: UserContext = Depends(require_roles("admin", "checker", "manager")),
):
    """Workforce summary: headcount, active workers, recent attendance."""
    client = require_supabase_service()
    try:
        workers_res = client.table("workers").select("id,full_name,designation,is_active").execute()
        attendance_res = (
            client.table("attendance")
            .select("worker_id,attendance_date")
            .order("attendance_date", desc=True)
            .limit(500)
            .execute()
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail="Failed to fetch workforce report") from exc

    workers = workers_res.data or []
    attendance = attendance_res.data or []

    by_trade: dict = {}
    for w in workers:
        trade = w.get("designation", "general") or "general"
        by_trade[trade] = by_trade.get(trade, 0) + 1

    attended_ids = {a.get("worker_id") for a in attendance}

    return {
        "total_workers": len(workers),
        "active_workers": sum(1 for w in workers if w.get("is_active", True)),
        "by_trade": by_trade,
        "recent_attendance_count": len(attended_ids),
    }


@router.get("/materials")
async def materials_report(
    user: UserContext = Depends(get_current_user),
):
    """Materials inventory summary."""
    client = require_supabase_service()
    try:
        result = client.table("materials").select("id,material_name,category,quantity,metadata,unit").execute()
        rows = result.data or []
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail="Failed to fetch materials report") from exc

    by_category: dict = {}
    low_stock_items = []
    for r in rows:
        cat = r.get("category", "other")
        by_category[cat] = by_category.get(cat, 0) + 1
        current_stock = float(r.get("quantity") or 0)
        metadata = r.get("metadata") if isinstance(r.get("metadata"), dict) else {}
        reorder_point = float((metadata or {}).get("reorder_point") or 0)
        if reorder_point > 0 and current_stock <= reorder_point:
            low_stock_items.append({
                "id": r.get("id"),
                "name": r.get("material_name"),
                "current_stock": current_stock,
                "reorder_point": reorder_point,
                "unit": r.get("unit"),
            })

    return {
        "total_materials": len(rows),
        "by_category": by_category,
        "low_stock_items": low_stock_items,
        "low_stock_count": len(low_stock_items),
    }
