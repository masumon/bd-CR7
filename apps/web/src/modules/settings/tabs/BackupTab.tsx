"use client";

import { useMemo, useState } from "react";
import { Download, Upload, Cloud, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/apiClient";
import { normalizeRoleName } from "@/lib/rbac";
import { getErrorMessage } from "@/lib/errorUtils";

type BackupTabProps = {
  token?: string;
  role: string | null;
};

type BackupEnvelope = {
  version: number;
  generated_at: string;
  scope: "global" | "personal";
  generated_by: string;
  role: string;
  tables: Record<string, Array<Record<string, unknown>>>;
};

function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function BackupTab({ token, role }: BackupTabProps) {
  const normalizedRole = normalizeRoleName(role);
  const canGlobalBackup = normalizedRole === "super_admin" || normalizedRole === "admin";

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [backupUrl, setBackupUrl] = useState("");

  const scopeLabel = useMemo(() => (canGlobalBackup ? "global" : "personal"), [canGlobalBackup]);

  const exportBackup = async () => {
    if (!token) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const payload = await apiClient<BackupEnvelope>(
        "/api/settings/backup/export",
        { method: "POST", body: JSON.stringify({ scope: scopeLabel }) },
        token,
      );
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      downloadJson(`bd-cr7-backup-${payload.scope}-${ts}.json`, payload);
      setMessage("Backup exported successfully. You can upload this file to Google Drive, OneDrive, or any cloud drive.");
    } catch (err) {
      setError(getErrorMessage(err) || "Backup export failed");
    } finally {
      setBusy(false);
    }
  };

  const importBackupFromFile = async (file: File | null) => {
    if (!token || !file) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as BackupEnvelope;
      const result = await apiClient<{ restored: boolean; counts: Record<string, number> }>(
        "/api/settings/backup/restore",
        { method: "POST", body: JSON.stringify(parsed) },
        token,
      );
      setMessage(`Backup restored. users=${result.counts.users ?? 0}, prefs=${result.counts.workspace_preferences ?? 0}, biometrics=${result.counts.biometric_credentials ?? 0}`);
    } catch (err) {
      setError(getErrorMessage(err) || "Backup restore failed");
    } finally {
      setBusy(false);
    }
  };

  const importBackupFromUrl = async () => {
    if (!token) return;
    const url = backupUrl.trim();
    if (!url) {
      setError("Cloud backup URL is required");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await apiClient<{ restored: boolean; counts: Record<string, number> }>(
        "/api/settings/backup/restore/from-url",
        { method: "POST", body: JSON.stringify({ url }) },
        token,
      );
      setMessage(`Cloud backup restored. users=${result.counts.users ?? 0}, prefs=${result.counts.workspace_preferences ?? 0}, biometrics=${result.counts.biometric_credentials ?? 0}`);
    } catch (err) {
      setError(getErrorMessage(err) || "Cloud restore failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border/70 bg-card/60 p-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Backup & Restore</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Role scope: <span className="font-semibold text-foreground">{scopeLabel}</span>. Super Admin/Admin can export and restore global data.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-background/60 p-3">
          <p className="text-xs font-medium text-foreground">Local Backup</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Download JSON backup and store on device or upload to any drive.</p>
          <Button className="mt-3 h-9 gap-2" onClick={() => void exportBackup()} disabled={busy || !token}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Export Backup
          </Button>
          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs text-foreground hover:bg-muted/50">
            <Upload className="h-3.5 w-3.5" />
            Restore From File
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => void importBackupFromFile(e.target.files?.[0] || null)}
              disabled={busy || !token}
            />
          </label>
        </div>

        <div className="rounded-xl border border-border/60 bg-background/60 p-3">
          <p className="text-xs font-medium text-foreground">Cloud Drive Restore</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Paste share/download link from Google Drive, OneDrive, Dropbox, or other drives.</p>
          <input
            value={backupUrl}
            onChange={(e) => setBackupUrl(e.target.value)}
            placeholder="https://..."
            className="mt-3 h-9 w-full rounded-lg border border-border/60 bg-background px-2 text-xs text-foreground outline-none"
          />
          <Button className="mt-3 h-9 gap-2" variant="outline" onClick={() => void importBackupFromUrl()} disabled={busy || !token}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Cloud className="h-3.5 w-3.5" />}
            Restore From Drive URL
          </Button>
        </div>
      </div>

      {error ? <p className="text-xs text-rose-400">{error}</p> : null}
      {message ? <p className="text-xs text-emerald-400">{message}</p> : null}
    </div>
  );
}
