export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-sm rounded-md border border-border bg-card p-4 text-center">
        <h1 className="text-base font-semibold">Offline Mode</h1>
        <p className="mt-2 text-sm text-muted-foreground">No connection. Cached pages are still available.</p>
      </div>
    </main>
  );
}
