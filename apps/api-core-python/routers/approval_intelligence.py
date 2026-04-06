from __future__ import annotations

from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from core.auth import UserContext, get_current_user, require_roles
from core.supabase import supabase_service

router = APIRouter()


class DecisionRuleUpsert(BaseModel):
    label: str | None = None
    is_enabled: bool = True
    risk_threshold: int = Field(default=80, ge=0, le=100)
    payload: dict = Field(default_factory=dict)


def _require_supabase() -> Any:
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    return supabase_service


@router.get("/rules")
async def list_decision_rules(user: UserContext = Depends(require_roles("admin", "checker"))):
    client = _require_supabase()
    rows = client.table("decision_rules").select("id,rule_key,label,is_enabled,risk_threshold,payload,updated_at").order("rule_key").execute()
    return rows.data or []


@router.put("/rules/{rule_key}")
async def upsert_decision_rule(
    rule_key: str,
    payload: DecisionRuleUpsert,
    user: UserContext = Depends(require_roles("admin")),
):
    client = _require_supabase()

    row = {
        "rule_key": rule_key,
        "label": payload.label or rule_key.replace("_", " ").title(),
        "is_enabled": payload.is_enabled,
        "risk_threshold": payload.risk_threshold,
        "payload": payload.payload,
        "created_by": user.user_id,
    }

    res = client.table("decision_rules").upsert(row, on_conflict="rule_key").execute()
    return (res.data or [row])[0]


@router.post("/suggestions/refresh")
async def refresh_pending_approvals(user: UserContext = Depends(require_roles("admin", "checker"))):
    client = _require_supabase()

    rules_res = client.table("decision_rules").select("risk_threshold,is_enabled,payload").eq("rule_key", "expense_risk_auto_suggest").limit(1).execute()
    default_threshold = 80
    if rules_res.data:
        rule = rules_res.data[0]
        if rule.get("is_enabled") is False:
            return {"created": 0, "message": "expense_risk_auto_suggest rule is disabled"}
        default_threshold = int(rule.get("risk_threshold") or default_threshold)

    expenses_res = (
        client.table("expenses")
        .select("id,amount,status,risk_score,risk_level,description")
        .eq("status", "pending")
        .order("created_at", desc=True)
        .limit(200)
        .execute()
    )

    created = 0
    for row in (expenses_res.data or []):
        risk_score = int(row.get("risk_score") or 0)
        if risk_score >= default_threshold:
            suggested_action = "reject"
            reason = f"Risk score {risk_score} is above threshold {default_threshold}"
        elif risk_score >= max(50, default_threshold - 20):
            suggested_action = "review"
            reason = f"Risk score {risk_score} is near threshold {default_threshold}"
        else:
            suggested_action = "approve"
            reason = f"Risk score {risk_score} is below threshold {default_threshold}"

        pending_row = {
            "id": str(uuid4()),
            "entity_type": "expense",
            "entity_id": row["id"],
            "suggested_action": suggested_action,
            "risk_score": risk_score,
            "reason": reason,
            "status": "pending",
            "suggested_by": "sumonix_ai",
        }

        client.table("pending_approvals").upsert(pending_row, on_conflict="entity_type,entity_id").execute()
        created += 1

    return {"created": created, "threshold": default_threshold}


@router.get("/pending")
async def list_pending_approvals(user: UserContext = Depends(require_roles("admin", "checker"))):
    client = _require_supabase()
    rows = (
        client.table("pending_approvals")
        .select("id,entity_type,entity_id,suggested_action,risk_score,reason,status,suggested_by,created_at,updated_at")
        .order("created_at", desc=True)
        .limit(300)
        .execute()
    )
    return rows.data or []


@router.patch("/pending/{pending_id}")
async def update_pending_approval_status(
    pending_id: str,
    payload: dict,
    user: UserContext = Depends(require_roles("admin", "checker")),
):
    client = _require_supabase()
    next_status = str(payload.get("status") or "pending").strip().lower()
    if next_status not in {"pending", "applied", "dismissed"}:
        raise HTTPException(status_code=400, detail="status must be pending, applied, or dismissed")

    res = client.table("pending_approvals").update({"status": next_status}).eq("id", pending_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Pending approval not found")
    return res.data[0]


@router.get("/biometric/credentials")
async def list_biometric_credentials(user: UserContext = Depends(get_current_user)):
    client = _require_supabase()
    rows = (
        client.table("biometric_credentials")
        .select("id,credential_id,device_name,transports,is_active,sign_count,created_at,updated_at")
        .eq("user_id", user.user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return rows.data or []


@router.post("/biometric/credentials")
async def register_biometric_credential(payload: dict, user: UserContext = Depends(get_current_user)):
    client = _require_supabase()
    credential_id = str(payload.get("credential_id") or "").strip()
    if not credential_id:
        raise HTTPException(status_code=400, detail="credential_id is required")

    row = {
        "id": str(uuid4()),
        "user_id": user.user_id,
        "credential_id": credential_id,
        "device_name": str(payload.get("device_name") or "This device"),
        "transports": payload.get("transports") or [],
        "is_active": True,
        "sign_count": int(payload.get("sign_count") or 0),
    }
    res = client.table("biometric_credentials").upsert(row, on_conflict="user_id,credential_id").execute()
    return (res.data or [row])[0]


@router.delete("/biometric/credentials/{credential_id}")
async def deactivate_biometric_credential(credential_id: str, user: UserContext = Depends(get_current_user)):
    client = _require_supabase()
    res = (
        client.table("biometric_credentials")
        .update({"is_active": False})
        .eq("user_id", user.user_id)
        .eq("credential_id", credential_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Credential not found")
    return {"ok": True}
