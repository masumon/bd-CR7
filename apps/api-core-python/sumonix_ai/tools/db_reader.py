from __future__ import annotations

import re
from typing import Any

from sqlalchemy import text

from ..agent_engine import AgentEngine

ALLOWED_READ_TABLES = {
	"expenses",
	"sales",
	"fund_accounts",
	"fund_transactions",
	"users",
	"ai_memory",
	"lc_records",
	"landed_costs",
}

# Only allow safe SQL identifiers: letters, digits, underscores. No quotes, spaces, or special chars.
_SAFE_IDENTIFIER_RE = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_]*$")


def _validate_column(name: str) -> str:
	"""Raise ValueError if name is not a safe SQL identifier."""
	if not _SAFE_IDENTIFIER_RE.match(name):
		raise ValueError(f"Unsafe column name rejected by AI db_reader: {name!r}")
	return name


def safe_select(
	engine: AgentEngine,
	table: str,
	columns: list[str],
	where_sql: str = "",
	params: dict[str, Any] | None = None,
	limit: int = 100,
) -> list[dict[str, Any]]:
	if table not in ALLOWED_READ_TABLES:
		raise ValueError("table is not allowed for AI db_reader")

	if not columns:
		raise ValueError("at least one column is required")

	# Validate every column name to prevent SQL injection via column list.
	validated_cols = [_validate_column(c) for c in columns]
	cols = ", ".join(validated_cols)

	sanitized_limit = max(1, min(limit, 1000))
	where_clause = f" WHERE {where_sql}" if where_sql else ""
	query = text(f"SELECT {cols} FROM {table}{where_clause} LIMIT :limit")
	bind = dict(params or {})
	bind["limit"] = sanitized_limit

	with engine._session() as session:
		rows = session.execute(query, bind).mappings().all()
		return [dict(r) for r in rows]
