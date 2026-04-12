"""Rate limiting middleware with Redis/Upstash support and in-memory fallback."""

import logging
import time
from collections import defaultdict

import httpx
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

try:
    from redis.asyncio import Redis
except Exception:  # noqa: BLE001
    Redis = None  # type: ignore[assignment]

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting by IP with optional Redis/Upstash distributed backend."""

    def __init__(
        self,
        app,
        requests_per_minute: int = 60,
        use_redis: bool = False,
        redis_url: str | None = None,
        upstash_redis_rest_url: str | None = None,
        upstash_redis_rest_token: str | None = None,
        **_kwargs,
    ):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.ip_requests: dict[str, list[float]] = defaultdict(list)
        self.use_redis = use_redis
        self.redis: Redis | None = None
        self.upstash_url = (upstash_redis_rest_url or "").rstrip("/")
        self.upstash_token = (upstash_redis_rest_token or "").strip()
        self.http = httpx.AsyncClient(timeout=1.5)
        # Circuit-breaker window for Redis/Upstash failures.
        self._redis_disabled_until = 0.0

        if self.use_redis and redis_url and Redis is not None:
            try:
                self.redis = Redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
            except Exception as exc:  # noqa: BLE001
                logger.warning("redis_init_failed error=%s", exc)
                self.redis = None

    async def _is_limited_redis(self, key: str) -> bool:
        if self.redis is None:
            return False
        count = await self.redis.incr(key)
        if count == 1:
            await self.redis.expire(key, 60)
        return count > self.requests_per_minute

    async def _is_limited_upstash(self, key: str) -> bool:
        if not (self.upstash_url and self.upstash_token):
            return False
        response = await self.http.post(
            f"{self.upstash_url}/pipeline",
            headers={
                "Authorization": f"Bearer {self.upstash_token}",
                "Content-Type": "application/json",
            },
            json=[
                ["INCR", key],
                ["EXPIRE", key, 60],
            ],
        )
        response.raise_for_status()
        payload = response.json()
        first = payload[0] if isinstance(payload, list) and payload else {}
        result = first.get("result") if isinstance(first, dict) else None
        count = int(result or 0)
        return count > self.requests_per_minute

    async def dispatch(self, request: Request, call_next):
        if request.url.path in {"/api/health", "/api/ready", "/api/health/db", "/docs", "/redoc", "/openapi.json"}:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"

        if self.use_redis and time.time() >= self._redis_disabled_until:
            key = f"bdcr7:rate-limit:{client_ip}:{int(time.time() // 60)}"
            try:
                if self.redis is not None:
                    limited = await self._is_limited_redis(key)
                    if limited:
                        return JSONResponse(
                            {"detail": f"Rate limit exceeded: {self.requests_per_minute} requests per minute"},
                            status_code=429,
                        )
                    return await call_next(request)

                if self.upstash_url and self.upstash_token:
                    limited = await self._is_limited_upstash(key)
                    if limited:
                        return JSONResponse(
                            {"detail": f"Rate limit exceeded: {self.requests_per_minute} requests per minute"},
                            status_code=429,
                        )
                    return await call_next(request)
            except Exception as exc:  # noqa: BLE001
                logger.warning("redis_rate_limit_fallback ip=%s error=%s", client_ip, exc)
                # Avoid paying remote timeout cost on every request when backend is down.
                self._redis_disabled_until = time.time() + 60

        now = time.time()
        cutoff = now - 60
        self.ip_requests[client_ip] = [t for t in self.ip_requests[client_ip] if t > cutoff]
        if len(self.ip_requests[client_ip]) >= self.requests_per_minute:
            return JSONResponse(
                {"detail": f"Rate limit exceeded: {self.requests_per_minute} requests per minute"},
                status_code=429,
            )
        self.ip_requests[client_ip].append(now)
        return await call_next(request)
