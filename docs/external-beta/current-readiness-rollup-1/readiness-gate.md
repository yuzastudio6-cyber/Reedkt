# RP-EXTERNAL-PRODUCT-BETA-CURRENT-READINESS-ROLLUP-1

Decision: `blocked_external_product_beta_pending_qa_cleanup_observability_security_privacy_support_cost_deployment_after_provider_policy_closure`

Execution: `completed_docs_only_current_beta_readiness_rollup_no_runtime_execution`

Current integration head: `acd4730c8216adb136c7b7d23de3004ac4335577`

Source closure: `RP-EXTERNAL-BETA-REEDITPRO-SUPABASE-MAIN-TARGET-MIGRATION-SYNC-1`

Internal beta status: `blocked_pending_service_role_runtime_private_artifact_render_provider_security_gates`

External product beta status: `blocked`

Paid production status: `blocked`

Final delivery/export status: `blocked`

Product-ready end-to-end local OSS tools: `0`

Package-lock: `unchanged`

Generated artifacts committed: `none`

## Current Gate Readback

The Supabase target credential, target-validation, main staging migration-history, public mutation grant boundary, approved snapshot remote write/readback, credit reservation ledger remote write/readback, job queue lease/event remote write/readback, private artifact storage/access, service-role storage metadata read route, and approved snapshot route write lanes are no longer the active blocker. Source evidence records the single active target `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`, the confirmed read-only runner records `completed_guarded_supabase_target_rls_storage_readonly_validation`, the main service-role runtime validation records `completed_main_supabase_service_role_runtime_grant_boundary_validation`, the approved snapshot gate records `completed_approved_snapshot_persistence_guarded_remote_write_readback`, the credit ledger gate records `completed_credit_reservation_ledger_guarded_remote_write_readback`, the job queue gate records `completed_job_queue_lease_event_guarded_remote_write_readback`, the private artifact gate records `completed_private_artifact_storage_access_guarded_remote_write_readback`, the service-role route gate records `completed_service_role_storage_object_metadata_read_route_runtime_validation`, and the approved snapshot route write gate records `completed_approved_snapshot_route_write_runtime_validation`.

`RP-EXTERNAL-BETA-REEDITPRO-SUPABASE-MAIN-TARGET-MIGRATION-SYNC-1` source-mapped remote-only migration `20260626163138`, applied the 18 pending repo migrations to the main Reeditpro staging target, applied lint-fix migration `20260626224600`, and recorded final `supabase db push --dry-run` as `Remote database is up to date.` Supabase lint records `No schema errors found`.

`RP-EXTERNAL-BETA-MAIN-SUPABASE-SERVICE-ROLE-RUNTIME-VALIDATION-1` then applied guarded migration `20260626233000_external_beta_public_grant_hardening.sql` and validated unsafe public mutation grants as `0` and unsafe public sequence grants as `0`. No data was copied from `reeditpro-clean-staging-isolated-v1` / `fajinbvwhcjnutkaumkm`; that target is historical sandbox evidence only.

`RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-PERSISTENCE-GUARDED-REMOTE-WRITE-1` validated a generated approved snapshot dependency-chain insert/readback under `set local role service_role`, proved immutable snapshot update rejection, rolled the transaction back, and validated residue counts as `0`.

`RP-EXTERNAL-BETA-CREDIT-RESERVATION-LEDGER-GUARDED-REMOTE-WRITE-1` validated generated credit wallet/grant/approval/reservation/ledger dependency-chain insert/readback under `set local role service_role`, proved ledger append-only update rejection, rolled the transaction back, and validated residue counts as `0`.

`RP-EXTERNAL-BETA-JOB-QUEUE-LEASE-EVENT-GUARDED-REMOTE-WRITE-1` validated generated approved snapshot, credit reservation, job batch, job, job event, worker lease, job claim attempt, and audit-event insert/readback under `set local role service_role`, rolled the transaction back, and validated residue counts as `0`. It read back job status `queued`, job event type `queued`, worker lease status `claimed`, and job claim attempt result `claimed` as generated transaction-only fixtures. No worker was dispatched or executed.

`RP-EXTERNAL-BETA-PRIVATE-ARTIFACT-STORAGE-ACCESS-GUARDED-REMOTE-WRITE-1` validated private storage on the same main staging target. It read back eight expected private buckets, private bucket public count `0`, anonymous storage object policy count `0`, created/read/deleted a generated private storage JSON fixture in `previews`, verified storage object residue count: `0`, inserted/read back generated `storage_object_records`, `artifact_manifests`, and `artifact_manifest_items` metadata under `set local role service_role`, rolled the transaction back, and validated artifact metadata rollback residue count `0`. signed URL creation: `false`; public artifact creation: `false`.

`RP-EXTERNAL-BETA-SERVICE-ROLE-ROUTE-RUNTIME-VALIDATION-1` validated the real backend app and service path for `GET /v1/storage-objects/:storageObjectRecordId`. It inserted a generated route metadata fixture, read it through `createReeditProApiApp`, `requireAuth`, and `createUploadService`, then deleted the fixture and verified route fixture cleanup residue count: `0`. The route returned canonicalOnly: `true`. signed URL creation: `false`. public artifact creation: `false`.

`RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-ROUTE-WRITE-RUNTIME-VALIDATION-1` validated the real backend app and service path for `POST /v1/edit-plans/:editPlanId/approved-snapshots`. It generated a bounded approved-plan dependency fixture, called the route through `createReeditProApiApp`, `requireAuth`, `requireIdempotency`, and `createApprovedSnapshotService`, verified approved snapshot and idempotency row readback, then deleted the fixture and verified route write fixture cleanup residue count: `0`. It also closed backend contract gaps for `editPlanVersionId` and `editSessionId`.

`RP-EXTERNAL-BETA-PROVIDER-MODEL-CALL-POLICY-CLOSURE-1` source-closes the provider/model-call policy blocker. It records provider/model runtime as `disabled_by_default`, provider/model calls executed as `none`, frontend provider calls as `forbidden`, backend-only provider adapters as `required`, and approved snapshot, credit reservation, idempotency, cost cap, QA fallback policy, model-routing policy, and server-side secret isolation as required before any future real provider call.

The active blocker is now QA/cleanup/observability/rollback plus security/privacy/support/cost/deployment review. The generated-local Remotion/private preview-export runtime gate is source-closed by `RP-EXTERNAL-BETA-REMOTION-PRIVATE-PREVIEW-EXPORT-RUNTIME-VALIDATION-1`, and the provider/model policy gate is source-closed by `RP-EXTERNAL-BETA-PROVIDER-MODEL-CALL-POLICY-CLOSURE-1`.

## Required Safe Gate

The next beta-enabling gate must validate runtime behavior against the single main Reeditpro staging target without unlocking beta:

1. `RP-EXTERNAL-BETA-QA-CLEANUP-OBSERVABILITY-ROLLBACK-REVIEW-1`
2. security/privacy/support/cost/deployment review
3. future provider/model runtime confirmation packet only if a real call is explicitly approved later

Until those approvals and validations exist in source, the correct status is `blocked_external_product_beta_pending_qa_cleanup_observability_security_privacy_support_cost_deployment_after_provider_policy_closure`.

## External Product Beta Readiness

External product beta is not ready. The first product-facing beta lane still requires:

- completed service-role grant-boundary validation carried forward on the main target;
- approved snapshot persistence validation;
- credit reservation/ledger runtime validation;
- job queue lease/event runtime validation;
- service-role storage metadata read route validation;
- approved snapshot route write runtime validation carried forward from `completed_approved_snapshot_route_write_runtime_validation`;
- private artifact manifest and access validation carried forward from `completed_private_artifact_storage_access_guarded_remote_write_readback`;
- Remotion/private preview-export runtime validation carried forward from `completed_external_beta_generated_local_remotion_private_preview_export_runtime_validation`;
- provider/model-call policy closure carried forward from `completed_external_beta_provider_model_call_policy_closure_no_runtime_calls`;
- QA/cleanup/observability/rollback validation;
- no-public-artifact and no-signed-url-source-of-truth verification;
- security, privacy, retention, incident support, deployment, rollback, and cost-control review.

## No-Scope Statement

No provider call, model call, worker execution, worker dispatch, persistent worker lease claim, browser capture outside Remotion renderer execution, signed URL creation, public artifact creation, persistent credit mutation, persistent credit reservation creation, credit spend, persistent job enqueue, persistent job event write, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, private media processing, user media processing, Docker execution, direct FFmpeg command execution by the runner, FFprobe execution, or broad service-role handler was enabled by this rollup or the provider/model policy closure. Remote Supabase mutation for the preceding sync, service-role validation, approved snapshot validation, credit ledger validation, job queue lease/event validation, private artifact storage/access, service-role route read, and approved snapshot route write packets was limited to guarded staging migration apply, guarded public grant hardening, a transaction-rolled-back generated approved snapshot fixture, a transaction-rolled-back generated credit reservation and ledger fixture, a transaction-rolled-back generated job queue, job event, and worker lease fixture, a guarded generated private storage JSON fixture created/read/deleted, a transaction-rolled-back generated private artifact metadata fixture, a generated route metadata fixture created/read/deleted, and a generated approved snapshot route fixture created/read/deleted on the single main ReeditPro project `wmyyttnynmteqgcdishd`; no data was copied from the isolated project and approved snapshot, credit ledger, job queue lease/event, storage object, artifact metadata, route fixture, and route write fixture residue readback was `0`. Remotion execution in the current source chain was limited to confirmation-gated rendering of a generated local preview fixture under `/tmp`, with output file `reeditpro-external-beta-generated-local-preview.mp4`, bytes `64855`, and SHA-256 `ea12d55c9ef1675da711769c97c9e76bb2da8547bd4c471176a0ff64b03c1c5b`; no generated media was committed.
