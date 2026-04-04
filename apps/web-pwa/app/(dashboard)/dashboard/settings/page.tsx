"use client";
import { useRouter } from "next/navigation";
import { User, LayoutGrid, Lock, Bell, Database, Palette } from "lucide-react";
import { ErpCard } from "@/components/ui/ErpCard";
import { ErpGrid } from "@/components/ui/ErpGrid";
import { ErpHeader } from "@/components/ui/ErpHeader";
import { ErpLayout } from "@/components/layout/ErpLayout";

export default function SettingsPage() {
  const router = useRouter();
  return (
    <ErpLayout>
      <ErpHeader title="Settings" icon={LayoutGrid} />
      <ErpGrid>
        <ErpCard icon={User} label="Profile" onClick={() => router.push("/dashboard/settings/manage")} />
        <ErpCard icon={LayoutGrid} label="Modules" onClick={() => router.push("/dashboard/settings/manage")} />
        <ErpCard icon={Lock} label="Security" onClick={() => router.push("/dashboard/settings/manage")} />
        <ErpCard icon={Bell} label="Notifications" onClick={() => router.push("/dashboard/settings/manage")} />
        <ErpCard icon={Database} label="Data" onClick={() => router.push("/dashboard/settings/manage")} />
        <ErpCard icon={Palette} label="Theme" onClick={() => router.push("/dashboard/settings/manage")} />
      </ErpGrid>
    </ErpLayout>
  );
}
