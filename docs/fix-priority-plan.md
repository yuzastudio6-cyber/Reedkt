# Fix Priority Plan

## Current Priority

RP-MERGE-AUDIT-00 is now the merge-readiness gate before broad staging. The local implementation is not confirmed merged: `/Volumes/backup/REeditpro` and `/Users/macuser/Developer/REeditpro` diverge, and the status is `path_divergence_risk`. See `docs/repo-merge-integrity-audit.md` and `docs/repo-next-safe-staging-plan.md`.

RP-FIX-06 through RP-FIX-12 are partially fixed, RP-FIX-14 partially fixes project-level SFX workflow integration in mock mode, RP-FIX-15 adds real SFX provider execution readiness reporting, RP-EDITLEVEL-02 adds the mock-safe Normal/Premium/Ultra Premium type/profile foundation, RP-EDITLEVEL-03 adds the mock repository/API/client boundary, RP-EDITLEVEL-04 adds visible mock/local UI Cards + Recommendation, RP-EDITLEVEL-05 adds mock/local Level-Aware Tool Capability Router, RP-EDITLEVEL-06 adds mock/local Level-Aware Source Video Understanding Routing, RP-EDITLEVEL-07 adds mock/local Level-Aware Qwen Planning Profile policy, RP-EDITLEVEL-08 adds mock/local Level-Aware QA Gates, RP-EDITLEVEL-09 adds mock/local Level-Aware Estimates, and RP-CREDITPOLICY-01 locks credit value/service-fee/no-silent-recovery policy as constants/docs only. The next highest backend priority should be Cloud Run deployment/Secret Manager runtime work so real handlers can eventually attach to the route registry, worker leases, credit settlement, and provider adapter without exposing backend credentials. The next edit-level priority should be RP-EDITLEVEL-10 End-to-End Internal Testing + Playwright Coverage.

## Recommended Order

1. Prepare Cloud Run deployment, Secret Manager bindings, service account IAM, and production-safe request auth for the RP-FIX-12 server scaffold.
2. Add full auth UI and route/session integration.
3. Validate Supabase Storage buckets and RLS locally/staging.
4. Add approved snapshot persistence.
5. Implement production transactional credit ledger handlers, live billing settlement, Stripe integration, approved export lock enforcement, and service-fee settlement behind backend routes.
6. Implement production worker queue leases, heartbeat handling, idempotency enforcement, and cloud dispatch behind backend routes.
7. Implement real SFX provider transport only after backend runtime, Secret Manager value resolution, storage, provenance, retry, QA, and spend/refund paths are approved.
8. Start RP-EDITLEVEL-10 to consolidate end-to-end internal testing and Playwright coverage for the mock/local Edit Level stack before production persistence, migrations, providers, workers, render/export, or credit execution.

## Guardrails

- Keep service role backend-only.
- Keep provider, worker, payment, and admin secrets out of frontend bundles.
- Do not run provider, billing, rendering, or worker operations before plan and credit approval.
- Do not deploy Supabase migrations without local/staging validation.
- Do not migrate Basic/Pro/Premium runtime values to Normal/Premium/Ultra Premium until profile fixtures, product values, approved snapshot compatibility, estimates, QA, and tests are defined.
