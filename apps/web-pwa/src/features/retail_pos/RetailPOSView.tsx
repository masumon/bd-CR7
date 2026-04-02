"use client";

import { motion } from "framer-motion";
import { Minus, Plus, ScanLine } from "lucide-react";
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

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Products</CardTitle>
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
              <motion.div key={product.id} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="rounded-xl border border-border bg-background p-3 transition-all hover:-translate-y-0.5 hover:shadow-soft">
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-muted-foreground">${product.price}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Button variant="outline" className="h-8 w-8 p-0" onClick={() => remove(product.id)}>
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="min-w-6 text-center text-sm">{cart[product.id] || 0}</span>
                  <Button className="h-8 w-8 p-0" onClick={() => add(product.id)}>
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
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm transition-all hover:shadow-soft">
                <span>{p.name} x {cart[p.id]}</span>
                <span>${(p.price * (cart[p.id] || 0)).toFixed(2)}</span>
              </motion.div>
            ))}

          <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-3">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-semibold">${total.toFixed(2)}</p>
          </div>
          <Button className="w-full">Checkout</Button>
        </CardContent>
      </Card>
    </div>
  );
}
