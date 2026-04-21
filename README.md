# Cyber Pulse Universal POS (Pakistan)

Secure, multi-tenant universal POS starter for any business type.

It includes a robust PostgreSQL schema and FBR-ready integration service layer.

## What Is Included

- Next.js + TypeScript foundation
- Prisma schema for POS entities
- Security utilities (password hashing + JWT helpers)
- FBR client module with invoice/tax payload patterns
- Auth APIs (register, login, refresh, logout)
- POS transaction APIs (create order, pay order, generate invoice)
- FBR sync endpoint with status tracking (`SYNCED` / `FAILED`)
- Universal template engine (modules/fields/workflow flags per tenant)
- Architecture guide for production implementation

## Quick Start

1. Copy `.env.example` to `.env`
2. Set `DATABASE_URL`, `JWT_SECRET`, and `FBR_*` values
3. Install dependencies
4. Generate Prisma client
5. Run migrations
6. Start development server

```bash
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

## API Endpoints (MVP)

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/pos/orders`
- `POST /api/pos/orders/:orderId/pay`
- `POST /api/pos/orders/:orderId/invoice`
- `POST /api/fbr/sync/:invoiceId`
- `POST /api/fbr/calculate`
- `GET /api/settings/template`
- `PATCH /api/settings/template`
- `GET /api/health`

## Admin UI

- `GET /admin/template` to manage tenant `businessType`, modules, required fields, and workflow flags.
- Use an access token from `POST /api/auth/login` in the UI to load and update template config.

## Recommended Next Implementation

1. Add async queue worker for FBR retries and scheduled reconciliation
2. Add stock movement ledger and return/refund workflows
3. Add optional packaged vertical flows as reusable templates
4. Add admin dashboard + reporting endpoints
5. Add test suite (unit + integration + API contract tests)

## Vercel + GitHub Deployment

1. Push this project to GitHub
2. Import repo in Vercel
3. Configure environment variables in Vercel settings
4. Add managed PostgreSQL and set `DATABASE_URL`
5. Run Prisma migrations in deployment pipeline

## Important Compliance Note

FBR/IRIS endpoints and payload contracts may vary by registration type and API version.
When you receive official API docs/credentials, update `src/lib/fbr/client.ts` to match
their authentication, endpoint paths, and required fields exactly.
