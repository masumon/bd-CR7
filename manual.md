# BD CR7 — Manual Setup Guide

This file contains step-by-step instructions for tasks that require access to
third-party dashboards and cannot be automated by code changes alone.

---

## 1. Cloudinary Setup — Fix File Uploads

**Why:** `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
are currently set to `xxxxx` in `apps/web/.env.local`. All file uploads will fail until
real credentials are provided.

**Steps:**

1. Go to [cloudinary.com](https://cloudinary.com) and log in (or create a free account).
2. In the **Dashboard**, find your **Cloud Name** (top-left of the dashboard).
3. Go to **Settings → Upload → Upload presets**.
4. Click **Add upload preset**.
   - Set **Signing Mode** to `Unsigned`.
   - Configure allowed formats (e.g., `jpg, jpeg, png, pdf, mp4`).
   - Save the preset and copy its **Preset Name**.
5. Open `apps/web/.env.local` and replace the placeholders:
   ```env
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_actual_preset_name
   ```
6. Also add these values to Vercel environment variables:
   - **Vercel Dashboard → Project → Settings → Environment Variables**
   - Add `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
     for **Production**, **Preview**, and **Development** environments.
7. Redeploy or restart your dev server for the changes to take effect.

---

## 2. Google OAuth Setup — Enable Google Login

**Why:** The frontend calls `supabase.auth.signInWithOAuth({ provider: "google" })`.
This will fail with `Provider not enabled` until Google is configured in Supabase.

**Steps:**

### A — Google Cloud Console
1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Create a new project (or select existing).
3. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client IDs**.
4. Set **Application type** to `Web application`.
5. Under **Authorized redirect URIs**, add:
   ```
   https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
   ```
   Replace `<your-supabase-project-ref>` with your Supabase project reference
   (visible in `NEXT_PUBLIC_SUPABASE_URL`, e.g., `ggbubeaxiznjgkekwxjv`).
6. Click **Create** and copy the **Client ID** and **Client Secret**.

### B — Supabase Dashboard
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → your project.
2. Navigate to **Authentication → Providers**.
3. Find **Google** and toggle it **Enabled**.
4. Paste your **Client ID** and **Client Secret**.
5. Save.

### C — Vercel (Production)
- No additional env vars needed; Google OAuth flows through Supabase, which
  already has `SUPABASE_URL` and `SUPABASE_ANON_KEY` configured.

---

## 3. Twilio Fallback SMS Setup

**Why:** The primary OTP path uses `TWILIO_VERIFY_SERVICE_SID` (already configured).
If that service is unavailable, the backend falls back to Programmable SMS, which
requires `TWILIO_FROM_NUMBER`.

**Steps:**

1. Log in to [console.twilio.com](https://console.twilio.com).
2. Go to **Phone Numbers → Manage → Active Numbers**.
3. Copy a Twilio phone number in **E.164 format** (e.g., `+12025551234`).
4. Open the root `.env` file and set:
   ```env
   TWILIO_FROM_NUMBER=+12025551234
   ```
5. Also add `TWILIO_FROM_NUMBER` to Vercel environment variables
   (Production + Preview environments).

---

## 4. Email Service Setup (Resend) — Enable Custom Notifications

**Why:** The `core/email.py` module is implemented and wired up, but it requires
`RESEND_API_KEY` to actually send emails. Without this key, email sending is silently
skipped (no crashes, no notifications).

**Steps:**

1. Go to [resend.com](https://resend.com) and create a free account.
2. Go to **API Keys → Create API Key**.
3. Copy the key (starts with `re_`).
4. Go to **Domains → Add Domain** and verify your sending domain.
   - Follow DNS verification steps (add TXT/MX records to your domain registrar).
5. Open root `.env.local` and add:
   ```env
   RESEND_API_KEY=re_your_actual_key_here
   EMAIL_FROM=noreply@yourdomain.com
   ```
   `EMAIL_FROM` must use a verified domain from step 4.
6. Add both vars to **Vercel → Settings → Environment Variables**.

---

## 5. Supabase Migration — Apply Dynamic Module Tables

**Why:** A new migration file `supabase/migrations/100_arch2_130_dynamic.sql` was
created to add `custom_fields` and `workflow_configs` tables. These tables must be
applied to your Supabase database before the `/api/dynamic/fields` and
`/api/dynamic/workflows` endpoints will work.

**Steps:**

### Option A — Supabase CLI (recommended)
```bash
npx supabase db push
```
This applies all pending migrations to your linked Supabase project.

### Option B — Manual SQL
1. Go to **Supabase Dashboard → SQL Editor**.
2. Open `supabase/migrations/100_arch2_130_dynamic.sql`.
3. Copy the full contents and paste into the SQL Editor.
4. Click **Run**.

---

## 6. Supabase RLS Policy Verification

**Why:** With real DB queries now executing in all modules (settings, dynamic,
evidence, projects, etc.), Row Level Security policies will actively trigger.
Previously, many endpoints returned empty data without hitting the DB.

**Checklist — verify in Supabase Dashboard → Authentication → Policies:**

| Table | Expected Policy |
|-------|----------------|
| `users` | Users can read own row; admins can read all |
| `workspace_preferences` | Users can read/write own row only |
| `system_settings` | Admins can write; all authenticated can read non-sensitive |
| `audit_logs` | Users can read own logs; admins/checkers can read all |
| `custom_fields` | All authenticated can read; admins can write |
| `workflow_configs` | All authenticated can read; admins can write |
| `evidence` | All authenticated can read; makers/checkers/admins can write |
| `workers` | All authenticated can read; admins/makers can write |
| `expenses` | Users see own rows; admins/checkers see all |
| `materials` | All authenticated can read; admins/makers can write |
| `projects` | All authenticated can read; admins/makers can write |

**Test steps:**
1. In **Supabase Dashboard → Table Editor**, select a table.
2. Click **RLS** to view active policies.
3. Use the **SQL Editor** to run a test query as `anon` role to verify no
   unauthorised data is exposed.

---

## 7. Vercel Environment Variables — Final Checklist

Ensure all of the following are set in **Vercel → Project → Settings → Environment Variables**:

```
NEXT_PUBLIC_SUPABASE_URL           ✅ (already set)
NEXT_PUBLIC_SUPABASE_ANON_KEY      ✅ (already set)
SUPABASE_SERVICE_ROLE_KEY          ✅ (already set)
SUPABASE_URL                       ✅ (already set)
SUPABASE_ANON_KEY                  ✅ (already set)
TWILIO_ACCOUNT_SID                 ✅ (already set)
TWILIO_AUTH_TOKEN                  ✅ (already set)
TWILIO_VERIFY_SERVICE_SID          ✅ (already set)
TWILIO_FROM_NUMBER                 ⚠️  SET THIS (Twilio fallback)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME  ⚠️  SET THIS (file uploads)
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ⚠️ SET THIS (file uploads)
RESEND_API_KEY                     ⚠️  SET THIS (email notifications)
EMAIL_FROM                         ⚠️  SET THIS (email notifications)
CORS_ORIGINS                       ✅ (should match your prod domain)
```
