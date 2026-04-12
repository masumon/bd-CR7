# BD CR7 — Manual Setup & Deployment Guide

**Last Updated:** 2026-04-13  
**Audit Status:** Comprehensive resolution complete — 2 commits pushed to `main`  
**TypeScript Build:** ✅ Clean (`EXIT:0`) | **Python Syntax:** ✅ All files pass

> This file contains step-by-step instructions for tasks that require access to
> third-party dashboards and cannot be automated by code alone.
> Complete all **⚠️ ACTION REQUIRED** items before going to production.

---

## Automated Fixes Already Applied (Reference)

The following were fixed in code and pushed to GitHub — no manual action needed:

| Fix | Files Changed | Status |
| --- | ------------- | ------ |
| Settings service real DB calls | `apps/api/modules/settings/service.py` | ✅ Done |
| Dynamic service all CRUD methods | `apps/api/modules/dynamic/service.py` | ✅ Done |
| Email service (Resend via httpx) | `apps/api/core/email.py` | ✅ Done |
| `RESEND_API_KEY` config wiring | `apps/api/core/config.py` | ✅ Done |
| Vercel CORS conflict removed | `vercel.json` | ✅ Done |
| Vercel `apps/api/**` bundle fix | `vercel.json` | ✅ Done |
| `mangum` explicit dependency | `apps/api/requirements.txt` | ✅ Done |
| Type-safe `getErrorMessage()` utility | `apps/web/src/lib/errorUtils.ts` | ✅ Done |
| `as Error` cast replaced in **18 files** | Multiple (incl. locked modules) | ✅ Done |
| Dynamic tables migration SQL | `supabase/migrations/100_arch2_130_dynamic.sql` | ✅ Done |

---

## ⚠️ ACTION REQUIRED — Complete Before Production

---

### 1. Cloudinary Setup — Fix File Uploads

**Why:** `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
are currently `xxxxx` in `apps/web/.env.local`. All file/photo/evidence uploads will
fail until real credentials are set.

**Steps:**

1. Go to [cloudinary.com](https://cloudinary.com) → log in or create free account.
2. In your **Dashboard**, copy your **Cloud Name** (shown top-left).
3. Go to **Settings → Upload → Upload presets → Add upload preset**.
   - **Signing Mode:** `Unsigned`
   - **Allowed formats:** `jpg, jpeg, png, pdf, mp4, webp, gif`
   - Save and copy the **Preset Name**.
4. Open `apps/web/.env.local` and replace:
   ```env
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset_name_here
   ```
5. Add the same vars to **Vercel → Project → Settings → Environment Variables**
   (set for **Production**, **Preview**, and **Development**).
6. Redeploy on Vercel or restart local dev server.

**Affected features:** Evidence uploads, Project cover photos, Settings avatar,
File attachments throughout the app.

---

### 2. Google OAuth Setup — Enable Google Login

**Why:** The frontend calls `supabase.auth.signInWithOAuth({ provider: "google" })`.
Without this setup it silently returns `Provider not enabled`.

**Step A — Google Cloud Console:**

1. Open [console.cloud.google.com](https://console.cloud.google.com).
2. Create or select a project → **APIs & Services → Credentials**.
3. Click **Create Credentials → OAuth 2.0 Client IDs**.
4. **Application type:** `Web application`.
5. **Authorized redirect URIs** — add:
   ```
   https://ggbubeaxiznjgkekwxjv.supabase.co/auth/v1/callback
   ```
6. Click **Create** → copy **Client ID** and **Client Secret**.

**Step B — Supabase Dashboard:**

1. Open [supabase.com/dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Authentication → Providers → Google**.
3. Toggle **Enabled**.
4. Paste **Client ID** and **Client Secret** → **Save**.

**Step C — Vercel:** No extra env vars required (flows through Supabase).

---

### 3. Twilio Fallback SMS — Set `TWILIO_FROM_NUMBER`

**Why:** Primary OTP uses `TWILIO_VERIFY_SERVICE_SID` (already configured ✅).
The fallback Programmable SMS path needs `TWILIO_FROM_NUMBER` or the fallback will fail.

**Steps:**

1. Log in to [console.twilio.com](https://console.twilio.com).
2. Go to **Phone Numbers → Manage → Active Numbers**.
3. Copy a number in **E.164 format** (e.g., `+8801XXXXXXXXX`).
4. Set in root `.env`:
   ```env
   TWILIO_FROM_NUMBER=+8801XXXXXXXXX
   ```
5. Add `TWILIO_FROM_NUMBER` to **Vercel → Environment Variables** (Production + Preview).

---

### 4. Email Service (Resend) — Enable Custom Notifications

**Why:** `apps/api/core/email.py` is fully implemented but requires `RESEND_API_KEY`.
Without it, emails are silently skipped (deadline alerts, payment notices, reports
will not send — no crash, just no delivery).

**Steps:**

1. Go to [resend.com](https://resend.com) → create free account.
2. **API Keys → Create API Key** → copy the key (starts with `re_`).
3. **Domains → Add Domain** → add your sending domain and verify DNS:
   - Add the **TXT** and **MX** records shown to your domain registrar.
   - Wait for verification (usually 5–15 min).
4. Add to root `.env.local`:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
   EMAIL_FROM=noreply@yourdomain.com
   ```
   `EMAIL_FROM` must use the verified domain from step 3.
5. Add both vars to **Vercel → Settings → Environment Variables**.

**Email types available once configured:**

- `send_deadline_alert()` — project deadline warnings
- `send_payment_notification()` — payment processed notices
- `send_report_ready()` — report generation complete
- `send_approval_request()` — dual-approval workflow notifications

---

### 5. Apply Database Migration — Dynamic Module Tables

**Why:** `supabase/migrations/100_arch2_130_dynamic.sql` adds `custom_fields` and
`workflow_configs` tables. The `/api/dynamic/fields` and `/api/dynamic/workflows`
endpoints will return `502` until these tables exist.

**Option A — Supabase CLI (recommended):**
```bash
npx supabase login
npx supabase link --project-ref ggbubeaxiznjgkekwxjv
npx supabase db push
```

**Option B — Manual SQL:**

1. Open **Supabase Dashboard → SQL Editor**.
2. Open `supabase/migrations/100_arch2_130_dynamic.sql` in this repo.
3. Copy the entire file contents → paste into SQL Editor → **Run**.

---

### 6. Supabase RLS Policy Verification

**Why:** With real DB queries now executing in all modules, RLS policies actively
trigger. Verify none are accidentally too permissive or too restrictive.

**Verify in Supabase Dashboard → Table Editor → [table] → RLS:**

| Table | Required Policy |
|-------|----------------|
| `users` | Own row read; admins read all |
| `workspace_preferences` | Own row read/write only |
| `system_settings` | Admins write; authenticated read (sensitive masked in code) |
| `audit_logs` | Own logs read; admins/checkers read all |
| `custom_fields` | All authenticated read; admins write |
| `workflow_configs` | All authenticated read; admins write |
| `evidence` | All authenticated read; makers/checkers/admins write |
| `workers` | All authenticated read; admins/makers write |
| `expenses` | Own rows + admins/checkers see all |
| `materials` | All authenticated read; admins/makers write |
| `projects` | All authenticated read; admins/makers write |

**Quick test in SQL Editor:**

```sql
-- Should return only public/non-sensitive rows when run as anon
SET request.jwt.claims TO '{"role":"anon"}';
SELECT * FROM system_settings LIMIT 5;
```

---

### 7. Vercel Environment Variables — Complete Checklist

Go to **Vercel → Project → Settings → Environment Variables** and verify:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL              ✅ Already set
NEXT_PUBLIC_SUPABASE_ANON_KEY         ✅ Already set
SUPABASE_URL                          ✅ Already set
SUPABASE_ANON_KEY                     ✅ Already set
SUPABASE_SERVICE_ROLE_KEY             ✅ Already set

# Twilio
TWILIO_ACCOUNT_SID                    ✅ Already set
TWILIO_AUTH_TOKEN                     ✅ Already set
TWILIO_VERIFY_SERVICE_SID             ✅ Already set
TWILIO_FROM_NUMBER                    ⚠️  SET THIS — fallback SMS

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME     ⚠️  SET THIS — file uploads broken without it
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET  ⚠️  SET THIS — file uploads broken without it

# Email
RESEND_API_KEY                        ⚠️  SET THIS — email notifications
EMAIL_FROM                            ⚠️  SET THIS — verified sender address

# CORS (must match your production domain)
CORS_ORIGINS                          ✅ Already set
```

---

### 8. Post-Deploy Smoke Test Checklist

After setting all env vars and deploying, verify the following manually:

- [ ] **Login** — email/password login works
- [ ] **Google Login** — OAuth redirect completes and returns to dashboard
- [ ] **OTP** — SMS sent and verified via Twilio
- [ ] **File Upload** — attach a photo in Evidence module; check Cloudinary dashboard
- [ ] **Settings** — save a workspace preference (theme/language); reload and confirm it persists
- [ ] **Dynamic Fields** — create a custom field via `/api/dynamic/fields`
- [ ] **Email** — trigger a deadline alert and confirm delivery in Resend logs
- [ ] **Audit Log** — perform any action and check `/api/audit/logs` returns entries
- [ ] **Reports Dashboard** — `/api/reports/dashboard` returns real data (not zeros)

---

## Commit History (This Audit Cycle)

```text
b0bf757  fix(ts): extend getErrorMessage to all previously locked modules
389108c  fix: comprehensive audit resolution (DB queries, Vercel config, Email service, TS strict type)
```

Both commits are live on `main` → [github.com/masumon/bd-CR7](https://github.com/masumon/bd-CR7)
