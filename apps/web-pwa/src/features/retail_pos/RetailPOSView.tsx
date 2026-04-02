"use client";

import { motion } from "framer-motion";
import { LayoutGrid, Minus, Plus, Receipt, ScanLine, ShoppingBasket } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const products = [
  { id: "p1", name: "Rice 5kg", price: 18 },
  { id: "p2", name: "Cooking Oil", price: 9 },
  { id: "p3", name: "Flour 2kg", price: 5 },
  { id: "p4", name: "Sugar 1kg", price: 2 },
  { id: "p5", name: "Milk 1L", price: 3 },
  { id: "p6", name: "Tea Pack", price: 4 },
];

export function RetailPOSView() {
  const [cart, setCart] = useState<Record<string, number>>({});

  const total = useMemo(
    () => Object.entries(cart).reduce((sum, [id, qty]) => sum + (products.find((p) => p.id === id)?.price || 0) * qty, 0),
    [cart]
  );

  const add = (id: string) => setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const remove = (id: string) => setCart((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) - 1) }));

  const cartCount = useMemo(() => Object.values(cart).reduce((sum, qty) => sum + qty, 0), [cart]);

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-white/85 via-white/80 to-primary/5 dark:from-slate-950/70 dark:via-slate-950/55 dark:to-primary/10">
        <CardContent className="grid gap-5 p-5 md:grid-cols-[1.1fr_0.9fr] md:p-6">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              POS Workspace
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">Organize products, cart actions, and checkout flow into clearer retail subcategories.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                The POS screen now exposes catalog browsing, quick-add controls, and cart summary as separate zones so outlet users can scan faster on tablet and mobile screens.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { title: "Catalog", desc: "Browse fast-moving items by card", icon: LayoutGrid },
                { title: "Cart", desc: "Track quantity and running total instantly", icon: ShoppingBasket },
                { title: "Checkout", desc: "Prepare receipt and cashier completion", icon: Receipt },
              ].map(({ title, desc, icon: Icon }) => (
                <div key={title} className="rounded-2xl border border-border/70 bg-background/75 p-4">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Outlet Snapshot</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 md:grid-cols-1">
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">SKUs listed</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{products.length}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Units in cart</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{cartCount}</p>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                Use barcode or quick-add controls to keep the counter flow short for cashier operations.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Products</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Product category cards with immediate quantity control.</p>
            </div>
            <Button variant="outline">
              <ScanLine className="mr-2 h-4 w-4" /> Barcode Scan
            </Button>
          </CardHeader>
          <CardContent>
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {products.map((product) => (
                <motion.div key={product.id} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="rounded-2xl border border-border bg-background p-4 transition-all hover:-translate-y-0.5 hover:shadow-soft">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">Fast moving grocery item</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">${product.price}</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Button variant="outline" className="h-9 w-9 p-0" onClick={() => remove(product.id)}>
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="min-w-8 text-center text-sm font-semibold text-foreground">{cart[product.id] || 0}</span>
                    <Button className="h-9 w-9 p-0" onClick={() => add(product.id)}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Cart</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {products
              .filter((p) => (cart[p.id] || 0) > 0)
              .map((p) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between rounded-2xl border border-border bg-background px-3 py-3 text-sm transition-all hover:shadow-soft">
                  <span>{p.name} x {cart[p.id]}</span>
                  <span className="font-medium text-foreground">${(p.price * (cart[p.id] || 0)).toFixed(2)}</span>
                </motion.div>
              ))}

            {cartCount === 0 ? <div className="rounded-2xl border border-dashed border-border bg-background/70 px-4 py-5 text-center text-sm text-muted-foreground">No items in cart yet. Start adding products from the catalog.</div> : null}

            <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Total</p>
              <p className="text-2xl font-semibold text-foreground">${total.toFixed(2)}</p>
            </div>
            <Button className="w-full">Checkout</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
