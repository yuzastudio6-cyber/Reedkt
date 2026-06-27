# Qwen2.5-VL 7B Backend Runtime Persistence Migration Draft

Decision: `qwen2_5_vl_backend_runtime_persistence_migration_draft_recorded_local_validation_required`.

This packet records the draft-only Qwen2.5-VL backend runtime persistence migration and local SQL test plan after the schema draft review. It adds no active migration and runs no SQL. The draft extends existing ReEditPro runtime surfaces instead of creating a parallel Qwen queue.

This is draft/spec evidence only. It does not deploy migrations, execute SQL, mutate Supabase, create job rows, claim worker leases, create idempotency rows, create storage object records, create signed URL events, create QA reports, create audit events, call Cloud Run, fetch identity tokens, run inference, load Qwen, initialize vLLM, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Draft Files

- `database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql`
- `database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql`

No `supabase/migrations/*` file is created by this packet.

## Source Evidence

- `docs/qwen2-5-vl-7b-backend-runtime-persistence-schema-draft-review.md`
- `src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-schema-draft-review.ts`
- `docs/qwen2-5-vl-7b-backend-runtime-persistence-plan.md`
- `supabase/migration-order.md`
- `supabase/migrations/202605130005_job_orchestration_agent_runs.sql`
- `supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql`
- `supabase/migrations/202605200002_worker_leases_runtime_transport.sql`
- `supabase/migrations/202605210001_e2e_runtime_readiness_tables.sql`
- `database/migration-drafts/010_production_worker_runtime_orchestration.draft.sql`
- `database/test-sql/005_e2e_runtime_readiness_smoke_tests.sql`
- `database/test-sql/007_production_worker_runtime_orchestration_tests.sql`

## Draft Scope

The draft reuses and constrains these existing runtime surfaces:

| Surface | Draft action | Runtime posture |
| --- | --- | --- |
| `approved_plan_snapshots` | baseline prerequisite only | immutable source-of-truth ref required |
| `credit_reservations` | baseline prerequisite only | verified credit reservation required before dispatch |
| `jobs` | Qwen payload/ref check and Qwen indexes | no job row created |
| `job_events` | sanitized Qwen event payload check | no event row created |
| `worker_runtime_configs` | non-secret L4 config check | no runtime config row created |
| `worker_leases` | Qwen lease ref/sanitization check and active index | no lease claimed |
| `backend_runtime_messages` | private invoke summary sanitization check and target index | no runtime message created |
| `job_claim_attempts` | Qwen claim-attempt sanitization check | no claim attempt created |
| `api_idempotency_keys` | Qwen dispatch path index | no idempotency row created |
| `worker_job_claims` | existing one-active-claim index verified by tests | no claim row created |
| `storage_object_records` | existing private source-of-truth surface verified by tests | no storage row created |
| `signed_url_events` | existing audit-only surface verified by tests | no signed URL event created |
| `tool_runtime_checks` | draft expands allowed `tool_name` to include `qwen_vl` | no tool runtime check row created |

The draft intentionally does not add Qwen-specific production queue tables. The existing `database/migration-drafts/010_production_worker_runtime_orchestration.draft.sql` remains a reference for generic worker concepts only.

## Required Qwen Constraints

The draft records these constraints for future local validation:

- Qwen jobs must use `job_type='media_analysis'`.
- Qwen jobs must include `worker_type='qwen2_5_vl_cloud_run_gpu_worker'`.
- Qwen jobs must include an approved plan snapshot ref/hash, credit reservation, idempotency key, private storage object record, private checksum, structured finding IDs, and edit intent IDs.
- Qwen jobs must reference model id `Qwen/Qwen2.5-VL-7B-Instruct`, revision `cc594898137f460bfe9f0759e9844b3ce807cfb5`, GPU `nvidia_l4`, and serving profile `bounded_preview_scale_to_zero`.
- Qwen runtime config rows must remain non-secret and L4/scale-to-zero scoped.
- Qwen leases and claim attempts must include job/workspace/project refs and sanitized metadata.
- Qwen runtime messages must store sanitized private invoke summaries only.
- Qwen job events must be append-only sanitized summaries.
- Qwen tool runtime checks use `qwen_vl` metadata only; they do not execute model inference.

## Rejected Payload Markers

The draft rejects raw chat, raw prompt fields, raw worker prompt fields, raw model output text, signed URL source-of-truth fields, public URL source-of-truth fields, service URL values, identity token values, access token values, auth header values, bearer values, provider key values, service-role key values, secret values, database URL values, generated fixture pass claims, beta readiness claims, and production readiness claims.

## Draft Test Coverage

The draft test file validates:

- required runtime baseline tables;
- `media_analysis` job type availability;
- Qwen job, event, runtime config, lease, runtime message, and claim-attempt constraints;
- `tool_runtime_checks` support for `qwen_vl`;
- Qwen-specific indexes;
- existing one-active claim and lease indexes;
- no signed URL source-of-truth columns on storage records;
- no raw prompt columns on runtime payload surfaces;
- commented negative examples for missing Qwen refs and raw prompt transport payloads.

## Runtime Gates

- `backendRuntimePersistenceMigrationDraftRecorded=true`
- `backendRuntimePersistenceSchemaDraftReviewRecorded=true`
- `backendRuntimePersistenceMigrationDraftRequired=false`
- `backendRuntimePersistenceLocalValidationRequired=true`
- `activeMigrationCreated=false`
- `draftSqlCreated=true`
- `localSqlTestsCreated=true`
- `sqlExecuted=false`
- `supabaseTouched=false`
- `realJobCreated=false`
- `realLeaseClaimed=false`
- `idempotencyRowCreated=false`
- `workerClaimCreated=false`
- `jobEventCreated=false`
- `backendRuntimeMessageCreated=false`
- `storageObjectRecordCreated=false`
- `signedUrlEventCreated=false`
- `qaReportCreated=false`
- `auditEventCreated=false`
- `readyForRealWorkerDispatch=false`
- `cloudRunInvocationAttempted=false`
- `serviceRuntimeRequestSent=false`
- `identityTokenFetched=false`
- `inferenceRun=false`
- `workersDispatched=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `betaReady=false`
- `productionReady=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## What This Proves

- Qwen has a concrete draft migration/test packet for persistence constraints.
- The draft encodes approved snapshot, credit, idempotency, private storage, lease, claim, runtime message, event, tool check, and sanitization requirements.
- The next step can be local validation against an approved local database harness.

## What This Does Not Prove

- no active migration exists;
- no SQL was executed;
- no Supabase environment was touched;
- no row, storage object, signed URL, worker dispatch, Cloud Run invocation, inference, generated asset, public artifact, credit mutation, beta path, or production path was created or approved;
- `dry_run_passed` is not claimed;
- `generated_local_fixture_passed` is not claimed.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58P-BACKEND-RUNTIME-PERSISTENCE-LOCAL-VALIDATION: validate Qwen persistence draft against an approved local database, no deploy/no cloud/no assets/no beta`
