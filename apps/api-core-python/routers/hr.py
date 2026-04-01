from datetime import date
from decimal import Decimal
from math import radians, sin, cos, sqrt, atan2
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException

from core.auth import UserContext, get_current_user, require_roles
from core.db import fetch_all, fetch_one, tx
from schemas.construction import AttendanceMark, MaterialMovement, WorkerCreate

router = APIRouter()

SITE_LAT = 23.777176
SITE_LNG = 90.399452
MAX_RADIUS_KM = 2.0


def distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return r * c


@router.post("/workers")
async def create_worker(payload: WorkerCreate, user: UserContext = Depends(require_roles("admin", "maker"))):
    worker_id = str(uuid4())
    with tx() as conn:
        conn.exec_driver_sql(
            "INSERT INTO workers (id, full_name, trade, daily_rate, created_by) VALUES (%s, %s, %s, %s, %s)",
            (worker_id, payload.full_name, payload.trade, Decimal(payload.daily_rate), user.user_id),
        )
    return {"id": worker_id}


@router.get("/workers")
async def list_workers(user: UserContext = Depends(get_current_user)):
    rows = fetch_all("SELECT id, full_name, trade, daily_rate, is_active FROM workers ORDER BY full_name")
    return [dict(x) for x in rows]


@router.post("/attendance")
async def mark_attendance(payload: AttendanceMark, user: UserContext = Depends(require_roles("admin", "maker", "checker"))):
    worker = fetch_one("SELECT id FROM workers WHERE id = :worker_id", {"worker_id": payload.worker_id})
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    dist = distance_km(payload.latitude, payload.longitude, SITE_LAT, SITE_LNG)
    if dist > MAX_RADIUS_KM:
        raise HTTPException(status_code=400, detail="Attendance outside site geofence")

    attendance_id = str(uuid4())
    with tx() as conn:
        conn.exec_driver_sql(
            """
            INSERT INTO attendance (id, worker_id, attendance_date, latitude, longitude, marked_by)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (worker_id, attendance_date)
            DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, marked_by = EXCLUDED.marked_by, updated_at = NOW()
            """,
            (attendance_id, payload.worker_id, date.today(), payload.latitude, payload.longitude, user.user_id),
        )
    return {"message": "attendance marked", "distance_km": round(dist, 3)}


@router.post("/materials")
async def material_movement(payload: MaterialMovement, user: UserContext = Depends(require_roles("admin", "maker"))):
    movement_id = str(uuid4())
    signed_qty = Decimal(payload.quantity) if payload.movement_type == "in" else (Decimal(payload.quantity) * Decimal("-1"))

    with tx() as conn:
        conn.exec_driver_sql(
            """
            INSERT INTO material_movements (id, project_id, material_name, quantity, unit_cost, movement_type, created_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                movement_id,
                payload.project_id,
                payload.material_name,
                signed_qty,
                Decimal(payload.unit_cost),
                payload.movement_type,
                user.user_id,
            ),
        )

    return {"id": movement_id}
