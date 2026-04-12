"""
Audit Module Router — Architecture 2
Provides read-only access to audit_logs table.
All mutations are written by the core audit engine (core/audit.py).
"""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from core.auth import UserContext, get_current_user, require_roles
from core.supabase import get_supabase_service, require_supabase_service

router = APIRouter()
logger = logging.getLogger(__name__)




@router.get("/logs")
async def list_audit_logs(
    resource_type: Optional[str] = Query(None),
    resource_id: Optional[str] = Query(None),
    actor_user_id: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    user: UserContext = Depends(require_roles("admin", "super_admin", "checker")),
):
    """Return audit log entries, newest first. Supports optional filters."""
    client = require_supabase_service()
    q = (
        client.table("audit_logs")
        .select("id,actor_user_id,action,entity_type,entity_id,meta,created_at")
        .order("created_at", desc=True)
        .limit(limit)
    )
    if resource_type:
        q = q.eq("entity_type", resource_type)
    if resource_id:
        q = q.eq("entity_id", resource_id)
    if actor_user_id:
        q = q.eq("actor_user_id", actor_user_id)

    try:
        result = q.execute()
        return result.data or []
    except Exception as exc:  # noqa: BLE001
        logger.error("audit_list_failed error=%s", exc)
        raise HTTPException(status_code=502, detail="Failed to fetch audit logs") from exc


@router.get("/logs/{log_id}")
async def get_audit_log(
    log_id: str,
    user: UserContext = Depends(require_roles("admin", "super_admin", "checker")),
):
    """Retrieve a single audit log entry by ID."""
    client = require_supabase_service()
    try:
        result = (
            client.table("audit_logs")
            .select("*")
            .eq("id", log_id)
            .maybe_single()
            .execute()
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail="Failed to fetch audit log") from exc

    if not result.data:
        raise HTTPException(status_code=404, detail="Audit log entry not found")
    return result.data


@router.get("/summary")
async def audit_summary(
    user: UserContext = Depends(require_roles("admin", "super_admin", "checker")),
):
    """Return a lightweight count summary of recent audit activity."""
    client = require_supabase_service()
    try:
        result = (
            client.table("audit_logs")
            .select("action,entity_type,created_at")
            .order("created_at", desc=True)
            .limit(500)
            .execute()
        )
        rows = result.data or []
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail="Failed to fetch audit summary") from exc

    action_counts: dict = {}
    entity_counts: dict = {}
    for row in rows:
        a = row.get("action", "unknown")
        e = row.get("entity_type", "unknown")
        action_counts[a] = action_counts.get(a, 0) + 1
        entity_counts[e] = entity_counts.get(e, 0) + 1

    return {
        "total_events": len(rows),
        "by_action": action_counts,
        "by_entity_type": entity_counts,
    }
