# সার্জিক্যাল অডিট রিপোর্ট (বাংলা)

তারিখ: 2026-04-07
প্রকল্প: BD CR7 Ultra Enterprise
স্কোপ: Core-only ERP (UI/UX polish + system validation + deploy-readiness)

## 1. এক্সিকিউটিভ সামারি
এই অডিটে অ্যাপের UI/UX কে আরও ক্লিন, স্মুথ ও ইউজার-ফ্রেন্ডলি করতে core shell ও reusable UI layer-এ targeted update করা হয়েছে। ফাংশনাল ফ্লো ভাঙা ছাড়াই interaction clarity, readability, spacing, state-feedback এবং modal usability উন্নত করা হয়েছে।

## 2. সার্জিক্যাল পরিবর্তনের তালিকা

### 2.1 Global Visual System
- ফাইল: apps/web-pwa/app/globals.css
- পরিবর্তন:
  - body background-এ subtle multi-layer gradient যোগ করা হয়েছে
  - reusable utility class যোগ: `surface-panel`, `section-label`, `page-enter`
  - overall surface depth ও atmosphere উন্নত করা হয়েছে

### 2.2 App Shell Layout
- ফাইল: apps/web-pwa/src/components/appshell/AppShell.tsx
- পরিবর্তন:
  - main content container-এ rounded panel wrapper
  - safe padding, spacing, backdrop polish
  - page entry animation class প্রয়োগ

### 2.3 Top Bar UX
- ফাইল: apps/web-pwa/src/components/appshell/TopBar.tsx
- পরিবর্তন:
  - non-functional branding click area কে clearer info panel-এ রূপান্তর
  - online/offline indicator আরও স্পষ্ট করা হয়েছে
  - interaction affordance consistent করা হয়েছে

### 2.4 Sidebar Navigation UX
- ফাইল: apps/web-pwa/src/components/appshell/Sidebar.tsx
- পরিবর্তন:
  - hierarchy label (Core Navigation)
  - active state visibility বাড়ানো (shadow + contrast)
  - mobile drawer clarity উন্নত

### 2.5 Bottom Navigation UX
- ফাইল: apps/web-pwa/src/components/appshell/BottomNav.tsx
- পরিবর্তন:
  - active indicator stronger
  - label truncation behavior controlled
  - safe-area rendering maintained

### 2.6 Dialog/Modal UX
- ফাইল: apps/web-pwa/src/components/ui/dialog.tsx
- পরিবর্তন:
  - modal panel sizing/spacing tuning
  - clearer header label
  - close action accessibility label

### 2.7 Tabs UX
- ফাইল: apps/web-pwa/src/components/ui/tabs.tsx
- পরিবর্তন:
  - selected tab shadow/contrast উন্নত
  - hover/pressed feedback refined
  - `aria-pressed` যুক্ত

### 2.8 Mobile Shell Feedback
- ফাইল: apps/web-pwa/src/components/layout/MobileAppShell.tsx
- পরিবর্তন:
  - loading state-এ improved feedback card
  - notifications panel-এ timestamp প্রদর্শন
  - notification empty state localization
  - clear action localization
  - global upload FAB interaction polish

## 3. ইউজার-ফ্রেন্ডলিনেস প্রভাব (Expected UX Impact)
- Feature discoverability উন্নত
- Navigation ambiguity কমেছে
- Readability/scanability বেড়েছে
- Interaction confidence বেড়েছে (state clarity)
- Mobile usability ও tap experience উন্নত
- Consistent visual language across modules

## 4. A-to-Z লোকাল ভেরিফিকেশন ফলাফল
নিচের কমান্ডগুলো রান করা হয়েছে:

1. `pnpm --filter ./apps/web-pwa type-check`
   - ফলাফল: PASS
2. `pnpm --filter ./apps/web-pwa lint`
   - ফলাফল: PASS (ESLint warnings/errors নেই)
3. `pnpm --filter ./apps/web-pwa build`
   - ফলাফল: PASS (Next.js production build সফল)
4. `& "d:\BD CR7 Project\.venv\Scripts\python.exe" -m pytest apps/api-core-python/tests -q`
   - ফলাফল: PASS (`239 passed`, `32 subtests passed`)
5. backend runtime smoke:
   - server start: PASS
   - `GET /health`: `200 OK`, response `{"status":"ok"}`

## 5. ঝুঁকি ও পর্যবেক্ষণ
- Functional regression পাওয়া যায়নি
- Build-blocking error পাওয়া যায়নি
- Existing deprecation warning (supabase gotrue package) backend runtime warning হিসেবে আছে, তবে current run blocker নয়

## 6. অবশিষ্ট non-blocking টেকনিক্যাল নোট
- কিছু SQL dialect diagnostics editor-level false-positive হতে পারে (PostgreSQL migration syntax vs non-Postgres parser)
- Runtime এবং test stability-এর উপর এর কোনো negative impact পাওয়া যায়নি

## 7. ডকুমেন্টেশন আপডেট
- README বর্তমান architecture, commands, QA status এবং UX uplift অনুযায়ী আপডেট করা হয়েছে

## 8. গিট ও সিঙ্ক স্ট্যাটাস
- Local checks completed
- Changes committed and pushed to `main`
- Remote sync status validated

---
প্রস্তুত করেছেন: GitHub Copilot (GPT-5.3-Codex)
