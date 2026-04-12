"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { apiClient } from "@/lib/apiClient";
import { uploadToCloudinary } from "@/lib/cloudinaryUpload";
import { getErrorMessage } from "@/lib/errorUtils";
import { useAuthStore } from "@/store/authStore";
import {
  DEFAULT_SETTING_ITEMS,
  SETTINGS_TABS,
  SETTINGS_TABS_SUPER_ADMIN,
  type IntegrationState,
  type SettingCategory,
  type SettingItem,
  type SettingsTab,
  type UserProfile,
} from "@/modules/settings/model";
import { SyncControlPanel } from "@/modules/settings/tabs/SyncControlPanel";
import { AdvancedTab } from "@/modules/settings/tabs/AdvancedTab";
import { IntegrationsTab } from "@/modules/settings/tabs/IntegrationsTab";
import { ProfileTab } from "@/modules/settings/tabs/ProfileTab";
import { SettingsCatalogTab } from "@/modules/settings/tabs/SettingsCatalogTab";
import { SettingsTabsNav } from "@/modules/settings/tabs/SettingsTabsNav";
import { WorkspaceTab } from "@/modules/settings/tabs/WorkspaceTab";
import { UserManagementTab } from "@/modules/settings/tabs/UserManagementTab";
import { normalizeRoleName } from "@/lib/rbac";
import { BackupTab } from "@/modules/settings/tabs/BackupTab";

function mergeSettingCatalog(stored: SettingItem[] | null): SettingItem[] {
  if (!stored || stored.length === 0) return DEFAULT_SETTING_ITEMS;

  const byId = new Map(stored.map((item) => [item.id, item]));
  const merged = DEFAULT_SETTING_ITEMS.map((defaultItem) => {
    const existing = byId.get(defaultItem.id);
    return existing ? { ...defaultItem, ...existing } : defaultItem;
  });

  for (const item of stored) {
    if (!merged.some((existing) => existing.id === item.id)) {
      merged.push(item);
    }
  }

  return merged;
}

export function SettingsFeature() {
  const userId = useAuthStore((state) => state.userId);
  const token = useAuthStore((state) => state.token ?? undefined);
  const role = useAuthStore((state) => state.role);
  const normalizedRole = normalizeRoleName(role);
  const isSuperAdmin = normalizedRole === "super_admin";

  const availableTabs = isSuperAdmin ? SETTINGS_TABS_SUPER_ADMIN : SETTINGS_TABS;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [userCode, setUserCode] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dark, setDark] = useState(false);
  const [language, setLanguage] = useState<"en" | "bn">("en");
  const [activeTab, setActiveTab] = useState<SettingsTab>("Profile");
  const [integrationState, setIntegrationState] = useState<IntegrationState>({ cloudinary: true, realtime: true, aiVoice: true, offlineSync: true });
  const [settingItems, setSettingItems] = useState<SettingItem[]>(DEFAULT_SETTING_ITEMS);
  const [settingsQuery, setSettingsQuery] = useState("");
  const lastSyncedThemeRef = useRef<string | null>(null);
  const lastSyncedLanguageRef = useRef<"en" | "bn" | null>(null);
  const localPreferencesHydratedRef = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("bdcr7-settings-catalog");
      if (raw) {
        const parsed = JSON.parse(raw) as SettingItem[];
        setSettingItems(mergeSettingCatalog(parsed));
      }
    } catch {
      setSettingItems((prev) => prev);
    }

    try {
      const integrationRaw = window.localStorage.getItem("bdcr7-integration-state");
      if (integrationRaw) setIntegrationState(JSON.parse(integrationRaw) as IntegrationState);
    } catch {
      setIntegrationState((prev) => prev);
    }

    localPreferencesHydratedRef.current = true;
  }, []);

  const saveWorkspacePreferences = useCallback(async (patch: { theme?: string; language?: string; integrations?: Partial<IntegrationState> }) => {
    if (!userId || !token) return;
    await apiClient("/api/users/me/preferences", { method: "PATCH", body: JSON.stringify(patch) }, token);
  }, [token, userId]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const loadWorkspacePreferences = async () => {
      const currentTheme = dark ? "dark" : "light";
      if (!token) {
        lastSyncedThemeRef.current = currentTheme;
        lastSyncedLanguageRef.current = language;
        return;
      }
      const data = await apiClient<{ theme?: string; language?: string; integrations?: Partial<IntegrationState> }>("/api/users/me/preferences", { method: "GET" }, token);
      if (cancelled || !data) return;
      const resolvedTheme = data.theme === "dark" || data.theme === "light" ? data.theme : currentTheme;
      const resolvedLanguage = data.language === "bn" || data.language === "en" ? data.language : language;
      lastSyncedThemeRef.current = resolvedTheme;
      lastSyncedLanguageRef.current = resolvedLanguage;
      if (resolvedTheme !== currentTheme) setDark(resolvedTheme === "dark");
      if (resolvedLanguage !== language) setLanguage(resolvedLanguage);
      if (data.integrations) setIntegrationState((prev) => ({ ...prev, ...data.integrations }));
    };
    void loadWorkspacePreferences();
    return () => {
      cancelled = true;
    };
  }, [dark, language, token, userId]);

  const persistSettings = useCallback((next: SettingItem[]) => {
    const merged = mergeSettingCatalog(next);
    setSettingItems(merged);
    window.localStorage.setItem("bdcr7-settings-catalog", JSON.stringify(merged));
  }, []);

  const toggleSetting = (id: string) => {
    persistSettings(settingItems.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)));
  };

  const categoryTotals = useMemo(() => {
    const totals: Record<SettingCategory, number> = { Workspace: 0, Notifications: 0, Security: 0, Data: 0 };
    for (const item of settingItems) if (item.enabled) totals[item.category] += 1;
    return totals;
  }, [settingItems]);

  const filteredSettings = useMemo(() => {
    if (activeTab === "Workspace" || activeTab === "Notifications" || activeTab === "Security" || activeTab === "Data") {
      const categoryItems = settingItems.filter((item) => item.category === activeTab);
      const normalized = settingsQuery.trim().toLowerCase();
      if (!normalized) return categoryItems;
      return categoryItems.filter((item) => [item.label, item.description, item.subcategory]
        .join(" ")
        .toLowerCase()
        .includes(normalized));
    }
    return settingItems;
  }, [activeTab, settingItems, settingsQuery]);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("bdcr7-theme");
    const storedLanguage = window.localStorage.getItem("bdcr7-language");
    if (storedTheme === "dark") setDark(true);
    else if (storedTheme === "light") setDark(false);
    else setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (storedLanguage === "bn" || storedLanguage === "en") setLanguage(storedLanguage);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    const nextTheme = dark ? "dark" : "light";
    window.localStorage.setItem("bdcr7-theme", nextTheme);
    if (!localPreferencesHydratedRef.current) return;
    if (!userId || !token) {
      lastSyncedThemeRef.current = nextTheme;
      return;
    }
    if (lastSyncedThemeRef.current === nextTheme) return;
    lastSyncedThemeRef.current = nextTheme;
    void saveWorkspacePreferences({ theme: nextTheme });
  }, [dark, saveWorkspacePreferences, token, userId]);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem("bdcr7-language", language);
    if (!localPreferencesHydratedRef.current) return;
    if (!userId || !token) {
      lastSyncedLanguageRef.current = language;
      return;
    }
    if (lastSyncedLanguageRef.current === language) return;
    lastSyncedLanguageRef.current = language;
    void saveWorkspacePreferences({ language });
  }, [language, saveWorkspacePreferences, token, userId]);

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setError("User session not found.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    if (!token) {
      setError("User session token missing.");
      setLoading(false);
      return;
    }
    let data: UserProfile | null = null;
    try {
      data = await apiClient<UserProfile>("/api/users/me/profile", { method: "GET" }, token);
    } catch (loadError) {
      setError(getErrorMessage(loadError) || "Profile not found.");
      setLoading(false);
      return;
    }
    const p = data;
    setProfile(p);
    setFullName(p.full_name || "");
    setPhone(p.phone || "");
    setUserCode(p.user_code || "");
    setProfileImageUrl(p.profile_image_url || "");
    setLoading(false);
  }, [token, userId]);

  const handleUploadImage = useCallback(async (file: File) => {
    setUploadingImage(true);
    setError("");
    setMessage("");
    try {
      const fileUrl = await uploadToCloudinary(file);
      setProfileImageUrl(fileUrl);
      // Auto-persist to DB immediately — no separate Save click required
      if (token) {
        await apiClient(
          "/api/users/me/profile",
          { method: "PATCH", body: JSON.stringify({ profile_image_url: fileUrl }) },
          token,
        );
        setMessage("Profile photo updated successfully.");
        void loadProfile();
      } else {
        setMessage("Profile photo uploaded. Click Save Profile to apply.");
      }
    } catch (uploadError) {
      setError(getErrorMessage(uploadError) || "Image upload failed.");
    } finally {
      setUploadingImage(false);
    }
  }, [token, loadProfile]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!token) {
      setError("User session token missing.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    let saveError: string | null = null;
    try {
      await apiClient(
        "/api/users/me/profile",
        {
          method: "PATCH",
          body: JSON.stringify({
            full_name: fullName.trim() || profile.full_name,
            phone: phone.trim() || null,
            user_code: userCode.trim() || null,
            profile_image_url: profileImageUrl || null,
          }),
        },
        token,
      );
    } catch (err) {
      saveError = getErrorMessage(err);
    }
    setSaving(false);
    if (saveError) {
      setError(saveError);
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

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{language === "bn" ? "সেটিংস" : "Settings"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{language === "bn" ? "প্রোফাইল, ভাষা, থিম এবং অ্যাপ কনফিগারেশন সহজভাবে ম্যানেজ করুন।" : "Manage profile, language, theme, and app configuration in one place."}</p>
      </div>

      <SettingsTabsNav language={language} tabs={availableTabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "Profile" ? (
        <ProfileTab
          profile={profile}
          role={role}
          loading={loading}
          saving={saving}
          message={message}
          error={error}
          fullName={fullName}
          phone={phone}
          userCode={userCode}
          profileImageUrl={profileImageUrl}
          uploadingImage={uploadingImage}
          setFullName={setFullName}
          setPhone={setPhone}
          setUserCode={setUserCode}
          onUploadImage={handleUploadImage}
          onReload={loadProfile}
          onSave={handleSave}
        />
      ) : null}

      {activeTab === "Workspace" ? <WorkspaceTab dark={dark} language={language} setDark={setDark} setLanguage={setLanguage} /> : null}

      {activeTab === "Workspace" || activeTab === "Notifications" || activeTab === "Security" || activeTab === "Data" ? (
        <SettingsCatalogTab
          activeTab={activeTab}
          categoryTotals={categoryTotals}
          filteredSettings={filteredSettings}
          query={settingsQuery}
          onQueryChange={setSettingsQuery}
          onToggle={toggleSetting}
        />
      ) : null}

      {activeTab === "Integrations" ? (
        <IntegrationsTab
          integrationState={integrationState}
          onToggle={(key) => persistIntegrationState({ ...integrationState, [key]: !integrationState[key] })}
        />
      ) : null}

      {activeTab === "Sync" ? <SyncControlPanel language={language} /> : null}
      {activeTab === "Backup" ? <BackupTab token={token} role={role} /> : null}
      {activeTab === "Advanced" ? <AdvancedTab onReset={resetWorkspacePreferences} /> : null}
      {activeTab === "Users" && isSuperAdmin ? <UserManagementTab /> : null}

      {message && activeTab !== "Profile" ? (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4" /> {message}
        </div>
      ) : null}
    </div>
  );
}
