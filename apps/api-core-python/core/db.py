from contextlib import contextmanager
from typing import Any, Generator

from sqlalchemy import create_engine, text
from sqlalchemy.engine import RowMapping

from core.config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_recycle=180,
    pool_timeout=10,
    connect_args={"connect_timeout": 8},
    future=True,
)


@contextmanager
def tx() -> Generator:
    with engine.begin() as conn:
        yield conn


def fetch_one(sql: str, params: dict[str, Any] | None = None) -> RowMapping | None:
    with engine.connect() as conn:
        row = conn.execute(text(sql), params or {}).mappings().first()
        return row


def fetch_all(sql: str, params: dict[str, Any] | None = None) -> list[RowMapping]:
    with engine.connect() as conn:
        rows = conn.execute(text(sql), params or {}).mappings().all()
        return list(rows)


def execute(sql: str, params: dict[str, Any] | None = None) -> None:
    with engine.begin() as conn:
        conn.execute(text(sql), params or {})
