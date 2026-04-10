// safeSupabase.ts — previously a write-interception proxy that could be
// trivially bypassed via `window.__ALLOW_DB_WRITE__ = true` in DevTools.
// The proxy provided no real security. Now a simple re-export of the
// standard Supabase browser client so all existing imports continue to work.
export { supabase as safeSupabase } from "@/lib/supabase";
