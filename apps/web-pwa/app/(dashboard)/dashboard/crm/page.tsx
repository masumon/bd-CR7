"use client";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Target,
  MessageSquare,
  BarChart2,
  Phone,
} from "lucide-react";
import { ErpCard } from "@/components/ui/ErpCard";
import { ErpGrid } from "@/components/ui/ErpGrid";
import { ErpHeader } from "@/components/ui/ErpHeader";
import { ErpLayout } from "@/components/layout/ErpLayout";

export default function CRMPage() {
  const router = useRouter();
  const go = () => router.push("/dashboard/crm/view");
  return (
    <ErpLayout>
      <ErpHeader title="CRM" icon={Users} />
      <ErpGrid>
        <ErpCard icon={UserPlus} label="Add Customer"    onClick={go} />
        <ErpCard icon={Users}    label="Customers"       onClick={go} />
        <ErpCard icon={Target}   label="Leads"           onClick={go} />
        <ErpCard icon={Phone}    label="Follow-ups"      onClick={go} />
        <ErpCard icon={MessageSquare} label="Interactions" onClick={go} />
        <ErpCard icon={BarChart2} label="Reports"        onClick={go} />
      </ErpGrid>
    </ErpLayout>
  );
}
