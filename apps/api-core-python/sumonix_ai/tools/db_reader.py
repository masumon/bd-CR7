from __future__ import annotations

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

	sanitized_limit = max(1, min(limit, 1000))
	cols = ", ".join(columns)
	where_clause = f" WHERE {where_sql}" if where_sql else ""
	query = text(f"SELECT {cols} FROM {table}{where_clause} LIMIT :limit")
	bind = dict(params or {})
	bind["limit"] = sanitized_limit

	with engine._session() as session:
		rows = session.execute(query, bind).mappings().all()
		return [dict(r) for r in rows]
