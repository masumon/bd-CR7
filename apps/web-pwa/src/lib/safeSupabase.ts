import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

type WriteOp = "insert" | "update" | "delete";

const isBypassEnabled = () =>
  typeof window !== "undefined" && (window as unknown as { __ALLOW_DB_WRITE__?: boolean }).__ALLOW_DB_WRITE__ === true;

const blocked = (op: WriteOp) => {
  console.error(`BLOCKED DB WRITE: ${op}`);
  throw new Error("DIRECT_DB_WRITE_BLOCKED");
};

function wrapQuery<T extends object>(query: T): T {
  return new Proxy(query, {
    get(target, prop, receiver) {
      if (prop === "insert" || prop === "update" || prop === "delete") {
        const op = prop as WriteOp;
        return (...args: unknown[]) => {
          if (isBypassEnabled()) {
            const fn = (target as Record<string, (...innerArgs: unknown[]) => unknown>)[op];
            return fn(...args);
          }
          return blocked(op);
        };
      }

      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

export const safeSupabase: SupabaseClient | null = supabase
  ? (new Proxy(supabase as SupabaseClient & { from: (table: string) => object }, {
      get(target, prop, receiver) {
        if (prop === "from") {
          return (table: string) => wrapQuery(target.from(table));
        }

        const value = Reflect.get(target, prop, receiver);
        return typeof value === "function" ? value.bind(target) : value;
      },
    }) as SupabaseClient)
  : null;
