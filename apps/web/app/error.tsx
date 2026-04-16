"use client";

import { useEffect, useState } from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    // Keep runtime failures visible in logs for debugging.
    console.error("App runtime error:", error);
  }, [error]);

  return (
    <main className="page">
      <section className="card">
        <h1>Something went wrong</h1>
        <p>{attempts >= 2 ? "The retry limit was reached. Please reload or sign in again." : "The app hit a runtime issue. Please retry."}</p>
        <button
          onClick={() => {
            if (attempts >= 2) {
              return;
            }
            setAttempts((value) => value + 1);
            reset();
          }}
          disabled={attempts >= 2}
        >
          {attempts >= 2 ? "Retry limit reached" : "Try again"}
        </button>
      </section>
    </main>
  );
}
