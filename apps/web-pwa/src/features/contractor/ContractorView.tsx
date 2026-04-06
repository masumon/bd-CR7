// MODULE LOCKED: FULL API MODE (NO SUPABASE WRITE)
"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Building2,
  FileText,
  Plus,
  Trash2,
  Wallet,
  X,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { WorkspaceHero } from "@/components/ui/workspace";
import { ExportPDFButton } from "@/components/ui/ExportPDFButton";
import { Button } from "@/components/ui/button";
import { ProjectFilesPanel } from "@/components/ui/ProjectFilesPanel";
import { apiClient } from "@/lib/apiClient";
import { exportCSV } from "@/lib/exportCSV";
import { exportHTML } from "@/lib/exportHTML";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type Contractor = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  nid: string | null;
  specialization: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

type ContractorContract = {
  id: string;
  contractor_id: string;
  project_name: string;
  contract_amount: number;
  paid_amount: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
  description: string | null;
  created_at: string;
  contractors?: { name: string } | null;
};

type ContractorPayment = {
  id: string;
  contractor_id: string;
  contract_id: string | null;
  amount: number;
  payment_date: string;
  method: string;
  notes: string | null;
  created_at: string;
  contractors?: { name: string } | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `৳${(n / 1_000).toFixed(1)}K`;
  return `৳${n.toLocaleString()}`;
}

const FIELD =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition";

const STATUS_CONTRACTOR: Record<string, string> = {
  Active: "bg-emerald-500",
  Inactive: "bg-amber-500",
  Blacklisted: "bg-rose-500",
};

const STATUS_CONTRACT: Record<string, string> = {
  Active: "bg-emerald-500",
  Completed: "bg-sky-500",
  Terminated: "bg-rose-500",
  "On Hold": "bg-amber-500",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusDot({ map, value }: { map: Record<string, string>; value: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${map[value] ?? "bg-muted"}`} />
      <span className="text-xs">{value}</span>
    </span>
  );
}

function DeleteConfirm({
  label,
  onConfirm,
  onCancel,
}: {
  label: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass w-full max-w-xs rounded-2xl border border-rose-500/30 p-6 shadow-xl">
        <p className="text-sm font-semibold text-foreground">Delete {label}?</p>
        <p className="mt-1 text-xs text-muted-foreground">
          This action cannot be undone. All related records will be removed.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-600"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted/50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Contractor Form ───────────────────────────────────────────────────────

function AddContractorForm({
  supabase,
  onSaved,
}: {
  supabase: ReturnType<typeof createClient>;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [nid, setNid] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [status, setStatus] = useState("Active");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const reset = () => {
    setName(""); setPhone(""); setEmail(""); setCompany("");
    setNid(""); setSpecialization(""); setStatus("Active"); setNotes("");
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let error: { message: string } | null = null;
    // OLD (DISABLED - SAFE)
    // const { error } = await supabase.from("contractors").insert({
    //   name: name.trim(),
    //   phone: phone.trim() || null,
    //   email: email.trim() || null,
    //   company: company.trim() || null,
    //   nid: nid.trim() || null,
    //   specialization: specialization.trim() || null,
    //   status,
    //   notes: notes.trim() || null,
    // });
    try {
      await apiClient<{ id?: string }>("/api/contractor/contractors", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          company: company.trim() || null,
          nid: nid.trim() || null,
          specialization: specialization.trim() || null,
          status,
          notes: notes.trim() || null,
        }),
      });
      console.log("API WRITE USED - SAFE MODE (MEDIUM MODULE)");
    } catch (err) {
      error = { message: err instanceof Error ? err.message : "Request failed" };
    }
    setSaving(false);
    if (error) { setMsg(error.message); return; }
    setMsg("ঠিকাদার সংরক্ষিত হয়েছে।");
    reset();
    onSaved();
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
      <input className={FIELD} required value={name} onChange={(e) => setName(e.target.value)} placeholder="ঠিকাদারের নাম / Contractor Name *" />
      <input className={FIELD} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="ফোন / Phone" type="tel" />
      <input className={FIELD} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ইমেইল / Email" type="email" />
      <input className={FIELD} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="কোম্পানি / Company" />
      <input className={FIELD} value={nid} onChange={(e) => setNid(e.target.value)} placeholder="NID / জাতীয় পরিচয়পত্র" />
      <input className={FIELD} value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="বিশেষত্ব / Specialization" />
      <select className={FIELD} title="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
        {["Active", "Inactive", "Blacklisted"].map((s) => <option key={s}>{s}</option>)}
      </select>
      <textarea className={`${FIELD} md:col-span-2 resize-none`} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="নোট / Notes (optional)" />
      <button
        type="submit"
        disabled={saving}
        className="md:col-span-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {saving ? "সংরক্ষণ হচ্ছে..." : "ঠিকাদার সংরক্ষণ করুন / Save Contractor"}
      </button>
      {msg && <p className="md:col-span-2 text-sm text-muted-foreground">{msg}</p>}
    </form>
  );
}

// ─── Add Contract Form ─────────────────────────────────────────────────────────

function AddContractForm({
  supabase,
  contractors,
  onSaved,
}: {
  supabase: ReturnType<typeof createClient>;
  contractors: Contractor[];
  onSaved: () => void;
}) {
  const [contractorId, setContractorId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [contractAmount, setContractAmount] = useState("0");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("Active");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!contractorId) { setMsg("ঠিকাদার নির্বাচন করুন।"); return; }
    setSaving(true);
    let error: { message: string } | null = null;
    // OLD (DISABLED - SAFE)
    // const { error } = await supabase.from("contractor_contracts").insert({
    //   contractor_id: contractorId,
    //   project_name: projectName.trim(),
    //   contract_amount: Number(contractAmount),
    //   start_date: startDate || null,
    //   end_date: endDate || null,
    //   status,
    //   description: description.trim() || null,
    // });
    try {
      await apiClient<{ id?: string }>("/api/contractor/contractor_contracts", {
        method: "POST",
        body: JSON.stringify({
          contractor_id: contractorId,
          project_name: projectName.trim(),
          contract_amount: Number(contractAmount),
          start_date: startDate || null,
          end_date: endDate || null,
          status,
          description: description.trim() || null,
        }),
      });
      console.log("API WRITE USED - SAFE MODE (MEDIUM MODULE)");
    } catch (err) {
      error = { message: err instanceof Error ? err.message : "Request failed" };
    }
    setSaving(false);
    if (error) { setMsg(error.message); return; }
    setMsg("চুক্তি সংরক্ষিত হয়েছে।");
    setProjectName(""); setContractAmount("0"); setStartDate(""); setEndDate(""); setDescription("");
    onSaved();
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
      <select className={`${FIELD} md:col-span-2`} title="Contractor" value={contractorId} onChange={(e) => setContractorId(e.target.value)} required>
        <option value="">— ঠিকাদার নির্বাচন করুন / Select Contractor —</option>
        {contractors.map((c) => <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ""}</option>)}
      </select>
      <input className={FIELD} required value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="প্রজেক্টের নাম / Project Name *" />
      <input className={FIELD} type="number" min="0" required value={contractAmount} onChange={(e) => setContractAmount(e.target.value)} placeholder="চুক্তির পরিমাণ / Contract Amount (৳) *" />
      <input className={FIELD} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="শুরুর তারিখ" title="Start Date" />
      <input className={FIELD} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="শেষের তারিখ" title="End Date" />
      <select className={FIELD} title="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
        {["Active", "Completed", "Terminated", "On Hold"].map((s) => <option key={s}>{s}</option>)}
      </select>
      <textarea className={`${FIELD} md:col-span-2 resize-none`} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="বিবরণ / Description (optional)" />
      <button
        type="submit"
        disabled={saving}
        className="md:col-span-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {saving ? "সংরক্ষণ হচ্ছে..." : "চুক্তি সংরক্ষণ করুন / Save Contract"}
      </button>
      {msg && <p className="md:col-span-2 text-sm text-muted-foreground">{msg}</p>}
    </form>
  );
}

// ─── Add Payment Form ──────────────────────────────────────────────────────────

function AddPaymentForm({
  supabase,
  contractors,
  contracts,
  onSaved,
}: {
  supabase: ReturnType<typeof createClient>;
  contractors: Contractor[];
  contracts: ContractorContract[];
  onSaved: () => void;
}) {
  const [contractorId, setContractorId] = useState("");
  const [contractId, setContractId] = useState("");
  const [amount, setAmount] = useState("0");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const filteredContracts = useMemo(
    () => contracts.filter((c) => !contractorId || c.contractor_id === contractorId),
    [contracts, contractorId]
  );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!contractorId) { setMsg("ঠিকাদার নির্বাচন করুন।"); return; }
    setSaving(true);

    let payErr: { message: string } | null = null;
    // OLD (DISABLED - SAFE)
    // const { error: payErr } = await supabase.from("contractor_payments").insert({
    //   contractor_id: contractorId,
    //   contract_id: contractId || null,
    //   amount: Number(amount),
    //   payment_date: paymentDate,
    //   method,
    //   notes: notes.trim() || null,
    // });
    try {
      await apiClient<{ id?: string }>("/api/contractor/contractor_payments", {
        method: "POST",
        body: JSON.stringify({
          contractor_id: contractorId,
          contract_id: contractId || null,
          amount: Number(amount),
          payment_date: paymentDate,
          method,
          notes: notes.trim() || null,
        }),
      });
      console.log("API WRITE USED - SAFE MODE (MEDIUM MODULE)");
    } catch (err) {
      payErr = { message: err instanceof Error ? err.message : "Request failed" };
    }
    if (payErr) { setSaving(false); setMsg(payErr.message); return; }

    // Update contract paid_amount — use increment via RPC if available, else read-then-write
    if (contractId) {
      const contract = contracts.find((c) => c.id === contractId);
      if (contract) {
        const nextPaidAmount = Number(contract.paid_amount) + Number(amount);
        let updateErr: { message: string } | null = null;
        // OLD (DISABLED - FINAL)
        // const { error: updateErr } = await supabase
        //   .from("contractor_contracts")
        //   .update({ paid_amount: Number(contract.paid_amount) + Number(amount) })
        //   .eq("id", contractId);
        try {
          await apiClient<{ id?: string; paid_amount?: string }>(`/api/contractor/payment/${contractId}`, {
            method: "PATCH",
            body: JSON.stringify({ paid_amount: nextPaidAmount }),
          });
          console.log("API WRITE USED - PHASE 2 COMPLETE");
        } catch (err) {
          updateErr = { message: err instanceof Error ? err.message : "Request failed" };
        }
        if (updateErr) {
          setSaving(false);
          setMsg(`পেমেন্ট সংরক্ষিত হয়েছে, কিন্তু চুক্তি আপডেট ব্যর্থ: ${updateErr.message}`);
          onSaved();
          return;
        }
      }
    }

    setSaving(false);
    setMsg("পেমেন্ট সংরক্ষিত হয়েছে।");
    setAmount("0"); setNotes(""); setContractId("");
    onSaved();
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
      <select className={`${FIELD} md:col-span-2`} title="Contractor" value={contractorId} onChange={(e) => { setContractorId(e.target.value); setContractId(""); }} required>
        <option value="">— ঠিকাদার নির্বাচন করুন / Select Contractor —</option>
        {contractors.map((c) => <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ""}</option>)}
      </select>
      <select className={`${FIELD} md:col-span-2`} title="Contract (optional)" value={contractId} onChange={(e) => setContractId(e.target.value)}>
        <option value="">— চুক্তি নির্বাচন করুন (ঐচ্ছিক) / Select Contract (optional) —</option>
        {filteredContracts.map((c) => <option key={c.id} value={c.id}>{c.project_name} — {fmt(c.contract_amount)}</option>)}
      </select>
      <input className={FIELD} type="number" min="0" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="পরিমাণ / Amount (৳) *" />
      <input className={FIELD} type="date" required value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} title="Payment Date" />
      <select className={FIELD} title="Payment Method" value={method} onChange={(e) => setMethod(e.target.value)}>
        {["Cash", "Bank Transfer", "Cheque", "bKash", "Nagad", "Other"].map((m) => <option key={m}>{m}</option>)}
      </select>
      <input className={FIELD} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="নোট / Notes (optional)" />
      <button
        type="submit"
        disabled={saving}
        className="md:col-span-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {saving ? "সংরক্ষণ হচ্ছে..." : "পেমেন্ট সংরক্ষণ করুন / Save Payment"}
      </button>
      {msg && <p className="md:col-span-2 text-sm text-muted-foreground">{msg}</p>}
    </form>
  );
}

// ─── Main ContractorView ───────────────────────────────────────────────────────

export function ContractorView() {
  const supabase = useMemo(() => createClient(), []);

  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [contracts, setContracts] = useState<ContractorContract[]>([]);
  const [payments, setPayments] = useState<ContractorPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Add Contractor");
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; label: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [ctrRes, contRes, payRes] = await Promise.all([
      supabase.from("contractors").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("contractor_contracts").select("*, contractors(name)").order("created_at", { ascending: false }).limit(100),
      supabase.from("contractor_payments").select("*, contractors(name)").order("payment_date", { ascending: false }).limit(100),
    ]);
    setContractors((ctrRes.data as Contractor[]) || []);
    setContracts((contRes.data as ContractorContract[]) || []);
    setPayments((payRes.data as ContractorPayment[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  const stats = useMemo(() => {
    const totalContractValue = contracts.reduce((s, c) => s + Number(c.contract_amount), 0);
    const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
    const activeCount = contractors.filter((c) => c.status === "Active").length;
    return { totalContractors: contractors.length, activeCount, totalContractValue, totalPaid };
  }, [contractors, contracts, payments]);

  const buildExportRows = useCallback(() => {
    return contracts.map((c) => ({
      project: c.project_name,
      contractor: c.contractors?.name ?? "",
      contractAmount: Number(c.contract_amount || 0),
      paidAmount: Number(c.paid_amount || 0),
      dueAmount: Number(c.contract_amount || 0) - Number(c.paid_amount || 0),
      status: c.status,
      startDate: c.start_date ?? "",
      endDate: c.end_date ?? "",
    }));
  }, [contracts]);

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    let error: { message: string } | null = null;
    if (type === "contractor") {
      // OLD (DISABLED - SAFE)
      // ({ error } = await supabase.from("contractors").delete().eq("id", id));
      try {
        await apiClient<{}>(`/api/contractor/contractors/${id}`, { method: "DELETE" });
        console.log("API WRITE USED - SAFE MODE (MEDIUM MODULE)");
      } catch (err) {
        error = { message: err instanceof Error ? err.message : "Request failed" };
      }
    } else if (type === "contract") {
      // OLD (DISABLED - SAFE)
      // ({ error } = await supabase.from("contractor_contracts").delete().eq("id", id));
      try {
        await apiClient<{}>(`/api/contractor/contractor_contracts/${id}`, { method: "DELETE" });
        console.log("API WRITE USED - SAFE MODE (MEDIUM MODULE)");
      } catch (err) {
        error = { message: err instanceof Error ? err.message : "Request failed" };
      }
    } else if (type === "payment") {
      // OLD (DISABLED - SAFE)
      // ({ error } = await supabase.from("contractor_payments").delete().eq("id", id));
      try {
        await apiClient<{}>(`/api/contractor/contractor_payments/${id}`, { method: "DELETE" });
        console.log("API WRITE USED - SAFE MODE (MEDIUM MODULE)");
      } catch (err) {
        error = { message: err instanceof Error ? err.message : "Request failed" };
      }
    }
    if (error) {
      setDeleteError(error.message);
      setDeleteTarget(null);
      return;
    }
    setDeleteTarget(null);
    void load();
  }, [deleteTarget, load]);

  const tabs = ["Add Contractor", "Contractors", "Add Contract", "Contracts", "Add Payment", "Payments", "Files"];

  return (
    <div className="space-y-4">
      {deleteTarget && (
        <DeleteConfirm
          label={deleteTarget.label}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {deleteError && (
        <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
          <span>{deleteError}</span>
          <button type="button" onClick={() => setDeleteError(null)} className="ml-3 shrink-0 text-rose-400 hover:text-rose-600">✕</button>
        </div>
      )}

      <WorkspaceHero
        badge="ঠিকাদার / Contractor"
        stats={[
          { label: "মোট ঠিকাদার", value: String(stats.totalContractors) },
          { label: "সক্রিয়", value: String(stats.activeCount) },
          { label: "মোট চুক্তি মূল্য", value: fmt(stats.totalContractValue) },
          { label: "মোট পেমেন্ট", value: fmt(stats.totalPaid) },
        ]}
      />

      <div className="flex justify-end">
        <div className="flex flex-wrap items-center gap-2">
          <ExportPDFButton
            onBuildOptions={() => ({
            moduleName: "Contractor",
            moduleNameBn: "ঠিকাদার ব্যবস্থাপনা",
            description: "Contractor register with contracts and payment records.",
            descriptionBn: "ঠিকাদার রেজিস্টার — চুক্তি ও পেমেন্ট রেকর্ড।",
            sections: [
              {
                title: "Contractor Overview",
                titleBn: "ঠিকাদার সারসংক্ষেপ",
                rows: [
                  { label: "Total Contractors", labelBn: "মোট ঠিকাদার", value: String(stats.totalContractors) },
                  { label: "Active Contractors", labelBn: "সক্রিয় ঠিকাদার", value: String(stats.activeCount) },
                  { label: "Total Contract Value", labelBn: "মোট চুক্তি মূল্য", value: fmt(stats.totalContractValue) },
                  { label: "Total Payments Made", labelBn: "মোট পেমেন্ট", value: fmt(stats.totalPaid) },
                ],
              },
              {
                title: "Contractor List",
                titleBn: "ঠিকাদার তালিকা",
                rows: [],
                tableHeaders: ["Name", "Company", "Phone", "Specialization", "Status"],
                tableHeadersBn: ["নাম", "কোম্পানি", "ফোন", "বিশেষত্ব", "অবস্থা"],
                tableRows: contractors.slice(0, 20).map((c) => [
                  c.name,
                  c.company ?? "—",
                  c.phone ?? "—",
                  c.specialization ?? "—",
                  c.status,
                ]),
              },
              {
                title: "Contract Register",
                titleBn: "চুক্তি রেজিস্টার",
                rows: [],
                tableHeaders: ["Project", "Contractor", "Amount", "Paid", "Status"],
                tableHeadersBn: ["প্রজেক্ট", "ঠিকাদার", "পরিমাণ", "পরিশোধিত", "অবস্থা"],
                tableRows: contracts.slice(0, 20).map((c) => [
                  c.project_name,
                  c.contractors?.name ?? "—",
                  fmt(c.contract_amount),
                  fmt(c.paid_amount),
                  c.status,
                ]),
              },
            ],
            })}
          />
          <Button
            variant="outline"
            onClick={() => {
              const rows = buildExportRows();
              exportCSV("contractor-contracts.csv", rows);
            }}
          >
            CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const rows = buildExportRows();
              exportHTML({ title: "Contractor Contracts", titleBn: "ঠিকাদার চুক্তি", rows });
            }}
          >
            HTML
          </Button>
        </div>
      </div>

      <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />

      {/* ── Add Contractor ── */}
      {activeTab === "Add Contractor" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Plus className="h-4 w-4 text-primary" />
              নতুন ঠিকাদার যোগ করুন / Add New Contractor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AddContractorForm supabase={supabase} onSaved={load} />
          </CardContent>
        </Card>
      )}

      {/* ── Contractor List ── */}
      {activeTab === "Contractors" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-primary" />
              ঠিকাদার তালিকা / Contractor List
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">লোড হচ্ছে...</p>
            ) : contractors.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">কোনো ঠিকাদার নেই। উপরের ফর্ম থেকে যোগ করুন।</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <Th>নাম</Th>
                      <Th>কোম্পানি</Th>
                      <Th>ফোন</Th>
                      <Th>বিশেষত্ব</Th>
                      <Th>অবস্থা</Th>
                      <Th></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {contractors.map((c) => (
                      <tr key={c.id}>
                        <Td className="font-medium">{c.name}</Td>
                        <Td className="text-xs text-muted-foreground">{c.company ?? "—"}</Td>
                        <Td className="text-xs">{c.phone ?? "—"}</Td>
                        <Td className="text-xs text-muted-foreground">{c.specialization ?? "—"}</Td>
                        <Td><StatusDot map={STATUS_CONTRACTOR} value={c.status} /></Td>
                        <Td>
                          <button
                            type="button"
                            title="Delete contractor"
                            onClick={() => setDeleteTarget({ type: "contractor", id: c.id, label: c.name })}
                            className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-500/10 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Add Contract ── */}
      {activeTab === "Add Contract" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Plus className="h-4 w-4 text-primary" />
              নতুন চুক্তি যোগ করুন / Add New Contract
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AddContractForm supabase={supabase} contractors={contractors} onSaved={load} />
          </CardContent>
        </Card>
      )}

      {/* ── Contract List ── */}
      {activeTab === "Contracts" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-primary" />
              চুক্তি তালিকা / Contract List
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">লোড হচ্ছে...</p>
            ) : contracts.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">কোনো চুক্তি নেই।</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <Th>প্রজেক্ট</Th>
                      <Th>ঠিকাদার</Th>
                      <Th>পরিমাণ</Th>
                      <Th>পরিশোধিত</Th>
                      <Th>বাকি</Th>
                      <Th>অবস্থা</Th>
                      <Th></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((c) => {
                      const remaining = Number(c.contract_amount) - Number(c.paid_amount);
                      return (
                        <tr key={c.id}>
                          <Td className="font-medium">{c.project_name}</Td>
                          <Td className="text-xs text-muted-foreground">{c.contractors?.name ?? "—"}</Td>
                          <Td className="text-xs">{fmt(c.contract_amount)}</Td>
                          <Td className="text-xs text-emerald-600">{fmt(c.paid_amount)}</Td>
                          <Td className={`text-xs font-semibold ${remaining > 0 ? "text-rose-500" : "text-emerald-600"}`}>
                            {fmt(remaining)}
                          </Td>
                          <Td><StatusDot map={STATUS_CONTRACT} value={c.status} /></Td>
                          <Td>
                            <button
                              type="button"
                              title="Delete contract"
                              onClick={() => setDeleteTarget({ type: "contract", id: c.id, label: c.project_name })}
                              className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-500/10 transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Add Payment ── */}
      {activeTab === "Add Payment" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Plus className="h-4 w-4 text-primary" />
              নতুন পেমেন্ট যোগ করুন / Add New Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AddPaymentForm supabase={supabase} contractors={contractors} contracts={contracts} onSaved={load} />
          </CardContent>
        </Card>
      )}

      {/* ── Payment List ── */}
      {activeTab === "Payments" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Wallet className="h-4 w-4 text-primary" />
              পেমেন্ট লেজার / Payment Ledger
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">লোড হচ্ছে...</p>
            ) : payments.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">কোনো পেমেন্ট নেই।</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <Th>ঠিকাদার</Th>
                      <Th>তারিখ</Th>
                      <Th>পরিমাণ</Th>
                      <Th>পদ্ধতি</Th>
                      <Th>নোট</Th>
                      <Th></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <Td className="font-medium">{p.contractors?.name ?? "—"}</Td>
                        <Td className="text-xs">{p.payment_date}</Td>
                        <Td className="text-xs font-semibold text-emerald-600">{fmt(p.amount)}</Td>
                        <Td className="text-xs text-muted-foreground">{p.method}</Td>
                        <Td className="text-xs text-muted-foreground">{p.notes ?? "—"}</Td>
                        <Td>
                          <button
                            type="button"
                            title="Delete payment"
                            onClick={() => setDeleteTarget({ type: "payment", id: p.id, label: `৳${p.amount} - ${p.payment_date}` })}
                            className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-500/10 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "Files" && (
        <ProjectFilesPanel
          module="contractor"
          category="contract"
          label="Contracts & Payment Proofs"
        />
      )}
    </div>
  );
}
