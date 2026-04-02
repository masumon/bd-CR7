import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ImportPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Import & Supply</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <div className="rounded-xl border border-border bg-background p-4">L/C tracker, landed cost calculator, and customs queue UI are ready for workflow binding.</div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="skeleton h-20" />
          <div className="skeleton h-20" />
          <div className="skeleton h-20" />
        </div>
      </CardContent>
    </Card>
  );
}
