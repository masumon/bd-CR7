"use client";
import { useRouter } from "next/navigation";
import { Users, UserPlus, Banknote, CalendarCheck, BarChart2, Settings } from "lucide-react";
import { ErpCard } from "@/components/ui/ErpCard";
import { ErpGrid } from "@/components/ui/ErpGrid";
import { ErpHeader } from "@/components/ui/ErpHeader";
import { ErpLayout } from "@/components/layout/ErpLayout";

export default function WorkforcePage() {
  const router = useRouter();
  return (
    <ErpLayout>
      <ErpHeader title="Workforce" icon={Users} />
      <ErpGrid>
        <ErpCard icon={Users} label="Workers" onClick={() => router.push("/dashboard/workforce/view")} />
        <ErpCard icon={UserPlus} label="Add Worker" onClick={() => router.push("/dashboard/workforce/view")} />
        <ErpCard icon={Banknote} label="Payroll" onClick={() => router.push("/dashboard/workforce/view")} />
        <ErpCard icon={CalendarCheck} label="Attendance" onClick={() => router.push("/dashboard/workforce/view")} />
        <ErpCard icon={BarChart2} label="Reports" onClick={() => router.push("/dashboard/workforce/view")} />
        <ErpCard icon={Settings} label="Settings" onClick={() => router.push("/dashboard/workforce/view")} />
      </ErpGrid>
    </ErpLayout>
  );
}
