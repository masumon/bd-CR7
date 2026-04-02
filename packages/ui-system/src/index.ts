import React from "react";
import DeveloperBadge from "../DeveloperBadge";

export type AppCardProps = {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
};

export function AppCard({ title, subtitle, children }: AppCardProps) {
  return (
    <section style={{ borderRadius: 14, border: "1px solid #d9dfe8", padding: 16 }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      {subtitle ? <p style={{ marginTop: 8 }}>{subtitle}</p> : null}
      {children}
    </section>
  );
}

export { DeveloperBadge };
