import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RESULT_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-result-review'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_15_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-15-result'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_backend_runtime_persistence_local_harness_validation_result_review_accepted_active_migration_plan_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58AZ-BACKEND-RUNTIME-PERSISTENCE-ACTIVE-MIGRATION-PLAN: promote validated Qwen persistence draft to active migration plan, no deploy/no cloud/no assets/no beta'

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
    'backendRuntimePersistenceLocalHarnessValidationResultReviewRequired',
    'qwenActiveMigrationCreated',
    'migrationDeployed',
    'readyForRealWorkerDispatch',
    'privateInvokeReady',
    'cloudRunInvocationAttempted',
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
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-result-review.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-15-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-storage-upload-pipeline-policy-comment-fix.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-result-review.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-15-result.ts',
  'database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql',
  'database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

check(!fs.existsSync(path.join(ROOT, 'supabase/.temp')), 'Supabase temp metadata must not be left behind.')
check(!fs.existsSync(path.join(ROOT, 'supabase/.branches')), 'Supabase branch metadata must not be left behind.')

const activeQwenMigration = fs.existsSync(path.join(ROOT, 'supabase/migrations'))
  ? fs.readdirSync(path.join(ROOT, 'supabase/migrations')).find((file) =>
      file.includes('qwen2_5_vl_backend_runtime_persistence'),
    )
  : undefined
assert.equal(activeQwenMigration, undefined, 'Qwen active runtime persistence migration must not exist yet.')

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-validation-result-review'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-result-review-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-result-review.md')
for (const phrase of [
  DECISION,
  'retry 15 result accepted: true',
  'active ReEditPro baseline local harness completion accepted: true',
  'Qwen draft SQL apply evidence accepted: true',
  'Qwen local SQL test evidence accepted: true',
  'private storage and signed URL boundary evidence accepted: true',
  'raw prompt rejection evidence accepted: true',
  '`database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql`',
  '`database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql`',
  '`localHarnessValidationResultReviewRecorded=true`',
  '`retry15EvidenceAccepted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationResultReviewRequired=false`',
  '`backendRuntimePersistenceActiveMigrationPlanRequired=true`',
  '`qwenActiveMigrationCreated=false`',
  '`migrationDeployed=false`',
  '`readyForRealWorkerDispatch=false`',
  '`privateInvokeReady=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-result-review.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-result-review.ts',
]) {
  assertNoForbiddenText(file)
}

const review = QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RESULT_REVIEW
assert.equal(review.decision, DECISION)
assert.equal(
  review.upstreamRetry15Decision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_15_RESULT.decision,
)
assert.equal(review.acceptedEvidence.retry15ResultAccepted, true)
assert.equal(review.acceptedEvidence.activeBaselineCompletionAccepted, true)
assert.equal(review.acceptedEvidence.storageUploadPipelinePolicyCommentFixAccepted, true)
assert.equal(review.acceptedEvidence.qwenDraftSqlApplyEvidenceAccepted, true)
assert.equal(review.acceptedEvidence.qwenLocalSqlTestsEvidenceAccepted, true)
assert.equal(review.acceptedEvidence.localDefaultSecretsExcluded, true)
assert.equal(review.remainingBlockers.activeMigrationPlanRequired, true)
assert.equal(review.remainingBlockers.qwenActiveMigrationCreated, false)
assert.equal(review.runtimeFlags.localHarnessValidationResultReviewRecorded, true)
assert.equal(review.runtimeFlags.retry15EvidenceAccepted, true)
assert.equal(review.runtimeFlags.backendRuntimePersistenceActiveMigrationPlanRequired, true)
assertFalseFlags(review.runtimeFlags)
assert.equal(review.nextPrompt, NEXT_PROMPT)

const forbiddenDataFindings = scanValues({ review })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen local harness validation result review data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: review.decision,
  retry15EvidenceAccepted: review.runtimeFlags.retry15EvidenceAccepted,
  activeMigrationPlanRequired: review.runtimeFlags.backendRuntimePersistenceActiveMigrationPlanRequired,
  qwenActiveMigrationCreated: review.runtimeFlags.qwenActiveMigrationCreated,
  migrationDeployed: review.runtimeFlags.migrationDeployed,
  privateInvokeReady: review.runtimeFlags.privateInvokeReady,
  generatedLocalFixturePassedClaimed: review.runtimeFlags.generatedLocalFixturePassedClaimed,
  nextPrompt: review.nextPrompt,
}, null, 2))
