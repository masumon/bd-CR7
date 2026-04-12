"""
Financial audit trail — lightweight, non-blocking audit logger.

Usage:
    from core.audit import audit_log
    audit_log(user_id="u1", action="expense.approve", entity_type="expense",
              entity_id="exp-123", meta={"decision": "approved", "amount": 5000})

Each call inserts one row into the `audit_logs` Supabase table.
Failures are caught and logged — they must never interrupt the main request.

Required Supabase table (run the migration SQL below once):

    CREATE TABLE IF NOT EXISTS audit_logs (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID,
        action      TEXT NOT NULL,
        entity_type TEXT,
        entity_id   TEXT,
        meta        JSONB,
        request_id  TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX ON audit_logs (user_id, created_at DESC);
    CREATE INDEX ON audit_logs (entity_type, entity_id);
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)

# Auditable actions — extend as needed
ACTIONS = {
    # Finance
    "expense.create": "Expense created",
    "expense.approve": "Expense approved/rejected",
    "expense.update": "Expense updated",
    "expense.delete": "Expense deleted",
    "fund.transfer": "Fund transfer executed",
    "fund.entry.create": "Fund entry created",
    # Users
    "user.create": "User created",
    "user.update": "User updated",
    "user.delete": "User deleted",
    # Auth
    "auth.login": "User logged in",
    "auth.logout": "User logged out",
    "auth.register": "User registered",
    # Construction
    "material.movement": "Material movement recorded",
    "worker.create": "Worker created",
}


def audit_log(
    *,
    user_id: str,
    action: str,
    entity_type: str | None = None,
    entity_id: str | None = None,
    meta: dict[str, Any] | None = None,
    request_id: str | None = None,
) -> None:
    """
    Write one audit record to `audit_logs`.
    Never raises — failures are swallowed and logged as warnings.
    """
    try:
        from core.supabase import get_supabase_service, require_supabase_service
        from core.logging import get_request_id

        client = get_supabase_service()
        if client is None:
            return

        row: dict[str, Any] = {
            "user_id": user_id,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "meta": meta or {},
            "request_id": request_id or get_request_id(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        client.table("audit_logs").insert(row).execute()
    except Exception as exc:  # noqa: BLE001
        logger.warning("audit_log_failed action=%s entity=%s error=%s", action, entity_id, exc)
