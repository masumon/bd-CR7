import logging
import re
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
    if supabase_service is None:
        raise RuntimeError("Supabase service client is not configured")
    if not re.match(r"^[a-zA-Z0-9\-_\s]{1,100}$", payload.reference or ""):
        raise ValueError("Reference contains invalid characters")
    if payload.from_account_id == payload.to_account_id:
        raise ValueError("Source and destination accounts must differ")

    amount = Decimal(payload.amount)
    if amount <= 0:
        raise ValueError("Amount must be greater than zero")
    if amount > Decimal("10000000"):
        raise ValueError("Amount exceeds maximum transfer limit")

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