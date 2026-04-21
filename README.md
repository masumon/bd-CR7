<div align="center">

# BD CR7 Ultra Enterprise

### Unified Construction & Business Operations Platform

A production-grade ERP system purpose-built for construction firms and field-intensive operations — combining finance management, workforce control, project oversight, evidence capture, and regulatory compliance into a single, deployable platform.

<br/>

[![Version](https://img.shields.io/badge/Version-3.0.0-0969da?style=for-the-badge)](#)
[![Status](https://img.shields.io/badge/Status-Production-22863a?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/License-Proprietary-6e40c9?style=for-the-badge)](#license)

[![Next.js 15](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.12-3776ab?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-ef4444?style=flat-square&logo=turborepo&logoColor=white)](https://turbo.build)
[![PWA](https://img.shields.io/badge/PWA-Installable-1f6feb?style=flat-square&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Security](https://img.shields.io/badge/Security-RBAC%20·%20WebAuthn%20·%20OTP-0a7f5a?style=flat-square&logo=shield&logoColor=white)](#security-architecture)

</div>

---

## Overview

BD CR7 Ultra Enterprise is a full-stack ERP platform engineered for construction companies, field service businesses, and operationally complex organizations. It delivers a unified experience across financial controls, human resource management, material tracking, project monitoring, and compliance — all accessible from a mobile-first progressive web application.

The system is designed to operate in environments with limited connectivity through offline-first workflows, supports multi-factor authentication including biometric sign-in, and enforces enterprise-grade access control with production role segmentation across `super_admin`, `admin`, `checker`, `maker`, `manager`, `accountant`, `supervisor`, `engineer`, `mason`, `worker`, and `viewer`.

## Version 3.0.0 Highlights

- Non-blocking dashboard shell boot flow so module navigation no longer falls back to a full-screen auth loader during normal in-app movement.
- Lightweight dashboard stats mode for the main home screen, reducing unnecessary finance expense fetches on first dashboard load.
- Shared profile caching for top bar, user drawer, and settings to avoid repeated `/api/users/me/profile` requests.
- Improved PWA navigation behavior by removing duplicate route warm-fetches and keeping offline sync focused on meaningful routes.
- Smoother cross-role UX with persistent role, connection, and pending sync status inside the shell.

> **Deployment Model**: Cloud-native serverless architecture. Production instances deploy in under 60 seconds with zero-downtime rollouts.

---

## Key Capabilities

<table>
<tr>
<td width="50%" valign="top">

### 💰 Finance & Accounting
- Multi-account ledger management
- Expense creation with AI risk scoring
- Maker-checker approval workflows
- Fund transfer with balance validation
- Budget tracking and spending controls
- Real-time financial dashboard

### 👷 Workforce Management
- GPS-enabled attendance with geofencing
- Payroll processing and compensation tracking
- Department and role-based HR operations
- Contractor lifecycle management
- Worker onboarding workflows

### 📊 Project Management
- Milestone tracking and progress monitoring
- Field execution status in real-time
- Resource allocation visibility
- Deadline management with notifications

</td>
<td width="50%" valign="top">

### 🏗️ Materials & Inventory
- Site supply tracking and movement logs
- Procurement visibility and approval gates
- Inventory level monitoring
- Multi-site material allocation

### 📸 Evidence & Documentation
- In-field photo and document capture
- Cloud-backed media storage and retrieval
- Timestamped operational proof records
- Compliance-ready evidence archival

### 📋 Compliance & Reporting
- Immutable audit trail for all operations
- Business-ready export (Bengali + English)
- Role-segmented report visibility
- Activity-level accountability tracking

</td>
</tr>
</table>

---

## Security Architecture

Enterprise-grade security controls are implemented across every layer of the platform.

| Control | Implementation |
|:---|:---|
| **Role-Based Access Control** | Production role matrix covering `super_admin`, `admin`, `checker`, `maker`, `manager`, `accountant`, `supervisor`, `engineer`, `mason`, `worker`, `viewer` — enforced server-side on every endpoint |
| **Authentication** | Email/password, OAuth 2.0, phone OTP (Twilio Verify), WebAuthn biometric sign-in |
| **Trusted Device Flow** | App lock and device trust for seamless repeat authentication |
| **API Rate Limiting** | Distributed Redis-backed rate limiting with configurable thresholds; in-memory fallback for edge environments |
| **Security Headers** | X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, and more |
| **Input Validation** | Pydantic schema enforcement on all API boundaries |
| **SSRF Protection** | URL validation with private/internal address blocking on all external-facing endpoints |
| **Backup Security** | User-scoped export/restore with role-based privilege boundary enforcement |

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                   │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │  Next.js 15   │  │  PWA + SW    │  │  Offline    │  │  WebAuthn │  │
│  │  App Router   │  │  Installable │  │  Queue      │  │  Biometric│  │
│  └───────┬───────┘  └──────┬───────┘  └──────┬──────┘  └─────┬─────┘  │
└──────────┼─────────────────┼─────────────────┼────────────────┼────────┘
           │                 │                 │                │
           ▼                 ▼                 ▼                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API LAYER                                     │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────────────┐  │
│  │  FastAPI        │  │  RBAC + Auth   │  │  Rate Limiter            │  │
│  │  Serverless     │  │  Middleware     │  │  (Redis / In-Memory)     │  │
│  └────────┬───────┘  └────────┬───────┘  └──────────┬───────────────┘  │
│           │                   │                      │                  │
│  ┌────────┴───────────────────┴──────────────────────┴───────────────┐  │
│  │  Module Routers: auth · finance · workforce · projects ·          │  │
│  │  materials · evidence · reports · audit · contractor · settings    │  │
│  └───────────────────────────┬───────────────────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────────────────┘
                               │
           ┌───────────────────┼───────────────────┐
           ▼                   ▼                   ▼
┌──────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Supabase        │ │  Cloudinary     │ │  Redis / Upstash│
│  PostgreSQL      │ │  Media CDN      │ │  Rate Limiting  │
│  + Auth          │ │  + Storage      │ │  + Caching      │
└──────────────────┘ └─────────────────┘ └─────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|:---|:---|:---|
| Frontend | Next.js 15 (App Router) | Server/client rendering, PWA shell |
| UI Framework | Tailwind CSS + Custom UI System | Responsive mobile-first design |
| Backend | FastAPI (Python 3.12) | REST API, validation, business logic |
| Database | Supabase PostgreSQL | Relational data, auth primitives, RLS |
| Media | Cloudinary | Image/document storage and CDN delivery |
| Caching | Redis / Upstash | Distributed rate limiting, session management |
| SMS/OTP | Twilio Verify | Phone-based OTP authentication |
| Email | Resend | Transactional notifications and alerts |
| Monorepo | Turborepo + pnpm | Build orchestration, dependency management |
| Deployment | Vercel (Serverless) | Zero-config CI/CD, edge network |

---

## Repository Structure

```
bd-CR7/
├── apps/
│   ├── api/                          # FastAPI backend application
│   │   ├── core/                     # Auth, config, middleware, supabase client
│   │   ├── modules/                  # Domain routers (11 modules)
│   │   │   ├── admin/                # System administration
│   │   │   ├── ai/                   # AI risk scoring engine
│   │   │   ├── audit/                # Immutable audit trail
│   │   │   ├── auth/                 # Authentication & authorization
│   │   │   ├── contractor/           # Contractor management
│   │   │   ├── dynamic/              # Custom fields & workflows
│   │   │   ├── evidence/             # Evidence capture & storage
│   │   │   ├── finance/              # Financial operations
│   │   │   ├── materials/            # Inventory & procurement
│   │   │   ├── projects/             # Project milestones & tracking
│   │   │   ├── reports/              # Business reporting
│   │   │   ├── settings/             # System & user preferences
│   │   │   ├── users/                # User management
│   │   │   └── workforce/            # HR & attendance
│   │   ├── schemas/                  # Pydantic models
│   │   ├── services/                 # Business logic layer
│   │   ├── sumonix_ai/              # AI/ML engine (RAG memory)
│   │   └── tests/                    # Unit, integration & E2E tests
│   └── web/                          # Next.js PWA frontend
│       ├── app/                      # App Router pages & layouts
│       │   ├── (auth)/               # Auth flow pages
│       │   └── (dashboard)/          # Protected dashboard modules
│       │       └── dashboard/
│       │           ├── ai/           # AI assistant interface
│       │           ├── audit/        # Audit log viewer
│       │           ├── construction/ # Construction operations
│       │           ├── contractor/   # Contractor management
│       │           ├── evidence/     # Evidence capture
│       │           ├── finance/      # Financial dashboards
│       │           ├── materials/    # Inventory views
│       │           ├── reports/      # Report generation
│       │           ├── settings/     # Preferences & backup
│       │           └── workforce/    # HR & attendance
│       └── src/
│           ├── components/           # Reusable UI components
│           └── core/                 # Frontend utilities
├── packages/
│   ├── core-logic/                   # Shared business logic
│   ├── media-engine/                 # Media processing utilities
│   ├── rbac-engine/                  # Role-based access control engine
│   └── ui-system/                    # Design system components
├── supabase/
│   └── migrations/                   # Database schema (12+ migrations)
├── turbo.json                        # Monorepo build pipeline
└── vercel.json                       # Deployment configuration
```

---

## Getting Started

### Prerequisites

| Requirement | Version |
|:---|:---|
| Node.js | 20+ |
| pnpm | 10+ |
| Python | 3.11+ |

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd bd-CR7

# Install JavaScript dependencies
pnpm install

# Set up Python virtual environment
python -m venv .venv
source .venv/bin/activate    # Linux/macOS
.venv\Scripts\activate       # Windows

pip install -r apps/api/requirements.txt
```

### Environment Configuration

```bash
cp .env.example .env.local
```

Populate the required environment variables. See `.env.example` for the full template with documentation for each variable. All secrets must remain in local or platform-managed environment stores — **never commit credentials to the repository**.

### Development

```bash
# Start all services (frontend + backend)
pnpm dev

# Build all packages
pnpm build

# Run linting
pnpm lint

# Run backend tests
cd apps/api && python -m pytest tests/ -q
```

---

## Deployment

The platform is designed for serverless deployment on Vercel with zero-configuration CI/CD.

| Aspect | Details |
|:---|:---|
| **Platform** | Vercel (Serverless Functions + Edge Network) |
| **CI/CD** | Automatic on push to `main` branch |
| **Rollback** | Instant, via Vercel deployment history |
| **Environment** | Managed through Vercel project settings |
| **SSL** | Automatic HTTPS with Let's Encrypt |
| **CDN** | Global edge caching for static assets |

### GitHub -> Vercel CI/CD

A GitHub Actions workflow is included at `.github/workflows/vercel-deploy.yml` to automate:

- **Preview deployments** for pull requests
- **Production deployments** for pushes to `main`

Configure the following repository secrets in GitHub (`Settings -> Secrets and variables -> Actions`):

| Secret | Description |
|:---|:---|
| `VERCEL_TOKEN` | Personal/team token used by the Vercel CLI |
| `VERCEL_ORG_ID` | Vercel team or user scope ID |
| `VERCEL_PROJECT_ID` | Target Vercel project ID |

To retrieve IDs from an already linked local project:

```bash
vercel link
cat .vercel/project.json
```

Custom domain and enterprise deployment options available on request.

---

## Testing

The project includes a comprehensive test suite covering unit, integration, and end-to-end scenarios.

```bash
cd apps/api

# Run all tests
python -m pytest tests/ -q

# Run with verbose output
python -m pytest tests/ -v

# Frontend type checking
cd ../web && npx tsc --noEmit
```

| Suite | Coverage |
|:---|:---|
| Unit Tests | Schema validation, auth logic, config, middleware |
| Integration Tests | API endpoint contract testing |
| E2E Simulation | Full user flow simulation (auth → finance → operations) |

---

## Performance

Optimized for serverless cold-start environments with lazy-initialized service clients and deferred imports.

| Metric | Value |
|:---|:---|
| API Warm Response | ~500ms |
| Module Import Time | <2ms (deferred initialization) |
| Test Suite Execution | ~8s (176 tests) |
| Frontend Type Check | < 10s |
| Zero-Downtime Deploy | ~60s |

---

## Target Market

BD CR7 Ultra Enterprise is designed for:

- **Construction Companies** — Finance + field operations in a single platform with GPS attendance, material tracking, and evidence capture
- **Infrastructure Firms** — Multi-project management with milestone tracking, contractor oversight, and compliance reporting
- **Field Service Operations** — Mobile-first workforce management with offline capability and approval workflows
- **SME & Mid-Market Businesses** — Affordable ERP alternative with enterprise security (RBAC, biometric, audit trails)
- **Regulated Industries** — Built-in compliance controls, immutable audit logs, and role-segmented data access

---

## API Documentation

The platform exposes a RESTful API with the following module endpoints:

| Endpoint Group | Base Path | Key Operations |
|:---|:---|:---|
| Authentication | `/api/auth` | Register, login, logout, OTP, WebAuthn, refresh |
| Finance | `/api/finance` | Accounts, expenses, transfers, approvals, dashboard |
| Workforce | `/api/workforce` | Attendance, payroll, departments, workers |
| Projects | `/api/projects` | CRUD, milestones, progress tracking |
| Materials | `/api/materials` | Inventory, procurement, movement logs |
| Evidence | `/api/evidence` | Upload, list, retrieve documented proof |
| Reports | `/api/reports` | Generate, export, schedule business reports |
| Audit | `/api/audit` | Activity history, compliance queries |
| Contractor | `/api/contractor` | Contractor lifecycle, contracts, payments |
| Settings | `/api/settings` | System config, user preferences, backup/restore |
| Users | `/api/users` | Profile management, role assignment, activation |
| Health | `/api/health` | Readiness, liveness, database connectivity |

All endpoints require Bearer token authentication except `/api/auth/register`, `/api/auth/login`, and `/api/health`.

---

## License

**Proprietary Software** — All Rights Reserved.

This software is confidential and protected under applicable intellectual property laws. Unauthorized copying, modification, distribution, or use of this software, in whole or in part, is strictly prohibited without prior written authorization from the copyright holder.

For licensing inquiries, please refer to the contact section below.

---

## Credits

<div align="center">

### Developed by

**Sumonix AI Lab**

*Engineering intelligent enterprise solutions*

<br/>

| Role | Contributor |
|:---|:---|
| **Lead Architect & Full-Stack Engineer** | MUMAIN AHMED SUMON |
| **AI/ML & System Design** | Sumonix AI Lab |
| **Platform** | BD CR7 Ultra Enterprise Division |

<br/>

[![GitHub](https://img.shields.io/badge/GitHub-Sumonix_AI-181717?style=flat-square&logo=github&logoColor=white)](#)
[![Status](https://img.shields.io/badge/Build-Passing-22863a?style=flat-square)](#)

</div>

---

<div align="center">

<sub>© 2024–2026 Sumonix AI Lab. All rights reserved. Built with precision in Bangladesh 🇧🇩</sub>

</div>
