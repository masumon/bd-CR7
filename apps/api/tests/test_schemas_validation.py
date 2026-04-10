"""
Pydantic schema validation tests — every schema in schemas/*.py.
Validates both happy-path and edge/error cases with no external deps.
"""
from __future__ import annotations

import sys
import unittest
from decimal import Decimal
from pathlib import Path

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from pydantic import ValidationError

from schemas.auth import AuthResponse, LoginRequest, RegisterRequest
from schemas.construction import AttendanceMark, MaterialMovement, WorkerCreate
from schemas.finance import (
    ApprovalAction,
    ExpenseCreate,
    ExpenseUpdate,
    FundEntryCreate,
    FundTransfer,
    ManualExpenseCreate,
)
# ---------------------------------------------------------------------------
# Finance schemas
# ---------------------------------------------------------------------------

class FundTransferSchemaTests(unittest.TestCase):
    def test_valid_transfer(self) -> None:
        t = FundTransfer(
            from_account_id="a1",
            to_account_id="a2",
            amount=Decimal("500"),
            reference="SALARY-2024-04",
        )
        self.assertEqual(t.amount, Decimal("500"))

    def test_zero_amount_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            FundTransfer(from_account_id="a", to_account_id="b", amount=Decimal("0"), reference="ref")

    def test_negative_amount_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            FundTransfer(from_account_id="a", to_account_id="b", amount=Decimal("-100"), reference="ref")

    def test_reference_with_special_chars_rejected(self) -> None:
        # @ and # are outside the allowed [a-zA-Z0-9\-_\s] pattern
        with self.assertRaises(ValidationError):
            FundTransfer(from_account_id="a", to_account_id="b", amount=Decimal("10"), reference="REF@#BAD!")

    def test_reference_too_short_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            FundTransfer(from_account_id="a", to_account_id="b", amount=Decimal("10"), reference="x")

    def test_valid_reference_alphanumeric_hyphen(self) -> None:
        t = FundTransfer(from_account_id="a", to_account_id="b", amount=Decimal("1"), reference="REF-001")
        self.assertEqual(t.reference, "REF-001")


class ExpenseCreateSchemaTests(unittest.TestCase):
    def test_valid_expense(self) -> None:
        e = ExpenseCreate(
            account_id="acc1",
            category_id="cat1",
            amount=Decimal("1500"),
            description="Office supplies purchase",
        )
        self.assertEqual(e.amount, Decimal("1500"))

    def test_zero_amount_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            ExpenseCreate(account_id="a", category_id="c", amount=Decimal("0"), description="desc")

    def test_description_too_short_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            ExpenseCreate(account_id="a", category_id="c", amount=Decimal("100"), description="x")

    def test_description_too_long_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            ExpenseCreate(account_id="a", category_id="c", amount=Decimal("100"), description="x" * 501)


class ApprovalActionSchemaTests(unittest.TestCase):
    def test_approved_decision(self) -> None:
        a = ApprovalAction(decision="approved", note="Looks correct to me")
        self.assertEqual(a.decision, "approved")

    def test_rejected_decision(self) -> None:
        a = ApprovalAction(decision="rejected", note="Amount mismatch in receipts")
        self.assertEqual(a.decision, "rejected")

    def test_invalid_decision_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            ApprovalAction(decision="pending", note="OK")

    def test_note_too_short_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            ApprovalAction(decision="approved", note="x")

    def test_note_too_long_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            ApprovalAction(decision="approved", note="x" * 501)


class ManualExpenseCreateSchemaTests(unittest.TestCase):
    def test_valid_manual_expense(self) -> None:
        e = ManualExpenseCreate(
            account_id="acc1",
            amount=Decimal("2500"),
            description="Fuel reimbursement",
            status="pending",
        )
        self.assertEqual(e.status, "pending")

    def test_invalid_status_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            ManualExpenseCreate(
                account_id="a", amount=Decimal("100"), description="desc ok", status="reviewed"
            )

    def test_approved_status_allowed(self) -> None:
        e = ManualExpenseCreate(
            account_id="a", amount=Decimal("100"), description="desc ok", status="approved"
        )
        self.assertEqual(e.status, "approved")


class FundEntryCreateSchemaTests(unittest.TestCase):
    def test_valid_entry(self) -> None:
        fe = FundEntryCreate(account_id="acc1", amount=Decimal("10000"), reference="DEP-042")
        self.assertEqual(fe.amount, Decimal("10000"))

    def test_negative_amount_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            FundEntryCreate(account_id="a", amount=Decimal("-1"), reference="REF")


class ExpenseUpdateSchemaTests(unittest.TestCase):
    def test_valid_update(self) -> None:
        eu = ExpenseUpdate(amount=Decimal("500"), status="pending", description="Updated description here")
        self.assertEqual(eu.status, "pending")

    def test_invalid_status_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            ExpenseUpdate(amount=Decimal("100"), status="draft", description="Some description")


# ---------------------------------------------------------------------------
# Auth schemas
# ---------------------------------------------------------------------------

class RegisterRequestSchemaTests(unittest.TestCase):
    def test_valid_registration(self) -> None:
        r = RegisterRequest(
            email="user@example.com",
            password="securepass1",
            full_name="Ahmed Karim",
        )
        self.assertEqual(r.email, "user@example.com")

    def test_invalid_email_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            RegisterRequest(email="not-an-email", password="securepass1", full_name="Ahmed")

    def test_short_password_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            RegisterRequest(email="u@e.com", password="short", full_name="Ahmed")

    def test_full_name_too_short_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            RegisterRequest(email="u@e.com", password="validpassword", full_name="A")

    def test_default_role_is_viewer(self) -> None:
        r = RegisterRequest(email="u@e.com", password="validpassword", full_name="Ali Ahmed")
        self.assertEqual(r.role_name, "viewer")


class LoginRequestSchemaTests(unittest.TestCase):
    def test_valid_login(self) -> None:
        l = LoginRequest(email="admin@cr7.com", password="password123")
        self.assertEqual(l.email, "admin@cr7.com")

    def test_invalid_email_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            LoginRequest(email="bad_email", password="password123")

    def test_short_password_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            LoginRequest(email="u@e.com", password="short")


class AuthResponseSchemaTests(unittest.TestCase):
    def test_valid_response(self) -> None:
        r = AuthResponse(access_token="eyJ...", user_id="uuid-123", role="admin")
        self.assertEqual(r.token_type, "bearer")

    def test_token_type_default(self) -> None:
        r = AuthResponse(access_token="tok", user_id="u1", role="viewer")
        self.assertEqual(r.token_type, "bearer")


# ---------------------------------------------------------------------------
# Construction schemas
# ---------------------------------------------------------------------------

class WorkerCreateSchemaTests(unittest.TestCase):
    def test_valid_worker(self) -> None:
        w = WorkerCreate(full_name="Rahim Uddin", trade="Mason", daily_rate=Decimal("800"))
        self.assertEqual(w.trade, "Mason")

    def test_full_name_too_short_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            WorkerCreate(full_name="A", trade="Mason", daily_rate=Decimal("800"))

    def test_negative_daily_rate_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            WorkerCreate(full_name="Rahim Uddin", trade="Mason", daily_rate=Decimal("-100"))

    def test_zero_daily_rate_allowed(self) -> None:
        w = WorkerCreate(full_name="Rahim Uddin", trade="Mason", daily_rate=Decimal("0"))
        self.assertEqual(w.daily_rate, Decimal("0"))


class AttendanceMarkSchemaTests(unittest.TestCase):
    def test_valid_attendance(self) -> None:
        a = AttendanceMark(worker_id="w1", latitude=23.8103, longitude=90.4125)
        self.assertAlmostEqual(a.latitude, 23.8103)

    def test_latitude_out_of_range_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            AttendanceMark(worker_id="w1", latitude=91.0, longitude=90.0)

    def test_latitude_negative_boundary_valid(self) -> None:
        a = AttendanceMark(worker_id="w1", latitude=-90.0, longitude=0.0)
        self.assertEqual(a.latitude, -90.0)

    def test_longitude_out_of_range_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            AttendanceMark(worker_id="w1", latitude=23.0, longitude=181.0)

    def test_longitude_negative_valid(self) -> None:
        a = AttendanceMark(worker_id="w1", latitude=0.0, longitude=-180.0)
        self.assertEqual(a.longitude, -180.0)


class MaterialMovementSchemaTests(unittest.TestCase):
    def test_valid_in_movement(self) -> None:
        m = MaterialMovement(
            project_id="p1",
            material_name="Cement bags",
            quantity=Decimal("50"),
            unit_cost=Decimal("450"),
            movement_type="in",
        )
        self.assertEqual(m.movement_type, "in")

    def test_valid_out_movement(self) -> None:
        m = MaterialMovement(
            project_id="p1",
            material_name="Cement bags",
            quantity=Decimal("10"),
            unit_cost=Decimal("450"),
            movement_type="out",
        )
        self.assertEqual(m.movement_type, "out")

    def test_invalid_movement_type_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            MaterialMovement(
                project_id="p1",
                material_name="Cement",
                quantity=Decimal("10"),
                unit_cost=Decimal("450"),
                movement_type="transfer",
            )

    def test_zero_quantity_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            MaterialMovement(
                project_id="p1",
                material_name="Cement",
                quantity=Decimal("0"),
                unit_cost=Decimal("450"),
                movement_type="in",
            )

    def test_negative_unit_cost_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            MaterialMovement(
                project_id="p1",
                material_name="Cement",
                quantity=Decimal("10"),
                unit_cost=Decimal("-1"),
                movement_type="in",
            )

    def test_material_name_too_short_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            MaterialMovement(
                project_id="p1",
                material_name="X",
                quantity=Decimal("10"),
                unit_cost=Decimal("100"),
                movement_type="in",
            )


if __name__ == "__main__":
    unittest.main()
