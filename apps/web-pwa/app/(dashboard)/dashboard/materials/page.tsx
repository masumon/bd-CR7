"use client";
import { useRouter } from "next/navigation";
import { Package, PackagePlus, ShoppingCart, Truck, BarChart2, ClipboardList } from "lucide-react";
import { ErpCard } from "@/components/ui/ErpCard";
import { ErpGrid } from "@/components/ui/ErpGrid";
import { ErpHeader } from "@/components/ui/ErpHeader";
import { ErpLayout } from "@/components/layout/ErpLayout";

export default function MaterialsPage() {
  const router = useRouter();
  return (
    <ErpLayout>
      <ErpHeader title="Materials" icon={Package} />
      <ErpGrid>
        <ErpCard icon={Package} label="Inventory" onClick={() => router.push("/dashboard/materials/view")} />
        <ErpCard icon={PackagePlus} label="Add Item" onClick={() => router.push("/dashboard/materials/view")} />
        <ErpCard icon={ShoppingCart} label="Orders" onClick={() => router.push("/dashboard/materials/view")} />
        <ErpCard icon={Truck} label="Suppliers" onClick={() => router.push("/dashboard/materials/view")} />
        <ErpCard icon={BarChart2} label="Reports" onClick={() => router.push("/dashboard/materials/view")} />
        <ErpCard icon={ClipboardList} label="Requests" onClick={() => router.push("/dashboard/materials/view")} />
      </ErpGrid>
    </ErpLayout>
  );
}
