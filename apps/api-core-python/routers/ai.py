import json
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query

from core.auth import UserContext, get_current_user, require_roles
from core.db import fetch_all, tx
from core.supabase import supabase_service
from schemas.ai import ChatMessage, MemoryCreate
from services.risk import dashboard_metrics, financial_anomalies, operational_alerts

router = APIRouter()


@router.get("/integration-status")
async def integration_status(user: UserContext = Depends(get_current_user)):
    if supabase_service is None:
        return {
            "status": "degraded",
            "reason": "supabase_service_not_configured",
            "modules": {},
        }

    def check_table(table: str) -> tuple[bool, int]:
        try:
            res = supabase_service.table(table).select("id", count="exact").limit(1).execute()
            return True, int(res.count or 0)
        except Exception:
            return False, 0

    materials_ok, materials_count = check_table("material_logs")
    finance_ok, finance_count = check_table("expenses")
    payroll_ok, payroll_count = check_table("worker_logs")
    contractor_ok, contractor_count = check_table("contractor_contracts")
    project_ok, project_count = check_table("projects")

    module_flags = {
        "materials_to_finance": materials_ok and finance_ok,
        "workforce_to_payroll": payroll_ok,
        "contractor_to_finance": contractor_ok and finance_ok,
        "project_central": project_ok,
    }
    all_ok = all(module_flags.values())

    return {
        "status": "ok" if all_ok else "partial",
        "checks": module_flags,
        "counts": {
            "material_logs": materials_count,
            "expenses": finance_count,
            "worker_logs": payroll_count,
            "contractor_contracts": contractor_count,
            "projects": project_count,
        },
    }


def _log_ai_interaction(*, user_id: str, message: str, intent: str, response_text: str, metadata: dict | None = None) -> None:
    metadata_json = json.dumps(metadata or {}, ensure_ascii=False)
    try:
        with tx() as conn:
            conn.exec_driver_sql(
                """
                INSERT INTO ai_interactions (id, user_id, message, intent, response, metadata)
                VALUES (%s, %s, %s, %s, %s, %s::jsonb)
                """,
                (str(uuid4()), user_id, message, intent, response_text, metadata_json),
            )
    except Exception:
        # Keep chat API resilient even when audit logging is unavailable.
        return


def _format_currency(value: object) -> str:
    try:
        return f"৳{float(value or 0):,.2f}"
    except (TypeError, ValueError):
        return "৳0.00"


def _dashboard_reply(metrics: dict) -> str:
    recent = metrics.get("recent_expenses") or []
    latest_note = ""
    if recent:
        latest = recent[0]
        latest_note = f"\n- Latest expense: {latest.get('description') or 'General'} ({_format_currency(latest.get('amount'))})"

    return (
        "SUMONIX AI workspace summary:\n"
        f"- Fund balance: {_format_currency(metrics.get('fund_balance'))}\n"
        f"- 30-day sales: {_format_currency(metrics.get('monthly_sales'))}\n"
        f"- Total expenses tracked: {_format_currency(metrics.get('total_expenses'))}\n"
        f"- Pending expenses: {metrics.get('pending_expenses', 0)}\n"
        f"- Active workers logged: {metrics.get('total_workers', 0)}\n"
        f"- Projects in portfolio: {metrics.get('total_projects', 0)}"
        f"{latest_note}\n\n"
        "Ask for anomalies, finance summary, project status, or next-step guidance."
    )


@router.get("/anomalies")
async def get_anomalies(user: UserContext = Depends(require_roles("admin", "checker"))):
    return financial_anomalies()


@router.get("/dashboard")
async def get_dashboard(user: UserContext = Depends(get_current_user)):
    return dashboard_metrics()


@router.post("/memory")
async def add_ai_memory(payload: MemoryCreate, user: UserContext = Depends(require_roles("admin", "maker", "checker"))):
    memory_id = str(uuid4())
    # Format embedding as PostgreSQL vector literal: [f1,f2,...,fN]
    embedding_literal = "[" + ",".join(str(f) for f in payload.embedding) + "]"
    metadata_json = json.dumps(payload.metadata, ensure_ascii=False)

    with tx() as conn:
        conn.exec_driver_sql(
            """
            INSERT INTO ai_memory (id, content, embedding, metadata, created_by)
            VALUES (%s, %s, %s::vector, %s::jsonb, %s)
            """,
            (memory_id, payload.content, embedding_literal, metadata_json, user.user_id),
        )

    return {"id": memory_id}


@router.get("/memory/search")
async def search_memory(
    vector: str = Query(min_length=1, description="Comma-separated floats representing a 1536-dim embedding"),
    top_k: int = Query(default=5, ge=1, le=20),
    user: UserContext = Depends(get_current_user),
):
    # Validate and normalise vector string before it reaches SQL
    raw = vector.strip().lstrip("[").rstrip("]")
    try:
        parts = [float(x.strip()) for x in raw.split(",") if x.strip()]
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="vector must be a comma-separated list of floats") from exc
    if len(parts) != 1536:
        raise HTTPException(status_code=422, detail=f"vector must have 1536 dimensions, got {len(parts)}")
    safe_vector = "[" + ",".join(str(f) for f in parts) + "]"

    rows = fetch_all(
        """
        SELECT id, content, metadata
        FROM ai_memory
        ORDER BY embedding <-> CAST(:vector AS vector)
        LIMIT :top_k
        """,
        {"vector": safe_vector, "top_k": top_k},
    )
    return [dict(x) for x in rows]


@router.post("/chat")
async def ai_chat(payload: ChatMessage, user: UserContext = Depends(get_current_user)):
    message = payload.message.strip()

    normalized = message.lower()
    wants_greeting = any(keyword in normalized for keyword in ("hello", "hi", "hey", "assalamualaikum", "সালাম", "হ্যালো"))
    wants_anomaly = any(keyword in normalized for keyword in ("anomal", "risk", "suspicious", "ঝুঁকি", "অস্বাভাবিক"))
    wants_dashboard = any(keyword in normalized for keyword in ("dashboard", "summary", "overview", "balance", "সারসংক্ষেপ", "ব্যালেন্স"))
    wants_module_guide = any(keyword in normalized for keyword in ("module", "workspace", "what can you do", "কি করতে পারো", "কি কি আছে"))
    wants_operational_signal = any(
        keyword in normalized
        for keyword in (
            "budget",
            "shortage",
            "worker",
            "material",
            "delay",
            "forecast",
            "prediction",
            "বাজেট",
            "শ্রমিক",
            "উপকরণ",
            "বিলম্ব",
        )
    )

    if wants_greeting:
        reply = (
            "আমি SUMONIX AI। আমি finance summary, anomaly review, project snapshot, এবং module guidance দিতে পারি।\n\n"
            "I can help with dashboard summaries, risky expense signals, project context, and workflow guidance."
        )
        _log_ai_interaction(user_id=user.user_id, message=message, intent="general", response_text=reply)
        return {"reply": reply, "intent": "general"}

    if wants_module_guide:
        reply = (
            "Available workspaces:\n"
            "1. Dashboard: executive overview\n"
            "2. Project Intro: project identity and phases\n"
            "3. Site Progress: workers, materials, progress evidence\n"
            "4. Fund & Expense: cashflow and approvals\n"
            "5. Supply Chain: L/C and shipment records\n"
            "6. POS Workspace: catalog, cart, checkout, and sales history\n"
            "7. Reports: exports and analysis\n\n"
            "Ask me for a summary of any workspace and I will guide you."
        )
        _log_ai_interaction(user_id=user.user_id, message=message, intent="general", response_text=reply)
        return {"reply": reply, "intent": "general"}

    if wants_anomaly:
        anomalies = financial_anomalies()
        if not anomalies:
            reply = "No high-signal anomaly was found in recent expenses. Current records do not show a severe spike pattern."
            _log_ai_interaction(user_id=user.user_id, message=message, intent="anomalies", response_text=reply, metadata={"count": 0})
            return {"reply": reply, "intent": "anomalies", "count": 0}
        top = anomalies[:3]
        lines = [f"Found {len(anomalies)} anomalous expense records. Top signals:"]
        for idx, row in enumerate(top, 1):
            lines.append(
                f"{idx}. Expense {row.get('id')} amount {_format_currency(row.get('amount'))} (account: {row.get('account_id')})"
            )
        lines.append("Review the related account, receipt quality, and approval path before releasing payment.")
        reply = "\n".join(lines)
        _log_ai_interaction(user_id=user.user_id, message=message, intent="anomalies", response_text=reply, metadata={"count": len(anomalies)})
        return {"reply": reply, "intent": "anomalies", "count": len(anomalies), "items": top}

    if wants_operational_signal:
        signals = operational_alerts()
        lines = ["Operational signal scan:"]
        lines.append(f"- Budget alert: {'ON' if signals.get('budget_alert') else 'OFF'}")
        lines.append(f"- Worker shortage: {'YES' if signals.get('worker_shortage') else 'NO'}")
        lines.append(f"- Material warning: {'YES' if signals.get('material_warning') else 'NO'}")
        lines.append(f"- Delay prediction: {'RISK' if signals.get('delay_prediction') else 'STABLE'}")
        notes = signals.get("notes") or {}
        lines += ["", "Context:",
                  f"- Budget: {notes.get('budget', 'n/a')}",
                  f"- Workforce: {notes.get('workforce', 'n/a')}",
                  f"- Materials: {notes.get('materials', 'n/a')}",
                  f"- Delay: {notes.get('delay', 'n/a')}"]
        reply = "\n".join(lines)
        _log_ai_interaction(
            user_id=user.user_id, message=message, intent="operational_alerts", response_text=reply,
            metadata={k: signals.get(k, False) for k in ("budget_alert", "worker_shortage", "material_warning", "delay_prediction")},
        )
        return {"reply": reply, "intent": "operational_alerts", "signals": signals}

    metrics = dashboard_metrics()
    reply = _dashboard_reply(metrics)
    intent = "dashboard" if wants_dashboard else "general"
    _log_ai_interaction(user_id=user.user_id, message=message, intent=intent, response_text=reply, metadata={"has_metrics": True})
    return {"reply": reply, "intent": intent, "data": metrics}
