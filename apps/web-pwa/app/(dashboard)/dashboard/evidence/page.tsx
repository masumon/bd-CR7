"use client";
import { useRouter } from "next/navigation";
import { PlusCircle, Camera, FileText, Clock, BarChart2, Archive } from "lucide-react";
import { ErpCard } from "@/components/ui/ErpCard";
import { ErpGrid } from "@/components/ui/ErpGrid";
import { ErpHeader } from "@/components/ui/ErpHeader";
import { ErpLayout } from "@/components/layout/ErpLayout";

export default function EvidencePage() {
  const router = useRouter();
  return (
    <ErpLayout>
      <ErpHeader title="Evidence" icon={Camera} />
      <ErpGrid>
        <ErpCard icon={PlusCircle} label="Add Evidence" onClick={() => router.push("/dashboard/evidence/list")} />
        <ErpCard icon={Camera} label="Photos" onClick={() => router.push("/dashboard/evidence/list")} />
        <ErpCard icon={FileText} label="Documents" onClick={() => router.push("/dashboard/evidence/list")} />
        <ErpCard icon={Clock} label="Timeline" onClick={() => router.push("/dashboard/evidence/list")} />
        <ErpCard icon={BarChart2} label="Reports" onClick={() => router.push("/dashboard/evidence/list")} />
        <ErpCard icon={Archive} label="Archive" onClick={() => router.push("/dashboard/evidence/list")} />
      </ErpGrid>
    </ErpLayout>
  );
}
