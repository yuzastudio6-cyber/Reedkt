# Source Of Truth Audit

Packet: `RP-EXTERNAL-PRODUCT-BETA-CURRENT-READINESS-ROLLUP-1`

## Current Source Chain

- Current integration head: `9db791f8d33b3f5f1dd794225fe2e9b9b52f779c`.
- `RP-EXTERNAL-BETA-REEDITPRO-SUPABASE-MAIN-TARGET-MIGRATION-SYNC-1`: source-of-truth for the completed main Reeditpro staging migration-history sync.
- `RP-EXTERNAL-BETA-MAIN-SUPABASE-SERVICE-ROLE-RUNTIME-VALIDATION-1`: source-of-truth for main Reeditpro staging public mutation grant hardening and service-role grant-boundary validation.
- `RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-PERSISTENCE-GUARDED-REMOTE-WRITE-1`: source-of-truth for transaction-rolled-back approved snapshot persistence remote write/readback validation.
- `RP-EXTERNAL-BETA-CREDIT-RESERVATION-LEDGER-GUARDED-REMOTE-WRITE-1`: source-of-truth for transaction-rolled-back credit reservation and ledger remote write/readback validation.
- `RP-EXTERNAL-BETA-JOB-QUEUE-LEASE-EVENT-GUARDED-REMOTE-WRITE-1`: source-of-truth for transaction-rolled-back job queue, job event, worker lease, and job claim attempt remote write/readback validation.
- `RP-EXTERNAL-BETA-PRIVATE-ARTIFACT-STORAGE-ACCESS-GUARDED-REMOTE-WRITE-1`: source-of-truth for guarded generated private storage object write/read/delete and transaction-rolled-back artifact metadata write/readback validation.
- `RP-EXTERNAL-BETA-SERVICE-ROLE-ROUTE-RUNTIME-VALIDATION-1`: source-of-truth for guarded in-process `GET /v1/storage-objects/:storageObjectRecordId` canonical metadata route readback validation.
- `RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-ROUTE-WRITE-RUNTIME-VALIDATION-1`: source-of-truth for guarded in-process `POST /v1/edit-plans/:editPlanId/approved-snapshots` route write/readback/cleanup validation.
- `RP-EXTERNAL-BETA-REMOTION-PRIVATE-PREVIEW-EXPORT-RUNTIME-VALIDATION-1`: source-of-truth for the confirmation-gated generated-local Remotion private preview/export runtime validation.
- `RP-EXTERNAL-BETA-PROVIDER-MODEL-CALL-POLICY-CLOSURE-1`: source-of-truth for external beta provider/model-call policy closure with no provider/model runtime execution.
- `RP-EXTERNAL-BETA-QA-CLEANUP-OBSERVABILITY-ROLLBACK-REVIEW-1`: source-of-truth for QA, cleanup, observability, rollback, incident support, privacy, cost, and deployment posture review with no runtime execution.
- `RP-EXTERNAL-BETA-RELEASE-GO-NO-GO-1`: source-of-truth for accepting the merged source chain for controlled external beta enablement planning with no runtime unlock.
- `RP-EXTERNAL-BETA-CONTROLLED-ENABLEMENT-1`: source-of-truth for the exact fail-closed external beta staging flag contract and rollback boundary, with no environment mutation or deployment.
- `RP-EXTERNAL-BETA-TESTER-ACCOUNT-MEMBERSHIP-SMOKE-1`: source-of-truth for the owner-approved real tester account smoke using `aiediting@reeditpro.com`.
- `RP-EXTERNAL-BETA-CONTROLLED-TESTER-PRODUCT-FLOW-SMOKE-1`: source-of-truth for the guarded authenticated mock product-flow smoke using `aiediting@reeditpro.com`, with `/api/routes` and `/api/mock` only, planning stopped before approval, job execution blocked, and backend-required approval/render routes blocked as `424 backend_runtime_required`.
- `RP-EXTERNAL-BETA-CONTROLLED-TESTER-UI-FLOW-SMOKE-1`: historical source-of-truth for the first controlled tester browser/UI surface probe using `aiediting@reeditpro.com`; it recorded blocker `blocked_deployed_browser_ui_surface_not_present` before the browser UI surface was deployed.
- `RP-EXTERNAL-BETA-DEPLOYED-BROWSER-UI-SURFACE-1R-STAGING-DEPLOY`: current source-of-truth for the successful deployed browser UI surface, Cloud Build `54fd2cfd-4f19-472d-8b5f-5fbfe55f59b1`, Cloud Run revision `reeditpro-staging-api-00006-6gw`, and controlled tester UI smoke run `2026-06-27T17-15-34-003Z-a728f2ff` for `aiediting@reeditpro.com`.
- PR #1102: source-of-truth for the single active Supabase target decision: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`.
- PR #1019 / `SUPABASE-STAGING-MIGRATION-HISTORY-OWNER-DECISION-1`: historical source for the previous staging migration path blocker, now superseded by the guarded main-target migration sync.
- PR #1016 / `SUPABASE-MIGRATION-HISTORY-RECONCILIATION-1`: source-of-truth for migration-history reconciliation posture.
- PR #1013 / `SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4R-EXTERNAL-STAGING-SQL-HISTORY-BLOCKER-1`: source-of-truth for the read-only migration history audit and dry-run evidence.
- PR #1008 / `SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4R-CONFIRMED`: source-of-truth for the fail-closed RPC 4R confirmed runner status.
- `RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED`: source-of-truth for completed read-only target identity and advisor validation.

## Credential/Target Context

The latest non-secret Secret Manager metadata check observed `SUPABASE_ACCESS_TOKEN` version `5` as `enabled` at `2026-06-26T14:36:16`. The token payload was not accessed, printed, summarized, committed, or written to docs.

The approved read-only DB URL secret already has a version, and source records `REEDITPRO_STAGING_SUPABASE_DB_URL` as the read-only DB URL alias used by the confirmed validation runner. This rollup did not access that payload.

## Exclusions

PR #577 remains open/draft/blocked and excluded as source-of-truth for this beta readiness decision.

Older internal-beta candidate/readiness documents remain historical context only when they predate the main-target migration sync, service-role grant-boundary validation, approved snapshot guarded remote write/readback, credit ledger guarded remote write/readback, job queue lease/event guarded remote write/readback, private artifact storage/access guarded remote write/readback, service-role route runtime validation, approved snapshot route write runtime validation, external-beta generated-local Remotion runtime validation, external-beta provider/model-call policy closure, external-beta QA/cleanup/observability/rollback review, external-beta release go/no-go, external-beta controlled enablement source contract, staging flag application, controlled smoke validation, private invite IAM grant, owner-member smoke readback, owner-approved tester-account smoke, controlled tester product-flow smoke, and deployed browser UI surface smoke. They do not override the current product API readiness `ready_for_controlled_owner_tester_product_walkthrough`, the browser UI readiness `ready_for_controlled_owner_browser_walkthrough`, or the fact that `external beta enabled in this phase` is `true` only for the controlled staging API lane.

## Current Interpretation

The safe target, credential context, main Reeditpro staging migration history, public mutation grant boundary, approved snapshot persistence remote write/readback, credit reservation ledger remote write/readback, job queue lease/event remote write/readback, private artifact storage/access remote write/readback, storage metadata route readback, approved snapshot route write readback, generated-local Remotion private preview/export runtime validation, provider/model-call policy closure, QA/cleanup/observability/rollback review, release go/no-go, controlled enablement source contract, staging flag application, controlled smoke validation, private invite IAM grant, owner-member smoke readback, owner-approved tester-account smoke, controlled tester product-flow smoke, and deployed browser UI smoke are aligned for controlled owner browser walkthrough on the staging API. The controlling blocker is no longer tester-account membership, auth smoke, product-flow smoke, or missing browser UI. The next evidence should run `RP-EXTERNAL-BETA-CONTROLLED-OWNER-BROWSER-WALKTHROUGH-1` while keeping public access, paid production, broad media, providers, workers, and final delivery/export blocked.
