from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException

from core.auth import UserContext, get_current_user, require_roles
from core.supabase import supabase_service
from schemas.construction import ProjectAttachmentCreate, ProjectTimelineEventCreate

router = APIRouter()


def _ensure_project_exists(project_id: str) -> None:
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    project = (
        supabase_service.table("projects")
        .select("id")
        .eq("id", project_id)
        .limit(1)
        .execute()
    )
    if not project.data:
        raise HTTPException(status_code=404, detail="Project not found")


@router.get("/projects/{project_id}/timeline")
async def list_project_timeline(project_id: str, user: UserContext = Depends(get_current_user)):
    _ensure_project_exists(project_id)
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    rows = (
        supabase_service.table("project_timeline_events")
        .select("id,project_id,title,description,event_date,status,created_by,created_at,updated_at")
        .eq("project_id", project_id)
        .order("event_date", desc=True)
        .order("created_at", desc=True)
        .execute()
    )
    return rows.data or []


@router.post("/projects/{project_id}/timeline")
async def create_project_timeline(
    project_id: str,
    payload: ProjectTimelineEventCreate,
    user: UserContext = Depends(require_roles("admin", "maker", "checker")),
):
    _ensure_project_exists(project_id)
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    timeline_id = str(uuid4())
    insert_res = supabase_service.table("project_timeline_events").insert(
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

    if not insert_res.data:
        raise HTTPException(status_code=500, detail="Failed to create project timeline event")

    return insert_res.data[0]


@router.get("/projects/{project_id}/attachments")
async def list_project_attachments(project_id: str, user: UserContext = Depends(get_current_user)):
    _ensure_project_exists(project_id)
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    rows = (
        supabase_service.table("project_attachments")
        .select("id,project_id,file_url,file_type,file_name,caption,uploaded_by,created_at")
        .eq("project_id", project_id)
        .order("created_at", desc=True)
        .execute()
    )
    return rows.data or []


@router.post("/projects/{project_id}/attachments")
async def create_project_attachment(
    project_id: str,
    payload: ProjectAttachmentCreate,
    user: UserContext = Depends(require_roles("admin", "maker", "checker")),
):
    _ensure_project_exists(project_id)
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    attachment_id = str(uuid4())
    insert_res = supabase_service.table("project_attachments").insert(
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

    if not insert_res.data:
        raise HTTPException(status_code=500, detail="Failed to create project attachment")

    return insert_res.data[0]
