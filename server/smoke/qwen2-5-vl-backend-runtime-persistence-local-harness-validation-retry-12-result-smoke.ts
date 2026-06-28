import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_RLS_FUNCTION_PARAMETER_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-rls-function-parameter-fix'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_12_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-12-result'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_backend_runtime_persistence_local_harness_validation_retry_12_blocked_storage_buckets_comment_ownership'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58AS-BACKEND-RUNTIME-PERSISTENCE-BASELINE-STORAGE-BUCKETS-COMMENT-FIX: fix ReEditPro local baseline storage.buckets comment ownership for Qwen harness validation, no deploy/no cloud/no assets/no beta'

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
    'backendRuntimePersistenceLocalHarnessValidationRetry12Passed',
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
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-12-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-rls-function-parameter-fix.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-12-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-rls-function-parameter-fix.ts',
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
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-12-result'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-12-result-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-12-result.md')
for (const phrase of [
  DECISION,
  '`55430`',
  '`55431`',
  '`55432`',
  '`55433`',
  '`55434`',
  '`202605180007_reeditpro_rls_policies.sql`',
  '`202605180008_reeditpro_storage_buckets_policies.sql`',
  '`public.is_workspace_member(uuid)`',
  '`public.is_workspace_owner_or_admin(uuid)`',
  '`target_workspace_id`',
  '`storage_buckets_comment_ownership`',
  '`must be owner of table buckets (SQLSTATE 42501)`',
  '`comment on table storage.buckets`',
  '`supabase stop --project-id reeditpro_qwen_local_harness --no-backup`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry12ResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry12Attempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry12Passed=false`',
  '`backendRuntimePersistenceRlsFunctionParameterFixVerified=true`',
  '`backendRuntimePersistenceStorageBucketsCommentBaselineFixRequired=true`',
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
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-12-result.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-12-result.ts',
]) {
  assertNoForbiddenText(file)
}

const result = QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_12_RESULT
assert.equal(result.decision, DECISION)
assert.equal(
  result.upstreamBackendRuntimePersistenceBaselineRlsFunctionParameterFixDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_RLS_FUNCTION_PARAMETER_FIX.decision,
)
assert.equal(result.validationTarget.fixedLocalPorts.db, 55432)
assert.equal(result.preflight.fixedPortsFreeBeforeRetry, true)
assert.equal(result.attempt.localSupabaseHarnessStartAttempted, true)
assert.equal(result.attempt.localBaselineMigrationsAttempted, true)
assert.equal(result.attempt.previouslyFailedBaselineFunctionPassed, 'public.is_workspace_member(uuid)')
assert.equal(result.attempt.previouslyFailedBaselineParameterPreserved, 'target_workspace_id')
assert.equal(
  result.attempt.lastSuccessfulBaselineMigration,
  '202605180007_reeditpro_rls_policies.sql',
)
assert.equal(
  result.attempt.failedBaselineMigration,
  '202605180008_reeditpro_storage_buckets_policies.sql',
)
assert.equal(result.attempt.failedStatementCategory, 'storage_buckets_comment_ownership')
assert.equal(result.attempt.failedStatementSummary, 'comment on table storage.buckets')
assert.equal(
  result.attempt.sanitizedFailureReason,
  'must_be_owner_of_table_buckets_sqlstate_42501',
)
assert.equal(result.attempt.qwenDraftSqlApplied, false)
assert.equal(result.attempt.qwenLocalSqlTestsExecuted, false)
assert.equal(result.cleanup.cleanupObservedStopped, true)
assert.equal(result.cleanup.cleanupVerified, true)
assert.equal(result.cleanup.fixedPortsFreeAfterCleanup, true)
assert.equal(result.cleanup.qwenLocalContainersLeftBehind, false)
assert.equal(result.validationOutcome.status, 'blocked_storage_buckets_comment_ownership')
assert.equal(result.validationOutcome.rlsFunctionParameterFixVerified, true)
assert.equal(result.validationOutcome.storageBucketsCommentBaselineFixRequired, true)
assert.equal(result.validationOutcome.generatedLocalFixturePassedClaimed, false)
assert.equal(result.nextPrompt, NEXT_PROMPT)
assertFalseFlags(result.runtimeFlags)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry12ResultRecorded, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry12Attempted, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalHarnessStartAttempted, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalHarnessBaselineMigrationAttempted, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceRlsFunctionParameterFixVerified, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceStorageBucketsCommentBaselineFixRequired, true)

const forbiddenDataFindings = scanValues({ result })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen validation retry 12 data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  localHarnessValidationRetry12Attempted: result.validationOutcome.localHarnessValidationRetry12Attempted,
  localHarnessValidationRetry12Passed: result.validationOutcome.localHarnessValidationRetry12Passed,
  rlsFunctionParameterFixVerified:
    result.validationOutcome.rlsFunctionParameterFixVerified,
  failedBaselineMigration: result.attempt.failedBaselineMigration,
  failedStatementCategory: result.attempt.failedStatementCategory,
  qwenDraftSqlApplied: result.attempt.qwenDraftSqlApplied,
  qwenLocalSqlTestsExecuted: result.attempt.qwenLocalSqlTestsExecuted,
  cleanupVerified: result.cleanup.cleanupVerified,
  generatedLocalFixturePassedClaimed:
    result.validationOutcome.generatedLocalFixturePassedClaimed,
  nextPrompt: result.nextPrompt,
}, null, 2))
