# Project Guidelines

## Architecture
- Monorepo uses Turborepo with PNPM workspaces.
- Python API lives in `apps/api-core-python` and exposes routers for finance, HR, and POS.
- PWA frontend lives in `apps/web-pwa` and currently contains UI + offline queue state.
- Database schema/migrations are in `supabase/migrations`.
- AI memory engine lives in `sumonix_ai`.

## Build and Test
- Install JS deps: `pnpm install`
- Run all dev tasks: `pnpm dev`
- Run all builds: `pnpm build`
- Run all lint: `pnpm lint`
- Python API smoke test: `python -m py_compile apps/api-core-python/**/*.py`

## Conventions
- Do not store secrets in tracked files. Use `.env` files and commit only `.env.example`.
- Use additive database migrations in `supabase/migrations`; avoid destructive SQL in normal workflows.
- Keep FastAPI request/response models explicit and validated.
- Keep Zustand state typed and avoid `any` in new code.
