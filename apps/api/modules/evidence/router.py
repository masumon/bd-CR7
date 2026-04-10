"""
Evidence Module Router — Architecture 2
Handles project evidence (photos, documents, inspection records).
Files are uploaded via Cloudinary; only the resulting URL is stored here.
"""
from __future__ import annotations

import logging
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query

from core.audit import audit_log
from core.auth import UserContext, get_current_user, require_roles
from core.supabase import supabase_service
from modules.evidence.schema import SubmitEvidenceRequest, ReviewEvidenceRequest

router = APIRouter()
logger = logging.getLogger(__name__)


def _require_supabase():
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    return supabase_service


@router.get("")
async def list_evidence(
    project_id: Optional[str] = Query(None),
    evidence_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    user: UserContext = Depends(get_current_user),
):
    """List evidence records, optionally filtered by project or type."""
    client = _require_supabase()
    q = (
        client.table("evidence")
        .select("id,project_id,evidence_type,title,description,files,submitted_by,status,submitted_at,reviewed_at")
        .order("submitted_at", desc=True)
        .limit(limit)
    )
    if project_id:
        q = q.eq("project_id", project_id)
    if evidence_type:
        q = q.eq("evidence_type", evidence_type)
    if status:
        q = q.eq("status", status)

    try:
        result = q.execute()
        return result.data or []
    except Exception as exc:  # noqa: BLE001
        logger.error("evidence_list_failed error=%s", exc)
        raise HTTPException(status_code=502, detail="Failed to fetch evidence") from exc


@router.get("/{evidence_id}")
async def get_evidence(
    evidence_id: str,
    user: UserContext = Depends(get_current_user),
):
    """Retrieve a single evidence record."""
    client = _require_supabase()
    try:
        result = (
            client.table("evidence")
            .select("*")
            .eq("id", evidence_id)
            .maybe_single()
            .execute()
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail="Failed to fetch evidence") from exc

    if not result.data:
        raise HTTPException(status_code=404, detail="Evidence not found")
    return result.data


@router.post("")
async def submit_evidence(
    payload: SubmitEvidenceRequest,
    user: UserContext = Depends(require_roles("admin", "maker", "checker")),
):
    """Submit new evidence for a project."""
    client = _require_supabase()
    evidence_id = str(uuid4())

    for url in payload.files:
        if not url.startswith("https://res.cloudinary.com/") and not url.startswith("https://"):
            raise HTTPException(status_code=400, detail="All file URLs must be valid HTTPS URLs")

    try:
        result = client.table("evidence").insert({
            "id": evidence_id,
            "project_id": payload.project_id,
            "evidence_type": payload.evidence_type.value,
            "title": payload.title,
            "description": payload.description,
            "files": payload.files,
            "submitted_by": user.user_id,
            "status": "pending_review",
        }).execute()
    except Exception as exc:  # noqa: BLE001
        logger.error("evidence_submit_failed error=%s", exc)
        raise HTTPException(status_code=502, detail="Failed to submit evidence") from exc

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to submit evidence")

    audit_log(
        user_id=user.user_id,
        action="evidence.submit",
        entity_type="evidence",
        entity_id=evidence_id,
        meta={"project_id": payload.project_id, "type": payload.evidence_type.value},
    )
    return result.data[0]


@router.post("/{evidence_id}/review")
async def review_evidence(
    evidence_id: str,
    payload: ReviewEvidenceRequest,
    user: UserContext = Depends(require_roles("admin", "checker")),
):
    """Approve or reject an evidence record."""
    client = _require_supabase()
    from datetime import datetime, timezone

    new_status = "approved" if payload.approved else "rejected"
    try:
        result = client.table("evidence").update({
            "status": new_status,
            "reviewed_by": user.user_id,
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
            "review_notes": payload.review_notes,
        }).eq("id", evidence_id).execute()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail="Failed to update evidence review") from exc

    if not result.data:
        raise HTTPException(status_code=404, detail="Evidence not found")

    audit_log(
        user_id=user.user_id,
        action=f"evidence.{new_status}",
        entity_type="evidence",
        entity_id=evidence_id,
        meta={"approved": payload.approved, "notes": payload.review_notes},
    )
    return result.data[0]
