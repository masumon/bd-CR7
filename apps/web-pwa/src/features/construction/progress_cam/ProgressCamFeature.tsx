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
    <section className="module">
      <h3>Progress Visualizer</h3>
      <form onSubmit={onSubmit} className="formGrid">
        <input type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <select value={phaseCategory} onChange={(e) => setPhaseCategory(e.target.value)}>
          {PHASES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption" rows={2} />
        <button type="submit">Upload Progress Media</button>
      </form>

      <div className="mt-3 text-xs text-slate-700">
        {entries.slice(0, 8).map((entry, idx) => (
          <p key={`${entry.media_url}-${idx}`}>{entry.phase_category} - {entry.caption} - {entry.media_url}</p>
        ))}
      </div>
      {message ? <p>{message}</p> : null}
    </section>
  );
}
