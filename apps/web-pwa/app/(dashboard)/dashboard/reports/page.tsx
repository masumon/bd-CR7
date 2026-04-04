"use client";
import { useRouter } from "next/navigation";
import { TrendingUp, Users, Package, Shield, FileDown, LineChart } from "lucide-react";
import { ErpCard } from "@/components/ui/ErpCard";
import { ErpGrid } from "@/components/ui/ErpGrid";
import { ErpHeader } from "@/components/ui/ErpHeader";
import { ErpLayout } from "@/components/layout/ErpLayout";

export default function ReportsPage() {
  const router = useRouter();
  return (
    <ErpLayout>
      <ErpHeader title="Reports" icon={LineChart} />
      <ErpGrid>
        <ErpCard icon={TrendingUp} label="Financial" onClick={() => router.push("/dashboard/reports/view")} />
        <ErpCard icon={Users} label="Workforce" onClick={() => router.push("/dashboard/reports/view")} />
        <ErpCard icon={Package} label="Materials" onClick={() => router.push("/dashboard/reports/view")} />
        <ErpCard icon={Shield} label="Audit Trail" onClick={() => router.push("/dashboard/reports/view")} />
        <ErpCard icon={FileDown} label="Export PDF" onClick={() => router.push("/dashboard/reports/view")} />
        <ErpCard icon={LineChart} label="Analytics" onClick={() => router.push("/dashboard/reports/view")} />
      </ErpGrid>
    </ErpLayout>
  );
}
