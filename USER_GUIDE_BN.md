# BD CR7 Ultra Enterprise - User Guide (Bangla)

## 1) পরিচিতি
BD CR7 Ultra Enterprise একটি ERP + PWA প্ল্যাটফর্ম যেখানে Construction, Finance, Import, POS, Reports, AI Assistant এবং Settings মডিউল একসাথে কাজ করে।

## 2) কিভাবে লগইন করবেন
1. Login পেজে ইমেইল ও পাসওয়ার্ড দিয়ে Sign in করুন।
2. চাইলে Biometric সেকশনে:
- Fingerprint বাটন
- Face Scan বাটন
ব্যবহার করতে পারবেন (ডিভাইস/ব্রাউজার support সাপেক্ষে)।

## 3) PWA হিসেবে মোবাইলে ব্যবহার
1. Browser থেকে সাইট খুলুন: https://bd-cr7.vercel.app
2. Add to Home Screen / Install App নির্বাচন করুন।
3. অ্যাপ ওপেন করলে নিচে row-style module nav থাকবে, horizontal scroll করে সব মডিউল দেখা যাবে।

## 4) Role অনুযায়ী module access
সিস্টেমে role অনুযায়ী মডিউল দেখানো হয়:

- admin:
Dashboard, Construction, Finance, Import, POS, Projects, Reports, Settings

- maker:
Dashboard, Construction, Finance, Import, POS, Projects, Reports, Settings

- checker:
Dashboard, Finance, Reports, Settings

- viewer:
Dashboard, Reports, Settings

- worker:
Dashboard, Construction, POS, Settings

## 5) মডিউল ব্যবহার নির্দেশনা
### Dashboard
- সারাংশ KPI, activity status, quick navigation।

### Construction
- Project tracking, worker flow, material movement, progress camera evidence।

### Finance
- Fund manager + expense engine, expense ledger, category breakdown।

### Import
- L/C entry, status tracking, arrival management, record delete/update flow।

### POS
- Product fetch, cart, checkout, sale + sale items save।

### Reports
- 7/30/90 দিনের রিপোর্ট
- Expense + material CSV export
- Finance/material/attendance snapshot

### Settings
- User profile (name, phone) edit
- account context view

### SUMONIX AI Chat
- floating AI button থেকে anomalies / dashboard summary query করা যায়

## 6) সাধারণ সমস্যা ও সমাধান
- Biometric কাজ না করলে:
ডিভাইস/ব্রাউজারে WebAuthn support এবং security settings চেক করুন।

- ডাটা না দেখালে:
ইন্টারনেট, Supabase credentials, এবং user role permissions যাচাই করুন।

- মোবাইলে নিচের মেনুতে সব মডিউল দেখা না গেলে:
bottom nav row horizontally swipe করুন।

## 7) Admin এর জন্য role management নির্দেশনা
বর্তমানে role backend users/roles টেবিল থেকে আসে। নতুন user role change করতে:
1. roles টেবিলে target role আছে কিনা নিশ্চিত করুন
2. users.role_id update করুন
3. user re-login করলে নতুন module visibility apply হবে

## 8) Security Notes
- Credentials শেয়ার করবেন না
- Shared device হলে logout করুন
- Unknown device alert এলে password reset করুন

## 9) Support
Deployment URL: https://bd-cr7.vercel.app
Tech stack: Next.js + FastAPI + Supabase
