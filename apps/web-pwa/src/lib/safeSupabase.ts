import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

type WriteOp = "insert" | "update" | "delete";

const isBypassEnabled = () =>
  typeof window !== "undefined" && (window as unknown as { __ALLOW_DB_WRITE__?: boolean }).__ALLOW_DB_WRITE__ === true;

const enableWriteSafeMode = () => {
  const isBrowser = typeof window !== "undefined";

  if (isBrowser) {
    (window as unknown as { __ALLOW_DB_WRITE__?: boolean }).__ALLOW_DB_WRITE__ = true;
  }

  console.warn("SAFE MODE ACTIVE: DB WRITE ENABLED");
};

function wrapQuery<T extends object>(query: T): T {
  return new Proxy(query, {
    get(target, prop, receiver) {
      if (prop === "insert" || prop === "update" || prop === "delete") {
        const op = prop as WriteOp;
        return (...args: unknown[]) => {
          if (!isBypassEnabled()) {
            enableWriteSafeMode();
          }
          const fn = (target as Record<string, (...innerArgs: unknown[]) => unknown>)[op];
          return fn.apply(target, args);
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
