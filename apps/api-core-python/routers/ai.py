from uuid import uuid4

from fastapi import APIRouter, Depends

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
