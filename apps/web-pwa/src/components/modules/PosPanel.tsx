"use client";

import { useState } from "react";

import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type CartLine = { product_id: string; quantity: number; label: string };

export function PosPanel() {
  const token = useAuthStore((s) => s.token);
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [message, setMessage] = useState("");

  const addByBarcode = async () => {
    if (!token || !barcode) return;
    try {
      const product = await apiRequest<{ id: string; name: string }>(`/pos/products/barcode/${barcode}`, {}, token);
      setCart((prev) => {
        const idx = prev.findIndex((x) => x.product_id === product.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
          return next;
        }
        return [...prev, { product_id: product.id, quantity: 1, label: product.name }];
      });
      setBarcode("");
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const checkout = async () => {
    if (!token || cart.length === 0) return;
    try {
      const response = await apiRequest<{ id: string; total_amount: string }>(
        "/pos/sales",
        {
          method: "POST",
          body: JSON.stringify({ items: cart.map((c) => ({ product_id: c.product_id, quantity: c.quantity })) }),
        },
        token
      );
      setMessage(`Sale ${response.id} completed. Total ${response.total_amount}`);
      setCart([]);
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  return (
    <section className="module">
      <h2>Retail POS</h2>
      <div className="formGrid">
        <input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Barcode" />
        <button onClick={addByBarcode} disabled={!token}>Add to cart</button>
        <button onClick={checkout} disabled={!token || cart.length === 0}>Checkout</button>
      </div>
      <ul>
        {cart.map((item) => (
          <li key={item.product_id}>{item.label} x {item.quantity}</li>
        ))}
      </ul>
      {message ? <p>{message}</p> : null}
    </section>
  );
}
