# BD CR7 ERP — Enterprise Construction & Finance Management System

<div align="center">

**Version 2.1.0** &nbsp;|&nbsp; **License: Proprietary** &nbsp;|&nbsp; **© 2024–2025 ABO Enterprise**

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178c6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-2.56-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.11-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)
[![PWA](https://img.shields.io/badge/PWA-Enabled-5a0fc8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![pnpm](https://img.shields.io/badge/pnpm-10-f69220?logo=pnpm&logoColor=white)](https://pnpm.io)

</div>

---

## Overview

**BD CR7 ERP** is a production-grade, AI-powered Enterprise Resource Planning system purpose-built for the construction and finance sector in Bangladesh. It delivers real-time project tracking, multi-account financial management, biometric authentication, role-based access control (RBAC), and offline-capable Progressive Web App (PWA) functionality.

Developed and maintained by **Mumain Ahmed Sumon** under **ABO Enterprise**, powered by **SUMONIX AI**.

> **বৈরাগী বাজার, বিয়ানীবাজার, সিলেট, বাংলাদেশ**

---

## Feature Modules

| Module | Description |
|--------|-------------|
| **Authentication** | Email/password · Google OAuth · WebAuthn biometric · Email OTP · Remember Me · App lock |
| **Finance** | Multi-account ledger · Expense approval workflow · Fund transfers · AI risk scoring |
| **Projects** | Construction tracking · Milestone management · Progress reporting |
| **Workforce** | Attendance · Payroll · HR management · Role-based access |
| **Materials** | Inventory management · In/out tracking · Procurement |
| **Evidence** | Field photo/document upload via Cloudinary CDN |
| **Audit** | Full activity logging · Security event tracking |
| **Reports** | PDF/CSV export with Bengali font support · A4 formatting |
| **AI Chat** | Integrated SUMONIX AI assistant for operational queries |
| **Offline** | PWA with offline queue — operations sync when connectivity restores |

---

## Technology Stack

### Frontend (`apps/web`)

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.5 | App Router, SSR, API routes |
| React | 18.3 | UI component model |
| TypeScript | 5.4 | Type safety |
| Tailwind CSS | 3.4 | Utility-first styling |
| Radix UI | latest | Accessible UI primitives |
| Framer Motion | 11.11 | Page and component animations |
| Zustand | 4.5 | Client state management |
| Supabase SSR | 0.5 | Session management, realtime |
| next-pwa | 5.6 | Service worker, offline support |
| WebAuthn / FIDO2 | — | Fingerprint / Face ID biometric |
| html2pdf.js | 0.14 | A4 PDF generation with Bengali fonts |
| Recharts | 2.12 | Data visualisation |

### Backend (`api`)

| Technology | Version | Purpose |
|------------|---------|---------|
| FastAPI | 0.115 | REST API server |
| Python | 3.11+ | Runtime |
| Supabase | — | PostgreSQL + Auth + Realtime + RLS |
| Cloudinary | — | Media storage and CDN |

### Infrastructure

| Service | Purpose |
|---------|---------|
| **Vercel** | Frontend + Python serverless deployment |
| **Supabase Cloud** | Managed Postgres + Auth + Realtime |
| **Cloudinary** | Media CDN |
| **Turborepo** | Monorepo build orchestration |
| **pnpm workspaces** | Dependency management |

---

## Project Structure

```
bd-cr7-project/
├── apps/
│   └── web/                    # Next.js 15 PWA application
│       ├── app/                # App Router pages and API routes
│       │   ├── (auth)/         # Login, register, forgot-password
│       │   ├── (dashboard)/    # Protected dashboard modules
│       │   └── auth/callback/  # OAuth code-exchange handler
│       └── src/
│           ├── components/     # Reusable UI components
│           │   ├── auth/       # AppLockScreen, BiometricButton, etc.
│           │   └── layout/     # MobileAppShell, AppShell
│           ├── modules/        # Feature-scoped components
│           ├── store/          # Zustand state stores
│           ├── lib/            # Supabase client, WebAuthn, export utilities
│           └── types/          # TypeScript declarations (html2pdf, etc.)
├── api/                        # Python FastAPI backend
├── packages/
│   ├── core-logic/             # Shared business logic
│   ├── media-engine/           # Cloudinary integration
│   ├── rbac-engine/            # Role-based access control engine
│   └── ui-system/              # Design system tokens
├── supabase/                   # Database migrations and seed data
├── vercel.json                 # Vercel deployment configuration
├── turbo.json                  # Turborepo pipeline configuration
├── pnpm-workspace.yaml         # pnpm workspace definition
└── README.md                   # This file
```

---

## Authentication & Security

### Login Methods

1. **Email + Password** — Supabase Auth with database role lookup
2. **Google OAuth** — SSO via Supabase OAuth + `/auth/callback` code exchange
3. **WebAuthn Biometric** — Fingerprint / Face ID via FIDO2 standard
4. **Email OTP** — 6-digit magic code for passwordless access

### App Lock (Biometric Security)

When the app is **minimised or sent to the background**, an automatic lock activates after **10 seconds**. On return, the user must authenticate via:

- Fingerprint / Face ID biometric scan
- Password fallback (email pre-filled from Remember Me)

### Remember Me / Trusted Device

- Supabase refresh tokens persist the session across browser restarts
- With **Remember Me** enabled, the biometric prompt auto-triggers on the login screen — no need to re-enter email or password
- Trusted device state is maintained in `localStorage` and verified on every app open

### Security Headers (all routes)

| Header | Value |
|--------|-------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(self)` |
| `Content-Security-Policy` | Strict allowlist (no unsafe-eval in production) |

---

## Environment Variables

Create `apps/web/.env.local`:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Cloudinary (required for media upload)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-preset

# App URL (used for OAuth redirect)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+ (`npm install -g pnpm`)
- Python 3.11+ (for API development)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/mumainsumon/bd-cr7-project.git
cd bd-cr7-project

# 2. Install all workspace dependencies
pnpm install

# 3. Configure environment
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with your Supabase and Cloudinary credentials

# 4. Start development server
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Build for Production

```bash
pnpm build
```

### Type Check

```bash
pnpm type-check
```

---

## Deployment

This project deploys to **Vercel** as a monorepo:

- **Next.js** app built via `@vercel/next`
- **Python FastAPI** deployed as serverless functions via `@vercel/python`

### Required Vercel Environment Variables

Set in **Vercel → Project Settings → Environment Variables**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

### Supabase OAuth Configuration

In **Supabase Dashboard → Authentication → URL Configuration**:

- **Site URL**: `https://your-domain.vercel.app`
- **Redirect URLs**: `https://your-domain.vercel.app/auth/callback`

> Note: The redirect URL **must** point to `/auth/callback`, not directly to `/dashboard`. The callback route exchanges the OAuth code for a session before redirecting.

---

## Cookie & Storage Policy

BD CR7 ERP uses the following browser storage (no third-party tracking):

| Key | Storage | Purpose | Lifetime |
|-----|---------|---------|---------|
| `bdcr7-auth` | localStorage | Auth state (role, userId) | Session |
| `bdcr7-remember-me` | localStorage | Trusted device flag | Persistent |
| `bdcr7-remember-email` | localStorage | Login email pre-fill | Persistent |
| `bdcr7-theme` | localStorage | Dark/light preference | Persistent |
| `bdcr7-language` | localStorage | UI language (en/bn) | Persistent |
| `bdcr7-app-locked` | sessionStorage | App lock state | Tab session |
| `sb-*` | localStorage | Supabase Auth tokens | Per Supabase config |

All storage entries serve **operational purposes only**. No analytics or advertising cookies are used.

---

## Roles & Access Control

| Role | Access Level |
|------|-------------|
| `admin` | Full system access — users, settings, audit, all modules |
| `manager` | Projects, finance, workforce, reports, audit |
| `accountant` | Finance, reports, audit |
| `supervisor` | Workforce, materials, evidence, projects |
| `worker` | Workforce, evidence (own records) |
| `viewer` | Read-only — dashboard, reports, projects |

---

## License

**Proprietary Software — All Rights Reserved**

Copyright © 2024–2025 **ABO Enterprise**, Bangladesh.

This software and its source code are the exclusive intellectual property of ABO Enterprise. Unauthorised copying, distribution, modification, sublicensing, or use of this software — in whole or in part — without the express written permission of ABO Enterprise is strictly prohibited and may be subject to legal action.

For licensing enquiries: [m.a.sumon92@gmail.com](mailto:m.a.sumon92@gmail.com)

---

## Developer

| | |
|---|---|
| **Name** | Mumain Ahmed Sumon |
| **Title** | Full-Stack Engineer & Systems Architect |
| **Portfolio** | [mumainsumon.netlify.app](https://mumainsumon.netlify.app) |
| **Email** | [m.a.sumon92@gmail.com](mailto:m.a.sumon92@gmail.com) |
| **Facebook** | [facebook.com/sumon.mumain](https://www.facebook.com/sumon.mumain) |
| **WhatsApp** | [+880 1825-007977](https://wa.me/8801825007977) |
| **Company** | ABO Enterprise |
| **Location** | বৈরাগী বাজার, বিয়ানীবাজার, সিলেট, বাংলাদেশ |

---

*Powered by **SUMONIX AI** · Built for **ABO Enterprise***

---

## Changelog

### v2.1.0 — 2025-04

- App lock screen with biometric / password unlock on app minimise
- Remember Me trusted device: auto-triggers biometric on next open
- Fixed: Google OAuth `validation_failed 400` — corrected `redirectTo` to `/auth/callback`
- Fixed: OTP "Unsupported phone provider" — user-friendly Bengali error with email fallback
- Fixed: TypeScript `html2pdf()` chain type error (`Object is of type 'unknown'`)
- Fixed: Vercel `builds` config warning — migrated to `rewrites`
- Updated `DEVELOPER_CONFIG` with full developer profile
- Production README with cookie policy, RBAC table, license

### v2.0.0 — 2025-03

- Full RBAC engine with 6 roles and permission matrix
- WebAuthn FIDO2 biometric enrollment and assertion
- Multi-account finance with maker-checker approval workflow
- Offline queue with automatic sync on reconnect
- Bengali PDF export with Noto Sans Bengali typography

### v1.0.0 — 2024-12

- Initial release: authentication, dashboard, finance, projects, workforce
