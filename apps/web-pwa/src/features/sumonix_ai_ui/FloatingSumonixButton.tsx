"use client";

import { useState } from "react";

export function FloatingSumonixButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-700"
      >
        SUMONIX AI
      </button>
      {open ? (
        <div className="fixed bottom-24 right-6 z-50 w-72 rounded-xl border border-emerald-200 bg-white p-4 shadow-xl">
          <p className="text-sm font-semibold text-slate-900">SUMONIX AI Assistant</p>
          <p className="mt-2 text-xs text-slate-600">Ask for risk insights, cashflow trends, and anomaly checks.</p>
        </div>
      ) : null}
    </>
  );
}
