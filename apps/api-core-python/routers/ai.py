import json
import logging
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query

from core.auth import UserContext, get_current_user, require_roles
from core.db import fetch_all, tx
from core.supabase import supabase_service
from schemas.ai import ChatMessage, MemoryCreate
from services.ai_engine import process_message
from services.risk import dashboard_metrics, financial_anomalies, operational_alerts
from services.system_monitor import run_system_scan

logger = logging.getLogger(__name__)

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


@router.get("/alerts")
async def get_system_alerts(user: UserContext = Depends(require_roles("super_admin", "admin"))):
    """
    System Awareness Engine — full cross-module health scan.
    Returns structured alerts sorted by severity (critical first).
    Restricted to super_admin and admin roles.
    """
    return run_system_scan()


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
    """
    SUMONIX AI chat endpoint.
    Supports any language (auto-detected), fuzzy Banglish matching,
    role-based DB queries, predictions, and live internet data.
    No LLM — pure NLP pipeline.
    """
    message = payload.message.strip()

    try:
        result = process_message(message=message, role=user.role, user_id=user.user_id)
    except Exception as exc:  # noqa: BLE001
        # Broad catch is intentional: process_message calls DB, Supabase,
        # external APIs (exchange rate, weather), and NLP libraries — any of
        # which may raise diverse exception types.  We want the AI chat
        # endpoint to stay responsive in degraded-mode even when a dependency
        # is temporarily unreachable, rather than surfacing a 500 to the UI.
        logger.error("ai_engine process_message failed: %s", exc, exc_info=True)
        result = {
            "reply": (
                "SUMONIX AI is temporarily unavailable due to a backend issue. "
                "Please try again in a moment."
            ),
            "intent": "error",
            "lang": "en",
            "translated_input": None,
        }

    _log_ai_interaction(
        user_id=user.user_id,
        message=message,
        intent=result["intent"],
        response_text=result["reply"],
        metadata={
            "lang": result.get("lang"),
            "translated_input": result.get("translated_input"),
            "role": user.role,
        },
    )
    return result
