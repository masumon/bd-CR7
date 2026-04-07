"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type ThemeMode = "dark" | "light" | "system";

function resolveEffectiveDark(mode: ThemeMode): boolean {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return true;
}

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("bdcr7-theme") as ThemeMode | null;
    const initial: ThemeMode = stored === "light" || stored === "system" ? stored : "dark";
    setMode(initial);
    document.documentElement.classList.toggle("dark", resolveEffectiveDark(initial));

    if (initial === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle("dark", e.matches);
      };
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
  }, []);

  const cycle = () => {
    const next: ThemeMode = mode === "dark" ? "light" : mode === "light" ? "system" : "dark";
    setMode(next);
    localStorage.setItem("bdcr7-theme", next);
    document.documentElement.classList.toggle("dark", resolveEffectiveDark(next));
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
