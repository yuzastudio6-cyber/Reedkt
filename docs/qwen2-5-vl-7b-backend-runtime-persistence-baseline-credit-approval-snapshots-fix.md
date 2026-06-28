# Qwen2.5-VL 7B Backend Runtime Persistence Baseline Credit Approval Snapshots Fix

Decision: `qwen2_5_vl_backend_runtime_persistence_baseline_credit_approval_snapshots_fix_recorded`.

This packet records the narrow ReEditPro active-baseline migration fix required after Qwen local harness validation retry 5. The retry proved `202605180003_reeditpro_intent_plan_versions.sql` now applies past the prior `edit_plan_segments.edit_plan_version_id` prerequisite failure, then stopped before Qwen draft SQL because active migration `202605180004_reeditpro_credits_approval_snapshots.sql` referenced `credit_reservations.approved_plan_snapshot_id` before that compatibility column existed on the older active baseline table.

The fix makes `202605180004_reeditpro_credits_approval_snapshots.sql` compatible with older credit and approval baseline tables created before the approved snapshot reference columns existed. It adds nullable idempotent compatibility columns before the migration adds approved snapshot foreign key constraints. It does not backfill, because this migration must not invent `approved_plan_snapshots` rows, approval records, credit reservations, credit ledger entries, or credit movements. It does not recreate baseline tables, create a new migration, deploy a migration, touch Supabase cloud, start Supabase, start Docker, execute SQL, apply the Qwen draft SQL, run Qwen local SQL tests, call Cloud Run, run Qwen inference, initialize vLLM, dispatch workers, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Context

- Source branch input: `codex/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-5`
- Failed baseline migration: `supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql`
- Failed statement category: `credit_reservations_approved_plan_snapshot_id_fkey`
- Sanitized failure: `column "approved_plan_snapshot_id" referenced in foreign key constraint does not exist (SQLSTATE 42703)`
- Edit-plan-segments version baseline fix verified: true
- Qwen draft SQL reached before fix: false
- Qwen local SQL tests reached before fix: false

## SQL Repair

The migration now prepares existing active-baseline credit and approval tables before the later approved snapshot foreign key guards run:

- `public.credit_reservations.approved_plan_snapshot_id`
- `public.credit_ledger_entries.approved_plan_snapshot_id`
- `public.approval_records.approved_snapshot_id`

Backfill policy:

- `no_backfill_because_migration_must_not_invent_approved_plan_snapshot_or_credit_records`

This preserves the existing ReEditPro credit baseline and gives the later RP-DATA-04 approved snapshot constraints stable nullable reference columns without pretending older rows already have immutable approved snapshot mappings.

## Runtime Gates

- `baselineCreditApprovalSnapshotsFixRecorded=true`
- `activeBaselineMigrationEdited=true`
- `creditReservationsApprovedPlanSnapshotColumnGuarded=true`
- `creditLedgerEntriesApprovedPlanSnapshotColumnGuarded=true`
- `approvalRecordsApprovedSnapshotColumnGuarded=true`
- `approvedSnapshotReferenceBackfillSkipped=true`
- `creditApprovalSnapshotForeignKeysUnblocked=true`
- `newActiveMigrationCreated=false`
- `qwenActiveMigrationCreated=false`
- `supabaseCliExecuted=false`
- `dockerStarted=false`
- `sqlExecuted=false`
- `migrationDeployed=false`
- `qwenDraftSqlApplied=false`
- `qwenLocalSqlTestsExecuted=false`
- `supabaseCloudTouched=false`
- `stagingTouched=false`
- `productionTouched=false`
- `cloudRunInvocationAttempted=false`
- `identityTokenFetched=false`
- `inferenceRun=false`
- `workersDispatched=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `mediaProcessingRun=false`
- `renderExportRun=false`
- `creditMutationCreated=false`
- `betaReady=false`
- `productionReady=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## What This Proves

- The known active baseline `credit_reservations.approved_plan_snapshot_id` prerequisite failure has a narrow source fix.
- The fix also guards the sibling approved snapshot reference columns on `credit_ledger_entries` and `approval_records` before their foreign key constraints run.
- The fix does not duplicate credit tables, approval tables, or approved snapshot tables.
- The fix does not create approved snapshots, credit rows, approval records, worker jobs, Qwen runtime tables, or generated assets.
- The next safe step is another local harness validation retry, not beta or production.

## What This Does Not Prove

- The full active ReEditPro baseline has not been reloaded after this fix in this packet.
- The Qwen draft SQL has not applied after this fix in this packet.
- The Qwen local SQL tests have not run after this fix in this packet.
- Real worker dispatch remains blocked.
- `dry_run_passed` is not claimed.
- `generated_local_fixture_passed` is not claimed.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58AF-BACKEND-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-6: retry Qwen local harness validation after credit approval snapshots baseline fix, no deploy/no cloud/no assets/no beta`
