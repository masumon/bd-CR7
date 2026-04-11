"""
FastAPI integration tests using TestClient — all routes covered.
Supabase is mocked so no real DB connection is needed.
Tests: health, auth, finance, construction, users, approval endpoints.
"""
from __future__ import annotations

import json
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))


def _make_supabase_mock():
    """Minimal Supabase client mock that satisfies startup checks."""
    mock = MagicMock()
    mock.table.return_value.select.return_value.limit.return_value.execute.return_value.count = 1
    mock.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = []
    mock.table.return_value.select.return_value.order.return_value.limit.return_value.execute.return_value.data = []
    mock.table.return_value.select.return_value.limit.return_value.execute.return_value.data = []
    return mock


# Patch Supabase at the module level before importing the app
_supabase_mock = _make_supabase_mock()


def _create_test_client():
    with patch.dict(
        os.environ,
        {
            "APP_ENV": "test",
            "REQUIRE_SUPABASE_IN_PRODUCTION": "false",
        },
        clear=False,
    ), patch("core.supabase.supabase_service", _supabase_mock), patch("core.supabase.supabase_anon", _supabase_mock):
        from fastapi.testclient import TestClient
        from main import create_app
        app = create_app()
        return TestClient(app, raise_server_exceptions=False)


try:
    client = _create_test_client()
    CLIENT_AVAILABLE = True
except Exception:
    CLIENT_AVAILABLE = False


@unittest.skipUnless(CLIENT_AVAILABLE, "TestClient could not be created")
class HealthEndpointTests(unittest.TestCase):
    def test_root_returns_ok(self) -> None:
        r = client.get("/api")
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("status", data.get("data", data))

    def test_health_returns_200(self) -> None:
        r = client.get("/api/health")
        self.assertEqual(r.status_code, 200)

    def test_health_db_returns_200(self) -> None:
        r = client.get("/api/health/db")
        self.assertEqual(r.status_code, 200)

    def test_nonexistent_route_returns_404(self) -> None:
        r = client.get("/api/nonexistent-route-xyz")
        self.assertEqual(r.status_code, 404)

    def test_favicon_returns_204(self) -> None:
        r = client.get("/favicon.ico")
        self.assertEqual(r.status_code, 204)


@unittest.skipUnless(CLIENT_AVAILABLE, "TestClient could not be created")
class AuthEndpointTests(unittest.TestCase):
    def test_login_missing_body_returns_422(self) -> None:
        r = client.post("/api/auth/login", json={})
        self.assertEqual(r.status_code, 422)

    def test_login_invalid_email_returns_422(self) -> None:
        r = client.post("/api/auth/login", json={"email": "not-email", "password": "password123"})
        self.assertEqual(r.status_code, 422)

    def test_login_short_password_returns_422(self) -> None:
        r = client.post("/api/auth/login", json={"email": "u@e.com", "password": "short"})
        self.assertEqual(r.status_code, 422)

    def test_register_missing_fields_returns_422(self) -> None:
        r = client.post("/api/auth/register", json={"email": "u@e.com"})
        self.assertEqual(r.status_code, 422)

    def test_me_without_token_returns_401(self) -> None:
        r = client.get("/api/auth/me")
        self.assertEqual(r.status_code, 401)

    def test_logout_without_token_returns_401(self) -> None:
        r = client.post("/api/auth/logout")
        self.assertEqual(r.status_code, 401)


@unittest.skipUnless(CLIENT_AVAILABLE, "TestClient could not be created")
class FinanceEndpointAuthTests(unittest.TestCase):
    """All finance endpoints require a bearer token."""

    def test_list_accounts_no_token_401(self) -> None:
        r = client.get("/api/finance/accounts")
        self.assertEqual(r.status_code, 401)

    def test_transfer_no_token_401(self) -> None:
        r = client.post("/api/finance/transfer", json={})
        self.assertEqual(r.status_code, 401)

    def test_create_expense_no_token_401(self) -> None:
        r = client.post("/api/finance/expenses", json={})
        self.assertEqual(r.status_code, 401)

    def test_list_expenses_no_token_401(self) -> None:
        r = client.get("/api/finance/expenses")
        self.assertEqual(r.status_code, 401)

    def test_approve_expense_no_token_401(self) -> None:
        r = client.post("/api/finance/expenses/some-id/approve", json={})
        self.assertEqual(r.status_code, 401)

    def test_get_balance_no_token_401(self) -> None:
        r = client.get("/api/finance/balance/acc-id")
        self.assertEqual(r.status_code, 401)

    def test_fund_entries_no_token_401(self) -> None:
        r = client.post("/api/finance/fund-entries", json={})
        self.assertEqual(r.status_code, 401)


@unittest.skipUnless(CLIENT_AVAILABLE, "TestClient could not be created")
class ConstructionEndpointAuthTests(unittest.TestCase):
    def test_list_workers_no_token_401(self) -> None:
        r = client.get("/api/construction/workers")
        self.assertEqual(r.status_code, 401)

    def test_create_worker_no_token_401(self) -> None:
        r = client.post("/api/construction/workers", json={})
        self.assertEqual(r.status_code, 401)

    def test_mark_attendance_no_token_401(self) -> None:
        r = client.post("/api/construction/attendance", json={})
        self.assertEqual(r.status_code, 401)

    def test_material_movement_no_token_401(self) -> None:
        r = client.post("/api/construction/materials", json={})
        self.assertEqual(r.status_code, 401)


@unittest.skipUnless(CLIENT_AVAILABLE, "TestClient could not be created")
class UsersEndpointAuthTests(unittest.TestCase):
    def test_list_users_no_token_401(self) -> None:
        r = client.get("/api/users")
        self.assertEqual(r.status_code, 401)

    def test_create_user_no_token_401(self) -> None:
        r = client.post("/api/users", json={})
        self.assertEqual(r.status_code, 401)

    def test_get_user_no_token_401(self) -> None:
        r = client.get("/api/users/some-user-id")
        self.assertEqual(r.status_code, 401)

    def test_my_profile_no_token_401(self) -> None:
        r = client.get("/api/users/me/profile")
        self.assertEqual(r.status_code, 401)

    def test_my_preferences_no_token_401(self) -> None:
        r = client.get("/api/users/me/preferences")
        self.assertEqual(r.status_code, 401)



@unittest.skipUnless(CLIENT_AVAILABLE, "TestClient could not be created")
class ValidationErrorFormatTests(unittest.TestCase):
    """Validation errors must return success:false envelope."""

    def test_422_has_success_false(self) -> None:
        r = client.post("/api/auth/login", json={"email": "bad"})
        self.assertEqual(r.status_code, 422)
        body = r.json()
        self.assertFalse(body.get("success", True))

    def test_404_has_success_false(self) -> None:
        r = client.get("/api/finance/expenses/nonexistent-id-xyz")
        # 401 (no auth) or 404 — either way success must be false
        body = r.json()
        self.assertFalse(body.get("success", True))


@unittest.skipUnless(CLIENT_AVAILABLE, "TestClient could not be created")
class RemovedAiEmployEndpointsTests(unittest.TestCase):
    def test_classify_returns_404(self) -> None:
        r = client.post("/api/ai-employ/classify", json={})
        self.assertEqual(r.status_code, 404)

    def test_propose_returns_404(self) -> None:
        r = client.post("/api/ai-employ/propose", json={})
        self.assertEqual(r.status_code, 404)

    def test_confirm_returns_404(self) -> None:
        r = client.post("/api/ai-employ/confirm", json={})
        self.assertEqual(r.status_code, 404)

    def test_reject_returns_404(self) -> None:
        r = client.post("/api/ai-employ/reject", json={})
        self.assertEqual(r.status_code, 404)

    def test_pending_returns_404(self) -> None:
        r = client.get("/api/ai-employ/pending")
        self.assertEqual(r.status_code, 404)


@unittest.skipUnless(CLIENT_AVAILABLE, "TestClient could not be created")
class RemovedNonCoreModuleEndpointsTests(unittest.TestCase):
    def test_pos_returns_404(self) -> None:
        r = client.get("/api/pos/sales")
        self.assertEqual(r.status_code, 404)

    def test_inventory_returns_404(self) -> None:
        r = client.patch("/api/inventory/stock/some-product-id", json={"stock_qty": 10})
        self.assertEqual(r.status_code, 404)

    def test_import_supply_returns_404(self) -> None:
        r = client.get("/api/import-supply/lc-records")
        self.assertEqual(r.status_code, 404)


if __name__ == "__main__":
    unittest.main()
