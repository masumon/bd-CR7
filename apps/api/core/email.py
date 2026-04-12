"""
Email Service — core/email.py
Sends transactional emails via the Resend API using httpx (already a dependency).
Falls back gracefully when RESEND_API_KEY is not configured — never raises.

Usage:
    from core.email import send_email, send_deadline_alert, send_payment_notification

All helpers return True on success, False when email is not configured or send fails.
"""
from __future__ import annotations

import logging
from typing import Any

import httpx

from core.config import settings

logger = logging.getLogger(__name__)

_RESEND_API_URL = "https://api.resend.com/emails"


def _api_key() -> str | None:
    return getattr(settings, "resend_api_key", None) or None


def _from_address() -> str:
    return getattr(settings, "email_from", None) or "noreply@bdcr7.app"


def send_email(
    *,
    to: str | list[str],
    subject: str,
    html: str,
    from_address: str | None = None,
) -> bool:
    """
    Send a transactional email via Resend.

    Returns True on success, False when unconfigured or on failure.
    Never raises — callers may fire-and-forget.
    """
    api_key = _api_key()
    if not api_key:
        logger.warning(
            "email_skipped reason=RESEND_API_KEY_not_configured subject=%r", subject
        )
        return False

    recipients = [to] if isinstance(to, str) else to
    payload: dict[str, Any] = {
        "from": from_address or _from_address(),
        "to": recipients,
        "subject": subject,
        "html": html,
    }

    try:
        response = httpx.post(
            _RESEND_API_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=10.0,
        )
        response.raise_for_status()
        logger.info("email_sent to=%s subject=%r", recipients, subject)
        return True
    except httpx.HTTPStatusError as exc:
        logger.error(
            "email_send_failed status=%s body=%s",
            exc.response.status_code,
            exc.response.text,
        )
        return False
    except Exception as exc:  # noqa: BLE001
        logger.error("email_send_error error=%s", exc)
        return False


# ── Convenience helpers ────────────────────────────────────────────────────────


def send_deadline_alert(*, to: str, project_name: str, deadline: str) -> bool:
    """Notify a user about an upcoming project deadline."""
    return send_email(
        to=to,
        subject=f"[BD CR7] Deadline Alert — {project_name}",
        html=f"""
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#e53e3e">Project Deadline Alert</h2>
          <p>The project <strong>{project_name}</strong> has a deadline on
          <strong>{deadline}</strong>.</p>
          <p>Please ensure all tasks are completed on time.</p>
          <hr style="border:none;border-top:1px solid #eee">
          <p style="color:#888;font-size:12px">BD CR7 Construction ERP</p>
        </div>
        """,
    )


def send_payment_notification(*, to: str, amount: str, description: str) -> bool:
    """Notify a user that a payment has been processed."""
    return send_email(
        to=to,
        subject="[BD CR7] Payment Notification",
        html=f"""
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#2b6cb0">Payment Notification</h2>
          <p>A payment of <strong>{amount}</strong> has been processed.</p>
          <p style="color:#555"><em>{description}</em></p>
          <hr style="border:none;border-top:1px solid #eee">
          <p style="color:#888;font-size:12px">BD CR7 Construction ERP</p>
        </div>
        """,
    )


def send_report_ready(*, to: str, report_name: str, report_url: str | None = None) -> bool:
    """Notify a user that their report is ready for download."""
    download_link = (
        f'<p><a href="{report_url}" style="color:#2b6cb0">Download Report</a></p>'
        if report_url
        else ""
    )
    return send_email(
        to=to,
        subject=f"[BD CR7] Report Ready — {report_name}",
        html=f"""
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#276749">Report Ready</h2>
          <p>Your report <strong>{report_name}</strong> is ready.</p>
          {download_link}
          <hr style="border:none;border-top:1px solid #eee">
          <p style="color:#888;font-size:12px">BD CR7 Construction ERP</p>
        </div>
        """,
    )


def send_approval_request(
    *, to: str, entity_type: str, entity_id: str, requested_by: str
) -> bool:
    """Notify an approver that a new item needs their review."""
    return send_email(
        to=to,
        subject=f"[BD CR7] Approval Required — {entity_type}",
        html=f"""
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#744210">Approval Required</h2>
          <p>A new <strong>{entity_type}</strong> (ID: <code>{entity_id}</code>)
          submitted by <strong>{requested_by}</strong> requires your approval.</p>
          <p>Please log in to the BD CR7 portal to review it.</p>
          <hr style="border:none;border-top:1px solid #eee">
          <p style="color:#888;font-size:12px">BD CR7 Construction ERP</p>
        </div>
        """,
    )
