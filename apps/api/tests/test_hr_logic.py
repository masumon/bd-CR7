"""
Unit tests for HR/construction logic:
- distance_km (Haversine formula)
- finance service transfer_funds_atomic validations (no DB)
"""
from __future__ import annotations

import sys
import unittest
from decimal import Decimal
from pathlib import Path

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from modules.workforce.router import distance_km
from core.auth import UserContext
from schemas.finance import FundTransfer
from services.finance import score_risk, transfer_funds_atomic


class DistanceKmTests(unittest.TestCase):
    """Haversine distance calculations — verified against known values."""

    def test_same_point_zero_distance(self) -> None:
        self.assertAlmostEqual(distance_km(23.8103, 90.4125, 23.8103, 90.4125), 0.0, places=3)

    def test_dhaka_to_chittagong_approx(self) -> None:
        # Dhaka (23.8103, 90.4125) → Chittagong (22.3569, 91.7832) ≈ 199 km
        dist = distance_km(23.8103, 90.4125, 22.3569, 91.7832)
        self.assertGreater(dist, 180)
        self.assertLess(dist, 220)

    def test_small_distance_within_site(self) -> None:
        # 50 metres apart
        dist = distance_km(23.8103, 90.4125, 23.8107, 90.4130)
        self.assertLess(dist, 0.1)

    def test_returns_positive_always(self) -> None:
        # Swapped lat/lon order still positive
        dist = distance_km(22.0, 90.0, 23.0, 91.0)
        self.assertGreater(dist, 0)

    def test_known_equatorial_degree(self) -> None:
        # 1 degree latitude ≈ 111 km at equator
        dist = distance_km(0.0, 0.0, 1.0, 0.0)
        self.assertAlmostEqual(dist, 111.195, delta=1.0)


class TransferFundsValidationTests(unittest.TestCase):
    """transfer_funds_atomic validations that don't hit DB."""

    def _make_user(self, role: str = "maker") -> UserContext:
        return UserContext({"user_id": "u1", "role": role})

    def _make_payload(self, from_id="a", to_id="b", amount="100", ref="VALID-REF") -> FundTransfer:
        return FundTransfer(
            from_account_id=from_id,
            to_account_id=to_id,
            amount=Decimal(amount),
            reference=ref,
        )

    def test_same_account_raises_value_error(self) -> None:
        payload = self._make_payload(from_id="same", to_id="same")
        with self.assertRaises(ValueError) as ctx:
            transfer_funds_atomic(payload, self._make_user())
        self.assertIn("differ", str(ctx.exception))

    def test_zero_amount_rejected_by_schema(self) -> None:
        with self.assertRaises(Exception):
            self._make_payload(amount="0")

    def test_exceeds_max_limit_raises(self) -> None:
        payload = FundTransfer(
            from_account_id="a",
            to_account_id="b",
            amount=Decimal("10000001"),
            reference="BIG-TRANSFER",
        )
        with self.assertRaises(ValueError) as ctx:
            transfer_funds_atomic(payload, self._make_user())
        self.assertIn("maximum", str(ctx.exception))

    def test_invalid_reference_chars_raises(self) -> None:
        # reference with special chars rejected at schema level
        with self.assertRaises(Exception):
            FundTransfer(
                from_account_id="a",
                to_account_id="b",
                amount=Decimal("100"),
                reference="DROP;TABLE--",
            )


if __name__ == "__main__":
    unittest.main()
