import os
from pathlib import Path

from dotenv import load_dotenv

ROOT_ENV = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(dotenv_path=ROOT_ENV)


class Settings:
    app_name: str = os.getenv("APP_NAME", "BD CR7 API Core")
    env: str = os.getenv("APP_ENV", "development")
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_anon_key: str = os.getenv("SUPABASE_ANON_KEY", "")
    supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    supabase_db_password: str = os.getenv("SUPABASE_DB_PASSWORD", "")
    database_url: str = os.getenv("DATABASE_URL", "")

    def __init__(self) -> None:
        if self.database_url and "user:password@" not in self.database_url and "localhost" not in self.database_url:
            return

        # Use Supabase pooler URL when DATABASE_URL is not explicitly provided.
        if self.supabase_url and self.supabase_db_password:
            host = self.supabase_url.replace("https://", "").replace("http://", "")
            project_ref = host.split(".")[0]
            self.database_url = (
                f"postgresql+psycopg://postgres:{self.supabase_db_password}@"
                f"db.{project_ref}.supabase.co:5432/postgres?sslmode=require"
            )
            return

        self.database_url = "postgresql+psycopg://postgres:postgres@localhost:5432/postgres"


settings = Settings()
