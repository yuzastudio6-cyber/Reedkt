# RP-EXTERNAL-PRODUCT-BETA-CURRENT-READINESS-ROLLUP-1

Decision: `blocked_external_product_beta_pending_remaining_runtime_gates_after_job_queue_lease_event_remote_write_readback`

Execution: `completed_docs_only_current_beta_readiness_rollup_no_runtime_execution`

Current integration head: `007dc9480defb1b5aa508c25875f3620dc3c7e0e`

Source closure: `RP-EXTERNAL-BETA-REEDITPRO-SUPABASE-MAIN-TARGET-MIGRATION-SYNC-1`

Internal beta status: `blocked_pending_service_role_runtime_private_artifact_render_provider_security_gates`

External product beta status: `blocked`

Paid production status: `blocked`

Final delivery/export status: `blocked`

Product-ready end-to-end local OSS tools: `0`

Package-lock: `unchanged`

Generated artifacts committed: `none`

## Current Gate Readback

The Supabase target credential, target-validation, main staging migration-history, public mutation grant boundary, approved snapshot remote write/readback, credit reservation ledger remote write/readback, and job queue lease/event remote write/readback lanes are no longer the active blocker. Source evidence records the single active target `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`, the confirmed read-only runner records `completed_guarded_supabase_target_rls_storage_readonly_validation`, the main service-role runtime validation records `completed_main_supabase_service_role_runtime_grant_boundary_validation`, the approved snapshot gate records `completed_approved_snapshot_persistence_guarded_remote_write_readback`, the credit ledger gate records `completed_credit_reservation_ledger_guarded_remote_write_readback`, and the job queue gate records `completed_job_queue_lease_event_guarded_remote_write_readback`.

`RP-EXTERNAL-BETA-REEDITPRO-SUPABASE-MAIN-TARGET-MIGRATION-SYNC-1` source-mapped remote-only migration `20260626163138`, applied the 18 pending repo migrations to the main Reeditpro staging target, applied lint-fix migration `20260626224600`, and recorded final `supabase db push --dry-run` as `Remote database is up to date.` Supabase lint records `No schema errors found`.

`RP-EXTERNAL-BETA-MAIN-SUPABASE-SERVICE-ROLE-RUNTIME-VALIDATION-1` then applied guarded migration `20260626233000_external_beta_public_grant_hardening.sql` and validated unsafe public mutation grants as `0` and unsafe public sequence grants as `0`. No data was copied from `reeditpro-clean-staging-isolated-v1` / `fajinbvwhcjnutkaumkm`; that target is historical sandbox evidence only.

`RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-PERSISTENCE-GUARDED-REMOTE-WRITE-1` validated a generated approved snapshot dependency-chain insert/readback under `set local role service_role`, proved immutable snapshot update rejection, rolled the transaction back, and validated residue counts as `0`.

`RP-EXTERNAL-BETA-CREDIT-RESERVATION-LEDGER-GUARDED-REMOTE-WRITE-1` validated generated credit wallet/grant/approval/reservation/ledger dependency-chain insert/readback under `set local role service_role`, proved ledger append-only update rejection, rolled the transaction back, and validated residue counts as `0`.

`RP-EXTERNAL-BETA-JOB-QUEUE-LEASE-EVENT-GUARDED-REMOTE-WRITE-1` validated generated approved snapshot, credit reservation, job batch, job, job event, worker lease, job claim attempt, and audit-event insert/readback under `set local role service_role`, rolled the transaction back, and validated residue counts as `0`. It read back job status `queued`, job event type `queued`, worker lease status `claimed`, and job claim attempt result `claimed` as generated transaction-only fixtures. No worker was dispatched or executed.

The active blocker is now the remaining route-specific and workflow-specific runtime closure on the main target: route-specific service-role route validation, private artifact access, Remotion/private preview-export runtime validation, provider/model-call policy, and security/privacy/support/cost/deployment review.

## Required Safe Gate

The next beta-enabling gate must validate runtime behavior against the single main Reeditpro staging target without unlocking beta:

1. `RP-EXTERNAL-BETA-PRIVATE-ARTIFACT-STORAGE-ACCESS-GUARDED-REMOTE-WRITE-1`
2. route-specific service-role execution validation
3. Remotion/private preview-export runtime validation
4. provider/model-call policy closure

Until those approvals and validations exist in source, the correct status is `blocked_external_product_beta_pending_remaining_runtime_gates_after_job_queue_lease_event_remote_write_readback`.

## External Product Beta Readiness

External product beta is not ready. The first product-facing beta lane still requires:

- completed service-role grant-boundary validation carried forward on the main target;
- approved snapshot persistence validation;
- credit reservation/ledger runtime validation;
- job queue lease/event runtime validation;
- service-role route runtime validation;
- private artifact manifest and access validation;
- Remotion/private preview-export runtime validation;
- QA/cleanup/observability/rollback validation;
- no-public-artifact and no-signed-url-source-of-truth verification;
- provider/model-call policy closure;
- security, privacy, retention, incident support, deployment, rollback, and cost-control review.

## No-Scope Statement

No service-role route execution, provider call, model call, worker execution, worker dispatch, persistent worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, persistent credit mutation, persistent credit reservation creation, credit spend, persistent job enqueue, persistent job event write, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, preview artifact creation, private media processing, user media processing, Docker execution, Remotion execution, FFmpeg/FFprobe execution, or broad service-role handler was enabled by this rollup. Remote Supabase mutation for the preceding sync, service-role validation, approved snapshot validation, credit ledger validation, and job queue lease/event validation packets was limited to guarded staging migration apply, guarded public grant hardening, a transaction-rolled-back generated approved snapshot fixture, a transaction-rolled-back generated credit reservation and ledger fixture, and a transaction-rolled-back generated job queue, job event, and worker lease fixture on the single main Reeditpro project `wmyyttnynmteqgcdishd`; no data was copied from the isolated project and approved snapshot, credit ledger, and job queue lease/event residue readback was `0`.
