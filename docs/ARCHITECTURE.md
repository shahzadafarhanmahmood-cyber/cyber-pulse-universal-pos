# Cyber Pulse Universal POS Architecture

## 1) Product Scope

Single universal platform, configurable by tenant business type:

- No hardcoded sector lock
- Modules, required fields, and workflow flags are tenant-configurable
- Any business can define its own operational flow on top of shared POS primitives

## 2) High-Level Modules

- Auth & access control (JWT + RBAC + optional MFA)
- Tenant management (each business isolated)
- Catalog (products, services, medicine, menu items)
- Inventory (stock, batches, expiry, reorder)
- Sales/POS (orders, payments, returns, discounts)
- Compliance (tax calculations, FBR invoice sync)
- Reporting (sales, tax, inventory, cashier, audit)
- Universal template engine (tenant-specific module and workflow toggles)

## 3) Security Baseline

- Password hashing with bcrypt
- JWT with short expiry and rotating refresh tokens
- Role-based permissions by tenant
- Encryption for integration secrets
- Audit log table for compliance traces
- Rate limiting and IP/device fingerprint checks (recommended in API layer)
- Backups and point-in-time recovery on PostgreSQL

## 4) FBR / IRIS Integration Design

Integration flow for FBR registered companies:

1. Tenant enables FBR integration and stores API credentials securely.
2. Invoice is generated in POS.
3. Tax totals are calculated locally.
4. Invoice JSON is posted to FBR API.
5. Response reference is saved in `Invoice.fbrInvoiceRef`.
6. Sync status updates: `SYNCED` or `FAILED`.

Recommended:

- Queue-based retry (BullMQ / SQS / cron worker)
- Idempotency keys for invoice submission
- Dead-letter handling for repeated failures
- Reconciliation job to verify local vs FBR dashboard status

## 5) Multi-Tenant Data Isolation

- All domain records carry `tenantId`
- API should enforce tenant scoping on every query
- Never trust client-provided tenant identifiers without token validation

## 6) Deployment Shape

- Frontend/API: Next.js on Vercel
- Database: managed PostgreSQL (Neon/Supabase/RDS)
- Secret manager: Vercel encrypted env variables
- Monitoring: Sentry + Vercel logs + DB slow query logs

## 7) Current MVP Status

Implemented now:

- Tenant onboarding and owner registration
- Login / refresh / logout token flow
- Audit logs for auth/order/FBR events
- Order creation and payment closing APIs
- Invoice creation and FBR sync status updates
- Tenant template profile for dynamic business configuration

## 8) Build Roadmap

### Phase 1 (Foundation)
- Auth, tenant onboarding, core catalog, inventory, order creation

### Phase 2 (Business Flows)
- Add optional packaged flows as templates (service desks, table service, clinic billing, etc.)
- Keep all packaged flows optional and tenant-driven

### Phase 3 (Compliance & Scale)
- FBR sync queues, reconciliation, compliance reports
- Advanced reporting + alerts + audit center
