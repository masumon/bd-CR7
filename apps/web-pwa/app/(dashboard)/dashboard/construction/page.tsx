"use client";
import { useRouter } from "next/navigation";
import { Building2, HardHat, Package, Clock, DollarSign, BarChart2 } from "lucide-react";
import { ErpCard } from "@/components/ui/ErpCard";
import { ErpGrid } from "@/components/ui/ErpGrid";
import { ErpHeader } from "@/components/ui/ErpHeader";
import { ErpLayout } from "@/components/layout/ErpLayout";

export default function ConstructionPage() {
  const router = useRouter();
  return (
    <ErpLayout>
      <ErpHeader title="Construction" icon={Building2} />
      <ErpGrid>
        <ErpCard icon={Building2} label="Projects" onClick={() => router.push("/dashboard/construction/projects")} />
        <ErpCard icon={HardHat} label="Workers" onClick={() => router.push("/dashboard/construction/list")} />
        <ErpCard icon={Package} label="Materials" onClick={() => router.push("/dashboard/construction/list")} />
        <ErpCard icon={Clock} label="Timeline" onClick={() => router.push("/dashboard/construction/list")} />
        <ErpCard icon={DollarSign} label="Budget" onClick={() => router.push("/dashboard/construction/list")} />
        <ErpCard icon={BarChart2} label="Reports" onClick={() => router.push("/dashboard/construction/list")} />
      </ErpGrid>
    </ErpLayout>
  );
}
