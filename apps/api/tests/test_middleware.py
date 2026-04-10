import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from core.middleware import RateLimitMiddleware


def _make_request(path: str) -> MagicMock:
    req = MagicMock()
    req.url.path = path
    req.client.host = "127.0.0.1"
    return req


class MiddlewareBypassTests(unittest.IsolatedAsyncioTestCase):
    def _make_middleware(self) -> RateLimitMiddleware:
        return RateLimitMiddleware(app=MagicMock(), requests_per_minute=60)

    async def test_health_endpoint_bypasses_rate_limit(self) -> None:
        mw = self._make_middleware()
        call_next = AsyncMock(return_value=MagicMock(status_code=200))
        await mw.dispatch(_make_request("/api/health"), call_next)
        call_next.assert_awaited_once()

    async def test_ready_endpoint_bypasses_rate_limit(self) -> None:
        mw = self._make_middleware()
        call_next = AsyncMock(return_value=MagicMock(status_code=200))
        await mw.dispatch(_make_request("/api/ready"), call_next)
        call_next.assert_awaited_once()

    async def test_health_db_endpoint_bypasses_rate_limit(self) -> None:
        mw = self._make_middleware()
        call_next = AsyncMock(return_value=MagicMock(status_code=200))
        await mw.dispatch(_make_request("/api/health/db"), call_next)
        call_next.assert_awaited_once()

    async def test_docs_endpoint_bypasses_rate_limit(self) -> None:
        mw = self._make_middleware()
        call_next = AsyncMock(return_value=MagicMock(status_code=200))
        await mw.dispatch(_make_request("/docs"), call_next)
        call_next.assert_awaited_once()

    async def test_api_endpoint_is_not_bypassed(self) -> None:
        # A normal API path must go through the rate-limit check.
        mw = self._make_middleware()
        mw.requests_per_minute = 1_000_000  # set high so it is never exceeded
        call_next = AsyncMock(return_value=MagicMock(status_code=200))
        response = await mw.dispatch(_make_request("/api/finance/expenses"), call_next)
        call_next.assert_awaited_once()

    async def test_old_health_path_is_not_bypassed(self) -> None:
        # The legacy bare /health path must NOT be treated as an exempt endpoint.
        mw = self._make_middleware()
        # Force the limit to 0 so any non-bypassed request is immediately rejected.
        mw.requests_per_minute = 0
        call_next = AsyncMock(return_value=MagicMock(status_code=200))
        response = await mw.dispatch(_make_request("/health"), call_next)
        # call_next should NOT have been called because the request is rate-limited.
        call_next.assert_not_awaited()
        self.assertEqual(response.status_code, 429)


if __name__ == "__main__":
    unittest.main()
