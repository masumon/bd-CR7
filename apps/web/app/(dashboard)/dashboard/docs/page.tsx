"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpenText, Download, FileText, ShieldCheck, Users } from "lucide-react";

import { ModulePageHeader } from "@/components/ui/ModulePageHeader";
import { PdfFrame } from "@/components/ui/PdfFrame";
import { useAuthStore } from "@/store/authStore";

type RoleKey = "super_admin" | "admin" | "manager" | "accountant" | "supervisor" | "engineer" | "maker" | "checker" | "mason" | "worker" | "viewer";

type ModuleGuide = {
  name: string;
  nameBn: string;
  purpose: string;
  steps: string[];
};

type RoleGuide = {
  label: string;
  labelBn: string;
  summary: string;
  tasks: string[];
  canView: string[];
  caution: string;
};

const MODULE_GUIDE: ModuleGuide[] = [
  {
    name: "Dashboard",
    nameBn: "ড্যাশবোর্ড",
    purpose: "সামগ্রিক অবস্থা, কিউ, দ্রুত সতর্কতা এবং দিনের কাজের অগ্রাধিকার দেখতে ব্যবহার করুন।",
    steps: [
      "দিন শুরুতে Dashboard খুলে pending কাজ, approval, sync status এবং alert দেখুন।",
      "সংখ্যা বা কার্ডে ক্লিক করে সংশ্লিষ্ট module-এ যান।",
      "অফলাইন থাকলে sync badge দেখে পরে manual sync চালান।",
    ],
  },
  {
    name: "Projects",
    nameBn: "প্রকল্প",
    purpose: "প্রকল্প তৈরি, অবস্থা আপডেট, timeline event এবং attachment ব্যবস্থাপনা।",
    steps: [
      "নতুন project তৈরি করতে নাম, phase, budget, start/end date এবং status দিন।",
      "Project খোলার পর timeline-এ milestone বা field progress যোগ করুন।",
      "ছবি/ফাইল attachment দিলে Cloudinary upload শেষে তা project history-তে সংরক্ষিত হবে।",
    ],
  },
  {
    name: "Finance",
    nameBn: "ফাইন্যান্স",
    purpose: "fund entry, expense, approval এবং রিপোর্টিং ব্যবহারের কেন্দ্র।",
    steps: [
      "নতুন expense বা fund entry দেওয়ার আগে account নির্বাচন করুন।",
      "রসিদ/ভাউচার upload থাকলে approval process দ্রুত হয়।",
      "Checker/Admin role pending approval queue নিয়মিত পর্যালোচনা করুন।",
    ],
  },
  {
    name: "Workforce",
    nameBn: "ওয়ার্কফোর্স",
    purpose: "attendance, worker log, wage tracking এবং field team monitoring।",
    steps: [
      "Worker log তৈরি করার সময় worker, date, location এবং কাজের ধরন ঠিকভাবে দিন।",
      "Attendance offline queue-তে গেলে internet ফেরার পর auto sync হবে।",
      "Supervisor role দৈনিক log verify করে mismatch থাকলে report করুন।",
    ],
  },
  {
    name: "Materials",
    nameBn: "মেটেরিয়ালস",
    purpose: "site supply, movement, stock visibility এবং usage tracking।",
    steps: [
      "Material in/out entry-তে quantity এবং source/destination সঠিক দিন।",
      "Stock কমে গেলে report বা requisition flow শুরু করুন।",
      "Site-level movement update ছাড়া রিপোর্টে stock mismatch দেখা যাবে।",
    ],
  },
  {
    name: "Evidence",
    nameBn: "এভিডেন্স",
    purpose: "ছবি, ফাইল, inspection proof এবং compliance record সংরক্ষণ।",
    steps: [
      "ছবি বা ডকুমেন্ট upload করার আগে সঠিক project বা কাজের context বেছে নিন।",
      "Caption-এ কী প্রমাণ করছে তা সংক্ষেপে লিখুন।",
      "বিতর্ক বা approval case-এ audit trail-এর সাথে evidence মিলিয়ে দেখুন।",
    ],
  },
  {
    name: "Contractor",
    nameBn: "কন্ট্রাক্টর",
    purpose: "contractor profile, কাজের অবস্থা, payment context এবং document tracking।",
    steps: [
      "নতুন contractor entry-তে যোগাযোগ, কাজের ধরণ এবং relevant notes যোগ করুন।",
      "চলমান contractor কাজের অবস্থা নিয়মিত update করুন।",
      "Finance-এর payment review-এর আগে contractor record মিলিয়ে নিন।",
    ],
  },
  {
    name: "Audit",
    nameBn: "অডিট",
    purpose: "কে কখন কী পরিবর্তন করেছে তা যাচাই এবং incident trace করা।",
    steps: [
      "কোনো ডেটা mismatch দেখলে আগে Audit log-এ related action খুঁজুন।",
      "Checker/Admin/Super Admin role sensitive change review করবেন।",
      "Unexpected access বা update পেলে security review শুরু করুন।",
    ],
  },
  {
    name: "Reports",
    nameBn: "রিপোর্টস",
    purpose: "module summary, export, oversight এবং management reporting।",
    steps: [
      "Weekly বা monthly রিপোর্ট export-এর আগে relevant module data refresh করুন।",
      "Role অনুযায়ী visible reports-এ কাজ করুন; missing data থাকলে source module ঠিক করুন।",
      "Audit বা Finance review-এর সময় report snapshot সংরক্ষণ করুন।",
    ],
  },
  {
    name: "Settings",
    nameBn: "সেটিংস",
    purpose: "language, sync control, backup, security toggle এবং preferences।",
    steps: [
      "Language, theme, sync preference এবং app lock security এখানে নিয়ন্ত্রণ করুন।",
      "Backup/restore শুধু অনুমোদিত role দিয়ে চালান।",
      "Biometric/App lock চালু করলে current device-এ enrollment নিশ্চিত করুন।",
    ],
  },
  {
    name: "Guide",
    nameBn: "ইউজার গাইড",
    purpose: "role-based module usage, নিরাপত্তা নিয়ম এবং PDF export guide।",
    steps: [
      "নিজের role বেছে নিয়ে allowed modules ও task list দেখুন।",
      "PDF Preview/Download দিয়ে offline reference তৈরি করুন।",
      "নতুন user onboarding-এর সময় এই page থেকেই role-wise training দিন।",
    ],
  },
];

const ROLE_GUIDE: Record<RoleKey, RoleGuide> = {
  super_admin: {
    label: "Super Admin",
    labelBn: "সুপার অ্যাডমিন",
    summary: "পুরো প্ল্যাটফর্মের সর্বোচ্চ দায়িত্বশীল ব্যবহারকারী; access control, incident response, critical configuration এবং high-risk approval তদারকি করেন।",
    tasks: [
      "সব role ও privilege policy তদারকি করা",
      "critical audit, backup/restore এবং security review চালানো",
      "production issue, user escalation এবং platform governance অনুমোদন করা",
      "integration, system policy এবং sensitive settings final review করা"
    ],
    canView: ["Dashboard", "Docs", "Projects", "Workforce", "Materials", "Evidence", "Audit", "AI", "Finance", "Contractor", "Reports", "Settings"],
    caution: "Super Admin account দৈনন্দিন data entry-র জন্য ব্যবহার করবেন না; governance ও recovery কাজেই সীমিত রাখুন.",
  },
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
    canView: ["Dashboard", "Docs", "Settings", "Audit", "Reports", "Finance", "Projects", "Workforce", "Materials", "Evidence", "Contractor"],
    caution: "Admin role দিয়ে user/setting পরিবর্তনের আগে audit effect বুঝে নিন।",
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
    canView: ["Dashboard", "Docs", "Projects", "Finance", "Workforce", "Materials", "Reports", "Audit", "Settings", "Contractor"],
    caution: "Manager role operational decision নেয়, কিন্তু low-level security বা role mapping পরিবর্তন করা উচিত নয়।",
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
    canView: ["Dashboard", "Docs", "Finance", "Reports", "Audit", "Settings"],
    caution: "Approval-এর আগে evidence, receipt এবং project context cross-check করুন।",
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
    canView: ["Dashboard", "Docs", "Workforce", "Materials", "Evidence", "Projects", "Finance", "Audit", "Reports", "Settings", "Contractor", "AI"],
    caution: "Field update real-time না দিলে reports এবং approvals-এ mismatch তৈরি হবে।",
  },
  engineer: {
    label: "Engineer",
    labelBn: "ইঞ্জিনিয়ার",
    summary: "technical progress, site issue, project execution detail এবং evidence quality নিশ্চিত করেন।",
    tasks: [
      "project progress ও phase readiness যাচাই করা",
      "technical issue, measurement বা site constraint report করা",
      "evidence ও field update engineering context-এ validate করা",
      "workforce/material status project execution-এর সাথে মিলিয়ে দেখা"
    ],
    canView: ["Dashboard", "Docs", "Projects", "Workforce", "Materials", "Evidence", "AI", "Finance", "Contractor", "Reports", "Settings"],
    caution: "Engineering note বা evidence caption-এ technical ambiguity রাখবেন না।",
  },
  maker: {
    label: "Maker",
    labelBn: "মেকার",
    summary: "নতুন data entry, first-pass transaction creation এবং operational record শুরু করেন।",
    tasks: [
      "expense, project, contractor বা material entry তৈরি করা",
      "attendance/log বা workflow initiation করা",
      "প্রয়োজনীয় receipt, attachment বা evidence সংযুক্ত করা",
      "checker-এর review-এর জন্য clean record প্রস্তুত করা"
    ],
    canView: ["Dashboard", "Docs", "Projects", "Workforce", "Materials", "Evidence", "AI", "Finance", "Contractor", "Reports", "Settings"],
    caution: "Maker role দিয়ে final approval ধরে নেবেন না; review queue follow করুন।",
  },
  checker: {
    label: "Checker",
    labelBn: "চেকার",
    summary: "maker-এর entry যাচাই, audit review এবং approval discipline বজায় রাখেন।",
    tasks: [
      "pending transaction, project update বা expense review করা",
      "evidence ও supporting data মিলিয়ে approval decision নেওয়া",
      "audit visibility ব্যবহার করে সন্দেহজনক পরিবর্তন শনাক্ত করা",
      "অসম্পূর্ণ entry reject বা correction request পাঠানো"
    ],
    canView: ["Dashboard", "Docs", "Projects", "Workforce", "Materials", "Evidence", "Audit", "AI", "Finance", "Contractor", "Reports", "Settings"],
    caution: "Checker role approval দেয়; evidence বা business rule ছাড়া approve করবেন না।",
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
    canView: ["Dashboard", "Docs", "Construction", "Workforce", "Materials", "Evidence", "Finance", "Projects", "Settings"],
    caution: "নিজের কাজের বাইরে record edit বা অন্যের data পরিবর্তন করার চেষ্টা করবেন না।",
  },
  mason: {
    label: "Mason",
    labelBn: "রাজমিস্ত্রি",
    summary: "সাইটের বাস্তব কাজ, attendance, material usage context এবং assigned construction task follow করেন।",
    tasks: [
      "নিজের assigned construction কাজ ও attendance দেখা",
      "প্রয়োজনে evidence বা progress proof জমা দেওয়া",
      "material issue বা site problem supervisor-কে জানানো"
    ],
    canView: ["Dashboard", "Docs", "Construction", "Workforce", "Materials", "Evidence", "Finance", "Projects", "Settings"],
    caution: "Mason role field execution-এর জন্য; অন্যের record change বা approval decision নেবেন না।",
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
    canView: ["Dashboard", "Docs", "Construction", "Workforce", "Materials", "Evidence", "Finance", "Contractor", "Projects", "Reports", "Settings"],
    caution: "Viewer role read-only; কোনো mismatch দেখলে responsible role-এ escalate করুন।",
  },
};

const ORDER: RoleKey[] = ["super_admin", "admin", "manager", "accountant", "supervisor", "engineer", "maker", "checker", "mason", "worker", "viewer"];

function normalizeRole(value: string | null | undefined): RoleKey {
  const role = (value || "").toLowerCase();
  if (role === "super_admin" || role === "admin" || role === "manager" || role === "accountant" || role === "supervisor" || role === "engineer" || role === "maker" || role === "checker" || role === "mason" || role === "worker" || role === "viewer") {
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

  useEffect(() => {
    setPdfUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
  }, [selectedRole]);

  const guide = useMemo(() => ROLE_GUIDE[selectedRole], [selectedRole]);

  const buildPdfPreview = async () => {
    if (!guideRef.current) return;
    setPdfBusy(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;

      // TypeScript only excess-property-checks fresh object literals, not
      // variables. Declaring opts without an explicit type annotation lets us
      // include the runtime-valid `pagebreak` option without any cast or lint
      // suppression, while still satisfying the set() parameter type check.
      const opts = {
        margin: [12, 12, 12, 12] as [number, number, number, number],
        filename: `bd-cr7-role-guide-${selectedRole}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
        pagebreak: { mode: ["css", "legacy"] },
      };

      const blob = await html2pdf()
        .set(opts)
        .from(guideRef.current)
        .toPdf()
        .outputPdf("blob");

      const pdfBlob = blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
      setPdfUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return URL.createObjectURL(pdfBlob);
      });
    } finally {
      setPdfBusy(false);
    }
  };

  const downloadPdf = async () => {
    if (!guideRef.current) return;
    const html2pdf = (await import("html2pdf.js")).default;

    const opts = {
      margin: [12, 12, 12, 12] as [number, number, number, number],
      filename: `bd-cr7-role-guide-${selectedRole}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      pagebreak: { mode: ["css", "legacy"] },
    };

    await html2pdf()
      .set(opts)
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
          { label: "Role Set", labelBn: "গাইডেড রোল", value: ORDER.length, color: "amber" },
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
            <h3 className="mb-2 text-sm font-semibold">৪) Role অনুযায়ী সতর্কতা</h3>
            <p className="text-muted-foreground">{guide.caution}</p>
          </section>

          <section className="rounded-xl border border-border/60 bg-background/35 p-3">
            <h3 className="mb-2 text-sm font-semibold">৫) মডিউল ব্যবহারের নিয়ম</h3>
            <div className="space-y-3">
              {MODULE_GUIDE.map((module) => (
                <div key={module.name} className="rounded-xl border border-border/50 bg-background/45 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground">{module.nameBn}</h4>
                    <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{module.name}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{module.purpose}</p>
                  <ul className="mt-2 space-y-1.5 text-muted-foreground">
                    {module.steps.map((step) => (
                      <li key={step} className="rounded-lg bg-background/45 px-2.5 py-1.5">• {step}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border/60 bg-background/35 p-3">
            <h3 className="mb-2 text-sm font-semibold">৬) API Documentation ব্যবহার</h3>
            <p className="text-muted-foreground">API ডকুমেন্টেশন লিংক: /api/docs । এখানে role guide এবং OpenAPI schema (/api/docs/openapi) পাওয়া যাবে। Integration review বা backend troubleshooting-এ এটি ব্যবহার করুন।</p>
          </section>

          <section className="rounded-xl border border-border/60 bg-background/35 p-3">
            <h3 className="mb-2 text-sm font-semibold">৭) নিরাপত্তা নির্দেশনা</h3>
            <ul className="space-y-1.5 text-muted-foreground">
              <li className="rounded-lg bg-background/45 px-2.5 py-1.5">• নিজের role এর বাইরে কোন কাজ করার চেষ্টা করবেন না।</li>
              <li className="rounded-lg bg-background/45 px-2.5 py-1.5">• গুরুত্বপূর্ণ পরিবর্তনের আগে Audit module দেখে নিন।</li>
              <li className="rounded-lg bg-background/45 px-2.5 py-1.5">• Offline queue থাকলে online ফিরে sync status নিশ্চিত করুন।</li>
              <li className="rounded-lg bg-background/45 px-2.5 py-1.5">• ডিভাইস পরিবর্তন করলে অবশ্যই Logout করুন।</li>
              <li className="rounded-lg bg-background/45 px-2.5 py-1.5">• Biometric বা Passkey চালু করলে প্রথমে password login দিয়ে enrollment সম্পন্ন করুন।</li>
              <li className="rounded-lg bg-background/45 px-2.5 py-1.5">• iPhone Safari-তে iCloud Keychain, Android Chrome-এ Google Password Manager, Samsung Internet-এ Samsung Pass enabled থাকলে passkey flow সবচেয়ে স্থিতিশীল হবে।</li>
              <li className="rounded-lg bg-background/45 px-2.5 py-1.5">• Third-party password manager ব্যবহার করলে browser/app-level passkey support আগে চালু আছে কি না নিশ্চিত করুন; unsupported manager হলে password login fallback ব্যবহার করুন।</li>
            </ul>
          </section>

          <section className="rounded-xl border border-border/60 bg-background/35 p-3">
            <h3 className="mb-2 text-sm font-semibold">৮) Biometric / Passkey Smoke Test</h3>
            <ul className="space-y-1.5 text-muted-foreground">
              <li className="rounded-lg bg-background/45 px-2.5 py-1.5">• iPhone: Safari খুলে password দিয়ে login করুন, তারপর biometric enable করুন, logout করে email লিখে Passkey বা biometric unlock test করুন।</li>
              <li className="rounded-lg bg-background/45 px-2.5 py-1.5">• Android Chrome: screen lock + Google Password Manager active রেখে একই flow repeat করুন।</li>
              <li className="rounded-lg bg-background/45 px-2.5 py-1.5">• Samsung Internet: Samsung Pass active থাকলে login, enroll, logout, passkey sign-in এবং app lock unlock আলাদা করে test করুন।</li>
              <li className="rounded-lg bg-background/45 px-2.5 py-1.5">• কোনো browser-এ passkey prompt না এলে email + password fallback কাজ করছে কি না confirm করুন; সেটাই supported recovery path।</li>
            </ul>
          </section>

          <section className="rounded-xl border border-border/60 bg-background/35 p-3">
            <h3 className="mb-2 text-sm font-semibold">৯) SQL / Deployment Note</h3>
            <ul className="space-y-1.5 text-muted-foreground">
              <li className="rounded-lg bg-background/45 px-2.5 py-1.5">• নতুন environment-এ deploy করলে `supabase/migrations/100_arch2_160_extend_user_roles.sql` run করতে হবে, কারণ এতে `manager` এবং `accountant` role add করা হয়েছে।</li>
              <li className="rounded-lg bg-background/45 px-2.5 py-1.5">• এই বর্তমান production database-এ migration already apply করা হয়েছে; same environment-এ আবার manually run করার দরকার নেই।</li>
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
          <div className="space-y-2">
            <PdfFrame
              url={pdfUrl}
              title="Role guide PDF preview"
              className="h-[70vh] w-full rounded-xl border border-border/70 bg-background"
            />
            <p className="text-xs text-muted-foreground">Role পরিবর্তন করলে নতুন preview generate করতে আবার `PDF Preview` চাপুন।</p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">PDF Preview বাটনে ক্লিক করলে এখানে অ্যাপের ভেতরেই PDF দেখা যাবে।</p>
        )}
      </div>
    </div>
  );
}
