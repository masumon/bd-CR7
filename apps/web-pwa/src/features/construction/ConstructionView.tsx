"use client";

import { motion } from "framer-motion";
import { Camera, HardHat, MapPinned, PackageCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";

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
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-white/85 via-white/80 to-primary/5 dark:from-slate-950/70 dark:via-slate-950/55 dark:to-primary/10">
        <CardContent className="grid gap-5 p-5 md:grid-cols-[1.1fr_0.9fr] md:p-6">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Construction Workspace
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">Site categories and subcategories are now separated for faster field decisions.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Worker attendance, stock movement, and progress capture each get their own visual block so project managers can move from workforce to materials to execution evidence without losing context.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { title: "Workforce", desc: "Attendance, zone presence, wage visibility", icon: HardHat },
                { title: "Materials", desc: "Stock pressure, reorder risk, site readiness", icon: PackageCheck },
                { title: "Progress Media", desc: "Phase-based field evidence and milestones", icon: Camera },
              ].map(({ title, desc, icon: Icon }) => (
                <div key={title} className="rounded-2xl border border-border/70 bg-background/75 p-4">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Field Snapshot</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Present workers</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">3 / 4</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Average stock readiness</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">67%</p>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                One absent worker and two material lines need attention before the next finishing-phase push.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]"
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
        <Card>
          <CardHeader>
            <CardTitle>Worker Logs</CardTitle>
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
            <CardTitle>Material Inventory</CardTitle>
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
            <CardTitle>Subcategory Focus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-2xl border border-border/70 bg-background/75 p-3">Attendance and wage tracking for workforce planning</div>
            <div className="rounded-2xl border border-border/70 bg-background/75 p-3">Material replenishment watchlist for cement and steel</div>
            <div className="rounded-2xl border border-border/70 bg-background/75 p-3">Phase capture queue for foundation, structure, finishing, handover</div>
          </CardContent>
        </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
