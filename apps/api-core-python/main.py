from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.supabase import supabase_service
from routers import ai, auth, finance, hr, import_supply, pos, users


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    allowed_origins = [x.strip() for x in __import__("os").getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if x.strip()]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    app.include_router(auth.router, prefix="/auth", tags=["auth"])
    app.include_router(finance.router, prefix="/finance", tags=["finance"])
    app.include_router(hr.router, prefix="/construction", tags=["construction"])
    app.include_router(pos.router, prefix="/pos", tags=["pos"])
    app.include_router(import_supply.router, prefix="/import-supply", tags=["import_supply"])
    app.include_router(ai.router, prefix="/ai", tags=["ai"])
    app.include_router(users.router, prefix="/users", tags=["users"])

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok", "env": settings.env}

    @app.get("/health/db")
    async def health_db() -> dict[str, str | int]:
        if supabase_service is None:
            return {"status": "error", "roles": 0}
        try:
            roles = supabase_service.table("roles").select("id", count="exact").limit(1).execute()
            return {"status": "ok", "roles": int(roles.count or 0)}
        except Exception:  # noqa: BLE001
            return {"status": "error", "roles": 0}

    return app


app = create_app()
