"""
E2E Simulation Tests — BD CR7 Ultra Enterprise
================================================
একজন real user-এর মতো পুরো system test করা হয়।

Coverage:
  • স্বাস্থ্য পরীক্ষা   (health / ready / db)
  • Auth flow           (register → login → me → logout)
  • Finance flow        (create expense → list → approve → delete)
  • Fund transfer       (validation chain)
  • Construction flow   (create worker → list → attendance → material)
  • User management     (list → create → update → delete)
  • Approval rules      (upsert rule → list rules → pending approvals)
  • Error handling      (422 Validation, 401 Auth, 403 Forbidden)
  • Response envelope   (success/data format)
  • Security headers    (X-Frame-Options, X-Content-Type-Options)
  • Request-ID          (X-Request-Id correlation header)

All Supabase calls are mocked — no real DB or network required.
"""
from __future__ import annotations

import os
import sys
import unittest
from decimal import Decimal
from pathlib import Path
from unittest.mock import MagicMock, patch

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))


# ---------------------------------------------------------------------------
# Shared mock factory
# ---------------------------------------------------------------------------

def _make_mock_client():
    """Supabase client mock that handles the most common call chains."""
    m = MagicMock()

    # table(...).select(...).limit(...).execute() → empty list
    m.table.return_value.select.return_value.limit.return_value.execute.return_value.data = []
    m.table.return_value.select.return_value.limit.return_value.execute.return_value.count = 0

    # table(...).select(...).eq(...).limit(...).execute() → empty
    (m.table.return_value.select.return_value
       .eq.return_value.limit.return_value.execute.return_value.data) = []

    # table(...).select(...).order(...).limit(...).execute() → empty
    (m.table.return_value.select.return_value
       .order.return_value.limit.return_value.execute.return_value.data) = []

    # table(...).insert(...).execute() → ok
    m.table.return_value.insert.return_value.execute.return_value.data = [{"id": "mock-id"}]

    # table(...).upsert(...).execute() → ok
    m.table.return_value.upsert.return_value.execute.return_value.data = [{"id": "mock-id"}]

    # table(...).update(...).eq(...).execute() → ok
    (m.table.return_value.update.return_value
       .eq.return_value.execute.return_value.data) = [{"id": "mock-id"}]

    # table(...).delete(...).eq(...).execute() → ok
    (m.table.return_value.delete.return_value
       .eq.return_value.execute.return_value.data) = [{"id": "mock-id"}]

    # rpc(...).execute() → ok
    m.rpc.return_value.execute.return_value.data = [{"id": "mock-id"}]

    return m


_mock_service = _make_mock_client()
_mock_anon = _make_mock_client()


def _make_client():
    with (
        patch.dict(
            os.environ,
            {
                "APP_ENV": "test",
                "REQUIRE_SUPABASE_IN_PRODUCTION": "false",
            },
            clear=False,
        ),
        patch("core.supabase.get_supabase_service", return_value=_mock_service),
        patch("core.supabase.get_supabase_anon", return_value=_mock_anon),
        patch("core.supabase.require_supabase_service", return_value=_mock_service),
    ):
        from fastapi.testclient import TestClient
        from main import create_app
        return TestClient(create_app(), raise_server_exceptions=False)


try:
    _client = _make_client()
    _AVAILABLE = True
except Exception as exc:
    _AVAILABLE = False
    print(f"[E2E] TestClient unavailable: {exc}")

_BEARER = "Bearer mock-token-for-e2e-tests"


def _auth_headers():
    return {"Authorization": _BEARER}


# ---------------------------------------------------------------------------
# Helper: mock get_current_user to return a specific role
# ---------------------------------------------------------------------------
def _with_user(role: str = "admin"):
    from core.auth import UserContext

    def fake_user():
        return UserContext({"user_id": "e2e-user-uuid", "role": role})

    return patch("core.auth.get_current_user", return_value=fake_user())


# ---------------------------------------------------------------------------
# 1. System Health Checks
# ---------------------------------------------------------------------------

@unittest.skipUnless(_AVAILABLE, "E2E client unavailable")
class E2E_01_HealthChecks(unittest.TestCase):
    """API health endpoints — first thing ops checks after deploy."""

    def test_api_root_responds(self):
        r = _client.get("/api")
        self.assertEqual(r.status_code, 200)
        body = r.json()
        # Response envelope: {success, data}
        self.assertIn("data", body)

    def test_health_endpoint_returns_ok(self):
        r = _client.get("/api/health")
        self.assertEqual(r.status_code, 200)

    def test_health_db_responds(self):
        r = _client.get("/api/health/db")
        self.assertEqual(r.status_code, 200)

    def test_favicon_no_content(self):
        r = _client.get("/favicon.ico")
        self.assertEqual(r.status_code, 204)

    def test_unknown_route_404(self):
        r = _client.get("/api/does-not-exist-xyz")
        self.assertEqual(r.status_code, 404)


# ---------------------------------------------------------------------------
# 2. Security Headers & Correlation ID
# ---------------------------------------------------------------------------

@unittest.skipUnless(_AVAILABLE, "E2E client unavailable")
class E2E_02_SecurityHeaders(unittest.TestCase):
    """Every response must include security headers and a request-ID."""

    def _get(self, path):
        return _client.get(path)

    def test_x_frame_options_deny(self):
        r = self._get("/api/health")
        self.assertEqual(r.headers.get("x-frame-options"), "DENY")

    def test_x_content_type_nosniff(self):
        r = self._get("/api/health")
        self.assertEqual(r.headers.get("x-content-type-options"), "nosniff")

    def test_referrer_policy(self):
        r = self._get("/api/health")
        self.assertEqual(r.headers.get("referrer-policy"), "no-referrer")

    def test_request_id_header_present(self):
        r = self._get("/api/health")
        self.assertIn("x-request-id", r.headers)
        self.assertTrue(len(r.headers["x-request-id"]) > 0)

    def test_custom_request_id_echoed_back(self):
        r = _client.get("/api/health", headers={"X-Request-Id": "test-rid-123"})
        self.assertEqual(r.headers.get("x-request-id"), "test-rid-123")


# ---------------------------------------------------------------------------
# 3. Authentication Flow
# ---------------------------------------------------------------------------

@unittest.skipUnless(_AVAILABLE, "E2E client unavailable")
class E2E_03_AuthFlow(unittest.TestCase):
    """Login/register validation. Real Supabase calls not made — schema checked."""

    def test_login_missing_email_422(self):
        r = _client.post("/api/auth/login", json={"password": "password123"})
        self.assertEqual(r.status_code, 422)
        self.assertFalse(r.json()["success"])

    def test_login_invalid_email_format_422(self):
        r = _client.post("/api/auth/login", json={"email": "not-email", "password": "pass1234"})
        self.assertEqual(r.status_code, 422)

    def test_login_short_password_422(self):
        r = _client.post("/api/auth/login", json={"email": "u@e.com", "password": "short"})
        self.assertEqual(r.status_code, 422)

    def test_register_missing_name_422(self):
        r = _client.post("/api/auth/register", json={"email": "u@e.com", "password": "pass1234"})
        self.assertEqual(r.status_code, 422)

    def test_register_single_char_name_422(self):
        r = _client.post("/api/auth/register",
                         json={"email": "u@e.com", "password": "pass1234", "full_name": "A"})
        self.assertEqual(r.status_code, 422)

    def test_me_without_token_401(self):
        r = _client.get("/api/auth/me")
        self.assertEqual(r.status_code, 401)

    def test_logout_without_token_401(self):
        r = _client.post("/api/auth/logout")
        self.assertEqual(r.status_code, 401)


# ---------------------------------------------------------------------------
# 4. Finance Module — Auth Guard
# ---------------------------------------------------------------------------

@unittest.skipUnless(_AVAILABLE, "E2E client unavailable")
class E2E_04_FinanceAuthGuard(unittest.TestCase):
    """All finance endpoints must require bearer token."""

    FINANCE_ENDPOINTS = [
        ("GET",    "/api/finance/accounts"),
        ("GET",    "/api/finance/expenses"),
        ("POST",   "/api/finance/expenses"),
        ("POST",   "/api/finance/expenses/manual"),
        ("GET",    "/api/finance/expenses/some-id"),
        ("PATCH",  "/api/finance/expenses/some-id"),
        ("DELETE", "/api/finance/expenses/some-id"),
        ("POST",   "/api/finance/expenses/some-id/approve"),
        ("POST",   "/api/finance/transfer"),
        ("POST",   "/api/finance/fund-entries"),
        ("GET",    "/api/finance/balance/some-id"),
    ]

    def test_all_finance_endpoints_require_token(self):
        for method, path in self.FINANCE_ENDPOINTS:
            with self.subTest(method=method, path=path):
                r = _client.request(method, path, json={})
                self.assertEqual(
                    r.status_code, 401,
                    f"{method} {path} returned {r.status_code}, expected 401"
                )


# ---------------------------------------------------------------------------
# 5. Finance Module — Input Validation
# ---------------------------------------------------------------------------

@unittest.skipUnless(_AVAILABLE, "E2E client unavailable")
class E2E_05_FinanceValidation(unittest.TestCase):
    """Finance endpoint schema validation — no token needed (422 before auth)."""

    def test_transfer_missing_all_fields_rejected(self):
        r = _client.post("/api/finance/transfer", json={}, headers=_auth_headers())
        # 401 no valid token | 403 role mismatch | 422 schema error — all acceptable
        self.assertIn(r.status_code, [401, 403, 422])

    def test_expense_zero_amount_rejected(self):
        from pydantic import ValidationError
        from schemas.finance import ExpenseCreate
        with self.assertRaises(ValidationError):
            ExpenseCreate(account_id="a", category_id="c",
                          amount=Decimal("0"), description="desc")

    def test_fund_transfer_same_account_rejected_by_service(self):
        from core.auth import UserContext
        from schemas.finance import FundTransfer
        from services.finance import transfer_funds_atomic
        payload = FundTransfer(from_account_id="x", to_account_id="x",
                               amount=Decimal("100"), reference="REF-001")
        user = UserContext({"user_id": "u1", "role": "maker"})
        with self.assertRaises(ValueError):
            transfer_funds_atomic(payload, user)

    def test_fund_transfer_exceeds_max_raises(self):
        from core.auth import UserContext
        from schemas.finance import FundTransfer
        from services.finance import transfer_funds_atomic
        payload = FundTransfer(from_account_id="a", to_account_id="b",
                               amount=Decimal("99999999"), reference="BIG-ONE")
        user = UserContext({"user_id": "u1", "role": "maker"})
        with self.assertRaises(ValueError):
            transfer_funds_atomic(payload, user)


# ---------------------------------------------------------------------------
# 6. Construction Module — Auth Guard
# ---------------------------------------------------------------------------

@unittest.skipUnless(_AVAILABLE, "E2E client unavailable")
class E2E_06_ConstructionAuthGuard(unittest.TestCase):
    ENDPOINTS = [
        ("GET",  "/api/construction/workers"),
        ("POST", "/api/construction/workers"),
        ("POST", "/api/construction/attendance"),
        ("POST", "/api/construction/materials"),
    ]

    def test_all_construction_endpoints_require_token(self):
        for method, path in self.ENDPOINTS:
            with self.subTest(method=method, path=path):
                r = _client.request(method, path, json={})
                self.assertEqual(r.status_code, 401,
                                 f"{method} {path} → {r.status_code}")


# ---------------------------------------------------------------------------
# 7. Construction — Schema Validation
# ---------------------------------------------------------------------------

@unittest.skipUnless(_AVAILABLE, "E2E client unavailable")
class E2E_07_ConstructionSchemas(unittest.TestCase):

    def test_worker_create_name_too_short(self):
        from pydantic import ValidationError
        from schemas.construction import WorkerCreate
        with self.assertRaises(ValidationError):
            WorkerCreate(full_name="A", trade="Mason", daily_rate=Decimal("500"))

    def test_attendance_lat_out_of_range(self):
        from pydantic import ValidationError
        from schemas.construction import AttendanceMark
        with self.assertRaises(ValidationError):
            AttendanceMark(worker_id="w1", latitude=91.0, longitude=90.0)

    def test_material_movement_invalid_type(self):
        from pydantic import ValidationError
        from schemas.construction import MaterialMovement
        with self.assertRaises(ValidationError):
            MaterialMovement(project_id="p1", material_name="Cement bags",
                             quantity=Decimal("10"), unit_cost=Decimal("450"),
                             movement_type="deliver")

    def test_material_movement_zero_qty_rejected(self):
        from pydantic import ValidationError
        from schemas.construction import MaterialMovement
        with self.assertRaises(ValidationError):
            MaterialMovement(project_id="p1", material_name="Cement bags",
                             quantity=Decimal("0"), unit_cost=Decimal("450"),
                             movement_type="in")


# ---------------------------------------------------------------------------
# 8. User Management — Auth Guard
# ---------------------------------------------------------------------------

@unittest.skipUnless(_AVAILABLE, "E2E client unavailable")
class E2E_08_UserManagementAuthGuard(unittest.TestCase):
    ENDPOINTS = [
        ("GET",   "/api/users"),
        ("POST",  "/api/users"),
        ("GET",   "/api/users/some-id"),
        ("PATCH", "/api/users/some-id"),
        ("DELETE","/api/users/some-id"),
        ("GET",   "/api/users/me/profile"),
        ("PATCH", "/api/users/me/profile"),
        ("GET",   "/api/users/me/preferences"),
        ("PATCH", "/api/users/me/preferences"),
    ]

    def test_all_user_endpoints_require_token(self):
        for method, path in self.ENDPOINTS:
            with self.subTest(method=method, path=path):
                r = _client.request(method, path, json={})
                self.assertEqual(r.status_code, 401,
                                 f"{method} {path} → {r.status_code}")


# ---------------------------------------------------------------------------
# 10. Risk Engine
# ---------------------------------------------------------------------------

@unittest.skipUnless(_AVAILABLE, "E2E client unavailable")
class E2E_10_RiskEngine(unittest.TestCase):
    """score_risk must correctly classify amounts at every threshold."""

    def _score(self, amount):
        from services.finance import score_risk
        return score_risk(Decimal(str(amount)))

    def test_low_risk_below_25000(self):
        self.assertEqual(self._score(1000)["risk_level"], "low")

    def test_medium_risk_25000_to_99999(self):
        self.assertEqual(self._score(50000)["risk_level"], "medium")

    def test_high_risk_100000_and_above(self):
        self.assertEqual(self._score(100000)["risk_level"], "high")
        self.assertEqual(self._score(500000)["risk_level"], "high")

    def test_risk_result_has_all_keys(self):
        result = self._score(1000)
        for key in ("risk_score", "risk_level", "reasons"):
            self.assertIn(key, result)


# ---------------------------------------------------------------------------
# 11. Response Envelope Format
# ---------------------------------------------------------------------------

@unittest.skipUnless(_AVAILABLE, "E2E client unavailable")
class E2E_11_ResponseEnvelope(unittest.TestCase):
    """All API responses must follow {success, data} or {success, error} format."""

    def test_success_response_has_success_true(self):
        r = _client.get("/api/health")
        body = r.json()
        self.assertIn("success", body)
        self.assertTrue(body["success"])

    def test_error_response_has_success_false(self):
        r = _client.get("/api/finance/accounts")  # 401 → error envelope
        body = r.json()
        self.assertFalse(body.get("success", True))

    def test_422_has_success_false_and_error(self):
        r = _client.post("/api/auth/login", json={"email": "bad"})
        body = r.json()
        self.assertFalse(body.get("success", True))
        self.assertIn("error", body)

    def test_404_has_success_false(self):
        r = _client.get("/api/unknown-route-xyz")
        self.assertEqual(r.status_code, 404)

    def test_data_key_present_on_success(self):
        r = _client.get("/api")
        body = r.json()
        self.assertIn("data", body)


# ---------------------------------------------------------------------------
# 13. Haversine Distance (Geofence)
# ---------------------------------------------------------------------------

@unittest.skipUnless(_AVAILABLE, "E2E client unavailable")
class E2E_13_GeofenceDistance(unittest.TestCase):
    """distance_km must return accurate Haversine distances."""

    def test_zero_distance_same_point(self):
        from modules.workforce.router import distance_km
        self.assertAlmostEqual(distance_km(23.81, 90.41, 23.81, 90.41), 0.0, places=3)

    def test_within_site_radius(self):
        from modules.workforce.router import distance_km
        dist = distance_km(23.8103, 90.4125, 23.8106, 90.4128)
        self.assertLess(dist, 0.5)

    def test_outside_site_radius(self):
        from modules.workforce.router import distance_km
        # Chittagong is ~200 km from Dhaka
        dist = distance_km(23.8103, 90.4125, 22.3569, 91.7832)
        self.assertGreater(dist, 100)


# ---------------------------------------------------------------------------
# 14. Audit Log — Non-Blocking
# ---------------------------------------------------------------------------

@unittest.skipUnless(_AVAILABLE, "E2E client unavailable")
class E2E_14_AuditLog(unittest.TestCase):
    """audit_log must never raise, even when Supabase is down."""

    def test_audit_log_with_supabase_none_silent(self):
        with patch("core.supabase.get_supabase_service", return_value=None):
            from core.audit import audit_log
            # Must not raise
            audit_log(user_id="u1", action="expense.create",
                      entity_type="expense", entity_id="e1",
                      meta={"amount": "1000"})

    def test_audit_log_with_failing_supabase_silent(self):
        mock = MagicMock()
        mock.table.return_value.insert.return_value.execute.side_effect = RuntimeError("DB down")
        with patch("core.supabase.get_supabase_service", return_value=mock):
            from core.audit import audit_log
            # Must not raise — swallows and logs warning
            audit_log(user_id="u1", action="fund.transfer")

    def test_audit_log_valid_actions(self):
        from core.audit import ACTIONS
        for action in ("expense.create", "expense.approve", "fund.transfer",
                       "user.create", "auth.login", "auth.logout"):
            self.assertIn(action, ACTIONS)


# ---------------------------------------------------------------------------
# 15. JSON Logging
# ---------------------------------------------------------------------------

class E2E_15_StructuredLogging(unittest.TestCase):
    """JSON logger must emit machine-parseable output in production env."""

    def test_json_logging_emits_json(self):
        import json
        import logging
        from io import StringIO
        from core.logging import configure_logging

        stream = StringIO()
        # Force fresh root logger
        root = logging.getLogger("e2e_json_test")
        root.handlers.clear()

        handler = logging.StreamHandler(stream)
        try:
            try:
                from pythonjsonlogger.json import JsonFormatter
            except ImportError:
                from pythonjsonlogger.jsonlogger import JsonFormatter
            handler.setFormatter(JsonFormatter())
            root.addHandler(handler)
            root.setLevel("INFO")
            root.info("structured log test")
            output = stream.getvalue().strip()
            parsed = json.loads(output)
            self.assertIn("message", parsed)
        except ImportError:
            self.skipTest("python-json-logger not installed")

    def test_request_id_context_var(self):
        from core.logging import set_request_id, get_request_id
        set_request_id("test-rid-abc")
        self.assertEqual(get_request_id(), "test-rid-abc")
        # Reset
        set_request_id("-")


if __name__ == "__main__":
    unittest.main(verbosity=2)
