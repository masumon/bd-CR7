import type { FormEvent } from "react";
import { Camera, CheckCircle2, Loader2, RefreshCw, Settings2, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserProfile } from "@/features/settings_rbac/model";

type ProfileTabProps = {
  profile: UserProfile | null;
  role: string | null;
  loading: boolean;
  saving: boolean;
  message: string;
  error: string;
  fullName: string;
  phone: string;
  userCode: string;
  profileImageUrl: string;
  uploadingImage: boolean;
  setFullName: (value: string) => void;
  setPhone: (value: string) => void;
  setUserCode: (value: string) => void;
  onUploadImage: (file: File) => Promise<void> | void;
  onReload: () => Promise<void> | void;
  onSave: (event: FormEvent) => Promise<void> | void;
};

export function ProfileTab({
  profile,
  role,
  loading,
  saving,
  message,
  error,
  fullName,
  phone,
  userCode,
  profileImageUrl,
  uploadingImage,
  setFullName,
  setPhone,
  setUserCode,
  onUploadImage,
  onReload,
  onSave,
}: ProfileTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" />
          <CardTitle>Account Profile</CardTitle>
        </div>
        <Button variant="outline" className="h-11 px-3 text-xs" onClick={onReload} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-28 items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <form onSubmit={onSave} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">User ID</p>
                <p className="mt-2 truncate font-mono text-xs text-foreground">{profile?.id || "-"}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Role</p>
                <p className="mt-2 text-sm font-medium text-foreground">{role || "Unassigned"}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
              <p className="mb-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">Profile Image</p>
              <div className="flex items-center gap-3">
                {profileImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profileImageUrl} alt="Profile" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <UserRound className="h-5 w-5" />
                  </div>
                )}
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs text-foreground hover:bg-muted/60">
                  {uploadingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                  {uploadingImage ? "Uploading..." : "Upload Photo"}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    disabled={uploadingImage}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void onUploadImage(file);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="settings-user-code" className="text-xs text-muted-foreground">Custom User ID / নিজের ইউজার আইডি</label>
              <input
                id="settings-user-code"
                title="Custom User ID"
                className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 font-mono text-sm text-foreground outline-none focus:border-primary/60"
                value={userCode}
                onChange={(e) => setUserCode(e.target.value.toLowerCase())}
                placeholder="e.g. admin_main_01"
              />
              <p className="text-[11px] text-muted-foreground">Set your own public ID (letters, numbers, _ or -). Example: masum_admin_01</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="settings-email" className="text-xs text-muted-foreground">Email</label>
              <input
                id="settings-email"
                title="Email"
                className="w-full rounded-2xl border border-border bg-muted/50 px-4 py-2.5 text-sm text-muted-foreground outline-none"
                value={profile?.email || ""}
                disabled
                readOnly
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="settings-full-name" className="text-xs text-muted-foreground">Full Name</label>
              <input
                id="settings-full-name"
                title="Full Name"
                className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/60"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="settings-phone" className="text-xs text-muted-foreground">Phone</label>
              <input
                id="settings-phone"
                title="Phone"
                className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/60"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +8801XXXXXXXXX"
              />
            </div>

            {message ? (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" /> {message}
              </div>
            ) : null}
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}

            <Button type="submit" className="h-11 px-4" disabled={saving || loading}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserRound className="mr-2 h-4 w-4" />}
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
