"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Bell, Languages, LogOut, Menu, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SyncBadge } from "@/components/appshell/SyncBadge";
import { getMyProfileCached } from "@/lib/userProfileCache";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

type TopBarProps = {
  title: string;
  online: boolean;
  unread: number;
  dark: boolean;
  language: "en" | "bn";
  role?: string | null;
  onMenu: () => void;
  onToggleTheme: () => void;
  onToggleLanguage: () => void;
  onOpenNotifications: () => void;
  onOpenUserDrawer: () => void;
};

export function TopBar({ title, online, unread, dark, language, role, onMenu, onToggleTheme, onToggleLanguage, onOpenNotifications, onOpenUserDrawer }: TopBarProps) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token ?? undefined);
  const logout = useAuthStore((s) => s.logout);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setProfileImageUrl(null);
      return;
    }

    let cancelled = false;
    const loadProfileImage = async () => {
      try {
        const profile = await getMyProfileCached(token);
        if (!cancelled) {
          setProfileImageUrl(typeof profile?.profile_image_url === "string" ? profile.profile_image_url : null);
        }
      } catch {
        if (!cancelled) {
          setProfileImageUrl(null);
        }
      }
    };

    void loadProfileImage();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const initials = useMemo(() => (role ? role.slice(0, 2).toUpperCase() : "U"), [role]);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const actionLabels = {
    theme: language === "bn" ? "থিম" : "Theme",
    language: language === "bn" ? "ভাষা" : "Language",
    notifications: language === "bn" ? "অ্যালার্ট" : "Alerts",
    logout: language === "bn" ? "লগআউট" : "Logout",
    me: language === "bn" ? "প্রোফাইল" : "Profile",
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-10 h-[calc(72px+env(safe-area-inset-top))] border-b border-border/65 bg-background/88 px-2 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" className="h-11 w-11 p-0 lg:hidden" onClick={onMenu} aria-label={language === "bn" ? "মেনু খুলুন" : "Open menu"}>
            <Menu className="h-5 w-5" />
          </Button>

          <Link
            href="/dashboard"
            className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-muted/30 shadow-sm transition hover:border-primary/45"
            aria-label={language === "bn" ? "ড্যাশবোর্ড" : "Dashboard"}
            title={title}
          >
            <Image src="/icons/icon.svg" alt="BD CR7 Logo" width={36} height={36} className="h-9 w-9 object-contain" />
          </Link>

          <span
            className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", online ? "bg-emerald-400" : "bg-rose-500")}
            aria-label={online ? "Online" : "Offline"}
            title={online ? "Online" : "Offline"}
          />
          <SyncBadge online={online} language={language} />
        </div>

        <div className="flex items-center gap-0.5">
          <Button variant="ghost" className="flex h-12 w-12 flex-col items-center justify-center gap-0.5 p-0" onClick={onToggleTheme} aria-label={language === "bn" ? "থিম পরিবর্তন" : "Toggle theme"}>
            {dark ? <Sun className="h-5 w-5 text-gold" /> : <Moon className="h-5 w-5" />}
            <span className="font-[var(--font-outfit)] text-[11px] leading-none text-muted-foreground">{actionLabels.theme}</span>
          </Button>

          <Button variant="ghost" className="flex h-12 w-12 flex-col items-center justify-center gap-0.5 p-0" type="button" onClick={onToggleLanguage} aria-label={language === "bn" ? "ভাষা পরিবর্তন" : "Toggle language"}>
            <Languages className="h-5 w-5" />
            <span className="font-[var(--font-outfit)] text-[11px] leading-none text-muted-foreground">{actionLabels.language}</span>
          </Button>

          <Button variant="ghost" className="relative flex h-12 w-12 flex-col items-center justify-center gap-0.5 p-0" onClick={onOpenNotifications} aria-label={language === "bn" ? "নোটিফিকেশন" : "Notifications"}>
            <Bell className="h-5 w-5" />
            <span className="font-[var(--font-outfit)] text-[11px] leading-none text-muted-foreground">{actionLabels.notifications}</span>
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Button>

          <Button
            variant="ghost"
            className="flex h-12 w-12 flex-col items-center justify-center gap-0.5 p-0 text-rose-400 hover:text-rose-300"
            type="button"
            onClick={handleLogout}
            aria-label={language === "bn" ? "লগআউট" : "Logout"}
          >
            <LogOut className="h-5 w-5" />
            <span className="font-[var(--font-outfit)] text-[11px] leading-none text-muted-foreground">{actionLabels.logout}</span>
          </Button>

          <button
            className={cn(
              "ml-0.5 flex h-12 w-12 flex-col items-center justify-center overflow-hidden rounded-full text-xs font-bold",
              "border border-border/50 bg-gradient-to-br from-primary/80 to-primary text-primary-foreground shadow-sm",
              "transition hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            )}
            type="button"
            onClick={onOpenUserDrawer}
            aria-label={language === "bn" ? "ইউজার প্রোফাইল খুলুন" : "Open user profile"}
            title={actionLabels.me}
          >
            {profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profileImageUrl} alt="Profile" className="h-full w-full rounded-full object-cover" />
            ) : (
              initials
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
