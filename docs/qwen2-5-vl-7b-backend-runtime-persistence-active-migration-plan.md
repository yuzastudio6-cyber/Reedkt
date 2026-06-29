# Qwen2.5-VL 7B Backend Runtime Persistence Active Migration Plan

Decision: `qwen2_5_vl_backend_runtime_persistence_active_migration_plan_recorded_active_migration_create_required`.

This packet records the active-migration promotion plan for the validated Qwen2.5-VL backend runtime persistence draft. It is plan-only. It does not create an active migration, deploy a migration, execute SQL, touch Supabase cloud, staging, production, or live data, call Cloud Run, run Qwen inference, dispatch workers, create generated assets, create public artifacts, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Reviewed Evidence

- Local harness result review: `docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-result-review.md`
- Retry 15 local harness result: `docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-15-result.md`
- Validated draft SQL: `database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql`
- Validated local SQL tests: `database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql`
- Storage upload pipeline policy-comment baseline fix: `docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-storage-upload-pipeline-policy-comment-fix.md`
- Supabase schema planning guidance: `supabase-schema-planning-bridge.md`, `database-migration-readiness-checklist.md`, and `supabase-table-specification.md`
- SQL/RLS/storage review guidance: `sql-migration-draft-review.md`, `supabase-rls-policy-draft.md`, `supabase-storage-bucket-draft.md`, `migration-review-and-rls-hardening.md`, `rls-hardening-matrix.md`, and `data-privacy-retention-plan.md`

Retry 15 is accepted as local, throwaway, non-production evidence that the active ReEditPro baseline applies, the Qwen draft SQL applies, and the Qwen local SQL tests pass. That acceptance does not make the draft executable migration history.

## Promotion Strategy

The next implementation prompt must create an active Supabase migration by using the repository Supabase migration workflow, not by inventing an executable timestamp manually.

Future creation command shape:

```text
supabase migration new qwen2_5_vl_backend_runtime_persistence
```

The future active migration should copy and adapt the validated draft SQL from `database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql`. Draft-only warning banners must not be copied into the executable migration. The active migration must preserve the validated guards, constraints, indexes, comments, and source-of-truth boundaries, while keeping baseline table creation and seed rows out of scope.

The future active migration must continue to reuse existing ReEditPro surfaces:

- approved plan snapshots
- credit reservations and credit approval references
- jobs and job events
- worker runtime configs
- worker leases
- backend runtime messages
- job claim attempts
- idempotency records
- storage object records
- signed URL audit records
- tool runtime checks
- QA/audit/cost evidence surfaces

It must not create a parallel Qwen queue, duplicate worker runtime ownership, duplicate provider gateway ownership, duplicate storage policy ownership, or add frontend-callable secrets.

## Active Migration Creation Requirements

- Active migration creation required: true
- Active migration created now: false
- Migration deployed now: false
- SQL executed now: false
- Supabase cloud touched now: false
- Staging touched now: false
- Production touched now: false
- Live data touched now: false
- Private invoke ready now: false
- Real worker dispatch accepted now: false
- Beta ready now: false
- Production ready now: false

The future active migration creation prompt must also add text-only smoke coverage that compares the active migration plan against the validated draft scope. A later local harness validation prompt must re-run the active migration against the approved local Supabase harness before any deploy prompt is considered.

## Safety Boundaries

Workers must execute approved snapshots, not raw chat. The active migration must not introduce raw prompt execution fields, raw worker prompt payloads, provider credential fields, service-role key values, public storage references, public artifact publishing, signed URL source-of-truth behavior, direct browser invocation, or generated asset creation.

The source-of-truth path remains:

```text
approved plan snapshot
+ private storage object record
+ private artifact reference
+ checksum
+ sanitized worker/job evidence
```

Signed URLs may remain audit/delivery-adjacent evidence only; they must not become the source of truth for Qwen source or output artifacts.

## Runtime Gate Status

- `backendRuntimePersistenceActiveMigrationPlanRecorded=true`
- `backendRuntimePersistenceActiveMigrationPlanRequired=false`
- `backendRuntimePersistenceActiveMigrationCreateRequired=true`
- `qwenActiveMigrationCreated=false`
- `migrationDeployed=false`
- `readyForRealWorkerDispatch=false`
- `privateInvokeReady=false`
- `cloudRunInvocationAttempted=false`
- `inferenceRun=false`
- `workersDispatched=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58BA-BACKEND-RUNTIME-PERSISTENCE-ACTIVE-MIGRATION-CREATE: create active Qwen persistence migration from validated draft, no deploy/no cloud/no assets/no beta`
