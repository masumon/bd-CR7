from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from core.config import settings
from core.email import send_email
from core.supabase import get_supabase_service, require_supabase_service


class EmailOtpError(Exception):
    """Raised for expected email OTP flow errors."""


def _normalize_email(raw_email: str) -> str:
    return str(raw_email or "").strip().lower()


def _generate_otp() -> str:
    return str(secrets.randbelow(900_000) + 100_000)


def _hash_otp(otp: str, email: str, salt: str) -> str:
    raw = f"{otp}|{email}|{salt}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _cleanup_expired_email_otps() -> None:
    svc = require_supabase_service()
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        svc.table("email_otp_verifications").delete().lt("expires_at", now_iso).execute()
    except Exception:
        # Non-fatal: cleanup is best-effort.
        return


def send_email_otp(raw_email: str) -> dict:
    if get_supabase_service() is None:
        raise RuntimeError("Supabase service client not configured")

    if not settings.has_email or not settings.email_from:
        raise EmailOtpError(
            "Email OTP provider is not configured. Set RESEND_API_KEY and EMAIL_FROM in environment."
        )

    email = _normalize_email(raw_email)
    if not email or "@" not in email:
        raise EmailOtpError("Invalid email format.")

    svc = require_supabase_service()
    user_rows = (
        svc.table("users")
        .select("id,email,is_active")
        .eq("email", email)
        .eq("is_active", True)
        .limit(1)
        .execute()
    )
    if not user_rows.data:
        raise EmailOtpError("No active account found for this email.")

    _cleanup_expired_email_otps()
    try:
        svc.table("email_otp_verifications").delete().eq("email", email).execute()
    except Exception:
        # Non-fatal: upsert path below remains authoritative.
        pass

    otp = _generate_otp()
    salt = secrets.token_hex(16)
    otp_hash = _hash_otp(otp, email, salt)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.email_otp_ttl_seconds)

    svc.table("email_otp_verifications").insert(
        {
            "email": email,
            "otp_hash": otp_hash,
            "salt": salt,
            "expires_at": expires_at.isoformat(),
            "attempts": 0,
            "verified": False,
        }
    ).execute()

    sent = send_email(
        to=email,
        subject="[BD CR7] Login OTP Code",
        html=(
            "<div style=\"font-family:sans-serif;max-width:600px;margin:auto\">"
            "<h2 style=\"color:#2b6cb0\">Your login code</h2>"
            f"<p>Use this OTP to sign in: <strong style=\"font-size:24px;letter-spacing:4px\">{otp}</strong></p>"
            f"<p>This code is valid for {max(settings.email_otp_ttl_seconds // 60, 1)} minute(s).</p>"
            "<p>Do not share this code with anyone.</p>"
            "<hr style=\"border:none;border-top:1px solid #eee\">"
            "<p style=\"color:#888;font-size:12px\">BD CR7 Construction ERP</p>"
            "</div>"
        ),
    )
    if not sent:
        raise RuntimeError(
            "Failed to send OTP email. Verify RESEND_API_KEY and EMAIL_FROM (verified sender domain) in environment."
        )

    return {"email": email, "expires_in": settings.email_otp_ttl_seconds}


def verify_email_otp(raw_email: str, otp_input: str) -> dict:
    if get_supabase_service() is None:
        raise RuntimeError("Supabase service client not configured")

    email = _normalize_email(raw_email)
    otp = str(otp_input or "").strip()
    if not email or "@" not in email:
        raise EmailOtpError("Invalid email format.")
    if not otp or not otp.isdigit() or len(otp) != 6:
        raise EmailOtpError("OTP must be a 6-digit code.")

    svc = require_supabase_service()
    rows = (
        svc.table("email_otp_verifications")
        .select("id,otp_hash,salt,expires_at,attempts,verified")
        .eq("email", email)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not rows.data:
        raise EmailOtpError("OTP not found. Please request a new code.")

    row = rows.data[0]
    row_id = row["id"]
    if row.get("verified"):
        raise EmailOtpError("This OTP has already been used. Request a new code.")

    expires_at_raw = str(row.get("expires_at") or "")
    if expires_at_raw:
        expires_at = datetime.fromisoformat(expires_at_raw.replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > expires_at:
            raise EmailOtpError("OTP expired. Request a new code.")

    attempts = int(row.get("attempts") or 0) + 1
    if attempts > settings.email_otp_max_attempts:
        raise EmailOtpError("Too many incorrect attempts. Request a new code.")

    svc.table("email_otp_verifications").update({"attempts": attempts}).eq("id", row_id).execute()

    expected_hash = _hash_otp(otp, email, str(row.get("salt") or ""))
    if not secrets.compare_digest(expected_hash, str(row.get("otp_hash") or "")):
        remaining = max(settings.email_otp_max_attempts - attempts, 0)
        raise EmailOtpError(f"Incorrect OTP. {remaining} attempt(s) remaining.")

    svc.table("email_otp_verifications").update({"verified": True}).eq("id", row_id).execute()

    user_rows = (
        svc.table("users")
        .select("id,email,role")
        .eq("email", email)
        .eq("is_active", True)
        .limit(1)
        .execute()
    )
    if not user_rows.data:
        raise EmailOtpError("No active account found for this email.")

    user = user_rows.data[0]
    user_email = str(user.get("email") or "").strip()
    if not user_email:
        raise EmailOtpError("Account email is missing.")

    try:
        link_response = svc.auth.admin.generate_link(
            {
                "type": "magiclink",
                "email": user_email,
                "options": {"redirect_to": "/dashboard"},
            }
        )
        props = getattr(link_response, "properties", None) or {}
        token_hash = getattr(props, "hashed_token", None) or (
            props.get("hashed_token") if isinstance(props, dict) else None
        )
    except Exception as exc:
        raise RuntimeError("Session creation failed.") from exc

    if not token_hash:
        raise RuntimeError("Session creation failed: token hash missing.")

    return {
        "token_hash": str(token_hash),
        "email": user_email,
        "type": "magiclink",
        "role": str(user.get("role") or "viewer"),
        "user_id": str(user.get("id") or ""),
    }
