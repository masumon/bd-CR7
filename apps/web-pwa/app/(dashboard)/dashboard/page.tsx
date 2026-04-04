"use client";
import { useRouter } from "next/navigation";
import { DollarSign, Users, Package, Building2, BarChart2, Camera, Shield, BrainCircuit, ShoppingBag, FileText, Settings } from "lucide-react";
import { ErpCard } from "@/components/ui/ErpCard";
import { ErpGrid } from "@/components/ui/ErpGrid";
import { ErpHeader } from "@/components/ui/ErpHeader";
import { ErpLayout } from "@/components/layout/ErpLayout";

export default function DashboardPage() {
  const router = useRouter();
  return (
    <ErpLayout>
      <ErpHeader title="BD CR7 ERP" />
      <ErpGrid>
        <ErpCard icon={DollarSign} label="Finance" onClick={() => router.push("/dashboard/finance")} />
        <ErpCard icon={Users} label="Workforce" onClick={() => router.push("/dashboard/workforce")} />
        <ErpCard icon={Package} label="Materials" onClick={() => router.push("/dashboard/materials")} />
        <ErpCard icon={Building2} label="Projects" onClick={() => router.push("/dashboard/construction")} />
        <ErpCard icon={BarChart2} label="Reports" onClick={() => router.push("/dashboard/reports")} />
        <ErpCard icon={Camera} label="Evidence" onClick={() => router.push("/dashboard/evidence")} />
        <ErpCard icon={Shield} label="Audit" onClick={() => router.push("/dashboard/audit")} />
        <ErpCard icon={BrainCircuit} label="SUMONIX AI" onClick={() => router.push("/dashboard/ai")} />
        <ErpCard icon={ShoppingBag} label="POS" onClick={() => router.push("/dashboard/pos")} />
        <ErpCard icon={FileText} label="Import/LC" onClick={() => router.push("/dashboard/import")} />
        <ErpCard icon={Settings} label="Settings" onClick={() => router.push("/dashboard/settings")} />
      </ErpGrid>
    </ErpLayout>
  );
}
