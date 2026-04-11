"use client";

import { useEffect } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

type ThemeMode = "dark" | "light" | "system";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mode: ThemeMode = theme === "light" || theme === "system" ? theme : "dark";

  useEffect(() => {
    const stored = localStorage.getItem("bdcr7-theme") as ThemeMode | null;
    const initial: ThemeMode = stored === "light" || stored === "system" ? stored : "dark";
    setTheme(initial);
  }, [setTheme]);

  const cycle = () => {
    const next: ThemeMode = mode === "dark" ? "light" : mode === "light" ? "system" : "dark";
    setTheme(next);
    localStorage.setItem("bdcr7-theme", next);
  };

  const icon =
    mode === "dark" ? <Sun className="h-4 w-4" /> :
    mode === "light" ? <Moon className="h-4 w-4" /> :
    <Monitor className="h-4 w-4" />;

  const label =
    mode === "dark" ? "Switch to light mode" :
    mode === "light" ? "Switch to system theme" :
    "Switch to dark mode";

  return (
    <button type="button" onClick={cycle} aria-label={label} className="theme-toggle-bdcr7">
      {icon}
    </button>
  );
}
