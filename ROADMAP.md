# BD CR7 System Roadmap

## Current System Status

### Completed Features
- ✅ **Supabase HTTP-only architecture** with atomic RPC fallback for fund transfers.
- ✅ **Authentication** with JWT validation and role-based access control (RBAC).
- ✅ **Finance module**: multi-account support, expense creation with risk scoring, approval workflow (maker-checker), fund transfers with balance validation.
- ✅ **POS module**: product barcode scanning, inventory tracking, sales recording, cart removal, totals calculation.
- ✅ **HR module**: user management, department assignment, role provisioning.
- ✅ **AI risk engine**: dynamic risk scoring for expenses based on amount, category, user history, and frequency.
- ✅ **PWA capabilites**: offline queue, add-to-homescreen support, service worker.
- ✅ **Mobile responsiveness**: all panels scale to < 768px screens; touch-friendly (48px+ buttons).
- ✅ **Frontend security**: hardcoded test credentials removed; input validation on all forms; loading states for async operations.

---

## Known Gaps & Scalability Issues

### Backend Issues
1. **Broad exception handling** in `auth.py` and `finance.py`:
   - All exceptions caught as generic "Supabase X failed" messages.
   - **Impact**: Hard to debug failures; users see opaque errors.
   - **Fix**: Define specific `AuthError`, `AccountError`, `TransferError` exception types; catch and log individually.

2. **Missing null safety**:
   - Role lookup in `auth.py` assumes `metadata` field exists; crashes if null.
   - Account lookups don't validate `is_locked` status before transfer.
   - **Impact**: Silent failures or 500 errors under edge cases.
   - **Fix**: Add explicit null checks and locked-account validation (partially added in recent audit).

3. **No rate limiting or DDoS protection**:
   - FastAPI endpoints exposed without throttling.
   - **Impact**: Potential for abuse (e.g., spam login attempts, bulk expense creation).
   - **Fix**: Implement middleware rate limiting (e.g., 10 reqs/min per IP).

4. **Unvalidated user input in RPC calls**:
   - `reference` field truncated to 100 chars but not validated before SQL injection risk.
   - **Impact**: Low risk with Pydantic, but defensive coding needed.
   - **Fix**: Add regex validation on reference; use Pydantic validators consistently.

### Frontend Issues
1. **No real-time updates**:
   - Dashboard doesn't poll for new expenses or balance changes.
   - **Impact**: User sees stale data; must manually refresh.
   - **Fix**: Add WebSocket listener or polling interval (e.g., refresh every 30s).

2. **Incomplete error recovery**:
   - Network failures show generic "Failed to load" without retry button.
   - **Impact**: User frustration; no self-service recovery path.
   - **Fix**: Add explicit retry button and exponential backoff on failed requests.

3. **No pagination**:
   - Recent expenses limited to 5 items hardcoded.
   - **Impact**: Unscalable if users have 100+ expenses.
   - **Fix**: Implement cursor-based or offset-based pagination.

4. **Offline state management incomplete**:
   - Offline queue stores actions but doesn't validate schema offline.
   - **Impact**: Invalid actions queued, fail on sync.
   - **Fix**: Run Pydantic validators on queue write.

### Database Issues
1. **No archival/retention policy**:
   - All transactions stored indefinitely; audit logs grow unbounded.
   - **Impact**: Storage costs scale linearly; queries slow on large tables.
   - **Fix**: Partition transaction tables by year; archive old data to cold storage.

2. **Missing foreign key cascades**:
   - Deleting an account doesn't cascade-delete its transactions.
   - **Impact**: Orphaned data; referential integrity issues.
   - **Fix**: Add `ON DELETE CASCADE` or explicit cleanup in migrations.

---

## Recommended Features (Next 3–6 Months)

### 1. **Real-Time Notifications** (High Priority)
- **Scope**: WebSocket or polling integration for expense approvals, transfer confirmations, and low-balance alerts.
- **Benefit**: Users notified instantly; reduces manual refresh burden.
- **Effort**: ~2 weeks (backend: WebSocket server + message queue; frontend: listener component).
- **Tech**: Socket.io or Supabase Realtime; BroadcastChannel API for multi-tab sync.

### 2. **Advanced Reporting & Analytics** (High Priority)
- **Scope**: Dashboard with:
  - Expense trends (weekly/monthly charts).
  - Risk distribution (pie chart of risk scores).
  - User spending leaderboard.
  - Export to CSV/PDF.
- **Benefit**: Better financial insights; compliance reporting.
- **Effort**: ~3 weeks (backend: aggregation views + Postgres window functions; frontend: charting library like Chart.js).
- **Tech**: Chart.js, Visx, or Recharts; Postgres materialized views.

### 3. **Audit Trail & Compliance** (Medium Priority)
- **Scope**: Immutable log of all mutations (create, update, delete) with user, timestamp, and old/new values.
- **Benefit**: Regulatory compliance (GDPR, SOC2); forensic investigation capability.
- **Effort**: ~2 weeks (Postgres trigger-based audit table; frontend: audit log viewer).
- **Tech**: PostgreSQL triggers; Supabase Realtime for live audit stream.

### 4. **Multi-Currency Support** (Medium Priority)
- **Scope**: Add currency field to accounts; convert transfers between currencies using live exchange rates.
- **Benefit**: Support cross-border transactions; global expansion.
- **Effort**: ~2 weeks (exchange rate API integration; schema migration; frontend currency picker).
- **Tech**: Open Exchange Rates API or Fixer.io; Pydantic validators for currency codes.

### 5. **AI Assistant Chat Interface** (Medium Priority)
- **Scope**: Natural-language Q&A for finance questions (e.g., "How much did I spend on travel last month?").
- **Benefit**: Reduces UI friction; accessibility improvement.
- **Effort**: ~3 weeks (integrate with Claude/GPT via API; build vector store for fine-tuned queries; frontend chat widget).
- **Tech**: LangChain, ChromaDB, Claude API.

### 6. **Automated Reconciliation** (Low Priority)
- **Scope**: Detect and flag mismatched transactions between accounts (e.g., transfer sent but not received).
- **Benefit**: Reduce accounting errors; detect fraud.
- **Effort**: ~2 weeks (Postgres scheduled jobs; email alerts).
- **Tech**: pg_cron or APScheduler; email service (SendGrid).

---

## Scalability Roadmap

### Phase 1: Database Optimization (Months 1–2)
- Add indexes on `user_id`, `account_id`, `created_at` in transaction tables.
- Implement table partitioning by `created_at` (yearly).
- Archive transactions > 2 years to cold storage (S3/Blob).

### Phase 2: Caching & CDN (Months 2–3)
- Add Redis cache for dashboard metrics (TTL: 1 min).
- Cache product catalog (TTL: 5 min).
- Serve static assets + PWA manifest from CDN (Cloudflare).

### Phase 3: API Gateway & Load Balancing (Months 3–4)
- Deploy FastAPI behind load balancer (Gunicorn + nginx).
- Add rate limiting middleware (10 req/sec per IP).
- Implement request tracing (OpenTelemetry).

### Phase 4: Microservices Decomposition (Months 4–6)
- Separate AI risk engine into standalone service.
- Extract POS into dedicated API.
- Implement service-to-service auth (mTLS).

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Supabase outage (1–2 hours) | Medium | High | Fallback to HTTP-only mode; queue transactions offline. |
| Database corruption | Low | Critical | Implement automated backups (daily) + point-in-time restore. |
| Unauthorized access (role bypass) | Low | Critical | Add security audit; implement API-level RBAC checks. |
| Data breach (exposed tokens) | Low | Critical | Implement token rotation (24h); add IP whitelisting for admin. |
| Scalability wall (10k+ users) | Medium | High | Implement microservices, caching, and CDN as outlined. |

---

## Success Metrics

- **Performance**: API response time < 200ms (p95); Dashboard load < 2s.
- **Reliability**: 99.5% uptime; < 0.1% transaction failure rate.
- **Adoption**: 80% monthly active users; 90% completing first transfer within 30 days.
- **Risk Accuracy**: Risk scores predict approval rate with > 85% precision.
- **Support Load**: < 1% of transactions require manual intervention; average resolution time < 4 hours.

---

## Approved for Internal Review
- **Last Updated**: December 2024
- **Owner**: Development Team
- **Next Review**: March 2025
