"""Rate limiting middleware (in-memory, single-process)."""

import logging
import time
from collections import defaultdict

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting by IP using in-memory sliding window. No external dependency needed."""

    def __init__(self, app, requests_per_minute: int = 60, **_kwargs):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.ip_requests: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        if request.url.path in {"/api/health", "/api/ready", "/api/health/db", "/docs", "/redoc", "/openapi.json"}:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
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
