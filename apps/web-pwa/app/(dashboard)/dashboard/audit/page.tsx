"use client";
import { useRouter } from "next/navigation";
import { Activity, CheckSquare, AlertTriangle, Shield, FileDown, Settings } from "lucide-react";
import { ErpCard } from "@/components/ui/ErpCard";
import { ErpGrid } from "@/components/ui/ErpGrid";
import { ErpHeader } from "@/components/ui/ErpHeader";
import { ErpLayout } from "@/components/layout/ErpLayout";

export default function AuditPage() {
  const router = useRouter();
  return (
    <ErpLayout>
      <ErpHeader title="Audit" icon={Shield} />
      <ErpGrid>
        <ErpCard icon={Activity} label="Activity Log" onClick={() => router.push("/dashboard/audit/log")} />
        <ErpCard icon={CheckSquare} label="Approvals" onClick={() => router.push("/dashboard/audit/log")} />
        <ErpCard icon={AlertTriangle} label="Anomalies" onClick={() => router.push("/dashboard/audit/log")} />
        <ErpCard icon={Shield} label="Risk Report" onClick={() => router.push("/dashboard/audit/log")} />
        <ErpCard icon={FileDown} label="Export" onClick={() => router.push("/dashboard/audit/log")} />
        <ErpCard icon={Settings} label="Settings" onClick={() => router.push("/dashboard/audit/log")} />
      </ErpGrid>
    </ErpLayout>
  );
}
