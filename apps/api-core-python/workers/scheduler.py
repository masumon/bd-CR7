from __future__ import annotations

from datetime import datetime


def build_salary_sheet_job_payload() -> dict[str, str]:
    return {
        "job": "salary_sheet_generation",
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "status": "queued",
    }


def build_auto_report_job_payload() -> dict[str, str]:
    return {
        "job": "auto_report_generation",
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "status": "queued",
    }
