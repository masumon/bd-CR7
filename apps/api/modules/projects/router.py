from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException

from core.auth import UserContext, get_current_user, require_roles
from core.supabase import get_supabase_service, require_supabase_service
from schemas.construction import ProjectAttachmentCreate, ProjectTimelineEventCreate

router = APIRouter()


@router.get("/projects/{project_id}/timeline")
async def list_project_timeline(project_id: str, user: UserContext = Depends(get_current_user)):
    svc = require_supabase_service()

    project = (
        svc.table("projects")
        .select("id,project_timeline_events(id,project_id,title,description,event_date,status,created_by,created_at,updated_at)")
        .eq("id", project_id)
        .maybe_single()
        .execute()
    )
    if not project.data:
        raise HTTPException(status_code=404, detail="Project not found")
    events = project.data.get("project_timeline_events") or []
    events.sort(key=lambda e: (e.get("event_date") or "", e.get("created_at") or ""), reverse=True)
    return events


@router.post("/projects/{project_id}/timeline")
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


@router.get("/projects/{project_id}/attachments")
async def list_project_attachments(project_id: str, user: UserContext = Depends(get_current_user)):
    svc = require_supabase_service()

    project = (
        svc.table("projects")
        .select("id,project_attachments(id,project_id,file_url,file_type,file_name,caption,uploaded_by,created_at)")
        .eq("id", project_id)
        .maybe_single()
        .execute()
    )
    if not project.data:
        raise HTTPException(status_code=404, detail="Project not found")
    attachments = project.data.get("project_attachments") or []
    attachments.sort(key=lambda a: a.get("created_at") or "", reverse=True)
    return attachments


@router.post("/projects/{project_id}/attachments")
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
