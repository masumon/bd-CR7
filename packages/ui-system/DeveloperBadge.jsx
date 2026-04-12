import React from "react";

export default function DeveloperBadge({
  organization = "Sumonix AI Lab",
  product = "BD CR7 Ultra Enterprise",
  year = new Date().getFullYear(),
}) {
  return (
    <footer
      style={{
        marginTop: 24,
        padding: "12px 16px",
        textAlign: "center",
        fontSize: 11,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: "#64748b",
        borderTop: "1px solid #e2e8f0",
        letterSpacing: "0.02em",
      }}
    >
      <span style={{ fontWeight: 600, color: "#334155" }}>{product}</span>
      <span style={{ margin: "0 6px", color: "#cbd5e1" }}>·</span>
      Developed by{" "}
      <span style={{ fontWeight: 500, color: "#475569" }}>{organization}</span>
      <span style={{ margin: "0 6px", color: "#cbd5e1" }}>·</span>© 2024–
      {year}
    </footer>
  );
}
