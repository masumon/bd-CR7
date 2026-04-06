# Current Architecture (Core-Only)

Last updated: 2026-04-07

## 1. System Summary
- Monorepo: Turborepo + PNPM workspaces
- Frontend app: `apps/web-pwa` (Next.js App Router, PWA-first)
- Backend app: `apps/api-core-python` (FastAPI)
- API bridge entry: `api/main.py`
- Deployment targets:
  - Frontend: Vercel (`vercel.json`)
  - Backend: Render (`render.yaml`)

## 2. Runtime Flow
1. User opens Web PWA (Next.js)
2. UI calls same-origin `/api/*`
3. Next.js proxy route forwards to Python API
4. FastAPI serves core routers
5. Data/auth state comes from Supabase

Key proxy file:
- `apps/web-pwa/app/api/[...path]/route.ts`

## 3. Core Dashboard Scope
Canonical core paths are defined in:
- `apps/web-pwa/src/lib/dashboardPolicy.ts`

Current core module surface:
1. Dashboard
2. Projects
3. Finance
4. Workforce
5. Materials
6. Evidence
7. Reports
8. SUMONIX AI (chat-focused)
9. Audit
10. Contractor
11. Settings

Non-core prefixes are denied at middleware level:
- `/dashboard/import`
- `/dashboard/pos`
- `/dashboard/crm`
- `/dashboard/inventory`

## 4. Frontend Architecture
- Dashboard root layout: `apps/web-pwa/app/(dashboard)/layout.tsx`
- Global app shell: `apps/web-pwa/src/components/layout/MobileAppShell.tsx`
- Navigation shell: `apps/web-pwa/src/components/appshell/AppShell.tsx`
- Login controller: `apps/web-pwa/app/(auth)/login/page.tsx`

Access control files:
- Role matrix: `apps/web-pwa/src/lib/rbac.ts`
- Dashboard policy: `apps/web-pwa/src/lib/dashboardPolicy.ts`
- Route guard middleware: `apps/web-pwa/middleware.ts`

## 5. Backend Architecture
Main app composition file:
- `apps/api-core-python/main.py`

Active core router groups:
- Auth
- Finance
- Construction/HR
- Contractor
- Project Management
- AI
- Approval Intelligence
- Users

Backend protections in place:
- CORS middleware
- Rate limiting middleware
- Request ID middleware
- Security headers middleware
- Standard JSON envelope middleware
- Health and readiness endpoints

## 6. AI State
- SUMONIX remains available as chat-focused UI path.
- Previously deprecated/non-core endpoint surfaces were removed from active routing.
- Frontend blocks legacy ai-employ path usage in API clients.

## 7. Monorepo Operations
Workspace and task orchestration:
- `pnpm-workspace.yaml`
- `turbo.json`

## 8. Safety Notes
- Core login and dashboard UX are preserved.
- Non-core modules were removed from active route surface.
- Keep changes additive for database migrations under `supabase/migrations`.
- Do not store secrets in tracked files; keep `.env.example` only.

## 9. Quick Verification Checklist
- Frontend type-check:
  - `pnpm --filter web-pwa exec tsc --noEmit`
- Backend integration:
  - `d:/BD CR7 Project/.venv/Scripts/python.exe -m unittest apps/api-core-python/tests/test_api_integration.py`
- Git sync:
  - `git status -sb`

If this document is updated after architectural changes, keep sections 3, 4, and 5 synchronized first.

## 10. Visual Architecture Map (Mermaid)
```mermaid
flowchart TD
  U[User Browser] --> FW[Web PWA Frontend<br/>apps/web-pwa]

  subgraph Frontend[Frontend Layer - Next.js]
    FW --> Auth[Auth Category<br/>app/(auth)]
    FW --> Dash[Dashboard Category<br/>app/(dashboard)]
    FW --> Shell[Mobile Shell + App Shell<br/>src/components/layout + src/components/appshell]
    FW --> Governance[RBAC + Policy + Middleware<br/>src/lib/rbac.ts + src/lib/dashboardPolicy.ts + middleware.ts]
    FW --> Proxy[API Proxy Route<br/>app/api/[...path]/route.ts]
  end

  Proxy --> BE[FastAPI Backend<br/>apps/api-core-python/main.py]

  subgraph Backend[Backend Layer - FastAPI Routers]
    BE --> RAuth[Auth Router]
    BE --> RFin[Finance Router]
    BE --> RHr[Construction/HR Router]
    BE --> RCon[Contractor Router]
    BE --> RProj[Project Management Router]
    BE --> RAi[AI Router]
    BE --> RApproval[Approval Intelligence Router]
    BE --> RUsers[Users Router]
  end

  Backend --> SB[(Supabase)]

  subgraph CoreModules[Core Dashboard Modules]
    M1[Dashboard]
    M2[Projects]
    M3[Finance]
    M4[Workforce]
    M5[Materials]
    M6[Evidence]
    M7[Reports]
    M8[SUMONIX AI]
    M9[Audit]
    M10[Contractor]
    M11[Settings]
  end

  Governance -.allows only.-> CoreModules

  subgraph Deploy[Deployment]
    V[Vercel Frontend]
    R[Render Backend]
  end

  FW --> V
  BE --> R
```
