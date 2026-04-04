"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock3, Loader2, Minus, Plus, RefreshCw, Search, ShoppingBasket, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ActionMenu } from "@/components/ui/action-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { SectionHeader, WorkspaceHero } from "@/components/ui/workspace";
import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface Product {
  id: string;
  name: string;
  barcode: string;
  sell_price: number;
  stock_qty: number;
}

interface SaleHistoryRow {
  id: string;
  total_amount: number | string;
  created_at: string;
  customer_name?: string | null;
}

export function RetailPOSView() {
  const userId = useAuthStore((state) => state.userId);
  const token = useAuthStore((state) => state.token);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleHistoryRow[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All Products");

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    setErrorMsg("");
    try {
      const data = await apiRequest<Product[]>("/api/pos/products", {}, token || undefined);
      setProducts(data || []);
    } catch (err) {
      setProducts([]);
      setErrorMsg((err as Error).message || "Failed to load products.");
    }
    setLoadingProducts(false);
  }, [token]);

  const fetchSales = useCallback(async () => {
    if (!token) {
      setSales([]);
      return;
    }
    try {
      const data = await apiRequest<SaleHistoryRow[]>("/api/pos/sales", {}, token);
      setSales(data || []);
    } catch {
      setSales([]);
    }
  }, [token]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { void fetchSales(); }, [fetchSales]);

  const total = useMemo(
    () => Object.entries(cart).reduce((sum, [id, qty]) => {
      const p = products.find((pr) => pr.id === id);
      return sum + (p ? p.sell_price * qty : 0);
    }, 0),
    [cart, products]
  );

  const cartCount = useMemo(() => Object.values(cart).reduce((s, q) => s + q, 0), [cart]);
  const lowStockCount = useMemo(() => products.filter((product) => product.stock_qty > 0 && product.stock_qty <= 5).length, [products]);
  const outOfStockCount = useMemo(() => products.filter((product) => product.stock_qty <= 0).length, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const inTab =
        activeTab === "All Products" ||
        (activeTab === "Ready Stock" && product.stock_qty > 5) ||
        (activeTab === "Low Stock" && product.stock_qty > 0 && product.stock_qty <= 5) ||
        (activeTab === "Out of Stock" && product.stock_qty <= 0);

      const inQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.barcode.toLowerCase().includes(normalizedQuery);

      return inTab && inQuery;
    });
  }, [activeTab, products, query]);

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

    if (!token) {
      setErrorMsg("API token missing. Please login again.");
      setSaving(false);
      return;
    }

    const items = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ product_id: id, quantity: qty }));

    try {
      await apiRequest<{ id: string; total_amount: string }>(
        "/api/pos/sales",
        {
          method: "POST",
          body: JSON.stringify({ customer_id: null, items }),
        },
        token
      );
      setCart({});
      setSuccessMsg(`বিক্রয় সংরক্ষিত হয়েছে — Sale saved (৳${total.toLocaleString("en-BD")})`);
      setTimeout(() => setSuccessMsg(""), 4000);
      void fetchProducts();
      void fetchSales();
    } catch (err) {
      setErrorMsg((err as Error).message || "Checkout failed.");
    } finally {
      setSaving(false);
    }
  };

  const cartItems = products.filter((p) => (cart[p.id] || 0) > 0);

  return (
    <div className="space-y-4">
      <WorkspaceHero
        badge="POS Workspace / পজ ওয়ার্কস্পেস"
        stats={[
          { label: "Products", value: String(products.length) },
          { label: "Low Stock", value: String(lowStockCount) },
          { label: "Recent Sales", value: String(sales.length) },
        ]}
      />

      <SectionHeader
        eyebrow="Commerce Desk / বাণিজ্য ডেস্ক"
        title="Category, subcategory, and cashier flow"
        actions={
          <Button variant="outline" className="h-10 px-4 text-sm" onClick={fetchProducts} disabled={loadingProducts}>
            {loadingProducts ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}
            Refresh POS
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Product grid */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Catalog / পণ্য তালিকা</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">Category filters keep the POS list readable during busy sales flow.</p>
                </div>
                <Tabs tabs={["All Products", "Ready Stock", "Low Stock", "Out of Stock"]} value={activeTab} onChange={setActiveTab} />
              </div>
              <div className="flex items-center gap-2 rounded-[1.2rem] border border-border bg-background/90 px-3 py-3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                  placeholder="Search by product name or barcode"
                />
              </div>
            </div>
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
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                    className="rounded-2xl border border-border bg-background p-4 transition-all hover:-translate-y-0.5 hover:shadow-soft"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{product.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">Barcode: {product.barcode || "N/A"}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Stock: {product.stock_qty}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          ৳{product.sell_price.toLocaleString("en-BD")}
                        </span>
                        <ActionMenu
                          items={[
                            { label: "Add One", onClick: () => add(product.id) },
                            { label: "Remove One", onClick: () => remove(product.id) },
                            { label: "Clear From Cart", onClick: () => clearItem(product.id), tone: "danger" },
                          ]}
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-border/70 px-2.5 py-1 text-muted-foreground">
                        {product.stock_qty <= 0 ? "Out of Stock" : product.stock_qty <= 5 ? "Low Stock" : "Ready Stock"}
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
                {!filteredProducts.length ? (
                  <div className="rounded-2xl border border-dashed border-border bg-background/70 px-4 py-8 text-center text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
                    No products matched this category or search.
                  </div>
                ) : null}
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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-primary" />
            <CardTitle>Recent Sales / সাম্প্রতিক বিক্রয়</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-3">
          {sales.slice(0, 6).map((sale) => (
            <div key={sale.id} className="rounded-[1.25rem] border border-border/70 bg-background/75 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-foreground">#{sale.id.slice(0, 8).toUpperCase()}</span>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  ৳{Number(sale.total_amount || 0).toLocaleString("en-BD")}
                </span>
              </div>
              <p className="mt-2 text-muted-foreground">Customer: {sale.customer_name || "Walk-in"}</p>
              <p className="mt-1 text-xs text-muted-foreground">{sale.created_at?.replace("T", " ").slice(0, 16)}</p>
            </div>
          ))}
          {!sales.length ? <div className="rounded-2xl border border-dashed border-border bg-background/70 px-4 py-8 text-center text-sm text-muted-foreground lg:col-span-3">No sales history available yet.</div> : null}
        </CardContent>
      </Card>
    </div>
  );
}
