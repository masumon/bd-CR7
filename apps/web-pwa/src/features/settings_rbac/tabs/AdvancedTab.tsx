"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminDataResetPanel } from "@/features/settings_rbac/tabs/AdminDataResetPanel";

type AdvancedTabProps = {
  onReset: () => void;
};

export function AdvancedTab({ onReset }: AdvancedTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Advanced Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
          <p className="text-sm font-medium text-foreground">Reset Local Workspace Preferences</p>
          <p className="mt-1 text-xs text-muted-foreground">Clears theme, language, settings catalog, integration toggles, and notification cache from this device.</p>
          <Button className="mt-3 h-11 px-4" variant="outline" onClick={onReset}>Reset Local Preferences</Button>
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

        <AdminDataResetPanel />
      </CardContent>
    </Card>
  );
}
