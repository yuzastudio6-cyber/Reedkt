import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_VALIDATION_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-validation-result'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_MIGRATION_DRAFT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-migration-draft'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_backend_runtime_persistence_local_validation_blocked_local_harness_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58Q-BACKEND-RUNTIME-PERSISTENCE-LOCAL-HARNESS-PLAN: define approved local database harness for Qwen persistence validation, no SQL/no deploy/no cloud/no assets/no beta'

type JsonRecord = Record<string, unknown>

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

const forbiddenConcretePatterns: Array<[string, RegExp]> = [
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['concrete URL', /https?:\/\//i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
  ['identity token assignment', /\b(identityToken|idToken|accessToken)\s*[:=]\s*['"][^'"]+['"]/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
]

const unsafeTrueClaimPatterns: Array<[string, RegExp]> = [
  ['unsafe validation true claim', /\b(localValidationAttempted|localValidationPassed|draftSqlApplied|localSqlTestsExecuted|supabaseCliExecuted|dockerStarted|localDatabaseCreated|localDatabaseDropped)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe runtime true claim', /\b(realJobCreated|realLeaseClaimed|idempotencyRowCreated|workerClaimCreated|jobEventCreated|backendRuntimeMessageCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|serviceUrlResolvedNow|audienceResolvedNow|identityTokenFetched|authHeaderCreated|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted|activeMigrationCreated)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe generated/public claim', /\b(generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe unlock claim', /\b(privateInvokeReady|betaReady|productionReady|dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i],
]

function assertNoForbiddenText(relativePath: string) {
  const text = read(relativePath)
  const findings = [...forbiddenConcretePatterns, ...unsafeTrueClaimPatterns]
    .filter(([, pattern]) => pattern.test(text))
    .map(([name]) => name)
  assert.deepEqual(findings, [], `Forbidden value in ${relativePath}: ${findings.join('; ')}`)
}

function scanValues(value: unknown, pathParts: string[] = []): string[] {
  if (typeof value === 'string') {
    return forbiddenConcretePatterns
      .filter(([, pattern]) => pattern.test(value))
      .map(([name]) => `${pathParts.join('.')}: ${name}`)
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => scanValues(item, [...pathParts, String(index)]))
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as JsonRecord).flatMap(([key, nested]) =>
      scanValues(nested, [...pathParts, key]),
    )
  }
  return []
}

function assertFalseRuntimeSideEffects(flags: JsonRecord) {
  for (const key of [
    'activeMigrationCreated',
    'draftSqlApplied',
    'localSqlTestsExecuted',
    'supabaseCliExecuted',
    'dockerStarted',
    'localDatabaseCreated',
    'localDatabaseDropped',
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
    'supabaseTouched',
    'sqlExecuted',
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
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-validation-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-migration-draft.md',
  'database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql',
  'database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-validation-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-migration-draft.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

check(!fs.existsSync(path.join(ROOT, 'supabase/config.toml')), 'This blocked result expects no approved config in this worktree.')
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
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-validation-result'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-validation-result-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-backend-runtime-persistence-local-validation-result.md')
for (const phrase of [
  DECISION,
  'supabase/config.toml` or an approved local/non-production database harness',
  'Local validation attempted: false',
  'Draft migration applied: false',
  'Draft tests executed: false',
  '`backendRuntimePersistenceLocalValidationResultRecorded=true`',
  '`backendRuntimePersistenceLocalValidationAttempted=false`',
  '`backendRuntimePersistenceLocalValidationPassed=false`',
  '`backendRuntimePersistenceLocalHarnessRequired=true`',
  '`activeMigrationCreated=false`',
  '`draftSqlApplied=false`',
  '`localSqlTestsExecuted=false`',
  '`sqlExecuted=false`',
  '`supabaseTouched=false`',
  '`supabaseCliExecuted=false`',
  '`dockerStarted=false`',
  '`localDatabaseCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const result = QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_VALIDATION_RESULT
assert.equal(result.decision, DECISION)
assert.equal(
  result.upstreamBackendRuntimePersistenceMigrationDraftDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_MIGRATION_DRAFT.decision,
)
assert.equal(result.preflight.supabaseConfigTomlExists, false)
assert.equal(result.preflight.approvedLocalHarnessFound, false)
assert.equal(result.preflight.safeLocalValidationTargetFound, false)
assert.equal(result.preflight.localValidationAttempted, false)
assert.equal(result.validationOutcome.status, 'blocked_local_harness_required')
assert.equal(result.validationOutcome.localValidationAttempted, false)
assert.equal(result.validationOutcome.localValidationPassed, false)
assert.equal(result.validationOutcome.draftMigrationStatus, 'blocked')
assert.equal(result.validationOutcome.draftTestsStatus, 'blocked')
assert.equal(result.validationOutcome.baselineLoadStatus, 'not_attempted')
assert.equal(result.validationOutcome.cleanupRequired, false)
assert.equal(result.nextPrompt, NEXT_PROMPT)
assert.equal(result.baselineRequirements.length, 13)
const requiredBaselineRequirements = [
  'approved_plan_snapshots',
  'credit_reservations',
  'jobs',
  'job_events',
  'worker_runtime_configs',
  'worker_leases',
  'backend_runtime_messages',
  'job_claim_attempts',
  'api_idempotency_keys',
  'worker_job_claims',
  'storage_object_records',
  'signed_url_events',
  'tool_runtime_checks',
] as const
for (const required of requiredBaselineRequirements) {
  assert.ok(result.baselineRequirements.includes(required), `Missing baseline requirement: ${required}`)
}

assert.equal(result.runtimeFlags.backendRuntimePersistenceMigrationDraftRecorded, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalValidationResultRecorded, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalValidationAttempted, false)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalValidationPassed, false)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalHarnessRequired, true)
assertFalseRuntimeSideEffects(result.runtimeFlags)

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-validation-result.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-validation-result.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({
  result,
  migrationDraft: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_MIGRATION_DRAFT,
})
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen local validation result data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  localValidationAttempted: result.validationOutcome.localValidationAttempted,
  localValidationPassed: result.validationOutcome.localValidationPassed,
  draftMigrationStatus: result.validationOutcome.draftMigrationStatus,
  draftTestsStatus: result.validationOutcome.draftTestsStatus,
  supabaseTouched: result.runtimeFlags.supabaseTouched,
  sqlExecuted: result.runtimeFlags.sqlExecuted,
  readyForRealWorkerDispatch: result.runtimeFlags.readyForRealWorkerDispatch,
  generatedLocalFixturePassedClaimed: result.runtimeFlags.generatedLocalFixturePassedClaimed,
  nextPrompt: result.nextPrompt,
}, null, 2))
