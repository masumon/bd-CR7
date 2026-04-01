import unittest
from pathlib import Path
import sys

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from core.config import Settings, SettingsError


class SettingsTests(unittest.TestCase):
    def test_production_requires_redis(self) -> None:
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