"use client";
import { useRouter } from "next/navigation";
import { PlusCircle, Receipt, CheckSquare, PieChart, Wallet, BarChart2 } from "lucide-react";
import { ErpCard } from "@/components/ui/ErpCard";
import { ErpGrid } from "@/components/ui/ErpGrid";
import { ErpHeader } from "@/components/ui/ErpHeader";
import { ErpLayout } from "@/components/layout/ErpLayout";

export default function FinancePage() {
  const router = useRouter();
  return (
    <ErpLayout>
      <ErpHeader title="Finance" icon={Wallet} />
      <ErpGrid>
        <ErpCard icon={PlusCircle} label="Add Expense" onClick={() => router.push("/dashboard/finance/view")} />
        <ErpCard icon={Receipt} label="Expenses" onClick={() => router.push("/dashboard/finance/view")} />
        <ErpCard icon={CheckSquare} label="Approvals" onClick={() => router.push("/dashboard/finance/view")} />
        <ErpCard icon={PieChart} label="Budget" onClick={() => router.push("/dashboard/finance/view")} />
        <ErpCard icon={Wallet} label="Fund" onClick={() => router.push("/dashboard/finance/view")} />
        <ErpCard icon={BarChart2} label="Reports" onClick={() => router.push("/dashboard/finance/view")} />
      </ErpGrid>
    </ErpLayout>
  );
}
