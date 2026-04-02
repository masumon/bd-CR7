"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  FolderKanban,
  Loader2,
  Pencil,
  Plus,
  X,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

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

  const [projects, setProjects]     = useState<Project[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [editId, setEditId]         = useState<string | null>(null);
  const [form, setForm]             = useState({ ...EMPTY_FORM });
  const [error, setError]           = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("id,name,description,budget,cover_photo_url,phase,start_date,end_date,status,created_at")
      .order("created_at", { ascending: false });
    if (!error && data) setProjects(data as Project[]);
    setLoading(false);
    }, [supabase]);

    useEffect(() => { fetchProjects(); }, [fetchProjects]);

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderKanban className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Projects</h2>
        </div>
          <Button onClick={openCreate} className="gap-1.5 h-8 px-3 text-xs">
          <Plus className="h-4 w-4" /> New Project
        </Button>
      </div>

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
                    <h3 className="text-sm font-semibold leading-tight">{p.name}</h3>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[p.status]}`}>
                      {p.status}
                    </span>
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
