"""
Admin-only endpoints.
Currently provides:
  POST /api/admin/soft-reset  — marks test/demo records as is_deleted=true (soft delete).
                                Exports a JSON snapshot BEFORE any change.
                                Requires super_admin role.
                                All actions are audit-logged.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from core.audit import audit_log
from core.auth import UserContext, require_roles
from core.supabase import get_supabase_service, require_supabase_service

router = APIRouter()
logger = logging.getLogger(__name__)


class SoftResetRequest(BaseModel):
    scope: str = Field(
        default="test_data",
        description=(
            "Which records to soft-delete.\n"
            "  'test_data' — only rows whose description/notes contain '[TEST]' or '[DEMO]'\n"
            "  'all_expenses' — every expense row (use with extreme care)\n"
            "  'all_worker_logs' — every worker_logs row\n"
        ),
    )
    confirm: bool = Field(
        default=False,
        description="Must be true to proceed; acts as a safety gate.",
    )
    reason: str = Field(
        default="",
        max_length=255,
        description="Free-text reason for audit log.",
    )


ALLOWED_SCOPES = {"test_data", "all_expenses", "all_worker_logs"}


def _snapshot_table(table: str, filters: list[tuple[str, str, Any]] | None = None) -> list[dict]:
    """Return up to 1000 rows from a table as a plain list (for export)."""
    client = get_supabase_service()
    if client is None:
        return []
    try:
        q = client.table(table).select("*").limit(1000)
        if filters:
            for col, op, val in filters:
                if op == "eq":
                    q = q.eq(col, val)
                elif op == "ilike":
                    q = q.ilike(col, val)
        result = q.execute()
        return result.data or []
    except Exception as exc:  # noqa: BLE001
        logger.warning("soft_reset_snapshot_failed table=%s error=%s", table, exc)
        return []


def _soft_delete(table: str, ids: list[str]) -> int:
    """Mark rows as is_deleted=true. Returns count of updated rows."""
    client = get_supabase_service()
    if not ids or client is None:
        return 0
    try:
        client.table(table).update(
            {"is_deleted": True, "updated_at": datetime.now(timezone.utc).isoformat()}
        ).in_("id", ids).execute()
        return len(ids)
    except Exception as exc:  # noqa: BLE001
        logger.error("soft_reset_delete_failed table=%s count=%d error=%s", table, len(ids), exc)
        raise


@router.post("/soft-reset")
async def soft_reset(
    payload: SoftResetRequest,
    user: UserContext = Depends(require_roles("super_admin")),
) -> dict:
    """
    Soft-reset: marks matching records as is_deleted=true.
    Returns a JSON snapshot of affected rows BEFORE deletion (for manual recovery).
    No data is permanently removed.
    """
    svc = require_supabase_service()

    if payload.scope not in ALLOWED_SCOPES:
        raise HTTPException(status_code=400, detail=f"scope must be one of: {', '.join(ALLOWED_SCOPES)}")

    if not payload.confirm:
        raise HTTPException(
            status_code=400,
            detail="confirm must be true to proceed with soft-reset",
        )

    snapshot: dict[str, list[dict]] = {}
    deleted_counts: dict[str, int] = {}

    if payload.scope == "test_data":
        # Soft-delete expense rows that look like test data
        test_rows = _snapshot_table(
            "expenses",
            filters=[("is_deleted", "eq", False)],
        )
        # Filter client-side for rows whose description contains [TEST] or [DEMO]
        test_ids = [
            r["id"] for r in test_rows
            if "[TEST]" in str(r.get("description") or "").upper()
            or "[DEMO]" in str(r.get("description") or "").upper()
        ]
        if test_ids:
            snapshot["expenses"] = [r for r in test_rows if r["id"] in set(test_ids)]
            deleted_counts["expenses"] = _soft_delete("expenses", test_ids)

    elif payload.scope == "all_expenses":
        live_rows = _snapshot_table("expenses", filters=[("is_deleted", "eq", False)])
        ids = [r["id"] for r in live_rows]
        snapshot["expenses"] = live_rows
        if ids:
            deleted_counts["expenses"] = _soft_delete("expenses", ids)

    elif payload.scope == "all_worker_logs":
        live_rows = _snapshot_table("worker_logs")
        ids = [r["id"] for r in live_rows if not r.get("is_deleted")]
        snapshot["worker_logs"] = live_rows
        if ids:
            # worker_logs may not have is_deleted; update cautiously
            try:
                svc.table("worker_logs").update(
                    {"is_deleted": True}
                ).in_("id", ids).execute()
                deleted_counts["worker_logs"] = len(ids)
            except Exception as exc:  # noqa: BLE001
                logger.error("soft_reset_worker_logs_failed error=%s", exc)
                raise HTTPException(status_code=502, detail="worker_logs soft-delete failed") from exc

    total = sum(deleted_counts.values())

    audit_log(
        user_id=user.user_id,
        action="admin.soft_reset",
        entity_type="system",
        entity_id="soft_reset",
        meta={
            "scope": payload.scope,
            "reason": payload.reason,
            "deleted_counts": deleted_counts,
            "total_deleted": total,
        },
    )

    logger.info(
        "soft_reset_complete actor=%s scope=%s total_deleted=%d",
        user.user_id, payload.scope, total,
    )

    return {
        "status": "ok",
        "scope": payload.scope,
        "total_soft_deleted": total,
        "deleted_counts": deleted_counts,
        "snapshot_row_count": {k: len(v) for k, v in snapshot.items()},
        "snapshot": snapshot,  # caller should save this for recovery
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
