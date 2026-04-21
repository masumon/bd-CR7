from __future__ import annotations

import secrets
import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials

from core.audit import audit_log
from core.auth import UserContext, bearer, get_current_user
from core.config import settings
from core.supabase import get_supabase_anon, get_supabase_service, require_supabase_service
from core.exceptions import AuthError
from schemas.auth import AuthResponse, LoginRequest, PinSetRequest, PinVerifyRequest, RegisterRequest, SecuritySettingsResponse, SecuritySettingsUpdateRequest
from modules.auth.phone_otp_service import OtpError, send_phone_otp, verify_phone_otp
from modules.auth.email_otp_service import EmailOtpError, send_email_otp, verify_email_otp

router = APIRouter()

SELF_SERVICE_ROLE = "viewer"
WEBAUTHN_CHALLENGE_TTL_SECONDS = 120
PIN_MAX_ATTEMPTS = 5
PIN_LOCK_MINUTES = 5


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _get_current_user_optional(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> UserContext | None:
    if credentials is None:
        return None
    return get_current_user(credentials)


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


def _device_binding_hash(request: Request) -> str:
    user_agent = request.headers.get("user-agent", "").strip().lower()
    # Persist a stable hash based on UA only so browser language/client-hint changes
    # do not unexpectedly invalidate trusted-device login.
    return hashlib.sha256(user_agent.encode("utf-8")).hexdigest()


def _device_binding_hash_candidates(request: Request) -> set[str]:
    user_agent = request.headers.get("user-agent", "").strip().lower()
    platform = request.headers.get("sec-ch-ua-platform", "").replace('"', "").strip().lower()
    accept_language = request.headers.get("accept-language", "").split(",", 1)[0].strip().lower()
    mobile_hint = request.headers.get("sec-ch-ua-mobile", "").strip().lower()
    raw_variants = (
        user_agent,
        "|".join([user_agent, platform, mobile_hint]),
        "|".join([user_agent, platform, accept_language, mobile_hint]),
    )
    return {
        hashlib.sha256(raw.encode("utf-8")).hexdigest()
        for raw in raw_variants
        if raw
    }


def _device_label(request: Request) -> str:
    platform = request.headers.get("sec-ch-ua-platform", "").replace('"', "").strip()
    user_agent = request.headers.get("user-agent", "").strip()
    browser = "Browser"
    lowered = user_agent.lower()
    if "edg/" in lowered:
        browser = "Edge"
    elif "chrome/" in lowered and "edg/" not in lowered:
        browser = "Chrome"
    elif "safari/" in lowered and "chrome/" not in lowered:
        browser = "Safari"
    elif "firefox/" in lowered:
        browser = "Firefox"

    if not platform:
        if "iphone" in lowered or "ipad" in lowered or "ios" in lowered:
            platform = "iOS"
        elif "android" in lowered:
            platform = "Android"
        elif "windows" in lowered:
            platform = "Windows"
        elif "mac os" in lowered or "macintosh" in lowered:
            platform = "macOS"
        elif "linux" in lowered:
            platform = "Linux"
        else:
            platform = "Web"
    return f"{platform} {browser}".strip()


def _ensure_security_settings(user_id: str) -> dict[str, Any]:
    svc = require_supabase_service()
    result = (
        svc.table("user_security_settings")
        .select("*")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if result.data:
        return result.data[0]

    row = {
        "user_id": user_id,
        "biometric_enabled": False,
        "pin_enabled": False,
        "pin_hash": None,
        "pin_failed_attempts": 0,
        "pin_locked_until": None,
        "trusted_device_hash": None,
        "trusted_device_label": None,
        "last_verified_at": None,
        "created_at": _utcnow().isoformat(),
        "updated_at": _utcnow().isoformat(),
    }
    svc.table("user_security_settings").upsert(row, on_conflict="user_id").execute()
    return row


def _update_security_settings(user_id: str, updates: dict[str, Any]) -> dict[str, Any]:
    svc = require_supabase_service()
    payload = {"user_id": user_id, **updates, "updated_at": _utcnow().isoformat()}
    result = svc.table("user_security_settings").upsert(payload, on_conflict="user_id").execute()
    if result.data:
        return result.data[0]
    return _ensure_security_settings(user_id)


def _count_active_credentials(user_id: str) -> int:
    svc = require_supabase_service()
    result = (
        svc.table("biometric_credentials")
        .select("credential_id", count="exact")
        .eq("user_id", user_id)
        .eq("is_active", True)
        .execute()
    )
    if getattr(result, "count", None) is not None:
        return int(result.count or 0)
    return len(result.data or [])


def _is_current_device_trusted(
    settings_row: dict[str, Any],
    current_device_hash: str,
    candidate_hashes: set[str] | None = None,
) -> bool:
    trusted_hash = str(settings_row.get("trusted_device_hash") or "").strip()
    if not trusted_hash:
        return False
    if hmac.compare_digest(trusted_hash, current_device_hash):
        return True
    for candidate in (candidate_hashes or set()):
        if hmac.compare_digest(trusted_hash, candidate):
            return True
    return False


def _require_trusted_device(
    settings_row: dict[str, Any],
    current_device_hash: str,
    candidate_hashes: set[str] | None = None,
) -> None:
    trusted_hash = str(settings_row.get("trusted_device_hash") or "").strip()
    if trusted_hash and not _is_current_device_trusted(settings_row, current_device_hash, candidate_hashes):
        raise HTTPException(
            status_code=403,
            detail="This device is not trusted for biometric or PIN sign-in. Sign in with password and register this device again.",
        )


def _validate_pin_value(pin: str) -> None:
    if not pin.isdigit():
        raise HTTPException(status_code=422, detail="PIN must contain only digits")
    if len(pin) < 4 or len(pin) > 8:
        raise HTTPException(status_code=422, detail="PIN must be 4 to 8 digits")


def _hash_pin_value(pin: str) -> str:
    import bcrypt  # type: ignore[import-not-found]

    return bcrypt.hashpw(pin.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def _verify_pin_value(pin: str, pin_hash: str) -> bool:
    import bcrypt  # type: ignore[import-not-found]

    try:
        return bcrypt.checkpw(pin.encode("utf-8"), pin_hash.encode("utf-8"))
    except ValueError:
        return False


def _increment_pin_failure(user_id: str, settings_row: dict[str, Any]) -> dict[str, Any]:
    attempts = int(settings_row.get("pin_failed_attempts") or 0) + 1
    updates: dict[str, Any] = {"pin_failed_attempts": attempts}
    if attempts >= PIN_MAX_ATTEMPTS:
        updates["pin_locked_until"] = (_utcnow() + timedelta(minutes=PIN_LOCK_MINUTES)).isoformat()
    return _update_security_settings(user_id, updates)


def _clear_pin_failures(user_id: str) -> dict[str, Any]:
    return _update_security_settings(
        user_id,
        {
            "pin_failed_attempts": 0,
            "pin_locked_until": None,
            "last_verified_at": _utcnow().isoformat(),
        },
    )


def _serialize_security_settings(
    settings_row: dict[str, Any],
    credential_count: int,
    current_device_hash: str,
    candidate_hashes: set[str] | None = None,
    email_hint: str | None = None,
) -> SecuritySettingsResponse:
    locked_until = _parse_timestamp(settings_row.get("pin_locked_until"))
    pin_hash = str(settings_row.get("pin_hash") or "").strip()
    current_device_trusted = _is_current_device_trusted(
        settings_row, current_device_hash, candidate_hashes
    )
    return SecuritySettingsResponse(
        biometric_enabled=bool(settings_row.get("biometric_enabled", False)),
        pin_enabled=bool(settings_row.get("pin_enabled", False)),
        pin_configured=bool(pin_hash),
        pin_failed_attempts=int(settings_row.get("pin_failed_attempts") or 0),
        pin_locked_until=locked_until.isoformat() if locked_until else None,
        trusted_device_label=str(settings_row.get("trusted_device_label") or "").strip() or None,
        current_device_trusted=current_device_trusted,
        credential_count=credential_count,
        can_register_biometric=credential_count == 0 or not current_device_trusted,
        has_biometric_credentials=credential_count > 0,
        email_hint=email_hint,
    )


def _store_webauthn_challenge(user_id: str, challenge: str) -> None:
    svc = require_supabase_service()

    expires_at = datetime.now(timezone.utc).timestamp() + WEBAUTHN_CHALLENGE_TTL_SECONDS
    expires_at_iso = datetime.fromtimestamp(expires_at, tz=timezone.utc).isoformat()

    svc.table("webauthn_challenges").upsert(
        {
            "user_id": user_id,
            "challenge": challenge,
            "expires_at": expires_at_iso,
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
        on_conflict="user_id",
    ).execute()


def _load_webauthn_challenge(user_id: str) -> tuple[str, datetime] | None:
    svc = require_supabase_service()

    row_res = (
        svc.table("webauthn_challenges")
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
    svc = require_supabase_service()
    svc.table("webauthn_challenges").delete().eq("user_id", user_id).execute()


def _extract_role_name(user_row: dict) -> str:
    direct_role = user_row.get("role")
    if isinstance(direct_role, str) and direct_role.strip():
        return direct_role.strip().lower()

    role_obj = user_row.get("roles")
    if isinstance(role_obj, dict):
        role_name = role_obj.get("name")
        if isinstance(role_name, str) and role_name.strip():
            return role_name.strip().lower()
    return SELF_SERVICE_ROLE


def _normalize_role_name(role_name: str | None) -> str:
    if isinstance(role_name, str) and role_name.strip():
        return role_name.strip().lower()
    return "viewer"


def _resolve_origin_and_rp_id(request: Request) -> tuple[str, str]:
    incoming_origin = request.headers.get("origin", "").strip()
    request_origin = f"{request.url.scheme}://{request.url.hostname}"

    if incoming_origin:
        expected_origin = incoming_origin
    else:
        expected_origin = request_origin

    rp_id = settings.webauthn_rp_id or request.url.hostname or urlparse(expected_origin).hostname or "localhost"
    return expected_origin, rp_id


def _bytes_to_base64url(value: bytes) -> str:
    from webauthn import bytes_to_base64url

    return str(bytes_to_base64url(value))


def _sync_auth_role_metadata(user_id: str, role_name: str) -> None:
    client = get_supabase_service()
    if client is None:
        return
    try:
        client.auth.admin.update_user_by_id(
            user_id,
            {
                "app_metadata": {"role": _normalize_role_name(role_name)},
            },
        )
    except Exception:
        # Non-fatal: role is still enforced from DB and token validation.
        return


def _load_active_user_by_email(email: str) -> dict[str, Any]:
    svc = require_supabase_service()

    result = (
        svc.table("users")
        .select("id,email,full_name,role,is_active")
        .eq("email", email)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    user_row = result.data[0]
    if user_row.get("is_active") is False:
        raise HTTPException(status_code=403, detail="User account is inactive")
    return user_row


def _create_magic_link_login_payload(user_row: dict[str, Any]) -> dict[str, str]:
    svc = require_supabase_service()

    user_email = str(user_row.get("email") or "").strip()
    if not user_email:
        raise HTTPException(status_code=400, detail="User account has no email address")

    try:
        link_response = svc.auth.admin.generate_link(
            {
                "type": "magiclink",
                "email": user_email,
                "options": {"redirect_to": "/dashboard"},
            }
        )
        props = getattr(link_response, "properties", None) or {}
        token_hash = getattr(props, "hashed_token", None) or (props.get("hashed_token") if isinstance(props, dict) else None)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail="Failed to create sign-in link") from exc

    if not token_hash:
        raise HTTPException(status_code=500, detail="Supabase sign-in link is missing token_hash")

    return {
        "token_hash": str(token_hash),
        "email": user_email,
        "type": "magiclink",
        "role": _extract_role_name(user_row),
        "user_id": str(user_row.get("id") or ""),
    }


@router.post("/register", response_model=AuthResponse)
async def register(payload: RegisterRequest):
    svc = require_supabase_service()

    existing = svc.table("users").select("id").eq("email", payload.email).limit(1).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="Email already exists")

    try:
        created = svc.auth.admin.create_user(
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

    svc.table("users").upsert(
        {
            "id": user_id,
            "email": payload.email,
            "full_name": payload.full_name,
            "role": SELF_SERVICE_ROLE,
            "is_active": True,
        },
        on_conflict="id",
    ).execute()

    _sync_auth_role_metadata(user_id, SELF_SERVICE_ROLE)

    if get_supabase_anon() is None:
        raise HTTPException(status_code=500, detail="Supabase client is not configured")

    login_result = get_supabase_anon().auth.sign_in_with_password({"email": payload.email, "password": payload.password})
    if not login_result.session:
        raise HTTPException(status_code=500, detail="Registration succeeded but session creation failed")

    audit_log(user_id=user_id, action="auth.register", meta={"email": payload.email, "role": SELF_SERVICE_ROLE})
    return AuthResponse(access_token=login_result.session.access_token, user_id=user_id, role=SELF_SERVICE_ROLE)


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest):
    if get_supabase_anon() is None:
        raise HTTPException(status_code=500, detail="Supabase client is not configured")
    svc = require_supabase_service()

    try:
        auth_result = get_supabase_anon().auth.sign_in_with_password({"email": payload.email, "password": payload.password})
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=401, detail="Invalid credentials") from exc

    if not auth_result.user or not auth_result.session:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    local_user = (
        svc.table("users")
        .select("id,is_active,role")
        .eq("id", str(auth_result.user.id))
        .limit(1)
        .execute()
    )

    if not local_user.data:
        svc.table("users").upsert(
            {
                "id": str(auth_result.user.id),
                "email": payload.email,
                "full_name": auth_result.user.user_metadata.get("full_name") if auth_result.user.user_metadata else payload.email,
                "role": SELF_SERVICE_ROLE,
                "is_active": True,
            },
            on_conflict="id",
        ).execute()
        role_name = SELF_SERVICE_ROLE
    else:
        role_name = _extract_role_name(local_user.data[0])

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
    client = get_supabase_service()
    if client is not None:
        try:
            client.auth.admin.sign_out(user.user_id)
        except Exception:  # noqa: BLE001
            # Non-fatal: local state is cleared on the client side regardless.
            pass
    audit_log(user_id=user.user_id, action="auth.logout")
    return {"message": f"Logged out {user.user_id}"}


@router.get("/security-settings", response_model=SecuritySettingsResponse)
async def get_security_settings(
    request: Request,
    email: str | None = None,
    user: UserContext | None = Depends(_get_current_user_optional),
):
    current_device_hash = _device_binding_hash(request)
    current_device_hashes = _device_binding_hash_candidates(request)

    if user is not None:
        svc = require_supabase_service()
        profile = (
            svc.table("users")
            .select("email")
            .eq("id", user.user_id)
            .limit(1)
            .execute()
        )
        email_hint = None
        if profile.data:
            email_hint = str(profile.data[0].get("email") or "").strip() or None
        settings_row = _ensure_security_settings(user.user_id)
        credential_count = _count_active_credentials(user.user_id)
        return _serialize_security_settings(
            settings_row, credential_count, current_device_hash, current_device_hashes, email_hint
        )

    normalized_email = str(email or "").strip().lower()
    if not normalized_email:
        raise HTTPException(status_code=401, detail="Authentication required or provide email query parameter")

    user_row = _load_active_user_by_email(normalized_email)
    user_id = str(user_row.get("id") or "")
    settings_row = _ensure_security_settings(user_id)
    credential_count = _count_active_credentials(user_id)
    return _serialize_security_settings(
        settings_row, credential_count, current_device_hash, current_device_hashes, normalized_email
    )


@router.patch("/security-settings", response_model=SecuritySettingsResponse)
async def update_security_settings(
    payload: SecuritySettingsUpdateRequest,
    request: Request,
    user: UserContext = Depends(get_current_user),
):
    current_device_hash = _device_binding_hash(request)
    current_device_hashes = _device_binding_hash_candidates(request)
    current_device_label = _device_label(request)
    settings_row = _ensure_security_settings(user.user_id)
    credential_count = _count_active_credentials(user.user_id)

    updates: dict[str, Any] = {}
    if payload.biometric_enabled is not None:
        if payload.biometric_enabled and credential_count <= 0:
            raise HTTPException(status_code=400, detail="Register a biometric credential on this device before enabling biometric sign-in")
        updates["biometric_enabled"] = payload.biometric_enabled
        if payload.biometric_enabled:
            updates["trusted_device_hash"] = current_device_hash
            updates["trusted_device_label"] = current_device_label

    if payload.pin_enabled is not None:
        pin_hash = str(settings_row.get("pin_hash") or "").strip()
        if payload.pin_enabled and not pin_hash:
            raise HTTPException(status_code=400, detail="Set a PIN before enabling PIN sign-in")
        updates["pin_enabled"] = payload.pin_enabled
        if payload.pin_enabled:
            updates["trusted_device_hash"] = current_device_hash
            updates["trusted_device_label"] = current_device_label

    if updates:
        settings_row = _update_security_settings(user.user_id, updates)

    audit_log(
        user_id=user.user_id,
        action="auth.security_settings.update",
        meta={
            "biometric_enabled": bool(settings_row.get("biometric_enabled", False)),
            "pin_enabled": bool(settings_row.get("pin_enabled", False)),
        },
    )
    return _serialize_security_settings(
        settings_row, credential_count, current_device_hash, current_device_hashes
    )


@router.post("/pin/set", response_model=SecuritySettingsResponse)
async def set_login_pin(payload: PinSetRequest, request: Request, user: UserContext = Depends(get_current_user)):
    pin = payload.pin.strip()
    confirm_pin = payload.confirm_pin.strip()
    if pin != confirm_pin:
        raise HTTPException(status_code=400, detail="PIN confirmation does not match")

    _validate_pin_value(pin)
    current_device_hash = _device_binding_hash(request)
    current_device_hashes = _device_binding_hash_candidates(request)
    current_device_label = _device_label(request)
    credential_count = _count_active_credentials(user.user_id)
    settings_row = _update_security_settings(
        user.user_id,
        {
            "pin_hash": _hash_pin_value(pin),
            "pin_enabled": True,
            "pin_failed_attempts": 0,
            "pin_locked_until": None,
            "trusted_device_hash": current_device_hash,
            "trusted_device_label": current_device_label,
        },
    )

    audit_log(user_id=user.user_id, action="auth.pin.set")
    return _serialize_security_settings(
        settings_row, credential_count, current_device_hash, current_device_hashes
    )


@router.post("/pin/verify")
async def verify_login_pin(payload: PinVerifyRequest, request: Request):
    normalized_email = payload.email.strip().lower()
    pin = payload.pin.strip()
    _validate_pin_value(pin)

    user_row = _load_active_user_by_email(normalized_email)
    user_id = str(user_row.get("id") or "")
    if not user_id:
        raise HTTPException(status_code=400, detail="User account is missing id")

    settings_row = _ensure_security_settings(user_id)
    pin_hash = str(settings_row.get("pin_hash") or "").strip()
    if not bool(settings_row.get("pin_enabled", False)) or not pin_hash:
        raise HTTPException(status_code=400, detail="PIN sign-in is not enabled for this account")

    current_device_hash = _device_binding_hash(request)
    current_device_hashes = _device_binding_hash_candidates(request)
    _require_trusted_device(settings_row, current_device_hash, current_device_hashes)

    locked_until = _parse_timestamp(settings_row.get("pin_locked_until"))
    if locked_until and _utcnow() < locked_until:
        raise HTTPException(status_code=423, detail="PIN sign-in is temporarily locked. Wait 5 minutes or sign in with password.")

    if not _verify_pin_value(pin, pin_hash):
        updated_row = _increment_pin_failure(user_id, settings_row)
        attempts = int(updated_row.get("pin_failed_attempts") or 0)
        next_locked_until = _parse_timestamp(updated_row.get("pin_locked_until"))
        if next_locked_until and _utcnow() < next_locked_until:
            raise HTTPException(status_code=423, detail="Too many incorrect PIN attempts. PIN login locked for 5 minutes.")
        remaining = max(PIN_MAX_ATTEMPTS - attempts, 0)
        raise HTTPException(status_code=401, detail=f"Incorrect PIN. {remaining} attempts remaining.")

    _clear_pin_failures(user_id)
    audit_log(user_id=user_id, action="auth.pin.verify", meta={"role": _extract_role_name(user_row)})
    return _create_magic_link_login_payload(user_row)


@router.post("/webauthn/register/challenge")
async def create_webauthn_registration_challenge(request: Request, user: UserContext = Depends(get_current_user)):
    svc = require_supabase_service()

    rows = (
        svc.table("biometric_credentials")
        .select("credential_id,is_active")
        .eq("user_id", user.user_id)
        .eq("is_active", True)
        .execute()
    )

    challenge = secrets.token_urlsafe(32)
    _store_webauthn_challenge(user.user_id, challenge)

    _, rp_id = _resolve_origin_and_rp_id(request)
    return {
        "challenge": challenge,
        "rp_id": rp_id,
        "timeout": 60000,
        "exclude_credentials": [
            {"id": row["credential_id"], "type": "public-key"}
            for row in (rows.data or [])
            if row.get("credential_id")
        ],
    }


@router.post("/webauthn/register")
async def register_webauthn_credential(payload: dict, request: Request, user: UserContext = Depends(get_current_user)):
    svc = require_supabase_service()
    current_device_hash = _device_binding_hash(request)
    current_device_label = _device_label(request)

    credential_id = str(payload.get("credential_id") or "").strip()
    public_key = str(payload.get("public_key") or "").strip()

    attestation_object = str(payload.get("attestation_object") or "").strip()
    client_data_json = str(payload.get("client_data_json") or "").strip()
    transports = payload.get("transports") or []
    device_name = str(payload.get("device_name") or current_device_label or "This device")

    sign_count = int(payload.get("sign_count") or 0)

    if attestation_object and client_data_json and credential_id:
        challenge_state = _load_webauthn_challenge(user.user_id)
        if not challenge_state:
            raise HTTPException(status_code=400, detail="WebAuthn registration challenge is missing or expired")

        expected_challenge, expires_at = challenge_state
        if datetime.now(timezone.utc) > expires_at:
            _clear_webauthn_challenge(user.user_id)
            raise HTTPException(status_code=400, detail="WebAuthn registration challenge expired")

        expected_origin, rp_id = _resolve_origin_and_rp_id(request)
        credential: dict[str, Any] = {
            "id": credential_id,
            "rawId": credential_id,
            "type": "public-key",
            "response": {
                "attestationObject": attestation_object,
                "clientDataJSON": client_data_json,
            },
            "clientExtensionResults": payload.get("client_extension_results") or {},
        }

        try:
            from webauthn import base64url_to_bytes, verify_registration_response

            verification = verify_registration_response(
                credential=credential,
                expected_challenge=base64url_to_bytes(expected_challenge),
                expected_rp_id=rp_id,
                expected_origin=expected_origin,
                require_user_verification=True,
            )
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=401, detail="WebAuthn registration verification failed") from exc
        finally:
            _clear_webauthn_challenge(user.user_id)

        credential_id = _bytes_to_base64url(verification.credential_id)
        public_key = _bytes_to_base64url(verification.credential_public_key)
        sign_count = int(verification.sign_count)
    elif not credential_id or not public_key:
        raise HTTPException(status_code=400, detail="credential_id and public_key are required")

    row = {
        "user_id": user.user_id,
        "credential_id": credential_id,
        "public_key": public_key,
        "device_name": device_name,
        "device_binding_hash": current_device_hash,
        "device_platform": current_device_label,
        "transports": transports,
        "is_active": True,
        "sign_count": sign_count,
        "last_used_at": _utcnow().isoformat(),
    }

    result = svc.table("biometric_credentials").upsert(row, on_conflict="user_id,credential_id").execute()
    _update_security_settings(
        user.user_id,
        {
            "biometric_enabled": True,
            "trusted_device_hash": current_device_hash,
            "trusted_device_label": current_device_label,
            "last_verified_at": _utcnow().isoformat(),
        },
    )
    audit_log(user_id=user.user_id, action="auth.webauthn.register", meta={"device": current_device_label})
    return {"ok": True, "credential": (result.data or [row])[0]}


@router.post("/webauthn/challenge")
async def create_webauthn_challenge(request: Request, user: UserContext = Depends(get_current_user)):
    svc = require_supabase_service()

    rows = (
        svc.table("biometric_credentials")
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


@router.post("/passkey/challenge")
async def create_passkey_login_challenge(payload: dict, request: Request):
    email = str(payload.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=422, detail="email is required")

    user_row = _load_active_user_by_email(email)
    user_id = str(user_row.get("id") or "")
    if not user_id:
        raise HTTPException(status_code=400, detail="User account is missing id")

    settings_row = _ensure_security_settings(user_id)
    if not bool(settings_row.get("biometric_enabled", False)):
        raise HTTPException(status_code=403, detail="Biometric sign-in is disabled for this account")
    current_device_hash = _device_binding_hash(request)
    current_device_hashes = _device_binding_hash_candidates(request)
    _require_trusted_device(settings_row, current_device_hash, current_device_hashes)

    svc = require_supabase_service()
    rows = (
        svc.table("biometric_credentials")
        .select("credential_id,public_key,is_active")
        .eq("user_id", user_id)
        .eq("is_active", True)
        .execute()
    )

    credentials = [
        row for row in (rows.data or []) if row.get("credential_id") and row.get("public_key")
    ]
    if not credentials:
        raise HTTPException(status_code=400, detail="No passkey enrolled for this account. Sign in with password first.")

    challenge = secrets.token_urlsafe(32)
    _store_webauthn_challenge(user_id, challenge)

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
    svc = require_supabase_service()

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
        svc.table("biometric_credentials")
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
        from webauthn import base64url_to_bytes, verify_authentication_response

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

    svc.table("biometric_credentials").update({"sign_count": int(verification.new_sign_count)}).eq(
        "user_id", user.user_id
    ).eq("credential_id", credential_id).execute()

    return {"ok": True, "verified": True}


@router.post("/passkey/login")
async def login_with_passkey(payload: dict, request: Request):
    email = str(payload.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=422, detail="email is required")

    user_row = _load_active_user_by_email(email)
    user_id = str(user_row.get("id") or "")
    if not user_id:
        raise HTTPException(status_code=400, detail="User account is missing id")

    svc = require_supabase_service()
    settings_row = _ensure_security_settings(user_id)
    if not bool(settings_row.get("biometric_enabled", False)):
        raise HTTPException(status_code=403, detail="Biometric sign-in is disabled for this account")

    current_device_hash = _device_binding_hash(request)
    current_device_hashes = _device_binding_hash_candidates(request)
    current_device_label = _device_label(request)
    _require_trusted_device(settings_row, current_device_hash, current_device_hashes)

    challenge_state = _load_webauthn_challenge(user_id)
    if not challenge_state:
        raise HTTPException(status_code=400, detail="Passkey challenge is missing or expired")

    expected_challenge, expires_at = challenge_state
    if datetime.now(timezone.utc) > expires_at:
        _clear_webauthn_challenge(user_id)
        raise HTTPException(status_code=400, detail="Passkey challenge expired")

    credential_id = str(payload.get("credential_id") or "").strip()
    authenticator_data = str(payload.get("authenticator_data") or "").strip()
    client_data_json = str(payload.get("client_data_json") or "").strip()
    signature = str(payload.get("signature") or "").strip()
    user_handle = payload.get("user_handle")

    if not credential_id or not authenticator_data or not client_data_json or not signature:
        raise HTTPException(status_code=400, detail="Missing required passkey assertion fields")

    row_res = (
        svc.table("biometric_credentials")
        .select("credential_id,public_key,sign_count,is_active")
        .eq("user_id", user_id)
        .eq("credential_id", credential_id)
        .eq("is_active", True)
        .limit(1)
        .execute()
    )
    if not row_res.data:
        raise HTTPException(status_code=404, detail="Passkey credential not found")

    cred_row = row_res.data[0]
    if not cred_row.get("public_key"):
        raise HTTPException(status_code=400, detail="Credential is missing public key; re-enroll passkey")

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
        from webauthn import base64url_to_bytes, verify_authentication_response

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
        raise HTTPException(status_code=401, detail="Passkey cryptographic verification failed") from exc
    finally:
        _clear_webauthn_challenge(user_id)

    svc.table("biometric_credentials").update({
        "sign_count": int(verification.new_sign_count),
        "last_used_at": _utcnow().isoformat(),
        "device_binding_hash": current_device_hash,
        "device_platform": current_device_label,
    }).eq(
        "user_id", user_id
    ).eq("credential_id", credential_id).execute()

    _update_security_settings(
        user_id,
        {
            "trusted_device_hash": current_device_hash,
            "trusted_device_label": current_device_label,
            "last_verified_at": _utcnow().isoformat(),
        },
    )

    audit_log(user_id=user_id, action="auth.passkey.login", meta={"role": _extract_role_name(user_row)})
    return _create_magic_link_login_payload(user_row)


@router.get("/me")
async def me(user: UserContext = Depends(get_current_user)):
    svc = require_supabase_service()

    profile = (
        svc.table("users")
        .select("id,email,full_name,role")
        .eq("id", user.user_id)
        .limit(1)
        .execute()
    )
    if not profile.data:
        raise HTTPException(status_code=404, detail="User not found")
    profile_row = profile.data[0]
    role_name = _extract_role_name(profile_row)
    return {
        "id": profile_row["id"],
        "email": profile_row.get("email"),
        "full_name": profile_row.get("full_name"),
        "role": role_name,
    }


@router.get("/biometric/credentials")
async def list_biometric_credentials(user: UserContext = Depends(get_current_user)):
    svc = require_supabase_service()
    rows = (
        svc.table("biometric_credentials")
        .select("id,credential_id,device_name,device_platform,transports,is_active,sign_count,last_used_at,created_at,updated_at")
        .eq("user_id", user.user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return rows.data or []


@router.post("/biometric/credentials")
async def register_biometric_credential_mgmt(payload: dict, user: UserContext = Depends(get_current_user)):
    svc = require_supabase_service()
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
    res = svc.table("biometric_credentials").upsert(row, on_conflict="user_id,credential_id").execute()
    return (res.data or [row])[0]


@router.delete("/biometric/credentials/{credential_id}")
async def deactivate_biometric_credential(credential_id: str, user: UserContext = Depends(get_current_user)):
    svc = require_supabase_service()
    res = (
        svc.table("biometric_credentials")
        .update({"is_active": False})
        .eq("user_id", user.user_id)
        .eq("credential_id", credential_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Credential not found")
    return {"ok": True}


# ── Phone OTP (custom — no Supabase phone provider required) ──────────────────

@router.post("/otp/phone/send")
async def phone_otp_send(payload: dict):
    """
    Send a 6-digit OTP to a phone number via Twilio SMS.

    Body: { "phone": "+8801XXXXXXXXX" }
    Returns: { "phone": str, "expires_in": int }
    """
    phone = str(payload.get("phone") or "").strip()
    if not phone:
        raise HTTPException(status_code=422, detail="phone is required")
    try:
        result = send_phone_otp(phone)
        return result
    except OtpError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/otp/phone/verify")
async def phone_otp_verify(payload: dict):
    """
    Verify a phone OTP and return a Supabase magic-link token the frontend
    uses to create a real Supabase session.

    Body: { "phone": "+8801XXXXXXXXX", "otp": "123456" }
    Returns: { "token_hash": str, "email": str, "type": "magiclink", "role": str, "user_id": str }
    """
    phone = str(payload.get("phone") or "").strip()
    otp = str(payload.get("otp") or "").strip()
    if not phone or not otp:
        raise HTTPException(status_code=422, detail="phone and otp are required")
    try:
        result = verify_phone_otp(phone, otp)
        audit_log(
            user_id=result.get("user_id", "unknown"),
            action="auth.phone_otp.verify",
            meta={"phone_suffix": phone[-4:], "role": result.get("role")},
        )
        return result
    except OtpError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/otp/email/send")
async def email_otp_send(payload: dict):
    """
    Send a 6-digit OTP code to email via Resend-backed backend service.

    Body: { "email": "user@example.com" }
    Returns: { "email": str, "expires_in": int }
    """
    email = str(payload.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=422, detail="email is required")
    try:
        result = send_email_otp(email)
        return result
    except EmailOtpError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/otp/email/verify")
async def email_otp_verify(payload: dict):
    """
    Verify email OTP code and return a Supabase magic-link token payload.

    Body: { "email": "user@example.com", "otp": "123456" }
    Returns: { "token_hash": str, "email": str, "type": "magiclink", "role": str, "user_id": str }
    """
    email = str(payload.get("email") or "").strip().lower()
    otp = str(payload.get("otp") or "").strip()
    if not email or not otp:
        raise HTTPException(status_code=422, detail="email and otp are required")
    try:
        result = verify_email_otp(email, otp)
        local_part = email.split("@", 1)[0] if "@" in email else email
        audit_log(
            user_id=result.get("user_id", "unknown"),
            action="auth.email_otp.verify",
            meta={"email_suffix": local_part[-4:] if local_part else "na", "role": result.get("role")},
        )
        return result
    except EmailOtpError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
