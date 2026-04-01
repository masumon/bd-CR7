# BD-CR7 Ultra Enterprise

Monorepo for BD-CR7 business platform with:

- Next.js PWA frontend
- FastAPI backend
- Supabase PostgreSQL schema and migrations
- Shared package modules via PNPM workspaces + Turborepo

## Monorepo Structure

```
apps/
	api-core-python/      # FastAPI backend
	web-pwa/              # Next.js 14 PWA frontend
packages/
	core-logic/
	media-engine/
	rbac-engine/
	ui-system/
supabase/
	migrations/           # SQL migrations
api/
	main.py               # Vercel Python entrypoint shim
	requirements.txt      # Vercel Python install manifest
```

## Tech Stack

- Frontend: Next.js 14, React 18, Zustand, Supabase JS
- Backend: FastAPI, Pydantic v2, SQLAlchemy, Supabase Python
- Monorepo: PNPM workspaces, Turborepo
- Database: Supabase PostgreSQL
- CI/CD: GitHub Actions (security + CodeQL)

## Requirements

- Node.js 20.x
- PNPM 8.15.x
- Python 3.11+

## Getting Started

### 1) Install dependencies

```bash
pnpm install
```

### 2) Python environment (backend)

```bash
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
```

### 3) Environment variables

Copy `.env.example` to `.env` and set values.

Minimum keys:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Development Commands

Run all apps/packages in dev mode:

```bash
pnpm dev
```

Build all workspaces:

```bash
pnpm build
```

Lint all workspaces:

```bash
pnpm lint
```

Type-check all workspaces:

```bash
pnpm type-check
```

Backend compile smoke check:

```bash
python -m py_compile apps/api-core-python/**/*.py
```

## Frontend and Backend (Individual)

Frontend only:

```bash
pnpm --filter web-pwa dev
```

Backend only (FastAPI):

```bash
cd apps/api-core-python
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Database Migrations

SQL migrations are under `supabase/migrations`.

Rules used in this repository:

- Prefer additive/idempotent migrations.
- Avoid destructive SQL in standard production flow.
- Keep schema changes explicit and reviewable.

## Deployment Notes (Vercel)

Repository includes `vercel.json` with:

- Monorepo build command targeting frontend workspace
- Python function runtime for `api/main.py`
- Rewrite rule forwarding `/api/*` to Python API entrypoint

Also includes `api/requirements.txt` so Vercel installs backend Python dependencies.

## CI/Security

- Security workflow: `.github/workflows/security.yml`
- CodeQL config: `.github/codeql/codeql-config.yml`

Current behavior:

- CodeQL scans still run for JavaScript/Python.
- Analyze upload is configured to not fail hard when repository-level code scanning is disabled.

## Troubleshooting

### Warning: Could not identify Next.js version

Resolved by keeping `next` dependency available at repository root (for framework detection in monorepo builds) and in frontend workspace.

### Browser response: `{ "status": "ok", "message": "FastAPI dependency missing in runtime" }`

This means Python runtime was started without backend dependencies in serverless environment.

This repository already addresses it with:

- `api/requirements.txt` -> points to backend dependency list
- Vercel rewrite to `api/main.py`

If it appears again after a push:

1. Trigger a fresh Vercel redeploy from latest `main`.
2. Confirm Vercel project is linked to this repository root.
3. Check deployment logs for Python dependency installation phase.

### Node warning: `[DEP0169] url.parse() behavior is not standardized`

If seen during cloud build logs, it usually comes from third-party tooling in the build/runtime chain, not project source.

Mitigation applied in this repo:

- Node engine pinned to `20.x` to avoid newer runtime-only deprecation noise.

## Repository Conventions

- Do not commit secrets.
- Keep `.env` local and commit only `.env.example`.
- Keep FastAPI models explicit and validated.
- Keep Zustand state typed.

## License

Private/internal project.
