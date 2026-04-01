from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException

from core.auth import UserContext, get_current_user, require_roles
from core.supabase import supabase_service
from schemas.finance import ApprovalAction, ExpenseCreate, FundTransfer
from services.finance import approve_expense_atomic, create_expense_atomic, score_risk, transfer_funds_atomic

router = APIRouter()


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
        return transfer_funds_atomic(payload, user)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/expenses")
async def create_expense(payload: ExpenseCreate, user: UserContext = Depends(require_roles("admin", "maker"))):
    try:
        return create_expense_atomic(payload, user)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/expenses/{expense_id}/approve")
async def approve_expense(expense_id: str, payload: ApprovalAction, user: UserContext = Depends(require_roles("admin", "checker"))):
    try:
        return approve_expense_atomic(expense_id, payload, user)
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
        .select("id,account_id,category_id,amount,description,status,maker_id,checker_id,risk_level,risk_score,created_at")
        .order("created_at", desc=True)
        .limit(limit + 1)
        .offset(offset)
    )
    if user.role not in ("admin", "checker"):
        query = query.eq("maker_id", user.user_id)
    rows = query.execute()
    data = rows.data or []
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
        .select("id,account_id,category_id,amount,description,status,maker_id,checker_id,risk_level,risk_score,approval_note,approved_at,created_at")
        .eq("id", expense_id)
        .limit(1)
        .execute()
    )
    if not row.data:
        raise HTTPException(status_code=404, detail="Expense not found")
    expense = row.data[0]
    if user.role not in ("admin", "checker") and user.user_id not in (str(expense.get("maker_id")), str(expense.get("checker_id"))):
        raise HTTPException(status_code=403, detail="Insufficient role")
    return expense


@router.patch("/expenses/{expense_id}")
async def update_expense(expense_id: str, payload: ExpenseCreate, user: UserContext = Depends(require_roles("admin", "maker"))):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    expense = supabase_service.table("expenses").select("id,maker_id,status").eq("id", expense_id).limit(1).execute()
    if not expense.data:
        raise HTTPException(status_code=404, detail="Expense not found")
    expense_row = expense.data[0]
    if expense_row["status"] != "pending":
        raise HTTPException(status_code=400, detail="Only pending expenses can be updated")
    if user.role != "admin" and str(expense_row["maker_id"]) != user.user_id:
        raise HTTPException(status_code=403, detail="Only the maker can update this expense")

    risk = score_risk(Decimal(payload.amount))
    supabase_service.table("expenses").update(
        {
            "account_id": payload.account_id,
            "category_id": payload.category_id,
            "amount": str(payload.amount),
            "description": payload.description,
            "risk_level": risk["risk_level"],
            "risk_score": risk["risk_score"],
        }
    ).eq("id", expense_id).execute()

    return {"message": "expense updated"}


@router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, user: UserContext = Depends(require_roles("admin", "maker"))):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    expense = supabase_service.table("expenses").select("id,maker_id,status").eq("id", expense_id).limit(1).execute()
    if not expense.data:
        raise HTTPException(status_code=404, detail="Expense not found")
    expense_row = expense.data[0]
    if expense_row["status"] != "pending":
        raise HTTPException(status_code=400, detail="Only pending expenses can be deleted")
    if user.role != "admin" and str(expense_row["maker_id"]) != user.user_id:
        raise HTTPException(status_code=403, detail="Only the maker can delete this expense")

    supabase_service.table("approvals").delete().eq("entity_type", "expense").eq("entity_id", expense_id).execute()
    supabase_service.table("expenses").delete().eq("id", expense_id).execute()

    return {"message": "expense deleted"}


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
