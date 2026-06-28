import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_CREDIT_ESTIMATES_PLAN_VERSION_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-credit-estimates-plan-version-fix'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_7_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-7-result'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_backend_runtime_persistence_local_harness_validation_retry_7_blocked_generation_requests_approved_snapshot_baseline_column'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58AI-BACKEND-RUNTIME-PERSISTENCE-BASELINE-GENERATION-REQUESTS-APPROVED-SNAPSHOT-FIX: fix ReEditPro local baseline generation_requests approved_plan_snapshot_id for Qwen harness validation, no deploy/no cloud/no assets/no beta'

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
    'backendRuntimePersistenceLocalHarnessValidationRetry7Passed',
    'backendRuntimePersistenceLocalHarnessStarted',
    'backendRuntimePersistenceLocalHarnessPortConflictDetected',
    'backendRuntimePersistenceLocalHarnessBaselineMigrationPassed',
    'qwenDraftSqlApplied',
    'qwenLocalSqlTestsExecuted',
    'qwenLocalContainersLeftBehind',
    'unrelatedLocalSupabaseProjectStopped',
    'activeMigrationCreated',
    'qwenActiveMigrationCreated',
    'migrationDeployed',
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
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-7-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-credit-estimates-plan-version-fix.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-7-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-credit-estimates-plan-version-fix.ts',
  'database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql',
  'database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql',
  'supabase/config.toml',
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
check(!fs.existsSync(path.join(ROOT, 'supabase/.temp')), 'Supabase temp metadata must not be left behind.')

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-7-result'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-7-result-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-7-result.md')
for (const phrase of [
  DECISION,
  '`55430`',
  '`55431`',
  '`55432`',
  '`55433`',
  '`55434`',
  '`202605180004_reeditpro_credits_approval_snapshots.sql`',
  '`credit_estimates.edit_plan_version_id`',
  '`idx_credit_estimates_project_plan`',
  '`202605180005_reeditpro_generation_assets_jobs.sql`',
  '`idx_generation_requests_project_snapshot`',
  '`generation_requests.approved_plan_snapshot_id`',
  '`column "approved_plan_snapshot_id" does not exist (SQLSTATE 42703)`',
  '`supabase stop --project-id reeditpro_qwen_local_harness --no-backup`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry7ResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry7Attempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry7Passed=false`',
  '`backendRuntimePersistenceCreditEstimatesPlanVersionBaselineFixVerified=true`',
  '`backendRuntimePersistenceGenerationRequestsApprovedSnapshotBaselineFixRequired=true`',
  '`qwenDraftSqlApplied=false`',
  '`qwenLocalSqlTestsExecuted=false`',
  '`qwenLocalContainersLeftBehind=false`',
  '`supabaseCloudTouched=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-7-result.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-7-result.ts',
]) {
  assertNoForbiddenText(file)
}

const result = QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_7_RESULT
assert.equal(result.decision, DECISION)
assert.equal(
  result.upstreamBackendRuntimePersistenceBaselineCreditEstimatesPlanVersionFixDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_CREDIT_ESTIMATES_PLAN_VERSION_FIX.decision,
)
assert.equal(result.validationTarget.fixedLocalPorts.db, 55432)
assert.equal(result.preflight.fixedPortsFreeBeforeRetry, true)
assert.equal(result.attempt.localSupabaseHarnessStartAttempted, true)
assert.equal(result.attempt.localBaselineMigrationsAttempted, true)
assert.equal(result.attempt.previouslyFailedBaselineIndexPassed, 'idx_credit_estimates_project_plan')
assert.equal(result.attempt.previouslyFailedBaselineColumnPassed, 'credit_estimates.edit_plan_version_id')
assert.equal(
  result.attempt.failedBaselineMigration,
  '202605180005_reeditpro_generation_assets_jobs.sql',
)
assert.equal(result.attempt.failedStatementCategory, 'idx_generation_requests_project_snapshot')
assert.equal(result.attempt.missingBaselineColumn, 'generation_requests.approved_plan_snapshot_id')
assert.equal(
  result.attempt.sanitizedFailureReason,
  'column_approved_plan_snapshot_id_does_not_exist_on_public_generation_requests_sqlstate_42703',
)
assert.equal(result.attempt.qwenDraftSqlApplied, false)
assert.equal(result.attempt.qwenLocalSqlTestsExecuted, false)
assert.equal(result.cleanup.cleanupExitCode, 0)
assert.equal(result.cleanup.cleanupVerified, true)
assert.equal(result.cleanup.fixedPortsFreeAfterCleanup, true)
assert.equal(result.cleanup.qwenLocalContainersLeftBehind, false)
assert.equal(result.validationOutcome.status, 'blocked_generation_requests_approved_snapshot_baseline_column')
assert.equal(result.validationOutcome.creditEstimatesPlanVersionBaselineFixVerified, true)
assert.equal(result.validationOutcome.generationRequestsApprovedSnapshotBaselineFixRequired, true)
assert.equal(result.validationOutcome.generatedLocalFixturePassedClaimed, false)
assert.equal(result.nextPrompt, NEXT_PROMPT)
assertFalseFlags(result.runtimeFlags)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry7ResultRecorded, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry7Attempted, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalHarnessStartAttempted, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalHarnessBaselineMigrationAttempted, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceCreditEstimatesPlanVersionBaselineFixVerified, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceGenerationRequestsApprovedSnapshotBaselineFixRequired, true)

const forbiddenDataFindings = scanValues({ result })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen validation retry 7 data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  localHarnessValidationRetry7Attempted: result.validationOutcome.localHarnessValidationRetry7Attempted,
  localHarnessValidationRetry7Passed: result.validationOutcome.localHarnessValidationRetry7Passed,
  creditEstimatesPlanVersionBaselineFixVerified: result.validationOutcome.creditEstimatesPlanVersionBaselineFixVerified,
  failedBaselineMigration: result.attempt.failedBaselineMigration,
  failedStatementCategory: result.attempt.failedStatementCategory,
  missingBaselineColumn: result.attempt.missingBaselineColumn,
  qwenDraftSqlApplied: result.attempt.qwenDraftSqlApplied,
  qwenLocalSqlTestsExecuted: result.attempt.qwenLocalSqlTestsExecuted,
  cleanupVerified: result.cleanup.cleanupVerified,
  generatedLocalFixturePassedClaimed: result.validationOutcome.generatedLocalFixturePassedClaimed,
  nextPrompt: result.nextPrompt,
}, null, 2))
