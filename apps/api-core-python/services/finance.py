import logging
import re
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from core.auth import UserContext
from core.supabase import supabase_service
from schemas.finance import ApprovalAction, ExpenseCreate, FundTransfer

logger = logging.getLogger(__name__)


def score_risk(amount: Decimal) -> dict[str, int | str | list[str]]:
    score = 0
    reasons: list[str] = []
    if amount >= Decimal("100000"):
        score += 70
        reasons.append("large_amount")
    elif amount >= Decimal("25000"):
        score += 35
        reasons.append("medium_amount")

    if score >= 60:
        level = "high"
    elif score >= 30:
        level = "medium"
    else:
        level = "low"
    return {"risk_score": score, "risk_level": level, "reasons": reasons}


def transfer_funds_atomic(payload: FundTransfer, user: UserContext) -> dict[str, str | int | None]:
    if not re.match(r"^[a-zA-Z0-9\-_\s]{1,100}$", payload.reference or ""):
        raise ValueError("Reference contains invalid characters")
    if payload.from_account_id == payload.to_account_id:
        raise ValueError("Source and destination accounts must differ")

    amount = Decimal(payload.amount)
    if amount <= 0:
        raise ValueError("Amount must be greater than zero")
    if amount > Decimal("10000000"):
        raise ValueError("Amount exceeds maximum transfer limit")
    if supabase_service is None:
        raise RuntimeError("Supabase service client is not configured")

    try:
        result = supabase_service.rpc(
            "transfer_funds_atomic",
            {
                "p_from_account_id": payload.from_account_id,
                "p_to_account_id": payload.to_account_id,
                "p_amount": str(amount),
                "p_reference": payload.reference[:100],
                "p_actor_user_id": user.user_id,
                "p_actor_role": user.role,
            },
        ).execute()
    except Exception as exc:  # noqa: BLE001
        logger.exception("finance_transfer_rpc_failed user_id=%s", user.user_id)
        raise RuntimeError("Atomic transfer failed") from exc

    if not result.data:
        raise RuntimeError("Atomic transfer returned no data")

    transfer_result = result.data[0] if isinstance(result.data, list) else result.data
    return {
        "message": "transfer completed",
        "transaction_id": transfer_result.get("transaction_id"),
        "from_balance": transfer_result.get("from_balance"),
        "to_balance": transfer_result.get("to_balance"),
    }


def create_expense_atomic(payload: ExpenseCreate, user: UserContext) -> dict[str, object]:
    if supabase_service is None:
        raise RuntimeError("Supabase service client is not configured")

    risk = score_risk(Decimal(payload.amount))
    try:
        result = supabase_service.rpc(
            "create_expense_atomic",
            {
                "p_account_id": payload.account_id,
                "p_category_id": payload.category_id,
                "p_amount": str(payload.amount),
                "p_description": payload.description,
                "p_maker_id": user.user_id,
                "p_risk_level": risk["risk_level"],
                "p_risk_score": risk["risk_score"],
            },
        ).execute()
    except Exception as exc:  # noqa: BLE001
        logger.exception("finance_create_expense_rpc_failed user_id=%s", user.user_id)
        raise RuntimeError("Expense creation failed") from exc

    if not result.data:
        raise RuntimeError("Expense creation returned no data")

    row = result.data[0] if isinstance(result.data, list) else result.data
    return {"id": row.get("expense_id"), "risk": risk, "status": row.get("status", "pending")}


def approve_expense_atomic(expense_id: str, payload: ApprovalAction, user: UserContext) -> dict[str, str]:
    if supabase_service is None:
        raise RuntimeError("Supabase service client is not configured")

    try:
        supabase_service.rpc(
            "approve_expense_atomic",
            {
                "p_expense_id": expense_id,
                "p_decision": payload.decision,
                "p_note": payload.note,
                "p_checker_id": user.user_id,
                "p_checker_role": user.role,
            },
        ).execute()
    except Exception as exc:  # noqa: BLE001
        logger.exception("finance_approve_expense_rpc_failed user_id=%s expense_id=%s", user.user_id, expense_id)
        raise RuntimeError("Expense approval failed") from exc

    return {"message": f"expense {payload.decision}"}


def _parse_dt(raw: str | None) -> datetime | None:
    if not raw:
        return None
    try:
        parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    except ValueError:
        return None


def dashboard_metrics() -> dict:
    """Cross-module KPI summary for the ERP dashboard."""
    if supabase_service is None:
        return {
            "total_balance": 0,
            "fund_balance": 0,
            "monthly_sales": 0,
            "total_expenses": 0,
            "pending_expenses": 0,
            "total_workers": 0,
            "total_projects": 0,
            "recent_expenses": [],
        }

    try:
        rpc = supabase_service.rpc("dashboard_metrics").execute()
        payload = rpc.data
        if isinstance(payload, list):
            payload = payload[0] if payload else None
        if isinstance(payload, dict):
            return {
                "total_balance": Decimal(str(payload.get("total_balance") or 0)),
                "fund_balance": Decimal(str(payload.get("fund_balance") or 0)),
                "monthly_sales": Decimal(str(payload.get("monthly_sales") or 0)),
                "total_expenses": Decimal(str(payload.get("total_expenses") or 0)),
                "pending_expenses": int(payload.get("pending_expenses") or 0),
                "total_workers": int(payload.get("total_workers") or 0),
                "total_projects": int(payload.get("total_projects") or 0),
                "recent_expenses": payload.get("recent_expenses") or [],
            }
    except Exception:
        pass

    _FALLBACK_ZERO = {
        "total_balance": Decimal("0"),
        "fund_balance": Decimal("0"),
        "monthly_sales": Decimal("0"),
        "total_expenses": Decimal("0"),
        "pending_expenses": 0,
        "total_workers": 0,
        "total_projects": 0,
        "recent_expenses": [],
    }

    def _fallback_queries() -> dict:
        _svc = supabase_service  # local ref, already checked non-None above
        accounts = _svc.table("fund_accounts").select("balance").limit(1000).execute()
        sales = _svc.table("sales").select("total_amount,created_at").limit(1000).execute()
        workers = _svc.table("workers").select("id").limit(1000).execute()
        projects = _svc.table("projects").select("id").limit(1000).execute()
        expenses = (
            _svc.table("expenses")
            .select("id,amount,description,status,created_at")
            .order("created_at", desc=True)
            .limit(200)
            .execute()
        )
        now = datetime.now(timezone.utc)
        monthly_sales = Decimal("0")
        for row in (sales.data or []):
            dt = _parse_dt(row.get("created_at"))
            if dt and dt >= now - timedelta(days=30):
                monthly_sales += Decimal(str(row["total_amount"]))
        pending_expenses = sum(1 for row in (expenses.data or []) if row.get("status") == "pending")
        total_balance = sum(Decimal(str(row["balance"])) for row in (accounts.data or []))
        total_expenses = sum(Decimal(str(row["amount"])) for row in (expenses.data or []))
        return {
            "total_balance": total_balance,
            "fund_balance": total_balance,
            "monthly_sales": monthly_sales,
            "total_expenses": total_expenses,
            "pending_expenses": pending_expenses,
            "total_workers": len(workers.data or []),
            "total_projects": len(projects.data or []),
            "recent_expenses": (expenses.data or [])[:10],
        }

    try:
        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_fallback_queries)
            return future.result(timeout=5)
    except (FuturesTimeoutError, Exception):
        logger.warning("dashboard_metrics fallback timed out or failed; returning zeros")
        return _FALLBACK_ZERO