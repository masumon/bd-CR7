"use client";

import { WorkerLogsFeature } from "@/features/construction/worker_logs/WorkerLogsFeature";
import { MaterialTrackFeature } from "@/features/construction/material_track/MaterialTrackFeature";
import { ProgressCamFeature } from "@/features/construction/progress_cam/ProgressCamFeature";

export function ConstructionPanel() {
  return (
    <section className="module">
      <h2>Construction</h2>
      <WorkerLogsFeature />
      <MaterialTrackFeature />
      <ProgressCamFeature />
    </section>
  );
}
