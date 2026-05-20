# Fix Priority Plan

## Current Priority

RP-FIX-06 through RP-FIX-12 are partially fixed, RP-FIX-14 partially fixes project-level SFX workflow integration in mock mode, and RP-FIX-15 adds real SFX provider execution readiness reporting. The next highest priority should be Cloud Run deployment/Secret Manager runtime work so real handlers can eventually attach to the route registry, worker leases, and provider adapter without exposing backend credentials.

## Recommended Order

1. Prepare Cloud Run deployment, Secret Manager bindings, service account IAM, and production-safe request auth for the RP-FIX-12 server scaffold.
2. Add full auth UI and route/session integration.
3. Validate Supabase Storage buckets and RLS locally/staging.
4. Add approved snapshot persistence.
5. Implement production transactional credit ledger handlers behind backend routes.
6. Implement production worker queue leases, heartbeat handling, idempotency enforcement, and cloud dispatch behind backend routes.
7. Implement real SFX provider transport only after backend runtime, Secret Manager value resolution, storage, provenance, retry, QA, and spend/refund paths are approved.

## Guardrails

- Keep service role backend-only.
- Keep provider, worker, payment, and admin secrets out of frontend bundles.
- Do not run provider, billing, rendering, or worker operations before plan and credit approval.
- Do not deploy Supabase migrations without local/staging validation.
