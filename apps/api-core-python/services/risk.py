from datetime import datetime, timedelta, timezone
from decimal import Decimal

from core.supabase import supabase_service


def _recent_expenses(limit: int = 500) -> list[dict]:
    if supabase_service is None:
        return []
    rows = (
        supabase_service.table("expenses")
        .select("id,account_id,amount,description,status,created_at")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return rows.data or []


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


def detect_risk(amount: Decimal, account_id: str) -> dict:
    expenses = _recent_expenses()
    now = datetime.now(timezone.utc)
    recent_30d = [
        Decimal(str(row["amount"]))
        for row in expenses
        if row.get("account_id") == account_id and (dt := _parse_dt(row.get("created_at"))) and dt >= now - timedelta(days=30)
    ]
    repeated_7d = [
        row
        for row in expenses
        if row.get("account_id") == account_id
        and Decimal(str(row["amount"])) == amount
        and (dt := _parse_dt(row.get("created_at")))
        and dt >= now - timedelta(days=7)
    ]

    score = 0
    reasons: list[str] = []

    if amount > Decimal("100000"):
        score += 30
        reasons.append("large_amount")

    avg_amount = (sum(recent_30d) / Decimal(len(recent_30d))) if recent_30d else Decimal("0")
    if avg_amount > 0 and amount > (avg_amount * Decimal("2.5")):
        score += 40
        reasons.append("spike_vs_30d_avg")

    if len(repeated_7d) >= 3:
        score += 20
        reasons.append("repeated_same_amount")

    status = "low"
    if score >= 60:
        status = "high"
    elif score >= 30:
        status = "medium"

    return {"risk_score": score, "risk_level": status, "reasons": reasons}


def financial_anomalies() -> list[dict]:
    expenses = _recent_expenses()
    now = datetime.now(timezone.utc)
    grouped: dict[str, list[Decimal]] = {}
    for row in expenses:
        dt = _parse_dt(row.get("created_at"))
        if not dt or dt < now - timedelta(days=30):
            continue
        grouped.setdefault(str(row.get("account_id")), []).append(Decimal(str(row["amount"])))

    anomalies: list[dict] = []
    for row in expenses:
        account_id = str(row.get("account_id"))
        samples = grouped.get(account_id, [])
        avg_amount = (sum(samples) / Decimal(len(samples))) if samples else Decimal("0")
        current_amount = Decimal(str(row["amount"]))
        if avg_amount > 0 and current_amount > (avg_amount * Decimal("2.5")):
            anomalies.append(
                {
                    "id": row["id"],
                    "amount": row["amount"],
                    "account_id": row.get("account_id"),
                    "description": row.get("description"),
                    "created_at": row.get("created_at"),
                }
            )
    return anomalies[:50]


def dashboard_metrics() -> dict:
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

    accounts = supabase_service.table("fund_accounts").select("balance").limit(1000).execute()
    sales = supabase_service.table("sales").select("total_amount,created_at").limit(1000).execute()
    workers = supabase_service.table("workers").select("id").limit(1000).execute()
    projects = supabase_service.table("projects").select("id").limit(1000).execute()
    expenses = (
        supabase_service.table("expenses")
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
