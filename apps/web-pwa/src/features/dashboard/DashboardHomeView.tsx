"use client";

import { Activity, DollarSign, Gauge, Wallet } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const series = [
  { name: "Jan", fund: 20000, expense: 8000 },
  { name: "Feb", fund: 26000, expense: 11000 },
  { name: "Mar", fund: 30000, expense: 13000 },
  { name: "Apr", fund: 35000, expense: 15000 },
  { name: "May", fund: 37000, expense: 17000 },
  { name: "Jun", fund: 40000, expense: 18500 },
];

const activities = [
  "Dual admin approved expense #EXP-2026-94",
  "POS sync completed for Mirpur showroom",
  "Construction worker attendance geofence verified",
  "Import L/C landed cost updated",
  "AI flagged unusual expense cluster",
];

export function DashboardHomeView() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Fund", value: "$400,000", icon: Wallet },
          { label: "Total Expense", value: "$212,500", icon: DollarSign },
          { label: "Balance", value: "$187,500", icon: Gauge },
          { label: "Project Completion", value: "68%", icon: Activity },
        ].map((item) => (
          <Card key={item.label} className="overflow-hidden">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-xs text-muted-foreground">{item.label}</CardTitle>
              <item.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-tight">{item.value}</p>
              <progress
                className="mt-3 h-2 w-full overflow-hidden rounded bg-muted [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary"
                max={100}
                value={item.label === "Project Completion" ? 68 : 82}
                aria-label={`${item.label} completion`}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Financial Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="fundFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="expFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Area dataKey="fund" stroke="#2563eb" fill="url(#fundFill)" />
                <Area dataKey="expense" stroke="#dc2626" fill="url(#expFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activities.map((item) => (
              <div key={item} className="relative pl-5 text-sm text-muted-foreground">
                <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-primary" />
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
