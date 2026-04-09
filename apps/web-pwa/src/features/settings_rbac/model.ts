import type { ElementType } from "react";
import { Bell, CloudUpload, Database, Globe, Layers, Settings2, Shield, UserRound, Users } from "lucide-react";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  user_code?: string | null;
  profile_image_url?: string | null;
}

export type SettingCategory = "Workspace" | "Notifications" | "Security" | "Data";
export type SettingsTab = "Profile" | "Workspace" | "Notifications" | "Security" | "Data" | "Integrations" | "Sync" | "Advanced" | "Users";

export type IntegrationState = {
  cloudinary: boolean;
  realtime: boolean;
  aiVoice: boolean;
  offlineSync: boolean;
};

export type WorkspacePreferenceRow = {
  theme?: string;
  language?: string;
  integrations?: Partial<IntegrationState>;
};

export type SettingItem = {
  id: string;
  category: SettingCategory;
  subcategory: string;
  label: string;
  description: string;
  enabled: boolean;
};

export const TAB_LABELS: Record<"en" | "bn", Record<SettingsTab, string>> = {
  en: {
    Profile: "General",
    Workspace: "Workspace",
    Notifications: "Notifications",
    Security: "Security",
    Data: "Categories",
    Integrations: "Integrations",
    Sync: "Sync",
    Advanced: "About",
    Users: "Users",
  },
  bn: {
    Profile: "সাধারণ",
    Workspace: "ওয়ার্কস্পেস",
    Notifications: "নোটিফিকেশন",
    Security: "নিরাপত্তা",
    Data: "ক্যাটাগরি",
    Integrations: "ইন্টিগ্রেশন",
    Sync: "সিঙ্ক",
    Advanced: "তথ্য",
    Users: "ব্যবহারকারী",
  },
};

export const SETTINGS_TABS: SettingsTab[] = ["Profile", "Workspace", "Notifications", "Security", "Data", "Integrations", "Sync", "Advanced"];
/** Super-admin gets an extra Users management tab */
export const SETTINGS_TABS_SUPER_ADMIN: SettingsTab[] = ["Profile", "Workspace", "Notifications", "Security", "Data", "Integrations", "Sync", "Users", "Advanced"];

export const TAB_META: Record<SettingsTab, { Icon: ElementType; desc: string }> = {
  Profile: { Icon: UserRound, desc: "আপনার তথ্য" },
  Workspace: { Icon: Layers, desc: "থিম ও ভাষা" },
  Notifications: { Icon: Bell, desc: "অ্যালার্ট সেটিং" },
  Security: { Icon: Shield, desc: "নিরাপত্তা" },
  Data: { Icon: Database, desc: "ডেটা ম্যানেজ" },
  Integrations: { Icon: Globe, desc: "API কানেকশন" },
  Sync: { Icon: CloudUpload, desc: "সিঙ্ক কন্ট্রোল" },
  Advanced: { Icon: Settings2, desc: "অ্যাডভান্সড" },
  Users: { Icon: Users, desc: "ব্যবহারকারী" },
};

export const DEFAULT_SETTING_ITEMS: SettingItem[] = [
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
    enabled: true,
  },
  {
    id: "data-export-ready",
    category: "Data",
    subcategory: "Reporting",
    label: "Report Export Ready",
    description: "Keep export helpers enabled in reports module",
    enabled: true,
  },
  {
    id: "ws-chart-mini",
    category: "Workspace",
    subcategory: "Layout",
    label: "Mini Charts on Dashboard",
    description: "Show mini bar/pie/line charts on dashboard home",
    enabled: true,
  },
  {
    id: "ws-offline-ai",
    category: "Workspace",
    subcategory: "Assistant",
    label: "AI Offline Mode",
    description: "Enable local rule-based AI responses when offline",
    enabled: true,
  },
  {
    id: "ntf-approval-alert",
    category: "Notifications",
    subcategory: "Approvals",
    label: "Approval Queue Alert",
    description: "Notify when new expense approval requests arrive",
    enabled: true,
  },
  {
    id: "ntf-expense-alert",
    category: "Notifications",
    subcategory: "Finance",
    label: "New Expense Alert",
    description: "Show notification when a new expense is added",
    enabled: true,
  },
  {
    id: "sec-audit-log",
    category: "Security",
    subcategory: "Audit",
    label: "Audit Log Active",
    description: "Track all user actions in the audit module",
    enabled: true,
  },
  {
    id: "data-camera-upload",
    category: "Data",
    subcategory: "Upload",
    label: "Camera Capture Upload",
    description: "Allow direct camera capture for evidence upload",
    enabled: true,
  },
];

export const INTEGRATION_CATALOG: Array<{ key: keyof IntegrationState; label: string; description: string }> = [
  { key: "cloudinary", label: "Cloudinary Upload", description: "Media upload for receipts and progress evidence" },
  { key: "realtime", label: "Supabase Realtime", description: "Live notifications for approvals and project updates" },
  { key: "aiVoice", label: "AI Voice Mode", description: "Speech input/output in SUMONIX AI chat" },
  { key: "offlineSync", label: "Offline Sync", description: "Background queue replay when connection restores" },
];
