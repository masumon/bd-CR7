from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException

from core.auth import UserContext, get_current_user, require_roles
from core.supabase import require_supabase_service
from schemas.construction import ProjectAttachmentCreate, ProjectTimelineEventCreate, ProjectUpsert

router = APIRouter()

PROJECT_STATUS_LABELS = {
    "planning": "Planning",
    "active": "Active",
    "paused": "Paused",
    "completed": "Completed",
    "cancelled": "Cancelled",
}


def _normalize_project_status(value: str | None) -> str:
    normalized = str(value or "planning").strip().lower()
    if normalized not in PROJECT_STATUS_LABELS:
        raise HTTPException(status_code=422, detail="Invalid project status")
    return normalized


def _serialize_project(row: dict) -> dict:
    raw_status = str(row.get("status") or "planning").strip().lower()
    return {
        "id": row.get("id"),
        "name": row.get("name") or row.get("title") or "",
        "description": row.get("description"),
        "budget": row.get("budget"),
        "cover_photo_url": row.get("cover_photo_url"),
        "phase": row.get("phase"),
        "start_date": row.get("start_date"),
        "end_date": row.get("end_date") or row.get("expected_end_date"),
        "status": PROJECT_STATUS_LABELS.get(raw_status, "Planning"),
        "created_at": row.get("created_at"),
    }


def _project_select() -> str:
    return "id,name,title,description,budget,cover_photo_url,phase,start_date,end_date,expected_end_date,status,created_at"


@router.get("")
async def list_projects(user: UserContext = Depends(get_current_user)):
    svc = require_supabase_service()
    result = svc.table("projects").select(_project_select()).order("created_at", desc=True).execute()
    return [_serialize_project(row) for row in (result.data or [])]


@router.post("")
async def create_project(
    payload: ProjectUpsert,
    user: UserContext = Depends(require_roles("admin", "maker", "checker")),
):
    svc = require_supabase_service()

    project_id = str(uuid4())
    project_row = {
        "id": project_id,
        "title": payload.name.strip(),
        "name": payload.name.strip(),
        "description": payload.description,
        "budget": float(payload.budget) if payload.budget is not None else None,
        "cover_photo_url": payload.cover_photo_url,
        "phase": payload.phase,
        "start_date": payload.start_date.isoformat() if payload.start_date else None,
        "expected_end_date": payload.end_date.isoformat() if payload.end_date else None,
        "end_date": payload.end_date.isoformat() if payload.end_date else None,
        "status": _normalize_project_status(payload.status),
        "owner_user_id": user.user_id,
        "created_by": user.user_id,
    }

    try:
        insert_res = svc.table("projects").insert(project_row).execute()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail="Failed to create project") from exc

    rows = insert_res.data or []
    if not rows:
        created = svc.table("projects").select(_project_select()).eq("id", project_id).limit(1).execute()
        rows = created.data or []
    if not rows:
        raise HTTPException(status_code=500, detail="Failed to create project")

    return _serialize_project(rows[0])


@router.patch("/{project_id}")
async def update_project(
    project_id: str,
    payload: ProjectUpsert,
    user: UserContext = Depends(require_roles("admin", "maker", "checker")),
):
    svc = require_supabase_service()

    update_row = {
        "title": payload.name.strip(),
        "name": payload.name.strip(),
        "description": payload.description,
        "budget": float(payload.budget) if payload.budget is not None else None,
        "cover_photo_url": payload.cover_photo_url,
        "phase": payload.phase,
        "start_date": payload.start_date.isoformat() if payload.start_date else None,
        "expected_end_date": payload.end_date.isoformat() if payload.end_date else None,
        "end_date": payload.end_date.isoformat() if payload.end_date else None,
        "status": _normalize_project_status(payload.status),
    }

    try:
        svc.table("projects").update(update_row).eq("id", project_id).execute()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail="Failed to update project") from exc

    result = svc.table("projects").select(_project_select()).eq("id", project_id).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Project not found")
    return _serialize_project(result.data[0])


@router.post("/{project_id}/cancel")
async def cancel_project(
    project_id: str,
    user: UserContext = Depends(require_roles("admin", "maker", "checker")),
):
    svc = require_supabase_service()

    try:
        svc.table("projects").update({"status": "cancelled"}).eq("id", project_id).execute()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail="Failed to cancel project") from exc

    result = svc.table("projects").select(_project_select()).eq("id", project_id).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Project not found")
    return _serialize_project(result.data[0])


@router.get("/{project_id}/timeline")
async def list_project_timeline(project_id: str, user: UserContext = Depends(get_current_user)):
    svc = require_supabase_service()

    project_res = (
        svc.table("projects")
        .select("id,project_timeline_events(id,project_id,title,description,event_date,status,created_by,created_at,updated_at)")
        .eq("id", project_id)
        .maybe_single()
        .execute()
    )
    project = project_res.data if project_res else None
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    events = project.get("project_timeline_events") or []
    events.sort(key=lambda e: (e.get("event_date") or "", e.get("created_at") or ""), reverse=True)
    return events


@router.post("/{project_id}/timeline")
async def create_project_timeline(
    project_id: str,
    payload: ProjectTimelineEventCreate,
    user: UserContext = Depends(require_roles("admin", "maker", "checker")),
):
    svc = require_supabase_service()

    timeline_id = str(uuid4())
    try:
        insert_res = svc.table("project_timeline_events").insert(
            {
                "id": timeline_id,
                "project_id": project_id,
                "title": payload.title,
                "description": payload.description,
                "event_date": payload.event_date.isoformat(),
                "status": payload.status,
                "created_by": user.user_id,
            }
        ).execute()
    except Exception as exc:  # noqa: BLE001
        detail = str(exc)
        if "foreign key" in detail.lower() or "violates" in detail.lower():
            raise HTTPException(status_code=404, detail="Project not found") from exc
        raise HTTPException(status_code=500, detail="Failed to create project timeline event") from exc

    if not insert_res.data:
        raise HTTPException(status_code=500, detail="Failed to create project timeline event")

    return insert_res.data[0]


@router.get("/{project_id}/attachments")
async def list_project_attachments(project_id: str, user: UserContext = Depends(get_current_user)):
    svc = require_supabase_service()

    project_res = (
        svc.table("projects")
        .select("id,project_attachments(id,project_id,file_url,file_type,file_name,caption,uploaded_by,created_at)")
        .eq("id", project_id)
        .maybe_single()
        .execute()
    )
    project = project_res.data if project_res else None
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    attachments = project.get("project_attachments") or []
    attachments.sort(key=lambda a: a.get("created_at") or "", reverse=True)
    return attachments


@router.post("/{project_id}/attachments")
async def create_project_attachment(
    project_id: str,
    payload: ProjectAttachmentCreate,
    user: UserContext = Depends(require_roles("admin", "maker", "checker")),
):
    svc = require_supabase_service()

    if not payload.file_url.startswith("https://res.cloudinary.com/"):
        raise HTTPException(status_code=400, detail="file_url must be a Cloudinary URL")

    attachment_id = str(uuid4())
    try:
        insert_res = svc.table("project_attachments").insert(
            {
                "id": attachment_id,
                "project_id": project_id,
                "file_url": payload.file_url,
                "file_type": payload.file_type,
                "file_name": payload.file_name,
                "caption": payload.caption,
                "uploaded_by": user.user_id,
            }
        ).execute()
    except Exception as exc:  # noqa: BLE001
        detail = str(exc)
        if "foreign key" in detail.lower() or "violates" in detail.lower():
            raise HTTPException(status_code=404, detail="Project not found") from exc
        raise HTTPException(status_code=500, detail="Failed to create project attachment") from exc

    if not insert_res.data:
        raise HTTPException(status_code=500, detail="Failed to create project attachment")

    return insert_res.data[0]
