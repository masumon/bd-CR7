# A–Z প্রজেক্ট ইন্টেলিজেন্স রিপোর্ট (বাংলা)

তারিখ: 2026-04-06
স্কোপ: সম্পূর্ণ repository scan (source code, migrations, scripts, config, workspace packages)। সব সিদ্ধান্ত code/SQL evidence থেকে নেওয়া হয়েছে।

## 1. System Overview
বাস্তব সিস্টেম পরিচয়:
1. এটি একটি monorepo-ভিত্তিক ERP/PWA প্ল্যাটফর্ম, যেখানে construction, finance, workforce, materials, POS, CRM, contractor, AI assistant একসাথে আছে।
2. Frontend: Next.js App Router PWA + Zustand + Supabase client, প্রমাণ [apps/web-pwa/package.json](apps/web-pwa/package.json)।
3. Backend: FastAPI + Supabase service client + SQLAlchemy, প্রমাণ [apps/api-core-python/main.py](apps/api-core-python/main.py), [apps/api-core-python/core/supabase.py](apps/api-core-python/core/supabase.py), [apps/api-core-python/core/db.py](apps/api-core-python/core/db.py)।
4. Database: Supabase/Postgres, migration chain [supabase/migrations](supabase/migrations)।

End-to-end বাস্তব ফ্লো:
1. UI থেকে /api/* call যায় apiClient দিয়ে [apps/web-pwa/src/lib/apiClient.ts](apps/web-pwa/src/lib/apiClient.ts)।
2. Next.js proxy call forward করে [apps/web-pwa/app/api/[...path]/route.ts](apps/web-pwa/app/api/%5B...path%5D/route.ts)।
3. FastAPI routes mount হয় [apps/api-core-python/main.py](apps/api-core-python/main.py#L145)-এ।
4. Backend Supabase service role বা SQL path ব্যবহার করে DB hit করে।
5. একই সাথে কিছু UI module backend bypass করে সরাসরি Supabase-এ write করে।

Production readiness verdict:
1. Feature coverage: উচ্চ।
2. Architecture consistency: মাঝারি-নিম্ন (hybrid write path, schema drift)।
3. Security posture: মাঝারি (RBAC আছে, কিন্তু direct DB path policy দুর্বল করে)।
4. Final verdict: শক্তিশালী near-production ভিত্তি, কিন্তু কঠোর আর্থিক নির্ভরতার জন্য এখনো hardening বাকি।

## 2. Full Module Hierarchy (No Omission)
Format: Category → Subcategory → Feature → Sub-feature

Core Workspace:
1. Dashboard → Home → DashboardPage → KPI, quick action, progress ring
   [apps/web-pwa/app/(dashboard)/dashboard/page.tsx](apps/web-pwa/app/(dashboard)/dashboard/page.tsx)
2. Dashboard → Home Analytics → DashboardHomeView + stats hooks
   [apps/web-pwa/src/features/dashboard/DashboardHomeView.tsx](apps/web-pwa/src/features/dashboard/DashboardHomeView.tsx), [apps/web-pwa/src/hooks/useDashboardStats.ts](apps/web-pwa/src/hooks/useDashboardStats.ts)

Projects:
1. Construction → Projects → ProjectsFeature → project CRUD, timeline, attachment
   [apps/web-pwa/src/features/construction/projects/ProjectsFeature.tsx](apps/web-pwa/src/features/construction/projects/ProjectsFeature.tsx)
2. Backend → project_management router
   [apps/api-core-python/routers/project_management.py](apps/api-core-python/routers/project_management.py)
3. DB → projects, project_timeline_events, project_attachments
   [supabase/migrations/003_full_saas_schema.sql](supabase/migrations/003_full_saas_schema.sql), [supabase/migrations/011_ai_interactions_project_timeline_attachments.sql](supabase/migrations/011_ai_interactions_project_timeline_attachments.sql)

Finance:
1. UI → finance_core features
   [apps/web-pwa/src/features/finance_core](apps/web-pwa/src/features/finance_core)
2. Backend → finance router + services
   [apps/api-core-python/routers/finance.py](apps/api-core-python/routers/finance.py), [apps/api-core-python/services/finance.py](apps/api-core-python/services/finance.py)
3. DB → fund_accounts, fund_transactions, expenses, approvals
   [supabase/migrations/003_full_saas_schema.sql](supabase/migrations/003_full_saas_schema.sql)

Workforce:
1. UI → WorkforceView + WorkerLogsFeature
   [apps/web-pwa/src/features/construction/WorkforceView.tsx](apps/web-pwa/src/features/construction/WorkforceView.tsx), [apps/web-pwa/src/features/construction/worker_logs/WorkerLogsFeature.tsx](apps/web-pwa/src/features/construction/worker_logs/WorkerLogsFeature.tsx)
2. Backend → /api/construction/*
   [apps/api-core-python/routers/hr.py](apps/api-core-python/routers/hr.py)
3. DB → workers, attendance, worker_logs
   [supabase/migrations/003_full_saas_schema.sql](supabase/migrations/003_full_saas_schema.sql), [supabase/migrations/001_BD_CR7_DB_INIT.sql](supabase/migrations/001_BD_CR7_DB_INIT.sql), [supabase/migrations/017_materials_stock_and_worker_logs_columns.sql](supabase/migrations/017_materials_stock_and_worker_logs_columns.sql)

Materials:
1. UI → MaterialsView + MaterialTrackFeature
   [apps/web-pwa/src/features/construction/MaterialsView.tsx](apps/web-pwa/src/features/construction/MaterialsView.tsx), [apps/web-pwa/src/features/construction/material_track/MaterialTrackFeature.tsx](apps/web-pwa/src/features/construction/material_track/MaterialTrackFeature.tsx)
2. Backend → atomic movement route
   [apps/api-core-python/routers/hr.py](apps/api-core-python/routers/hr.py#L81)
3. DB → material_movements, materials_stock, material_logs compatibility
   [supabase/migrations/003_full_saas_schema.sql](supabase/migrations/003_full_saas_schema.sql), [supabase/migrations/017_materials_stock_and_worker_logs_columns.sql](supabase/migrations/017_materials_stock_and_worker_logs_columns.sql), [supabase/migrations/023_atomic_attendance_webauthn_materials_dashboard.sql](supabase/migrations/023_atomic_attendance_webauthn_materials_dashboard.sql)

Evidence:
1. UI → EvidenceView, EvidenceGate, FileUploadEngine, ProjectFilesPanel
   [apps/web-pwa/src/features/construction/EvidenceView.tsx](apps/web-pwa/src/features/construction/EvidenceView.tsx), [apps/web-pwa/src/components/ui/EvidenceGate.tsx](apps/web-pwa/src/components/ui/EvidenceGate.tsx), [apps/web-pwa/src/components/ui/FileUploadEngine.tsx](apps/web-pwa/src/components/ui/FileUploadEngine.tsx), [apps/web-pwa/src/components/ui/ProjectFilesPanel.tsx](apps/web-pwa/src/components/ui/ProjectFilesPanel.tsx)
2. Backend → ai_employ pipeline
   [apps/api-core-python/routers/ai_employment.py](apps/api-core-python/routers/ai_employment.py)
3. DB → project_files, ai_file_classifications, evidence_enforcement_rules, ai_auto_insertions
   [supabase/migrations/019_project_files_ai_engine.sql](supabase/migrations/019_project_files_ai_engine.sql), [supabase/migrations/020_evidence_enforcement_and_ai_auto_insertions.sql](supabase/migrations/020_evidence_enforcement_and_ai_auto_insertions.sql)

Reports:
1. UI → ReportsFeature
   [apps/web-pwa/src/features/reports/ReportsFeature.tsx](apps/web-pwa/src/features/reports/ReportsFeature.tsx)
2. Backend dedicated report API: NOT VERIFIED
3. DB read mostly browser-side direct supabase queries

SUMONIX AI:
1. UI → FloatingChat + AiPanel
   [apps/web-pwa/src/features/sumonix_ai_ui/FloatingChat.tsx](apps/web-pwa/src/features/sumonix_ai_ui/FloatingChat.tsx), [apps/web-pwa/src/components/modules/AiPanel.tsx](apps/web-pwa/src/components/modules/AiPanel.tsx)
2. Backend → /api/ai routes
   [apps/api-core-python/routers/ai.py](apps/api-core-python/routers/ai.py)
3. AI engine → rule-based NLP/fuzzy
   [apps/api-core-python/services/ai_engine.py](apps/api-core-python/services/ai_engine.py)

Audit:
1. UI → AuditView
   [apps/web-pwa/src/features/audit/AuditView.tsx](apps/web-pwa/src/features/audit/AuditView.tsx)
2. Backend → audit helper
   [apps/api-core-python/core/audit.py](apps/api-core-python/core/audit.py)
3. DB → audit_logs hardening
   [supabase/migrations/024_audit_logs_and_json_logging.sql](supabase/migrations/024_audit_logs_and_json_logging.sql)

Contractor:
1. UI → ContractorView
   [apps/web-pwa/src/features/contractor/ContractorView.tsx](apps/web-pwa/src/features/contractor/ContractorView.tsx)
2. Backend contractor router: NOT VERIFIED
3. DB → contractors, contractor_contracts, contractor_payments
   [supabase/migrations/014_contractor_module.sql](supabase/migrations/014_contractor_module.sql)

Settings:
1. UI → settings tabs and controls
   [apps/web-pwa/src/features/settings_rbac](apps/web-pwa/src/features/settings_rbac)
2. Backend → /api/users/me/profile এবং /api/users/me/preferences
   [apps/api-core-python/routers/users.py](apps/api-core-python/routers/users.py)
3. DB → workspace_preferences

Auth:
1. UI auth flow + screens
   [apps/web-pwa/app/(auth)/login](apps/web-pwa/app/(auth)/login)
2. Frontend middleware gate
   [apps/web-pwa/middleware.ts](apps/web-pwa/middleware.ts)
3. Backend auth router আছে, কিন্তু login/register flow-এ Supabase client direct use বেশি
4. DB → users, roles, biometric_credentials, webauthn_challenges

Users:
1. Backend users CRUD সম্পূর্ণ
   [apps/api-core-python/routers/users.py](apps/api-core-python/routers/users.py)

Files:
1. Upload + preview components
   [apps/web-pwa/src/components/ui/FileUploadEngine.tsx](apps/web-pwa/src/components/ui/FileUploadEngine.tsx), [apps/web-pwa/src/components/ui/FilePreviewInline.tsx](apps/web-pwa/src/components/ui/FilePreviewInline.tsx)

Offline System:
1. Queue store, sync engine, offline fallback page
   [apps/web-pwa/src/store/offlineQueue.ts](apps/web-pwa/src/store/offlineQueue.ts), [apps/web-pwa/src/lib/offlineSync.ts](apps/web-pwa/src/lib/offlineSync.ts), [apps/web-pwa/app/offline/page.tsx](apps/web-pwa/app/offline/page.tsx)

API Proxy:
1. Next catch-all proxy with timeout and JSON wrapping
   [apps/web-pwa/app/api/[...path]/route.ts](apps/web-pwa/app/api/%5B...path%5D/route.ts)

Hidden/System modules:
1. Dynamic module toggles
   [apps/web-pwa/src/store/moduleStore.ts](apps/web-pwa/src/store/moduleStore.ts)
2. Realtime notification channels
   [apps/web-pwa/src/components/layout/MobileAppShell.tsx](apps/web-pwa/src/components/layout/MobileAppShell.tsx), [apps/web-pwa/src/components/layout/DashboardShell.tsx](apps/web-pwa/src/components/layout/DashboardShell.tsx)
3. Health, readiness, rate-limit middleware
   [apps/api-core-python/main.py](apps/api-core-python/main.py), [apps/api-core-python/core/middleware.py](apps/api-core-python/core/middleware.py)

## 3. UI/UX Full Analysis
Mobile (PWA):
1. Bottom navigation + floating actions mobile-first shell-এ আছে।
2. Auth UX polished: splash, sign in, sign up, OTP, biometric.
3. Offline fallback route + manifest shortcut আছে।
4. Offline sync promise আংশিক; production write flow-এ queue usage অসম্পূর্ণ।

Mobile UX limitations:
1. কিছু module card-grid desktop pattern mobile-এ compact হলেও form complexity বেশি।
2. Queue failure item-level recovery UX দুর্বল।
3. Direct DB এবং API fallback এর mix behavior user transparency কমায়।

Desktop:
1. Sidebar/topbar/content layout স্পষ্ট।
2. Settings/reporting এ multi-panel composition আছে।
3. Finance/report pages-এ data density বেশি; advanced filtering সীমিত।

Component mapping and state:
1. Reusable primitives: button/dialog/table/tabs.
2. ERP wrappers: ErpCard/ErpGrid/ErpHeader/ErpLayout.
3. Zustand state: auth, module toggles, offline queue, app store, expenses store.
4. UI reusability ভালো; domain action orchestration-এ duplication আছে।

## 4. Visual Architecture (Text Diagram)
System Architecture:
Frontend (Next.js PWA)
↓
API Proxy (Next.js Route Handler)
↓
FastAPI Backend
↓
Supabase Database
↓
Worker / AI Layer

Data Flow:
User → UI → API → Backend → DB → Response

Module Interaction:
1. Finance ↔ Approval ↔ Audit.
2. HR ↔ Materials ↔ Projects.
3. AI ↔ Files ↔ DB.

## 5. Frontend Analysis
Next.js structure:
1. Route groups: auth/dashboard.
2. Feature-oriented source tree.
3. Shared shell/layout architecture.

Direct DB usage (critical):
1. Contractor, CRM, Inventory, Reports, Construction, Import module-এ multiple supabase.from write/read আছে।
2. এতে backend business rule bypass হওয়ার ঝুঁকি থাকে।

API usage consistency:
1. কিছু module API-first.
2. কিছু module direct Supabase + API fallback mix mode।

Performance:
1. Proxy timeout and no-store setup ভালো।
2. Unified query cache strategy পাওয়া যায়নি (NOT VERIFIED)।
3. কিছু heavy list query parallel fetch করছে; DB index patch আংশিক সমাধান দিয়েছে।

## 6. Backend Analysis
FastAPI architecture:
1. create_app pattern, env-aware docs, health/readiness checks।
2. Middleware: CORS, rate limit, request-id, security headers, response envelope।
3. Error normalization consistent।

Router/service mapping:
1. Domain routers আলাদা।
2. Service files risk/finance/pos/ai/system monitor এ বিভক্ত।

Validation:
1. Pydantic schema coverage ভালো।
2. কিছু endpoint raw dict payload নেয় (type strictness কম)।

## 7. Database (Full Deep Audit)
Migration chain:
1. 000–024 ফাইল আছে [supabase/migrations](supabase/migrations)-এ।
2. Additive migration strategy ব্যবহৃত।
3. Legacy vs canonical schema mismatch risk উপস্থিত।

Tables (verified):
1. Security/User: roles, profiles, users, permissions, biometric_credentials, webauthn_challenges, workspace_preferences.
2. Finance: funds, fund_accounts, fund_transactions, expense_categories, expenses, approvals.
3. Workforce/Construction: workers, attendance, worker_logs, materials, material_movements, materials_stock, material_logs, projects, progress_logs, progress_cam.
4. Commerce: inventory, pos_transactions, products, sales, sale_items, customers.
5. Import/Supply: lc_records, landed_costs.
6. CRM/Contractor: crm_leads, crm_interactions, contractors, contractor_contracts, contractor_payments.
7. AI/Audit/System: ai_knowledge_base, ai_memory, ai_memory_logs, ai_logs, ai_interactions, vector_memory, project_files, ai_file_classifications, evidence_enforcement_rules, ai_auto_insertions, audit_logs, maker_checker_logs, notifications, report_snapshots, module_toggles, system_settings.
8. Inventory advanced: warehouses, warehouse_stock, stock_adjustments.

Relationships (উচ্চ confidence):
1. users.role_id → roles.id
2. expenses.account_id → fund_accounts.id
3. expenses maker/checker → users.id
4. sales.customer_id → customers.id
5. sale_items.sale_id → sales.id; sale_items.product_id → products.id
6. attendance.worker_id → workers.id
7. material_movements.project_id → projects.id
8. landed_costs.lc_record_id → lc_records.id
9. project_timeline_events/project_attachments.project_id → projects.id
10. ai_file_classifications.file_id এবং ai_auto_insertions.file_id → project_files.id

Drift detection:
1. material_logs ALTER আছে, CREATE খুঁজে পাওয়া যায়নি tracked chain-এ।
2. workers schema naming দুই ধরনের (name/daily_wage বনাম full_name/daily_rate)।
3. 000_FINAL_MASTER_SCHEMA legacy snapshot, 003+ canonical এর সাথে mismatch আছে।

Module → table mapping:
1. Finance → fund_accounts/fund_transactions/expenses/approvals.
2. Workforce → workers/attendance/worker_logs.
3. Materials → material_movements/materials_stock/material_logs.
4. Projects → projects/project_timeline_events/project_attachments.
5. Import → lc_records/landed_costs.
6. POS → products/customers/sales/sale_items.
7. CRM → customers/crm_leads/crm_interactions.
8. Contractor → contractors/contractor_contracts/contractor_payments.
9. AI & Files → project_files/ai_file_classifications/ai_auto_insertions/ai_memory/ai_interactions.

## 8. API Full Mapping
Router prefixes: [apps/api-core-python/main.py](apps/api-core-python/main.py#L145)

Auth (/api/auth): register, login, logout, webauthn/register, webauthn/challenge, webauthn/verify, me.

Finance (/api/finance):
1. GET accounts
2. POST transfer
3. POST fund-entries
4. POST expenses
5. POST expenses/manual
6. POST expenses/{id}/approve
7. GET expenses
8. GET expenses/{id}
9. PATCH expenses/{id}
10. DELETE expenses/{id}
11. GET balance/{account_id}

Construction (/api/construction): workers create/list, attendance, materials.

POS (/api/pos): products CRUD + barcode, customers create, sales create/list.

Import (/api/import-supply): lc-records create/list/status, landed-costs.

Project management (/api/project-management): timeline get/post, attachments get/post.

AI (/api/ai): integration-status, alerts, anomalies, dashboard, memory, memory/search, chat.

Approval intelligence (/api/ai-intelligence): rules, suggestions refresh, pending, biometric credentials operations.

AI employ (/api/ai-employ): classify/propose/confirm/reject/pending.

Users (/api/users): me profile/preferences + admin CRUD.

Used vs unused (frontend evidence):
1. ব্যবহৃত: AI chat/alerts/anomalies/dashboard, AI employ flow, finance expenses/accounts/manual/fund entries, pos products/sales, project timeline/attachments, users me profile/preferences, webauthn endpoints.
2. frontend-এ evidence কম/নেই: finance transfer/balance, construction workers/materials, landed-costs, ai integration-status, অনেক approval-intelligence এবং users admin endpoints।
3. বাহিরের client ব্যবহার করে কি না: NOT VERIFIED.

## 9. AI System
Capabilities:
1. Language detect + translate + fuzzy intent + role-aware response.
2. Dashboard/anomaly/alert support.
3. File-driven auto insertion proposal workflow.

Query correctness findings:
1. AI engine workers(name,daily_wage) query canonical schema-এর সাথে mismatch করতে পারে।
2. material_logs dependency canonical movement model-এর সাথে mismatch risk তৈরি করে।

Automation pipeline:
1. File upload → classify → propose → confirm/reject → domain table insert.
2. Interaction trace ai_auto_insertions/ai_interactions-এ থাকে।

## 10. Offline & PWA
Queue system:
1. Persisted queue আছে।
2. Online হলে auto-flush loop আছে।

বাস্তব usage:
1. Consumer আছে, producer adoption আংশিক।
2. Core write path-এর বড় অংশ এখনও সরাসরি API/DB call করে।

Failure cases:
1. endpoint validator absolute URL চায়, কিন্তু বাস্তবে relative path ব্যবহৃত।
2. Sync conflict UX যথেষ্ট উন্নত নয়।

## 11. Security
Auth:
1. Backend token যাচাই + user role lookup আছে।
2. Frontend middleware session/role gate দেয়।

RBAC:
1. Backend require_roles active।
2. Frontend role-access matrix আছে।

Direct DB bypass risk:
1. Browser direct write থাকার কারণে centralized policy/audit enforcement দুর্বল।

Audit logs:
1. Backend audit helper আছে।
2. DB audit hardening migration আছে।
3. Direct browser writes হলে audit completeness কমে।

## 12. DevOps
Deployment:
1. Vercel web build configured [vercel.json](vercel.json)।
2. Python dependency vendoring script [apps/api-core-python/vercel-install.sh](apps/api-core-python/vercel-install.sh)।

Env configuration:
1. Global env set [turbo.json](turbo.json)-এ।
2. Backend strict env validation [apps/api-core-python/core/config.py](apps/api-core-python/core/config.py)-এ।

CI/CD:
1. CodeQL config আছে [.github/codeql/codeql-config.yml](.github/codeql/codeql-config.yml)।
2. Full workflow pipeline yaml: NOT VERIFIED.

Migration execution:
1. Migration chain আছে।
2. Automated migration pipeline runner repo-তে স্পষ্ট নয় (NOT VERIFIED)।

## 13. Testing
বর্তমান অবস্থা:
1. Backend tests একাধিক আছে [apps/api-core-python/tests](apps/api-core-python/tests)।
2. Integration/E2E style test-এ Supabase heavily mocked।

Gap:
1. Real DB migration compatibility test অনুপস্থিত।
2. Frontend automated test suite evidence নেই (NOT VERIFIED)।
3. API contract regression test সীমিত।

## 14. Critical Issues
CRITICAL:
1. Schema drift (material_logs, workers column mismatch)
   File: [supabase/migrations/017_materials_stock_and_worker_logs_columns.sql](supabase/migrations/017_materials_stock_and_worker_logs_columns.sql), [apps/api-core-python/services/ai_engine.py](apps/api-core-python/services/ai_engine.py#L304), [supabase/migrations/003_full_saas_schema.sql](supabase/migrations/003_full_saas_schema.sql#L133)
   Root cause: legacy + canonical schema overlap
   Impact: query failure, data inconsistency

2. Direct browser DB write on critical modules
   File: [apps/web-pwa/src/features/inventory/InventoryView.tsx](apps/web-pwa/src/features/inventory/InventoryView.tsx), [apps/web-pwa/src/features/crm/CRMView.tsx](apps/web-pwa/src/features/crm/CRMView.tsx), [apps/web-pwa/src/features/contractor/ContractorView.tsx](apps/web-pwa/src/features/contractor/ContractorView.tsx)
   Root cause: strict API boundary নেই
   Impact: audit/policy bypass risk

HIGH:
1. Attendance contract mismatch (UI direct insert vs backend worker_id-geofence model)
   File: [apps/web-pwa/src/features/construction/worker_logs/WorkerLogsFeature.tsx](apps/web-pwa/src/features/construction/worker_logs/WorkerLogsFeature.tsx), [apps/api-core-python/routers/hr.py](apps/api-core-python/routers/hr.py)
   Impact: data integrity gap

2. Offline producer integration incomplete
   File: [apps/web-pwa/src/lib/validators.ts](apps/web-pwa/src/lib/validators.ts), [apps/web-pwa/src/store/offlineQueue.ts](apps/web-pwa/src/store/offlineQueue.ts), [apps/web-pwa/src/lib/offlineSync.ts](apps/web-pwa/src/lib/offlineSync.ts)
   Impact: offline guarantee weak

MEDIUM:
1. Dict payload endpoints with weaker typing
   File: [apps/api-core-python/routers/approval_intelligence.py](apps/api-core-python/routers/approval_intelligence.py), [apps/api-core-python/routers/auth.py](apps/api-core-python/routers/auth.py)
   Impact: contract drift risk

2. CI/CD + migration automation visibility সীমিত
   File: [vercel.json](vercel.json), [turbo.json](turbo.json)
   Impact: release variability

## 15. Module Priority Map (Mandatory)
🔴 Tier 1 (Fix Immediately)
1. Finance
2. Attendance / Workforce
3. Materials
4. Approval System
কারণ: আর্থিক ও data integrity impact সবচেয়ে বেশি; hybrid write path + schema mismatch সরাসরি এই modules প্রভাবিত করছে।

🟠 Tier 2 (Stabilize Next)
1. API layer consistency
2. Database schema alignment
3. AI query correctness
4. Offline queue producer adoption
কারণ: tier-1 স্থিতিশীল করতে এই foundation আগে দরকার।

🟡 Tier 3 (Optimization)
1. UI/UX enhancement
2. Reports optimization
3. Dashboard personalization

🟢 Tier 4 (Scale & Advanced)
1. AI enhancement
2. Automation orchestration
3. Advanced analytics

## 16. Fix Roadmap
Phase 1 (Immediate):
1. Critical modules-এ API-only write enforce করুন
2. Schema drift fix করুন
3. AI query canonical schema অনুযায়ী patch করুন

Phase 2 (Stabilize):
1. Clean DB migration smoke test
2. Full API contract test
3. Dict endpoint typed schema-তে আনুন

Phase 3 (Optimize):
1. Offline queue producer integration
2. Sync conflict resolution UX
3. Heavy read path caching strategy

Phase 4 (Scale):
1. Worker queue for async jobs
2. Event outbox + observability
3. Safer retrieval + explainable AI layer

## 17. Final Target Architecture
Target chain:
Frontend → API Proxy → FastAPI → Postgres/Supabase → Worker → AI

Write rule:
1. Core table-এ browser direct write নিষিদ্ধ
2. সব mutation backend validation + audit-এর মাধ্যমে

Read rule:
1. Low-risk dashboard read direct হতে পারে policy অনুযায়ী
2. Sensitive এবং financial read backend-mediated হবে

Async processing:
1. File classification, anomaly recompute, report generation worker queue-এ যাবে
2. দীর্ঘ কাজের জন্য API job-id pattern ব্যবহার করবে

Final verdict:
এই repository-তে enterprise-grade feature breadth ইতোমধ্যে আছে। সবচেয়ে বড় সমস্যা feature ঘাটতি নয়, consistency gap। strict write boundary এবং schema alignment করলে production reliability উল্লেখযোগ্যভাবে বৃদ্ধি পাবে।
