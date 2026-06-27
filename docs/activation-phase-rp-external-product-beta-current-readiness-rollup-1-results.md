# Activation Phase: RP-EXTERNAL-PRODUCT-BETA-CURRENT-READINESS-ROLLUP-1 Results

Decision: `completed_controlled_external_beta_staging_flag_application`

Execution: `completed_docs_only_current_beta_readiness_rollup_no_runtime_execution`

Current integration head: `1a934253ec5cfab26a0ad75e29b978984b0639a5`

Internal beta status: `blocked_pending_service_role_runtime_private_artifact_render_provider_security_gates`

External product beta readiness: `controlled_external_beta_enabled_on_staging_api`

External beta enabled in this phase: `true`

Paid production status: `blocked`

Final delivery/export status: `blocked`

Product-ready end-to-end local OSS tools: `0`

Package-lock: `unchanged`

Generated artifacts committed: `none`

## Result

The Supabase target credential/target-validation lane has moved past the missing-token blocker. Non-secret Secret Manager metadata shows `SUPABASE_ACCESS_TOKEN` version `5` is enabled, and source evidence records `completed_guarded_supabase_target_rls_storage_readonly_validation`.

`RP-EXTERNAL-BETA-REEDITPRO-SUPABASE-MAIN-TARGET-MIGRATION-SYNC-1` source-mapped remote-only migration `20260626163138`, applied the 18 pending repo migrations to the main Reeditpro staging target, applied lint-fix migration `20260626224600`, and recorded final `supabase db push --dry-run` as `Remote database is up to date.` Supabase lint records `No schema errors found`.

`RP-EXTERNAL-BETA-MAIN-SUPABASE-SERVICE-ROLE-RUNTIME-VALIDATION-1` records decision `completed_main_supabase_service_role_runtime_grant_boundary_validation`, applied guarded grant hardening migration `20260626233000_external_beta_public_grant_hardening.sql`, and validated unsafe public mutation grants as `0` and unsafe public sequence grants as `0`.

`RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-PERSISTENCE-GUARDED-REMOTE-WRITE-1` records decision `completed_approved_snapshot_persistence_guarded_remote_write_readback`, validated a generated approved snapshot dependency-chain insert/readback under `set local role service_role`, proved immutable snapshot update rejection, rolled the transaction back, and validated residue counts as `0`.

`RP-EXTERNAL-BETA-CREDIT-RESERVATION-LEDGER-GUARDED-REMOTE-WRITE-1` records decision `completed_credit_reservation_ledger_guarded_remote_write_readback`, validated a generated credit wallet/grant/approval/reservation/ledger dependency-chain insert/readback under `set local role service_role`, proved credit ledger append-only update rejection, rolled the transaction back, and validated residue counts as `0`.

`RP-EXTERNAL-BETA-JOB-QUEUE-LEASE-EVENT-GUARDED-REMOTE-WRITE-1` records decision `completed_job_queue_lease_event_guarded_remote_write_readback`, validated generated approved snapshot, credit reservation, job batch, job, job event, worker lease, job claim attempt, and audit-event insert/readback under `set local role service_role`, rolled the transaction back, and validated residue counts as `0`.

`RP-EXTERNAL-BETA-PRIVATE-ARTIFACT-STORAGE-ACCESS-GUARDED-REMOTE-WRITE-1` records decision `completed_private_artifact_storage_access_guarded_remote_write_readback`, validated private bucket policy readback, created/read/deleted a generated private storage JSON fixture, verified storage object residue count: `0`, inserted/read back generated artifact metadata rows under `set local role service_role`, rolled the transaction back, and validated artifact metadata rollback residue count `0`. signed URL creation: `false`; public artifact creation: `false`.

`RP-EXTERNAL-BETA-SERVICE-ROLE-ROUTE-RUNTIME-VALIDATION-1` records decision `completed_service_role_storage_object_metadata_read_route_runtime_validation`, inserted a generated route metadata fixture, read it through `GET /v1/storage-objects/:storageObjectRecordId`, deleted the fixture, and validated route fixture cleanup residue count: `0`. canonicalOnly: `true`; signed URL creation: `false`; public artifact creation: `false`.

`RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-ROUTE-WRITE-RUNTIME-VALIDATION-1` records decision `completed_approved_snapshot_route_write_runtime_validation`, generated a bounded approved-plan dependency fixture, wrote an approved snapshot through `POST /v1/edit-plans/:editPlanId/approved-snapshots`, verified idempotency and approved snapshot readback, deleted the fixture, and validated route write fixture cleanup residue count: `0`.

`RP-EXTERNAL-BETA-REMOTION-PRIVATE-PREVIEW-EXPORT-RUNTIME-VALIDATION-1` records decision `completed_external_beta_generated_local_remotion_private_preview_export_runtime_validation`, rendered only a generated local Remotion fixture under `/tmp`, and recorded sanitized evidence: run ID `2026-06-27T02-41-01-252Z-7ce79dc6`, output file `reeditpro-external-beta-generated-local-preview.mp4`, output bytes `64855`, and SHA-256 `ea12d55c9ef1675da711769c97c9e76bb2da8547bd4c471176a0ff64b03c1c5b`.

`RP-EXTERNAL-BETA-PROVIDER-MODEL-CALL-POLICY-CLOSURE-1` records decision `completed_external_beta_provider_model_call_policy_closure_no_runtime_calls` and execution `completed_docs_only_provider_model_policy_closure_no_provider_or_model_execution`. It closes the provider/model policy ambiguity without enabling real calls: provider/model runtime is `disabled_by_default`, provider/model calls executed are `none`, frontend provider calls are `forbidden`, backend-only provider adapters are `required`, and approved snapshot, credit reservation, idempotency, cost cap, model-routing, QA fallback, private artifact, and server-side secret isolation gates remain required.

`RP-EXTERNAL-BETA-QA-CLEANUP-OBSERVABILITY-ROLLBACK-REVIEW-1` records decision `completed_external_beta_qa_cleanup_observability_rollback_review_no_runtime_execution` and execution `completed_docs_only_qa_cleanup_observability_rollback_review_no_runtime_execution`. QA review is `source_evidence_review_passed_ready_for_release_go_no_go`; cleanup review is `ephemeral_fixture_cleanup_evidence_passed_ready_for_release_go_no_go`; observability review is `audit_manifest_checksum_status_evidence_passed_ready_for_release_go_no_go`; rollback review is `transaction_rollback_and_fixture_residue_evidence_passed_ready_for_release_go_no_go`; security/privacy/support/cost/deployment review is `reviewed_pending_release_go_no_go_operator_acceptance`.

`RP-EXTERNAL-BETA-RELEASE-GO-NO-GO-1` records decision `approved_external_beta_release_go_no_go_source_chain_accepted` and execution `completed_docs_only_release_go_no_go_no_runtime_unlock`. The release go/no-go packet accepts the reviewed source chain for controlled external beta enablement planning. It does not itself toggle, deploy, run workers/routes/providers, mutate Supabase, run SQL, create signed/public artifacts, process media, or unlock production.

`RP-EXTERNAL-BETA-CONTROLLED-ENABLEMENT-1` records decision `completed_controlled_external_beta_enablement_source_contract_default_off` and execution `completed_source_contract_no_environment_mutation_or_deployment`. It adds the exact source contract for future staging flag application but does not apply the flag to any environment.

`RP-EXTERNAL-BETA-STAGING-FLAG-APPLICATION-1` records decision `blocked_gcloud_reauthentication_required_before_staging_flag_application` and execution `completed_local_gcloud_auth_probe_no_environment_mutation`. The local Google Cloud auth preflight read active account `aiediting@reeditpro.com` and project `reeditpro`, then failed token refresh with reauthentication required before Cloud Run service discovery or environment mutation could complete. No Cloud Run service was updated, no deployment was created, and external beta remains disabled.

`RP-EXTERNAL-BETA-STAGING-FLAG-APPLICATION-1R-AFTER-GCLOUD-REAUTH` records decision `completed_controlled_external_beta_staging_flag_application` and execution `completed_gcloud_run_staging_api_env_flag_update`. The staging API service `reeditpro-staging-api` in `us-central1` was updated to revision `reeditpro-staging-api-00005-7gs` and read back with `REEDITPRO_EXTERNAL_BETA_READY=true`, `REEDITPRO_EXTERNAL_BETA_TARGET_REF=wmyyttnynmteqgcdishd`, `REEDITPRO_EXTERNAL_BETA_SCOPE=controlled_private_preview`, and `REEDITPRO_EXTERNAL_BETA_ROLLBACK_MODE=disable_REEDITPRO_EXTERNAL_BETA_READY`.

Paid production, public artifacts, broad media, signed URL source-of-truth, final delivery/export, production unlock, and unapproved provider/model calls remain blocked.

Next safe action: `RP-EXTERNAL-BETA-CONTROLLED-SMOKE-VALIDATION-1`.

## Safety

No provider call, model call, worker execution, worker dispatch, persistent worker lease claim, browser capture outside Remotion renderer execution, signed URL creation, public artifact creation, persistent credit mutation, persistent credit reservation creation, credit spend, persistent job enqueue, persistent job event write, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, private media processing, user media processing, Docker execution, direct FFmpeg command execution by the runner, FFprobe execution, or broad service-role handler was enabled by this rollup or the QA/cleanup/observability/rollback review. Remote Supabase mutation for the preceding sync, service-role validation, approved snapshot validation, credit ledger validation, job queue lease/event validation, private artifact storage/access, service-role route read, and approved snapshot route write packets was limited to guarded staging migration apply, guarded public grant hardening, a transaction-rolled-back generated approved snapshot fixture, a transaction-rolled-back generated credit reservation and ledger fixture, a transaction-rolled-back generated job queue, job event, and worker lease fixture, a guarded generated private storage JSON fixture created/read/deleted, a transaction-rolled-back generated private artifact metadata fixture, a generated route metadata fixture created/read/deleted, and a generated approved snapshot route fixture created/read/deleted on the single main ReeditPro project `wmyyttnynmteqgcdishd`; no data was copied from the isolated project and approved snapshot, credit ledger, job queue lease/event, storage object, artifact metadata, route fixture, and route write fixture residue readback was `0`. Remotion execution in the current source chain was limited to confirmation-gated rendering of a generated local preview fixture under `/tmp`; no generated media was committed.
