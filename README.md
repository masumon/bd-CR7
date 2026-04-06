# BD CR7 Ultra Enterprise

Core-only production ERP monorepo with mobile-first PWA UX, FastAPI backend, and SUMONIX AI assistance.

## Live
- Production: https://bd-cr7.vercel.app

## Current Core Scope
Core module surface is intentionally narrowed to:
- Dashboard
- Projects
- Finance
- Workforce
- Materials
- Evidence
- Reports
- SUMONIX AI
- Audit
- Contractor
- Settings

Non-core routes are blocked in middleware for safety.

## Architecture Snapshot
- Frontend: Next.js 15 PWA in `apps/web-pwa`
- Backend: FastAPI in `apps/api-core-python`
- DB/Auth: Supabase PostgreSQL + RLS
- Monorepo: PNPM workspaces + Turborepo
- Entrypoint bridge: `api/main.py`
- Deploy targets: Vercel (frontend) + Render config available for backend

Reference architecture document:
- `CURRENT_ARCHITECTURE.md`

## Monorepo Layout
```text
apps/
  api-core-python/      FastAPI backend
  web-pwa/              Next.js PWA frontend
packages/
  core-logic/
  media-engine/
  rbac-engine/
  ui-system/
supabase/
  migrations/           SQL migrations
api/
  main.py               Vercel python entrypoint shim
```

## Recent UX Upgrade Highlights
- Cleaner app shell hierarchy (top bar, sidebar, bottom nav)
- Improved spacing, readability, and active-state feedback
- Better dialog clarity and notification readability
- Smooth page/surface polish while preserving existing functionality
- Mobile-safe interactions with consistent touch targets

## Prerequisites
- Node.js 20+
- PNPM 10+
- Python 3.11+

## Environment
Create `.env` from `.env.example` and provide at least:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

## Install
```bash
pnpm install
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
python -m pip install pytest
```

## Local Development
### Workspace
```bash
pnpm dev
pnpm type-check
pnpm lint
pnpm build
```

### Frontend Only
```bash
pnpm --filter ./apps/web-pwa dev
pnpm --filter ./apps/web-pwa type-check
pnpm --filter ./apps/web-pwa lint
pnpm --filter ./apps/web-pwa build
```

### Backend Only
```bash
& ".venv\Scripts\python.exe" -m uvicorn main:app --app-dir "apps/api-core-python" --host 127.0.0.1 --port 8000 --reload
```

### Backend Tests
```bash
& ".venv\Scripts\python.exe" -m pytest apps/api-core-python/tests -q
```

## Verified Quality Status (Latest Local Run)
- Frontend type-check: pass
- Frontend lint: pass
- Frontend production build: pass
- Backend tests: pass (`239 passed`, `32 subtests passed`)
- Backend runtime smoke: `/health` returns `200` with `{"status":"ok"}`

## Database Migration Notes
- Migrations live under `supabase/migrations`
- Use additive/idempotent migrations where possible
- Do not re-run destructive cleanup migrations unless confirmed missing from migration history

## Documentation
- Bangla user guide: `USER_GUIDE_BN.md`
- Bangla surgical audit (latest): `surgical_audit_report_last.bn.md`
- Architecture: `CURRENT_ARCHITECTURE.md`

## Developer Credit
- Lead Developer: **MUMAIN AHMED**
- Role: Full-stack architect, UI systems designer, and deployment lead for BD CR7
- Email: m.a.sumon92@gmail.com
- Website: https://mumainsumon.netlify.app
- Facebook: https://www.facebook.com/sumon.mumain
- WhatsApp: https://wa.me/8801825007977

## Security and Conventions
- Never commit secrets
- Keep request/response models explicit in FastAPI
- Keep Zustand state typed (avoid `any`)
- Commit only `.env.example`, never real `.env`

## License
Private/Internal project.
