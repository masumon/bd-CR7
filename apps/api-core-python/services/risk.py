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


def operational_alerts() -> dict:
    metrics = dashboard_metrics()

    fund_balance = Decimal(str(metrics.get("fund_balance") or 0))
    total_expenses = Decimal(str(metrics.get("total_expenses") or 0))
    pending_expenses = int(metrics.get("pending_expenses") or 0)

    budget_pressure = bool(fund_balance > 0 and total_expenses >= fund_balance * Decimal("0.85"))
    budget_backlog = pending_expenses >= 8
    budget_alert = budget_pressure or budget_backlog

    worker_shortage = False
    workforce_note = "workforce data unavailable"
    if supabase_service is not None:
        try:
            worker_logs = (
                supabase_service.table("worker_logs")
                .select("attendance_status,work_date")
                .order("work_date", desc=True)
                .limit(120)
                .execute()
            )
            logs = worker_logs.data or []
            recent = [row for row in logs if row.get("attendance_status")]
            absent = sum(1 for row in recent if str(row.get("attendance_status")).lower() == "absent")
            present = sum(1 for row in recent if str(row.get("attendance_status")).lower() == "present")
            sample = len(recent)
            absent_ratio = (absent / sample) if sample else 0
            worker_shortage = sample > 0 and (present < 10 or absent_ratio >= 0.35)
            workforce_note = f"present={present}, absent={absent}, sample={sample}"
        except Exception:
            workforce_note = "worker log check failed"

    material_warning = False
    material_note = "material data unavailable"
    if supabase_service is not None:
        try:
            material_logs = (
                supabase_service.table("material_logs")
                .select("item_name,quantity,low_stock_threshold")
                .limit(200)
                .execute()
            )
            low_items = []
            for row in (material_logs.data or []):
                threshold = row.get("low_stock_threshold")
                quantity = row.get("quantity")
                if threshold is None or quantity is None:
                    continue
                try:
                    if Decimal(str(quantity)) <= Decimal(str(threshold)):
                        low_items.append(str(row.get("item_name") or "unknown"))
                except Exception:
                    continue
            material_warning = len(low_items) > 0
            material_note = ", ".join(low_items[:3]) if low_items else "stock healthy"
        except Exception:
            material_note = "material check failed"

    delay_prediction = False
    delay_note = "project schedule data unavailable"
    if supabase_service is not None:
        try:
            projects = (
                supabase_service.table("projects")
                .select("id,name,status,end_date")
                .limit(200)
                .execute()
            )
            now_date = datetime.now(timezone.utc).date()
            overdue = 0
            for row in (projects.data or []):
                end_date = row.get("end_date")
                status = str(row.get("status") or "").lower()
                if not end_date or status in {"completed", "done", "closed"}:
                    continue
                try:
                    if datetime.fromisoformat(str(end_date)).date() < now_date:
                        overdue += 1
                except Exception:
                    continue
            delay_prediction = overdue > 0
            delay_note = f"overdue_projects={overdue}"
        except Exception:
            delay_note = "delay signal check failed"

    return {
        "budget_alert": budget_alert,
        "worker_shortage": worker_shortage,
        "material_warning": material_warning,
        "delay_prediction": delay_prediction,
        "notes": {
            "budget": f"expense={total_expenses}, fund={fund_balance}, pending={pending_expenses}",
            "workforce": workforce_note,
            "materials": material_note,
            "delay": delay_note,
        },
    }
