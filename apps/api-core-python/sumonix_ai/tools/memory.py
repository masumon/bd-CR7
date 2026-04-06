from __future__ import annotations

from typing import Any

from ..agent_engine import AgentEngine


def store_memory(engine: AgentEngine, content: str, embedding: list[float], metadata: dict[str, Any]) -> None:
    engine.add_embedding(embedding=embedding, metadata={"content": content, **metadata})


def search_memory(engine: AgentEngine, embedding: list[float], top_k: int = 5) -> list[dict[str, Any]]:
    return engine.query_similar(embedding, top_k=top_k)
