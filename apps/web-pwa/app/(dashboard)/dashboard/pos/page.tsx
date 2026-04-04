"use client";
import { useRouter } from "next/navigation";
import { ShoppingBag, Receipt, Tag, BarChart2, Landmark, Users } from "lucide-react";
import { ErpCard } from "@/components/ui/ErpCard";
import { ErpGrid } from "@/components/ui/ErpGrid";
import { ErpHeader } from "@/components/ui/ErpHeader";
import { ErpLayout } from "@/components/layout/ErpLayout";

export default function PosPage() {
  const router = useRouter();
  return (
    <ErpLayout>
      <ErpHeader title="POS" icon={ShoppingBag} />
      <ErpGrid>
        <ErpCard icon={ShoppingBag} label="New Sale" onClick={() => router.push("/dashboard/pos/sale")} />
        <ErpCard icon={Receipt} label="Today's Sales" onClick={() => router.push("/dashboard/pos/sale")} />
        <ErpCard icon={Tag} label="Products" onClick={() => router.push("/dashboard/pos/sale")} />
        <ErpCard icon={BarChart2} label="Reports" onClick={() => router.push("/dashboard/pos/sale")} />
        <ErpCard icon={Landmark} label="Cash Register" onClick={() => router.push("/dashboard/pos/sale")} />
        <ErpCard icon={Users} label="Customers" onClick={() => router.push("/dashboard/pos/sale")} />
      </ErpGrid>
    </ErpLayout>
  );
}
