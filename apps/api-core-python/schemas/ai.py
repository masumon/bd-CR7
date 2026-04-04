from typing import Any

from pydantic import BaseModel, Field, field_validator

EMBEDDING_DIM = 1536


class MemoryCreate(BaseModel):
    content: str = Field(min_length=1, max_length=8000)
    embedding: list[float] = Field(min_length=EMBEDDING_DIM, max_length=EMBEDDING_DIM)
    metadata: dict[str, Any] = Field(default_factory=dict)

    @field_validator("embedding")
    @classmethod
    def validate_embedding_dim(cls, v: list[float]) -> list[float]:
        if len(v) != EMBEDDING_DIM:
            raise ValueError(f"embedding must have exactly {EMBEDDING_DIM} dimensions, got {len(v)}")
        return v


class MemorySearchParams(BaseModel):
    """Validated query parameters for vector similarity search."""
    vector: str = Field(min_length=1, description="Comma-separated floats or JSON array string")
    top_k: int = Field(default=5, ge=1, le=20)

    @field_validator("vector")
    @classmethod
    def validate_vector_format(cls, v: str) -> str:
        # Ensure the string can be parsed as a valid float array before hitting SQL
        raw = v.strip().lstrip("[").rstrip("]")
        try:
            parts = [float(x.strip()) for x in raw.split(",") if x.strip()]
        except ValueError as exc:
            raise ValueError("vector must be a comma-separated list of floats") from exc
        if len(parts) != EMBEDDING_DIM:
            raise ValueError(f"vector must have {EMBEDDING_DIM} dimensions, got {len(parts)}")
        return v


class ChatMessage(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
