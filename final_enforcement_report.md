# Enforcement Status

Direct DB Writes: BLOCKED
Bypass Mode: AVAILABLE (manual trigger)
Read Queries: ALLOWED

---

Bypass Control:

- Enable (dev/admin manual): window.__ALLOW_DB_WRITE__ = true
- Disable: window.__ALLOW_DB_WRITE__ = false

---

Guard Coverage:

- Guard file created: apps/web-pwa/src/lib/safeSupabase.ts
- Supabase imports replaced globally with safeSupabase alias in all direct @/lib/supabase import sites.
- Backend/API code paths unchanged.

---

Validation:

1. insert/update/delete without bypass -> FAIL (throws DIRECT_DB_WRITE_BLOCKED)
2. insert/update/delete with bypass -> WORK (forwards to native Supabase write)
3. select -> WORK (read methods pass through unchanged)
4. API -> WORK (apiClient flow untouched)
