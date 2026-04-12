"""
phone_otp_service.py
──────────────────────────────────────────────────────────────────────────────
Phone OTP system for BD CR7 ERP.

Preferred path:
    1. Use Twilio Verify Service (TWILIO_VERIFY_SERVICE_SID) to send/check OTP.
    2. On successful verification, issue a Supabase magic-link token.

Fallback path:
    1. Python generates a 6-digit OTP, hashes it, stores in phone_otp_verifications.
    2. Sends SMS via Twilio Messaging API.
    3. On verify, checks hash + expiry + attempt limit.
    4. On success, creates a Supabase magic-link token.
"""

from __future__ import annotations

import hashlib
import random
import secrets
from datetime import datetime, timezone

import httpx

from core.config import settings
from core.supabase import get_supabase_service, require_supabase_service

# ── Constants ──────────────────────────────────────────────────────────────────
OTP_LENGTH = 6
TWILIO_MESSAGES_URL = "https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
TWILIO_VERIFY_URL = "https://verify.twilio.com/v2/Services/{service_sid}/Verifications"
TWILIO_VERIFY_CHECK_URL = "https://verify.twilio.com/v2/Services/{service_sid}/VerificationCheck"


def _map_twilio_error(message: str) -> str:
    lowered = message.lower()
    if "63038" in message or "daily messages limit" in lowered:
        return "আজকের Twilio SMS limit শেষ হয়েছে। আগামীকাল আবার চেষ্টা করুন বা Twilio account upgrade করুন।"
    if "21266" in message or "to' and 'from' number cannot be the same" in lowered:
        return "OTP পাঠানো যাচ্ছে না, কারণ receiver number এবং sender number একই। অন্য ফোন নম্বর ব্যবহার করুন।"
    if "21659" in message or "is not a twilio phone number" in lowered or "country mismatch" in lowered:
        return "Twilio sender configuration সঠিক নয়। Verify Service বা valid SMS sender number ব্যবহার করুন।"
    return message


# ── Helpers ────────────────────────────────────────────────────────────────────

def _generate_otp() -> str:
    """Cryptographically secure 6-digit OTP."""
    return str(random.SystemRandom().randint(100_000, 999_999))


def _hash_otp(otp: str, phone: str, salt: str) -> str:
    """SHA-256 of 'OTP|phone|salt' — resistant to length-extension attacks."""
    raw = f"{otp}|{phone}|{salt}"
    return hashlib.sha256(raw.encode()).hexdigest()


def _normalize_phone(phone: str) -> str:
    """
    Ensure the number is in E.164 format.
    Bangladeshi numbers: 01XXXXXXXXX → +8801XXXXXXXXX
    """
    phone = phone.strip().replace(" ", "").replace("-", "")
    if phone.startswith("01") and len(phone) == 11:
        phone = "+880" + phone[1:]
    elif phone.startswith("880") and not phone.startswith("+"):
        phone = "+" + phone
    return phone


# ── SMS Sender ─────────────────────────────────────────────────────────────────

def _send_sms_twilio(to: str, body: str) -> None:
    """
    Send SMS via Twilio Messaging REST API.
    Uses httpx (already in requirements) — no Twilio SDK needed.
    Raises RuntimeError on failure.
    """
    url = TWILIO_MESSAGES_URL.format(sid=settings.twilio_account_sid)
    data = {"To": to, "Body": body}
    if settings.twilio_messaging_service_sid:
        data["MessagingServiceSid"] = settings.twilio_messaging_service_sid
    elif settings.twilio_from_number:
        data["From"] = settings.twilio_from_number
    else:
        raise RuntimeError(
            "SMS provider is missing sender configuration. Set TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID."
        )
    try:
        with httpx.Client(timeout=15) as client:
            resp = client.post(
                url,
                auth=(settings.twilio_account_sid, settings.twilio_auth_token),
                data=data,
            )
            resp.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise RuntimeError(_map_twilio_error(exc.response.text)) from exc
    except httpx.RequestError as exc:
        raise RuntimeError(f"SMS network error: {exc}") from exc


def _send_verify_otp_twilio(to: str) -> None:
    url = TWILIO_VERIFY_URL.format(service_sid=settings.twilio_verify_service_sid)
    try:
        with httpx.Client(timeout=15) as client:
            resp = client.post(
                url,
                auth=(settings.twilio_account_sid, settings.twilio_auth_token),
                data={"To": to, "Channel": "sms"},
            )
            resp.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise RuntimeError(_map_twilio_error(exc.response.text)) from exc
    except httpx.RequestError as exc:
        raise RuntimeError(f"Twilio Verify network error: {exc}") from exc


def _check_verify_otp_twilio(to: str, otp_input: str) -> None:
    url = TWILIO_VERIFY_CHECK_URL.format(service_sid=settings.twilio_verify_service_sid)
    try:
        with httpx.Client(timeout=15) as client:
            resp = client.post(
                url,
                auth=(settings.twilio_account_sid, settings.twilio_auth_token),
                data={"To": to, "Code": otp_input},
            )
            resp.raise_for_status()
            payload = resp.json()
    except httpx.HTTPStatusError as exc:
        raise RuntimeError(_map_twilio_error(exc.response.text)) from exc
    except httpx.RequestError as exc:
        raise RuntimeError(f"Twilio Verify network error: {exc}") from exc

    if str(payload.get("status") or "").lower() != "approved":
        raise OtpError("ভুল OTP। আবার চেষ্টা করুন।")


def _build_sms_body(otp: str) -> str:
    return (
        f"BD CR7 ERP — আপনার OTP কোড: {otp}\n"
        f"এই কোডটি {settings.phone_otp_ttl_seconds // 60} মিনিটের জন্য বৈধ।\n"
        f"কাউকে শেয়ার করবেন না।"
    )


# ── Public API ─────────────────────────────────────────────────────────────────

class OtpError(Exception):
    """Raised for expected OTP flow errors (wrong code, expired, etc.)."""


def send_phone_otp(raw_phone: str) -> dict:
    """
    Generate OTP, store hash in Supabase, and send SMS.
    Returns {"phone": normalized_phone, "expires_in": seconds}
    Raises OtpError or RuntimeError on failure.
    """
    if get_supabase_service() is None:
        raise RuntimeError("Supabase service client not configured")

    if not settings.has_sms:
        raise OtpError(
            "SMS provider not configured. "
            "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER in environment."
        )

    phone = _normalize_phone(raw_phone)
    if not phone.startswith("+") or len(phone) < 8:
        raise OtpError(f"Invalid phone number format: {raw_phone!r}")

    if settings.twilio_verify_service_sid:
        _send_verify_otp_twilio(phone)
        return {"phone": phone, "expires_in": settings.phone_otp_ttl_seconds}

    svc = require_supabase_service()

    # Cleanup old OTPs for this number + expired rows globally
    try:
        svc.rpc("cleanup_expired_phone_otps", {}).execute()
        svc.table("phone_otp_verifications").delete().eq("phone", phone).execute()
    except Exception:
        pass  # non-fatal — we will upsert a fresh row anyway

    otp = _generate_otp()
    salt = secrets.token_hex(16)
    otp_hash = _hash_otp(otp, phone, salt)

    expires_at = (
        datetime.now(timezone.utc).timestamp() + settings.phone_otp_ttl_seconds
    )
    expires_at_iso = datetime.fromtimestamp(expires_at, tz=timezone.utc).isoformat()

    svc.table("phone_otp_verifications").insert(
        {
            "phone": phone,
            "otp_hash": otp_hash,
            "salt": salt,
            "expires_at": expires_at_iso,
            "attempts": 0,
            "verified": False,
        }
    ).execute()

    # Send SMS — if this fails, caller gets a RuntimeError with a clear message
    _send_sms_twilio(phone, _build_sms_body(otp))

    return {"phone": phone, "expires_in": settings.phone_otp_ttl_seconds}


def verify_phone_otp(raw_phone: str, otp_input: str) -> dict:
    """
    Verify a phone OTP and, on success, return a Supabase magic-link token
    that the frontend exchanges for a session via supabase.auth.verifyOtp().

    Returns:
        {
            "token_hash": str,   # passed to supabase.auth.verifyOtp
            "email": str,        # owner's email (needed for verifyOtp call)
            "type": "magiclink"
        }

    Raises OtpError on bad/expired/maxed codes.
    Raises RuntimeError on unexpected backend errors.
    """
    if get_supabase_service() is None:
        raise RuntimeError("Supabase service client not configured")

    phone = _normalize_phone(raw_phone)
    otp_input = otp_input.strip()

    svc = require_supabase_service()

    if settings.twilio_verify_service_sid:
        _check_verify_otp_twilio(phone, otp_input)
    else:
        # Load OTP row
        rows = (
            svc.table("phone_otp_verifications")
            .select("id,otp_hash,salt,expires_at,attempts,verified")
            .eq("phone", phone)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )

        if not rows.data:
            raise OtpError("OTP পাওয়া যায়নি। আবার OTP পাঠান।")

        row = rows.data[0]
        row_id = row["id"]

        if row.get("verified"):
            raise OtpError("এই OTP আগেই ব্যবহার হয়ে গেছে। নতুন OTP পাঠান।")

        # Check expiry
        expires_at_str = row.get("expires_at", "")
        if expires_at_str:
            expires_at = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
            if datetime.now(timezone.utc) > expires_at:
                raise OtpError("OTP মেয়াদ শেষ হয়ে গেছে। নতুন OTP পাঠান।")

        # Increment attempts
        attempts = int(row.get("attempts") or 0) + 1
        if attempts > settings.phone_otp_max_attempts:
            raise OtpError("অনেকবার ভুল OTP দেওয়া হয়েছে। নতুন OTP পাঠান।")

        svc.table("phone_otp_verifications").update(
            {"attempts": attempts}
        ).eq("id", row_id).execute()

        # Verify hash
        expected_hash = _hash_otp(otp_input, phone, str(row["salt"]))
        if not secrets.compare_digest(expected_hash, str(row["otp_hash"])):
            raise OtpError(f"ভুল OTP। {settings.phone_otp_max_attempts - attempts} টি সুযোগ বাকি।")

        # Mark as verified
        svc.table("phone_otp_verifications").update(
            {"verified": True}
        ).eq("id", row_id).execute()

    # Look up user by phone in our users table
    user_rows = (
        svc.table("users")
        .select("id,email,role")
        .eq("phone", phone)
        .eq("is_active", True)
        .limit(1)
        .execute()
    )

    if not user_rows.data:
        raise OtpError(
            "এই ফোন নম্বরে কোনো অ্যাকাউন্ট নেই। "
            "অ্যাকাউন্ট তৈরি করে প্রোফাইলে ফোন নম্বর সংরক্ষণ করুন।"
        )

    user = user_rows.data[0]
    user_email = str(user.get("email") or "")
    if not user_email:
        raise OtpError("অ্যাকাউন্টে ইমেইল নেই। ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন।")

    # Generate a Supabase magic-link token for this user so the frontend
    # can call supabase.auth.verifyOtp({token_hash, type: "magiclink"}) to
    # get a real session — no password required.
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
        if not token_hash:
            raise RuntimeError("Supabase generate_link returned no token_hash")
    except Exception as exc:
        raise RuntimeError(f"Session creation failed: {exc}") from exc

    return {
        "token_hash": str(token_hash),
        "email": user_email,
        "type": "magiclink",
        "role": str(user.get("role") or "worker"),
        "user_id": str(user.get("id") or ""),
    }
