"use client";

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-card p-6 text-center shadow-lg">
        {/* Offline icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7 text-amber-600 dark:text-amber-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>

        <div>
          <h1 className="text-base font-semibold text-foreground">You are offline</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            No internet connection. Cached pages are still available.
          </p>
        </div>

        <ul className="space-y-1.5 text-left text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0 text-emerald-500">✓</span>
            Previously visited pages are accessible from cache
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0 text-emerald-500">✓</span>
            Data entered offline will sync automatically when back online
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0 text-amber-500">⚠</span>
            Live data (AI, reports) requires a connection
          </li>
        </ul>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full rounded-lg border border-border bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
