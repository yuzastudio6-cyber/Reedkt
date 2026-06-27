# RP-EXTERNAL-PRODUCT-BETA-CURRENT-READINESS-ROLLUP-1

Decision: `completed_owner_member_group_access_smoke_readback_external_tester_membership_still_pending`

Execution: `completed_docs_only_current_beta_readiness_rollup_no_runtime_execution`

Current integration head: `998cfd1367dade30800eb46988fe8aa5cdcce511`

Source closure: `RP-EXTERNAL-BETA-REEDITPRO-SUPABASE-MAIN-TARGET-MIGRATION-SYNC-1`

Internal beta status: `blocked_pending_service_role_runtime_private_artifact_render_provider_security_gates`

External product beta readiness: `ready_for_actual_external_tester_account_addition_and_smoke`

External beta enabled in this phase: `true`

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

The release go/no-go decision is now source-accepted by `RP-EXTERNAL-BETA-RELEASE-GO-NO-GO-1`, and `RP-EXTERNAL-BETA-CONTROLLED-ENABLEMENT-1` adds the exact controlled external beta source contract. `RP-EXTERNAL-BETA-STAGING-FLAG-APPLICATION-1R-AFTER-GCLOUD-REAUTH` closed the Google auth blocker and applied the exact controlled external beta flags to `reeditpro-staging-api` in `us-central1`, revision `reeditpro-staging-api-00005-7gs`, with `100_percent_latest_revision` traffic. `RP-EXTERNAL-BETA-CONTROLLED-SMOKE-VALIDATION-1` then confirmed Cloud Run `Ready`, `ConfigurationsReady`, and `RoutesReady`; authenticated `/health`, `/ready`, and `/api/runtime/status` returned `200`; unauthenticated access returned `403`; and the runtime stayed `mock` / `mockOnly: true`. `RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-ACCESS-1` records controlled private invite access policy, read-only Cloud Run IAM evidence with service-level `allUsers=false`, service-level `allAuthenticatedUsers=false`, and service-level binding count `0`, and no access grant mutation. `RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1` records the earlier blocker before an invite principal existed. `RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-INHERITANCE-AUDIT-1` records decision `completed_readonly_project_iam_inheritance_audit_no_access_mutation`; read-only project IAM analysis found no broad inherited Cloud Run invoker access. `RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1R-AFTER-IDENTITY-LIST` then enabled `cloudidentity.googleapis.com`, created owner-managed security group `external-beta-testers@reeditpro.com`, granted only `group:external-beta-testers@reeditpro.com` `roles/run.invoker` on staging service `reeditpro-staging-api`, verified service-level IAM readback with no `allUsers` or `allAuthenticatedUsers`, and confirmed unauthenticated `/health` stayed `403` while authenticated `/health`, `/ready`, and `/api/runtime/status` returned `200`. `RP-EXTERNAL-BETA-OWNER-MEMBER-SMOKE-READBACK-1` then read the group membership, found only owner-member `aiediting@reeditpro.com`, reran owner-member authenticated `/health`, `/ready`, and `/api/runtime/status` smoke as `200`, and kept external tester member count `0`. The generated-local Remotion/private preview-export runtime gate is source-closed by `RP-EXTERNAL-BETA-REMOTION-PRIVATE-PREVIEW-EXPORT-RUNTIME-VALIDATION-1`, the provider/model policy gate is source-closed by `RP-EXTERNAL-BETA-PROVIDER-MODEL-CALL-POLICY-CLOSURE-1`, and QA/cleanup/observability/rollback review is source-closed by `RP-EXTERNAL-BETA-QA-CLEANUP-OBSERVABILITY-ROLLBACK-REVIEW-1`.

## Required Safe Gate

The next beta-enabling gate must define controlled private invite access while preserving authenticated-only staging access:

1. Add actual external beta tester accounts by Google Group membership in `external-beta-testers@reeditpro.com`.
2. Run a future tester-account smoke only after an actual tester account is added.
3. future provider/model runtime confirmation packet only if a real call is explicitly approved later

Controlled external beta is enabled on the staging API only. The correct status is `ready_for_actual_external_tester_account_addition_and_smoke` with `external beta enabled in this phase: true`. Access is routed through the owner-managed Google security group `external-beta-testers@reeditpro.com`; do not broaden IAM beyond that staging service group binding. Owner-member smoke is verified, but an independent external tester account has not yet been added.

## External Product Beta Readiness

External product beta is enabled for the controlled staging API lane. The first product-facing beta lane has accepted source evidence for:

- completed service-role grant-boundary validation carried forward on the main target;
- approved snapshot persistence validation;
- credit reservation/ledger runtime validation;
- job queue lease/event runtime validation;
- service-role storage metadata read route validation;
- approved snapshot route write runtime validation carried forward from `completed_approved_snapshot_route_write_runtime_validation`;
- private artifact manifest and access validation carried forward from `completed_private_artifact_storage_access_guarded_remote_write_readback`;
- Remotion/private preview-export runtime validation carried forward from `completed_external_beta_generated_local_remotion_private_preview_export_runtime_validation`;
- provider/model-call policy closure carried forward from `completed_external_beta_provider_model_call_policy_closure_no_runtime_calls`;
- QA/cleanup/observability/rollback review carried forward from `completed_external_beta_qa_cleanup_observability_rollback_review_no_runtime_execution`;
- no-public-artifact and no-signed-url-source-of-truth verification carried forward into release go/no-go;
- security, privacy, retention, incident support, deployment, rollback, and cost-control review carried forward as `reviewed_pending_release_go_no_go_operator_acceptance`;
- release go/no-go accepted as `approved_external_beta_release_go_no_go_source_chain_accepted`;
- controlled enablement source contract recorded as `completed_controlled_external_beta_enablement_source_contract_default_off`;
- staging flag application completed as `completed_controlled_external_beta_staging_flag_application` on `reeditpro-staging-api`, revision `reeditpro-staging-api-00005-7gs`;
- controlled authenticated health/readiness smoke completed as `completed_controlled_external_beta_authenticated_staging_smoke_validation`, with unauthenticated access blocked as `403`;
- controlled private invite/access policy completed as `completed_controlled_private_invite_access_policy_no_access_mutation`, with service-level public invoker bindings absent and no access grant mutation;
- controlled private invite IAM grant completed as `completed_controlled_private_invite_iam_grant_for_owner_managed_group`, with `external-beta-testers@reeditpro.com` as the approved owner-managed Google Group and no broad public grant;
- owner-member smoke readback completed as `completed_owner_member_group_access_smoke_readback_external_tester_membership_still_pending`, with external tester member count `0`;
- controlled private invite IAM inheritance audited as `completed_readonly_project_iam_inheritance_audit_no_broad_invoker`, with no project-level user/group/domain/`allUsers`/`allAuthenticatedUsers` Cloud Run invoker members.

The actual external beta flag application, authenticated smoke validation, private invite/access policy, owner-managed private invite IAM grant, and owner-member group-path smoke are complete for the controlled staging API lane. Paid production, public artifacts, broad media, signed URL source-of-truth, final delivery/export, and production unlock remain blocked. The next safe step is adding actual external testers through `external-beta-testers@reeditpro.com`, followed by tester-account smoke when a real tester account is added.

## No-Scope Statement

The only deployment/environment unlock in this current source chain was the controlled staging API env update recorded by `RP-EXTERNAL-BETA-STAGING-FLAG-APPLICATION-1R-AFTER-GCLOUD-REAUTH`: `reeditpro-staging-api` revision `reeditpro-staging-api-00005-7gs`, scoped to `controlled_private_preview`. The smoke validation phase performed only Cloud Run source-status readback and authenticated safe `GET` calls to `/health`, `/ready`, and `/api/runtime/status`; it did not mutate the environment. The private invite/access phase performed only docs/status/diagnostics plus read-only Cloud Run IAM policy and service-status readback; it did not mutate IAM, grant invoker, update Cloud Run, deploy, or add testers. The private invite IAM grant blocker phase performed only docs/status/diagnostics and non-executing source scans; it did not mutate IAM, grant invoker, update Cloud Run, deploy, or add testers. The private invite IAM inheritance audit phase performed only read-only project IAM policy analysis and sanitized docs/status/diagnostics; it did not mutate IAM, grant invoker, update Cloud Run, deploy, or add testers. The 1R private invite IAM grant phase enabled `cloudidentity.googleapis.com`, created owner-managed group `external-beta-testers@reeditpro.com`, and granted only that group `roles/run.invoker` on staging service `reeditpro-staging-api`; it did not grant `allUsers`, `allAuthenticatedUsers`, a domain-wide principal, production service access, worker access, provider/model access, Supabase access, GCS access, Secret Manager access, billing access, or public artifact access. The owner-member smoke readback phase performed read-only Google Group membership readback, read-only Cloud Run IAM/service URL readback, and safe authenticated/unauthenticated staging API `GET` smoke checks only; it did not add testers, mutate group membership, mutate IAM, update Cloud Run, deploy, or broaden access. No provider call, model call, worker execution, worker dispatch, persistent worker lease claim, browser capture outside Remotion renderer execution, signed URL creation, public artifact creation, persistent credit mutation, persistent credit reservation creation, credit spend, persistent job enqueue, persistent job event write, Stripe checkout/webhook/payment processing, internal beta broad unlock, external beta broad audience unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, private media processing, user media processing, Docker execution, direct FFmpeg command execution by the runner, FFprobe execution, or broad service-role handler was enabled by the owner-member smoke readback, private invite IAM grant 1R phase, the private invite/access phase, the smoke validation, the provider/model policy closure, the QA/cleanup/observability/rollback review, the release go/no-go packet, or the controlled enablement source contract. Remote Supabase mutation for the preceding sync, service-role validation, approved snapshot validation, credit ledger validation, job queue lease/event validation, private artifact storage/access, service-role route read, and approved snapshot route write packets was limited to guarded staging migration apply, guarded public grant hardening, a transaction-rolled-back generated approved snapshot fixture, a transaction-rolled-back generated credit reservation and ledger fixture, a transaction-rolled-back generated job queue, job event, and worker lease fixture, a guarded generated private storage JSON fixture created/read/deleted, a transaction-rolled-back generated private artifact metadata fixture, a generated route metadata fixture created/read/deleted, and a generated approved snapshot route fixture created/read/deleted on the single main ReeditPro project `wmyyttnynmteqgcdishd`; no data was copied from the isolated project and approved snapshot, credit ledger, job queue lease/event, storage object, artifact metadata, route fixture, and route write fixture residue readback was `0`. Remotion execution in the current source chain was limited to confirmation-gated rendering of a generated local preview fixture under `/tmp`, with output file `reeditpro-external-beta-generated-local-preview.mp4`, bytes `64855`, and SHA-256 `ea12d55c9ef1675da711769c97c9e76bb2da8547bd4c471176a0ff64b03c1c5b`; no generated media was committed. The QA/cleanup/observability/rollback review, release go/no-go packet, controlled enablement source contract, and private invite/access policy were docs/status/source-contract diagnostics only.
