import unittest
from decimal import Decimal
from pathlib import Path
import sys

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from core.auth import UserContext
from schemas.finance import FundTransfer
from services.finance import score_risk, transfer_funds_atomic


class FinanceServiceTests(unittest.TestCase):
    def test_score_risk_high_for_large_amount(self) -> None:
        result = score_risk(Decimal("125000"))
        self.assertEqual(result["risk_level"], "high")

    def test_transfer_rejects_same_account(self) -> None:
        payload = FundTransfer(
            from_account_id="same",
            to_account_id="same",
            amount=Decimal("10"),
            reference="valid-ref",
        )
        with self.assertRaises(ValueError):
            transfer_funds_atomic(payload, UserContext({"user_id": "u1", "role": "maker"}))


if __name__ == "__main__":
    unittest.main()