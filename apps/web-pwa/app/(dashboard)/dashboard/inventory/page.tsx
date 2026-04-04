"use client";
import { useRouter } from "next/navigation";
import {
  Package,
  Plus,
  Barcode,
  Warehouse,
  ArrowLeftRight,
  BarChart2,
  Building2,
} from "lucide-react";
import { ErpCard } from "@/components/ui/ErpCard";
import { ErpGrid } from "@/components/ui/ErpGrid";
import { ErpHeader } from "@/components/ui/ErpHeader";
import { ErpLayout } from "@/components/layout/ErpLayout";

export default function InventoryPage() {
  const router = useRouter();
  const go = () => router.push("/dashboard/inventory/view");
  return (
    <ErpLayout>
      <ErpHeader title="Inventory Advanced" icon={Building2} />
      <ErpGrid>
        <ErpCard icon={Plus}           label="Add Product"   onClick={go} />
        <ErpCard icon={Package}        label="Products"       onClick={go} />
        <ErpCard icon={Barcode}        label="Barcode Lookup" onClick={go} />
        <ErpCard icon={Warehouse}      label="Warehouses"     onClick={go} />
        <ErpCard icon={ArrowLeftRight} label="Stock Adjust"   onClick={go} />
        <ErpCard icon={BarChart2}      label="Reports"        onClick={go} />
      </ErpGrid>
    </ErpLayout>
  );
}
