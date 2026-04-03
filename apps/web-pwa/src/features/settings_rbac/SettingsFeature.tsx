"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, Settings2, UserRound, Sun, Moon, Languages } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
}

export function SettingsFeature() {
  const supabase = useMemo(() => createClient(), []);
  const userId = useAuthStore((state) => state.userId);
  const role = useAuthStore((state) => state.role);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dark, setDark] = useState(false);
  const [language, setLanguage] = useState<"en" | "bn">("en");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("bdcr7-theme");
    const storedLanguage = window.localStorage.getItem("bdcr7-language");

    if (storedTheme === "dark") {
      setDark(true);
    } else if (storedTheme === "light") {
      setDark(false);
    } else {
      setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }

    if (storedLanguage === "bn" || storedLanguage === "en") {
      setLanguage(storedLanguage);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", dark);
    window.localStorage.setItem("bdcr7-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem("bdcr7-language", language);
  }, [language]);

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setError("User session not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    const { data, error: dbErr } = await supabase
      .from("users")
      .select("id,email,full_name,phone")
      .eq("id", userId)
      .maybeSingle();

    if (dbErr || !data) {
      setError(dbErr?.message || "Profile not found.");
      setLoading(false);
      return;
    }

    const p = data as UserProfile;
    setProfile(p);
    setFullName(p.full_name || "");
    setPhone(p.phone || "");
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setError("");
    setMessage("");

    const { error: dbErr } = await supabase
      .from("users")
      .update({
        full_name: fullName.trim() || profile.full_name,
        phone: phone.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    setSaving(false);
    if (dbErr) {
      setError(dbErr.message);
      return;
    }

    setMessage("Profile updated successfully.");
    void loadProfile();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile, contact info, and account context.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            <CardTitle>Account Profile</CardTitle>
          </div>
          <Button variant="outline" className="h-8 px-3 text-xs" onClick={loadProfile} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-28 items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
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

              <Button type="submit" className="h-9 px-4" disabled={saving || loading}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserRound className="mr-2 h-4 w-4" />}
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              aria-label="Switch to light mode"
              title="Light mode"
              onClick={() => setDark(false)}
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-full border transition-all",
                dark ? "border-border bg-background text-muted-foreground" : "border-primary/35 bg-primary/10 text-primary"
              )}
            >
              <Sun className="h-4 w-4" />
            </button>

            <button
              type="button"
              aria-label="Switch to dark mode"
              title="Dark mode"
              onClick={() => setDark(true)}
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-full border transition-all",
                dark ? "border-primary/35 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"
              )}
            >
              <Moon className="h-4 w-4" />
            </button>

            <button
              type="button"
              aria-label="Switch language to Bangla"
              title="Bangla"
              onClick={() => setLanguage("bn")}
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-full border transition-all",
                language === "bn" ? "border-primary/35 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"
              )}
            >
              <Languages className="h-4 w-4" />
            </button>

            <button
              type="button"
              aria-label="Switch language to English"
              title="English"
              onClick={() => setLanguage("en")}
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-full border transition-all",
                language === "en" ? "border-primary/35 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"
              )}
            >
              <Languages className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
