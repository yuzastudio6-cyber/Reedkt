import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_STORAGE_UPLOAD_PIPELINE_POLICY_COMMENT_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-storage-upload-pipeline-policy-comment-fix'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_15_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-15-result'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_backend_runtime_persistence_local_harness_validation_retry_15_passed_qwen_draft_sql_and_tests'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58AY-BACKEND-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RESULT-REVIEW: review passed Qwen local harness validation result, no deploy/no cloud/no assets/no beta'

type JsonRecord = Record<string, unknown>

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

const forbiddenTextPatterns: Array<[string, RegExp]> = [
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase cloud hostname', /\bsupabase\.co\b/i],
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
  ['supabase cloud hostname', /\bsupabase\.co\b/i],
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
    'backendRuntimePersistenceLocalHarnessStarted',
    'backendRuntimePersistenceLocalHarnessPortConflictDetected',
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
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-15-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-storage-upload-pipeline-policy-comment-fix.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-15-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-storage-upload-pipeline-policy-comment-fix.ts',
  'database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql',
  'database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

check(!fs.existsSync(path.join(ROOT, 'supabase/.temp')), 'Supabase temp metadata must not be left behind.')
check(!fs.existsSync(path.join(ROOT, 'supabase/.branches')), 'Supabase branch metadata must not be left behind.')

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-15-result'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-15-result-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-15-result.md')
for (const phrase of [
  DECISION,
  '`202605200001_storage_upload_pipeline_readiness.sql`',
  '`insufficient_privilege`',
  '`storage.objects`',
  '`comment on policy "reeditpro_project_members_read_workspace_project_objects" on storage.objects`',
  '`database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql`',
  '`database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry15ResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry15Attempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry15Passed=true`',
  '`backendRuntimePersistenceLocalHarnessBaselineMigrationPassed=true`',
  '`backendRuntimePersistenceStorageUploadPipelinePolicyCommentFixVerified=true`',
  '`qwenDraftSqlApplied=true`',
  '`qwenLocalSqlTestsExecuted=true`',
  '`qwenLocalSqlTestsPassed=true`',
  '`privateInvokeReady=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const draftSql = read('database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql')
check(draftSql.includes('qwen25_vl_jobs_payload_refs_check'), 'Draft SQL must define the Qwen job payload guard.')
check(draftSql.includes("input_payload->>'selected_gpu' = 'nvidia_l4'"), 'Draft SQL must preserve the L4 GPU guard.')
check(draftSql.includes("input_payload->>'serving_profile' = 'bounded_preview_scale_to_zero'"), 'Draft SQL must preserve scale-to-zero metadata.')
check(!fs.existsSync(path.join(ROOT, 'supabase/migrations/024_qwen2_5_vl_backend_runtime_persistence.sql')), 'Qwen active migration must not exist.')
check(!fs.existsSync(path.join(ROOT, 'supabase/migrations/999_qwen2_5_vl_backend_runtime_persistence.sql')), 'Qwen active migration must not exist.')

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-15-result.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-15-result.ts',
]) {
  assertNoForbiddenText(file)
}

const result = QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_15_RESULT
assert.equal(result.decision, DECISION)
assert.equal(
  result.upstreamBackendRuntimePersistenceBaselineStorageUploadPipelinePolicyCommentFixDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_STORAGE_UPLOAD_PIPELINE_POLICY_COMMENT_FIX.decision,
)
assert.equal(result.preflight.noExecutionSmokesPassed, true)
assert.equal(result.preflight.supabaseCliHelpChecked, true)
assert.equal(result.attempt.localSupabaseHarnessStartAttempted, true)
assert.equal(result.attempt.localSupabaseHarnessStartPassed, true)
assert.equal(result.attempt.localBaselineMigrationsPassed, true)
assert.equal(result.attempt.qwenDraftSqlApplied, true)
assert.equal(result.attempt.qwenLocalSqlTestsExecuted, true)
assert.equal(result.attempt.qwenLocalSqlTestsPassed, true)
assert.equal(result.attempt.localDefaultSecretsRecordedInRepo, false)
assert.equal(result.cleanup.cleanupVerified, true)
assert.equal(result.cleanup.fixedPortsFreeAfterCleanup, true)
assert.equal(result.cleanup.qwenLocalContainersLeftBehind, false)
assert.equal(result.validationOutcome.status, 'passed_qwen_draft_sql_and_tests')
assert.equal(result.validationOutcome.storageUploadPipelinePolicyCommentFixVerified, true)
assert.equal(result.validationOutcome.draftMigrationStatus, 'passed')
assert.equal(result.validationOutcome.draftTestsStatus, 'passed')
assert.equal(result.validationOutcome.resultReviewRequired, true)
assert.equal(result.validationOutcome.privateInvokeReady, false)
assertFalseFlags(result.runtimeFlags)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry15ResultRecorded, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry15Attempted, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry15Passed, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalHarnessStartAttempted, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalHarnessStartPassed, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalHarnessBaselineMigrationAttempted, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalHarnessBaselineMigrationPassed, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceStorageUploadPipelinePolicyCommentFixVerified, true)
assert.equal(result.runtimeFlags.qwenDraftSqlApplyAttempted, true)
assert.equal(result.runtimeFlags.qwenDraftSqlApplied, true)
assert.equal(result.runtimeFlags.qwenLocalSqlTestsAttempted, true)
assert.equal(result.runtimeFlags.qwenLocalSqlTestsExecuted, true)
assert.equal(result.runtimeFlags.qwenLocalSqlTestsPassed, true)
assert.equal(result.nextPrompt, NEXT_PROMPT)

const forbiddenDataFindings = scanValues({
  result,
  storageUploadPipelinePolicyCommentFix:
    QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_STORAGE_UPLOAD_PIPELINE_POLICY_COMMENT_FIX,
})
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen validation retry 15 data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: result.decision,
  localHarnessValidationRetry15Attempted: result.validationOutcome.localHarnessValidationRetry15Attempted,
  localHarnessValidationRetry15Passed: result.validationOutcome.localHarnessValidationRetry15Passed,
  baselineLoadStatus: result.validationOutcome.baselineLoadStatus,
  qwenDraftSqlApplied: result.attempt.qwenDraftSqlApplied,
  qwenLocalSqlTestsExecuted: result.attempt.qwenLocalSqlTestsExecuted,
  qwenLocalSqlTestsPassed: result.attempt.qwenLocalSqlTestsPassed,
  cleanupVerified: result.cleanup.cleanupVerified,
  privateInvokeReady: result.validationOutcome.privateInvokeReady,
  generatedLocalFixturePassedClaimed: result.validationOutcome.generatedLocalFixturePassedClaimed,
  nextPrompt: result.nextPrompt,
}, null, 2))
