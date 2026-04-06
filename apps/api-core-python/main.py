import json
import os
from typing import Any

try:
    from fastapi import FastAPI
    from fastapi import HTTPException
    from fastapi import Request
    from fastapi import Response, status
    from fastapi.exceptions import RequestValidationError
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import JSONResponse

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
    from routers import ai, ai_employment, approval_intelligence, auth, finance, hr, import_supply, pos, project_management, users

    configure_logging(settings.log_level, env=settings.env)

    # Disable interactive API docs in production — schema is still available via /openapi.json
    # for internal tooling, but the browsable UI should not be publicly exposed.
    docs_url = None if settings.is_production else "/docs"
    redoc_url = None if settings.is_production else "/redoc"

    app = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        docs_url=docs_url,
        redoc_url=redoc_url,
    )

    allowed_origins = list(settings.cors_origins)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "Accept"],
    )
    app.add_middleware(
        RateLimitMiddleware,
        requests_per_minute=settings.rate_limit_requests_per_minute,
        redis_url=settings.redis_url or None,
        fail_closed_without_redis=settings.is_production and settings.require_redis_in_production,
    )

    @app.middleware("http")
    async def request_id_middleware(request: Request, call_next):
        import uuid
        from core.logging import set_request_id
        rid = request.headers.get("X-Request-Id") or str(uuid.uuid4())[:8]
        set_request_id(rid)
        response = await call_next(request)
        response.headers["X-Request-Id"] = rid
        return response

    @app.middleware("http")
    async def security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(self)"
        if settings.is_production:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
            response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'"
        return response

    @app.middleware("http")
    async def response_envelope(request: Request, call_next):
        response = await call_next(request)
        if not request.url.path.startswith("/api"):
            return response

        content_type = response.headers.get("content-type", "")
        if "application/json" not in content_type:
            return response

        if response.status_code >= 400:
            return response

        body = b""
        async for chunk in response.body_iterator:
            body += chunk

        if not body:
            payload = None
        else:
            try:
                payload = json.loads(body)
            except json.JSONDecodeError:
                payload = body.decode("utf-8")

        if isinstance(payload, dict) and "success" in payload and "data" in payload:
            normalized = payload
        else:
            normalized = {"success": True, "data": payload}

        new_response = JSONResponse(status_code=response.status_code, content=normalized)
        # Forward custom headers set by inner middlewares (security, request-id, etc.)
        _SKIP = {"content-length", "content-type"}
        for key, value in response.headers.items():
            if key.lower() not in _SKIP:
                new_response.headers[key] = value
        return new_response

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        detail = exc.detail if isinstance(exc.detail, str) else json.dumps(exc.detail)
        return JSONResponse(status_code=exc.status_code, content={"success": False, "data": None, "error": detail})

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"success": False, "data": None, "error": str(exc)})

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"success": False, "data": None, "error": "Internal server error"})

    app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
    app.include_router(finance.router, prefix="/api/finance", tags=["finance"])
    app.include_router(hr.router, prefix="/api/construction", tags=["construction"])
    app.include_router(pos.router, prefix="/api/pos", tags=["pos"])
    app.include_router(import_supply.router, prefix="/api/import-supply", tags=["import_supply"])
    app.include_router(project_management.router, prefix="/api/project-management", tags=["project_management"])
    app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
    app.include_router(approval_intelligence.router, prefix="/api/ai-intelligence", tags=["ai_intelligence"])
    app.include_router(ai_employment.router, prefix="/api", tags=["ai_employment"])
    app.include_router(users.router, prefix="/api/users", tags=["users"])

    @app.get("/api")
    async def root() -> dict[str, str]:
        return {"status": "ok", "service": "bd-cr7-api", "env": settings.env}

    @app.get("/favicon.ico", include_in_schema=False)
    async def favicon() -> Response:
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    @app.get("/api/health")
    async def health() -> dict[str, str]:
        return {"status": "ok", "env": settings.env}

    @app.get("/api/ready")
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

    @app.get("/api/health/db")
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
