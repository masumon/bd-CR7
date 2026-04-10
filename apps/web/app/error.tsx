"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // Keep runtime failures visible in logs for debugging.
    console.error("App runtime error:", error);
  }, [error]);

  return (
    <main className="page">
      <section className="card">
        <h1>Something went wrong</h1>
        <p>The app hit a runtime issue. Please retry.</p>
        <button onClick={reset}>Try again</button>
      </section>
    </main>
  );
}
