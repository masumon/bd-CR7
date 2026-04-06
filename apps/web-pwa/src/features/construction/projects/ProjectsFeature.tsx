"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock3,
  CalendarDays,
  FileImage,
  FolderKanban,
  Loader2,
  Pencil,
  Plus,
  Upload,
  X,
  XCircle,
} from "lucide-react";

import { ActionMenu } from "@/components/ui/action-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader, WorkspaceHero } from "@/components/ui/workspace";
import { ExportPDFButton } from "@/components/ui/ExportPDFButton";
import { ProjectFilesPanel } from "@/components/ui/ProjectFilesPanel";
import { apiRequest } from "@/lib/api";
import { uploadToCloudinary } from "@/lib/cloudinaryUpload";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";

const STATUS_OPTIONS = ["Planning", "Active", "Paused", "Completed", "Cancelled"] as const;
type ProjectStatus = (typeof STATUS_OPTIONS)[number];

const PHASE_OPTIONS = [
  "Site Preparation",
  "Earthwork",
  "Foundation",
  "Steel Structure",
  "Roofing",
  "Wall",
  "Flooring",
  "Electrical",
  "Plumbing",
  "Interior",
  "Finishing",
  "Completed",
] as const;
type ProjectPhase = (typeof PHASE_OPTIONS)[number];

const STATUS_COLORS: Record<ProjectStatus, string> = {
  Planning:   "bg-blue-100 text-blue-700",
  Active:     "bg-emerald-100 text-emerald-700",
  Paused:     "bg-amber-100 text-amber-700",
  Completed:  "bg-slate-100 text-slate-700",
  Cancelled:  "bg-rose-100 text-rose-700",
};

interface Project {
  id: string;
  name: string;
  description: string | null;
  budget: number | null;
  cover_photo_url: string | null;
  phase: string | null;
  start_date: string | null;
  end_date: string | null;
  status: ProjectStatus;
  created_at: string;
}

interface ProjectTimelineEvent {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  event_date: string;
  status: string;
  created_at: string;
}

interface ProjectAttachment {
  id: string;
  project_id: string;
  file_url: string;
  file_type: string | null;
  file_name: string | null;
  caption: string | null;
  created_at: string;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  budget: "",
  cover_photo_url: "",
  phase: PHASE_OPTIONS[0] as ProjectPhase,
  start_date: "",
  end_date: "",
  status: "Planning" as ProjectStatus,
};

export function ProjectsFeature() {
  const supabase = useMemo(() => createClient(), []);
  const userId = useAuthStore((state) => state.userId);
  const token = useAuthStore((state) => state.token);

  const [projects, setProjects]     = useState<Project[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [editId, setEditId]         = useState<string | null>(null);
  const [form, setForm]             = useState({ ...EMPTY_FORM });
  const [error, setError]           = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [timelineItems, setTimelineItems] = useState<ProjectTimelineEvent[]>([]);
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);
  const [timelineTitle, setTimelineTitle] = useState("");
  const [timelineDescription, setTimelineDescription] = useState("");
  const [timelineDate, setTimelineDate] = useState(new Date().toISOString().slice(0, 10));
  const [timelineStatus, setTimelineStatus] = useState("planned");
  const [timelineSaving, setTimelineSaving] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentCaption, setAttachmentCaption] = useState("");
  const [attachmentSaving, setAttachmentSaving] = useState(false);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("id,name,description,budget,cover_photo_url,phase,start_date,end_date,status,created_at")
      .order("created_at", { ascending: false });
    if (!error && data) setProjects(data as Project[]);
    setLoading(false);
    }, [supabase]);

  const fetchProjectDetails = useCallback(async (projectId: string) => {
    setDetailsLoading(true);
    setDetailsError(null);
    try {
      const [timelineData, attachmentData] = await Promise.all([
        apiRequest<ProjectTimelineEvent[]>(`/api/project-management/projects/${projectId}/timeline`, {}, token || undefined),
        apiRequest<ProjectAttachment[]>(`/api/project-management/projects/${projectId}/attachments`, {}, token || undefined),
      ]);
      setTimelineItems(timelineData || []);
      setAttachments(attachmentData || []);
    } catch {
      const [timelineRes, attachmentsRes] = await Promise.all([
        supabase
          .from("project_timeline_events")
          .select("id,project_id,title,description,event_date,status,created_at")
          .eq("project_id", projectId)
          .order("event_date", { ascending: false })
          .limit(40),
        supabase
          .from("project_attachments")
          .select("id,project_id,file_url,file_type,file_name,caption,created_at")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(40),
      ]);

      if (timelineRes.error || attachmentsRes.error) {
        setDetailsError(timelineRes.error?.message || attachmentsRes.error?.message || "Failed to load project details");
        setTimelineItems([]);
        setAttachments([]);
        setDetailsLoading(false);
        return;
      }

      setTimelineItems((timelineRes.data || []) as ProjectTimelineEvent[]);
      setAttachments((attachmentsRes.data || []) as ProjectAttachment[]);
    }
    setDetailsLoading(false);
  }, [supabase, token]);

    useEffect(() => { fetchProjects(); }, [fetchProjects]);

  useEffect(() => {
    if (!projects.length) {
      setSelectedProjectId(null);
      return;
    }
    if (!selectedProjectId || !projects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) {
      setTimelineItems([]);
      setAttachments([]);
      return;
    }
    void fetchProjectDetails(selectedProjectId);
  }, [selectedProjectId, fetchProjectDetails]);

  function openCreate() {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setError(null);
    setShowModal(true);
  }

  function openEdit(p: Project) {
    setEditId(p.id);
    setForm({
      name: p.name,
      description: p.description ?? "",
      budget: p.budget != null ? String(p.budget) : "",
      cover_photo_url: p.cover_photo_url ?? "",
      phase: (p.phase as ProjectPhase) ?? PHASE_OPTIONS[0],
      start_date: p.start_date ?? "",
      end_date: p.end_date ?? "",
      status: p.status,
    });
    setError(null);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Project name is required."); return; }

    setSaving(true);
    setError(null);

    const payload: Partial<Project> & { created_by: null } = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      budget: form.budget ? Number(form.budget) : null,
      cover_photo_url: form.cover_photo_url.trim() || null,
      phase: form.phase,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      status: form.status,
      created_by: null,
    };

    let err;
    if (editId) {
      const { error: e } = await supabase.from("projects").update(payload).eq("id", editId);
      err = e;
    } else {
      const { error: e } = await supabase.from("projects").insert([payload]);
      err = e;
    }

    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false);
    setShowModal(false);
    fetchProjects();
  }

  async function handleCancel(id: string) {
    if (!confirm("Mark this project as Cancelled?")) return;
    await supabase.from("projects").update({ status: "Cancelled" }).eq("id", id);
    fetchProjects();
  }

  async function handleAddTimelineEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId || !timelineTitle.trim()) {
      return;
    }
    setTimelineSaving(true);
    setDetailsError(null);
    let timelineError: Error | null = null;
    try {
      await apiRequest(`/api/project-management/projects/${selectedProjectId}/timeline`, {
        method: "POST",
        body: JSON.stringify({
          title: timelineTitle.trim(),
          description: timelineDescription.trim() || null,
          event_date: timelineDate,
          status: timelineStatus,
        }),
      }, token || undefined);
    } catch {
      const { error } = await supabase.from("project_timeline_events").insert({
        project_id: selectedProjectId,
        title: timelineTitle.trim(),
        description: timelineDescription.trim() || null,
        event_date: timelineDate,
        status: timelineStatus,
        created_by: userId ?? null,
      });
      timelineError = error;
    }
    setTimelineSaving(false);
    if (timelineError) {
      setDetailsError(timelineError.message);
      return;
    }
    setTimelineTitle("");
    setTimelineDescription("");
    setTimelineDate(new Date().toISOString().slice(0, 10));
    setTimelineStatus("planned");
    await fetchProjectDetails(selectedProjectId);
  }

  async function handleUploadAttachment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId || !attachmentFile) {
      return;
    }
    setAttachmentSaving(true);
    setDetailsError(null);
    try {
      const fileUrl = await uploadToCloudinary(attachmentFile);

      let attachmentError: Error | null = null;
      try {
        await apiRequest(`/api/project-management/projects/${selectedProjectId}/attachments`, {
          method: "POST",
          body: JSON.stringify({
            file_url: fileUrl,
            file_type: attachmentFile.type || null,
            file_name: attachmentFile.name || null,
            caption: attachmentCaption.trim() || null,
          }),
        }, token || undefined);
      } catch {
        const { error } = await supabase.from("project_attachments").insert({
          project_id: selectedProjectId,
          file_url: fileUrl,
          file_type: attachmentFile.type || null,
          file_name: attachmentFile.name || null,
          caption: attachmentCaption.trim() || null,
          uploaded_by: userId ?? null,
        });
        attachmentError = error;
      }

      if (attachmentError) {
        throw attachmentError;
      }
      setAttachmentFile(null);
      setAttachmentCaption("");
      await fetchProjectDetails(selectedProjectId);
    } catch (uploadError) {
      setDetailsError((uploadError as Error).message);
    } finally {
      setAttachmentSaving(false);
    }
  }

  const field = (
    key: keyof typeof EMPTY_FORM,
    label: string,
    type: "text" | "number" | "date" | "textarea" = "text",
  ) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {type === "textarea" ? (
        <textarea
          value={form[key] as string}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          rows={3}
            title={label}
            placeholder={label}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
      ) : (
        <input
          type={type}
          value={form[key] as string}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            title={label}
            placeholder={label}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <WorkspaceHero
        badge="Project Introduction / প্রকল্প পরিচিতি"
        stats={[
          { label: "Total Projects", value: String(projects.length) },
          { label: "Active Projects", value: String(projects.filter((project) => project.status === "Active").length) },
          { label: "Completed", value: String(projects.filter((project) => project.status === "Completed").length) },
        ]}
      />

      <SectionHeader
        eyebrow="Project Desk / প্রজেক্ট ডেস্ক"
        title="Project cards with update controls"
        actions={
          <div className="flex items-center gap-2">
            <ExportPDFButton
              onBuildOptions={() => ({
                moduleName: "Projects",
                moduleNameBn: "প্রকল্প ব্যবস্থাপনা",
                description: "Active construction project register.",
                descriptionBn: "সক্রিয় নির্মাণ প্রকল্পের তালিকা।",
                sections: [
                  {
                    title: "Projects Overview",
                    titleBn: "প্রকল্প সারসংক্ষেপ",
                    rows: [],
                    tableHeaders: ["Name", "Status", "Phase", "Budget", "Start", "End"],
                    tableHeadersBn: ["নাম", "স্ট্যাটাস", "পর্যায়", "বাজেট", "শুরু", "শেষ"],
                    tableRows: projects.map((p) => [
                      p.name,
                      p.status,
                      p.phase ?? "—",
                      p.budget != null ? `৳${Number(p.budget).toLocaleString()}` : "—",
                      p.start_date ?? "—",
                      p.end_date ?? "—",
                    ]),
                  },
                ],
              })}
            />
            <Button onClick={openCreate} className="gap-1.5 h-10 px-4 text-sm">
              <Plus className="h-4 w-4" /> New Project
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <FolderKanban className="h-10 w-10 opacity-30" />
            <p className="text-sm">No projects yet. Create the first one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="overflow-hidden">
                {p.cover_photo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.cover_photo_url}
                    alt={p.name}
                    className="h-36 w-full object-cover"
                  />
                )}
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold leading-tight">{p.name}</h3>
                      <span className={`mt-2 inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[p.status]}`}>
                        {p.status}
                      </span>
                    </div>
                    <ActionMenu
                      items={[
                        { label: "Update Project", onClick: () => openEdit(p) },
                        { label: "Mark as Cancelled", onClick: () => void handleCancel(p.id), tone: "danger" },
                      ]}
                    />
                  </div>
                  {p.description && (
                    <p className="text-xs text-muted-foreground leading-5 line-clamp-2">{p.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {p.phase && (
                      <span className="rounded-lg border border-border px-2 py-0.5">{p.phase}</span>
                    )}
                    {p.budget != null && (
                      <span className="rounded-lg border border-border px-2 py-0.5">
                        ৳{Number(p.budget).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {(p.start_date || p.end_date) && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {p.start_date && <span>{p.start_date}</span>}
                      {p.start_date && p.end_date && <span>→</span>}
                      {p.end_date && <span>{p.end_date}</span>}
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      className="flex-1 gap-1.5 text-xs h-8"
                      onClick={() => openEdit(p)}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-1.5 text-xs h-8"
                      onClick={() => setSelectedProjectId(p.id)}
                    >
                      <Clock3 className="h-3.5 w-3.5" /> Timeline
                    </Button>
                    {p.status !== "Cancelled" && p.status !== "Completed" && (
                      <Button
                        variant="outline"
                        className="gap-1.5 text-xs h-8 text-rose-600 hover:text-rose-700 border-rose-200"
                        onClick={() => handleCancel(p.id)}
                      >
                        <XCircle className="h-3.5 w-3.5" /> Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {selectedProject ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Project Timeline</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Manage milestones for {selectedProject.name}.</p>
                </div>
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Clock3 className="h-4 w-4" />
                </div>
              </div>

              <form onSubmit={handleAddTimelineEvent} className="grid gap-2">
                <input
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  title="Timeline title"
                  placeholder="Milestone title"
                  value={timelineTitle}
                  onChange={(e) => setTimelineTitle(e.target.value)}
                  required
                />
                <textarea
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  title="Timeline description"
                  placeholder="Milestone details"
                  rows={2}
                  value={timelineDescription}
                  onChange={(e) => setTimelineDescription(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    type="date"
                    title="Event date"
                    value={timelineDate}
                    onChange={(e) => setTimelineDate(e.target.value)}
                  />
                  <select
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    title="Event status"
                    value={timelineStatus}
                    onChange={(e) => setTimelineStatus(e.target.value)}
                  >
                    <option value="planned">Planned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
                <Button type="submit" className="gap-1.5" disabled={timelineSaving}>
                  {timelineSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add Milestone
                </Button>
              </form>

              <div className="space-y-2">
                {detailsLoading ? (
                  <div className="py-6 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
                ) : timelineItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-background/70 px-3 py-5 text-center text-sm text-muted-foreground">No timeline event yet.</div>
                ) : (
                  timelineItems.map((item) => (
                    <div key={item.id} className="rounded-xl border border-border bg-background/80 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] uppercase text-muted-foreground">{item.status}</span>
                      </div>
                      {item.description ? <p className="mt-1 text-xs text-muted-foreground">{item.description}</p> : null}
                      <p className="mt-1 text-[11px] text-muted-foreground">{item.event_date}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Project Attachments</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Upload image/video evidence and supporting files.</p>
                </div>
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileImage className="h-4 w-4" />
                </div>
              </div>

              <form onSubmit={handleUploadAttachment} className="grid gap-2">
                <input
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  type="file"
                  title="Attachment upload"
                  accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                  onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                  required
                />
                <input
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  title="Attachment caption"
                  placeholder="Caption (optional)"
                  value={attachmentCaption}
                  onChange={(e) => setAttachmentCaption(e.target.value)}
                />
                <Button type="submit" className="gap-1.5" disabled={attachmentSaving}>
                  {attachmentSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Upload Attachment
                </Button>
              </form>

              <div className="space-y-2">
                {detailsLoading ? (
                  <div className="py-6 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
                ) : attachments.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-background/70 px-3 py-5 text-center text-sm text-muted-foreground">No attachments yet.</div>
                ) : (
                  attachments.map((item) => (
                    <div key={item.id} className="rounded-xl border border-border bg-background/80 p-2">
                      {item.file_type?.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.file_url} alt={item.caption || item.file_name || "Attachment"} className="h-32 w-full rounded-lg object-cover" />
                      ) : item.file_type?.startsWith("video/") ? (
                        <video className="h-32 w-full rounded-lg object-cover" controls src={item.file_url} />
                      ) : (
                        <a href={item.file_url} target="_blank" rel="noreferrer" className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border text-xs text-primary hover:underline">
                          Open file
                        </a>
                      )}
                      <div className="mt-2 flex items-start justify-between gap-2 text-xs">
                        <p className="truncate text-muted-foreground">{item.caption || item.file_name || "Attachment"}</p>
                        <span className="text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Centralized file vault for the selected project */}
      {selectedProject && (
        <ProjectFilesPanel
          module="construction"
          category="progress"
          projectId={selectedProject.id}
          label={`All Files — ${selectedProject.name}`}
          subcategory="site"
        />
      )}

      {detailsError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {detailsError}
        </div>
      ) : null}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-lg rounded-2xl bg-background border border-border shadow-2xl overflow-y-auto max-h-[90vh]"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h3 className="text-base font-semibold">{editId ? "Edit Project" : "New Project"}</h3>
                <button title="Close" onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                  </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 p-5">
                {field("name", "Project Name *")}
                {field("description", "Description", "textarea")}

                <div className="grid grid-cols-2 gap-3">
                  {field("budget", "Budget (৳)", "number")}
                  {field("cover_photo_url", "Cover Photo URL")}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Phase</label>
                    <select
                      title="Project phase"
                      value={form.phase}
                      onChange={(e) => setForm((f) => ({ ...f, phase: e.target.value as ProjectPhase }))}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                    {PHASE_OPTIONS.map((ph) => <option key={ph}>{ph}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                    <select
                      title="Project status"
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProjectStatus }))}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                    {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {field("start_date", "Start Date", "date")}
                  {field("end_date",   "End Date",   "date")}
                </div>

                {error && (
                  <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 gap-1.5" disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {editId ? "Save Changes" : "Create Project"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
