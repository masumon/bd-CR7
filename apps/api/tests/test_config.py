import unittest
from pathlib import Path
import sys

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from core.config import Settings, SettingsError


class SettingsTests(unittest.TestCase):
    def test_production_requires_supabase_by_default(self) -> None:
        # REQUIRE_SUPABASE_IN_PRODUCTION defaults to true — missing credentials raise.
        with self.assertRaises(SettingsError):
            Settings({"APP_ENV": "production", "CORS_ORIGINS": "https://app.example.com"})

    def test_production_skips_supabase_when_flag_disabled(self) -> None:
        settings = Settings(
            {
                "APP_ENV": "production",
                "CORS_ORIGINS": "https://app.example.com",
                "REQUIRE_SUPABASE_IN_PRODUCTION": "false",
                "REQUIRE_REDIS_IN_PRODUCTION": "false",
            }
        )
        self.assertFalse(settings.require_supabase_in_production)

    def test_production_requires_redis_by_default(self) -> None:
        # REQUIRE_REDIS_IN_PRODUCTION defaults to true — missing REDIS_URL raises.
        with self.assertRaises(SettingsError):
            Settings(
                {
                    "APP_ENV": "production",
                    "SUPABASE_URL": "https://demo.supabase.co",
                    "SUPABASE_ANON_KEY": "anon",
                    "SUPABASE_SERVICE_ROLE_KEY": "service",
                    "CORS_ORIGINS": "https://app.example.com",
                }
            )

    def test_production_skips_redis_when_flag_disabled(self) -> None:
        settings = Settings(
            {
                "APP_ENV": "production",
                "SUPABASE_URL": "https://demo.supabase.co",
                "SUPABASE_ANON_KEY": "anon",
                "SUPABASE_SERVICE_ROLE_KEY": "service",
                "CORS_ORIGINS": "https://app.example.com",
                "REQUIRE_REDIS_IN_PRODUCTION": "false",
            }
        )
        self.assertFalse(settings.require_redis_in_production)

    def test_production_requires_redis_when_strict_flag_enabled(self) -> None:
        with self.assertRaises(SettingsError):
            Settings(
                {
                    "APP_ENV": "production",
                    "SUPABASE_URL": "https://demo.supabase.co",
                    "SUPABASE_ANON_KEY": "anon",
                    "SUPABASE_SERVICE_ROLE_KEY": "service",
                    "CORS_ORIGINS": "https://app.example.com",
                    "REQUIRE_REDIS_IN_PRODUCTION": "true",
                }
            )

    def test_supabase_url_builds_database_url(self) -> None:
        settings = Settings(
            {
                "SUPABASE_URL": "https://projectref.supabase.co",
                "SUPABASE_ANON_KEY": "anon",
                "SUPABASE_SERVICE_ROLE_KEY": "service",
                "SUPABASE_DB_PASSWORD": "secret",
            }
        )
        self.assertIn("db.projectref.supabase.co", settings.database_url)


if __name__ == "__main__":
    unittest.main()
