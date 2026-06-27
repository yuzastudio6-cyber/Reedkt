# Qwen2.5-VL 7B Backend Runtime Persistence Schema Draft Review

Decision: `qwen2_5_vl_backend_runtime_persistence_schema_draft_review_recorded_migration_draft_required`.

This packet records the Qwen2.5-VL backend runtime persistence schema review after the persistence plan. It confirms that Qwen should reuse the existing ReeditPro approved snapshot, credit reservation, job, job event, worker runtime config, worker lease, backend runtime message, claim attempt, idempotency, storage object record, signed URL audit, tool runtime check, QA, and audit surfaces. It also defines the exact Qwen-specific constraints that a future draft migration and local SQL test pack must prove.

This is review/spec evidence only. It does not create an active migration, create draft SQL, execute SQL, mutate Supabase, create job rows, claim leases, create idempotency rows, create worker claim rows, create storage object records, create signed URL events, create QA reports, create audit events, call Cloud Run, resolve a service URL, fetch an identity token, run inference, load Qwen, initialize vLLM, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Evidence

- `docs/qwen2-5-vl-7b-backend-runtime-persistence-plan.md`
- `src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-plan.ts`
- `docs/qwen2-5-vl-7b-controlled-backend-dispatch-dry-run.md`
- `src/backend/workers/qwen2-5-vl-backend-runtime-dispatch-coordinator.ts`
- `supabase/migration-order.md`
- `supabase/migrations/202605130005_job_orchestration_agent_runs.sql`
- `supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql`
- `supabase/migrations/202605200002_worker_leases_runtime_transport.sql`
- `supabase/migrations/202605210001_e2e_runtime_readiness_tables.sql`
- `database/migration-drafts/010_production_worker_runtime_orchestration.draft.sql`
- `database/test-sql/005_e2e_runtime_readiness_smoke_tests.sql`
- `database/test-sql/007_production_worker_runtime_orchestration_tests.sql`

## Schema Review Decision

Qwen should not create a parallel runtime queue. The schema review accepts the existing runtime families as the source of truth and requires a future draft migration/test packet only for Qwen-specific constraints, comments, status guards, JSON payload restrictions, indexes, and local validation assertions.

The future draft must preserve the existing ReEditPro path:

```text
approved plan snapshot
+ credit reservation
+ private storage object record
+ idempotency key
+ queued job row
+ worker claim and lease
+ sanitized job event
+ backend runtime message summary
+ private Qwen invoke attempt only in a later approved execution prompt
```

Workers must execute approved snapshots and structured payload references, not raw chat and not raw prompt payloads. Signed URLs and public URLs remain audit or delivery artifacts only; they are never the source of truth.

## Surface Classification

| Surface | Existing source | Qwen classification | Future draft requirement |
| --- | --- | --- | --- |
| `approved_plan_snapshots` | active approval/credits and E2E runtime migrations | reuse required | Confirm immutable hash/version/source refs and Qwen snapshot payload refs. |
| `credit_reservations` | active approval/credits migration | reuse required | Require verified reservation before any Qwen job creation or dispatch. |
| `jobs` | active job orchestration migration | reuse required | Constrain Qwen worker/job type and structured payload summary. |
| `job_events` | active job orchestration migration | reuse required | Require append-only sanitized lifecycle events with no tokens, URLs, raw output, or raw prompts. |
| `worker_runtime_configs` | active job orchestration migration | reuse required | Backend-only config refs; no service URL, API key, service-role key, identity token, or bearer header storage. |
| `worker_leases` | active worker lease runtime transport migration | reuse required | One active lease per job, stale recovery, service-role writes only. |
| `backend_runtime_messages` | active worker lease runtime transport migration | reuse required | Store sanitized envelope/response summaries only. |
| `job_claim_attempts` | active worker lease runtime transport migration | reuse required | Record claim attempts and refusal reasons without raw prompts or secrets. |
| `api_idempotency_keys` | active E2E runtime readiness migration | reuse required | Scope Qwen dispatch idempotency by workspace, approved snapshot, job type, and request hash. |
| `worker_job_claims` | active E2E runtime readiness migration | reuse required | Keep one active claim per job and reject duplicate active claims. |
| `storage_object_records` | active E2E runtime readiness migration | reuse required | Canonical private path/checksum/manifest refs; no public URL fields. |
| `signed_url_events` | active E2E runtime readiness migration | audit only | Audit signed URL creation if a later policy allows it; never source of truth. |
| `tool_runtime_checks` | active E2E runtime readiness migration | reuse required | Record Qwen runtime readiness checks before dispatch. |
| `qa_reports` | render/QA schema surface and planning docs | reuse required | Store future visual QA metadata only after approved backend path. |
| `audit_events` | planning bridge and event log surfaces | reuse required | Record policy and dispatch audit summaries, no credential values. |
| `production_worker_jobs` draft family | draft-only production worker orchestration | reference only | Do not duplicate into a Qwen-specific live queue. Reconcile ideas into existing runtime surfaces first. |

## Qwen-Specific Constraints For Future Draft

The future migration draft and SQL tests must prove these constraints:

- `worker_type` is `qwen2_5_vl_cloud_run_gpu_worker`.
- `job_type` is `media_analysis`.
- allowed Qwen use cases are `visual_understanding`, `broll_candidate_review`, `caption_visual_consistency_qa`, and `frame_asset_qa`.
- the approved snapshot reference, plan hash, credit reservation reference, private storage refs, checksum refs, and structured finding/edit-intent refs are present before job dispatch.
- model metadata references `Qwen/Qwen2.5-VL-7B-Instruct`, revision `cc594898137f460bfe9f0759e9844b3ce807cfb5`, selected GPU `nvidia_l4`, and serving profile `bounded_preview_scale_to_zero`.
- job payload summaries reject raw chat, raw prompt fields, raw model output text, public URLs, signed URL source-of-truth fields, service URLs, bearer headers, identity tokens, provider secrets, service-role keys, database URLs, generated asset claims, beta claims, and production claims.
- worker leases and worker claims reject duplicate active claims.
- idempotency conflicts are deterministic and scoped.
- job events and runtime messages persist sanitized summaries only.
- storage object records require private scope, object path, checksum, manifest reference, and approved snapshot linkage.
- failure and cleanup states preserve credit release/refund handoff without mutating credits in this review.

## Draft Test Expectations

Future local SQL tests must be local/non-production only and should assert:

- all required reuse surfaces exist;
- Qwen status/type constraints are present where implemented;
- unsafe JSON keys or payload markers are rejected;
- no signed URL or public URL column is treated as source of truth;
- one-active-claim and one-active-lease constraints are present;
- idempotency duplicate handling is deterministic;
- RLS stays enabled on public runtime surfaces;
- service-role/backend-only writes remain separated from frontend/browser reads;
- no seed rows are required for Qwen execution;
- no generated asset row, public artifact, signed URL, or credit mutation is created by tests.

## Runtime Gates

- `backendRuntimePersistencePlanRecorded=true`
- `backendRuntimePersistenceSchemaDraftReviewRecorded=true`
- `backendRuntimePersistenceSchemaDraftRequired=false`
- `backendRuntimePersistenceMigrationDraftRequired=true`
- `backendRuntimePersistencePlanRequired=false`
- `draftSqlCreated=false`
- `activeMigrationCreated=false`
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

- Qwen has a reviewed persistence model that reuses existing ReEditPro runtime tables.
- The schema review has enough specificity for a future draft migration and local test packet.
- The next step can draft Qwen runtime persistence constraints without enabling runtime execution.

## What This Does Not Prove

- no active migration exists for Qwen persistence constraints;
- no SQL has run;
- no Supabase environment was touched;
- no Qwen job, lease, claim, idempotency, storage, signed URL, QA, audit, or credit row was created;
- no Cloud Run invocation, model load, vLLM initialization, inference, generated asset, public artifact, signed URL, media processing, render/export, beta, or production path is approved;
- `dry_run_passed` is not claimed;
- `generated_local_fixture_passed` is not claimed.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58O-BACKEND-RUNTIME-PERSISTENCE-MIGRATION-DRAFT: draft Qwen runtime persistence constraints and local SQL tests, no deploy/no cloud/no assets/no beta`
