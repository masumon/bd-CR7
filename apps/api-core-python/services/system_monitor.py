"""
System Awareness & Intelligence Monitor
----------------------------------------
Scans all critical modules for anomalies, connectivity failures,
financial inconsistencies, workforce issues, and project delays.
Returns structured alert objects ready for SUPER_ADMIN notification.
No LLM — pure rule-based detection.
"""
from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Literal

from core.supabase import supabase_service

AlertSeverity = Literal["critical", "high", "medium", "low", "info"]
AlertModule = Literal[
    "finance", "workforce", "materials", "projects",
    "database", "api", "security", "system"
]


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _alert(
    *,
    alert_type: str,
    module: AlertModule,
    severity: AlertSeverity,
    title: str,
    detail: str,
    recommended_action: str,
) -> dict:
    return {
        "alert_type": alert_type,
        "module": module,
        "severity": severity,
        "title": title,
        "detail": detail,
        "recommended_action": recommended_action,
        "timestamp": _now_iso(),
        "resolved": False,
    }


# ---------------------------------------------------------------------------
# DB connectivity probes
# ---------------------------------------------------------------------------

CRITICAL_TABLES = [
    "expenses", "fund_accounts", "fund_transactions",
    "workers", "worker_logs", "projects", "audit_logs",
]

OPTIONAL_TABLES = [
    "material_logs", "contractor_contracts", "sales",
    "approvals", "ai_memory",
]


def _probe_tables() -> list[dict]:
    alerts: list[dict] = []
    if supabase_service is None:
        alerts.append(_alert(
            alert_type="db_unavailable",
            module="database",
            severity="critical",
            title="Database connection unavailable",
            detail="supabase_service is None — all DB-dependent features are offline.",
            recommended_action="Check SUPABASE_SERVICE_KEY and SUPABASE_URL environment variables. Restart API.",
        ))
        return alerts

    for table in CRITICAL_TABLES:
        try:
            supabase_service.table(table).select("id", count="exact").limit(1).execute()
        except Exception as exc:
            alerts.append(_alert(
                alert_type="table_unreachable",
                module="database",
                severity="critical",
                title=f"Critical table unreachable: {table}",
                detail=str(exc)[:300],
                recommended_action=f"Verify RLS policies and schema for table '{table}'. Check migration logs.",
            ))

    for table in OPTIONAL_TABLES:
        try:
            supabase_service.table(table).select("id", count="exact").limit(1).execute()
        except Exception as exc:
            alerts.append(_alert(
                alert_type="table_unreachable",
                module="database",
                severity="medium",
                title=f"Optional table unreachable: {table}",
                detail=str(exc)[:300],
                recommended_action=f"Run pending migrations. Check if '{table}' was created.",
            ))

    return alerts


# ---------------------------------------------------------------------------
# Financial intelligence
# ---------------------------------------------------------------------------

def _check_finance() -> list[dict]:
    alerts: list[dict] = []
    if supabase_service is None:
        return alerts

    try:
        accounts = supabase_service.table("fund_accounts").select("balance").limit(500).execute()
        expenses_res = supabase_service.table("expenses").select("id,amount,status").limit(500).execute()
        expenses = expenses_res.data or []

        total_balance = sum(
            Decimal(str(r.get("balance") or 0))
            for r in (accounts.data or [])
        )
        total_expenses = sum(
            Decimal(str(r.get("amount") or 0))
            for r in expenses
        )
        pending_count = sum(1 for r in expenses if str(r.get("status", "")).lower() == "pending")

        # Budget pressure: expenses ≥ 85 % of total funds
        if total_balance > 0 and total_expenses >= total_balance * Decimal("0.85"):
            pct = int((total_expenses / total_balance) * 100)
            alerts.append(_alert(
                alert_type="budget_pressure",
                module="finance",
                severity="high" if pct >= 95 else "medium",
                title=f"Budget at {pct}% capacity",
                detail=f"Total expenses ৳{total_expenses:,.0f} vs fund balance ৳{total_balance:,.0f}.",
                recommended_action="Review and freeze non-critical expenses. Request additional funding.",
            ))

        # Approval backlog
        if pending_count >= 10:
            alerts.append(_alert(
                alert_type="approval_backlog",
                module="finance",
                severity="high",
                title=f"{pending_count} expenses awaiting approval",
                detail=f"{pending_count} pending expenses may indicate workflow bottleneck.",
                recommended_action="Assign checker/admin to review and approve pending expenses.",
            ))
        elif pending_count >= 5:
            alerts.append(_alert(
                alert_type="approval_backlog",
                module="finance",
                severity="medium",
                title=f"{pending_count} expenses pending review",
                detail=f"Approval queue is growing.",
                recommended_action="Review pending expenses to keep workflow unblocked.",
            ))

        # Large single expense detection
        large_expenses = [
            r for r in expenses
            if _safe_decimal(r.get("amount")) > Decimal("200000")
            and str(r.get("status", "")).lower() == "pending"
        ]
        if large_expenses:
            alerts.append(_alert(
                alert_type="large_pending_expense",
                module="finance",
                severity="high",
                title=f"{len(large_expenses)} large pending expense(s) > ৳2L",
                detail=f"High-value expense IDs: {[r['id'] for r in large_expenses[:5]]}",
                recommended_action="Require dual approval for expenses above ৳2,00,000.",
            ))

    except Exception as exc:
        alerts.append(_alert(
            alert_type="finance_check_failed",
            module="finance",
            severity="low",
            title="Finance check encountered an error",
            detail=str(exc)[:300],
            recommended_action="Investigate finance module DB access.",
        ))

    return alerts


def _safe_decimal(value: object) -> Decimal:
    try:
        return Decimal(str(value or 0))
    except InvalidOperation:
        return Decimal("0")


# ---------------------------------------------------------------------------
# Workforce intelligence
# ---------------------------------------------------------------------------

def _check_workforce() -> list[dict]:
    alerts: list[dict] = []
    if supabase_service is None:
        return alerts

    try:
        logs_res = supabase_service.table("worker_logs") \
            .select("attendance_status,work_date") \
            .order("work_date", desc=True) \
            .limit(200) \
            .execute()
        logs = logs_res.data or []

        if not logs:
            return alerts

        absent = sum(1 for r in logs if str(r.get("attendance_status", "")).lower() == "absent")
        present = sum(1 for r in logs if str(r.get("attendance_status", "")).lower() == "present")
        total = absent + present

        if total == 0:
            return alerts

        absent_ratio = absent / total

        if present < 5 or absent_ratio >= 0.50:
            alerts.append(_alert(
                alert_type="critical_worker_shortage",
                module="workforce",
                severity="critical",
                title=f"Critical workforce shortage — {present} present, {absent} absent",
                detail=f"Absence rate {absent_ratio:.0%} from last {total} log entries.",
                recommended_action="Immediately contact site supervisor. Consider emergency worker deployment.",
            ))
        elif absent_ratio >= 0.35:
            alerts.append(_alert(
                alert_type="high_absence_rate",
                module="workforce",
                severity="high",
                title=f"High worker absence rate: {absent_ratio:.0%}",
                detail=f"{absent} absent out of {total} recent records.",
                recommended_action="Review attendance patterns. Investigate cause of high absence.",
            ))

    except Exception as exc:
        alerts.append(_alert(
            alert_type="workforce_check_failed",
            module="workforce",
            severity="low",
            title="Workforce check encountered an error",
            detail=str(exc)[:300],
            recommended_action="Check worker_logs table access and RLS policies.",
        ))

    return alerts


# ---------------------------------------------------------------------------
# Materials intelligence
# ---------------------------------------------------------------------------

def _check_materials() -> list[dict]:
    alerts: list[dict] = []
    if supabase_service is None:
        return alerts

    try:
        res = supabase_service.table("material_logs") \
            .select("item_name,quantity,low_stock_threshold") \
            .limit(300) \
            .execute()
        rows = res.data or []

        low_items = []
        critical_items = []
        for row in rows:
            threshold = _safe_decimal(row.get("low_stock_threshold"))
            quantity = _safe_decimal(row.get("quantity"))
            if threshold <= 0:
                continue
            if quantity <= 0:
                critical_items.append(str(row.get("item_name") or "unknown"))
            elif quantity <= threshold:
                low_items.append(str(row.get("item_name") or "unknown"))

        if critical_items:
            alerts.append(_alert(
                alert_type="material_stockout",
                module="materials",
                severity="critical",
                title=f"{len(critical_items)} material(s) completely out of stock",
                detail=f"Zero-stock items: {', '.join(critical_items[:5])}",
                recommended_action="Place emergency purchase order for zero-stock materials immediately.",
            ))

        if low_items:
            alerts.append(_alert(
                alert_type="low_material_stock",
                module="materials",
                severity="medium",
                title=f"{len(low_items)} material(s) below reorder threshold",
                detail=f"Low-stock items: {', '.join(low_items[:5])}",
                recommended_action="Initiate purchase orders for low-stock materials to avoid site stoppage.",
            ))

    except Exception as exc:
        alerts.append(_alert(
            alert_type="materials_check_failed",
            module="materials",
            severity="low",
            title="Materials check encountered an error",
            detail=str(exc)[:300],
            recommended_action="Verify material_logs table schema and RLS.",
        ))

    return alerts


# ---------------------------------------------------------------------------
# Project delay intelligence
# ---------------------------------------------------------------------------

def _check_projects() -> list[dict]:
    alerts: list[dict] = []
    if supabase_service is None:
        return alerts

    try:
        res = supabase_service.table("projects") \
            .select("id,name,status,end_date") \
            .limit(300) \
            .execute()
        rows = res.data or []
        today = datetime.now(timezone.utc).date()

        overdue: list[str] = []
        near_deadline: list[str] = []  # within 7 days

        for row in rows:
            status = str(row.get("status") or "").lower()
            if status in {"completed", "done", "closed", "cancelled"}:
                continue
            end_raw = row.get("end_date")
            if not end_raw:
                continue
            try:
                end_date = datetime.fromisoformat(str(end_raw)).date()
            except (ValueError, TypeError):
                continue

            days_left = (end_date - today).days
            name = str(row.get("name") or row.get("id") or "Unknown")
            if days_left < 0:
                overdue.append(f"{name} ({abs(days_left)}d overdue)")
            elif days_left <= 7:
                near_deadline.append(f"{name} ({days_left}d left)")

        if overdue:
            alerts.append(_alert(
                alert_type="project_overdue",
                module="projects",
                severity="high",
                title=f"{len(overdue)} project(s) past deadline",
                detail=", ".join(overdue[:5]),
                recommended_action="Schedule project review meeting. Update timelines or escalate to client.",
            ))

        if near_deadline:
            alerts.append(_alert(
                alert_type="project_deadline_approaching",
                module="projects",
                severity="medium",
                title=f"{len(near_deadline)} project(s) deadline within 7 days",
                detail=", ".join(near_deadline[:5]),
                recommended_action="Confirm deliverables on track. Prepare client update.",
            ))

    except Exception as exc:
        alerts.append(_alert(
            alert_type="project_check_failed",
            module="projects",
            severity="low",
            title="Project deadline check encountered an error",
            detail=str(exc)[:300],
            recommended_action="Check projects table access.",
        ))

    return alerts


# ---------------------------------------------------------------------------
# Security / audit intelligence
# ---------------------------------------------------------------------------

def _check_security() -> list[dict]:
    alerts: list[dict] = []
    if supabase_service is None:
        return alerts

    try:
        # Detect repeated failed login signals via audit_logs
        res = supabase_service.table("audit_logs") \
            .select("action,user_id,created_at") \
            .eq("action", "login_failed") \
            .order("created_at", desc=True) \
            .limit(100) \
            .execute()
        logs = res.data or []

        # Count per user
        from collections import Counter
        user_counts: Counter[str] = Counter(
            str(r.get("user_id") or "unknown") for r in logs
        )
        brute_force_candidates = [
            uid for uid, count in user_counts.items() if count >= 5
        ]
        if brute_force_candidates:
            alerts.append(_alert(
                alert_type="brute_force_detected",
                module="security",
                severity="critical",
                title=f"Possible brute-force: {len(brute_force_candidates)} account(s)",
                detail=f"Accounts with ≥5 failed logins: {brute_force_candidates[:5]}",
                recommended_action="Lock suspicious accounts. Enable 2FA. Review IP allowlist.",
            ))

    except Exception:
        # audit_logs may not be accessible — silently skip security check
        pass

    return alerts


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def run_system_scan() -> dict:
    """
    Run all monitoring checks and return consolidated alert report.
    Returns:
        {
          "scanned_at": ISO timestamp,
          "total_alerts": int,
          "critical_count": int,
          "high_count": int,
          "alerts": [list of alert dicts],
          "summary": str  (human-readable one-liner)
        }
    """
    all_alerts: list[dict] = []

    all_alerts.extend(_probe_tables())
    all_alerts.extend(_check_finance())
    all_alerts.extend(_check_workforce())
    all_alerts.extend(_check_materials())
    all_alerts.extend(_check_projects())
    all_alerts.extend(_check_security())

    # Sort: critical first, then high, medium, low, info
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}
    all_alerts.sort(key=lambda a: severity_order.get(a["severity"], 5))

    critical_count = sum(1 for a in all_alerts if a["severity"] == "critical")
    high_count = sum(1 for a in all_alerts if a["severity"] == "high")
    medium_count = sum(1 for a in all_alerts if a["severity"] == "medium")

    if critical_count > 0:
        summary = f"CRITICAL: {critical_count} critical issue(s) require immediate attention."
    elif high_count > 0:
        summary = f"WARNING: {high_count} high-severity issue(s) detected."
    elif medium_count > 0:
        summary = f"NOTICE: {medium_count} medium-severity item(s) to review."
    else:
        summary = "All systems nominal. No significant issues detected."

    return {
        "scanned_at": _now_iso(),
        "total_alerts": len(all_alerts),
        "critical_count": critical_count,
        "high_count": high_count,
        "medium_count": medium_count,
        "alerts": all_alerts,
        "summary": summary,
    }
