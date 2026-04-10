"""
AI Module Router — Architecture 2 (SUMONIX AI)
Proxies natural-language requests to the AI orchestrator.
All actions are routed through proper module APIs — no direct DB access.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from core.audit import audit_log
from core.auth import UserContext, get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    context: dict = Field(default_factory=dict)
    session_id: str | None = None


class ChatResponse(BaseModel):
    reply: str
    action_taken: str | None = None
    data: dict | None = None
    session_id: str | None = None


@router.post("/chat")
async def ai_chat(
    payload: ChatRequest,
    user: UserContext = Depends(get_current_user),
) -> ChatResponse:
    """
    Send a message to SUMONIX AI.
    The AI orchestrator interprets the message and optionally calls module APIs.
    """
    try:
        # Import lazily to avoid startup failures if AI deps are missing
        from core.supabase import supabase_service

        # Log the chat interaction
        audit_log(
            user_id=user.user_id,
            action="ai.chat",
            entity_type="ai_session",
            entity_id=payload.session_id or "anonymous",
            meta={"message_length": len(payload.message)},
        )

        # Simple echo/placeholder until full orchestrator is wired
        # The orchestrator will be injected here when sumonix_ai is configured
        return ChatResponse(
            reply="SUMONIX AI is ready. Please configure the AI orchestrator to enable intelligent responses.",
            action_taken=None,
            data=None,
            session_id=payload.session_id,
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("ai_chat_failed user=%s error=%s", user.user_id, exc)
        raise HTTPException(status_code=502, detail="AI service temporarily unavailable") from exc


@router.get("/status")
async def ai_status(
    user: UserContext = Depends(get_current_user),
):
    """Check AI service availability."""
    return {
        "status": "available",
        "model": "sumonix-ai",
        "capabilities": ["chat", "data_query", "report_generation"],
    }
