"use client";

import { FormEvent, useState } from "react";

import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export function ImportSupplyPanel() {
  const token = useAuthStore((s) => s.token);
  const [supplier, setSupplier] = useState("");
  const [lcNumber, setLcNumber] = useState("");
  const [amount, setAmount] = useState("0");
  const [message, setMessage] = useState("");

  const createLc = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    try {
      const response = await apiRequest<{ id: string }>(
        "/api/import-supply/lc-records",
        {
          method: "POST",
          body: JSON.stringify({
            supplier_name: supplier,
            lc_number: lcNumber,
            currency: "USD",
            amount: Number(amount),
            expected_arrival: new Date().toISOString().slice(0, 10),
          }),
        },
        token
      );
      setMessage(`LC record created: ${response.id}`);
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  return (
    <section className="module">
      <h2>Import Supply</h2>
      <form onSubmit={createLc} className="formGrid">
        <input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Supplier" />
        <input value={lcNumber} onChange={(e) => setLcNumber(e.target.value)} placeholder="L/C Number" />
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" type="number" />
        <button type="submit" disabled={!token}>Create LC</button>
      </form>
      {message ? <p>{message}</p> : null}
    </section>
  );
}
