"use client";

import { AiPanel } from "@/components/modules/AiPanel";
import { AuthPanel } from "@/components/modules/AuthPanel";
import { ConstructionPanel } from "@/components/modules/ConstructionPanel";
import { DashboardPanel } from "@/components/modules/DashboardPanel";
import { FinancePanel } from "@/components/modules/FinancePanel";
import { ImportSupplyPanel } from "@/components/modules/ImportSupplyPanel";
import { PosPanel } from "@/components/modules/PosPanel";
import BDCR7Logo from "@/components/ui/BDCR7Logo";

export default function Page() {
  return (
    <main className="page">
      <section className="card hero">
        <div className="logo"><BDCR7Logo /></div>
        <h1>BD CR7 Enterprise SaaS</h1>
        <p>Integrated Finance, POS, Construction, Import Supply, and Sumonix AI.</p>
      </section>

      <div className="grid">
        <AuthPanel />
        <DashboardPanel />
        <FinancePanel />
        <PosPanel />
        <ConstructionPanel />
        <ImportSupplyPanel />
        <AiPanel />
      </div>
    </main>
  );
}
