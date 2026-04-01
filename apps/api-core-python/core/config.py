import os
from pathlib import Path
from typing import Mapping

from dotenv import load_dotenv

ROOT_ENV = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(dotenv_path=ROOT_ENV)


class SettingsError(RuntimeError):
    pass


def _split_csv(raw: str) -> tuple[str, ...]:
    return tuple(item.strip() for item in raw.split(",") if item.strip())


class Settings:
    def __init__(self, env_map: Mapping[str, str] | None = None) -> None:
        env = env_map or os.environ
        self.app_name = env.get("APP_NAME", "BD CR7 API Core")
        self.env = env.get("APP_ENV", "development").strip().lower()
        self.log_level = env.get("LOG_LEVEL", "INFO").strip().upper()
        self.supabase_url = env.get("SUPABASE_URL", "").strip()
        self.supabase_anon_key = env.get("SUPABASE_ANON_KEY", "").strip()
        self.supabase_service_role_key = env.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
        self.supabase_db_password = env.get("SUPABASE_DB_PASSWORD", "").strip()
        self.database_url = env.get("DATABASE_URL", "").strip()
        self.cors_origins = _split_csv(env.get("CORS_ORIGINS", "http://localhost:3000"))
        self.redis_url = env.get("REDIS_URL", "").strip()
        self.rate_limit_requests_per_minute = int(env.get("RATE_LIMIT_REQUESTS_PER_MINUTE", "60"))
        self.is_production = self.env in {"production", "staging"}
        self.database_url = self._resolve_database_url()
        self._validate()

    def _resolve_database_url(self) -> str:
        if self.database_url and "user:password@" not in self.database_url:
            return self.database_url

        if self.supabase_url and self.supabase_db_password:
            host = self.supabase_url.replace("https://", "").replace("http://", "")
            project_ref = host.split(".")[0]
            return (
                f"postgresql+psycopg://postgres:{self.supabase_db_password}@"
                f"db.{project_ref}.supabase.co:5432/postgres?sslmode=require"
            )

        return "postgresql+psycopg://postgres:postgres@localhost:5432/postgres"

    def _validate(self) -> None:
        if self.rate_limit_requests_per_minute <= 0:
            raise SettingsError("RATE_LIMIT_REQUESTS_PER_MINUTE must be greater than zero")

        if not self.supabase_url or not self.supabase_anon_key or not self.supabase_service_role_key:
            if self.is_production:
                raise SettingsError("SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are required")

        if self.is_production and not self.cors_origins:
            raise SettingsError("CORS_ORIGINS must be configured in production")

        if self.is_production and not self.redis_url:
            raise SettingsError("REDIS_URL is required in production for distributed rate limiting")


settings = Settings()
