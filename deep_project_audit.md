# 🧠 Deep Project Audit Report
### BD CR7 Ultra Enterprise ERP — Forensic-Level Code Audit
**তারিখ:** ২০২৬-০৪-০৫ | **অডিটর:** Principal Software Architect (AI-Assisted)

---

## 1. টেক স্ট্যাক বিশ্লেষণ

### 1.1 Frontend (apps/web-pwa)

| লাইব্রেরি | ভার্সন | ব্যবহার | ফাইল রেফারেন্স |
|---|---|---|---|
| `next` | 15.5.14 | App Router, Server/Client Components, Edge Middleware | `app/layout.tsx`, `middleware.ts` |
| `react` + `react-dom` | 18.3.1 | UI rendering | সব `page.tsx` এবং feature components |
| `@supabase/supabase-js` | 2.56.0 | Auth, Database queries (anon key) | `src/lib/supabase.ts`, `src/lib/supabase/client.ts` |
| `zustand` | 4.5.5 | Global state (auth, offline queue, modules, expenses) | `src/store/*.ts` (5টি store) |
| `framer-motion` | 11.11.9 | Auth page animations (splash, slide transitions) | `app/(auth)/login/page.tsx` |
| `lucide-react` | 0.452.0 | Icon library (সমস্ত আইকন এখান থেকে) | `AppShell.tsx`, `FinanceExpenseView.tsx` ইত্যাদি |
| `recharts` | 2.12.7 | Dashboard charts / KPI visualization | `src/features/dashboard/DashboardHomeView.tsx` |
| `zod` | 3.23.8 | Schema validation (offline queue, form inputs) | `src/lib/validators.ts` |
| `next-pwa` | 5.6.0 | Service Worker, PWA manifest | `apps/web-pwa/public/manifest.json` |
| `tailwindcss` | 3.4.14 | Utility CSS, custom ERP tokens | `tailwind.config.ts`, `app/globals.css` |

**Fonts (Google Fonts — next/font/google):**
- `Inter` → `--font-body` (latin)
- `Poppins` → `--font-display` (headings)
- `Noto_Sans_Bengali` → `--font-bengali` (Bangla text)
- `Outfit` → `--font-outfit` (auth UI)
- `Hind_Siliguri` → `--font-hind` (Bangla auth)

**ফাইল:** `apps/web-pwa/app/layout.tsx:2`

---

### 1.2 Backend (apps/api-core-python)

| লাইব্রেরি | ভার্সন | ব্যবহার | ফাইল রেফারেন্স |
|---|---|---|---|
| `fastapi` | 0.115.0 | REST API framework, routing, dependency injection | `main.py`, `routers/*.py` |
| `uvicorn[standard]` | 0.30.6 | ASGI server | Vercel serverless + local dev |
| `pydantic` | 2.11.7 | Request/response validation | `schemas/*.py` |
| `supabase` | 2.18.1 | DB queries, Auth admin API | `core/supabase.py`, সব router |
| `sqlalchemy` | 2.0.35 | Raw SQL fallback (hr.py uses `tx()`, `fetch_all()`) | `core/db.py`, `routers/hr.py` |
| `psycopg[binary]` | 3.2.12 | PostgreSQL driver (SQLAlchemy backend) | `core/db.py` |
| `redis[hiredis]` | 5.2.1 | Rate limiting (distributed, per-IP) | `core/middleware.py` |
| `python-dotenv` | 1.0.1 | `.env` file loading | `core/config.py` |
| `langdetect` | 1.0.9 | AI engine — ভাষা সনাক্তকরণ | `apps/api-core-python/sumonix_ai/agent_engine.py` |
| `rapidfuzz` | 3.9.7 | AI engine — fuzzy string matching | `sumonix_ai/agent_engine.py` |
| `deep-translator` | 1.11.4 | AI engine — text translation | `sumonix_ai/agent_engine.py` |
| `httpx` | 0.27.2 | HTTP client (external API calls) | `services/system_monitor.py` |
| `pgvector` | 0.3.6 | Vector similarity (AI memory) | `sumonix_ai/rag_memory/__init__.py` |

**সম্ভাব্য Unused/Redundant dependencies:**
- `pgvector` — `apps/api-core-python/sumonix_ai/rag_memory/__init__.py` খালি (`__init__` only), vector store implementation নেই
- `email-validator` — `pydantic`-এ built-in, আলাদা package হিসেবে সরাসরি ব্যবহার নেই
- `sqlalchemy` এবং `supabase` — দুটো ORM/client একসাথে ব্যবহার হচ্ছে (hr.py তে SQLAlchemy, বাকি সব supabase)

---

### 1.3 Workspace Packages (packages/)

| Package | ফাইল | বাস্তব ব্যবহার |
|---|---|---|
| `@bdcr7/core-logic` | `packages/core-logic/src/index.ts` | খালি stub — `export {};` শুধু |
| `@bdcr7/media-engine` | `packages/media-engine/src/index.ts` | খালি stub — কোনো implementation নেই |
| `@bdcr7/rbac-engine` | `packages/rbac-engine/src/index.ts` | খালি stub — RBAC logic নেই |
| `@bdcr7/ui-system` | `packages/ui-system/src/index.ts` + `DeveloperBadge.jsx` | শুধু `DeveloperBadge` component |

⚠️ **সব 4টি workspace package মূলত empty stubs।** `web-pwa/package.json` এ `@bdcr7/media-engine` এবং `@bdcr7/rbac-engine` depend করা হয়েছে কিন্তু বাস্তবে কোনো export নেই।

---

## 2. আর্কিটেকচার বিশ্লেষণ

### 2.1 সম্পূর্ণ ফোল্ডার স্ট্রাকচার

```
bd-CR7/
├── .env.example
├── vercel.json                          # Vercel deployment config
├── turbo.json                           # Turborepo pipeline
├── pnpm-workspace.yaml
├── package.json                         # Root workspace
├── requirements.txt                     # Root Python deps (legacy)
├── api/
│   └── main.py                          # Vercel serverless entry (imports apps/api-core-python)
├── apps/
│   ├── api-core-python/                 # FastAPI Python backend
│   │   ├── main.py                      # App factory (create_app)
│   │   ├── core/
│   │   │   ├── auth.py                  # JWT bearer + role middleware
│   │   │   ├── config.py                # Settings (env vars)
│   │   │   ├── db.py                    # SQLAlchemy engine + helpers
│   │   │   ├── exceptions.py            # Custom exceptions
│   │   │   ├── logging.py               # Logging config
│   │   │   ├── middleware.py            # Rate limiting middleware
│   │   │   └── supabase.py              # Supabase client factory
│   │   ├── routers/
│   │   │   ├── ai.py                    # /api/ai endpoints
│   │   │   ├── ai_employment.py         # /api/ai-employment
│   │   │   ├── approval_intelligence.py # /api/ai-intelligence
│   │   │   ├── auth.py                  # /api/auth (register/login/me)
│   │   │   ├── finance.py               # /api/finance (accounts/expenses/transfer)
│   │   │   ├── hr.py                    # /api/construction (workers/attendance)
│   │   │   ├── import_supply.py         # /api/import-supply
│   │   │   ├── pos.py                   # /api/pos (products/sales)
│   │   │   ├── project_management.py    # /api/project-management
│   │   │   └── users.py                 # /api/users
│   │   ├── schemas/                     # Pydantic models
│   │   ├── services/                    # Business logic layer
│   │   ├── sumonix_ai/                  # AI engine (apps copy)
│   │   ├── workers/
│   │   │   └── scheduler.py             # Background task scheduler
│   │   └── tests/                       # Unit tests
│   └── web-pwa/                         # Next.js 15 PWA
│       ├── app/
│       │   ├── layout.tsx               # Root layout (fonts, metadata, SW)
│       │   ├── page.tsx                 # Root redirect → /dashboard
│       │   ├── globals.css              # Design tokens, ERP CSS classes
│       │   ├── (auth)/                  # Auth group routes
│       │   │   ├── login/page.tsx       # 5-view SPA auth (966+ lines!)
│       │   │   ├── register/page.tsx
│       │   │   ├── forgot-password/page.tsx
│       │   │   └── welcome/page.tsx
│       │   ├── (dashboard)/             # Protected dashboard group
│       │   │   ├── layout.tsx           # MobileAppShell wrapper
│       │   │   └── dashboard/
│       │   │       ├── page.tsx         # Dashboard home
│       │   │       ├── finance/         # Finance module
│       │   │       ├── workforce/       # Worker management
│       │   │       ├── materials/       # Construction materials
│       │   │       ├── evidence/        # Document management
│       │   │       ├── construction/    # Construction overview
│       │   │       ├── ai/              # SUMONIX AI chat
│       │   │       ├── audit/           # Audit log
│       │   │       ├── reports/         # Reports
│       │   │       ├── settings/        # Settings + RBAC
│       │   │       ├── pos/             # Point of Sale
│       │   │       ├── import/          # Import/LC
│       │   │       ├── contractor/      # Contractor module
│       │   │       ├── crm/             # CRM module
│       │   │       └── inventory/       # Advanced inventory
│       │   ├── auth/                    # Legacy /auth/* routes (duplicates)
│       │   └── offline/page.tsx         # Offline fallback page
│       ├── middleware.ts                 # Edge: protect /dashboard/*
│       ├── src/
│       │   ├── components/
│       │   │   ├── appshell/            # AppShell, Sidebar, TopBar, BottomNav
│       │   │   ├── auth/                # Auth-specific UI components
│       │   │   ├── dashboard/           # KPI, Activity, Module grid
│       │   │   ├── layout/              # DashboardShell, ErpLayout, MobileAppShell
│       │   │   ├── modules/             # AiPanel, AuthPanel
│       │   │   └── ui/                  # Reusable: Button, Card, Dialog, Table, etc.
│       │   ├── features/                # Feature-level views
│       │   │   ├── audit/
│       │   │   ├── auth/
│       │   │   ├── construction/        # WorkforceView, MaterialsView, EvidenceView
│       │   │   ├── contractor/
│       │   │   ├── crm/
│       │   │   ├── dashboard/
│       │   │   ├── finance_core/        # FinanceExpenseView + sub-features
│       │   │   ├── import_supply/
│       │   │   ├── inventory/
│       │   │   ├── reports/
│       │   │   ├── retail_pos/
│       │   │   ├── settings_rbac/       # SettingsFeature (9 tabs)
│       │   │   └── sumonix_ai_ui/       # FloatingChat
│       │   ├── hooks/                   # Custom hooks
│       │   ├── lib/                     # Utilities
│       │   └── store/                   # Zustand stores
├── packages/                            # Workspace packages (mostly empty stubs)
├── sumonix_ai/                          # Root-level AI engine (duplicate!)
├── supabase/
│   └── migrations/                      # 22 SQL migration files
└── scripts/
    └── danger/                          # Database management scripts
```

---

### 2.2 আর্কিটেকচারাল সমস্যা

#### ❗ মনোলিথিক ফাইল সমস্যা

| ফাইল | আনুমানিক লাইন | সমস্যা |
|---|---|---|
| `apps/web-pwa/app/(auth)/login/page.tsx` | ~966 লাইন | ৫টি View (splash, landing, signin, signup, otp), theme toggle, WebAuthn, biometric, OTP — একটি ফাইলে |
| `apps/web-pwa/src/features/settings_rbac/SettingsFeature.tsx` | ~400+ লাইন | ৯টি Tab সহ সব settings একটি component |
| `apps/web-pwa/src/features/finance_core/FinanceExpenseView.tsx` | ~300+ লাইন | Expense CRUD + Fund Manager + charts একসাথে |

#### ❗ দ্বৈত (Duplicate) ডিরেক্টরি

```
sumonix_ai/                          # Root level
apps/api-core-python/sumonix_ai/     # App level (same code!)
```

`apps/api-core-python/sumonix_ai/__init__.py` → `from sumonix_ai.agent_engine import *` — root থেকে import করছে। এটি একটি নির্ভরতার বৃত্ত তৈরি করে এবং `sys.path` manipulation ছাড়া কাজ নাও করতে পারে।

#### ❗ Legacy Route Duplication

```
apps/web-pwa/app/auth/           # /auth/* (পুরনো routes)
apps/web-pwa/app/(auth)/         # /(auth)/* (নতুন route group)
```

উভয় route group-ই live আছে, ব্যবহারকারীরা `/auth/login` বা `/(auth)/login` উভয় পথেই যেতে পারেন — পরিষ্কার নয়।

---

## 3. স্টেট ও ডাটা ফ্লো

### 3.1 Zustand Stores বিশ্লেষণ

#### `src/store/authStore.ts`
```typescript
// Persisted with localStorage key: "bdcr7-auth"
// State: token (JWT), role, userId, loading, hydrated, error
// Methods: initialize(), fetchUser(), login(), register(), logout()
```
- `initialize()` → Supabase `getSession()` → `fetchUserRole()` → `users` table query
- `login()` → Supabase `signInWithPassword()` → role fetch
- Token `localStorage` এ persist হয় → **XSS attack এ vulnerable** (Section 7 দেখুন)

#### `src/store/offlineQueue.ts`
```typescript
// Persisted with localStorage key: "offline-queue"
// Max 500 items (FIFO with cap)
// Methods: addToQueue, addToQueueValidated (Zod), dequeue, peek, requeue, clearQueue
```

#### `src/store/moduleStore.ts`
```typescript
// Persisted with localStorage key: "bdcr7-module-toggles"
// 5 dynamic modules: import_lc, pos, crm, contractor, inventory_advanced
// Default: সব disabled
```

#### `src/store/appStore.ts`
- Dashboard stats (total_balance, monthly_sales, pending_expenses) Supabase থেকে load করে
- Zustand এ cache করে

#### `src/store/expensesStore.ts`
- Expenses list cache করে

---

### 3.2 Data Fetching Patterns

**Pattern 1: Direct Supabase Client (Feature Components)**
```typescript
// FinanceExpenseView.tsx - createClient() দিয়ে direct query
const supabase = useMemo(() => createClient(), []);
const { data } = await supabase
  .from("expenses")
  .select("id,amount,status,description,...")
  .order("created_at", { ascending: false })
  .limit(60);
```
ফাইল: `src/features/finance_core/FinanceExpenseView.tsx:53-62`

**Pattern 2: REST API via fetch (offlineSync)**
```typescript
// offlineSync.ts - API এ POST/PUT/PATCH/DELETE
const response = await fetch(`${apiBase}${item.endpoint}`, {
  method: item.method,
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify(item.payload),
});
```
ফাইল: `src/lib/offlineSync.ts:38-46`

**Pattern 3: Hooks (useFinance.js, useWorkers.js)**
- JavaScript (untyped) custom hooks — TypeScript থেকে বাদ পড়ে গেছে

**মূল পর্যবেক্ষণ:**
- কোনো `react-query` বা `SWR` নেই — সব manual fetch + useEffect pattern
- কিছু component সরাসরি Supabase query করছে, কিছু API call করছে — **inconsistent data layer**

---

### 3.3 Form Handling

- **React Hook Form / Formik:** ব্যবহার নেই
- সব form `useState` দিয়ে managed, manual `onChange` handler
- Validation: `zod` (`src/lib/validators.ts`) — তবে শুধু offline queue এবং API schema validation-এর জন্য, form UI validation-এ নয়
- Custom validation: `PasswordStrengthMeter` component (`src/components/auth/PasswordStrengthMeter.tsx`)

---

## 4. API ও সার্ভার লজিক

### 4.1 FastAPI Endpoints সম্পূর্ণ তালিকা

#### `/api/auth` (routers/auth.py)

| Method | Endpoint | Input | Processing | Response |
|---|---|---|---|---|
| POST | `/api/auth/register` | `RegisterRequest {email, password, full_name}` | Supabase auth.admin.create_user + users upsert + login | `AuthResponse {access_token, user_id, role}` |
| POST | `/api/auth/login` | `LoginRequest {email, password}` | Supabase sign_in_with_password + role fetch | `AuthResponse {access_token, user_id, role}` |
| POST | `/api/auth/logout` | Bearer token | Token validation only (stateless) | `{message}` |
| GET | `/api/auth/me` | Bearer token | users table query with role join | `{id, email, full_name, role}` |

#### `/api/finance` (routers/finance.py)

| Method | Endpoint | Role Required | Processing |
|---|---|---|---|
| GET | `/api/finance/accounts` | authenticated | `fund_accounts` select (role-filtered) |
| POST | `/api/finance/transfer` | admin, maker | `transfer_funds_atomic` RPC |
| POST | `/api/finance/expenses` | admin, maker | `create_expense_atomic` RPC + risk scoring |
| GET | `/api/finance/expenses` | authenticated | `expenses` select (paginated, role-filtered) |
| GET | `/api/finance/expenses/{id}` | authenticated | Single expense (ownership check) |
| PATCH | `/api/finance/expenses/{id}` | admin, maker | Update pending expense |
| DELETE | `/api/finance/expenses/{id}` | admin, maker | Delete pending expense |
| POST | `/api/finance/expenses/{id}/approve` | admin, checker | `approve_expense_atomic` RPC |
| GET | `/api/finance/balance/{account_id}` | authenticated | Account balance (role-filtered) |

#### `/api/construction` (routers/hr.py)

| Method | Endpoint | Role Required | Database |
|---|---|---|---|
| POST | `/api/construction/workers` | admin, maker | SQLAlchemy INSERT into `workers` |
| GET | `/api/construction/workers` | authenticated | `fetch_all()` SELECT from `workers` |
| POST | `/api/construction/attendance` | admin, maker, checker | SQLAlchemy INSERT into `attendance` (geofence check) |
| GET | `/api/construction/attendance` | authenticated | SELECT from `attendance` |
| POST | `/api/construction/materials/movement` | admin, maker | SQLAlchemy INSERT into `material_movements` |
| GET | `/api/construction/materials` | authenticated | SELECT from `materials` |

⚠️ **hr.py SQLAlchemy ব্যবহার করে, বাকি সব routers Supabase client — inconsistent!**

#### `/api/pos` (routers/pos.py)

| Method | Endpoint | Processing |
|---|---|---|
| POST/GET/PATCH/DELETE | `/api/pos/products` | CRUD on `products` table |
| GET | `/api/pos/products/barcode/{barcode}` | Barcode lookup |
| POST | `/api/pos/customers` | INSERT into `customers` |
| POST | `/api/pos/sales` | `create_sale_atomic` RPC |
| GET | `/api/pos/sales` | Sales history with customer join |

#### `/api/import-supply` (routers/import_supply.py)
- LC (Letter of Credit) records CRUD
- Shipment tracking

#### `/api/project-management` (routers/project_management.py)
- Project CRUD
- Timeline entries
- File attachments

#### `/api/ai` (routers/ai.py)
- AI query endpoint → `sumonix_ai.agent_engine`

#### `/api/ai-intelligence` (routers/approval_intelligence.py)
- Approval risk scoring

#### `/api/users` (routers/users.py)
- User list/update (admin only)

---

### 4.2 Vercel Deployment Architecture

```json
// vercel.json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/main.py" }
  ]
}
```

- Frontend: Vercel static/serverless (Next.js)
- Backend: Python serverless function (`api/main.py` → `apps/api-core-python/main.py`)
- একই domain, `/api/*` সব Python handler-এ যায়

---

## 5. ডাটাবেস স্কিমা

### 5.1 প্রধান টেবিলসমূহ (Migration analysis থেকে)

#### Auth & Users
```sql
-- roles (001_BD_CR7_DB_INIT.sql)
roles: id SERIAL PK, name VARCHAR(50) UNIQUE, description TEXT
-- roles: Admin, Engineer, Supervisor, Mason, Worker (001)
-- updated roles: super_admin, admin, maker, checker, viewer, worker (003)

-- users (003_full_saas_schema.sql)
users: id UUID PK, email VARCHAR UNIQUE, full_name TEXT,
       password_hash TEXT, role_id INT FK(roles), is_active BOOL,
       workspace_id UUID FK(workspaces), created_at, updated_at

-- workspaces (003)
workspaces: id UUID PK, name TEXT, owner_user_id UUID, plan VARCHAR,
            created_at

-- biometric_credentials (012)
biometric_credentials: id UUID PK, user_id UUID FK(users),
    credential_id TEXT UNIQUE, public_key TEXT, device_name TEXT,
    sign_count INT, transports TEXT[], is_active BOOL
```

#### Finance
```sql
-- fund_accounts (003)
fund_accounts: id UUID PK, workspace_id UUID, account_name TEXT,
               currency VARCHAR(3), balance NUMERIC(18,4),
               owner_user_id UUID

-- expenses (003)
expenses: id UUID PK, workspace_id UUID, account_id UUID,
          category_id UUID, amount NUMERIC, description TEXT,
          status VARCHAR CHECK (pending|approved|rejected),
          maker_id UUID, checker_id UUID,
          risk_level VARCHAR, risk_score INT,
          receipt_url TEXT, created_at, approved_at

-- fund_transfers (003)
fund_transfers: id UUID PK, from_account_id UUID, to_account_id UUID,
                amount NUMERIC, reference TEXT, actor_user_id UUID

-- expense_categories (001)
expense_categories: id SERIAL PK, name VARCHAR UNIQUE, description TEXT
-- 12টি category: Land & Legal, Labour & Wages, Construction Materials...
```

#### Construction / HR
```sql
-- workers (001, 017)
workers: id UUID PK, full_name TEXT, trade TEXT, daily_rate NUMERIC,
         is_active BOOL, workspace_id UUID, created_by UUID, stock_qty NUMERIC

-- attendance (001, 017)
attendance: id UUID PK, worker_id UUID FK(workers), attendance_date DATE,
            latitude FLOAT, longitude FLOAT, marked_by UUID, status VARCHAR

-- materials (001, 017)
materials: id UUID PK, name TEXT, unit TEXT, current_stock NUMERIC,
           workspace_id UUID, reorder_level NUMERIC

-- material_movements (017)
material_movements: id UUID PK, material_id UUID, movement_type VARCHAR,
                    quantity NUMERIC, note TEXT, actor_id UUID
```

#### POS / Retail
```sql
-- products (003)
products: id UUID PK, name TEXT, barcode TEXT UNIQUE,
          purchase_price NUMERIC, sell_price NUMERIC,
          stock_qty NUMERIC, workspace_id UUID

-- customers (003)
customers: id UUID PK, name TEXT, phone TEXT, email TEXT, created_by UUID

-- sales (003)
sales: id UUID PK, customer_id UUID, cashier_id UUID,
       total_amount NUMERIC, workspace_id UUID, created_at

-- sale_items (003)
sale_items: id UUID PK, sale_id UUID FK(sales), product_id UUID,
            quantity NUMERIC, unit_price NUMERIC
```

#### Projects
```sql
-- projects (003)
projects: id UUID PK, name TEXT, description TEXT,
          status VARCHAR, workspace_id UUID,
          start_date DATE, end_date DATE

-- project_timelines (011)
project_timelines: id UUID PK, project_id UUID FK(projects),
                   phase TEXT, status VARCHAR, planned_date DATE

-- project_files (019)
project_files: id UUID PK, project_id UUID FK(projects),
               file_name TEXT, file_url TEXT, uploaded_by UUID
```

#### Contractors / CRM / Inventory
```sql
-- contractors (014)
contractors: id UUID PK, name TEXT, trade TEXT, phone TEXT,
             workspace_id UUID, status VARCHAR

-- crm_contacts (015)
crm_contacts: id UUID PK, name TEXT, phone TEXT, email TEXT,
              status VARCHAR, workspace_id UUID

-- inventory_items (016)
inventory_items: id UUID PK, sku TEXT UNIQUE, name TEXT,
                 warehouse_id UUID, quantity NUMERIC, workspace_id UUID
```

#### AI
```sql
-- ai_interactions (013)
ai_interactions: id UUID PK, user_id UUID, query TEXT,
                 response TEXT, module_context VARCHAR,
                 created_at

-- ai_memory (013)
ai_memory: id UUID PK, user_id UUID, context TEXT,
           embedding VECTOR(1536), created_at
```

---

### 5.2 CRUD Mapping

| Operation | Table | File | Method |
|---|---|---|---|
| Create expense | `expenses` | `routers/finance.py:40`, `services/finance.py:73` | `create_expense_atomic` RPC |
| Read expenses | `expenses` | `routers/finance.py:55` | `supabase_service.table("expenses").select()` |
| Update expense | `expenses` | `routers/finance.py:101` | `supabase_service.table("expenses").update()` |
| Delete expense | `expenses` | `routers/finance.py:130` | `supabase_service.table("expenses").delete()` |
| Create worker | `workers` | `routers/hr.py:29` | SQLAlchemy INSERT |
| Read workers | `workers` | `routers/hr.py:40` | `fetch_all()` SQL SELECT |
| Create product | `products` | `routers/pos.py:32` | `supabase_service.table("products").insert()` |
| Read products | `products` | `routers/pos.py:46` | `supabase_service.table("products").select()` |
| Create sale | `sales`+`sale_items` | `routers/pos.py:143`, `services/pos.py` | `create_sale_atomic` RPC |
| Read expenses (client) | `expenses` | `src/features/finance_core/FinanceExpenseView.tsx:55` | Direct Supabase client |
| Read workers (client) | `workers` | `src/hooks/useWorkers.js` | Direct Supabase client |

---

## 6. এনভায়রনমেন্ট ও কনফিগ

### 6.1 Environment Variables সম্পূর্ণ তালিকা

| Variable | Used In | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `src/lib/offlineSync.ts:8`, `src/lib/api.ts` | Frontend → Backend API base URL |
| `NEXT_PUBLIC_SUPABASE_URL` | `src/lib/supabase.ts:3`, `src/lib/supabase/client.ts` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `src/lib/supabase.ts:4`, `src/lib/supabase/client.ts` | Supabase anonymous key |
| `SUPABASE_URL` | `core/config.py:38` | Backend Supabase URL |
| `SUPABASE_ANON_KEY` | `core/config.py:39` | Backend anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | `core/config.py:40` | Backend service role key (admin) |
| `SUPABASE_DB_PASSWORD` | `core/config.py:41` | DB password (fallback URL builder) |
| `DATABASE_URL` | `core/config.py:42`, `core/db.py` | PostgreSQL connection string |
| `APP_NAME` | `core/config.py:27` | FastAPI app title |
| `APP_ENV` | `core/config.py:29` | Environment (development/production/staging) |
| `VERCEL_ENV` | `core/config.py:30` | Vercel-injected environment |
| `ENVIRONMENT` | `core/config.py:31` | Alternate env var |
| `LOG_LEVEL` | `core/config.py:37` | Logging level (INFO/DEBUG/WARNING) |
| `CORS_ORIGINS` | `core/config.py:43`, `main.py` | Allowed CORS origins (CSV) |
| `REDIS_URL` | `core/config.py:44`, `core/middleware.py:22` | Redis URL for rate limiting |
| `RATE_LIMIT_REQUESTS_PER_MINUTE` | `core/config.py:57` | Rate limit threshold |
| `REQUIRE_SUPABASE_IN_PRODUCTION` | `core/config.py:45` | Fail-fast flag |
| `REQUIRE_REDIS_IN_PRODUCTION` | `core/config.py:51` | Redis required flag |

### 6.2 Next.js Middleware (middleware.ts)

```typescript
// apps/web-pwa/middleware.ts
// /dashboard/* route protect করে Supabase cookie check দিয়ে
// Cookie pattern: sb-*-auth-token
// Redirect: → /login?returnTo=<original-path>
```
- **Matcher:** `/dashboard/:path*`
- **Limitation:** Heavy Supabase client import নেই (Edge-compatible) — শুধু cookie presence check, token validity নয়

### 6.3 Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "pnpm --filter web-pwa run build",
  "functions": { "api/main.py": { "maxDuration": 30 } },
  "rewrites": [{ "source": "/api/:path*", "destination": "/api/main.py" }]
}
```

### 6.4 Turborepo Pipeline

```json
// turbo.json — build/lint/type-check pipeline
// Parallel tasks with dependency caching
```

---

## 7. কোড কোয়ালিটি ও সিকিউরিটি

### 7.1 কোড কোয়ালিটি সমস্যা

#### ❌ Monolithic Components

`apps/web-pwa/app/(auth)/login/page.tsx` — ৯৬৬+ লাইনের একটি ফাইলে:
- `ThemeToggle` component
- `DevFooter` component
- `SplashScreen` view
- `LandingView` view
- `SignInView` view
- `SignUpView` view
- `OTPView` view
- All event handlers: `login()`, `register()`, `signInWithOtp()`, `verifyOtp()`, `signInWithOAuth()`, `ensureBiometricCredential()`, `verifyBiometricAssertion()`

**এটি Single Responsibility Principle এর সরাসরি লঙ্ঘন।**

#### ❌ Inconsistent Database Access Layer

```python
# hr.py — SQLAlchemy ব্যবহার করে
with tx() as conn:
    conn.exec_driver_sql("INSERT INTO workers ...")

# finance.py — Supabase client ব্যবহার করে
supabase_service.table("fund_accounts").select(...)
```

দুটো ভিন্ন database layer একই application-এ — maintenance nightmare।

#### ❌ JavaScript Files TypeScript প্রজেক্টে

```
src/hooks/useFinance.js      # .js extension — type safety নেই
src/hooks/useWorkers.js      # .js extension — type safety নেই
```

বাকি সব `.ts`/`.tsx`, কিন্তু এই দুটো hooks untyped।

#### ❌ Magic Numbers / Hardcoded Values

```python
# routers/hr.py:14-15 — হার্ডকোড করা GPS coordinates
SITE_LAT = 23.777176  # Dhaka coordinates
SITE_LNG = 90.399452
MAX_RADIUS_KM = 2.0
```

এটি environment variable বা database configuration থেকে আসা উচিত।

#### ❌ Empty Workspace Packages

```typescript
// packages/core-logic/src/index.ts
export {};

// packages/rbac-engine/src/index.ts
export {};

// packages/media-engine/src/index.ts
export {};
```

`web-pwa/package.json`-এ dependency আছে কিন্তু কোনো implementation নেই।

#### ❌ Duplicate AI Module Directory

```
sumonix_ai/                               # Root level
apps/api-core-python/sumonix_ai/          # App level
```

`apps/api-core-python/sumonix_ai/__init__.py`:
```python
from sumonix_ai.agent_engine import *  # noqa: F401,F403
```
Root level থেকে import করছে → sys.path এর উপর নির্ভরশীল, fragile।

#### ❌ widthClassFromPct function — Manual Mapping

```typescript
// FinanceExpenseView.tsx:30-40
function widthClassFromPct(pct: number): string {
  if (pct >= 90) return "w-full";
  if (pct >= 80) return "w-5/6";
  // ...
}
```
Tailwind `width` class hardcode করা — Tailwind CSS এ `style={{ width: `${pct}%` }}` বা JIT দিয়ে সহজ করা যেত।

---

### 7.2 সিকিউরিটি ঝুঁকি

#### 🔴 Critical: JWT Token localStorage এ Store (XSS Risk)

```typescript
// authStore.ts:192-196
persist(
  (set) => ({ ... }),
  {
    name: "bdcr7-auth",
    partialize: (state) => ({
      token: state.token,  // ⚠️ JWT localStorage এ!
      role: state.role,
      userId: state.userId,
    }),
  }
)
```
**ফাইল:** `src/store/authStore.ts:192`

`localStorage` JavaScript দিয়ে সরাসরি accessible — XSS vulnerability থাকলে attacker JWT token চুরি করতে পারে। `httpOnly` cookie ব্যবহার করা নিরাপদ।

#### 🔴 Critical: Client-Side RBAC Bypass

```typescript
// src/lib/rbac.ts — Static client-side role map
export const ROLE_ACCESS: Record<string, string[]> = {
  super_admin: ["/dashboard", "/dashboard/construction", ...],
  viewer: ["/dashboard", "/dashboard/ai", ...],
};
```
**ফাইল:** `src/lib/rbac.ts:1-55`

এই RBAC check শুধু UI layer-এ করা হয়েছে। Middleware (`middleware.ts`) শুধু session cookie আছে কিনা চেক করে, role verify করে না। একজন `viewer` role-এর user browser console থেকে role পরিবর্তন করে restricted routes access করতে পারে।

#### 🔴 Critical: WebAuthn Server-Side Verification অনুপস্থিত

```typescript
// webauthn.ts:116-142
export async function verifyBiometricAssertion(token: string): Promise<void> {
  // ...
  const assertion = await navigator.credentials.get({ publicKey: { ... } });
  if (!assertion) throw new Error("Biometric verification was cancelled");
  // ⚠️ assertion.response এর server-side verification নেই!
  // signature, authenticatorData, clientDataJSON verify করা হয়নি
}
```
**ফাইল:** `src/lib/webauthn.ts:116`

Biometric assertion শুধু client-side verify হচ্ছে। Server-side cryptographic verification ছাড়া এটি false security। কেউ JS console থেকে fake assertion পাঠাতে পারে।

#### 🟡 Medium: CORS Configuration

```python
# main.py
allow_credentials=False,  # ভালো
allow_origins=allowed_origins,  # env থেকে
```
Production-এ `CORS_ORIGINS` correctly set না হলে সব origin allow হয়ে যায়।

#### 🟡 Medium: Rate Limiting Redis ছাড়া In-Memory

```python
# middleware.py
self.ip_requests: dict[str, list[float]] = defaultdict(list)
```
Redis unavailable হলে in-memory fallback ব্যবহার হয়। Multiple Vercel serverless instances থাকলে প্রতিটির আলাদা memory — rate limit bypass সম্ভব।

#### 🟡 Medium: `password_hash: "supabase_managed"` Literal String

```python
# routers/auth.py:62
"password_hash": "supabase_managed",
```
**ফাইল:** `routers/auth.py:62`

`users` table-এ password_hash column-এ literal string "supabase_managed" store হচ্ছে। যদিও Supabase auth আলাদা manage করে, এই column misleading এবং potential security confusion।

#### 🟢 Good: Production docs disabled

```python
# main.py
docs_url = None if settings.is_production else "/docs"
redoc_url = None if settings.is_production else "/redoc"
```
Production-এ interactive docs বন্ধ — ভালো।

#### 🟢 Good: Input Validation

```python
# services/finance.py:32-39
if not re.match(r"^[a-zA-Z0-9\-_\s]{1,100}$", payload.reference or ""):
    raise ValueError("Reference contains invalid characters")
if payload.from_account_id == payload.to_account_id:
    raise ValueError("Source and destination accounts must differ")
```
Finance service-এ input validation আছে।

#### 🟢 Good: Atomic DB Operations

RPC functions ব্যবহার করে atomic operations:
- `transfer_funds_atomic` RPC
- `create_expense_atomic` RPC
- `approve_expense_atomic` RPC
- `create_sale_atomic` RPC

---

## 🔥 Top 3 Critical Improvements

---

### 🔥 #1: JWT Token Security — localStorage থেকে httpOnly Cookie-তে মাইগ্রেট

**❗ সমস্যা:**
`src/store/authStore.ts`-এ Zustand `persist` middleware JWT access token `localStorage`-এ save করছে (`name: "bdcr7-auth"`). যেকোনো XSS vulnerability (third-party script injection, DOM manipulation) এই token expose করতে পারে, যা attacker কে সম্পূর্ণ authenticated API access দেবে।

**📂 ফাইল:** `apps/web-pwa/src/store/authStore.ts:79-199`

**✅ সমাধান:**
```typescript
// 1. authStore.ts থেকে token persist বন্ধ করুন
partialize: (state) => ({
  // token: state.token,  ← এটি সরিয়ে দিন
  role: state.role,
  userId: state.userId,
}),

// 2. Supabase-এর নিজস্ব httpOnly cookie storage ব্যবহার করুন
// @supabase/ssr package use করুন:
import { createServerClient } from '@supabase/ssr';
// Server-side session management করুন
// Token memory-only রাখুন, localStorage-এ নয়
```
Supabase `@supabase/ssr` package Next.js এর সাথে httpOnly cookie-based session support দেয় যা XSS থেকে protected।

---

### 🔥 #2: Server-Side RBAC Enforcement — Client-Side Bypass বন্ধ করুন

**❗ সমস্যা:**
`src/lib/rbac.ts`-এ RBAC একটি static JavaScript object। `middleware.ts` শুধু Supabase cookie check করে, role verify করে না। একজন `viewer` role-এর user browser DevTools দিয়ে Zustand store-এর `role` field পরিবর্তন করলে সব restricted pages access করতে পারে।

**📂 ফাইল:**
- `apps/web-pwa/src/lib/rbac.ts` (client-side role map)
- `apps/web-pwa/middleware.ts` (cookie-only check)
- `apps/web-pwa/src/store/authStore.ts` (role in localStorage)

**✅ সমাধান:**
```typescript
// middleware.ts — Supabase JWT decode করে role check করুন
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const supabase = createServerClient(/* ... */);
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return redirect('/login');

  // JWT claims থেকে role পড়ুন (server-side, tamper-proof)
  const role = session.user?.app_metadata?.role;
  const allowedPaths = ROLE_ACCESS[role] ?? [];

  if (!allowedPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect('/dashboard'); // unauthorized
  }
}
```
Backend-এ role Supabase JWT `app_metadata` তে store করুন (service role key দিয়ে set করতে হবে, user নিজে পরিবর্তন করতে পারবে না)।

---

### 🔥 #3: Monolithic Login Page বিভক্ত করুন এবং WebAuthn Server Verification যোগ করুন

**❗ সমস্যা (A — Architecture):**
`apps/web-pwa/app/(auth)/login/page.tsx` একটি ৯৬৬+ লাইনের monolithic file যেখানে ৫টি আলাদা UI view, ৭টি auth function, ThemeToggle, DevFooter সব একসাথে। এটি testing, maintenance, এবং code review কঠিন করে।

**❗ সমস্যা (B — Security):**
`apps/web-pwa/src/lib/webauthn.ts:116`-এ `verifyBiometricAssertion()` শুধু navigator.credentials.get() call করে এবং result non-null হলে success ধরে নেয়। Server-side cryptographic verification (authenticatorData + signature) নেই।

**📂 ফাইল:**
- `apps/web-pwa/app/(auth)/login/page.tsx` (monolith)
- `apps/web-pwa/src/lib/webauthn.ts` (incomplete verification)

**✅ সমাধান (A):**
```
app/(auth)/login/
├── page.tsx              # শুধু routing/state (50 লাইন)
├── views/
│   ├── SplashView.tsx
│   ├── LandingView.tsx
│   ├── SignInView.tsx
│   ├── SignUpView.tsx
│   └── OTPView.tsx
└── hooks/
    └── useAuthFlow.ts    # সব auth logic এখানে
```

**✅ সমাধান (B):**
```typescript
// webauthn.ts — assertion server-এ verify করুন
export async function verifyBiometricAssertion(): Promise<void> {
  const assertion = await navigator.credentials.get({ ... });

  // Backend-এ পাঠান verification-এর জন্য
  const response = await fetch('/api/auth/webauthn/verify', {
    method: 'POST',
    body: JSON.stringify({
      credentialId: toBase64Url(assertion.rawId),
      authenticatorData: toBase64Url(assertion.response.authenticatorData),
      clientDataJSON: toBase64Url(assertion.response.clientDataJSON),
      signature: toBase64Url(assertion.response.signature),
    }),
  });
  if (!response.ok) throw new Error('Biometric verification failed');
}
```
Backend-এ `py_webauthn` library দিয়ে server-side CBOR/COSE signature verify করুন।

---

## সারসংক্ষেপ

| সেকশন | স্কোর | মন্তব্য |
|---|---|---|
| Tech Stack | ✅ 8/10 | আধুনিক, উপযুক্ত লাইব্রেরি। Empty packages issue আছে |
| Architecture | ⚠️ 6/10 | Monolithic files, duplicate directories, inconsistent DB layer |
| State & Data Flow | ⚠️ 7/10 | Zustand ভালো, কিন্তু token storage insecure |
| APIs | ✅ 8/10 | Atomic RPCs, role-based, paginated — ভালো design |
| Database | ✅ 8/10 | 22 migrations, RLS, proper schema — ভালো |
| Environment | ✅ 9/10 | `.env.example` complete, production flags আছে |
| Security | 🔴 5/10 | JWT localStorage, client-side RBAC, WebAuthn incomplete |

**সামগ্রিক মূল্যায়ন: একটি ভালোভাবে structured ERP system যেটি production-grade হওয়ার পথে, কিন্তু security layer-এ critical improvements প্রয়োজন।**

---

*Audit generated by forensic code analysis of all source files — no assumptions based on README or package.json alone.*
