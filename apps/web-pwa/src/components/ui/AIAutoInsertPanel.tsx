"use client";

/**
 * Deprecated placeholder.
 *
 * SUMONIX automation UI is intentionally disabled. This component remains as a
 * compatibility shim so older imports do not break if reintroduced by mistake.
 */

interface AIAutoInsertPanelProps {
  fileId: string;
  onConfirmed?: (targetTable: string) => void;
  onRejected?: () => void;
}

export function AIAutoInsertPanel(_props: AIAutoInsertPanelProps) {
  return null;
}
