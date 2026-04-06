/**
 * exportPDF.ts
 * A4 PDF export with Bengali font support.
 * Generates and downloads PDF directly (no print dialog).
 */

export type ExportRow = { label: string; labelBn: string; value: string };

export interface ExportSection {
  title: string;
  titleBn: string;
  rows: ExportRow[];
  tableHeaders?: string[];
  tableHeadersBn?: string[];
  tableRows?: string[][];
}

export interface ExportPDFOptions {
  moduleName: string;
  moduleNameBn: string;
  description: string;
  descriptionBn: string;
  sections: ExportSection[];
  exportedBy?: string;
  period?: string;
}

/* ── BD CR7 logo as inline SVG data-URI ── */
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="48" height="48">
  <circle cx="256" cy="256" r="256" fill="#1A2744"/>
  <circle cx="256" cy="256" r="248" fill="none" stroke="#C9A84C" stroke-width="5"/>
  <circle cx="256" cy="256" r="240" fill="none" stroke="#C9A84C" stroke-width="1.2" opacity="0.4"/>
  <text x="256" y="118" text-anchor="middle" font-family="Arial,sans-serif" font-size="58" font-weight="700" fill="#C9A84C" letter-spacing="12">BD</text>
  <path d="M 94,270 C 100,257 114,240 133,226 C 152,212 172,203 198,202 C 220,201 240,196 250,190 C 256,183 262,170 267,167 C 272,170 280,183 290,190 C 304,197 328,196 358,193 C 380,191 403,200 418,217 C 429,231 430,252 425,270 C 421,281 411,289 394,292 C 362,299 281,303 214,301 C 165,300 131,294 111,284 C 103,279 97,276 94,270 Z" fill="none" stroke="#C9A84C" stroke-width="6.5" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M 104,268 C 178,288 315,295 420,272" fill="none" stroke="#C9A84C" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M 198,203 C 188,232 184,262 187,284" fill="none" stroke="#C9A84C" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M 250,253 Q 328,238 405,256" fill="none" stroke="#C9A84C" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M 238,268 Q 316,254 405,269" fill="none" stroke="#C9A84C" stroke-width="2.8" stroke-linecap="round"/>
  <text x="256" y="420" text-anchor="middle" font-family="Arial Black,Impact,Arial,sans-serif" font-size="116" font-weight="900" fill="#C9A84C" letter-spacing="-2">CR7</text>
</svg>`;

function pad2(n: number) { return n.toString().padStart(2, "0"); }

function buildHtml(opts: ExportPDFOptions): string {
  const now = new Date();
  const dateStr = `${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}/${now.getFullYear()}`;
  const timeStr = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;

  const sectionsHtml = opts.sections.map((sec) => {
    const summaryRows = sec.rows.length
      ? `<table class="summary-table">
          ${sec.rows.map((r) => `
            <tr>
              <td class="label">${r.label}<br/><span class="bn">${r.labelBn}</span></td>
              <td class="value">${r.value}</td>
            </tr>`).join("")}
        </table>`
      : "";

    const dataTable = sec.tableHeaders && sec.tableRows && sec.tableRows.length
      ? `<div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>${(sec.tableHeaders).map((h, i) => `<th>${h}${sec.tableHeadersBn?.[i] ? `<br/><span class="bn">${sec.tableHeadersBn[i]}</span>` : ""}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${sec.tableRows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}
            </tbody>
          </table>
        </div>`
      : "";

    return `
      <section class="section">
        <div class="section-title">
          <span>${sec.title}</span>
          <span class="bn">${sec.titleBn}</span>
        </div>
        ${summaryRows}
        ${dataTable}
      </section>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>BD CR7 ERP — ${opts.moduleName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    /* ── Reset ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Page setup ── */
    @page {
      size: A4;
      margin: 12mm 14mm 14mm 14mm;
    }

    body {
      font-family: 'Inter', 'Noto Sans Bengali', sans-serif;
      font-size: 11px;
      color: #1a2920;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Bengali text class ── */
    .bn {
      font-family: 'Noto Sans Bengali', 'Inter', sans-serif;
      font-size: 10.5px;
      color: #3a5044;
    }

    /* ── Wrapper ── */
    .page {
      max-width: 182mm;
      margin: 0 auto;
    }

    /* ── Header ── */
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding-bottom: 8px;
      border-bottom: 2.5px solid #0f6c5a;
      margin-bottom: 10px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo-box {
      flex-shrink: 0;
    }

    .company-name {
      font-size: 20px;
      font-weight: 700;
      color: #0f6c5a;
      letter-spacing: -0.3px;
      line-height: 1.1;
    }

    .company-sub {
      font-size: 10px;
      font-weight: 500;
      color: #c97f3a;
      letter-spacing: 0.05em;
      margin-top: 1px;
    }

    .company-address {
      font-family: 'Noto Sans Bengali', 'Inter', sans-serif;
      font-size: 10px;
      color: #4a6155;
      margin-top: 3px;
      line-height: 1.5;
    }

    .header-right {
      text-align: right;
    }

    .header-right .module-name {
      font-size: 14px;
      font-weight: 700;
      color: #0f6c5a;
    }

    .header-right .module-name-bn {
      font-family: 'Noto Sans Bengali', 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 600;
      color: #3a5044;
      display: block;
    }

    .header-right .meta {
      font-size: 9.5px;
      color: #6b7f74;
      margin-top: 4px;
    }

    /* ── Description banner ── */
    .description-banner {
      background: #f0f7f4;
      border-left: 3px solid #0f6c5a;
      padding: 7px 10px;
      border-radius: 0 5px 5px 0;
      margin-bottom: 12px;
    }

    .description-banner p {
      font-size: 10.5px;
      color: #2a4038;
      line-height: 1.5;
    }

    .description-banner p.bn-desc {
      font-family: 'Noto Sans Bengali', 'Inter', sans-serif;
      margin-top: 3px;
      color: #3a5044;
    }

    /* ── Section ── */
    .section {
      margin-bottom: 14px;
      page-break-inside: avoid;
    }

    .section-title {
      display: flex;
      align-items: baseline;
      gap: 8px;
      font-size: 12px;
      font-weight: 700;
      color: #0f6c5a;
      border-bottom: 1px solid #c8dcd4;
      padding-bottom: 4px;
      margin-bottom: 7px;
    }

    .section-title .bn {
      font-family: 'Noto Sans Bengali', 'Inter', sans-serif;
      font-size: 11.5px;
      color: #3a6050;
    }

    /* ── Summary table (key-value) ── */
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
    }

    .summary-table tr:nth-child(even) td {
      background: #f5faf7;
    }

    .summary-table td {
      padding: 5px 8px;
      font-size: 11px;
      border: 1px solid #e0ece6;
    }

    .summary-table td.label {
      width: 40%;
      font-weight: 500;
      color: #2a4038;
    }

    .summary-table td.value {
      font-weight: 600;
      color: #0f6c5a;
    }

    /* ── Data table ── */
    .data-table-wrap {
      overflow: visible;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }

    .data-table thead tr {
      background: #0f6c5a;
      color: #ffffff;
    }

    .data-table th {
      padding: 5px 7px;
      text-align: left;
      font-weight: 600;
      font-size: 10px;
      white-space: nowrap;
    }

    .data-table th .bn {
      color: #c5e8dc;
      font-size: 9.5px;
    }

    .data-table tbody tr:nth-child(even) {
      background: #f5faf7;
    }

    .data-table tbody tr:hover {
      background: #e8f5ef;
    }

    .data-table td {
      padding: 4px 7px;
      border-bottom: 1px solid #e0ece6;
      color: #2a4038;
      vertical-align: middle;
    }

    /* ── Divider ── */
    .divider {
      height: 1px;
      background: #c8dcd4;
      margin: 10px 0;
    }

    /* ── Footer ── */
    .footer {
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1.5px solid #c97f3a;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .footer-left {
      font-size: 9px;
      color: #6b7f74;
      line-height: 1.5;
    }

    .footer-left .bn {
      font-family: 'Noto Sans Bengali', 'Inter', sans-serif;
      font-size: 9px;
      color: #6b7f74;
    }

    .footer-right {
      text-align: right;
    }

    .powered-by {
      font-size: 10px;
      font-weight: 700;
      color: #c97f3a;
      letter-spacing: 0.04em;
    }

    .powered-sub {
      font-family: 'Noto Sans Bengali', 'Inter', sans-serif;
      font-size: 9px;
      color: #c97f3a;
      display: block;
    }

    /* ── Print helpers ── */
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .no-print { display: none !important; }
    }

    /* ── Print button (screen only) ── */
    .print-btn {
      position: fixed;
      top: 12px;
      right: 12px;
      background: #0f6c5a;
      color: #fff;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      z-index: 999;
    }

    .print-btn:hover { background: #0d5c4c; }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <header class="header">
      <div class="header-left">
        <div class="logo-box">${LOGO_SVG}</div>
        <div>
          <div class="company-name">BD CR7 ERP</div>
          <div class="company-sub">CONSTRUCTION · FINANCE · AI-POWERED</div>
          <div class="company-address">
            বৈরাগী বাজার, বিয়ানীবাজার, সিলেট<br/>
            Bairagir Bazar, Beanibazar, Sylhet
          </div>
        </div>
      </div>
      <div class="header-right">
        <div class="module-name">${opts.moduleName}</div>
        <span class="module-name-bn">${opts.moduleNameBn}</span>
        <div class="meta">
          Date / তারিখ: ${dateStr} &nbsp;|&nbsp; Time: ${timeStr}<br/>
          ${opts.period ? `Period / সময়কাল: ${opts.period}<br/>` : ""}
          ${opts.exportedBy ? `Exported by: ${opts.exportedBy}` : ""}
        </div>
      </div>
    </header>

    <!-- Description -->
    <div class="description-banner">
      <p>${opts.description}</p>
      <p class="bn-desc">${opts.descriptionBn}</p>
    </div>

    <!-- Sections -->
    ${sectionsHtml}

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-left">
        BD CR7 ERP System &nbsp;|&nbsp; বৈরাগী বাজার, বিয়ানীবাজার, সিলেট<br/>
        <span class="bn">এই রিপোর্টটি স্বয়ংক্রিয়ভাবে তৈরি হয়েছে</span>
      </div>
      <div class="footer-right">
        <div class="powered-by">⚡ Powered by SUMONIX AI</div>
        <span class="powered-sub">SUMONIX AI দ্বারা পরিচালিত</span>
      </div>
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Triggers A4 PDF export as direct download.
 */
export async function exportToPDF(opts: ExportPDFOptions): Promise<void> {
  const html2pdf = (await import("html2pdf.js")).default;
  const html = buildHtml(opts);
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "-10000px";
  wrapper.style.top = "0";
  wrapper.style.width = "794px";
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  const page = wrapper.querySelector(".page") as HTMLElement | null;
  if (!page) {
    document.body.removeChild(wrapper);
    throw new Error("Failed to prepare PDF content");
  }

  const fileName = `${opts.moduleName.toLowerCase().replace(/\s+/g, "-")}-report.pdf`;

  try {
    await html2pdf()
      .set({
        margin: [8, 8, 8, 8],
        filename: fileName,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      })
      .from(page)
      .save();
  } finally {
    document.body.removeChild(wrapper);
  }
}
