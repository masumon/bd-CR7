from __future__ import annotations

from functools import lru_cache
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from supabase import Client


@lru_cache(maxsize=1)
def get_supabase_anon() -> Client | None:
    """Lazy-initialised anon client – created on first call, cached forever."""
    from supabase import create_client
    from core.config import settings

    if settings.supabase_url and settings.supabase_anon_key:
        return create_client(settings.supabase_url, settings.supabase_anon_key)
    return None


@lru_cache(maxsize=1)
def get_supabase_service() -> Client | None:
    """Lazy-initialised service-role client – created on first call, cached forever."""
    from supabase import create_client
    from core.config import settings

    if settings.supabase_url and settings.supabase_service_role_key:
        return create_client(settings.supabase_url, settings.supabase_service_role_key)
    return None


def require_supabase_service() -> Client:
    """Return the service client or raise 503."""
    client = get_supabase_service()
    if client is None:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Supabase service client is not configured")
    return client
