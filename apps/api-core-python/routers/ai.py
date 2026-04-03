from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException

from core.auth import UserContext, get_current_user, require_roles
from core.db import fetch_all, tx
from services.risk import dashboard_metrics, financial_anomalies

router = APIRouter()


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
    wants_anomaly = any(keyword in normalized for keyword in ("anomal", "risk", "suspicious", "ঝুঁকি", "অস্বাভাবিক"))
    wants_dashboard = any(keyword in normalized for keyword in ("dashboard", "summary", "overview", "balance", "সারসংক্ষেপ", "ব্যালেন্স"))

    if wants_anomaly:
        anomalies = financial_anomalies()
        if not anomalies:
            return {
                "reply": "No high-signal anomaly was found in recent expenses.",
                "intent": "anomalies",
                "count": 0,
            }
        top = anomalies[:3]
        lines = [f"Found {len(anomalies)} anomalous expense records. Top signals:"]
        for idx, row in enumerate(top, 1):
            lines.append(
                f"{idx}. Expense {row.get('id')} amount {row.get('amount')} (account: {row.get('account_id')})"
            )
        return {"reply": "\n".join(lines), "intent": "anomalies", "count": len(anomalies), "items": top}

    metrics = dashboard_metrics()
    return {
        "reply": (
            "Dashboard snapshot:\n"
            f"- Total balance: {metrics.get('total_balance', 0)}\n"
            f"- Monthly sales: {metrics.get('monthly_sales', 0)}\n"
            f"- Pending expenses: {metrics.get('pending_expenses', 0)}"
        ),
        "intent": "dashboard" if wants_dashboard else "general",
        "data": metrics,
    }
