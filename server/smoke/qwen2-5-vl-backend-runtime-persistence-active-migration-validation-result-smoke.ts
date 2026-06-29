import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_CREATE } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-create'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_VALIDATION_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-validation-result'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_backend_runtime_persistence_active_migration_validation_passed_deploy_plan_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58BC-BACKEND-RUNTIME-PERSISTENCE-ACTIVE-MIGRATION-DEPLOY-PLAN: plan deployment of validated Qwen persistence migration, no deploy/no cloud/no assets/no beta'
const ACTIVE_MIGRATION =
  'supabase/migrations/20260629011700_qwen2_5_vl_backend_runtime_persistence.sql'
const TEST_SQL = 'database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql'

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

const activeMigrationForbiddenPatterns: Array<[string, RegExp]> = [
  ['draft-only banner', /MIGRATION DRAFT ONLY|DO NOT RUN|DO NOT APPLY/i],
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase cloud hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
  ['credential assignment', /\b(api[_-]?key|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
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
    'backendRuntimePersistenceActiveMigrationDeployed',
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
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-validation-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-create.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-validation-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-create.ts',
  ACTIVE_MIGRATION,
  TEST_SQL,
  'supabase/config.toml',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

check(!fs.existsSync(path.join(ROOT, 'supabase/.temp')), 'Supabase temp metadata must not be left behind.')
check(!fs.existsSync(path.join(ROOT, 'supabase/.branches')), 'Supabase branch metadata must not be left behind.')

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-active-migration-validation-result'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-active-migration-validation-result-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-validation-result.md')
for (const phrase of [
  DECISION,
  ACTIVE_MIGRATION,
  TEST_SQL,
  '`reeditpro_qwen_local_harness`',
  '`20260629011700`',
  'Active Qwen migration applied: true',
  'Qwen local SQL tests passed: true',
  'local default development keys, connection strings, database passwords, storage keys, and JWT secrets are not recorded in repo evidence',
  '`backendRuntimePersistenceActiveMigrationValidated=true`',
  '`backendRuntimePersistenceActiveMigrationDeployPlanRequired=true`',
  '`backendRuntimePersistenceActiveMigrationDeployed=false`',
  '`migrationDeployed=false`',
  '`privateInvokeReady=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const migrationText = read(ACTIVE_MIGRATION)
for (const phrase of [
  'Qwen2.5-VL backend runtime persistence guards.',
  'QWEN2_5_VL_REQUIRES_REEDITPRO_RUNTIME_BASELINE',
  'qwen25_vl_jobs_payload_refs_check',
  'qwen25_vl_worker_runtime_config_check',
  "'Qwen/Qwen2.5-VL-7B-Instruct'",
  "'cc594898137f460bfe9f0759e9844b3ce807cfb5'",
  "'nvidia_l4'",
  "'bounded_preview_scale_to_zero'",
  "'qwen_vl'",
]) {
  assert.ok(migrationText.includes(phrase), `Active migration missing phrase: ${phrase}`)
}

const activeMigrationFindings = activeMigrationForbiddenPatterns
  .filter(([, pattern]) => pattern.test(migrationText))
  .map(([name]) => name)
assert.deepEqual(activeMigrationFindings, [], `Forbidden active migration content: ${activeMigrationFindings.join('; ')}`)

const testSql = read(TEST_SQL)
for (const phrase of [
  'qwen25_vl_jobs_payload_refs_check',
  'qwen25_vl_worker_runtime_config_check',
  'qwen_storage_records_have_no_signed_url_columns',
  'qwen_signed_url_events_have_no_url_value_columns',
  'qwen_runtime_surfaces_have_no_raw_prompt_columns',
]) {
  assert.ok(testSql.includes(phrase), `Test SQL missing phrase: ${phrase}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-validation-result.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-validation-result.ts',
]) {
  assertNoForbiddenText(file)
}

const result = QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_VALIDATION_RESULT
assert.equal(result.decision, DECISION)
assert.equal(
  result.upstreamActiveMigrationCreateDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_CREATE.decision,
)
assert.equal(result.validationTarget.activeMigration, ACTIVE_MIGRATION)
assert.equal(result.validationTarget.activeMigrationHistoryVersion, '20260629011700')
assert.equal(result.preflight.noExecutionSmokesPassed, true)
assert.equal(result.preflight.supabaseCliHelpChecked, true)
assert.equal(result.attempt.localSupabaseHarnessStartAttempted, true)
assert.equal(result.attempt.localSupabaseHarnessStartPassed, true)
assert.equal(result.attempt.localBaselineMigrationsPassed, true)
assert.equal(result.attempt.activeMigrationReached, true)
assert.equal(result.attempt.activeMigrationApplied, true)
assert.equal(result.attempt.activeMigrationHistoryObserved, true)
assert.equal(result.attempt.qwenLocalSqlTestsExecuted, true)
assert.equal(result.attempt.qwenLocalSqlTestsPassed, true)
assert.equal(result.attempt.localDefaultSecretsRecordedInRepo, false)
assert.equal(result.cleanup.cleanupVerified, true)
assert.equal(result.cleanup.fixedPortsFreeAfterCleanup, true)
assert.equal(result.cleanup.qwenLocalContainersLeftBehind, false)
assert.equal(result.validationOutcome.status, 'passed_active_migration_and_qwen_sql_tests')
assert.equal(result.validationOutcome.activeMigrationValidationPassed, true)
assert.equal(result.validationOutcome.activeMigrationStatus, 'passed')
assert.equal(result.validationOutcome.activeMigrationHistoryStatus, 'observed')
assert.equal(result.validationOutcome.localSqlTestsStatus, 'passed')
assert.equal(result.validationOutcome.deployPlanRequired, true)
assert.equal(result.validationOutcome.privateInvokeReady, false)
assert.equal(result.validatedCoverage.selectedGpu, 'nvidia_l4')
assert.equal(result.validatedCoverage.servingProfile, 'bounded_preview_scale_to_zero')
assert.equal(result.runtimeFlags.backendRuntimePersistenceActiveMigrationValidationResultRecorded, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceActiveMigrationValidationAttempted, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceActiveMigrationValidated, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceActiveMigrationApplied, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceActiveMigrationHistoryObserved, true)
assert.equal(result.runtimeFlags.qwenLocalSqlTestsExecuted, true)
assert.equal(result.runtimeFlags.qwenLocalSqlTestsPassed, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceActiveMigrationDeployPlanRequired, true)
assertFalseFlags(result.runtimeFlags)
assert.equal(result.nextPrompt, NEXT_PROMPT)

const forbiddenDataFindings = scanValues({ result })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen active migration validation data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: result.decision,
  activeMigration: result.validationTarget.activeMigration,
  activeMigrationHistoryVersion: result.validationTarget.activeMigrationHistoryVersion,
  activeMigrationValidated: result.runtimeFlags.backendRuntimePersistenceActiveMigrationValidated,
  qwenLocalSqlTestsPassed: result.runtimeFlags.qwenLocalSqlTestsPassed,
  deployPlanRequired: result.runtimeFlags.backendRuntimePersistenceActiveMigrationDeployPlanRequired,
  migrationDeployed: result.runtimeFlags.migrationDeployed,
  privateInvokeReady: result.runtimeFlags.privateInvokeReady,
  generatedLocalFixturePassedClaimed: result.runtimeFlags.generatedLocalFixturePassedClaimed,
  nextPrompt: result.nextPrompt,
}, null, 2))
