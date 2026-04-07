"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { apiClient } from "@/lib/apiClient";
import { uploadToCloudinary } from "@/lib/cloudinaryUpload";
import { useAuthStore } from "@/store/authStore";
import {
  DEFAULT_SETTING_ITEMS,
  SETTINGS_TABS,
  type IntegrationState,
  type SettingCategory,
  type SettingItem,
  type SettingsTab,
  type UserProfile,
} from "@/features/settings_rbac/model";
import { SyncControlPanel } from "@/features/settings_rbac/tabs/SyncControlPanel";
import { AdvancedTab } from "@/features/settings_rbac/tabs/AdvancedTab";
import { IntegrationsTab } from "@/features/settings_rbac/tabs/IntegrationsTab";
import { ProfileTab } from "@/features/settings_rbac/tabs/ProfileTab";
import { SettingsCatalogTab } from "@/features/settings_rbac/tabs/SettingsCatalogTab";
import { SettingsTabsNav } from "@/features/settings_rbac/tabs/SettingsTabsNav";
import { WorkspaceTab } from "@/features/settings_rbac/tabs/WorkspaceTab";

export function SettingsFeature() {
  const userId = useAuthStore((state) => state.userId);
  const token = useAuthStore((state) => state.token ?? undefined);
  const role = useAuthStore((state) => state.role);

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

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("bdcr7-settings-catalog");
      if (raw) setSettingItems(JSON.parse(raw) as SettingItem[]);
    } catch {
      setSettingItems((prev) => prev);
    }

    try {
      const integrationRaw = window.localStorage.getItem("bdcr7-integration-state");
      if (integrationRaw) setIntegrationState(JSON.parse(integrationRaw) as IntegrationState);
    } catch {
      setIntegrationState((prev) => prev);
    }
  }, []);

  const saveWorkspacePreferences = useCallback(async (patch: { theme?: string; language?: string; integrations?: Partial<IntegrationState> }) => {
    if (!userId || !token) return;
    await apiClient("/api/users/me/preferences", { method: "PATCH", body: JSON.stringify(patch) }, token);
  }, [token, userId]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const loadWorkspacePreferences = async () => {
      if (!token) return;
      const data = await apiClient<{ theme?: string; language?: string; integrations?: Partial<IntegrationState> }>("/api/users/me/preferences", { method: "GET" }, token);
      if (cancelled || !data) return;
      if (data.theme === "dark" || data.theme === "light") setDark(data.theme === "dark");
      if (data.language === "bn" || data.language === "en") setLanguage(data.language);
      if (data.integrations) setIntegrationState((prev) => ({ ...prev, ...data.integrations }));
    };
    void loadWorkspacePreferences();
    return () => {
      cancelled = true;
    };
  }, [token, userId]);

  const persistSettings = useCallback((next: SettingItem[]) => {
    setSettingItems(next);
    window.localStorage.setItem("bdcr7-settings-catalog", JSON.stringify(next));
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
      return settingItems.filter((item) => item.category === activeTab);
    }
    return settingItems;
  }, [activeTab, settingItems]);

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
    if (!token) {
      setError("User session token missing.");
      setLoading(false);
      return;
    }
    let data: UserProfile | null = null;
    try {
      data = await apiClient<UserProfile>("/api/users/me/profile", { method: "GET" }, token);
    } catch (loadError) {
      setError((loadError as Error).message || "Profile not found.");
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
      setError((uploadError as Error).message || "Image upload failed.");
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
      saveError = (err as Error).message;
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

      <SettingsTabsNav language={language} tabs={SETTINGS_TABS} activeTab={activeTab} onChange={setActiveTab} />

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
      {activeTab === "Advanced" ? <AdvancedTab onReset={resetWorkspacePreferences} /> : null}

      {message && activeTab !== "Profile" ? (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4" /> {message}
        </div>
      ) : null}
    </div>
  );
}
