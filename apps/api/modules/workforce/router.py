from datetime import date
from decimal import Decimal
from math import radians, sin, cos, sqrt, atan2
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException

from core.auth import UserContext, get_current_user, require_roles
from core.config import settings
from core.supabase import supabase_service
from schemas.construction import AttendanceMark, MaterialMovement, WorkerCreate

router = APIRouter()


def _require_supabase():
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    return supabase_service


def distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return r * c


@router.post("/workers")
async def create_worker(payload: WorkerCreate, user: UserContext = Depends(require_roles("admin", "maker"))):
    client = _require_supabase()
    worker_id = str(uuid4())
    client.table("workers").insert(
        {
            "id": worker_id,
            "full_name": payload.full_name,
            "trade": payload.trade,
            "daily_rate": str(Decimal(payload.daily_rate)),
            "created_by": user.user_id,
        }
    ).execute()
    return {"id": worker_id}


@router.get("/workers")
async def list_workers(user: UserContext = Depends(get_current_user)):
    client = _require_supabase()
    rows = client.table("workers").select("id,full_name,trade,daily_rate,is_active").order("full_name").execute()
    return rows.data or []


@router.post("/attendance")
async def mark_attendance(payload: AttendanceMark, user: UserContext = Depends(require_roles("admin", "maker", "checker"))):
    client = _require_supabase()
    worker = client.table("workers").select("id").eq("id", payload.worker_id).limit(1).execute()
    if not worker.data:
        raise HTTPException(status_code=404, detail="Worker not found")

    dist = distance_km(payload.latitude, payload.longitude, settings.site_latitude, settings.site_longitude)
    if dist > settings.site_max_radius_km:
        raise HTTPException(status_code=400, detail="Attendance outside site geofence")

    attendance_date = date.today().isoformat()
    # Use upsert to eliminate the SELECT + INSERT/UPDATE race condition.
    # Requires UNIQUE(worker_id, attendance_date) constraint on the attendance table.
    client.table("attendance").upsert(
        {
            "id": str(uuid4()),
            "worker_id": payload.worker_id,
            "attendance_date": attendance_date,
            "latitude": payload.latitude,
            "longitude": payload.longitude,
            "marked_by": user.user_id,
        },
        on_conflict="worker_id,attendance_date",
        ignore_duplicates=False,
    ).execute()
    return {"message": "attendance marked", "distance_km": round(dist, 3)}


@router.post("/materials")
async def material_movement(payload: MaterialMovement, user: UserContext = Depends(require_roles("admin", "maker"))):
    client = _require_supabase()
    rpc = client.rpc(
        "record_material_movement_atomic",
        {
            "p_project_id": payload.project_id,
            "p_material_name": payload.material_name,
            "p_quantity": str(Decimal(payload.quantity)),
            "p_unit": "Pcs",
            "p_unit_price": str(Decimal(payload.unit_cost)),
            "p_supplier": None,
            "p_notes": None,
            "p_movement_type": payload.movement_type,
            "p_proof_file_id": None,
            "p_actor_user_id": user.user_id,
        },
    ).execute()

    row = (rpc.data or [{}])[0]
    return {"id": row.get("movement_id")}
