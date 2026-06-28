import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_GENERATION_REQUESTS_APPROVED_SNAPSHOT_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-generation-requests-approved-snapshot-fix'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_7_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-7-result'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_backend_runtime_persistence_baseline_generation_requests_approved_snapshot_fix_recorded'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58AJ-BACKEND-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-8: retry Qwen local harness validation after generation requests approved-snapshot baseline fix, no deploy/no cloud/no assets/no beta'

type JsonRecord = Record<string, unknown>

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

const forbiddenTextPatterns: Array<[string, RegExp]> = [
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
  ['identity token assignment', /\b(identityToken|idToken|accessToken)\s*[:=]\s*['"][^'"]+['"]/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  ['unsafe runtime true claim', /\b(privateInvokeReady|betaReady|productionReady|inferenceRun|workersDispatched|supabaseCloudTouched|stagingTouched|productionTouched)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe pass claim', /\b(dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i],
]

const forbiddenValuePatterns: Array<[string, RegExp]> = [
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['bearer token value', /\bBearer\s+[A-Za-z0-9._~+/-]+/i],
  ['credential-looking value', /\b(sk-[A-Za-z0-9]{12,}|hf_[A-Za-z0-9]{12,}|ya29\.[A-Za-z0-9._-]+)/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
]

function assertNoForbiddenText(relativePath: string) {
  const text = read(relativePath)
  const findings = forbiddenTextPatterns
    .filter(([, pattern]) => pattern.test(text))
    .map(([name]) => name)
  assert.deepEqual(findings, [], `Forbidden value in ${relativePath}: ${findings.join('; ')}`)
}

function scanValues(value: unknown, pathParts: string[] = []): string[] {
  if (typeof value === 'string') {
    return forbiddenValuePatterns
      .filter(([, pattern]) => pattern.test(value))
      .map(([name]) => `${pathParts.join('.')}: ${name}`)
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => scanValues(item, [...pathParts, String(index)]))
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as JsonRecord)
      .flatMap(([key, nested]) => scanValues(nested, [...pathParts, key]))
  }
  return []
}

function assertFalseFlags(flags: JsonRecord) {
  for (const key of [
    'newActiveMigrationCreated',
    'qwenActiveMigrationCreated',
    'supabaseCliExecuted',
    'dockerStarted',
    'sqlExecuted',
    'migrationDeployed',
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
    'serviceUrlResolvedNow',
    'audienceResolvedNow',
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
    'supabaseCloudTouched',
    'stagingTouched',
    'productionTouched',
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
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-generation-requests-approved-snapshot-fix.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-7-result.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-generation-requests-approved-snapshot-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-7-result.ts',
  'supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

check(
  !fs.existsSync(path.join(ROOT, 'supabase/migrations/024_qwen2_5_vl_backend_runtime_persistence.sql')),
  'Qwen active migration must not exist.',
)
check(
  !fs.existsSync(path.join(ROOT, 'supabase/migrations/999_qwen2_5_vl_backend_runtime_persistence.sql')),
  'Qwen active migration must not exist.',
)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-baseline-generation-requests-approved-snapshot-fix'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-baseline-generation-requests-approved-snapshot-fix-smoke.ts',
  'package script mismatch',
)

const sql = read('supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql')
for (const phrase of [
  'alter table if exists public.generation_requests',
  'add column if not exists approved_plan_snapshot_id uuid',
  'comment on column public.generation_requests.approved_plan_snapshot_id',
  'no backfill is invented here',
  'generation_requests_approved_plan_snapshot_id_fkey',
  'foreign key (approved_plan_snapshot_id) references public.approved_plan_snapshots(id) on delete restrict',
  'create index if not exists idx_generation_requests_project_snapshot on public.generation_requests(project_id, approved_plan_snapshot_id)',
]) {
  check(sql.includes(phrase), `Baseline migration missing repair phrase: ${phrase}`)
}

const guardIndex = sql.indexOf('add column if not exists approved_plan_snapshot_id uuid')
const constraintIndex = sql.indexOf('generation_requests_approved_plan_snapshot_id_fkey')
const indexIndex = sql.indexOf('idx_generation_requests_project_snapshot')
check(guardIndex >= 0 && indexIndex > guardIndex, 'Compatibility column guard must appear before project-snapshot index.')
check(constraintIndex >= 0 && indexIndex > constraintIndex, 'Foreign-key guard must appear before project-snapshot index.')

const doc = read('docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-generation-requests-approved-snapshot-fix.md')
for (const phrase of [
  DECISION,
  '`202605180005_reeditpro_generation_assets_jobs.sql`',
  '`idx_generation_requests_project_snapshot`',
  '`column "approved_plan_snapshot_id" does not exist (SQLSTATE 42703)`',
  '`public.generation_requests.approved_plan_snapshot_id`',
  '`generation_requests_approved_plan_snapshot_id_fkey`',
  '`no_backfill_because_migration_must_not_invent_approved_snapshots_generation_requests_assets_jobs_workers_storage_or_credit_records`',
  '`baselineGenerationRequestsApprovedSnapshotFixRecorded=true`',
  '`activeBaselineGenerationAssetsJobsMigrationEdited=true`',
  '`generationRequestsApprovedPlanSnapshotColumnGuarded=true`',
  '`generationRequestsApprovedPlanSnapshotForeignKeyGuarded=true`',
  '`generationRequestsProjectSnapshotIndexUnblocked=true`',
  '`generationRequestsApprovedSnapshotBackfillSkipped=true`',
  '`newActiveMigrationCreated=false`',
  '`qwenActiveMigrationCreated=false`',
  '`sqlExecuted=false`',
  '`qwenDraftSqlApplied=false`',
  '`qwenLocalSqlTestsExecuted=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-generation-requests-approved-snapshot-fix.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-generation-requests-approved-snapshot-fix.ts',
]) {
  assertNoForbiddenText(file)
}

const fix = QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_GENERATION_REQUESTS_APPROVED_SNAPSHOT_FIX
assert.equal(fix.decision, DECISION)
assert.equal(
  fix.upstreamBackendRuntimePersistenceLocalHarnessValidationRetry7ResultDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_7_RESULT.decision,
)
assert.equal(fix.repairedMigration.path, 'supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql')
assert.equal(fix.repairedMigration.repair, 'add_idempotent_generation_requests_approved_plan_snapshot_compatibility_column')
assert.deepEqual(fix.repairedMigration.compatibilityColumns, [
  'public.generation_requests.approved_plan_snapshot_id',
])
assert.deepEqual(fix.repairedMigration.compatibilityBackfills, [])
assert.equal(
  fix.repairedMigration.backfillPolicy,
  'no_backfill_because_migration_must_not_invent_approved_snapshots_generation_requests_assets_jobs_workers_storage_or_credit_records',
)
assert.deepEqual(fix.repairedMigration.constraintsUnblocked, [
  'generation_requests_approved_plan_snapshot_id_fkey',
])
assert.deepEqual(fix.repairedMigration.indexesUnblocked, [
  'idx_generation_requests_project_snapshot',
])
assert.equal(fix.nextPrompt, NEXT_PROMPT)
assertFalseFlags(fix.runtimeFlags)
assert.equal(fix.runtimeFlags.baselineGenerationRequestsApprovedSnapshotFixRecorded, true)
assert.equal(fix.runtimeFlags.activeBaselineGenerationAssetsJobsMigrationEdited, true)
assert.equal(fix.runtimeFlags.generationRequestsApprovedPlanSnapshotColumnGuarded, true)
assert.equal(fix.runtimeFlags.generationRequestsApprovedPlanSnapshotForeignKeyGuarded, true)
assert.equal(fix.runtimeFlags.generationRequestsProjectSnapshotIndexUnblocked, true)
assert.equal(fix.runtimeFlags.generationRequestsApprovedSnapshotBackfillSkipped, true)

const forbiddenDataFindings = scanValues({ fix })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in baseline generation requests approved-snapshot fix data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  repairedMigration: fix.repairedMigration.path,
  compatibilityColumns: fix.repairedMigration.compatibilityColumns,
  generationRequestsApprovedSnapshotBackfillSkipped:
    fix.runtimeFlags.generationRequestsApprovedSnapshotBackfillSkipped,
  qwenDraftSqlApplied: fix.runtimeFlags.qwenDraftSqlApplied,
  qwenLocalSqlTestsExecuted: fix.runtimeFlags.qwenLocalSqlTestsExecuted,
  generatedLocalFixturePassedClaimed: fix.runtimeFlags.generatedLocalFixturePassedClaimed,
  nextPrompt: fix.nextPrompt,
}, null, 2))
