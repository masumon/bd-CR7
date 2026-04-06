import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

let browserClient: SupabaseClient | null = null;

export const supabase: SupabaseClient | null = hasSupabaseEnv
  ? (() => {
      if (!browserClient) {
        browserClient = createBrowserClient(supabaseUrl as string, supabaseAnonKey as string) as unknown as SupabaseClient;
      }
      return browserClient;
    })()
  : null;
