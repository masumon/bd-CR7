"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpenText, Download, FileText, ShieldCheck, Users } from "lucide-react";

import { ModulePageHeader } from "@/components/ui/ModulePageHeader";
import { useAuthStore } from "@/store/authStore";

type RoleKey = "admin" | "manager" | "accountant" | "supervisor" | "worker" | "viewer";

type RoleGuide = {
  label: string;
  labelBn: string;
  summary: string;
  tasks: string[];
  canView: string[];
};

const ROLE_GUIDE: Record<RoleKey, RoleGuide> = {
  admin: {
    label: "Admin",
    labelBn: "অ্যাডমিন",
    summary: "সিস্টেম কনফিগারেশন, ইউজার রোল, নিরাপত্তা এবং প্ল্যাটফর্ম মনিটরিং পরিচালনা করেন।",
    tasks: [
      "ইউজার রোল সেট/পরিবর্তন করা",
      "সিকিউরিটি ও অডিট লগ পর্যালোচনা করা",
      "সিস্টেম সেটিংস, নোটিফিকেশন ও ইন্টিগ্রেশন কনফিগার করা",
      "গুরুত্বপূর্ণ ডেটা রিসেট/রক্ষণাবেক্ষণ অনুমোদন করা"
    ],
    canView: ["Dashboard", "Settings", "Audit", "Reports", "Finance", "Projects", "Workforce", "Materials", "Evidence", "Contractor"],
  },
  manager: {
    label: "Manager",
    labelBn: "ম্যানেজার",
    summary: "প্রকল্প, বাজেট, রিসোর্স ও অপারেশনাল প্রগ্রেস তত্ত্বাবধান করেন।",
    tasks: [
      "প্রজেক্ট স্ট্যাটাস আপডেট ও মনিটরিং",
      "বাজেট বনাম ব্যয় ট্র্যাকিং",
      "দৈনিক কার্যক্রমের রিপোর্ট রিভিউ",
      "মডিউলভিত্তিক টিম সমন্বয়"
    ],
    canView: ["Dashboard", "Projects", "Finance", "Workforce", "Materials", "Reports", "Audit"],
  },
  accountant: {
    label: "Accountant",
    labelBn: "হিসাবরক্ষক",
    summary: "ফাইন্যান্স, অনুমোদন, রসিদ এবং আর্থিক রিপোর্টিং পরিচালনা করেন।",
    tasks: [
      "Expense ledger এন্ট্রি ও যাচাই",
      "Pending approval প্রসেস করা",
      "রসিদ/ভাউচার ট্র্যাকিং",
      "মাসিক/সাপ্তাহিক ফাইন্যান্স রিপোর্ট এক্সপোর্ট"
    ],
    canView: ["Dashboard", "Finance", "Reports", "Audit"],
  },
  supervisor: {
    label: "Supervisor",
    labelBn: "সুপারভাইজার",
    summary: "ফিল্ড লেভেলের শ্রমিক, উপকরণ ও অগ্রগতি তত্ত্বাবধান করেন।",
    tasks: [
      "ওয়ার্কফোর্স উপস্থিতি ও কার্যক্রম দেখা",
      "মেটেরিয়াল ইন/আউট ও ব্যবহার পর্যবেক্ষণ",
      "দৈনিক প্রগ্রেস ছবি/প্রমাণ আপলোড",
      "সাইট পর্যায়ের সমস্যা রিপোর্ট করা"
    ],
    canView: ["Dashboard", "Workforce", "Materials", "Evidence", "Projects"],
  },
  worker: {
    label: "Worker",
    labelBn: "কর্মী",
    summary: "নিজের কাজ, অ্যাটেনডেন্স এবং নির্দিষ্ট টাস্ক অনুসারে মডিউল ব্যবহার করেন।",
    tasks: [
      "নিজের অ্যাটেনডেন্স/লগ দেখা",
      "নির্ধারিত কাজের আপডেট দেওয়া",
      "প্রয়োজনে প্রমাণ/ফাইল জমা দেওয়া"
    ],
    canView: ["Dashboard", "Workforce", "Evidence"],
  },
  viewer: {
    label: "Viewer",
    labelBn: "ভিউয়ার",
    summary: "রিড-অনলি ব্যবহারকারী; গুরুত্বপূর্ণ তথ্য ও রিপোর্ট দেখতে পারবেন।",
    tasks: [
      "ড্যাশবোর্ডের সারসংক্ষেপ দেখা",
      "রিপোর্ট ও অডিট তথ্য রিড-অনলি দেখা",
      "প্রকল্পের স্ট্যাটাস পর্যবেক্ষণ"
    ],
    canView: ["Dashboard", "Reports", "Audit", "Projects"],
  },
};

const ORDER: RoleKey[] = ["admin", "manager", "accountant", "supervisor", "worker", "viewer"];

function normalizeRole(value: string | null | undefined): RoleKey {
  const role = (value || "").toLowerCase();
  if (role === "admin" || role === "manager" || role === "accountant" || role === "supervisor" || role === "worker" || role === "viewer") {
    return role;
  }
  return "viewer";
}

export default function DocsPage() {
  const currentRole = useAuthStore((s) => normalizeRole(s.role));
  const [selectedRole, setSelectedRole] = useState<RoleKey>(currentRole);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const guideRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSelectedRole(currentRole);
  }, [currentRole]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const guide = useMemo(() => ROLE_GUIDE[selectedRole], [selectedRole]);

  // `pagebreak` is a valid html2pdf.js runtime option but missing from the
  // bundled Html2PdfOptions interface — extend it locally.
  type PdfOptions = {
    margin?: number | [number, number, number, number];
    filename?: string;
    image?: { type?: "jpeg" | "png" | "webp"; quality?: number };
    enableLinks?: boolean;
    html2canvas?: object;
    jsPDF?: { unit?: string; format?: string; orientation?: "portrait" | "landscape" };
    pagebreak?: { mode?: string[]; before?: string[]; after?: string[]; avoid?: string[] };
  };

  const buildPdfPreview = async () => {
    if (!guideRef.current) return;
    setPdfBusy(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;

      const pdfOptions: PdfOptions = {
        margin: [12, 12, 12, 12],
        filename: `bd-cr7-role-guide-${selectedRole}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      };

      const blob = await html2pdf()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .set(pdfOptions as any)
        .from(guideRef.current)
        .toPdf()
        .outputPdf("blob");

      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(URL.createObjectURL(blob));
    } finally {
      setPdfBusy(false);
    }
  };

  const downloadPdf = async () => {
    if (!guideRef.current) return;
    const html2pdf = (await import("html2pdf.js")).default;
    const pdfOptions: PdfOptions = {
      margin: [12, 12, 12, 12],
      filename: `bd-cr7-role-guide-${selectedRole}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    };
    await html2pdf()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .set(pdfOptions as any)
      .from(guideRef.current)
      .save();
  };

  return (
    <div className="space-y-4">
      <ModulePageHeader
        icon={BookOpenText}
        title="API & Role Guide"
        titleBn="এপিআই ও রোল গাইড"
        theme="settings"
        stats={[
          { label: "Role", labelBn: "আপনার রোল", value: ROLE_GUIDE[currentRole].labelBn, color: "blue" },
          { label: "Modules", labelBn: "অনুমোদিত মডিউল", value: guide.canView.length, color: "green" },
          { label: "Guide", labelBn: "ভাষা", value: "বাংলা", color: "amber" },
          { label: "API Docs", labelBn: "লিংক", value: "/api/docs", color: "default" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={buildPdfPreview}
              disabled={pdfBusy}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/60 bg-muted/50 px-3 text-xs font-medium text-foreground transition hover:bg-muted disabled:opacity-60"
            >
              <FileText className="h-3.5 w-3.5" />
              {pdfBusy ? "PDF তৈরি হচ্ছে..." : "PDF Preview"}
            </button>
            <button
              type="button"
              onClick={downloadPdf}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/60 bg-muted/50 px-3 text-xs font-medium text-foreground transition hover:bg-muted"
            >
              <Download className="h-3.5 w-3.5" />
              PDF Download
            </button>
          </div>
        }
      />

      <div className="rounded-2xl border border-border/60 bg-card/70 p-3 backdrop-blur-sm">
        <p className="mb-2 text-xs font-medium text-muted-foreground">রোল নির্বাচন করুন (নিজের রোল অনুযায়ী কার্যক্রম দেখুন)</p>
        <div className="flex flex-wrap gap-2">
          {ORDER.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${selectedRole === role ? "border-primary bg-primary text-primary-foreground" : "border-border/70 bg-background/60 text-muted-foreground hover:text-foreground"}`}
            >
              {ROLE_GUIDE[role].labelBn}
            </button>
          ))}
        </div>
      </div>

      <div ref={guideRef} className="rounded-2xl border border-border/60 bg-card/80 p-4 md:p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">BD CR7 রোল ভিত্তিক ইউজার গাইড</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">রোল: {guide.labelBn} ({guide.label})</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Role Safe
          </span>
        </div>

        <div className="space-y-4 text-sm text-foreground">
          <section className="rounded-xl border border-border/60 bg-background/35 p-3">
            <h3 className="mb-1 text-sm font-semibold">১) ভূমিকা</h3>
            <p className="text-muted-foreground">{guide.summary}</p>
          </section>

          <section className="rounded-xl border border-border/60 bg-background/35 p-3">
            <h3 className="mb-2 text-sm font-semibold">২) প্রধান কার্যক্রম</h3>
            <ul className="space-y-1.5 text-muted-foreground">
              {guide.tasks.map((task) => (
                <li key={task} className="rounded-lg bg-background/45 px-2.5 py-1.5">• {task}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-border/60 bg-background/35 p-3">
            <h3 className="mb-2 text-sm font-semibold">৩) যেসব মডিউল দেখতে পারবেন</h3>
            <div className="flex flex-wrap gap-2">
              {guide.canView.map((module) => (
                <span key={module} className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {module}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border/60 bg-background/35 p-3">
            <h3 className="mb-2 text-sm font-semibold">৪) API Documentation ব্যবহার</h3>
            <p className="text-muted-foreground">API ডকুমেন্টেশন লিংক: /api/docs । এখানে থেকে রোল গাইড ও OpenAPI schema (/api/docs/openapi) পাওয়া যাবে।</p>
          </section>

          <section className="rounded-xl border border-border/60 bg-background/35 p-3">
            <h3 className="mb-2 text-sm font-semibold">৫) নিরাপত্তা নির্দেশনা</h3>
            <ul className="space-y-1.5 text-muted-foreground">
              <li className="rounded-lg bg-background/45 px-2.5 py-1.5">• নিজের role এর বাইরে কোন কাজ করার চেষ্টা করবেন না।</li>
              <li className="rounded-lg bg-background/45 px-2.5 py-1.5">• গুরুত্বপূর্ণ পরিবর্তনের আগে Audit module দেখে নিন।</li>
              <li className="rounded-lg bg-background/45 px-2.5 py-1.5">• ডিভাইস পরিবর্তন করলে অবশ্যই Logout করুন।</li>
            </ul>
          </section>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/70 p-3 md:p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Users className="h-4 w-4 text-primary" />
          In-App PDF Viewer
        </div>
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            title="Role guide PDF preview"
            className="h-[70vh] w-full rounded-xl border border-border/70 bg-background"
          />
        ) : (
          <p className="text-xs text-muted-foreground">PDF Preview বাটনে ক্লিক করলে এখানে অ্যাপের ভেতরেই PDF দেখা যাবে।</p>
        )}
      </div>
    </div>
  );
}
