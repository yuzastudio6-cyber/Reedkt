# Fix Priority Plan

## Current Priority

RP-FIX-06 through RP-FIX-12 are partially fixed, and the local end-to-end MVP loop is now wired in browser demo mode. The next highest priority should be a Cloud Run deployment/Secret Manager readiness task that can attach real handlers to the route registry and lease contracts without exposing backend credentials.

## Recommended Order

1. Prepare Cloud Run deployment, Secret Manager bindings, service account IAM, and production-safe request auth for the RP-FIX-12 server scaffold.
2. Validate Supabase migrations, Storage buckets, and RLS locally/staging.
3. Add full auth UI and route/session integration.
4. Persist approved snapshots and local MVP records into backend-controlled tables.
5. Implement production transactional credit ledger handlers behind backend routes.
6. Implement production worker queue leases, heartbeat handling, idempotency enforcement, and cloud dispatch behind backend routes.

## Guardrails

- Keep service role backend-only.
- Keep provider, worker, payment, and admin secrets out of frontend bundles.
- Do not run provider, billing, rendering, or worker operations before plan and credit approval.
- Do not deploy Supabase migrations without local/staging validation.
