from decimal import Decimal
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException

from core.auth import UserContext, get_current_user, require_roles
from core.supabase import supabase_service
from schemas.finance import ApprovalAction, ExpenseCreate, FundTransfer

router = APIRouter()


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
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    if payload.from_account_id == payload.to_account_id:
        raise HTTPException(status_code=400, detail="Source and destination accounts must differ")
    amount = Decimal(payload.amount)
    try:
        result = supabase_service.rpc(
            "transfer_funds_atomic",
            {
                "p_from_account_id": payload.from_account_id,
                "p_to_account_id": payload.to_account_id,
                "p_amount": str(amount),
                "p_reference": payload.reference,
                "p_actor_user_id": user.user_id,
                "p_actor_role": user.role,
            },
        ).execute()
        if result.data:
            transfer_result = result.data[0] if isinstance(result.data, list) else result.data
            return {
                "message": "transfer completed",
                "transaction_id": transfer_result.get("transaction_id"),
                "from_balance": transfer_result.get("from_balance"),
                "to_balance": transfer_result.get("to_balance"),
            }
    except Exception:
        pass

    accounts = (
        supabase_service.table("fund_accounts")
        .select("id,balance,owner_user_id")
        .in_("id", [payload.from_account_id, payload.to_account_id])
        .execute()
    )
    account_map = {row["id"]: row for row in (accounts.data or [])}
    source = account_map.get(payload.from_account_id)
    target = account_map.get(payload.to_account_id)
    if not source or not target:
        raise HTTPException(status_code=404, detail="Account not found")
    if user.role not in ("admin", "checker") and str(source.get("owner_user_id")) != user.user_id:
        raise HTTPException(status_code=403, detail="Insufficient role for source account")

    source_balance = Decimal(str(source["balance"]))
    target_balance = Decimal(str(target["balance"]))
    if source_balance < amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")

    transaction_id = str(uuid4())
    next_source_balance = source_balance - amount
    next_target_balance = target_balance + amount
    supabase_service.table("fund_accounts").update({"balance": str(next_source_balance)}).eq("id", payload.from_account_id).execute()
    supabase_service.table("fund_accounts").update({"balance": str(next_target_balance)}).eq("id", payload.to_account_id).execute()
    supabase_service.table("fund_transactions").insert(
        {
            "id": transaction_id,
            "from_account_id": payload.from_account_id,
            "to_account_id": payload.to_account_id,
            "amount": str(amount),
            "reference": payload.reference,
            "created_by": user.user_id,
        }
    ).execute()
    return {
        "message": "transfer completed",
        "transaction_id": transaction_id,
        "from_balance": str(next_source_balance),
        "to_balance": str(next_target_balance),
    }


@router.post("/expenses")
async def create_expense(payload: ExpenseCreate, user: UserContext = Depends(require_roles("admin", "maker"))):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    risk = score_risk(Decimal(payload.amount))
    expense_id = str(uuid4())

    account = supabase_service.table("fund_accounts").select("id").eq("id", payload.account_id).limit(1).execute()
    if not account.data:
        raise HTTPException(status_code=404, detail="Account not found")

    supabase_service.table("expenses").insert(
        {
            "id": expense_id,
            "account_id": payload.account_id,
            "category_id": payload.category_id,
            "amount": str(payload.amount),
            "description": payload.description,
            "status": "pending",
            "maker_id": user.user_id,
            "risk_level": risk["risk_level"],
            "risk_score": risk["risk_score"],
        }
    ).execute()
    supabase_service.table("approvals").insert(
        {
            "id": str(uuid4()),
            "entity_type": "expense",
            "entity_id": expense_id,
            "status": "pending",
            "maker_id": user.user_id,
        }
    ).execute()

    return {"id": expense_id, "risk": risk, "status": "pending"}


@router.post("/expenses/{expense_id}/approve")
async def approve_expense(expense_id: str, payload: ApprovalAction, user: UserContext = Depends(require_roles("admin", "checker"))):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    expense_res = (
        supabase_service.table("expenses")
        .select("id,amount,account_id,maker_id,status")
        .eq("id", expense_id)
        .limit(1)
        .execute()
    )
    if not expense_res.data:
        raise HTTPException(status_code=404, detail="Expense not found")
    expense = expense_res.data[0]
    if expense["status"] != "pending":
        raise HTTPException(status_code=400, detail="Expense is already processed")
    if str(expense["maker_id"]) == user.user_id:
        raise HTTPException(status_code=400, detail="Maker cannot approve own expense")

    supabase_service.table("expenses").update(
        {
            "status": payload.decision,
            "checker_id": user.user_id,
            "approval_note": payload.note,
            "approved_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("id", expense_id).execute()
    supabase_service.table("approvals").update(
        {
            "status": payload.decision,
            "checker_id": user.user_id,
            "checker_note": payload.note,
            "decided_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("entity_type", "expense").eq("entity_id", expense_id).execute()

    if payload.decision == "approved":
        account = (
            supabase_service.table("fund_accounts")
            .select("id,balance")
            .eq("id", expense["account_id"])
            .limit(1)
            .execute()
        )
        if account.data:
            current_balance = Decimal(str(account.data[0]["balance"]))
            next_balance = current_balance - Decimal(str(expense["amount"]))
            supabase_service.table("fund_accounts").update({"balance": str(next_balance)}).eq("id", expense["account_id"]).execute()

    return {"message": f"expense {payload.decision}"}


@router.get("/expenses")
async def list_expenses(user: UserContext = Depends(get_current_user)):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    query = (
        supabase_service.table("expenses")
        .select("id,account_id,category_id,amount,description,status,maker_id,checker_id,risk_level,risk_score,created_at")
        .order("created_at", desc=True)
        .limit(200)
    )
    if user.role not in ("admin", "checker"):
        query = query.eq("maker_id", user.user_id)
    rows = query.execute()
    return rows.data or []


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
