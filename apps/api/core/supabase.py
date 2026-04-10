from supabase import Client, create_client

from core.config import settings

supabase_anon: Client | None = None
supabase_service: Client | None = None

if settings.supabase_url and settings.supabase_anon_key:
    supabase_anon = create_client(settings.supabase_url, settings.supabase_anon_key)

if settings.supabase_url and settings.supabase_service_role_key:
    supabase_service = create_client(settings.supabase_url, settings.supabase_service_role_key)
