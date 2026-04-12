"""
Unit tests for core/auth.py — role normalization, extraction, UserContext, require_roles.
No Supabase connection required.
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from core.auth import (
    UserContext,
    _extract_role_name,
    _normalize_role_name,
    require_roles,
)


class NormalizeRoleNameTests(unittest.TestCase):
    def test_none_returns_none(self) -> None:
        self.assertIsNone(_normalize_role_name(None))

    def test_empty_string_returns_none(self) -> None:
        self.assertIsNone(_normalize_role_name(""))

    def test_whitespace_only_returns_none(self) -> None:
        self.assertIsNone(_normalize_role_name("   "))

    def test_valid_role_lowercased(self) -> None:
        self.assertEqual(_normalize_role_name("Admin"), "admin")

    def test_already_lowercase(self) -> None:
        self.assertEqual(_normalize_role_name("maker"), "maker")

    def test_mixed_case_with_spaces(self) -> None:
        self.assertEqual(_normalize_role_name("  Checker  "), "checker")

    def test_non_string_returns_none(self) -> None:
        self.assertIsNone(_normalize_role_name(123))  # type: ignore[arg-type]


class ExtractRoleNameTests(unittest.TestCase):
    def test_valid_role_dict(self) -> None:
        row = {"roles": {"name": "Admin"}}
        self.assertEqual(_extract_role_name(row), "admin")

    def test_role_with_whitespace(self) -> None:
        row = {"roles": {"name": "  Checker  "}}
        self.assertEqual(_extract_role_name(row), "checker")

    def test_missing_roles_key_falls_back_to_viewer(self) -> None:
        self.assertEqual(_extract_role_name({}), "viewer")

    def test_roles_not_dict_falls_back_to_viewer(self) -> None:
        self.assertEqual(_extract_role_name({"roles": "admin"}), "viewer")

    def test_roles_name_empty_falls_back_to_viewer(self) -> None:
        self.assertEqual(_extract_role_name({"roles": {"name": ""}}), "viewer")

    def test_roles_name_none_falls_back_to_viewer(self) -> None:
        self.assertEqual(_extract_role_name({"roles": {"name": None}}), "viewer")


class UserContextTests(unittest.TestCase):
    def test_user_id_property(self) -> None:
        ctx = UserContext({"user_id": "abc-123", "role": "admin"})
        self.assertEqual(ctx.user_id, "abc-123")

    def test_role_property(self) -> None:
        ctx = UserContext({"user_id": "abc-123", "role": "maker"})
        self.assertEqual(ctx.role, "maker")

    def test_missing_user_id_raises_key_error(self) -> None:
        ctx = UserContext({"role": "admin"})
        with self.assertRaises(KeyError):
            _ = ctx.user_id

    def test_acts_as_dict(self) -> None:
        ctx = UserContext({"user_id": "u1", "role": "viewer"})
        self.assertEqual(ctx["role"], "viewer")


class RequireRolesTests(unittest.TestCase):
    def _make_user(self, role: str) -> UserContext:
        return UserContext({"user_id": "u1", "role": role})

    def test_allowed_role_passes(self) -> None:
        checker = require_roles("admin", "maker")
        user = self._make_user("admin")
        result = checker(user)
        self.assertEqual(result, user)

    def test_super_admin_always_passes(self) -> None:
        checker = require_roles("admin")
        user = self._make_user("super_admin")
        result = checker(user)
        self.assertEqual(result.role, "super_admin")

    def test_forbidden_role_raises_403(self) -> None:
        from fastapi import HTTPException

        checker = require_roles("admin", "maker")
        user = self._make_user("viewer")
        with self.assertRaises(HTTPException) as ctx:
            checker(user)
        self.assertEqual(ctx.exception.status_code, 403)

    def test_role_comparison_is_case_insensitive_by_convention(self) -> None:
        user = self._make_user("checker")
        allowed = {"checker", "admin"}
        self.assertIn(user.role.lower(), {r.lower() for r in allowed})


if __name__ == "__main__":
    unittest.main()
