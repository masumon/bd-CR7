"""
Security tests for sumonix_ai/tools/db_reader.py — SQL injection prevention.
Tests the _validate_column guard and ALLOWED_READ_TABLES allowlist.
No real DB connection needed.
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from sumonix_ai.tools.db_reader import (
    ALLOWED_READ_TABLES,
    _validate_column,
    safe_select,
)


class ValidateColumnTests(unittest.TestCase):
    """_validate_column must reject any non-identifier string."""

    # ----- valid identifiers -----
    def test_simple_word(self) -> None:
        self.assertEqual(_validate_column("amount"), "amount")

    def test_underscore_prefix(self) -> None:
        self.assertEqual(_validate_column("_private"), "_private")

    def test_mixed_case(self) -> None:
        self.assertEqual(_validate_column("AccountID"), "AccountID")

    def test_with_numbers(self) -> None:
        self.assertEqual(_validate_column("col1"), "col1")

    def test_underscore_in_middle(self) -> None:
        self.assertEqual(_validate_column("created_at"), "created_at")

    # ----- SQL injection attempts -----
    def test_star_rejected(self) -> None:
        with self.assertRaises(ValueError):
            _validate_column("*")

    def test_semicolon_rejected(self) -> None:
        with self.assertRaises(ValueError):
            _validate_column("id; DROP TABLE expenses;--")

    def test_space_in_name_rejected(self) -> None:
        with self.assertRaises(ValueError):
            _validate_column("col name")

    def test_quote_rejected(self) -> None:
        with self.assertRaises(ValueError):
            _validate_column("'injected'")

    def test_double_quote_rejected(self) -> None:
        with self.assertRaises(ValueError):
            _validate_column('"injected"')

    def test_dash_rejected(self) -> None:
        with self.assertRaises(ValueError):
            _validate_column("col-name")

    def test_subquery_injection_rejected(self) -> None:
        with self.assertRaises(ValueError):
            _validate_column("(SELECT password FROM users)")

    def test_comma_injection_rejected(self) -> None:
        with self.assertRaises(ValueError):
            _validate_column("id,password")

    def test_starts_with_digit_rejected(self) -> None:
        with self.assertRaises(ValueError):
            _validate_column("1col")

    def test_empty_string_rejected(self) -> None:
        with self.assertRaises(ValueError):
            _validate_column("")

    def test_union_injection_rejected(self) -> None:
        with self.assertRaises(ValueError):
            _validate_column("id UNION SELECT * FROM users--")


class AllowedTablesTests(unittest.TestCase):
    """ALLOWED_READ_TABLES must contain only the expected set."""

    EXPECTED = {
        "expenses",
        "sales",
        "fund_accounts",
        "fund_transactions",
        "users",
        "ai_memory",
        "lc_records",
        "landed_costs",
    }

    def test_expected_tables_present(self) -> None:
        for table in self.EXPECTED:
            self.assertIn(table, ALLOWED_READ_TABLES, f"Expected {table!r} in ALLOWED_READ_TABLES")

    def test_sensitive_tables_absent(self) -> None:
        sensitive = ["roles", "biometric_credentials", "webauthn_challenges", "audit_logs"]
        for table in sensitive:
            self.assertNotIn(table, ALLOWED_READ_TABLES, f"Sensitive table {table!r} must not be in ALLOWED_READ_TABLES")


class SafeSelectGuardTests(unittest.TestCase):
    """safe_select must reject disallowed tables and empty column lists."""

    def _make_engine(self):
        """Return a mock AgentEngine with a _session context manager."""
        engine = MagicMock()
        mock_session = MagicMock()
        mock_session.__enter__ = MagicMock(return_value=mock_session)
        mock_session.__exit__ = MagicMock(return_value=False)
        mock_session.execute.return_value.mappings.return_value.all.return_value = []
        engine._session.return_value = mock_session
        return engine

    def test_disallowed_table_raises(self) -> None:
        engine = self._make_engine()
        with self.assertRaises(ValueError) as ctx:
            safe_select(engine, "roles", ["id"])
        self.assertIn("not allowed", str(ctx.exception))

    def test_secrets_table_raises(self) -> None:
        engine = self._make_engine()
        with self.assertRaises(ValueError):
            safe_select(engine, "biometric_credentials", ["public_key"])

    def test_empty_columns_raises(self) -> None:
        engine = self._make_engine()
        with self.assertRaises(ValueError) as ctx:
            safe_select(engine, "expenses", [])
        self.assertIn("column", str(ctx.exception))

    def test_valid_query_executes(self) -> None:
        engine = self._make_engine()
        result = safe_select(engine, "expenses", ["id", "amount"], limit=10)
        self.assertEqual(result, [])

    def test_injection_column_raises_before_db(self) -> None:
        engine = self._make_engine()
        with self.assertRaises(ValueError):
            safe_select(engine, "expenses", ["id", "* FROM users--"])
        # Confirm the mock session was never called (validation happened first)
        engine._session.assert_not_called()

    def test_limit_clamped_above_1000(self) -> None:
        engine = self._make_engine()
        safe_select(engine, "expenses", ["id"], limit=9999)
        # Should not raise — limit is clamped internally to 1000
        engine._session.assert_called_once()

    def test_limit_clamped_below_1(self) -> None:
        engine = self._make_engine()
        safe_select(engine, "expenses", ["id"], limit=0)
        engine._session.assert_called_once()


if __name__ == "__main__":
    unittest.main()
