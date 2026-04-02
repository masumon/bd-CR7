/**
 * Re-export the Supabase singleton as a createClient() factory.
 * This allows new code to follow the standard Supabase SSR pattern
 * while the underlying client is still the shared singleton.
 */
import { createClient as _create } from "@supabase/supabase-js";

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createClient() {
  return _create(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}
