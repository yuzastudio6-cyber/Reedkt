# Fix Priority Plan

## Current Priority

RP-FIX-06 through RP-FIX-12 are partially fixed. The next highest priority should be a Cloud Run deployment/Secret Manager readiness task that can attach real handlers to the route registry and lease contracts without exposing backend credentials.

## Recommended Order

1. Prepare Cloud Run deployment, Secret Manager bindings, service account IAM, and production-safe request auth for the RP-FIX-12 server scaffold.
2. Add full auth UI and route/session integration.
3. Validate Supabase Storage buckets and RLS locally/staging.
4. Add approved snapshot persistence.
5. Implement production transactional credit ledger handlers behind backend routes.
6. Implement production worker queue leases, heartbeat handling, idempotency enforcement, and cloud dispatch behind backend routes.

## Guardrails

- Keep service role backend-only.
- Keep provider, worker, payment, and admin secrets out of frontend bundles.
- Do not run provider, billing, rendering, or worker operations before plan and credit approval.
- Do not deploy Supabase migrations without local/staging validation.
