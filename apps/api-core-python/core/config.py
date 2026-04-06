import os
from pathlib import Path
from typing import Mapping

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parents[3]
ROOT_ENV_LOCAL = ROOT_DIR / ".env.local"
ROOT_ENV = ROOT_DIR / ".env"

# Local developer overrides should win over default repository values.
load_dotenv(dotenv_path=ROOT_ENV_LOCAL, override=False)
load_dotenv(dotenv_path=ROOT_ENV, override=False)


class SettingsError(RuntimeError):
    pass


def _split_csv(raw: str) -> tuple[str, ...]:
    seen: set[str] = set()
    out: list[str] = []
    for item in raw.split(","):
        origin = item.strip()
        if not origin:
            continue
        if origin not in seen:
            seen.add(origin)
            out.append(origin)
    return tuple(out)


class Settings:
    def __init__(self, env_map: Mapping[str, str] | None = None) -> None:
        env = env_map or os.environ
        self.app_name = env.get("APP_NAME", "BD CR7 API Core")
        resolved_env = (
            env.get("APP_ENV")
            or env.get("VERCEL_ENV")
            or env.get("ENVIRONMENT")
            or "development"
        )
        self.env = resolved_env.strip().lower()
        if self.env == "preview":
            self.env = "staging"
        self.log_level = env.get("LOG_LEVEL", "INFO").strip().upper()
        self.supabase_url = env.get("SUPABASE_URL", "").strip()
        self.supabase_anon_key = env.get("SUPABASE_ANON_KEY", "").strip()
        self.supabase_service_role_key = env.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
        self.supabase_db_password = env.get("SUPABASE_DB_PASSWORD", "").strip()
        self.database_url = env.get("DATABASE_URL", "").strip()
        cors_default = "http://localhost:3000" if self.env == "development" else ""
        self.cors_origins = _split_csv(env.get("CORS_ORIGINS", cors_default))
        self.redis_url = env.get("REDIS_URL", "").strip()
        self.require_supabase_in_production = env.get("REQUIRE_SUPABASE_IN_PRODUCTION", "false").strip().lower() in {
            "1",
            "true",
            "yes",
            "on",
        }
        self.require_redis_in_production = env.get("REQUIRE_REDIS_IN_PRODUCTION", "true").strip().lower() in {
            "1",
            "true",
            "yes",
            "on",
        }
        self.rate_limit_requests_per_minute = int(env.get("RATE_LIMIT_REQUESTS_PER_MINUTE", "60"))
        self.site_latitude = float(env.get("SITE_LAT", "23.777176"))
        self.site_longitude = float(env.get("SITE_LNG", "90.399452"))
        self.site_max_radius_km = float(env.get("SITE_MAX_RADIUS_KM", "2.0"))
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

        if not (-90 <= self.site_latitude <= 90):
            raise SettingsError("SITE_LAT must be between -90 and 90")

        if not (-180 <= self.site_longitude <= 180):
            raise SettingsError("SITE_LNG must be between -180 and 180")

        if self.site_max_radius_km <= 0:
            raise SettingsError("SITE_MAX_RADIUS_KM must be greater than zero")

        if not self.supabase_url or not self.supabase_anon_key or not self.supabase_service_role_key:
            if self.is_production and self.require_supabase_in_production:
                raise SettingsError("SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are required")

        if self.is_production and not self.cors_origins:
            raise SettingsError("CORS_ORIGINS must be configured in production")

        if any(origin == "*" for origin in self.cors_origins):
            raise SettingsError("Wildcard CORS origin '*' is not allowed")

        if self.is_production and self.require_redis_in_production and not self.redis_url:
            raise SettingsError("REDIS_URL is required in production for distributed rate limiting")


settings = Settings()
