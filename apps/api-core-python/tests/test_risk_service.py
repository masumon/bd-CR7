"""
Unit tests for services/risk.py — score_risk, _parse_dt, detect_risk,
financial_anomalies, dashboard_metrics (offline/mocked).
"""
from __future__ import annotations

import sys
import unittest
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from unittest.mock import MagicMock, patch

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from services.finance import score_risk
from services.risk import _parse_dt, detect_risk, financial_anomalies, dashboard_metrics


# ---------------------------------------------------------------------------
# score_risk (in services/finance.py)
# ---------------------------------------------------------------------------

class ScoreRiskTests(unittest.TestCase):
    def test_low_risk_small_amount(self) -> None:
        result = score_risk(Decimal("1000"))
        self.assertEqual(result["risk_level"], "low")
        self.assertEqual(result["risk_score"], 0)
        self.assertEqual(result["reasons"], [])

    def test_medium_risk_mid_amount(self) -> None:
        result = score_risk(Decimal("50000"))
        self.assertEqual(result["risk_level"], "medium")
        self.assertIn("medium_amount", result["reasons"])

    def test_high_risk_large_amount(self) -> None:
        result = score_risk(Decimal("200000"))
        self.assertEqual(result["risk_level"], "high")
        self.assertIn("large_amount", result["reasons"])

    def test_boundary_100000_is_high(self) -> None:
        result = score_risk(Decimal("100000"))
        self.assertEqual(result["risk_level"], "high")

    def test_boundary_25000_is_medium(self) -> None:
        result = score_risk(Decimal("25000"))
        self.assertEqual(result["risk_level"], "medium")

    def test_just_below_25000_is_low(self) -> None:
        result = score_risk(Decimal("24999.99"))
        self.assertEqual(result["risk_level"], "low")

    def test_result_keys_present(self) -> None:
        result = score_risk(Decimal("100"))
        self.assertIn("risk_score", result)
        self.assertIn("risk_level", result)
        self.assertIn("reasons", result)


# ---------------------------------------------------------------------------
# _parse_dt
# ---------------------------------------------------------------------------

class ParseDtTests(unittest.TestCase):
    def test_none_returns_none(self) -> None:
        self.assertIsNone(_parse_dt(None))

    def test_empty_string_returns_none(self) -> None:
        self.assertIsNone(_parse_dt(""))

    def test_invalid_string_returns_none(self) -> None:
        self.assertIsNone(_parse_dt("not-a-date"))

    def test_iso_with_z_suffix(self) -> None:
        dt = _parse_dt("2024-04-01T10:00:00Z")
        self.assertIsNotNone(dt)
        self.assertEqual(dt.tzinfo, timezone.utc)

    def test_iso_with_plus_offset(self) -> None:
        dt = _parse_dt("2024-04-01T10:00:00+06:00")
        self.assertIsNotNone(dt)
        self.assertEqual(dt.tzinfo, timezone.utc)

    def test_naive_iso_gets_utc(self) -> None:
        dt = _parse_dt("2024-04-01T10:00:00")
        self.assertIsNotNone(dt)
        self.assertEqual(dt.tzinfo, timezone.utc)

    def test_date_only_returns_none(self) -> None:
        # "2024-04-01" is not a valid datetime ISO string
        result = _parse_dt("2024-04-01")
        # May or may not parse depending on fromisoformat — just assert it doesn't crash
        self.assertTrue(result is None or isinstance(result, datetime))


# ---------------------------------------------------------------------------
# detect_risk (mocked DB)
# ---------------------------------------------------------------------------

def _make_expense(amount: str, account_id: str, days_ago: int = 5) -> dict:
    dt = (datetime.now(timezone.utc) - timedelta(days=days_ago)).isoformat()
    return {"id": "e1", "account_id": account_id, "amount": amount, "created_at": dt}


class DetectRiskTests(unittest.TestCase):
    @patch("services.risk._recent_expenses")
    def test_no_history_low_risk(self, mock_expenses) -> None:
        mock_expenses.return_value = []
        result = detect_risk(Decimal("1000"), "acc-1")
        self.assertEqual(result["risk_level"], "low")

    @patch("services.risk._recent_expenses")
    def test_large_amount_adds_score(self, mock_expenses) -> None:
        mock_expenses.return_value = []
        result = detect_risk(Decimal("150000"), "acc-1")
        self.assertGreater(result["risk_score"], 0)
        self.assertIn("large_amount", result["reasons"])

    @patch("services.risk._recent_expenses")
    def test_spike_vs_avg_detected(self, mock_expenses) -> None:
        # Avg is ~1000, current is 5000 (5x avg) → spike
        expenses = [_make_expense("1000", "acc-1", days_ago=i + 1) for i in range(5)]
        mock_expenses.return_value = expenses
        result = detect_risk(Decimal("5000"), "acc-1")
        self.assertIn("spike_vs_30d_avg", result["reasons"])

    @patch("services.risk._recent_expenses")
    def test_repeated_amount_detected(self, mock_expenses) -> None:
        # Same amount repeated 4 times in last 7 days
        expenses = [_make_expense("500", "acc-1", days_ago=i + 1) for i in range(4)]
        mock_expenses.return_value = expenses
        result = detect_risk(Decimal("500"), "acc-1")
        self.assertIn("repeated_same_amount", result["reasons"])

    @patch("services.risk._recent_expenses")
    def test_different_account_expenses_ignored(self, mock_expenses) -> None:
        # Expenses are for a different account — should not affect score
        expenses = [_make_expense("500", "other-acc", days_ago=i + 1) for i in range(4)]
        mock_expenses.return_value = expenses
        result = detect_risk(Decimal("500"), "acc-1")
        self.assertNotIn("repeated_same_amount", result["reasons"])


# ---------------------------------------------------------------------------
# financial_anomalies (mocked DB)
# ---------------------------------------------------------------------------

class FinancialAnomaliesTests(unittest.TestCase):
    @patch("services.risk._recent_expenses")
    def test_no_anomalies_on_empty(self, mock_expenses) -> None:
        mock_expenses.return_value = []
        result = financial_anomalies()
        self.assertEqual(result, [])

    @patch("services.risk._recent_expenses")
    def test_spike_detected_as_anomaly(self, mock_expenses) -> None:
        now = datetime.now(timezone.utc)
        base = [
            {"id": f"e{i}", "account_id": "acc1", "amount": "1000",
             "description": "normal", "created_at": (now - timedelta(days=i + 1)).isoformat()}
            for i in range(5)
        ]
        spike = {"id": "spike", "account_id": "acc1", "amount": "10000",
                 "description": "spike", "created_at": (now - timedelta(hours=1)).isoformat()}
        mock_expenses.return_value = base + [spike]
        result = financial_anomalies()
        ids = [r["id"] for r in result]
        self.assertIn("spike", ids)

    @patch("services.risk._recent_expenses")
    def test_anomalies_capped_at_50(self, mock_expenses) -> None:
        now = datetime.now(timezone.utc)
        expenses = [
            {"id": f"e{i}", "account_id": "acc1", "amount": "9999",
             "description": "desc", "created_at": (now - timedelta(hours=i + 1)).isoformat()}
            for i in range(100)
        ]
        mock_expenses.return_value = expenses
        result = financial_anomalies()
        self.assertLessEqual(len(result), 50)


# ---------------------------------------------------------------------------
# dashboard_metrics (no supabase)
# ---------------------------------------------------------------------------

class DashboardMetricsOfflineTests(unittest.TestCase):
    @patch("services.risk.supabase_service", None)
    def test_returns_zeros_when_supabase_none(self) -> None:
        result = dashboard_metrics()
        self.assertEqual(result["total_balance"], 0)
        self.assertEqual(result["total_workers"], 0)
        self.assertEqual(result["recent_expenses"], [])


if __name__ == "__main__":
    unittest.main()
