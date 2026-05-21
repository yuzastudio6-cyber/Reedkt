# Fix Priority Plan

## Current Priority

RP-FIX-06 through RP-FIX-12 are partially fixed, RP-FIX-14 partially fixes project-level SFX workflow integration in mock mode, RP-FIX-15 adds real SFX provider execution readiness reporting, and the consolidated local E2E branch makes the first browser-local editor loop testable. The next highest priority should be Supabase local/staging validation plus Cloud Run deployment/Secret Manager rehearsal so real handlers can eventually attach to the route registry, worker leases, storage, approved snapshots, and provider adapters without exposing backend credentials.

## Recommended Order

1. Validate active Supabase migrations, RLS, storage buckets, and generated types locally/staging.
2. Prepare Cloud Run deployment, Secret Manager bindings, service account IAM, and production-safe request auth for the RP-FIX-12 server scaffold.
3. Add full auth UI and route/session integration.
4. Add approved snapshot persistence.
5. Implement production transactional credit ledger handlers behind backend routes.
6. Implement production worker queue leases, heartbeat handling, idempotency enforcement, and cloud dispatch behind backend routes.
7. Implement real SFX provider transport only after backend runtime, Secret Manager value resolution, storage, provenance, retry, QA, and spend/refund paths are approved.

## Guardrails

- Keep service role backend-only.
- Keep provider, worker, payment, and admin secrets out of frontend bundles.
- Do not run provider, billing, rendering, or worker operations before plan and credit approval.
- Do not deploy Supabase migrations without local/staging validation.
