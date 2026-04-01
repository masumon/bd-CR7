"""Rate limiting middleware."""

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple rate limiting by IP (10 reqs/min)."""
    
    def __init__(self, app, requests_per_minute: int = 10):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.ip_requests: dict[str, list[float]] = {}
    
    async def dispatch(self, request: Request, call_next):
        import time
        
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        cutoff = now - 60
        
        if client_ip not in self.ip_requests:
            self.ip_requests[client_ip] = []
        
        # Remove stale requests outside the 1-minute window.
        self.ip_requests[client_ip] = [req_time for req_time in self.ip_requests[client_ip] if req_time > cutoff]
        
        # Check if limit exceeded.
        if len(self.ip_requests[client_ip]) >= self.requests_per_minute:
            return JSONResponse(
                {"detail": "Rate limit exceeded: 10 requests per minute"},
                status_code=429,
            )
        
        # Record this request.
        self.ip_requests[client_ip].append(now)
        
        response = await call_next(request)
        return response
