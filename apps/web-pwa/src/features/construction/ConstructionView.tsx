"use client";

import { motion } from "framer-motion";
import { Camera, MapPinned, Workflow } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ActionMenu } from "@/components/ui/action-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { SectionHeader, WorkspaceHero } from "@/components/ui/workspace";
import { ProgressCamFeature } from "./progress_cam/ProgressCamFeature";
import { WorkerLogsFeature } from "./worker_logs/WorkerLogsFeature";
import { MaterialTrackFeature } from "./material_track/MaterialTrackFeature";

const workers = [
  { name: "Rakib", zone: "A1", status: "Present" },
  { name: "Sakib", zone: "B2", status: "Absent" },
  { name: "Jahid", zone: "C3", status: "Present" },
  { name: "Nabil", zone: "A2", status: "Present" },
];

const materials = [
  { item: "Cement", stock: 72 },
  { item: "Steel Rod", stock: 48 },
  { item: "Sand", stock: 88 },
  { item: "Brick", stock: 61 },
];

export function ConstructionView() {
  const [activeTab, setActiveTab] = useState("Project Progress");
  const presentWorkers = workers.filter((row) => row.status === "Present").length;
  const averageStock = Math.round(materials.reduce((sum, item) => sum + item.stock, 0) / materials.length);
  const riskCount = materials.filter((item) => item.stock < 60).length;

  const sections = useMemo(
    () => [
      {
        key: "Project Progress",
        eyebrow: "Progress / অগ্রগতি",
        title: "Phase evidence and field continuity",
        description: "Foundation to handover updates, field media, and execution evidence stay grouped here.",
        content: <ProgressCamFeature />,
      },
      {
        key: "Workers",
        eyebrow: "Workforce / শ্রমিক",
        title: "Attendance, wage exposure, and geofence discipline",
        description: "Log labour presence and daily field status without leaving the site workspace.",
        content: <WorkerLogsFeature />,
      },
      {
        key: "Materials",
        eyebrow: "Materials / মালামাল",
        title: "Stock movement, low inventory watch, and supply readiness",
        description: "Material inflow and outflow are organized as a site logistics desk.",
        content: <MaterialTrackFeature />,
      },
    ],
    []
  );

  const currentSection = sections.find((section) => section.key === activeTab) || sections[0];

  return (
    <div className="space-y-4">
      <WorkspaceHero
        badge="Construction Workspace / নির্মাণ ওয়ার্কস্পেস"
        stats={[
          { label: "Present Workers", value: `${presentWorkers} / ${workers.length}` },
          { label: "Average Stock Readiness", value: `${averageStock}%` },
          { label: "Risk Lines", value: String(riskCount) },
        ]}
      />

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]"
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Daily Site Register</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Quick workforce visibility before deeper actions.</p>
              </div>
              <ActionMenu
                items={[
                  { label: "Open Worker Form", onClick: () => setActiveTab("Workers") },
                  { label: "Open Project Intro", onClick: () => window.location.assign("/dashboard/construction/projects") },
                ]}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <thead>
                <tr>
                  <Th>Worker</Th>
                  <Th>Geo Zone</Th>
                  <Th>Attendance</Th>
                </tr>
              </thead>
              <tbody>
                {workers.map((row) => (
                  <tr key={row.name}>
                    <Td className="font-medium text-foreground">{row.name}</Td>
                    <Td>
                      <span className="inline-flex items-center gap-2 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                        <MapPinned className="h-3.5 w-3.5" /> {row.zone}
                      </span>
                    </Td>
                    <Td>
                      <span className="inline-flex items-center gap-2 text-sm">
                        <span className={`h-2.5 w-2.5 rounded-full ${row.status === "Present" ? "bg-emerald-500" : "bg-rose-500"}`} />
                        {row.status}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Material Snapshot</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Immediate stock visibility before store actions.</p>
              </div>
              <ActionMenu
                items={[
                  { label: "Open Material Desk", onClick: () => setActiveTab("Materials") },
                  { label: "Open Progress Desk", onClick: () => setActiveTab("Project Progress") },
                ]}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {materials.map((row) => (
              <div key={row.item} className="space-y-2 rounded-2xl border border-border/70 bg-background/75 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{row.item}</span>
                  <span className="text-muted-foreground">{row.stock}%</span>
                </div>
                <progress
                  className="h-2 w-full overflow-hidden rounded-full bg-muted [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary"
                  max={100}
                  value={row.stock}
                  aria-label={`${row.item} stock level`}
                />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Category and Subcategory Flow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-2xl border border-border/70 bg-background/75 p-3">Project Intro: identity, phase, timeline, budget</div>
            <div className="rounded-2xl border border-border/70 bg-background/75 p-3">Workers: attendance, wages, geofence, daily task notes</div>
            <div className="rounded-2xl border border-border/70 bg-background/75 p-3">Materials: inward, outward, low-stock, supplier notes</div>
            <div className="rounded-2xl border border-border/70 bg-background/75 p-3">Progress: image/video evidence for foundation, structure, finishing, handover</div>
          </CardContent>
        </Card>
        </motion.div>
      </motion.div>

      <Card>
        <CardContent className="space-y-5 p-5">
          <SectionHeader
            eyebrow="Workspace Flow / কাজের ধারা"
            title={currentSection.title}
            actions={
              <>
                <Tabs tabs={sections.map((section) => section.key)} value={activeTab} onChange={setActiveTab} />
                <Link href="/dashboard/construction/projects">
                  <Button variant="outline" className="gap-2">
                    <Workflow className="h-4 w-4" /> Project Intro
                  </Button>
                </Link>
              </>
            }
          />
          {currentSection.content}
        </CardContent>
      </Card>
    </div>
  );
}
