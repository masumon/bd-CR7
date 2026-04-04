"use client";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  FileText,
  Wallet,
  UserPlus,
  BarChart2,
  Settings,
} from "lucide-react";
import { ErpCard } from "@/components/ui/ErpCard";
import { ErpGrid } from "@/components/ui/ErpGrid";
import { ErpHeader } from "@/components/ui/ErpHeader";
import { ErpLayout } from "@/components/layout/ErpLayout";

export default function ContractorPage() {
  const router = useRouter();
  const go = (hash: string) =>
    router.push(`/dashboard/contractor/view#${hash}`);
  return (
    <ErpLayout>
      <ErpHeader title="Contractor" icon={Briefcase} />
      <ErpGrid>
        <ErpCard
          icon={UserPlus}
          label="Add Contractor"
          onClick={() => go("add-contractor")}
        />
        <ErpCard
          icon={Briefcase}
          label="Contractors"
          onClick={() => router.push("/dashboard/contractor/view")}
        />
        <ErpCard
          icon={FileText}
          label="Contracts"
          onClick={() => go("contracts")}
        />
        <ErpCard
          icon={Wallet}
          label="Payments"
          onClick={() => go("payments")}
        />
        <ErpCard
          icon={BarChart2}
          label="Reports"
          onClick={() => router.push("/dashboard/contractor/view")}
        />
        <ErpCard
          icon={Settings}
          label="Settings"
          onClick={() => router.push("/dashboard/contractor/view")}
        />
      </ErpGrid>
    </ErpLayout>
  );
}
