from __future__ import annotations

import secrets
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, Request

from core.audit import audit_log
from core.auth import UserContext, get_current_user
from core.config import settings
from core.supabase import supabase_anon, supabase_service
from core.exceptions import AuthError
from schemas.auth import AuthResponse, LoginRequest, RegisterRequest
from webauthn import base64url_to_bytes, verify_authentication_response

router = APIRouter()

SELF_SERVICE_ROLE = "viewer"
WEBAUTHN_CHALLENGE_TTL_SECONDS = 120


def _parse_timestamp(raw: str | None) -> datetime | None:
    if not raw:
        return None
    try:
        parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    except ValueError:
        return None


def _store_webauthn_challenge(user_id: str, challenge: str) -> None:
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    expires_at = datetime.now(timezone.utc).timestamp() + WEBAUTHN_CHALLENGE_TTL_SECONDS
    expires_at_iso = datetime.fromtimestamp(expires_at, tz=timezone.utc).isoformat()

    supabase_service.table("webauthn_challenges").upsert(
        {
            "user_id": user_id,
            "challenge": challenge,
            "expires_at": expires_at_iso,
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
        on_conflict="user_id",
    ).execute()


def _load_webauthn_challenge(user_id: str) -> tuple[str, datetime] | None:
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    row_res = (
        supabase_service.table("webauthn_challenges")
        .select("challenge,expires_at")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not row_res.data:
        return None

    row = row_res.data[0]
    challenge = str(row.get("challenge") or "").strip()
    expires_at = _parse_timestamp(row.get("expires_at"))
    if not challenge or expires_at is None:
        return None
    return challenge, expires_at


def _clear_webauthn_challenge(user_id: str) -> None:
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    supabase_service.table("webauthn_challenges").delete().eq("user_id", user_id).execute()


def _extract_joined_role_name(user_row: dict) -> str:
    role_obj = user_row.get("roles")
    if isinstance(role_obj, dict):
        role_name = role_obj.get("name")
        if isinstance(role_name, str) and role_name.strip():
            return role_name.strip().lower()
    raise HTTPException(status_code=500, detail="User role mapping is invalid")


def _normalize_role_name(role_name: str | None) -> str:
    if isinstance(role_name, str) and role_name.strip():
        return role_name.strip().lower()
    return "viewer"


def _resolve_origin_and_rp_id(request: Request) -> tuple[str, str]:
    allowed = [origin for origin in settings.cors_origins if origin and origin != "*"]
    incoming_origin = request.headers.get("origin", "").strip()
    if incoming_origin and incoming_origin in allowed:
        expected_origin = incoming_origin
    elif allowed:
        expected_origin = allowed[0]
    else:
        expected_origin = f"https://{request.url.hostname}"

    rp_id = urlparse(expected_origin).hostname or request.url.hostname or "localhost"
    return expected_origin, rp_id


def _sync_auth_role_metadata(user_id: str, role_name: str) -> None:
    if supabase_service is None:
        return
    try:
        supabase_service.auth.admin.update_user_by_id(
            user_id,
            {
                "app_metadata": {"role": _normalize_role_name(role_name)},
            },
        )
    except Exception:
        # Non-fatal: role is still enforced from DB and token validation.
        return


@router.post("/register", response_model=AuthResponse)
async def register(payload: RegisterRequest):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    existing = supabase_service.table("users").select("id").eq("email", payload.email).limit(1).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="Email already exists")

    role = supabase_service.table("roles").select("id,name").eq("name", SELF_SERVICE_ROLE).limit(1).execute()
    if not role.data:
        raise HTTPException(status_code=500, detail="Required roles are missing")
    role_row = role.data[0]

    try:
        created = supabase_service.auth.admin.create_user(
            {
                "email": payload.email,
                "password": payload.password,
                "email_confirm": True,
                "user_metadata": {"full_name": payload.full_name},
                "app_metadata": {"role": _normalize_role_name(SELF_SERVICE_ROLE)},
            }
        )
    except AuthError as exc:
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(exc)}") from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="Supabase registration failed") from exc

    user_obj = getattr(created, "user", None)
    if not user_obj or not user_obj.id:
        raise HTTPException(status_code=500, detail="Supabase user creation returned no user id")

    user_id = str(user_obj.id)

    supabase_service.table("users").upsert(
        {
            "id": user_id,
            "email": payload.email,
            "full_name": payload.full_name,
            "password_hash": None,
            "role_id": role_row["id"],
            "is_active": True,
        },
        on_conflict="id",
    ).execute()

    _sync_auth_role_metadata(user_id, role_row["name"])

    if supabase_anon is None:
        raise HTTPException(status_code=500, detail="Supabase client is not configured")

    login_result = supabase_anon.auth.sign_in_with_password({"email": payload.email, "password": payload.password})
    if not login_result.session:
        raise HTTPException(status_code=500, detail="Registration succeeded but session creation failed")

    audit_log(user_id=user_id, action="auth.register", meta={"email": payload.email, "role": role_row["name"]})
    return AuthResponse(access_token=login_result.session.access_token, user_id=user_id, role=role_row["name"])


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest):
    if supabase_anon is None:
        raise HTTPException(status_code=500, detail="Supabase client is not configured")
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    try:
        auth_result = supabase_anon.auth.sign_in_with_password({"email": payload.email, "password": payload.password})
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=401, detail="Invalid credentials") from exc

    if not auth_result.user or not auth_result.session:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    local_user = (
        supabase_service.table("users")
        .select("id,is_active,roles(name)")
        .eq("id", str(auth_result.user.id))
        .limit(1)
        .execute()
    )

    if not local_user.data:
        viewer = supabase_service.table("roles").select("id,name").eq("name", "viewer").limit(1).execute()
        if not viewer.data:
            raise HTTPException(status_code=500, detail="Viewer role is missing")
        viewer_role = viewer.data[0]
        supabase_service.table("users").upsert(
            {
                "id": str(auth_result.user.id),
                "email": payload.email,
                "full_name": auth_result.user.user_metadata.get("full_name") if auth_result.user.user_metadata else payload.email,
                "password_hash": None,
                "role_id": viewer_role["id"],
                "is_active": True,
            },
            on_conflict="id",
        ).execute()
        role_name = viewer_role["name"]
    else:
        role_name = _extract_joined_role_name(local_user.data[0])

    _sync_auth_role_metadata(str(auth_result.user.id), str(role_name))
    audit_log(user_id=str(auth_result.user.id), action="auth.login", meta={"role": str(role_name)})
    return AuthResponse(
        access_token=auth_result.session.access_token,
        user_id=str(auth_result.user.id),
        role=str(role_name),
    )


@router.post("/logout")
async def logout(user: UserContext = Depends(get_current_user)):
    # Revoke ALL active sessions for this user via the service-role client.
    # Without this call the bearer token remained valid until its natural expiry.
    if supabase_service is not None:
        try:
            supabase_service.auth.admin.sign_out(user.user_id)
        except Exception:  # noqa: BLE001
            # Non-fatal: local state is cleared on the client side regardless.
            pass
    audit_log(user_id=user.user_id, action="auth.logout")
    return {"message": f"Logged out {user.user_id}"}


@router.post("/webauthn/register")
async def register_webauthn_credential(payload: dict, user: UserContext = Depends(get_current_user)):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    credential_id = str(payload.get("credential_id") or "").strip()
    public_key = str(payload.get("public_key") or "").strip()
    if not credential_id or not public_key:
        raise HTTPException(status_code=400, detail="credential_id and public_key are required")

    row = {
        "user_id": user.user_id,
        "credential_id": credential_id,
        "public_key": public_key,
        "device_name": str(payload.get("device_name") or "This device"),
        "transports": payload.get("transports") or [],
        "is_active": True,
        "sign_count": int(payload.get("sign_count") or 0),
    }

    result = supabase_service.table("biometric_credentials").upsert(row, on_conflict="user_id,credential_id").execute()
    return {"ok": True, "credential": (result.data or [row])[0]}


@router.post("/webauthn/challenge")
async def create_webauthn_challenge(request: Request, user: UserContext = Depends(get_current_user)):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    rows = (
        supabase_service.table("biometric_credentials")
        .select("credential_id,public_key,is_active")
        .eq("user_id", user.user_id)
        .eq("is_active", True)
        .execute()
    )

    credentials = [
        row for row in (rows.data or []) if row.get("credential_id") and row.get("public_key")
    ]
    if not credentials:
        raise HTTPException(
            status_code=400,
            detail="No cryptographic biometric credential enrolled. Enroll biometric after password login first.",
        )

    challenge = secrets.token_urlsafe(32)
    # Store challenge in DB to support multi-worker deployments.
    _store_webauthn_challenge(user.user_id, challenge)

    expected_origin, rp_id = _resolve_origin_and_rp_id(request)
    return {
        "challenge": challenge,
        "rp_id": rp_id,
        "origin": expected_origin,
        "allow_credentials": [{"id": row["credential_id"], "type": "public-key"} for row in credentials],
        "timeout": 60000,
        "user_verification": "required",
    }


@router.post("/webauthn/verify")
async def verify_webauthn_assertion(payload: dict, request: Request, user: UserContext = Depends(get_current_user)):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    challenge_state = _load_webauthn_challenge(user.user_id)
    if not challenge_state:
        raise HTTPException(status_code=400, detail="WebAuthn challenge is missing or expired")

    expected_challenge, expires_at = challenge_state
    if datetime.now(timezone.utc) > expires_at:
        _clear_webauthn_challenge(user.user_id)
        raise HTTPException(status_code=400, detail="WebAuthn challenge expired")

    credential_id = str(payload.get("credential_id") or "").strip()
    authenticator_data = str(payload.get("authenticator_data") or "").strip()
    client_data_json = str(payload.get("client_data_json") or "").strip()
    signature = str(payload.get("signature") or "").strip()
    user_handle = payload.get("user_handle")

    if not credential_id or not authenticator_data or not client_data_json or not signature:
        raise HTTPException(status_code=400, detail="Missing required WebAuthn assertion fields")

    row_res = (
        supabase_service.table("biometric_credentials")
        .select("credential_id,public_key,sign_count,is_active")
        .eq("user_id", user.user_id)
        .eq("credential_id", credential_id)
        .eq("is_active", True)
        .limit(1)
        .execute()
    )
    if not row_res.data:
        raise HTTPException(status_code=404, detail="Biometric credential not found")

    cred_row = row_res.data[0]
    if not cred_row.get("public_key"):
        raise HTTPException(status_code=400, detail="Credential is missing cryptographic public key; re-enroll biometric")

    expected_origin, rp_id = _resolve_origin_and_rp_id(request)

    credential: dict[str, Any] = {
        "id": credential_id,
        "rawId": credential_id,
        "type": "public-key",
        "response": {
            "authenticatorData": authenticator_data,
            "clientDataJSON": client_data_json,
            "signature": signature,
            "userHandle": user_handle,
        },
        "clientExtensionResults": payload.get("client_extension_results") or {},
    }

    try:
        verification = verify_authentication_response(
            credential=credential,
            expected_challenge=base64url_to_bytes(expected_challenge),
            expected_rp_id=rp_id,
            expected_origin=expected_origin,
            credential_public_key=base64url_to_bytes(str(cred_row.get("public_key"))),
            credential_current_sign_count=int(cred_row.get("sign_count") or 0),
            require_user_verification=True,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=401, detail="Biometric cryptographic verification failed") from exc
    finally:
        _clear_webauthn_challenge(user.user_id)

    supabase_service.table("biometric_credentials").update({"sign_count": int(verification.new_sign_count)}).eq(
        "user_id", user.user_id
    ).eq("credential_id", credential_id).execute()

    return {"ok": True, "verified": True}


@router.get("/me")
async def me(user: UserContext = Depends(get_current_user)):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    profile = (
        supabase_service.table("users")
        .select("id,email,full_name,roles(name)")
        .eq("id", user.user_id)
        .limit(1)
        .execute()
    )
    if not profile.data:
        raise HTTPException(status_code=404, detail="User not found")
    profile_row = profile.data[0]
    role_name = _extract_joined_role_name(profile_row)
    return {
        "id": profile_row["id"],
        "email": profile_row.get("email"),
        "full_name": profile_row.get("full_name"),
        "role": role_name,
    }


@router.get("/biometric/credentials")
async def list_biometric_credentials(user: UserContext = Depends(get_current_user)):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    rows = (
        supabase_service.table("biometric_credentials")
        .select("id,credential_id,device_name,transports,is_active,sign_count,created_at,updated_at")
        .eq("user_id", user.user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return rows.data or []


@router.post("/biometric/credentials")
async def register_biometric_credential_mgmt(payload: dict, user: UserContext = Depends(get_current_user)):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    credential_id = str(payload.get("credential_id") or "").strip()
    if not credential_id:
        raise HTTPException(status_code=400, detail="credential_id is required")

    import uuid as _uuid
    row = {
        "id": str(_uuid.uuid4()),
        "user_id": user.user_id,
        "credential_id": credential_id,
        "device_name": str(payload.get("device_name") or "This device"),
        "transports": payload.get("transports") or [],
        "is_active": True,
        "sign_count": int(payload.get("sign_count") or 0),
    }
    res = supabase_service.table("biometric_credentials").upsert(row, on_conflict="user_id,credential_id").execute()
    return (res.data or [row])[0]


@router.delete("/biometric/credentials/{credential_id}")
async def deactivate_biometric_credential(credential_id: str, user: UserContext = Depends(get_current_user)):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    res = (
        supabase_service.table("biometric_credentials")
        .update({"is_active": False})
        .eq("user_id", user.user_id)
        .eq("credential_id", credential_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Credential not found")
    return {"ok": True}
