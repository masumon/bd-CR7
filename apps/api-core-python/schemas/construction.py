from decimal import Decimal
from datetime import date

from pydantic import BaseModel, Field


class WorkerCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    trade: str = Field(min_length=2, max_length=80)
    daily_rate: Decimal = Field(ge=0)


class AttendanceMark(BaseModel):
    worker_id: str
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class MaterialMovement(BaseModel):
    project_id: str
    material_name: str = Field(min_length=2, max_length=120)
    quantity: Decimal = Field(gt=0)
    unit_cost: Decimal = Field(ge=0)
    movement_type: str = Field(pattern="^(in|out|adjust)$")


class ProjectTimelineEventCreate(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    description: str | None = Field(default=None, max_length=1000)
    event_date: date
    status: str = Field(pattern="^(planned|in_progress|completed|blocked)$")


class ProjectAttachmentCreate(BaseModel):
    file_url: str = Field(min_length=10, max_length=2000)
    file_type: str | None = Field(default=None, max_length=120)
    file_name: str | None = Field(default=None, max_length=260)
    caption: str | None = Field(default=None, max_length=500)
