# Qwen2.5-VL 7B Backend Runtime Persistence Plan

Decision: `qwen2_5_vl_backend_runtime_persistence_plan_recorded_schema_draft_required`.

This packet records the backend runtime persistence plan after the controlled backend dispatch dry-run review. It maps Qwen2.5-VL worker dispatch to existing ReeditPro persistence surfaces for approved snapshots, jobs, job events, worker runtime configs, worker leases, runtime messages, claim attempts, idempotency, storage source-of-truth records, signed URL audit events, credit reservations, QA, and audit evidence.

This is a plan only. It does not create migrations, execute SQL, mutate Supabase, create job rows, claim leases, create idempotency rows, call Cloud Run, resolve service URLs, fetch identity tokens, run inference, import or load Qwen, initialize vLLM, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Evidence

- `docs/qwen2-5-vl-7b-controlled-backend-dispatch-dry-run.md`
- `src/backend/workers/qwen2-5-vl-backend-runtime-dispatch-coordinator.ts`
- `src/backend/mock/mock-qwen2-5-vl-controlled-backend-dispatch-dry-run-result.ts`
- `docs/qwen2-5-vl-7b-approved-worker-integration-readiness-review.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-local-queue-contract.md`
- `edit-planning-database-architecture.md`
- `approved-plan-snapshot-policy.md`
- `editing-agent-execution-architecture.md`
- `async-edit-work-graph.md`
- `editing-asset-manifest.md`
- `supabase-schema-planning-bridge.md`
- `database-migration-readiness-checklist.md`
- `supabase-table-specification.md`
- `supabase/migration-order.md`
- `supabase/migrations/202605130005_job_orchestration_agent_runs.sql`
- `supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql`
- `supabase/migrations/202605200002_worker_leases_runtime_transport.sql`
- `supabase/migrations/202605210001_e2e_runtime_readiness_tables.sql`
- `database/test-sql/005_e2e_runtime_readiness_smoke_tests.sql`
- `database/test-sql/007_production_worker_runtime_orchestration_tests.sql`

## Persistence Strategy

Qwen must not create a parallel queue schema. It should reuse the existing runtime foundations:

| Surface | Current source | Qwen use | Status |
| --- | --- | --- | --- |
| `approved_plan_snapshots` | active migration and RP-E2E extension | Immutable worker execution contract, hash/version/source-of-truth reference. | reuse required |
| `credit_reservations` | active credit migration | Approved credit reservation gate before any expensive runtime action. | reuse required |
| `jobs` | active job orchestration migration | Future Qwen worker job row with `workerType=qwen2_5_vl_cloud_run_gpu_worker`. | reuse required |
| `job_events` | active job orchestration migration | Append-only sanitized job lifecycle and progress evidence. | reuse required |
| `worker_runtime_configs` | active job orchestration migration | Backend-only Qwen Cloud Run GPU runtime config reference. | reuse required |
| `worker_leases` | RP-FIX-11 local-only migration | Transactional lease ownership and stale recovery. | reuse required |
| `backend_runtime_messages` | RP-FIX-11 local-only migration | Private invoke envelope/response summary without secrets or signed URLs. | reuse required |
| `job_claim_attempts` | RP-FIX-11 local-only migration | Claim attempt audit and refusal reasons. | reuse required |
| `api_idempotency_keys` | RP-E2E runtime foundation | Backend API idempotency for dispatch route retries. | reuse required |
| `worker_job_claims` | RP-E2E runtime foundation | One active worker claim per job. | reuse required |
| `storage_object_records` | RP-E2E runtime foundation | Canonical private source-of-truth paths and checksums. | reuse required |
| `signed_url_events` | RP-E2E runtime foundation | Audit-only signed URL metadata; signed URLs are never source of truth. | audit only |
| `tool_runtime_checks` | RP-E2E runtime foundation | Qwen tool/runtime readiness checks before dispatch. | reuse required |
| `qa_reports` and `audit_events` | MVP schema and active docs | Metadata-only QA/audit evidence before runtime advancement. | reuse required |

## Required Persistence Invariants

- Workers execute `approved_plan_snapshots`, not raw chat and not raw prompt payloads.
- Qwen job rows must include `workspace_id`, `project_id`, `approved_plan_snapshot_id`, `credit_reservation_id`, `idempotency_key`, `worker_type`, `job_type`, and a structured payload reference.
- Qwen payloads must reference structured findings, edit intents, private media/source refs, model policy, runtime gates, and source-of-truth refs.
- Runtime gates must remain false until a later approved execution prompt explicitly opens them.
- Signed URLs and public URLs are not source of truth.
- Service URLs, identity tokens, bearer headers, provider credentials, service-role keys, and raw model output text must not be persisted.
- Worker lease claims must be transactional, one-active-claim-per-job, stale-recoverable, and backend/service-role only.
- Idempotency must be scoped and conflict-safe before any dispatch attempt.
- Credit reservation verification must happen before dispatch; failure paths must release/refund only in a later Billing-approved backend path.
- Job events and runtime messages must store sanitized summaries only.
- Storage records must store private bucket/path/checksum/manifest references, not public delivery URLs.
- Qwen remains visual understanding and visual QA metadata only; it must not generate video, render/export, process media, or replace Wan/LTX/Mochi/Hunyuan generated B-roll routes.

## Future Transaction Order

Future implementation should preserve this order:

```text
load approved plan snapshot and verify immutable version/hash
-> verify credit reservation and estimate references
-> verify private source-of-truth storage records and checksums
-> check API idempotency key
-> create or reuse queued job row transactionally
-> create job claim attempt
-> claim one active worker lease
-> record sanitized job event
-> build private invoke envelope
-> write backend runtime message preview/attempt summary
-> call Qwen private runtime only in a later approved execution prompt
-> record sanitized response/failure event
-> release/complete/fail lease through backend transaction
-> update job status and cleanup records
```

This prompt does not execute that order. It records the required order for a future schema/draft and backend implementation review.

## Qwen-Specific Persistence Fields

The future schema/draft review must confirm how the existing tables represent:

- `worker_type=qwen2_5_vl_cloud_run_gpu_worker`
- `job_type=media_analysis`
- Qwen task use cases: `visual_understanding`, `broll_candidate_review`, `caption_visual_consistency_qa`, and `frame_asset_qa`
- approved snapshot hash/version
- model id `Qwen/Qwen2.5-VL-7B-Instruct`
- model revision `cc594898137f460bfe9f0759e9844b3ce807cfb5`
- aggregate checksum reference
- selected GPU `nvidia_l4`
- serving profile `bounded_preview_scale_to_zero`
- private source-of-truth refs
- structured finding ids
- edit intent ids
- media asset refs
- sanitized metadata summary hash
- no raw model output text

## Blocked Bypasses

The persistence path must reject:

- raw chat as worker input
- raw prompt payload fields
- signed URL source-of-truth fields
- public URL source-of-truth fields
- frontend/browser invocation
- direct Cloud Run service URL exposure
- token or bearer header persistence
- provider secret or service-role key persistence
- duplicate active claims
- missing credit reservation
- missing approved snapshot
- missing private storage/checksum/manifests
- generated asset row creation before QA/storage policy acceptance
- beta or production readiness claims

## Runtime Gates

- `backendRuntimePersistencePlanRecorded=true`
- `backendRuntimePersistenceSchemaDraftRequired=true`
- `backendRuntimePersistencePlanRequired=false`
- `readyForRealWorkerDispatch=false`
- `realJobCreated=false`
- `realLeaseClaimed=false`
- `idempotencyRowCreated=false`
- `jobEventCreated=false`
- `backendRuntimeMessageCreated=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
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

- Qwen persistence can reuse existing ReeditPro runtime and Supabase source-of-truth concepts.
- The controlled dry-run has enough outcome evidence to plan durable queue, lease, idempotency, event, source-of-truth, credit, observability, and cleanup records.
- The next step can be a schema/draft review without enabling runtime execution.

## What This Does Not Prove

- no real Qwen job row exists;
- no real worker lease has been claimed;
- no idempotency, job event, runtime message, storage, QA, audit, or credit row was created by this prompt;
- no Cloud Run invocation, model load, vLLM startup, inference, generated asset, public artifact, signed URL, render/export, beta, or production path is approved;
- `generated_local_fixture_passed` is not claimed.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58N-BACKEND-RUNTIME-PERSISTENCE-SCHEMA-DRAFT: draft Qwen queue lease idempotency persistence schema review, no deploy/no cloud/no assets/no beta`
