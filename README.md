# BD CR7 Ultra Enterprise

Production-grade monorepo ERP platform for construction, finance, import supply, POS, reporting, and AI-assisted operations.

## Live Deployment
- Production URL: https://bd-cr7.vercel.app

## Core Capabilities
- Next.js PWA frontend for web + mobile install
- FastAPI backend API for business logic and AI endpoints
- Supabase PostgreSQL for transactional data and auth-linked entities
- Role-aware module visibility in dashboard navigation
- SUMONIX AI assistant with real dashboard/anomaly integrations

## Monorepo Structure
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
  requirements.txt      Vercel python dependency manifest
```

## Tech Stack
- Frontend: Next.js 15, React 18, TypeScript, Tailwind, Zustand, Supabase JS
- Backend: FastAPI, Pydantic v2, SQLAlchemy, Supabase Python client
- Database: Supabase PostgreSQL + RLS policies
- Monorepo: PNPM workspaces + Turborepo
- Deployment: Vercel

## Prerequisites
- Node.js 20+
- PNPM 10+
- Python 3.11+

## Environment Setup
Copy .env.example to .env and provide at least:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_API_URL

## Install
```bash
pnpm install
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
python -m pip install pytest
```

## Development Commands
### Full workspace
```bash
pnpm dev
pnpm lint
pnpm build
pnpm type-check
```

### Frontend only
```bash
pnpm --filter web-pwa dev
pnpm --filter web-pwa lint
pnpm --filter web-pwa build
pnpm --filter web-pwa type-check
```

### Backend only
```bash
cd apps/api-core-python
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Backend tests
```bash
cd ../..
.venv\Scripts\python.exe -m pytest apps\api-core-python\tests -q
```

## Role-Based Module Visibility
Dashboard modules are filtered by user role:

- admin:
Dashboard, Construction, Finance, Import, POS, Projects, Reports, Settings

- maker:
Dashboard, Construction, Finance, Import, POS, Projects, Reports, Settings

- checker:
Dashboard, Finance, Reports, Settings

- viewer:
Dashboard, Reports, Settings

- worker:
Dashboard, Construction, POS, Settings

## UI and UX Notes
- Mobile footer modules are rendered as a horizontal row with scroll to prevent overlap in PWA/browser.
- Login page includes animated circular Fingerprint and Face Scan controls.
- Dashboard pages include safe-area spacing for installed mobile PWA mode.

## Database Migrations
All SQL migration files are under supabase/migrations.

Guidelines:
- Prefer additive, idempotent migrations
- Avoid destructive changes in normal production flow
- Review RLS impact for each table change

## Deployment (Vercel)
Repository contains vercel.json for monorepo build + Python API rewrites.

Important:
- .vercelignore is configured to exclude local venv, caches, and build artifacts to keep serverless bundle within Vercel limits.
- Push to main triggers deployment if auto-deploy is enabled.

Manual deploy:
```bash
vercel --prod --yes
```

## User Documentation
Bangla user guide:
- USER_GUIDE_BN.md

Latest surgical audit report:
- PROJECT_SURGICAL_AUDIT_REPORT_2026-04-03.txt

## Security and Conventions
- Never commit secrets
- Keep FastAPI request/response models explicit
- Keep Zustand state typed
- Commit only .env.example, not real .env values

## License
Private/Internal project.
