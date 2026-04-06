"""
Structured JSON logging for BD CR7 API.

Produces machine-parseable JSON log lines in production/staging and
human-readable plain text in development.  Every log record includes:
  - timestamp (ISO-8601 UTC)
  - level, logger name, message
  - request_id  (per-request correlation ID set by middleware)
"""
from __future__ import annotations

import logging
import sys
from contextvars import ContextVar

_request_id_var: ContextVar[str] = ContextVar("request_id", default="-")


def set_request_id(rid: str) -> None:
    """Call once per request (e.g. from middleware) to attach a correlation ID."""
    _request_id_var.set(rid)


def get_request_id() -> str:
    return _request_id_var.get()


class _RequestIdFilter(logging.Filter):
    """Injects the current request_id into every LogRecord."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = _request_id_var.get()  # type: ignore[attr-defined]
        return True


def configure_logging(level: str = "INFO", env: str = "development") -> None:
    """
    Configure root logger.
    - production / staging → structured JSON (via python-json-logger)
    - development          → human-readable plain text with request_id
    """
    root_logger = logging.getLogger()
    if root_logger.handlers:
        root_logger.setLevel(level)
        return

    use_json = env.lower() not in ("development", "dev", "local", "test")

    if use_json:
        try:
            try:
                from pythonjsonlogger.json import JsonFormatter  # python-json-logger >= 3.x
            except ImportError:
                from pythonjsonlogger.jsonlogger import JsonFormatter  # legacy 2.x fallback

            handler = logging.StreamHandler(sys.stdout)
            handler.addFilter(_RequestIdFilter())
            formatter = JsonFormatter(
                fmt="%(asctime)s %(levelname)s %(name)s %(message)s %(request_id)s",
                datefmt="%Y-%m-%dT%H:%M:%SZ",
                rename_fields={
                    "asctime": "timestamp",
                    "levelname": "level",
                    "name": "logger",
                },
            )
            handler.setFormatter(formatter)
            root_logger.addHandler(handler)
            root_logger.setLevel(level)
            return
        except ImportError:
            pass  # Library missing — fall through to plain text

    # Plain-text for development or when python-json-logger is absent
    handler = logging.StreamHandler(sys.stdout)
    handler.addFilter(_RequestIdFilter())
    handler.setFormatter(
        logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] %(name)s  rid=%(request_id)s  %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S",
        )
    )
    root_logger.addHandler(handler)
    root_logger.setLevel(level)
