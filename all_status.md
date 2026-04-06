# A–Z Project Intelligence Report (Verified from Code)

Date: 2026-04-06
Scope: Entire repository scan (application source, migrations, scripts, config, workspace packages). Evidence taken from code and SQL, not README assumptions.

## 1. System Overview
Real system identity:
1. Monorepo ERP/PWA platform for construction + finance + workforce + materials + POS + CRM + contractor + AI assistant.
2. Frontend stack: Next.js App Router PWA + Zustand + Supabase client in [apps/web-pwa/package.json](apps/web-pwa/package.json).
3. Backend stack: FastAPI + Supabase service client + SQLAlchemy in [apps/api-core-python/main.py](apps/api-core-python/main.py), [apps/api-core-python/core/supabase.py](apps/api-core-python/core/supabase.py), [apps/api-core-python/core/db.py](apps/api-core-python/core/db.py).
4. Database: Supabase/Postgres with additive migration chain in [supabase/migrations](supabase/migrations).

End-to-end architecture (actual runtime):
1. UI requests same-origin /api/* via client helper in [apps/web-pwa/src/lib/apiClient.ts](apps/web-pwa/src/lib/apiClient.ts).
2. Next API proxy forwards to Python backend in [apps/web-pwa/app/api/[...path]/route.ts](apps/web-pwa/app/api/%5B...path%5D/route.ts).
3. FastAPI routes mounted in [apps/api-core-python/main.py](apps/api-core-python/main.py#L145).
4. Backend uses Supabase service-role and/or SQL engine.
5. Some UI modules bypass backend and write directly to Supabase (verified direct calls in multiple feature files).

Production readiness verdict:
1. Feature breadth: high.
2. Architecture consistency: medium-low (hybrid write path, schema drift risk).
3. Security posture: medium (RBAC and middleware exist, but direct DB client path weakens central enforcement).
4. Final verdict: Near-production foundation, not yet production-hardened for strict financial integrity without refactor.

## 2. Full Module Hierarchy (No Omission)
Format: Category → Subcategory → Feature → Sub-feature

Core Workspace:
1. Dashboard → Home → DashboardPage → KPI cards, quick actions, progress ring in [apps/web-pwa/app/(dashboard)/dashboard/page.tsx](apps/web-pwa/app/(dashboard)/dashboard/page.tsx).
2. Dashboard → Home Analytics → DashboardHomeView + stats hooks → AI dashboard + finance data fetch in [apps/web-pwa/src/features/dashboard/DashboardHomeView.tsx](apps/web-pwa/src/features/dashboard/DashboardHomeView.tsx), [apps/web-pwa/src/hooks/useDashboardStats.ts](apps/web-pwa/src/hooks/useDashboardStats.ts).

Projects:
1. Construction → Projects → ProjectsFeature → CRUD project, timeline, attachments in [apps/web-pwa/src/features/construction/projects/ProjectsFeature.tsx](apps/web-pwa/src/features/construction/projects/ProjectsFeature.tsx).
2. Backend → project_management router → timeline/attachment APIs in [apps/api-core-python/routers/project_management.py](apps/api-core-python/routers/project_management.py).
3. DB → projects, project_timeline_events, project_attachments in [supabase/migrations/003_full_saas_schema.sql](supabase/migrations/003_full_saas_schema.sql), [supabase/migrations/011_ai_interactions_project_timeline_attachments.sql](supabase/migrations/011_ai_interactions_project_timeline_attachments.sql).

Finance:
1. UI → finance_core views → ledger, create/update/delete expense in [apps/web-pwa/src/features/finance_core](apps/web-pwa/src/features/finance_core).
2. Backend → finance router + services in [apps/api-core-python/routers/finance.py](apps/api-core-python/routers/finance.py), [apps/api-core-python/services/finance.py](apps/api-core-python/services/finance.py).
3. DB → fund_accounts, fund_transactions, expenses, approvals in [supabase/migrations/003_full_saas_schema.sql](supabase/migrations/003_full_saas_schema.sql).

Workforce:
1. UI → WorkforceView and WorkerLogsFeature in [apps/web-pwa/src/features/construction/WorkforceView.tsx](apps/web-pwa/src/features/construction/WorkforceView.tsx), [apps/web-pwa/src/features/construction/worker_logs/WorkerLogsFeature.tsx](apps/web-pwa/src/features/construction/worker_logs/WorkerLogsFeature.tsx).
2. Backend → hr router attendance/workers/materials in [apps/api-core-python/routers/hr.py](apps/api-core-python/routers/hr.py).
3. DB → workers, attendance, worker_logs in [supabase/migrations/003_full_saas_schema.sql](supabase/migrations/003_full_saas_schema.sql), [supabase/migrations/001_BD_CR7_DB_INIT.sql](supabase/migrations/001_BD_CR7_DB_INIT.sql), [supabase/migrations/017_materials_stock_and_worker_logs_columns.sql](supabase/migrations/017_materials_stock_and_worker_logs_columns.sql).

Materials:
1. UI → MaterialsView + MaterialTrackFeature in [apps/web-pwa/src/features/construction/MaterialsView.tsx](apps/web-pwa/src/features/construction/MaterialsView.tsx), [apps/web-pwa/src/features/construction/material_track/MaterialTrackFeature.tsx](apps/web-pwa/src/features/construction/material_track/MaterialTrackFeature.tsx).
2. Backend → /api/construction/materials atomic RPC in [apps/api-core-python/routers/hr.py](apps/api-core-python/routers/hr.py#L81).
3. DB → material_movements + materials_stock + compatibility material_logs in [supabase/migrations/003_full_saas_schema.sql](supabase/migrations/003_full_saas_schema.sql), [supabase/migrations/017_materials_stock_and_worker_logs_columns.sql](supabase/migrations/017_materials_stock_and_worker_logs_columns.sql), [supabase/migrations/023_atomic_attendance_webauthn_materials_dashboard.sql](supabase/migrations/023_atomic_attendance_webauthn_materials_dashboard.sql).

Evidence:
1. UI → EvidenceView + EvidenceGate + FileUploadEngine + ProjectFilesPanel in [apps/web-pwa/src/features/construction/EvidenceView.tsx](apps/web-pwa/src/features/construction/EvidenceView.tsx), [apps/web-pwa/src/components/ui/EvidenceGate.tsx](apps/web-pwa/src/components/ui/EvidenceGate.tsx), [apps/web-pwa/src/components/ui/FileUploadEngine.tsx](apps/web-pwa/src/components/ui/FileUploadEngine.tsx), [apps/web-pwa/src/components/ui/ProjectFilesPanel.tsx](apps/web-pwa/src/components/ui/ProjectFilesPanel.tsx).
2. Backend → ai_employment classify/propose/confirm/reject in [apps/api-core-python/routers/ai_employment.py](apps/api-core-python/routers/ai_employment.py).
3. DB → project_files, ai_file_classifications, evidence_enforcement_rules, ai_auto_insertions in [supabase/migrations/019_project_files_ai_engine.sql](supabase/migrations/019_project_files_ai_engine.sql), [supabase/migrations/020_evidence_enforcement_and_ai_auto_insertions.sql](supabase/migrations/020_evidence_enforcement_and_ai_auto_insertions.sql).

Reports:
1. UI → ReportsFeature in [apps/web-pwa/src/features/reports/ReportsFeature.tsx](apps/web-pwa/src/features/reports/ReportsFeature.tsx).
2. Backend → no dedicated reports router (NOT VERIFIED as API-first reports).
3. DB → reports pulls from expenses, attendance, material_movements, fund_transactions directly from browser supabase client.

SUMONIX AI:
1. UI → FloatingChat + AiPanel in [apps/web-pwa/src/features/sumonix_ai_ui/FloatingChat.tsx](apps/web-pwa/src/features/sumonix_ai_ui/FloatingChat.tsx), [apps/web-pwa/src/components/modules/AiPanel.tsx](apps/web-pwa/src/components/modules/AiPanel.tsx).
2. Backend → /api/ai endpoints in [apps/api-core-python/routers/ai.py](apps/api-core-python/routers/ai.py).
3. AI engine → deterministic NLP and fuzzy matching in [apps/api-core-python/services/ai_engine.py](apps/api-core-python/services/ai_engine.py).
4. DB → ai_memory, ai_interactions, ai_logs, vector_memory.

Audit:
1. UI → AuditView in [apps/web-pwa/src/features/audit/AuditView.tsx](apps/web-pwa/src/features/audit/AuditView.tsx).
2. Backend → audit helper in [apps/api-core-python/core/audit.py](apps/api-core-python/core/audit.py), used by finance/users/auth.
3. DB → audit_logs + function-based logging in [supabase/migrations/024_audit_logs_and_json_logging.sql](supabase/migrations/024_audit_logs_and_json_logging.sql).

Contractor:
1. UI → ContractorView in [apps/web-pwa/src/features/contractor/ContractorView.tsx](apps/web-pwa/src/features/contractor/ContractorView.tsx).
2. Backend → no dedicated contractor router (NOT VERIFIED as backend-mediated).
3. DB → contractors, contractor_contracts, contractor_payments in [supabase/migrations/014_contractor_module.sql](supabase/migrations/014_contractor_module.sql).

Settings:
1. UI → SettingsFeature + tabs in [apps/web-pwa/src/features/settings_rbac](apps/web-pwa/src/features/settings_rbac).
2. Backend → /api/users/me/profile and preferences in [apps/api-core-python/routers/users.py](apps/api-core-python/routers/users.py).
3. DB → workspace_preferences + module toggles local store.

Auth:
1. UI → custom auth flow and views in [apps/web-pwa/app/(auth)/login](apps/web-pwa/app/(auth)/login), plus Zustand auth store in [apps/web-pwa/src/store/authStore.ts](apps/web-pwa/src/store/authStore.ts).
2. Middleware gate → [apps/web-pwa/middleware.ts](apps/web-pwa/middleware.ts).
3. Backend auth router exists but frontend mainly uses Supabase client direct auth.
4. DB → users, roles, biometric_credentials, webauthn_challenges.

Users:
1. UI → settings/profile tabs.
2. Backend → full users CRUD in [apps/api-core-python/routers/users.py](apps/api-core-python/routers/users.py).
3. DB → users, roles.

Files:
1. UI upload and inline preview in [apps/web-pwa/src/components/ui/FileUploadEngine.tsx](apps/web-pwa/src/components/ui/FileUploadEngine.tsx), [apps/web-pwa/src/components/ui/FilePreviewInline.tsx](apps/web-pwa/src/components/ui/FilePreviewInline.tsx).
2. Backend AI employment uses these rows.
3. DB project_files and related AI tables.

Offline System:
1. Queue store in [apps/web-pwa/src/store/offlineQueue.ts](apps/web-pwa/src/store/offlineQueue.ts).
2. Sync loop in [apps/web-pwa/src/lib/offlineSync.ts](apps/web-pwa/src/lib/offlineSync.ts).
3. Offline fallback page in [apps/web-pwa/app/offline/page.tsx](apps/web-pwa/app/offline/page.tsx).

API Proxy:
1. Next catch-all API proxy in [apps/web-pwa/app/api/[...path]/route.ts](apps/web-pwa/app/api/%5B...path%5D/route.ts) with timeout and non-JSON wrapping.

Hidden/System modules:
1. Dynamic module toggle system in [apps/web-pwa/src/store/moduleStore.ts](apps/web-pwa/src/store/moduleStore.ts).
2. Realtime notifications channel in [apps/web-pwa/src/components/layout/MobileAppShell.tsx](apps/web-pwa/src/components/layout/MobileAppShell.tsx), [apps/web-pwa/src/components/layout/DashboardShell.tsx](apps/web-pwa/src/components/layout/DashboardShell.tsx).
3. Health/readiness in [apps/api-core-python/main.py](apps/api-core-python/main.py).
4. Rate limiting middleware in [apps/api-core-python/core/middleware.py](apps/api-core-python/core/middleware.py).

## 3. UI/UX Full Analysis
Mobile (PWA):
1. Mobile-first shell uses bottom nav + floating actions in [apps/web-pwa/src/components/layout/MobileAppShell.tsx](apps/web-pwa/src/components/layout/MobileAppShell.tsx).
2. Authentication experience is high-fidelity with splash, sign-in, sign-up, OTP, biometric pathways in [apps/web-pwa/app/(auth)/login](apps/web-pwa/app/(auth)/login).
3. PWA config and offline fallback are enabled through [apps/web-pwa/next.config.mjs](apps/web-pwa/next.config.mjs) and [apps/web-pwa/public/manifest.json](apps/web-pwa/public/manifest.json).
4. Offline behavior claim exists, but queue producer integration is incomplete.

Mobile UX limitations:
1. Many modules still behave as desktop cards wrapped into mobile containers.
2. Queue UX does not clearly expose replay failures per item.
3. Some actions fallback silently between direct DB and API path, reducing trust/debug visibility.

Desktop:
1. Sidebar + topbar + content panel via AppShell/DashboardShell.
2. Multi-panel composition is present for settings/reporting but heavy forms can become dense.
3. Data density is moderate-high in finance/reports and can fatigue users without advanced filtering.

Component mapping and reusability:
1. Reusable primitive components: button, dialog, table, tabs in [apps/web-pwa/src/components/ui](apps/web-pwa/src/components/ui).
2. ERP wrappers: ErpCard, ErpGrid, ErpHeader, ErpLayout.
3. State layers: Zustand stores for auth, module toggles, queue, app and expenses.
4. Reusability is good at UI primitive level, weaker at domain action orchestration level (duplicate submit logic).

## 4. Visual Architecture (Text Diagram)
System architecture:
Frontend (Next.js PWA)
↓
API Proxy (Next.js Route Handler)
↓
FastAPI Backend (routers + middleware + services)
↓
Supabase Postgres (RLS + RPC + tables)
↓
Worker / AI Layer (scheduler + AI engine + file automation)

Data flow:
User → UI → apiClient → /api proxy → FastAPI route → service/RPC/DB → response envelope → UI state

Module interactions:
1. Finance ↔ Approval ↔ Audit: expense create/approve triggers approvals and audit logs.
2. HR ↔ Materials ↔ Projects: attendance/material movement and project progress/attachments overlap.
3. AI ↔ Files ↔ DB: file upload classification, proposal generation, and confirmed insertion into domain tables.

## 5. Frontend Analysis
Next.js structure:
1. Route groups (auth/dashboard) in [apps/web-pwa/app](apps/web-pwa/app).
2. Feature folders by domain in [apps/web-pwa/src/features](apps/web-pwa/src/features).
3. Global shell and controls in [apps/web-pwa/src/components/layout](apps/web-pwa/src/components/layout).

Direct DB usage detection (critical):
1. Verified direct supabase.from calls across Contractor, CRM, Inventory, Reports, Construction, Import.
2. High-frequency direct DB writes found in:
   [apps/web-pwa/src/features/contractor/ContractorView.tsx](apps/web-pwa/src/features/contractor/ContractorView.tsx)
   [apps/web-pwa/src/features/crm/CRMView.tsx](apps/web-pwa/src/features/crm/CRMView.tsx)
   [apps/web-pwa/src/features/inventory/InventoryView.tsx](apps/web-pwa/src/features/inventory/InventoryView.tsx)

API usage consistency:
1. Some modules use apiClient path consistently (finance core, AI panels, project timeline attachments).
2. Others default to direct DB with optional API fallback (inconsistent behavior and policy centralization).

Performance observations:
1. Proxy timeout is explicit and safer for serverless constraints.
2. No unified query caching strategy detected (NOT VERIFIED for SWR/React Query usage; not found).
3. Multiple modules request parallel large selects; optimization is partial via indexes in migration 018.

## 6. Backend Analysis
FastAPI architecture:
1. create_app pattern with startup-safe fallback and environment-aware docs toggle.
2. Middleware stack: CORS, rate limit, request ID, security headers, response envelope.
3. Exception handlers normalize API errors.

Router/service mapping:
1. Routers in [apps/api-core-python/routers](apps/api-core-python/routers).
2. Services in [apps/api-core-python/services](apps/api-core-python/services).
3. Core auth, DB, supabase in [apps/api-core-python/core](apps/api-core-python/core).

Validation:
1. Pydantic schemas enforce payload contracts for finance, POS, import, users, AI, construction.
2. Some endpoints still accept raw dict payloads (approval pending patch, biometric posts), reducing strict typing coverage.

## 7. Database Full Deep Audit
Migration chain:
1. Present from 000 through 024 in [supabase/migrations](supabase/migrations).
2. Chain is additive-heavy, with compatibility patches and hardening steps.
3. Drift risk exists between legacy schema objects and newer canonical schema.

Table inventory (verified from migrations):
1. Security/User: roles, profiles, users, permissions, biometric_credentials, webauthn_challenges, workspace_preferences.
2. Finance: funds, fund_accounts, fund_transactions, expense_categories, expenses, approvals.
3. Workforce/Construction: workers, attendance, worker_logs, materials, material_movements, materials_stock, material_logs, projects, progress_logs, progress_cam.
4. Commerce: inventory, pos_transactions, products, sales, sale_items, customers.
5. Import/Supply: lc_records, landed_costs.
6. CRM/Contractor: crm_leads, crm_interactions, contractors, contractor_contracts, contractor_payments.
7. AI/File/Audit/System: ai_knowledge_base, ai_memory, ai_memory_logs, ai_logs, ai_interactions, vector_memory, project_files, ai_file_classifications, evidence_enforcement_rules, ai_auto_insertions, audit_logs, maker_checker_logs, notifications, report_snapshots, module_toggles, system_settings.
8. Inventory advanced: warehouses, warehouse_stock, stock_adjustments.

Relationships (high-confidence from REFERENCES):
1. users.role_id → roles.id.
2. expenses.account_id → fund_accounts.id; maker/checker references users.
3. sales.customer_id → customers.id; cashier_id → users.id.
4. sale_items.sale_id → sales.id and product_id → products.id.
5. attendance.worker_id → workers.id.
6. material_movements.project_id → projects.id.
7. landed_costs.lc_record_id → lc_records.id.
8. project_timeline_events.project_id → projects.id.
9. project_attachments.project_id → projects.id.
10. contractor_contracts/contractor_payments → contractors.
11. crm_interactions.customer_id → customers and lead_id → crm_leads.
12. project_files.project_id → projects and uploaded_by → users.
13. ai_file_classifications.file_id → project_files.
14. ai_auto_insertions.file_id → project_files.

Schema drift and missing-create findings:
1. material_logs is ALTERed in [supabase/migrations/017_materials_stock_and_worker_logs_columns.sql](supabase/migrations/017_materials_stock_and_worker_logs_columns.sql) but no CREATE TABLE found in tracked migration set.
2. workers table column naming differs across schema generations (name/daily_wage vs full_name/daily_rate), causing query mismatch risk.
3. 000_FINAL_MASTER_SCHEMA is legacy-consolidated and diverges from newer 003+ canonical structure; treat 000 as historical baseline, not final source of truth.

Module → table mapping:
1. Finance UI/API → fund_accounts, fund_transactions, expenses, approvals, expense_categories.
2. Workforce UI/API → workers, attendance, worker_logs.
3. Materials UI/API → material_movements, materials_stock, material_logs.
4. Projects UI/API → projects, project_timeline_events, project_attachments.
5. Import UI/API → lc_records, landed_costs.
6. POS UI/API → products, customers, sales, sale_items.
7. CRM UI direct DB → customers, crm_leads, crm_interactions.
8. Contractor UI direct DB → contractors, contractor_contracts, contractor_payments.
9. AI/File → project_files, ai_file_classifications, ai_auto_insertions, ai_memory, ai_interactions.

## 8. API Full Mapping
Router prefixes from [apps/api-core-python/main.py](apps/api-core-python/main.py#L145).

Auth (/api/auth):
1. POST /register → payload RegisterRequest.
2. POST /login → payload LoginRequest.
3. POST /logout.
4. POST /webauthn/register → dict payload.
5. POST /webauthn/challenge.
6. POST /webauthn/verify → dict payload.
7. GET /me.

Finance (/api/finance):
1. GET /accounts.
2. POST /transfer → FundTransfer.
3. POST /fund-entries → FundEntryCreate.
4. POST /expenses → ExpenseCreate.
5. POST /expenses/manual → ManualExpenseCreate.
6. POST /expenses/{expense_id}/approve → ApprovalAction.
7. GET /expenses.
8. GET /expenses/{expense_id}.
9. PATCH /expenses/{expense_id} → ExpenseUpdate.
10. DELETE /expenses/{expense_id}.
11. GET /balance/{account_id}.

Construction (/api/construction):
1. POST /workers → WorkerCreate.
2. GET /workers.
3. POST /attendance → AttendanceMark.
4. POST /materials → MaterialMovement.

POS (/api/pos):
1. POST /products.
2. GET /products.
3. GET /products/{product_id}.
4. PATCH /products/{product_id}.
5. DELETE /products/{product_id}.
6. GET /products/barcode/{barcode}.
7. POST /customers.
8. POST /sales.
9. GET /sales.

Import (/api/import-supply):
1. POST /lc-records.
2. GET /lc-records.
3. PATCH /lc-records/{lc_id}/status.
4. POST /landed-costs.

Project management (/api/project-management):
1. GET /projects/{project_id}/timeline.
2. POST /projects/{project_id}/timeline.
3. GET /projects/{project_id}/attachments.
4. POST /projects/{project_id}/attachments.

AI (/api/ai):
1. GET /integration-status.
2. GET /alerts.
3. GET /anomalies.
4. GET /dashboard.
5. POST /memory.
6. GET /memory/search.
7. POST /chat.

Approval intelligence (/api/ai-intelligence):
1. GET /rules.
2. PUT /rules/{rule_key}.
3. POST /suggestions/refresh.
4. GET /pending.
5. PATCH /pending/{pending_id}.
6. GET /biometric/credentials.
7. POST /biometric/credentials.
8. DELETE /biometric/credentials/{credential_id}.

AI employ (/api/ai-employ):
1. POST /classify.
2. POST /propose.
3. POST /confirm.
4. POST /reject.
5. GET /pending.

Users (/api/users):
1. GET /me/profile.
2. PATCH /me/profile.
3. GET /me/preferences.
4. PATCH /me/preferences.
5. GET /.
6. POST /.
7. GET /{user_id}.
8. PATCH /{user_id}.
9. DELETE /{user_id}.

Used vs unused (frontend evidence):
1. Clearly used from frontend: ai chat/alerts/anomalies/dashboard, ai-employ flows, finance accounts/expenses/manual/fund-entries, pos products/sales, construction attendance, project timeline/attachments, users me profile/preferences, webauthn endpoints.
2. No direct frontend evidence (likely admin/internal or currently unused): /api/finance/transfer, /api/finance/balance/{id}, /api/construction/workers, /api/construction/materials, /api/import-supply/landed-costs, /api/ai/integration-status, approval-intelligence rules/pending controls, many /api/users admin CRUD.
3. External consumers for unused paths: NOT VERIFIED.

## 9. AI System
Capabilities:
1. Language detection, translation, fuzzy intent classification, role-aware response assembly.
2. Dashboard/anomaly/alert integration.
3. File-to-proposal automation in AI employment router.

Query correctness findings:
1. High-risk mismatch: AI engine queries workers(name,daily_wage) but canonical workers uses full_name,daily_rate in 003 schema.
2. AI engine also queries material_logs (compatibility layer) while canonical operational table is material_movements/materials_stock.

Automation pipeline:
1. Upload file → classify → proposal → confirm/reject.
2. Confirm writes into target domain table.
3. Audit-like trail exists in ai_auto_insertions and ai_interactions.

## 10. Offline & PWA
Queue system:
1. Offline queue store exists with persisted state and capped size.
2. Background flush retries with attempt counts and online checks.

Usage reality:
1. Queue consumer exists, producer integration is weak.
2. Many write actions bypass queue and go direct to DB/API immediately.

Failure cases:
1. Validator expects absolute URL format for endpoint (zod url), while actual endpoint values are often relative.
2. Replay can requeue failed events but module-level UX for conflict resolution is limited.

## 11. Security
Auth:
1. Supabase auth session and token verification in backend get_current_user.
2. Frontend middleware checks session and role access.

RBAC:
1. Role enforcement via require_roles in routers.
2. UI role access matrix in [apps/web-pwa/src/lib/rbac.ts](apps/web-pwa/src/lib/rbac.ts).

Direct DB bypass risk:
1. Significant because browser client performs direct insert/update/delete in several critical modules.
2. This can bypass centralized backend business checks and uniform auditing.

Audit logs:
1. audit_log helper used in core transactions.
2. DB audit hardening introduced in migration 024.
3. Coverage is partial when writes happen directly from browser.

## 12. DevOps
Deployment config:
1. Vercel configured for web build in [vercel.json](vercel.json).
2. API dependency install script in [apps/api-core-python/vercel-install.sh](apps/api-core-python/vercel-install.sh).

Env config:
1. Shared env listed in [turbo.json](turbo.json).
2. Backend runtime validation and strict flags in [apps/api-core-python/core/config.py](apps/api-core-python/core/config.py).

CI/CD:
1. CodeQL config present in [.github/codeql/codeql-config.yml](.github/codeql/codeql-config.yml).
2. Full pipeline workflow files: NOT VERIFIED (no workflow yaml observed in repository listing).

Migration execution:
1. SQL migration chain exists but no explicit automated migration runner pipeline found in repo (NOT VERIFIED for external platform migration hooks).

## 13. Testing
Backend tests:
1. Multiple test files exist under [apps/api-core-python/tests](apps/api-core-python/tests).
2. Heavy mocking of Supabase in integration/e2e style tests.

Coverage gaps:
1. Real DB migration verification tests are missing.
2. Frontend automated test suite (unit/e2e) not found in scanned files (NOT VERIFIED if external).
3. Contract tests between UI calls and backend payload evolution are limited.

## 14. Critical Issues
CRITICAL:
1. Schema drift around material_logs and workers columns.
   File references: [supabase/migrations/017_materials_stock_and_worker_logs_columns.sql](supabase/migrations/017_materials_stock_and_worker_logs_columns.sql), [apps/api-core-python/services/ai_engine.py](apps/api-core-python/services/ai_engine.py#L304), [supabase/migrations/003_full_saas_schema.sql](supabase/migrations/003_full_saas_schema.sql#L133).
   Root cause: parallel legacy/canonical schema assumptions.
   Impact: runtime query failures, corrupted cross-module analytics.

2. Direct browser DB writes in business-critical modules.
   File references: [apps/web-pwa/src/features/inventory/InventoryView.tsx](apps/web-pwa/src/features/inventory/InventoryView.tsx), [apps/web-pwa/src/features/crm/CRMView.tsx](apps/web-pwa/src/features/crm/CRMView.tsx), [apps/web-pwa/src/features/contractor/ContractorView.tsx](apps/web-pwa/src/features/contractor/ContractorView.tsx).
   Root cause: hybrid architecture without strict write boundary.
   Impact: policy bypass, inconsistent validation, partial audit coverage.

HIGH:
1. Attendance flow contract mismatch between UI direct insert and backend attendance schema expectations.
   File references: [apps/web-pwa/src/features/construction/worker_logs/WorkerLogsFeature.tsx](apps/web-pwa/src/features/construction/worker_logs/WorkerLogsFeature.tsx), [apps/api-core-python/routers/hr.py](apps/api-core-python/routers/hr.py).
   Impact: data integrity inconsistency and fallback ambiguity.

2. Offline queue integration incomplete.
   File references: [apps/web-pwa/src/lib/validators.ts](apps/web-pwa/src/lib/validators.ts), [apps/web-pwa/src/store/offlineQueue.ts](apps/web-pwa/src/store/offlineQueue.ts), [apps/web-pwa/src/lib/offlineSync.ts](apps/web-pwa/src/lib/offlineSync.ts).
   Impact: offline promise not uniformly met in production paths.

MEDIUM:
1. API typed validation is uneven for dict-based endpoints.
   File references: [apps/api-core-python/routers/approval_intelligence.py](apps/api-core-python/routers/approval_intelligence.py), [apps/api-core-python/routers/auth.py](apps/api-core-python/routers/auth.py).
   Impact: weaker contract safety and payload drift risk.

2. DevOps automation and migration execution pipeline not explicit.
   File references: [vercel.json](vercel.json), [turbo.json](turbo.json), [.github/codeql/codeql-config.yml](.github/codeql/codeql-config.yml).
   Impact: release-time manual variability.

## 15. Module Priority Map (Mandatory)
🔴 Tier 1 (Fix Immediately):
1. Finance.
2. Attendance / Workforce.
3. Materials.
4. Approval System.
Reason: highest data-integrity and monetary impact; currently affected by hybrid write paths and schema mismatches.
Evidence: [apps/api-core-python/routers/finance.py](apps/api-core-python/routers/finance.py), [apps/web-pwa/src/features/construction/worker_logs/WorkerLogsFeature.tsx](apps/web-pwa/src/features/construction/worker_logs/WorkerLogsFeature.tsx), [supabase/migrations/017_materials_stock_and_worker_logs_columns.sql](supabase/migrations/017_materials_stock_and_worker_logs_columns.sql), [apps/api-core-python/routers/approval_intelligence.py](apps/api-core-python/routers/approval_intelligence.py).

🟠 Tier 2 (Stabilize Next):
1. API layer consistency.
2. Database schema alignment.
3. AI query correctness.
4. Offline queue producer adoption.
Reason: these are cross-cutting foundations that affect all tier-1 modules.

🟡 Tier 3 (Optimization):
1. UI/UX refinements.
2. Reports performance and slicing.
3. Dashboard densification and personalization.

🟢 Tier 4 (Scale & Advanced):
1. AI enhancement (policy-gated model upgrades).
2. Automation orchestration with worker queues.
3. Advanced analytics and forecasting.

## 16. Fix Roadmap
Phase 1 (Immediate):
1. Enforce API-only writes for finance/workforce/materials/approvals.
2. Resolve schema drift (workers/material_logs compatibility).
3. Patch AI engine queries to canonical schema.

Phase 2 (Stabilize):
1. Add migration smoke tests against clean database.
2. Add endpoint contract tests for all routers.
3. Normalize dict endpoints to Pydantic payloads.

Phase 3 (Optimize):
1. Integrate offline queue producers in high-frequency write actions.
2. Add conflict-resolution UI for sync failures.
3. Add selective caching strategy for heavy read pages.

Phase 4 (Scale):
1. Introduce worker queue for async file/AI/report jobs.
2. Build event outbox and centralized observability.
3. Expand AI with safer retrieval and explainability layer.

## 17. Final Target Architecture
Target chain:
Frontend → API Proxy → FastAPI Backend → Postgres/Supabase → Worker → AI

Write rule:
1. No direct browser writes to core business tables.
2. All create/update/delete must pass through backend validation + audit.

Read rule:
1. Direct reads allowed only for low-risk, non-sensitive dashboards where policy allows.
2. Sensitive/financial reads should be backend mediated.

Async processing:
1. File classification, anomaly recompute, report generation handled by worker queue.
2. API returns job IDs for long-running operations.

Final statement:
This repository already contains substantial enterprise-grade module coverage. The key blocker is architectural consistency, not feature absence. Enforcing write boundaries and schema alignment will materially increase reliability and production safety.
