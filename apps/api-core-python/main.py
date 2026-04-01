import json
import os
from typing import Any

try:
    from fastapi import FastAPI
    from fastapi import Response, status
    from fastapi.middleware.cors import CORSMiddleware

    FASTAPI_AVAILABLE = True
except ModuleNotFoundError:
    FASTAPI_AVAILABLE = False
    FastAPI = Any  # type: ignore[misc,assignment]


def create_app() -> Any:
    if not FASTAPI_AVAILABLE:
        async def fallback_app(scope, receive, send):
            if scope.get("type") != "http":
                return
            status_code = 503
            body = json.dumps(
                {
                    "status": "error",
                    "message": "FastAPI dependency missing in runtime",
                }
            ).encode("utf-8")
            await send(
                {
                    "type": "http.response.start",
                    "status": status_code,
                    "headers": [[b"content-type", b"application/json; charset=utf-8"]],
                }
            )
            await send({"type": "http.response.body", "body": body})

        return fallback_app  # type: ignore[return-value]

    from core.config import settings
    from core.logging import configure_logging
    from core.middleware import RateLimitMiddleware
    from core.supabase import supabase_service
    from routers import ai, auth, finance, hr, import_supply, pos, users

    configure_logging(settings.log_level)

    app = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    allowed_origins = list(settings.cors_origins)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )
    app.add_middleware(
        RateLimitMiddleware,
        requests_per_minute=settings.rate_limit_requests_per_minute,
        redis_url=settings.redis_url or None,
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

    @app.get("/ready")
    async def readiness(response: Response) -> dict[str, str]:
        if supabase_service is None:
            response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
            return {"status": "error", "reason": "supabase_service_not_configured"}
        try:
            supabase_service.table("roles").select("id", count="exact").limit(1).execute()
        except Exception:  # noqa: BLE001
            response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
            return {"status": "error", "reason": "dependency_check_failed"}
        return {"status": "ready", "env": settings.env}

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
