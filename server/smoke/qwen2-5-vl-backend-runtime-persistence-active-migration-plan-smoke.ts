import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-plan'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RESULT_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-result-review'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_backend_runtime_persistence_active_migration_plan_recorded_active_migration_create_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58BA-BACKEND-RUNTIME-PERSISTENCE-ACTIVE-MIGRATION-CREATE: create active Qwen persistence migration from validated draft, no deploy/no cloud/no assets/no beta'

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
    'backendRuntimePersistenceActiveMigrationPlanRequired',
    'qwenActiveMigrationCreated',
    'migrationDeployed',
    'readyForRealWorkerDispatch',
    'privateInvokeReady',
    'cloudRunInvocationAttempted',
    'inferenceRun',
    'workersDispatched',
    'supabaseCloudTouched',
    'stagingTouched',
    'productionTouched',
    'generatedAssetsCreated',
    'publicArtifactsCreated',
    'signedUrlsCreated',
    'creditMutationCreated',
    'dryRunPassedClaimed',
    'generatedLocalFixturePassedClaimed',
  ]) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-plan.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-result-review.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-15-result.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-plan.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-result-review.ts',
  'database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql',
  'database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const activeQwenMigration = fs.existsSync(path.join(ROOT, 'supabase/migrations'))
  ? fs.readdirSync(path.join(ROOT, 'supabase/migrations')).find((file) =>
      file.includes('qwen2_5_vl_backend_runtime_persistence'),
    )
  : undefined
if (activeQwenMigration) {
  assert.equal(
    activeQwenMigration,
    '20260629011700_qwen2_5_vl_backend_runtime_persistence.sql',
    'Only the expected follow-on Qwen active migration may exist after the create step.',
  )
  check(
    fs.existsSync(path.join(ROOT, 'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-create.md')),
    'Follow-on active migration create doc must exist when active migration exists.',
  )
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-active-migration-plan'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-active-migration-plan-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-plan.md')
for (const phrase of [
  DECISION,
  'plan-only',
  '`database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql`',
  '`database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql`',
  'supabase migration new qwen2_5_vl_backend_runtime_persistence',
  'must not be copied into the executable migration',
  'reuse existing ReEditPro surfaces',
  'Workers must execute approved snapshots, not raw chat.',
  '`backendRuntimePersistenceActiveMigrationPlanRecorded=true`',
  '`backendRuntimePersistenceActiveMigrationPlanRequired=false`',
  '`backendRuntimePersistenceActiveMigrationCreateRequired=true`',
  '`qwenActiveMigrationCreated=false`',
  '`migrationDeployed=false`',
  '`privateInvokeReady=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-plan.ts',
]) {
  assertNoForbiddenText(file)
}

const plan = QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_PLAN
assert.equal(plan.decision, DECISION)
assert.equal(
  plan.upstreamLocalHarnessValidationResultReviewDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RESULT_REVIEW.decision,
)
assert.equal(plan.acceptedInputs.retry15EvidenceAccepted, true)
assert.equal(plan.acceptedInputs.validatedDraftSqlAccepted, true)
assert.equal(plan.acceptedInputs.validatedLocalSqlTestsAccepted, true)
assert.equal(plan.promotionPlan.futureMigrationCreationCommand, 'supabase migration new qwen2_5_vl_backend_runtime_persistence')
assert.equal(plan.promotionPlan.mustUseSupabaseCliMigrationNew, true)
assert.equal(plan.promotionPlan.mayInventExecutableMigrationFilename, false)
assert.equal(plan.promotionPlan.copyDraftOnlyWarningsIntoExecutableMigration, false)
assert.equal(plan.promotionPlan.createBaselineTables, false)
assert.equal(plan.promotionPlan.seedRows, false)
assert.equal(plan.promotionPlan.deployMigrationNow, false)
assert.equal(plan.sourceOfTruthRules.workersUseApprovedSnapshots, true)
assert.equal(plan.sourceOfTruthRules.rawChatExecutionRejected, true)
assert.equal(plan.sourceOfTruthRules.rawWorkerPromptFieldsAllowed, false)
assert.equal(plan.sourceOfTruthRules.signedUrlsAsSourceOfTruthAllowed, false)
assert.equal(plan.runtimeFlags.backendRuntimePersistenceActiveMigrationPlanRecorded, true)
assert.equal(plan.runtimeFlags.backendRuntimePersistenceActiveMigrationCreateRequired, true)
assertFalseFlags(plan.runtimeFlags)
assert.equal(plan.nextPrompt, NEXT_PROMPT)

const forbiddenDataFindings = scanValues({ plan })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen active migration plan data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: plan.decision,
  activeMigrationPlanRecorded: plan.runtimeFlags.backendRuntimePersistenceActiveMigrationPlanRecorded,
  activeMigrationCreateRequired: plan.runtimeFlags.backendRuntimePersistenceActiveMigrationCreateRequired,
  qwenActiveMigrationCreated: plan.runtimeFlags.qwenActiveMigrationCreated,
  migrationDeployed: plan.runtimeFlags.migrationDeployed,
  privateInvokeReady: plan.runtimeFlags.privateInvokeReady,
  generatedLocalFixturePassedClaimed: plan.runtimeFlags.generatedLocalFixturePassedClaimed,
  nextPrompt: plan.nextPrompt,
}, null, 2))
