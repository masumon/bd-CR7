"use client";
import { useRouter } from "next/navigation";
import { FileText, FilePlus, FolderOpen, CreditCard, BarChart2, Navigation } from "lucide-react";
import { ErpCard } from "@/components/ui/ErpCard";
import { ErpGrid } from "@/components/ui/ErpGrid";
import { ErpHeader } from "@/components/ui/ErpHeader";
import { ErpLayout } from "@/components/layout/ErpLayout";

export default function ImportPage() {
  const router = useRouter();
  return (
    <ErpLayout>
      <ErpHeader title="Import / LC" icon={FileText} />
      <ErpGrid>
        <ErpCard icon={FileText} label="LC Records" onClick={() => router.push("/dashboard/import/records")} />
        <ErpCard icon={FilePlus} label="New LC" onClick={() => router.push("/dashboard/import/records")} />
        <ErpCard icon={FolderOpen} label="Documents" onClick={() => router.push("/dashboard/import/records")} />
        <ErpCard icon={CreditCard} label="Payments" onClick={() => router.push("/dashboard/import/records")} />
        <ErpCard icon={BarChart2} label="Reports" onClick={() => router.push("/dashboard/import/records")} />
        <ErpCard icon={Navigation} label="Tracking" onClick={() => router.push("/dashboard/import/records")} />
      </ErpGrid>
    </ErpLayout>
  );
}
