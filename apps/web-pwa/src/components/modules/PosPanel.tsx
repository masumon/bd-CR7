"use client";

import { useState } from "react";

import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type CartLine = { product_id: string; quantity: number; label: string; price?: number };

export function PosPanel() {
  const token = useAuthStore((s) => s.token);
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [message, setMessage] = useState("");

  const addByBarcode = async () => {
    if (!token || !barcode) return;
    try {
      const product = await apiRequest<{ id: string; name: string; price?: number }>(`/pos/products/barcode/${barcode}`, {}, token);
      setCart((prev) => {
        const idx = prev.findIndex((x) => x.product_id === product.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
          return next;
        }
        return [...prev, { product_id: product.id, quantity: 1, label: product.name, price: product.price }];
      });
      setBarcode("");
      setMessage("");
    } catch (error) {
      setMessage(`Product not found: ${barcode}`);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((x) => x.product_id !== productId));
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
      <div style={{marginTop:'12px'}}>
        {cart.length > 0 ? (
          <>
            <h3 style={{fontSize:'12px',color:'var(--muted)',margin:'8px 0'}}>Cart ({cart.length} items)</h3>
            <div style={{fontSize:'12px',maxHeight:'160px',overflowY:'auto'}}>
              {cart.map((item) => (
                <div key={item.product_id} style={{display:'flex',justifyContent:'space-between',padding:'6px',borderBottom:'1px solid var(--line)',alignItems:'center'}}>
                  <div>{item.label} x{item.quantity}</div>
                  <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                    {item.price && <span>${(item.price * item.quantity).toFixed(2)}</span>}
                    <button onClick={() => removeFromCart(item.product_id)} style={{padding:'2px 6px',fontSize:'11px',background:'#a2402f',color:'white'}}>Remove</button>
                  </div>
                </div>
              ))}
              <div style={{padding:'8px',borderTop:'2px solid var(--accent)',marginTop:'8px',fontWeight:'700'}}>
                Total: ${cart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0).toFixed(2)}
              </div>
            </div>
          </>
        ) : <p style={{color:'var(--muted)',fontSize:'12px'}}>Cart empty</p>}
      </div>
      {message ? <p>{message}</p> : null}
    </section>
  );
}
