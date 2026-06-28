import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_QA_REPORTS_APPROVED_SNAPSHOT_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-qa-reports-approved-snapshot-fix'

const ROOT = process.cwd()
const DECISION =
  'completed_qwen_runtime_persistence_baseline_split_import_qa_reports_approved_snapshot_guard'

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function exists(relativePath: string) {
  return fs.existsSync(path.join(ROOT, relativePath))
}

function assertFalseFlags(flags: Record<string, boolean>) {
  for (const key of [
    'newActiveMigrationCreated',
    'qwenActiveMigrationCreated',
    'supabaseCliExecuted',
    'sqlExecuted',
    'migrationDeployed',
    'remoteSupabaseTouched',
    'stagingTouched',
    'productionTouched',
    'qwenDraftSqlApplied',
    'qwenLocalSqlTestsExecuted',
    'localHarnessStarted',
    'localHarnessValidationAttemptedAfterFix',
    'localHarnessValidationPassedAfterFix',
    'readyForRealWorkerDispatch',
    'privateInvokeReady',
    'realJobCreated',
    'realLeaseClaimed',
    'idempotencyRowCreated',
    'jobEventCreated',
    'backendRuntimeMessageCreated',
    'workerClaimCreated',
    'storageObjectRecordCreated',
    'signedUrlEventCreated',
    'qaReportCreated',
    'auditEventCreated',
    'cloudRunInvocationAttempted',
    'serviceRuntimeRequestSent',
    'identityTokenFetched',
    'authHeaderCreated',
    'modelImportRun',
    'modelLoadRun',
    'vllmEngineInitialized',
    'promptProcessed',
    'forwardPassRun',
    'inferenceRun',
    'providerCallsMade',
    'workersDispatched',
    'generatedAssetsCreated',
    'publicArtifactsCreated',
    'signedUrlsCreated',
    'mediaProcessingRun',
    'renderExportRun',
    'creditMutationCreated',
    'betaReady',
    'productionReady',
    'dryRunPassedClaimed',
    'generatedLocalFixturePassedClaimed',
  ]) {
    assert.equal(flags[key], false, `${key} must remain false`)
  }
}

for (const file of [
  'supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-qa-reports-approved-snapshot-fix.ts',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-runtime-persistence-baseline-split-import-1.md',
]) {
  assert.equal(exists(file), true, `Missing required file: ${file}`)
}

const sql = read('supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql')

for (const phrase of [
  'alter table public.qa_reports',
  'add column if not exists approved_plan_snapshot_id uuid references public.approved_plan_snapshots(id) on delete set null',
  'comment on column public.qa_reports.approved_plan_snapshot_id',
  'no backfill is invented here',
  "conrelid = 'public.qa_reports'::regclass",
  "conname = 'qa_reports_approved_plan_snapshot_id_fkey'",
  'add constraint qa_reports_approved_plan_snapshot_id_fkey',
  'foreign key (approved_plan_snapshot_id) references public.approved_plan_snapshots(id) on delete set null',
  'create index if not exists idx_qa_reports_project_snapshot on public.qa_reports(project_id, approved_plan_snapshot_id)',
]) {
  assert.ok(sql.includes(phrase), `Migration missing phrase: ${phrase}`)
}

assert.equal(/insert\s+into\s+public\.qa_reports/i.test(sql), false, 'Migration must not seed QA reports')
assert.equal(
  /insert\s+into\s+public\.approved_plan_snapshots/i.test(sql),
  false,
  'Migration must not seed approved snapshots',
)
assert.equal(
  /update\s+public\.qa_reports\s+set\s+approved_plan_snapshot_id/i.test(sql),
  false,
  'Migration must not backfill QA report approved snapshots',
)

const fix = QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_QA_REPORTS_APPROVED_SNAPSHOT_FIX

assert.equal(fix.decision, DECISION)
assert.equal(fix.sourcePr, 1465)
assert.equal(fix.sourcePrHead, '52bee9537d8c9d9fd26a595953f4ee362a213d22')
assert.equal(fix.importBase, '9f89a608f0861e1a24953c4cad0a1329a51e3c46')
assert.equal(fix.repairedMigration.path, 'supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql')
assert.deepEqual(fix.repairedMigration.compatibilityColumns, [
  'public.qa_reports.approved_plan_snapshot_id',
])
assert.deepEqual(fix.repairedMigration.compatibilityBackfills, [])
assert.deepEqual(fix.repairedMigration.constraintsGuarded, [
  'qa_reports_approved_plan_snapshot_id_fkey',
])
assert.deepEqual(fix.repairedMigration.indexesUnblocked, ['idx_qa_reports_project_snapshot'])
assert.equal(fix.sourceImportScope.directStackMergeApproved, false)
assert.equal(fix.sourceImportScope.blindCherryPickApproved, false)
assert.equal(fix.sourceImportScope.broadQwenStackImported, false)
assert.equal(fix.runtimeFlags.baselineQaReportsApprovedSnapshotFixRecorded, true)
assert.equal(fix.runtimeFlags.activeBaselineQaExportsAuditMigrationEdited, true)
assert.equal(fix.runtimeFlags.qaReportsApprovedPlanSnapshotColumnGuarded, true)
assert.equal(fix.runtimeFlags.qaReportsApprovedPlanSnapshotForeignKeyGuarded, true)
assert.equal(fix.runtimeFlags.qaReportsProjectSnapshotIndexUnblocked, true)
assert.equal(fix.runtimeFlags.qaReportsApprovedSnapshotBackfillSkipped, true)
assertFalseFlags(fix.runtimeFlags)

console.log(JSON.stringify({
  ok: true,
  decision: fix.decision,
  repairedMigration: fix.repairedMigration.path,
  compatibilityColumns: fix.repairedMigration.compatibilityColumns,
  constraintsGuarded: fix.repairedMigration.constraintsGuarded,
  indexesUnblocked: fix.repairedMigration.indexesUnblocked,
  nextMilestone: fix.nextMilestone,
}, null, 2))
