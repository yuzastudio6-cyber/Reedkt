# Backend Worker Storage Credit Gates For Internal Beta

Decision: `blocked_pending_backend_worker_render_storage_billing_and_tool_runtime_gates`

Execution: `completed_docs_only_internal_beta_readiness_source_of_truth_no_runtime_unlock`

## Required Systems

### Data And Supabase

- Projects, media assets, approved plan versions, credit reservations, jobs, worker events, artifact manifests, QA reports, and audit records are required before end-to-end internal beta.
- RLS tests must prove least-privilege user isolation.
- Service-role-only mutation paths must stay backend-only.
- Supabase classification for this packet: `not_applicable_docs_only`; environment touched `none`; SQL executed `none`; migration deployed `no`.

### Approval And Credits

- Real approved-plan persistence is required.
- Credit estimates must be stored against approved plan versions.
- Internal credit reservation, release, refund, and audit ledger are required before worker execution.
- Stripe/payment processing remains disabled for internal beta unless a separate sandbox-only billing milestone approves it.

### Workers And Runtime

- Worker jobs must execute approved snapshots only, not raw chat.
- Jobs require idempotency keys, leases, status events, artifact manifests, cleanup hooks, and structured errors.
- Provider/model adapters must be backend-only, disabled by default, secret-isolated, and blocked before approval plus credit reservation.

### Private Artifacts

- Uploads, generated previews, manifests, QA reports, and cleanup records must use private storage.
- No public artifact creation is allowed.
- Signed URLs cannot become source-of-truth for readiness.

## Negative Tests Required Before Unlock

- No generation before approved plan snapshot.
- No worker execution from raw chat.
- No credits spent without a reservation.
- No frontend provider/model calls.
- No public artifact creation.
- No production/final delivery unlock.
- No broad media path without explicit internal beta scope.

## Current Outcome

Internal beta end-to-end status remains `not_ready`.

Next milestone sequence:

1. `RP-DATA-01-SUPABASE-SCHEMA-MIGRATION-READINESS`
2. `RP-BACKEND-01-APPROVED-SNAPSHOT-JOB-QUEUE-SKELETON`
3. `RP-CREDITS-01-INTERNAL-CREDIT-LEDGER`
4. `RP-STORAGE-01-PRIVATE-ARTIFACT-BUCKETS`
5. `RP-RENDER-01-REMOTION-WORKER-SKELETON`
6. `RP-INTERNAL-BETA-E2E-1`
