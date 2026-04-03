import json
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException

from core.auth import UserContext, get_current_user, require_roles
from core.db import fetch_all, tx
from services.risk import dashboard_metrics, financial_anomalies

router = APIRouter()


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
async def add_ai_memory(payload: dict, user: UserContext = Depends(require_roles("admin", "maker", "checker"))):
    memory_id = str(uuid4())
    content = payload.get("content", "")
    embedding = payload.get("embedding", [])
    metadata = payload.get("metadata", {})

    with tx() as conn:
        conn.exec_driver_sql(
            """
            INSERT INTO ai_memory (id, content, embedding, metadata, created_by)
            VALUES (%s, %s, %s::vector, %s::jsonb, %s)
            """,
            (memory_id, content, str(embedding), str(metadata).replace("'", '"'), user.user_id),
        )

    return {"id": memory_id}


@router.get("/memory/search")
async def search_memory(vector: str, top_k: int = 5, user: UserContext = Depends(get_current_user)):
    rows = fetch_all(
        """
        SELECT id, content, metadata
        FROM ai_memory
        ORDER BY embedding <-> CAST(:vector AS vector)
        LIMIT :top_k
        """,
        {"vector": vector, "top_k": max(1, min(top_k, 20))},
    )
    return [dict(x) for x in rows]


@router.post("/chat")
async def ai_chat(payload: dict, user: UserContext = Depends(get_current_user)):
    message = str(payload.get("message", "")).strip()
    if not message:
        raise HTTPException(status_code=400, detail="message is required")

    normalized = message.lower()
    wants_greeting = any(keyword in normalized for keyword in ("hello", "hi", "hey", "assalamualaikum", "সালাম", "হ্যালো"))
    wants_anomaly = any(keyword in normalized for keyword in ("anomal", "risk", "suspicious", "ঝুঁকি", "অস্বাভাবিক"))
    wants_dashboard = any(keyword in normalized for keyword in ("dashboard", "summary", "overview", "balance", "সারসংক্ষেপ", "ব্যালেন্স"))
    wants_module_guide = any(keyword in normalized for keyword in ("module", "workspace", "what can you do", "কি করতে পারো", "কি কি আছে"))

    if wants_greeting:
        payload = {
            "reply": (
                "আমি SUMONIX AI। আমি finance summary, anomaly review, project snapshot, এবং module guidance দিতে পারি।\n\n"
                "I can help with dashboard summaries, risky expense signals, project context, and workflow guidance."
            ),
            "intent": "general",
        }
        _log_ai_interaction(user_id=user.user_id, message=message, intent="general", response_text=payload["reply"])
        return payload

    if wants_module_guide:
        payload = {
            "reply": (
                "Available workspaces:\n"
                "1. Dashboard: executive overview\n"
                "2. Project Intro: project identity and phases\n"
                "3. Site Progress: workers, materials, progress evidence\n"
                "4. Fund & Expense: cashflow and approvals\n"
                "5. Supply Chain: L/C and shipment records\n"
                "6. POS Workspace: catalog, cart, checkout, and sales history\n"
                "7. Reports: exports and analysis\n\n"
                "Ask me for a summary of any workspace and I will guide you."
            ),
            "intent": "general",
        }
        _log_ai_interaction(user_id=user.user_id, message=message, intent="general", response_text=payload["reply"])
        return payload

    if wants_anomaly:
        anomalies = financial_anomalies()
        if not anomalies:
            payload = {
                "reply": "No high-signal anomaly was found in recent expenses. Current records do not show a severe spike pattern.",
                "intent": "anomalies",
                "count": 0,
            }
            _log_ai_interaction(user_id=user.user_id, message=message, intent="anomalies", response_text=payload["reply"], metadata={"count": 0})
            return payload
        top = anomalies[:3]
        lines = [f"Found {len(anomalies)} anomalous expense records. Top signals:"]
        for idx, row in enumerate(top, 1):
            lines.append(
                f"{idx}. Expense {row.get('id')} amount {_format_currency(row.get('amount'))} (account: {row.get('account_id')})"
            )
        lines.append("Review the related account, receipt quality, and approval path before releasing payment.")
        reply_text = "\n".join(lines)
        payload = {"reply": reply_text, "intent": "anomalies", "count": len(anomalies), "items": top}
        _log_ai_interaction(
            user_id=user.user_id,
            message=message,
            intent="anomalies",
            response_text=reply_text,
            metadata={"count": len(anomalies)},
        )
        return payload

    metrics = dashboard_metrics()
    reply_text = _dashboard_reply(metrics)
    payload = {
        "reply": _dashboard_reply(metrics),
        "intent": "dashboard" if wants_dashboard else "general",
        "data": metrics,
    }
    _log_ai_interaction(
        user_id=user.user_id,
        message=message,
        intent=payload["intent"],
        response_text=reply_text,
        metadata={"has_metrics": True},
    )
    return payload
