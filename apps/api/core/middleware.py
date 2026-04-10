"""Rate limiting middleware."""

import logging
import time
from collections import defaultdict

from fastapi import Request
from redis.asyncio import Redis
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting by IP with Redis backend and memory fallback for development."""

    def __init__(
        self,
        app,
        requests_per_minute: int = 60,
        redis_url: str | None = None,
        fail_closed_without_redis: bool = False,
    ):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.fail_closed_without_redis = fail_closed_without_redis
        self.ip_requests: dict[str, list[float]] = defaultdict(list)
        self.redis: Redis | None = Redis.from_url(redis_url, encoding="utf-8", decode_responses=True) if redis_url else None

    def _service_unavailable_response(self) -> JSONResponse:
        return JSONResponse(
            {"detail": "Rate limiting backend unavailable"},
            status_code=503,
        )

    async def dispatch(self, request: Request, call_next):
        if request.url.path in {"/api/health", "/api/ready", "/api/health/db", "/docs", "/redoc", "/openapi.json"}:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        limited, backend_unavailable = await self._is_limited(client_ip)
        if backend_unavailable:
            return self._service_unavailable_response()
        if limited:
            return JSONResponse(
                {"detail": f"Rate limit exceeded: {self.requests_per_minute} requests per minute"},
                status_code=429,
            )

        return await call_next(request)

    async def _is_limited(self, client_ip: str) -> tuple[bool, bool]:
        if self.redis is not None:
            try:
                key = f"bdcr7:rate-limit:{client_ip}:{int(time.time() // 60)}"
                count = await self.redis.incr(key)
                if count == 1:
                    await self.redis.expire(key, 60)
                return count > self.requests_per_minute, False
            except Exception as exc:  # noqa: BLE001
                logger.warning("redis_rate_limit_unavailable ip=%s error=%s", client_ip, exc)
                if self.fail_closed_without_redis:
                    return False, True

        if self.fail_closed_without_redis:
            return False, True

        now = time.time()
        cutoff = now - 60
        self.ip_requests[client_ip] = [req_time for req_time in self.ip_requests[client_ip] if req_time > cutoff]
        if len(self.ip_requests[client_ip]) >= self.requests_per_minute:
            return True, False
        self.ip_requests[client_ip].append(now)
        return False, False
