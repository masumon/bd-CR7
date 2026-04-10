# 🏗️ BD CR7 — Construction Management System

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/masumon/bd-CR7)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.14-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-green)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.56.0-blue)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.12+-yellow)](https://www.python.org/)

**Modern Construction Management System for Bangladesh** 🇧🇩

BD CR7 is a cutting-edge, mobile-first PWA-based construction management system. Built with FastAPI backend, Next.js frontend, and Supabase database. Features integrated AI assistance for smarter project management.

## ✨ Key Features

### 🏢 Project Management
- Project creation, updates, and tracking
- Milestone and deadline management
- Progress reporting

### 👷 Workforce Management
- Worker registration and profiles
- Attendance tracking
- Daily logs

### 💰 Finance Management
- Transaction recording
- Budget management
- Expense tracking

### 📦 Materials Management
- Inventory tracking
- Stock transactions
- Supply chain management

### 📸 Evidence Management
- Progress photo uploads
- Cloud storage integration
- Visual progress tracking

### 🤖 AI-Powered Features
- AI chatbot assistance
- Smart project recommendations
- Automated report generation

### 🔐 Security
- JWT authentication
- Role-based access control
- Row-level security

## 🚀 Live Demo

| Service | URL | Status |
|---------|-----|--------|
| 🌐 **Frontend** | [https://bd-cr7.vercel.app](https://bd-cr7.vercel.app) | ✅ Live |
| 🔧 **Backend API** | [https://bd-cr7.vercel.app/api](https://bd-cr7.vercel.app/api) | ✅ Live |
| 📚 **API Documentation** | [https://bd-cr7.vercel.app/api/docs](https://bd-cr7.vercel.app/api/docs) | ✅ Live |

## 📱 Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **PWA**: next-pwa
- **Deployment**: Vercel

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.12+
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Deployment**: Vercel Serverless

### Integrations
- **File Storage**: Cloudinary
- **AI**: Custom AI integration
- **Monorepo**: PNPM Workspaces + Turborepo

## 🏛️ Architecture Overview

BD CR7 is built with a modular and scalable architecture. Each domain (projects, finance, workforce, etc.) exists as a separate module.

### Backend Modules
- 🔐 Authentication (Login/Registration)
- 👑 Admin (User Management)
- 💰 Finance (Transactions/Budgets)
- 🏗️ Projects (Project CRUD)
- 👷 Workforce (Workers/Attendance)
- 📦 Materials (Inventory)
- 📸 Evidence (Photo Uploads)
- 🤝 Contractors (Contractor Profiles)
- 📊 Reports (Dashboard Metrics)
- 📋 Audit (Audit Logs)
- ⚙️ Settings (Configuration)
- 🎯 Dynamic (Custom Fields)
- 🤖 AI (AI Integration)

### Frontend Modules
- 🔐 Auth (Login/Register Pages)
- 👑 Admin (Admin Dashboard)
- 💰 Finance (Finance Module)
- 🏗️ Projects (Project Management)
- 👷 Workforce (Workforce Dashboard)
- 📦 Materials (Materials Management)
- 📸 Evidence (Evidence Viewer)
- 🤝 Contractors (Contractor Management)
- 📊 Reports (Reports)
- 📋 Audit (Audit Trail)
- ⚙️ Settings (Settings)
- 🎯 Dynamic (Dynamic Config)

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 20+
- PNPM 10+
- Python 3.12+

### 1. Clone the Repository
```bash
git clone https://github.com/masumon/bd-CR7.git
cd bd-cr7
```

### 2. Install Dependencies
```bash
# Frontend and backend dependencies
pnpm install

# Python virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# .venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

### 3. Set Environment Variables
Copy `.env.example` to `.env` and fill in the values:

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset

# AI (Optional)
AI_API_KEY=your_ai_key
AI_ENDPOINT=your_ai_endpoint
```

### 4. Run Development Server
```bash
# Frontend (http://localhost:3000)
pnpm --filter ./apps/web dev

# Backend (http://localhost:8000)
uvicorn main:app --app-dir apps/api --host 127.0.0.1 --port 8000 --reload
```

### 5. Database Setup
Run the SQL migration files in Supabase SQL Editor in order:
- `001_users_roles.sql`
- `010_finance.sql`
- `020_projects.sql`
- `030_workforce.sql`
- `040_materials.sql`
- `050_evidence.sql`
- `060_reports.sql`
- `070_audit.sql`
- `080_contractors.sql`
- `090_settings.sql`

## 📊 Roles & Permissions

| Role | Access Level |
|------|--------------|
| 👑 **Super Admin** | Full system access, system settings |
| 👨‍💼 **Admin** | All modules, custom fields, workflows |
| 👨‍🔧 **Manager** | Projects, workforce, finance (read + write) |
| 👷 **Site Engineer** | Construction, materials, evidence |
| 💼 **Accountant** | Finance module only |
| 👀 **Viewer** | Read-only access to assigned modules |

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Contact

**👨‍💻 MUMAIN AHMED**  
Full-stack architect, UI systems designer, and deployment lead

- 📧 **Email**: [m.a.sumon92@gmail.com](mailto:m.a.sumon92@gmail.com)
- 🌐 **Website**: [https://mumainsumon.netlify.app](https://mumainsumon.netlify.app)
- 📘 **Facebook**: [https://www.facebook.com/sumon.mumain](https://www.facebook.com/sumon.mumain)
- 💬 **WhatsApp**: [https://wa.me/8801825007977](https://wa.me/8801825007977)

## 📄 License

Private / Internal project — BD CR7 Construction Management System.

---

**⭐ Star this repo if you find it useful!**

---

## Architecture 2 — Modular Design

Architecture 2 replaces the previous monolithic `features/` / `routers/` structure with a clean, domain-driven `modules/` layout on both frontend and backend. Every domain is self-contained: its own router, schema, service, and frontend view live together under one module folder.

### Backend Modules (`apps/api/modules/`)

| Module       | Route Prefix      | Responsibility                               |
|--------------|-------------------|----------------------------------------------|
| `auth`       | `/api/auth`       | Login, registration, token refresh           |
| `admin`      | `/api/admin`      | User management, role assignments            |
| `finance`    | `/api/finance`    | Transactions, budgets, expense tracking      |
| `projects`   | `/api/projects`   | Project CRUD, status, milestones             |
| `workforce`  | `/api/workforce`  | Workers, attendance, daily logs              |
| `materials`  | `/api/materials`  | Inventory, stock transactions                |
| `evidence`   | `/api/evidence`   | Progress photos, Cloudinary uploads          |
| `contractor` | `/api/contractor` | Contractor profiles and contracts            |
| `reports`    | `/api/reports`    | Dashboard metrics, finance/workforce summary |
| `audit`      | `/api/audit`      | Immutable audit log, activity timeline       |
| `settings`   | `/api/settings`   | System config, user preferences              |
| `dynamic`    | `/api/dynamic`    | Custom fields, workflow configurations       |
| `ai`         | `/api/ai`         | SUMONIX AI chat proxy, audit logging         |

### Frontend Modules (`apps/web/src/modules/`)

| Module         | Route                              |
|----------------|------------------------------------|
| `auth`         | `/login`, `/register`              |
| `admin`        | `/dashboard/admin`                 |
| `finance`      | `/dashboard/finance`               |
| `projects`     | `/dashboard/construction/projects` |
| `construction` | `/dashboard/construction`          |
| `workforce`    | `/dashboard/workforce`             |
| `materials`    | `/dashboard/materials`             |
| `evidence`     | `/dashboard/evidence`              |
| `contractor`   | `/dashboard/contractor`            |
| `reports`      | `/dashboard/reports`               |
| `audit`        | `/dashboard/audit`                 |
| `settings`     | `/dashboard/settings`              |
| `dynamic`      | `/dashboard/dynamic` (admin only)  |

---

## Monorepo Layout

```text
apps/
  api/                     FastAPI backend (Architecture 2)
    core/                   Shared utilities (auth, supabase, config)
    modules/                13 domain modules (router + schema + service)
    main.py                 App entrypoint, CORS, module registration
    requirements.txt
  web/                     Next.js 15 App Router PWA
    app/                    Next.js route tree
      (dashboard)/          Authenticated layout shell
        dashboard/          All protected pages
    src/
      modules/              13 frontend modules (views + components)
      hooks/                Shared React hooks (useDashboardStats, etc.)
      lib/                  API client, Supabase client, utilities
      store/                Zustand state management
packages/
  core-logic/               Shared business logic
  media-engine/             Cloudinary integration helpers
  rbac-engine/              Role-based access control
  ui-system/                Shared UI components
supabase/
  migrations/               SQL migration files (see below)
api/
  main.py                   Vercel Python entrypoint shim
```

---

## Database Migrations (Architecture 2)

Run in Supabase SQL Editor **in order**. Each file is idempotent (`CREATE TABLE IF NOT EXISTS`, `CREATE POLICY IF NOT EXISTS`).

| Order | File                            | Creates                              |
|-------|---------------------------------|--------------------------------------|
| 1     | `100_arch2_001_users_roles.sql` | `profiles`, `roles`, RLS policies    |
| 2     | `100_arch2_010_finance.sql`     | `transactions`, `budgets`            |
| 3     | `100_arch2_020_projects.sql`    | `projects`, `milestones`             |
| 4     | `100_arch2_030_workforce.sql`   | `workers`, `attendance_logs`         |
| 5     | `100_arch2_040_materials.sql`   | `materials`, `material_transactions` |
| 6     | `100_arch2_050_evidence.sql`    | `evidence`, `evidence_reviews`       |
| 7     | `100_arch2_060_reports.sql`     | Reporting views                      |
| 8     | `100_arch2_070_audit.sql`       | `audit_logs`                         |
| 9     | `100_arch2_080_contractor.sql`  | `contractors`, `contracts`           |
| 10    | `100_arch2_090_settings.sql`    | `system_settings`, `user_preferences`|

> **JWT note:** RLS policies use `auth.jwt() ->> 'role'` (text extraction) — not `->` (JSON).

---

## Tech Stack

| Layer           | Technology                                          |
|-----------------|-----------------------------------------------------|
| Frontend        | Next.js 15, React 19, TypeScript, Tailwind CSS      |
| PWA             | next-pwa (service worker, offline cache)            |
| Backend         | FastAPI, Python 3.11+, Pydantic v2                  |
| Database        | Supabase PostgreSQL with Row Level Security         |
| Auth            | Supabase Auth + JWT                                 |
| File Storage    | Cloudinary (organized by entity type)               |
| State           | Zustand                                             |
| Monorepo        | PNPM workspaces + Turborepo                         |
| Frontend Deploy | Vercel                                              |
| Backend Deploy  | Render                                              |

---

## Prerequisites

- Node.js 20+
- PNPM 10+
- Python 3.11+

---

## Environment Setup

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

Required variables:

```env
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Backend
NEXT_PUBLIC_API_URL=https://bd-cr7-api.onrender.com

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=

# AI (optional)
SUMONIX_AI_API_KEY=
SUMONIX_AI_ENDPOINT=
```

---

## Local Development

### Install dependencies

```bash
pnpm install
python -m venv .venv
source .venv/bin/activate          # Linux/macOS
# .venv\Scripts\activate           # Windows
pip install -r requirements.txt
```

### Run everything (frontend + backend)

```bash
# Frontend (Next.js dev server on http://localhost:3000)
pnpm --filter ./apps/web-pwa dev

# Backend (FastAPI on http://localhost:8000)
uvicorn main:app --app-dir apps/api-core-python --host 127.0.0.1 --port 8000 --reload
```

### Type-check, lint, build

```bash
pnpm type-check        # TypeScript check across workspace
pnpm lint              # ESLint across workspace
pnpm build             # Production build (all apps)
```

### Frontend only

```bash
pnpm --filter ./apps/web-pwa type-check
pnpm --filter ./apps/web lint
pnpm --filter ./apps/web build
```

### Backend tests

```bash
python -m pytest apps/api/tests -q
```

### Backend health check

```bash
curl http://localhost:8000/health
# Expected: {"status":"ok"}
```

---

## Deployment

### Frontend → Vercel

Vercel auto-deploys on every push to `main`. No manual steps required.
Environment variables are managed in the Vercel project dashboard.

### Backend → Vercel

Backend is deployed as a Vercel serverless function. Push to `main` triggers auto-deploy.
Environment variables are managed in the Vercel project dashboard.

---

## Roles and Access

| Role            | Access Level                                    |
|-----------------|-------------------------------------------------|
| `super_admin`   | Full system access, system settings             |
| `admin`         | All modules, custom fields, workflows           |
| `manager`       | Projects, workforce, finance (read + write)     |
| `site_engineer` | Construction, materials, evidence               |
| `accountant`    | Finance module only                             |
| `viewer`        | Read-only access to assigned modules            |

---

## Validation Status

| Check                           | Status                                    |
|---------------------------------|-------------------------------------------|
| Backend module imports (13/13)  | Pass                                      |
| Frontend TypeScript check       | Pass                                      |
| Frontend production build       | Pass                                      |
| Backend `/health` endpoint      | Pass                                      |
| All `@/features/` refs removed  | Done                                      |
| SQL migrations (Architecture 2) | Ready — run manually in Supabase          |

---

## Security Conventions

- Never commit `.env` or real secrets — only `.env.example`
- All FastAPI endpoints require JWT via `Depends(get_current_user)`
- Supabase RLS enforces row-level access by user role
- Cloudinary uploads scoped by entity type (projects, evidence, workers)
- No hardcoded data in frontend — all values come from API or show empty state

---

## Developer

**MUMAIN AHMED**
Full-stack architect, UI systems designer, and deployment lead for BD CR7

- Email: <m.a.sumon92@gmail.com>
- Website: <https://mumainsumon.netlify.app>
- Facebook: <https://www.facebook.com/sumon.mumain>
- WhatsApp: <https://wa.me/8801825007977>

---

## License

Private / Internal project — BD CR7 Construction Management System.
