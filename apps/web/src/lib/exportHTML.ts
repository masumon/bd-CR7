/**
 * exportHTML.ts – Bangla HTML report export (browser print)
 */
export interface HtmlExportOptions {
  title: string;
  titleBn: string;
  rows: Record<string, unknown>[];
  period?: string;
}

export function exportHTML(opts: HtmlExportOptions) {
  const { title, titleBn, rows, period } = opts;
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const dateStr = new Date().toLocaleDateString("bn-BD");
  const html = `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="utf-8"/>
<title>${title} — BD CR7</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap');
  body { font-family: 'Noto Sans Bengali', sans-serif; margin: 0; padding: 20px; background: #fff; color: #111; }
  h1 { font-size: 22px; margin-bottom: 4px; color: #15803d; }
  .sub { color: #666; font-size: 13px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #15803d; color: #fff; padding: 8px 10px; text-align: left; }
  td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) td { background: #f0fdf4; }
  .footer { margin-top: 24px; font-size: 11px; color: #999; border-top: 1px solid #e5e7eb; padding-top: 10px; }
</style>
</head>
<body>
<h1>${titleBn} / ${title}</h1>
<div class="sub">BD CR7 ERP • বৈরাগী বাজার, বিয়ানীবাজার, সিলেট${period ? ` • ${period}` : ""} • তারিখ: ${dateStr}</div>
<table>
  <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
  <tbody>${rows.map((r) => `<tr>${headers.map((h) => `<td>${r[h] ?? ""}</td>`).join("")}</tr>`).join("")}</tbody>
</table>
<div class="footer">SUMONIX AI Powered ERP — BD CR7 © ${new Date().getFullYear()}</div>
</body>
</html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title}.html`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
