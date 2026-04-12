from datetime import datetime, timezone
from decimal import Decimal
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException

from core.audit import audit_log
from core.auth import UserContext, get_current_user, require_roles
from core.supabase import supabase_service
from schemas.finance import ApprovalAction, ExpenseCreate, ExpenseUpdate, FundEntryCreate, FundTransfer, ManualExpenseCreate
from services.finance import approve_expense_atomic, create_expense_atomic, dashboard_metrics, score_risk, transfer_funds_atomic

router = APIRouter()

SENSITIVE_RISK_THRESHOLD = 80
SENSITIVE_AMOUNT_THRESHOLD = Decimal("100000")


def _is_sensitive_expense(expense_row: dict) -> bool:
    risk_score = int(expense_row.get("risk_score") or 0)
    amount = Decimal(str(expense_row.get("amount") or "0"))
    return risk_score >= SENSITIVE_RISK_THRESHOLD or amount >= SENSITIVE_AMOUNT_THRESHOLD


def _find_sensitive_approval(entity_type: str, expense_id: str):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    return (
        supabase_service.table("pending_approvals")
        .select("id,status,required_approvals,approval_count,first_approver_id,second_approver_id,operation,operation_payload")
        .eq("entity_type", entity_type)
        .eq("entity_id", expense_id)
        .limit(1)
        .execute()
    )


def _create_sensitive_approval(entity_type: str, expense_id: str, actor_id: str, operation: str, payload: dict):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    approval_id = str(uuid4())
    supabase_service.table("pending_approvals").upsert(
        {
            "id": approval_id,
            "entity_type": entity_type,
            "entity_id": expense_id,
            "suggested_action": "review",
            "risk_score": 100,
            "reason": "Sensitive operation requires dual-admin approval",
            "status": "pending",
            "suggested_by": "policy_engine",
            "required_approvals": 2,
            "approval_count": 1,
            "first_approver_id": actor_id,
            "second_approver_id": None,
            "operation": operation,
            "operation_payload": payload,
            "sensitive": True,
            "last_actor_id": actor_id,
            "resolved_at": None,
        },
        on_conflict="entity_type,entity_id",
    ).execute()
    return approval_id


def _mark_sensitive_approved(approval_id: str, actor_id: str):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    supabase_service.table("pending_approvals").update(
        {
            "approval_count": 2,
            "second_approver_id": actor_id,
            "status": "applied",
            "last_actor_id": actor_id,
            "resolved_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("id", approval_id).execute()


@router.get("/accounts")
async def list_accounts(user: UserContext = Depends(get_current_user)):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    query = (
        supabase_service.table("fund_accounts")
        .select("id,account_name,currency,balance,owner_user_id")
        .order("account_name")
    )
    if user.role not in ("admin", "checker"):
        query = query.eq("owner_user_id", user.user_id)
    rows = query.execute()
    return rows.data or []


@router.post("/transfer")
async def transfer_funds(payload: FundTransfer, user: UserContext = Depends(require_roles("admin", "maker"))):
    try:
        result = transfer_funds_atomic(payload, user)
        audit_log(
            user_id=user.user_id, action="fund.transfer",
            entity_type="fund_transaction", entity_id=str(result.get("transaction_id") or ""),
            meta={"from": payload.from_account_id, "to": payload.to_account_id, "amount": str(payload.amount)},
        )
        return result
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/fund-entries")
async def create_fund_entry(payload: FundEntryCreate, user: UserContext = Depends(require_roles("admin", "maker"))):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    account = (
        supabase_service.table("fund_accounts")
        .select("id,owner_user_id")
        .eq("id", payload.account_id)
        .limit(1)
        .execute()
    )
    if not account.data:
        raise HTTPException(status_code=404, detail="Account not found")
    if user.role not in ("admin", "checker") and str(account.data[0].get("owner_user_id")) != user.user_id:
        raise HTTPException(status_code=403, detail="Insufficient role")

    amount = Decimal(payload.amount)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")

    transaction_id = str(uuid4())
    try:
        # Credit the account balance atomically via RPC, then record the transaction.
        # This ensures the balance update and the transaction log are consistent.
        supabase_service.rpc(
            "credit_fund_account",
            {
                "p_account_id": payload.account_id,
                "p_amount": str(amount),
                "p_actor_user_id": user.user_id,
            },
        ).execute()
    except Exception as exc:  # noqa: BLE001
        # Fallback: update balance directly if RPC is not yet deployed
        existing_account = (
            supabase_service.table("fund_accounts")
            .select("balance")
            .eq("id", payload.account_id)
            .limit(1)
            .execute()
        )
        if not existing_account.data:
            raise HTTPException(status_code=404, detail="Account not found") from exc
        current_balance = Decimal(str(existing_account.data[0].get("balance") or 0))
        new_balance = current_balance + amount
        supabase_service.table("fund_accounts").update(
            {"balance": str(new_balance)}
        ).eq("id", payload.account_id).execute()

    supabase_service.table("fund_transactions").insert(
        {
            "id": transaction_id,
            "from_account_id": None,
            "to_account_id": payload.account_id,
            "amount": str(amount),
            "reference": payload.reference,
            "created_by": user.user_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "metadata": {
                "entry_type": "credit",
                "description": payload.description,
                "receipt_url": payload.receipt_url,
                "transaction_date": payload.transaction_date,
                "source_sender": payload.source_sender,
                "payment_method": payload.payment_method,
            },
        }
    ).execute()

    audit_log(
        user_id=user.user_id,
        action="fund.entry.create",
        entity_type="fund_transaction",
        entity_id=transaction_id,
        meta={"account_id": payload.account_id, "amount": str(amount)},
    )
    return {"id": transaction_id, "message": "fund entry created"}


@router.post("/expenses")
async def create_expense(payload: ExpenseCreate, user: UserContext = Depends(require_roles("admin", "maker"))):
    try:
        result = create_expense_atomic(payload, user)
        audit_log(
            user_id=user.user_id, action="expense.create",
            entity_type="expense", entity_id=str(result.get("id") or ""),
            meta={"amount": str(payload.amount), "account_id": payload.account_id, "risk": result.get("risk")},
        )
        return result
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/expenses/manual")
async def create_manual_expense(payload: ManualExpenseCreate, user: UserContext = Depends(require_roles("admin", "maker"))):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    account = (
        supabase_service.table("fund_accounts")
        .select("id,owner_user_id")
        .eq("id", payload.account_id)
        .limit(1)
        .execute()
    )
    if not account.data:
        raise HTTPException(status_code=404, detail="Account not found")
    if user.role not in ("admin", "checker") and str(account.data[0].get("owner_user_id")) != user.user_id:
        raise HTTPException(status_code=403, detail="Insufficient role")

    if payload.status == "approved":
        if not payload.approved_by:
            raise HTTPException(status_code=400, detail="approved_by is required for approved expenses")
        if payload.approved_by == user.user_id:
            raise HTTPException(status_code=403, detail="Maker and checker must differ")

    expense_id = str(uuid4())
    risk = score_risk(Decimal(payload.amount))
    row = {
        "id": expense_id,
        "account_id": payload.account_id,
        "category_id": None,
        "amount": str(payload.amount),
        "description": payload.description,
        "status": payload.status,
        "maker_id": user.user_id,
        "checker_id": payload.approved_by if payload.status == "approved" else None,
        "risk_level": risk["risk_level"],
        "risk_score": risk["risk_score"],
        "receipt_url": payload.receipt_url,
        "metadata": {
            "category": payload.category,
            "subcategory": payload.subcategory,
            "expense_date": payload.expense_date,
            "paid_by": payload.paid_by,
            "proof_file_id": payload.proof_file_id,
            "approval_status": payload.status,
            "approved_by": payload.approved_by if payload.status == "approved" else None,
        },
    }
    supabase_service.table("expenses").insert(row).execute()

    audit_log(
        user_id=user.user_id,
        action="expense.create",
        entity_type="expense",
        entity_id=expense_id,
        meta={"amount": str(payload.amount), "account_id": payload.account_id,
              "status": payload.status, "source": "manual"},
    )
    return {"id": expense_id, "status": payload.status, "risk": risk}


@router.post("/expenses/{expense_id}/approve")
async def approve_expense(expense_id: str, payload: ApprovalAction, user: UserContext = Depends(require_roles("admin", "checker"))):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    expense_check = (
        supabase_service.table("expenses")
        .select("id,maker_id,status")
        .eq("id", expense_id)
        .limit(1)
        .execute()
    )
    if not expense_check.data:
        raise HTTPException(status_code=404, detail="Expense not found")
    expense_row = expense_check.data[0]
    if str(expense_row.get("maker_id") or "") == user.user_id:
        raise HTTPException(status_code=403, detail="Self-approval is not permitted")
    if str(expense_row.get("status") or "") != "pending":
        raise HTTPException(status_code=400, detail="Only pending expenses can be approved or rejected")

    try:
        result = approve_expense_atomic(expense_id, payload, user)
        audit_log(
            user_id=user.user_id, action="expense.approve",
            entity_type="expense", entity_id=expense_id,
            meta={"decision": payload.decision, "note": payload.note},
        )
        return result
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/expenses")
async def list_expenses(user: UserContext = Depends(get_current_user), limit: int = 20, offset: int = 0):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    if limit <= 0 or limit > 500:
        limit = 20
    if offset < 0:
        offset = 0
    query = (
        supabase_service.table("expenses")
        .select("id,account_id,amount,category,description,status,created_by,approved_by,risk_score,created_at,metadata,receipt_url,is_deleted")
        .eq("is_deleted", False)
        .order("created_at", desc=True)
        .limit(limit + 1)
        .offset(offset)
    )
    if user.role not in ("admin", "checker"):
        query = query.eq("created_by", user.user_id)
    try:
        rows = query.execute()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail="Failed to fetch expenses") from exc

    raw_data = rows.data or []
    data = [
        {
            "id": row.get("id"),
            "account_id": row.get("account_id"),
            "category_id": row.get("category"),
            "amount": row.get("amount"),
            "description": row.get("description"),
            "status": row.get("status"),
            "maker_id": row.get("created_by"),
            "checker_id": row.get("approved_by"),
            "risk_level": row.get("metadata", {}).get("risk_level") if isinstance(row.get("metadata"), dict) else None,
            "risk_score": row.get("risk_score"),
            "created_at": row.get("created_at"),
            "metadata": row.get("metadata") or {},
            "receipt_url": row.get("receipt_url"),
        }
        for row in raw_data
    ]
    has_more = len(data) > limit
    return {
        "expenses": data[:limit],
        "has_more": has_more,
        "next_cursor": f"offset_{offset + limit}" if has_more else None,
    }


@router.get("/expenses/{expense_id}")
async def get_expense(expense_id: str, user: UserContext = Depends(get_current_user)):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    row = (
        supabase_service.table("expenses")
        .select("id,account_id,category,amount,description,status,created_by,approved_by,risk_score,metadata,created_at")
        .eq("id", expense_id)
        .limit(1)
        .execute()
    )
    if not row.data:
        raise HTTPException(status_code=404, detail="Expense not found")
    expense = row.data[0]
    if user.role not in ("admin", "checker") and user.user_id not in (str(expense.get("created_by")), str(expense.get("approved_by"))):
        raise HTTPException(status_code=403, detail="Insufficient role")
    return expense


@router.patch("/expenses/{expense_id}")
async def update_expense(expense_id: str, payload: ExpenseUpdate, user: UserContext = Depends(require_roles("admin"))):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    expense = supabase_service.table("expenses").select("id,maker_id,status,amount,risk_score").eq("id", expense_id).limit(1).execute()
    if not expense.data:
        raise HTTPException(status_code=404, detail="Expense not found")
    expense_row = expense.data[0]
    if expense_row["status"] != "pending":
        raise HTTPException(status_code=400, detail="Only pending expenses can be updated")

    risk = score_risk(Decimal(payload.amount))
    metadata: dict[str, str] = {}
    if payload.category:
        metadata["category"] = payload.category
    if payload.subcategory:
        metadata["subcategory"] = payload.subcategory

    update_payload: dict[str, Any] = {
        "amount": str(payload.amount),
        "status": payload.status,
        "description": payload.description,
        "risk_level": risk["risk_level"],
        "risk_score": risk["risk_score"],
    }
    if metadata:
        update_payload["metadata"] = metadata

    if _is_sensitive_expense(expense_row):
        approval_type = "expense_sensitive_update"
        approval_res = _find_sensitive_approval(approval_type, expense_id)
        approval = approval_res.data[0] if approval_res.data else None
        if not approval or str(approval.get("status")) != "pending":
            pending_id = _create_sensitive_approval(
                approval_type,
                expense_id,
                user.user_id,
                "update",
                {k: v for k, v in update_payload.items()},
            )
            return {
                "message": "Sensitive update queued. A second admin approval is required.",
                "requires_second_admin": True,
                "pending_id": pending_id,
            }
        if str(approval.get("first_approver_id") or "") == user.user_id:
            return {
                "message": "Awaiting second admin approval for this sensitive update.",
                "requires_second_admin": True,
                "pending_id": approval.get("id"),
            }
        stored_payload = approval.get("operation_payload") if isinstance(approval.get("operation_payload"), dict) else {}
        if stored_payload:
            update_payload = stored_payload
        _mark_sensitive_approved(str(approval.get("id")), user.user_id)

    supabase_service.table("expenses").update(
        update_payload
    ).eq("id", expense_id).execute()

    audit_log(
        user_id=user.user_id,
        action="expense.update",
        entity_type="expense",
        entity_id=expense_id,
        meta={"sensitive": str(_is_sensitive_expense(expense_row)).lower()},
    )

    return {"message": "expense updated"}


@router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, user: UserContext = Depends(require_roles("admin"))):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    expense = supabase_service.table("expenses").select("id,maker_id,status,amount,risk_score").eq("id", expense_id).limit(1).execute()
    if not expense.data:
        raise HTTPException(status_code=404, detail="Expense not found")
    expense_row = expense.data[0]
    if expense_row["status"] != "pending":
        raise HTTPException(status_code=400, detail="Only pending expenses can be deleted")

    if _is_sensitive_expense(expense_row):
        approval_type = "expense_sensitive_delete"
        approval_res = _find_sensitive_approval(approval_type, expense_id)
        approval = approval_res.data[0] if approval_res.data else None
        if not approval or str(approval.get("status")) != "pending":
            pending_id = _create_sensitive_approval(approval_type, expense_id, user.user_id, "delete", {"expense_id": expense_id})
            return {
                "message": "Sensitive delete queued. A second admin approval is required.",
                "requires_second_admin": True,
                "pending_id": pending_id,
            }
        if str(approval.get("first_approver_id") or "") == user.user_id:
            return {
                "message": "Awaiting second admin approval for this sensitive deletion.",
                "requires_second_admin": True,
                "pending_id": approval.get("id"),
            }
        _mark_sensitive_approved(str(approval.get("id")), user.user_id)

    supabase_service.table("pending_approvals").delete().eq("entity_type", "expense_sensitive_delete").eq("entity_id", expense_id).execute()
    supabase_service.table("pending_approvals").delete().eq("entity_type", "expense_sensitive_update").eq("entity_id", expense_id).execute()
    supabase_service.table("expenses").delete().eq("id", expense_id).execute()
    audit_log(
        user_id=user.user_id, action="expense.delete",
        entity_type="expense", entity_id=expense_id,
    )
    return {"message": "expense deleted"}


@router.get("/dashboard")
async def get_dashboard(user: UserContext = Depends(get_current_user)):
    """ERP KPI summary — fund balance, expenses, workers, projects."""
    return dashboard_metrics()


@router.get("/balance/{account_id}")
async def get_balance(account_id: str, user: UserContext = Depends(get_current_user)):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    query = (
        supabase_service.table("fund_accounts")
        .select("id,account_name,currency,balance,owner_user_id")
        .eq("id", account_id)
        .limit(1)
    )
    if user.role not in ("admin", "checker"):
        query = query.eq("owner_user_id", user.user_id)
    row = query.execute()
    if not row.data:
        raise HTTPException(status_code=404, detail="Account not found")
    payload = dict(row.data[0])
    payload.pop("owner_user_id", None)
    return payload
