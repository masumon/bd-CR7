from typing import Any

from sqlalchemy import text

from sumonix_ai.agent_engine import AgentEngine


def store_memory(engine: AgentEngine, content: str, embedding: list[float], metadata: dict[str, Any]) -> None:
    engine.add_embedding(embedding=embedding, metadata={"content": content, **metadata})


def search_memory(engine: AgentEngine, embedding: list[float], top_k: int = 5) -> list[dict[str, Any]]:
    rows = engine.query_similar(embedding, top_k=top_k)
    return rows
