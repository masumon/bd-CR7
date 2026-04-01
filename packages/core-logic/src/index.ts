export type ExportRow = Record<string, string | number | boolean | null>;

export function toCsv(rows: ExportRow[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown): string => {
    const raw = String(value ?? "");
    if (raw.includes(",") || raw.includes('"') || raw.includes("\n")) {
      return `"${raw.replaceAll('"', '""')}"`;
    }
    return raw;
  };

  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}
