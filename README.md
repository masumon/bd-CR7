# BD CR7 ERP

<div align="center">

Production-ready construction, finance, workforce, and compliance operations platform for Bangladesh-based teams.

[![Live](https://img.shields.io/badge/Live-bd--cr7.vercel.app-111111?logo=vercel&logoColor=white)](https://bd-cr7.vercel.app)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2015-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![PWA](https://img.shields.io/badge/Experience-PWA-1f6feb)](https://web.dev/progressive-web-apps/)
[![Security](https://img.shields.io/badge/Security-RBAC%20%2B%20WebAuthn%20%2B%20Redis-0a7f5a)](#security--reliability)

</div>

## Product Snapshot

BD CR7 ERP is a modern ERP platform designed for construction and field-heavy business operations. It combines finance controls, workforce management, project monitoring, evidence capture, and auditability in a single production deployment.

The platform is built to work well on desktop and mobile, supports offline workflows, and includes security controls expected in a production environment: biometric sign-in, role-based access control, security headers, and Redis-backed rate limiting.

## Why It Matters

- Unifies finance, HR, materials, project tracking, and reporting in one operational system.
- Designed for real-world field usage with mobile-first dashboards and offline sync support.
- Reduces operational risk through approval workflows, audit logs, and access control boundaries.
- Ready for commercial presentation with a live production deployment and deployable monorepo architecture.

## Core Modules

| Module | Business Value |
|---|---|
| Authentication | Email/password, OAuth, OTP, WebAuthn biometric sign-in, trusted-device flow |
| Finance | Ledger, approvals, expense tracking, transfer visibility, risk-aware workflows |
| Projects | Project progress, milestone monitoring, field execution tracking |
| Workforce | Attendance, payroll, role-aware HR operations |
| Materials | Inventory movement, site supply tracking, procurement visibility |
| Evidence | Photo and document capture for operational proof and recordkeeping |
| Reports | Export-ready business reporting with Bengali-friendly output paths |
| Audit | Traceable activity history for accountability and review |
| Offline PWA | Queue-first behavior for unreliable connectivity environments |

## Security & Reliability

Production controls currently in place:

- RBAC with segmented access across admin, manager, accountant, supervisor, worker, and viewer roles.
- WebAuthn-based biometric authentication for supported devices.
- App lock and trusted-device experience for repeat sign-in flows.
- Secure response headers across application routes.
- Redis-backed rate limiting enabled for production-sensitive API traffic.
- Current production threshold: `120` requests per minute per client boundary.
- Verified production behavior: login endpoint returns `429` when burst traffic exceeds the configured limit.

## Architecture

| Layer | Implementation |
|---|---|
| Frontend | Next.js App Router PWA |
| API | FastAPI serverless endpoints |
| Database | Supabase PostgreSQL |
| Storage | Cloudinary |
| Deployment | Vercel |
| Monorepo | Turborepo + pnpm workspaces |
| Rate Limiting | Redis / Upstash with in-memory fallback |

## Repository Layout

```text
.
├── api/                     # Vercel Python entrypoints
├── apps/
│   ├── api/                 # Core FastAPI application
│   └── web/                 # Next.js PWA frontend
├── packages/                # Shared domain and UI packages
├── scripts/                 # Operational SQL and helper scripts
├── supabase/migrations/     # Schema evolution
├── .env.example             # Safe environment template
├── turbo.json               # Monorepo pipeline
└── vercel.json              # Production deployment config
```

## Production Readiness

This repository is structured for production deployment, not just local experimentation.

- Live deployment available on Vercel.
- API health and readiness endpoints responding in production.
- Database connectivity verified against production services.
- Redis rate limiting configured and enforced.
- Sensitive values kept out of tracked documentation.
- Environment bootstrapping documented through safe templates only.

## Local Development

### Prerequisites

- Node.js 20+
- pnpm 10+
- Python 3.11+

### Install

```bash
pnpm install
```

### Configure Environment

Use the root template and keep secrets local only:

```bash
cp .env.example .env.local
```

Then fill only the required values for your environment. Do not commit `.env.local`.

### Run Development

```bash
pnpm dev
```

### Build and Validation

```bash
pnpm build
pnpm lint
python -m compileall apps/api api
```

## Environment Model

Expected environment categories:

- Application runtime values
- Supabase connection settings
- Cloudinary media settings
- Security and governance secrets
- Redis / Upstash rate limiting configuration
- Deployment-specific host configuration for Vercel

Important production variables include:

```env
APP_ENV=production
PYTHON_API_URL=https://bd-cr7.vercel.app
USE_REDIS_RATE_LIMIT=true
RATE_LIMIT_REQUESTS_PER_MINUTE=120
UPSTASH_REDIS_REST_URL=https://your-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=replace-me
```

Use `.env.example` as the safe template. Keep all real credentials in local or platform-managed environment stores.

## Deployment Notes

Production deployment targets Vercel.

- Frontend and API are deployed from the same monorepo.
- Environment variables are managed in Vercel project settings.
- Supabase handles persistence and authentication primitives.
- Cloudinary handles media delivery.
- Redis-backed rate limiting is suitable for distributed production traffic.

## Operational Highlights

- Mobile-responsive dashboard and finance workflows.
- Production-safe biometric fallback handling.
- Construction attendance and location-aware workflows.
- Export and reporting support for business operations.
- Audit visibility for sensitive actions.

## Commercial Positioning

BD CR7 ERP is suitable for:

- Construction companies needing finance and field operations in one platform.
- Businesses that need mobile-first operations with central oversight.
- Teams that require approval flows, traceability, and role isolation.
- Organizations moving from spreadsheets and fragmented tools to a controlled ERP workflow.

## License

Proprietary software. All rights reserved.

This repository is intended for authorized use, deployment, evaluation, and commercial delivery under owner approval. Do not redistribute source code, assets, or deployment configuration without permission.

## Contact

Commercial, deployment, and licensing discussions should be handled through the project owner or authorized business contact. Sensitive personal contact details are intentionally omitted from this public-facing document.
