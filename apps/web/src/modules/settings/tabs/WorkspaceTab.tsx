import { Languages, Moon, Sun } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type WorkspaceTabProps = {
  dark: boolean;
  language: "en" | "bn";
  setDark: (value: boolean) => void;
  setLanguage: (value: "en" | "bn") => void;
};

export function WorkspaceTab({ dark, language, setDark, setLanguage }: WorkspaceTabProps) {
  return (
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
  );
}
