import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_STORAGE_OBJECTS_POLICY_COMMENT_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-storage-objects-policy-comment-fix'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_14_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-14-result'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_backend_runtime_persistence_local_harness_validation_retry_14_blocked_storage_upload_pipeline_policy_comment_ownership'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58AW-BACKEND-RUNTIME-PERSISTENCE-BASELINE-STORAGE-UPLOAD-PIPELINE-POLICY-COMMENT-FIX: fix ReEditPro local baseline storage upload pipeline storage.objects policy comment ownership for Qwen harness validation, no deploy/no cloud/no assets/no beta'

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
    'backendRuntimePersistenceLocalHarnessValidationRetry14Passed',
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
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-14-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-storage-objects-policy-comment-fix.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-14-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-storage-objects-policy-comment-fix.ts',
  'supabase/migrations/202605200001_storage_upload_pipeline_readiness.sql',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

check(!fs.existsSync(path.join(ROOT, 'supabase/.temp')), 'Supabase temp metadata must not be left behind.')

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-14-result'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-14-result-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-14-result.md')
for (const phrase of [
  DECISION,
  '`202605180008_reeditpro_storage_buckets_policies.sql`',
  '`202605200001_storage_upload_pipeline_readiness.sql`',
  '`insufficient_privilege`',
  '`storage.objects`',
  '`storage_upload_pipeline_policy_comment_ownership`',
  '`must be owner of relation objects (SQLSTATE 42501)`',
  '`comment on policy "reeditpro_project_members_read_workspace_project_objects" on storage.objects`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry14ResultRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry14Attempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationRetry14Passed=false`',
  '`backendRuntimePersistenceStorageObjectsPolicyCommentFixVerified=true`',
  '`backendRuntimePersistenceStorageUploadPipelinePolicyCommentBaselineFixRequired=true`',
  '`qwenDraftSqlApplied=false`',
  '`qwenLocalSqlTestsExecuted=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const storageUploadMigration = read('supabase/migrations/202605200001_storage_upload_pipeline_readiness.sql')
check(
  storageUploadMigration.includes('comment on policy "reeditpro_project_members_read_workspace_project_objects" on storage.objects'),
  'Storage upload migration must retain the current policy comment blocker for the next fix.',
)
check(
  storageUploadMigration.includes('create policy "reeditpro_project_members_read_workspace_project_objects" on storage.objects'),
  'Storage upload migration must retain the read policy definition.',
)
check(
  storageUploadMigration.includes('create policy "reeditpro_project_editors_upload_workspace_source_and_thumbnails" on storage.objects'),
  'Storage upload migration must retain the upload policy definition.',
)
check(!storageUploadMigration.includes('storage.googleapis.com'), 'Storage upload migration must not include public storage endpoints.')

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-14-result.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-14-result.ts',
]) {
  assertNoForbiddenText(file)
}

const result = QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_14_RESULT
assert.equal(result.decision, DECISION)
assert.equal(
  result.upstreamBackendRuntimePersistenceBaselineStorageObjectsPolicyCommentFixDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_STORAGE_OBJECTS_POLICY_COMMENT_FIX.decision,
)
assert.equal(result.preflight.noExecutionSmokesPassed, true)
assert.equal(result.preflight.supabaseCliHelpChecked, true)
assert.equal(result.attempt.localSupabaseHarnessStartAttempted, true)
assert.equal(
  result.attempt.previouslyFailedBaselineStatementPassed,
  'comment on policy "reeditpro_project_members_read_project_objects" on storage.objects',
)
assert.equal(result.attempt.failedBaselineMigration, '202605200001_storage_upload_pipeline_readiness.sql')
assert.equal(result.attempt.failedStatementCategory, 'storage_upload_pipeline_policy_comment_ownership')
assert.equal(result.attempt.qwenDraftSqlApplied, false)
assert.equal(result.attempt.qwenLocalSqlTestsExecuted, false)
assert.equal(result.cleanup.cleanupVerified, true)
assert.equal(result.cleanup.fixedPortsFreeAfterCleanup, true)
assert.equal(result.cleanup.qwenLocalContainersLeftBehind, false)
assert.equal(result.validationOutcome.status, 'blocked_storage_upload_pipeline_policy_comment_ownership')
assert.equal(result.validationOutcome.storageObjectsPolicyCommentFixVerified, true)
assert.equal(result.validationOutcome.storageUploadPipelinePolicyCommentBaselineFixRequired, true)
assertFalseFlags(result.runtimeFlags)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry14ResultRecorded, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationRetry14Attempted, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalHarnessStartAttempted, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalHarnessBaselineMigrationAttempted, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceStorageObjectsPolicyCommentFixVerified, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceStorageUploadPipelinePolicyCommentBaselineFixRequired, true)
assert.equal(result.nextPrompt, NEXT_PROMPT)

const forbiddenDataFindings = scanValues({
  result,
  storageObjectsPolicyCommentFix: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_BASELINE_STORAGE_OBJECTS_POLICY_COMMENT_FIX,
})
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen validation retry 14 data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: result.decision,
  localHarnessValidationRetry14Attempted: result.validationOutcome.localHarnessValidationRetry14Attempted,
  localHarnessValidationRetry14Passed: result.validationOutcome.localHarnessValidationRetry14Passed,
  storageObjectsPolicyCommentFixVerified: result.validationOutcome.storageObjectsPolicyCommentFixVerified,
  failedBaselineMigration: result.attempt.failedBaselineMigration,
  failedStatementCategory: result.attempt.failedStatementCategory,
  qwenDraftSqlApplied: result.attempt.qwenDraftSqlApplied,
  qwenLocalSqlTestsExecuted: result.attempt.qwenLocalSqlTestsExecuted,
  cleanupVerified: result.cleanup.cleanupVerified,
  generatedLocalFixturePassedClaimed: result.validationOutcome.generatedLocalFixturePassedClaimed,
  nextPrompt: result.nextPrompt,
}, null, 2))
