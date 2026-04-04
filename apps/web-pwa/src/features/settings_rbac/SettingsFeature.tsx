"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, Settings2, UserRound, Sun, Moon, Languages, Layers } from "lucide-react";

import { ActionMenu } from "@/components/ui/action-menu";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { useModuleStore } from "@/store/moduleStore";

function ModuleControlPanel({ language }: { language: "en" | "bn" }) {
  const modules = useModuleStore((s) => s.modules);
  const toggleModule = useModuleStore((s) => s.toggleModule);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="h-4 w-4 text-primary" />
          {language === "bn" ? "মডিউল কন্ট্রোল" : "Module Control"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {language === "bn"
            ? "ডায়নামিক মডিউল চালু বা বন্ধ করুন। বন্ধ মডিউল নেভিগেশন থেকে লুকিয়ে যাবে।"
            : "Toggle dynamic modules on or off. Disabled modules are hidden from navigation automatically."}
        </p>
        {modules.map((m) => (
          <div key={m.key} className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/75 p-3">
            <div>
              <p className="text-sm font-medium text-foreground">{language === "bn" ? m.labelBn : m.labelEn}</p>
              <p className="text-xs text-muted-foreground">{language === "bn" ? m.descriptionBn : m.descriptionEn}</p>
            </div>
            <button
              type="button"
              onClick={() => toggleModule(m.key)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition",
                m.enabled
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {m.enabled
                ? (language === "bn" ? "চালু" : "ON")
                : (language === "bn" ? "বন্ধ" : "OFF")}
            </button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
}

type SettingCategory = "Workspace" | "Notifications" | "Security" | "Data";
type SettingsTab = "Profile" | "Workspace" | "Notifications" | "Security" | "Data" | "Integrations" | "Modules" | "Advanced";
type IntegrationState = {
  cloudinary: boolean;
  realtime: boolean;
  aiVoice: boolean;
  offlineSync: boolean;
};

type WorkspacePreferenceRow = {
  theme?: string;
  language?: string;
  integrations?: Partial<IntegrationState>;
};

const TAB_LABELS: Record<"en" | "bn", Record<SettingsTab, string>> = {
  en: {
    Profile: "General",
    Workspace: "Workspace",
    Notifications: "Notifications",
    Security: "Security",
    Data: "Categories",
    Integrations: "Integrations",
    Modules: "Modules",
    Advanced: "About",
  },
  bn: {
    Profile: "সাধারণ",
    Workspace: "ওয়ার্কস্পেস",
    Notifications: "নোটিফিকেশন",
    Security: "নিরাপত্তা",
    Data: "ক্যাটাগরি",
    Integrations: "ইন্টিগ্রেশন",
    Modules: "মডিউল",
    Advanced: "তথ্য",
  },
};

type SettingItem = {
  id: string;
  category: SettingCategory;
  subcategory: string;
  label: string;
  description: string;
  enabled: boolean;
};

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
  const [activeTab, setActiveTab] = useState<SettingsTab>("Profile");
  const [integrationState, setIntegrationState] = useState<IntegrationState>({
    cloudinary: true,
    realtime: true,
    aiVoice: true,
    offlineSync: true,
  });
  const [settingItems, setSettingItems] = useState<SettingItem[]>([
    {
      id: "ws-compact-cards",
      category: "Workspace",
      subcategory: "Layout",
      label: "Compact Dashboard Cards",
      description: "Show operational micro cards on home view",
      enabled: true,
    },
    {
      id: "ws-floating-ai",
      category: "Workspace",
      subcategory: "Assistant",
      label: "Floating SUMONIX AI",
      description: "Enable floating assistant entry across modules",
      enabled: true,
    },
    {
      id: "ntf-offline-alert",
      category: "Notifications",
      subcategory: "System",
      label: "Offline Queue Alert",
      description: "Show warning when offline sync queue is active",
      enabled: true,
    },
    {
      id: "sec-session-expiry",
      category: "Security",
      subcategory: "Session",
      label: "Session Expiry Reminder",
      description: "Warn user before session timeout",
      enabled: false,
    },
    {
      id: "data-export-ready",
      category: "Data",
      subcategory: "Reporting",
      label: "Report Export Ready",
      description: "Keep export helpers enabled in reports module",
      enabled: true,
    },
  ]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("bdcr7-settings-catalog");
      if (!raw) return;
      setSettingItems(JSON.parse(raw) as SettingItem[]);
    } catch {
      setSettingItems((prev) => prev);
    }

    try {
      const integrationRaw = window.localStorage.getItem("bdcr7-integration-state");
      if (integrationRaw) {
        setIntegrationState(JSON.parse(integrationRaw) as typeof integrationState);
      }
    } catch {
      setIntegrationState((prev) => prev);
    }
  }, []);

  const saveWorkspacePreferences = useCallback(async (patch: Partial<WorkspacePreferenceRow>) => {
    if (!userId) {
      return;
    }

    const payload: Record<string, unknown> = { user_id: userId };
    if (typeof patch.theme === "string") {
      payload.theme = patch.theme;
    }
    if (typeof patch.language === "string") {
      payload.language = patch.language;
    }
    if (patch.integrations) {
      payload.integrations = patch.integrations;
    }

    await supabase.from("workspace_preferences").upsert(payload, { onConflict: "user_id" });
  }, [supabase, userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let cancelled = false;
    const loadWorkspacePreferences = async () => {
      const { data } = await supabase
        .from("workspace_preferences")
        .select("theme,language,integrations")
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled || !data) {
        return;
      }

      const row = data as WorkspacePreferenceRow;
      if (row.theme === "dark" || row.theme === "light") {
        setDark(row.theme === "dark");
      }
      if (row.language === "bn" || row.language === "en") {
        setLanguage(row.language);
      }
      if (row.integrations) {
        setIntegrationState((prev) => ({ ...prev, ...row.integrations }));
      }
    };

    void loadWorkspacePreferences();
    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  const persistSettings = useCallback((next: SettingItem[]) => {
    setSettingItems(next);
    window.localStorage.setItem("bdcr7-settings-catalog", JSON.stringify(next));
  }, []);

  const toggleSetting = (id: string) => {
    const next = settingItems.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item));
    persistSettings(next);
  };

  const categoryTotals = useMemo(() => {
    const totals: Record<SettingCategory, number> = {
      Workspace: 0,
      Notifications: 0,
      Security: 0,
      Data: 0,
    };
    for (const item of settingItems) {
      if (item.enabled) {
        totals[item.category] += 1;
      }
    }
    return totals;
  }, [settingItems]);

  const filteredSettings = useMemo(() => {
    if (activeTab === "Workspace" || activeTab === "Notifications" || activeTab === "Security" || activeTab === "Data") {
      return settingItems.filter((item) => item.category === activeTab);
    }
    return settingItems;
  }, [activeTab, settingItems]);

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
    void saveWorkspacePreferences({ theme: dark ? "dark" : "light" });
  }, [dark, saveWorkspacePreferences]);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem("bdcr7-language", language);
    void saveWorkspacePreferences({ language });
  }, [language, saveWorkspacePreferences]);

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

  const persistIntegrationState = (next: IntegrationState) => {
    setIntegrationState(next);
    window.localStorage.setItem("bdcr7-integration-state", JSON.stringify(next));
    void saveWorkspacePreferences({ integrations: next });
  };

  const resetWorkspacePreferences = () => {
    window.localStorage.removeItem("bdcr7-theme");
    window.localStorage.removeItem("bdcr7-language");
    window.localStorage.removeItem("bdcr7-settings-catalog");
    window.localStorage.removeItem("bdcr7-integration-state");
    window.localStorage.removeItem("bdcr7-notifications");
    setMessage("Workspace preferences reset. Reload page to apply defaults.");
  };

  const tabs: SettingsTab[] = ["Profile", "Workspace", "Notifications", "Security", "Data", "Integrations", "Modules", "Advanced"];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{language === "bn" ? "সেটিংস" : "Settings"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{language === "bn" ? "প্রোফাইল, ভাষা, থিম এবং অ্যাপ কনফিগারেশন সহজভাবে ম্যানেজ করুন।" : "Manage profile, language, theme, and app configuration in one place."}</p>
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-xs font-medium transition",
                  activeTab === tab
                    ? "border-primary/35 bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {TAB_LABELS[language][tab]}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {activeTab === "Profile" ? (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            <CardTitle>Account Profile</CardTitle>
          </div>
          <Button variant="outline" className="h-11 px-3 text-xs" onClick={loadProfile} disabled={loading}>
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

              <Button type="submit" className="h-11 px-4" disabled={saving || loading}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserRound className="mr-2 h-4 w-4" />}
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
      ) : null}

      {activeTab === "Workspace" ? (
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
      ) : null}

      {(activeTab === "Workspace" || activeTab === "Notifications" || activeTab === "Security" || activeTab === "Data") ? (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{activeTab} Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(categoryTotals) as SettingCategory[]).map((category) => (
              <div key={category} className="rounded-2xl border border-border/70 bg-background/75 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{category}</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{categoryTotals[category]}</p>
                <p className="text-xs text-muted-foreground">active controls</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border/70">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Subcategory</th>
                  <th className="px-3 py-3">Control</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSettings.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 last:border-b-0">
                    <td className="px-3 py-3 text-xs font-medium text-foreground">{item.category}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{item.subcategory}</td>
                    <td className="px-3 py-3">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn("rounded-full px-2.5 py-1 text-xs", item.enabled ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-muted text-muted-foreground")}>{item.enabled ? "Enabled" : "Disabled"}</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <ActionMenu
                        className="ml-auto"
                        items={[
                          { label: `Category: ${item.category}`, onClick: () => {} },
                          { label: `Subcategory: ${item.subcategory}`, onClick: () => {} },
                          { label: item.enabled ? "Disable" : "Enable", onClick: () => toggleSetting(item.id) },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      ) : null}

      {activeTab === "Integrations" ? (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: "cloudinary", label: "Cloudinary Upload", description: "Media upload for receipts and progress evidence" },
            { key: "realtime", label: "Supabase Realtime", description: "Live notifications for approvals and project updates" },
            { key: "aiVoice", label: "AI Voice Mode", description: "Speech input/output in SUMONIX AI chat" },
            { key: "offlineSync", label: "Offline Sync", description: "Background queue replay when connection restores" },
          ].map((integration) => (
            <div key={integration.key} className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/75 p-3">
              <div>
                <p className="text-sm font-medium text-foreground">{integration.label}</p>
                <p className="text-xs text-muted-foreground">{integration.description}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const key = integration.key as keyof typeof integrationState;
                  const next = { ...integrationState, [key]: !integrationState[key] };
                  persistIntegrationState(next);
                }}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  integrationState[integration.key as keyof typeof integrationState]
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {integrationState[integration.key as keyof typeof integrationState] ? "Enabled" : "Disabled"}
              </button>
            </div>
          ))}
        </CardContent>
      </Card>
      ) : null}

      {activeTab === "Modules" ? (
      <ModuleControlPanel language={language} />
      ) : null}

      {activeTab === "Advanced" ? (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Advanced Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
            <p className="text-sm font-medium text-foreground">Reset Local Workspace Preferences</p>
            <p className="mt-1 text-xs text-muted-foreground">Clears theme, language, settings catalog, integration toggles, and notification cache from this device.</p>
            <Button className="mt-3 h-11 px-4" variant="outline" onClick={resetWorkspacePreferences}>Reset Local Preferences</Button>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
            <p className="text-sm font-medium text-foreground">Environment Checklist</p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>NEXT_PUBLIC_SUPABASE_URL configured</li>
              <li>NEXT_PUBLIC_SUPABASE_ANON_KEY configured</li>
              <li>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME configured</li>
              <li>NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET configured</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      ) : null}

      {message && activeTab !== "Profile" ? (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4" /> {message}
        </div>
      ) : null}
    </div>
  );
}
