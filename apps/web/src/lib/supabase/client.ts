import type { SupabaseClient } from "@supabase/supabase-js";

import { safeSupabase as supabase } from "@/lib/safeSupabase";

export function createClient(): SupabaseClient {
  if (!supabase) {
    throw new Error("Supabase env vars missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return supabase;
}
