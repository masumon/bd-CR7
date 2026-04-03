"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Minus, Plus, RefreshCw, ShoppingBasket, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";

interface Product {
  id: string;
  name: string;
  barcode: string;
  sell_price: number;
  stock_qty: number;
}

const FALLBACK_PRODUCTS: Product[] = [
  { id: "p1", name: "Rice 5kg", barcode: "00001", sell_price: 580, stock_qty: 100 },
  { id: "p2", name: "Cooking Oil 1L", barcode: "00002", sell_price: 195, stock_qty: 50 },
  { id: "p3", name: "Flour 2kg", barcode: "00003", sell_price: 120, stock_qty: 80 },
  { id: "p4", name: "Sugar 1kg", barcode: "00004", sell_price: 90, stock_qty: 60 },
  { id: "p5", name: "Milk 1L", barcode: "00005", sell_price: 75, stock_qty: 40 },
  { id: "p6", name: "Tea Pack 100g", barcode: "00006", sell_price: 55, stock_qty: 70 },
];

export function RetailPOSView() {
  const supabase = useMemo(() => createClient(), []);
  const userId = useAuthStore((state) => state.userId);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    const { data, error } = await supabase
      .from("products")
      .select("id,name,barcode,sell_price,stock_qty")
      .order("name")
      .limit(60);
    if (error || !data || data.length === 0) {
      setProducts(FALLBACK_PRODUCTS);
    } else {
      setProducts(data as Product[]);
    }
    setLoadingProducts(false);
  }, [supabase]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const total = useMemo(
    () => Object.entries(cart).reduce((sum, [id, qty]) => {
      const p = products.find((pr) => pr.id === id);
      return sum + (p ? p.sell_price * qty : 0);
    }, 0),
    [cart, products]
  );

  const cartCount = useMemo(() => Object.values(cart).reduce((s, q) => s + q, 0), [cart]);

  const add = (id: string) => setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const remove = (id: string) => setCart((prev) => {
    const next = { ...prev, [id]: (prev[id] || 1) - 1 };
    if (next[id] <= 0) delete next[id];
    return next;
  });
  const clearItem = (id: string) => setCart((prev) => { const n = { ...prev }; delete n[id]; return n; });

  const handleCheckout = async () => {
    if (!cartCount) return;
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (!userId) {
      setErrorMsg("Login required to save sale.");
      setSaving(false);
      return;
    }

    // Insert sale
    const { data: saleData, error: saleErr } = await supabase
      .from("sales")
      .insert({ cashier_id: userId, total_amount: total, customer_id: null })
      .select("id")
      .single();

    if (saleErr || !saleData) {
      setErrorMsg(saleErr?.message || "Failed to create sale.");
      setSaving(false);
      return;
    }

    const saleId = saleData.id as string;
    const items = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const p = products.find((pr) => pr.id === id)!;
        return { sale_id: saleId, product_id: id, quantity: qty, unit_price: p.sell_price, line_total: p.sell_price * qty };
      });

    const { error: itemsErr } = await supabase.from("sale_items").insert(items);
    setSaving(false);
    if (itemsErr) {
      setErrorMsg(itemsErr.message);
      return;
    }
    setCart({});
    setSuccessMsg(`বিক্রয় সংরক্ষিত হয়েছে — Sale saved (৳${total.toLocaleString("en-BD")})`);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const cartItems = products.filter((p) => (cart[p.id] || 0) > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Retail POS</h2>
          <p className="mt-1 text-sm text-muted-foreground">{products.length} products • {cartCount} in cart</p>
        </div>
        <Button variant="outline" className="h-8 px-3 text-xs" onClick={fetchProducts} disabled={loadingProducts}>
          {loadingProducts ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Product grid */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>পণ্য তালিকা — Products</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProducts ? (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
              >
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                    className="rounded-2xl border border-border bg-background p-4 transition-all hover:-translate-y-0.5 hover:shadow-soft"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{product.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">Stock: {product.stock_qty}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        ৳{product.sell_price.toLocaleString("en-BD")}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Button variant="outline" className="h-8 w-8 p-0" onClick={() => remove(product.id)}>
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="min-w-8 text-center text-sm font-semibold text-foreground">{cart[product.id] || 0}</span>
                      <Button className="h-8 w-8 p-0" onClick={() => add(product.id)}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Cart */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShoppingBasket className="h-4 w-4 text-primary" />
              <CardTitle>Cart ({cartCount})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <AnimatePresence>
              {cartItems.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-between rounded-2xl border border-border bg-background px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">x{cart[p.id]} • ৳{(p.sell_price * cart[p.id]).toLocaleString("en-BD")}</p>
                  </div>
                  <button
                    type="button"
                    className="ml-2 shrink-0 rounded-lg p-1 text-muted-foreground hover:text-rose-600"
                    onClick={() => clearItem(p.id)}
                    aria-label={`Remove ${p.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {cartCount === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-background/70 px-4 py-5 text-center text-sm text-muted-foreground">
                Cart is empty — add products from the catalog
              </div>
            ) : null}

            <div className="mt-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">মোট — Total</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">৳{total.toLocaleString("en-BD")}</p>
            </div>

            {successMsg ? (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            ) : null}
            {errorMsg ? (
              <p className="text-sm text-rose-600">{errorMsg}</p>
            ) : null}

            <Button
              className="w-full"
              onClick={handleCheckout}
              disabled={cartCount === 0 || saving}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {saving ? "Processing..." : "Checkout & Save Sale"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
