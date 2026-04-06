"""
AI Auto Employment Engine
Reads uploaded file metadata from project_files + ai_file_classifications,
extracts structured data, and proposes auto-insertions into the appropriate
ERP tables (expenses, material_movements, attendance).

Routes:
  POST /api/ai-employ/classify    — trigger AI classification for a file_id
  POST /api/ai-employ/propose     — build an auto-insertion proposal
  POST /api/ai-employ/confirm     — user confirms → actually inserts the row
  POST /api/ai-employ/reject      — user rejects the proposal
  GET  /api/ai-employ/pending     — list pending (unreviewed) proposals for user
"""

import json
import re
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from core.auth import UserContext, get_current_user
from core.supabase import supabase_service

router = APIRouter(prefix="/ai-employ", tags=["ai-employment"])

# ──────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────

class ClassifyRequest(BaseModel):
    file_id: str
    module: str | None = None
    category: str | None = None
    file_name: str | None = None
    file_url: str | None = None


class ProposeRequest(BaseModel):
    file_id: str


class ConfirmRequest(BaseModel):
    proposal_id: str
    edited_data: dict[str, Any] = Field(default_factory=dict)


class RejectRequest(BaseModel):
    proposal_id: str
    note: str | None = None


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def _svc():
    if supabase_service is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    return supabase_service


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _classify_file(file_name: str, module: str | None, category: str | None) -> dict[str, Any]:
    """
    Rule-based classification. Returns detected_type, module, category,
    confidence, and any extracted field hints from the filename.
    """
    name_lower = (file_name or "").lower()

    # Invoice / Receipt patterns
    if any(k in name_lower for k in ["invoice", "bill", "receipt", "inv_", "rcpt"]):
        return {
            "detected_type": "invoice",
            "module": "finance",
            "category": "expense",
            "confidence": 0.92,
            "extracted_hints": {"entry_type": "expense"},
        }

    # Delivery note / challan
    if any(k in name_lower for k in ["delivery", "challan", "dc_", "dn_", "memo"]):
        return {
            "detected_type": "delivery_note",
            "module": "materials",
            "category": "delivery",
            "confidence": 0.88,
            "extracted_hints": {"movement_type": "in"},
        }

    # Work photo / progress
    if any(k in name_lower for k in ["site", "progress", "work", "photo", "img_", "dsc_", "cam"]):
        return {
            "detected_type": "progress_photo",
            "module": "construction",
            "category": "evidence",
            "confidence": 0.80,
            "extracted_hints": {},
        }

    # Attendance / timesheet
    if any(k in name_lower for k in ["attend", "timesheet", "roster", "worker", "labour"]):
        return {
            "detected_type": "attendance_sheet",
            "module": "workforce",
            "category": "work-proof",
            "confidence": 0.82,
            "extracted_hints": {},
        }

    # Blueprint / drawing
    if any(k in name_lower for k in ["blueprint", "drawing", "plan", "autocad", "dwg"]):
        return {
            "detected_type": "blueprint",
            "module": "construction",
            "category": "blueprint",
            "confidence": 0.85,
            "extracted_hints": {},
        }

    # Contract / agreement
    if any(k in name_lower for k in ["contract", "agreement", "mou", "nda"]):
        return {
            "detected_type": "contract",
            "module": "contractor",
            "category": "agreement",
            "confidence": 0.83,
            "extracted_hints": {},
        }

    # Fallback: use provided module/category or general
    return {
        "detected_type": "general",
        "module": module or "general",
        "category": category or "uncategorized",
        "confidence": 0.50,
        "extracted_hints": {},
    }


def _extract_amount_from_name(file_name: str) -> float | None:
    """Try to parse an amount from filenames like 'invoice_5000.pdf'."""
    matches = re.findall(r"[_\-\s](\d[\d,]*(?:\.\d{1,2})?)[_\-\s.]", file_name + " ")
    for m in matches:
        try:
            val = float(m.replace(",", ""))
            if val > 0:
                return val
        except ValueError:
            pass
    return None


def _build_proposal(
    detected: dict[str, Any],
    file_id: str,
    file_name: str,
    file_url: str,
    project_id: str | None,
) -> dict[str, Any]:
    """Build the proposed DB row based on detected type."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    amount_hint = _extract_amount_from_name(file_name)

    if detected["module"] == "finance":
        return {
            "target_table": "expenses",
            "proposed_row": {
                "amount": amount_hint or 0,
                "description": f"[AI] From file: {file_name}",
                "status": "pending",
                "metadata": {
                    "module": "finance_workspace",
                    "expense_date": today,
                    "category": "Materials",
                    "subcategory": "Other",
                    "receipt_url": file_url,
                    "ai_auto_filled": True,
                    "project_id": project_id,
                },
            },
        }

    if detected["module"] == "materials":
        return {
            "target_table": "material_movements",
            "proposed_row": {
                "material_name": "Unknown Material",
                "movement_type": detected.get("extracted_hints", {}).get("movement_type", "in"),
                "quantity": 1,
                "unit": "Pcs",
                "unit_price": amount_hint or 0,
                "total_cost": amount_hint or 0,
                "supplier": None,
                "notes": f"[AI] From file: {file_name}",
            },
        }

    if detected["module"] == "workforce":
        return {
            "target_table": "attendance",
            "proposed_row": {
                "worker_name": "Unknown Worker",
                "role": "General Labour",
                "status": "present",
                "daily_wage": 0,
                "paid_amount": 0,
                "date": today,
                "work_description": f"[AI] From file: {file_name}",
            },
        }

    if detected["module"] == "construction":
        return {
            "target_table": "progress_cam",
            "proposed_row": {
                "project_id": project_id,
                "phase": "General",
                "caption": f"[AI] Auto-logged from: {file_name}",
                "file_url": file_url,
                "file_type": "image",
            },
        }

    return {
        "target_table": None,
        "proposed_row": {},
    }


# ──────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────

@router.post("/classify")
async def classify_file(
    req: ClassifyRequest,
    user: UserContext = Depends(get_current_user),
):
    """
    Run rule-based classification on a file and store in ai_file_classifications.
    Called automatically after every upload in FileUploadEngine.
    """
    svc = _svc()

    # Fetch file record for context
    file_res = svc.table("project_files").select(
        "id,file_name,file_url,module,category,project_id"
    ).eq("id", req.file_id).single().execute()

    if not file_res.data:
        raise HTTPException(status_code=404, detail="File not found")

    file_rec = file_res.data
    file_name = req.file_name or file_rec.get("file_name") or ""
    module = req.module or file_rec.get("module")
    category = req.category or file_rec.get("category")

    detected = _classify_file(file_name, module, category)

    # Upsert ai_file_classifications
    clf_data = {
        "file_id": req.file_id,
        "detected_type": detected["detected_type"],
        "module": detected["module"],
        "category": detected["category"],
        "confidence": detected["confidence"],
        "extracted_data": detected.get("extracted_hints", {}),
        "auto_applied": False,
    }
    svc.table("ai_file_classifications").insert(clf_data).execute()

    # Update project_files with AI tags
    svc.table("project_files").update({
        "ai_classified": True,
        "ai_module": detected["module"],
        "ai_category": detected["category"],
        "ai_confidence": detected["confidence"],
        "updated_at": _now_iso(),
    }).eq("id", req.file_id).execute()

    return {
        "file_id": req.file_id,
        "classification": detected,
        "message": "File classified by SUMONIX AI",
    }


@router.post("/propose")
async def propose_auto_insertion(
    req: ProposeRequest,
    user: UserContext = Depends(get_current_user),
):
    """
    Build an auto-insertion proposal from an already-classified file.
    Returns the proposal_id and proposed row for the user to review.
    """
    svc = _svc()

    # Get file details
    file_res = svc.table("project_files").select(
        "id,file_name,file_url,module,category,ai_module,ai_category,ai_confidence,project_id"
    ).eq("id", req.file_id).single().execute()

    if not file_res.data:
        raise HTTPException(status_code=404, detail="File not found")

    file_rec = file_res.data
    file_name = file_rec.get("file_name") or ""
    file_url = file_rec.get("file_url") or ""
    project_id = file_rec.get("project_id")
    ai_module = file_rec.get("ai_module") or file_rec.get("module") or "general"
    ai_category = file_rec.get("ai_category") or file_rec.get("category") or "uncategorized"

    # Re-run classification to get hints
    detected = _classify_file(file_name, ai_module, ai_category)
    detected["module"] = ai_module  # trust stored AI result over re-classification

    proposal = _build_proposal(detected, req.file_id, file_name, file_url, project_id)

    if not proposal["target_table"]:
        return {
            "proposal_id": None,
            "message": "No auto-insertion available for this file type",
            "module": ai_module,
        }

    # Check if a proposal already exists for this file
    existing = svc.table("ai_auto_insertions").select("id").eq(
        "file_id", req.file_id
    ).eq("auto_applied", False).eq("rejected", False).execute()

    if existing.data:
        proposal_id = existing.data[0]["id"]
    else:
        insert_res = svc.table("ai_auto_insertions").insert({
            "file_id": req.file_id,
            "module": ai_module,
            "target_table": proposal["target_table"],
            "extracted_data": proposal["proposed_row"],
            "auto_applied": False,
        }).execute()
        proposal_id = insert_res.data[0]["id"] if insert_res.data else None

    return {
        "proposal_id": proposal_id,
        "module": ai_module,
        "target_table": proposal["target_table"],
        "proposed_data": proposal["proposed_row"],
        "confidence": detected["confidence"],
        "message": f"AI proposes inserting into {proposal['target_table']}. Please review and confirm.",
    }


@router.post("/confirm")
async def confirm_auto_insertion(
    req: ConfirmRequest,
    user: UserContext = Depends(get_current_user),
):
    """
    User confirms (and optionally edits) the AI proposal.
    Performs the actual DB insert and marks the proposal as applied.
    """
    svc = _svc()

    # Fetch proposal
    prop_res = svc.table("ai_auto_insertions").select("*").eq(
        "id", req.proposal_id
    ).single().execute()

    if not prop_res.data:
        raise HTTPException(status_code=404, detail="Proposal not found")

    proposal = prop_res.data
    if proposal["auto_applied"]:
        return {"message": "Already applied", "proposal_id": req.proposal_id}
    if proposal["rejected"]:
        raise HTTPException(status_code=400, detail="Proposal was rejected")

    # Merge user edits into extracted_data
    base_data: dict = proposal.get("extracted_data") or {}
    if req.edited_data:
        base_data.update(req.edited_data)

    target_table = proposal["target_table"]
    insert_error = None

    if target_table and base_data:
        # Add maker_id for expenses
        if target_table == "expenses" and user.user_id:
            base_data["maker_id"] = user.user_id

        try:
            if target_table == "material_movements":
                svc.rpc(
                    "record_material_movement_atomic",
                    {
                        "p_project_id": base_data.get("project_id"),
                        "p_material_name": base_data.get("material_name"),
                        "p_quantity": base_data.get("quantity"),
                        "p_unit": base_data.get("unit") or "Pcs",
                        "p_unit_price": base_data.get("unit_price") or base_data.get("unit_cost") or 0,
                        "p_supplier": base_data.get("supplier"),
                        "p_notes": base_data.get("notes"),
                        "p_movement_type": base_data.get("movement_type") or "in",
                        "p_proof_file_id": base_data.get("proof_file_id"),
                        "p_actor_user_id": user.user_id,
                    },
                ).execute()
            else:
                svc.table(target_table).insert(base_data).execute()
        except Exception as exc:
            insert_error = str(exc)

    # Mark proposal as applied
    svc.table("ai_auto_insertions").update({
        "auto_applied": True if not insert_error else False,
        "confirmed_by": user.user_id,
        "confirmed_at": _now_iso(),
    }).eq("id", req.proposal_id).execute()

    if insert_error:
        raise HTTPException(status_code=500, detail=f"Insert failed: {insert_error}")

    return {
        "message": f"AI auto-insertion confirmed and applied to {target_table}",
        "proposal_id": req.proposal_id,
        "target_table": target_table,
    }


@router.post("/reject")
async def reject_auto_insertion(
    req: RejectRequest,
    user: UserContext = Depends(get_current_user),
):
    """User rejects the AI proposal — marks as rejected, no insert performed."""
    svc = _svc()

    svc.table("ai_auto_insertions").update({
        "rejected": True,
        "rejection_note": req.note,
        "confirmed_by": user.user_id,
        "confirmed_at": _now_iso(),
    }).eq("id", req.proposal_id).execute()

    return {"message": "Proposal rejected", "proposal_id": req.proposal_id}


@router.get("/pending")
async def get_pending_proposals(
    user: UserContext = Depends(get_current_user),
):
    """List all pending (unreviewed) AI proposals."""
    svc = _svc()

    res = svc.table("ai_auto_insertions").select(
        "id,file_id,module,target_table,extracted_data,created_at,"
        "project_files(file_name,file_url,ai_module,ai_confidence)"
    ).eq("auto_applied", False).eq("rejected", False).order(
        "created_at", desc=True
    ).limit(20).execute()

    return {"proposals": res.data or [], "count": len(res.data or [])}
