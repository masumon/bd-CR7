"use client";

import { FormEvent, useState } from "react";

import { uploadToCloudinary } from "@bdcr7/media-engine";

const PHASES = ["Foundation", "Structure", "Finishing", "Handover"];

type ProgressEntry = {
  media_url: string;
  phase_category: string;
  caption: string;
};

export function ProgressCamFeature() {
  const [file, setFile] = useState<File | null>(null);
  const [phaseCategory, setPhaseCategory] = useState(PHASES[0]);
  const [caption, setCaption] = useState("");
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [message, setMessage] = useState("");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) {
      setMessage("Photo/Video file is required");
      return;
    }

    try {
      const mediaUrl = await uploadToCloudinary({
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "",
        file,
      });
      const next: ProgressEntry = { media_url: mediaUrl, phase_category: phaseCategory, caption };
      setEntries((prev) => [next, ...prev]);
      setMessage("Progress media uploaded");
      setFile(null);
      setCaption("");
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  return (
    <section className="module rounded-[1.5rem] border border-border/70 bg-white/80 p-5 shadow-soft dark:bg-slate-950/45">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-foreground">Progress Visualizer</h3>
        <p className="mt-1 text-sm text-muted-foreground">Upload image or video evidence by phase category with a clearer visual log.</p>
      </div>
      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
        <input className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none md:col-span-2" type="file" title="Photo or video upload" accept="image/*,video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <select className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none" title="Phase category" value={phaseCategory} onChange={(e) => setPhaseCategory(e.target.value)}>
          {PHASES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <textarea className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption" rows={2} />
        <button className="rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-95 md:col-span-2" type="submit">Upload Progress Media</button>
      </form>

      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        {entries.slice(0, 8).map((entry, idx) => (
          <div key={`${entry.media_url}-${idx}`} className="rounded-xl border border-border/70 bg-background/75 px-3 py-3">
            <p className="font-medium text-foreground">{entry.phase_category}</p>
            <p className="mt-1">{entry.caption || "No caption provided"}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{entry.media_url}</p>
          </div>
        ))}
      </div>
      {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
    </section>
  );
}
