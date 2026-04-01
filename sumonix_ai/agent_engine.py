# sumonix_ai/agent_engine.py

import os
from contextlib import contextmanager
from typing import Generator, List

from pgvector.sqlalchemy import Vector
from sqlalchemy import JSON, Column, Integer, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()

class AIEmbedding(Base):
    __tablename__ = 'ai_embeddings'

    id = Column(Integer, primary_key=True)
    embedding = Column(Vector(1536))
    metadata = Column(JSON)

class AgentEngine:
    def __init__(self, db_url: str):
        if not db_url:
            raise ValueError("DATABASE_URL is required for AgentEngine")
        self.engine = create_engine(db_url, pool_pre_ping=True, future=True)
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine, autoflush=False, autocommit=False)

    @contextmanager
    def _session(self) -> Generator:
        session = self.Session()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def add_embedding(self, embedding: List[float], metadata: dict):
        if len(embedding) != 1536:
            raise ValueError("embedding size must be 1536")
        with self._session() as session:
            new_embedding = AIEmbedding(embedding=embedding, metadata=metadata)
            session.add(new_embedding)

    def query_similar(self, vector: List[float], top_k: int = 5):
        if len(vector) != 1536:
            raise ValueError("query vector size must be 1536")
        with self._session() as session:
            results = (
                session.query(AIEmbedding)
                .order_by(AIEmbedding.embedding.l2_distance(vector))
                .limit(max(1, min(top_k, 50)))
                .all()
            )
            return [{"id": row.id, "metadata": row.metadata} for row in results]

# Example usage
if __name__ == "__main__":
    db_url = os.getenv("DATABASE_URL", "")
    if not db_url:
        raise RuntimeError("Set DATABASE_URL before running agent_engine directly")
    engine = AgentEngine(db_url)
    engine.add_embedding([0.1] * 1536, {"source": "example"})
    similar = engine.query_similar([0.1] * 1536)
    print(similar)