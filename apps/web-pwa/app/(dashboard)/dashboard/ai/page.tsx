"use client";
import { useRouter } from "next/navigation";
import { MessageSquare, LayoutDashboard, AlertTriangle, BrainCircuit, BarChart2, Settings } from "lucide-react";
import { ErpCard } from "@/components/ui/ErpCard";
import { ErpGrid } from "@/components/ui/ErpGrid";
import { ErpHeader } from "@/components/ui/ErpHeader";
import { ErpLayout } from "@/components/layout/ErpLayout";

export default function DashboardAiPage() {
  const router = useRouter();
  return (
    <ErpLayout>
      <ErpHeader title="SUMONIX AI" icon={BrainCircuit} />
      <ErpGrid>
        <ErpCard icon={MessageSquare} label="Chat AI" onClick={() => router.push("/dashboard/ai/chat")} />
        <ErpCard icon={LayoutDashboard} label="Dashboard Summary" onClick={() => router.push("/dashboard/ai/chat")} />
        <ErpCard icon={AlertTriangle} label="Anomalies" onClick={() => router.push("/dashboard/ai/chat")} />
        <ErpCard icon={BrainCircuit} label="Analysis" onClick={() => router.push("/dashboard/ai/chat")} />
        <ErpCard icon={BarChart2} label="Reports" onClick={() => router.push("/dashboard/ai/chat")} />
        <ErpCard icon={Settings} label="Settings" onClick={() => router.push("/dashboard/ai/chat")} />
      </ErpGrid>
    </ErpLayout>
  );
}