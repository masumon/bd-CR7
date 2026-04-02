import React from "react";

export default function DeveloperBadge({ teamName = "BD CR7 Engineering Team", year = new Date().getFullYear() }) {
  return (
    <footer style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: "#475569" }}>
      Built by {teamName} | {year}
    </footer>
  );
}
