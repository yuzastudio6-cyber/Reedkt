import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_CREATE } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-create'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-plan'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_backend_runtime_persistence_active_migration_created_validation_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58BB-BACKEND-RUNTIME-PERSISTENCE-ACTIVE-MIGRATION-VALIDATE: validate active Qwen persistence migration in approved local harness, no deploy/no cloud/no assets/no beta'
const ACTIVE_MIGRATION =
  'supabase/migrations/20260629011700_qwen2_5_vl_backend_runtime_persistence.sql'

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
    'backendRuntimePersistenceActiveMigrationCreateRequired',
    'backendRuntimePersistenceActiveMigrationValidated',
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
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-create.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-create.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-plan.ts',
  'database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql',
  'database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql',
  ACTIVE_MIGRATION,
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const matchingMigrations = fs.readdirSync(path.join(ROOT, 'supabase/migrations')).filter((file) =>
  file.includes('qwen2_5_vl_backend_runtime_persistence'),
)
assert.deepEqual(matchingMigrations, [path.basename(ACTIVE_MIGRATION)], 'Exactly one Qwen active migration must exist.')

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-active-migration-create'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-active-migration-create-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-create.md')
for (const phrase of [
  DECISION,
  ACTIVE_MIGRATION,
  'supabase migration new qwen2_5_vl_backend_runtime_persistence',
  'draft-only warning banners',
  'Workers must execute approved snapshots, not raw chat.',
  '`backendRuntimePersistenceActiveMigrationCreateRequired=false`',
  '`qwenActiveMigrationCreated=true`',
  '`backendRuntimePersistenceActiveMigrationValidationRequired=true`',
  '`backendRuntimePersistenceActiveMigrationValidated=false`',
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
  'qwen25_vl_job_events_sanitized_payload_check',
  'qwen25_vl_worker_runtime_config_check',
  'qwen25_vl_worker_leases_refs_check',
  'qwen25_vl_backend_runtime_messages_sanitized_check',
  'qwen25_vl_job_claim_attempts_sanitized_check',
  "'Qwen/Qwen2.5-VL-7B-Instruct'",
  "'cc594898137f460bfe9f0759e9844b3ce807cfb5'",
  "'nvidia_l4'",
  "'bounded_preview_scale_to_zero'",
  "'qwen_vl'",
  'jobs_qwen_worker_type_idx',
  'jobs_qwen_approved_snapshot_ref_idx',
  'backend_runtime_messages_qwen_target_idx',
  'worker_leases_qwen_active_idx',
  'api_idempotency_keys_qwen_request_path_idx',
]) {
  assert.ok(migrationText.includes(phrase), `Active migration missing phrase: ${phrase}`)
}

const activeMigrationFindings = activeMigrationForbiddenPatterns
  .filter(([, pattern]) => pattern.test(migrationText))
  .map(([name]) => name)
assert.deepEqual(activeMigrationFindings, [], `Forbidden active migration content: ${activeMigrationFindings.join('; ')}`)

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-create.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-create.ts',
]) {
  assertNoForbiddenText(file)
}

const create = QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_CREATE
assert.equal(create.decision, DECISION)
assert.equal(
  create.upstreamActiveMigrationPlanDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_PLAN.decision,
)
assert.equal(create.activeMigration.createdBySupabaseCliMigrationNew, true)
assert.equal(create.activeMigration.migrationFile, ACTIVE_MIGRATION)
assert.equal(create.activeMigration.draftOnlyWarningsCopied, false)
assert.equal(create.activeMigration.baselineGuardPreserved, true)
assert.equal(create.activeMigration.constraintsPreserved, true)
assert.equal(create.activeMigration.indexesPreserved, true)
assert.equal(create.activeMigration.createsBaselineTables, false)
assert.equal(create.activeMigration.seedsRows, false)
assert.equal(create.activeMigration.deploysMigrationNow, false)
assert.equal(create.activeMigrationContentChecks.requiresApprovedPlanSnapshot, true)
assert.equal(create.activeMigrationContentChecks.requiresPrivateStorageObjectRecord, true)
assert.equal(create.activeMigrationContentChecks.selectedGpu, 'nvidia_l4')
assert.equal(create.activeMigrationContentChecks.servingProfile, 'bounded_preview_scale_to_zero')
assert.equal(create.sourceOfTruthRules.workersUseApprovedSnapshots, true)
assert.equal(create.sourceOfTruthRules.rawChatExecutionRejected, true)
assert.equal(create.sourceOfTruthRules.signedUrlsAsSourceOfTruthAllowed, false)
assert.equal(create.runtimeFlags.backendRuntimePersistenceActiveMigrationPlanRecorded, true)
assert.equal(create.runtimeFlags.qwenActiveMigrationCreated, true)
assert.equal(create.runtimeFlags.backendRuntimePersistenceActiveMigrationValidationRequired, true)
assertFalseFlags(create.runtimeFlags)
assert.equal(create.nextPrompt, NEXT_PROMPT)

const forbiddenDataFindings = scanValues({ create })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen active migration create data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: create.decision,
  activeMigrationFile: create.activeMigration.migrationFile,
  qwenActiveMigrationCreated: create.runtimeFlags.qwenActiveMigrationCreated,
  activeMigrationValidationRequired:
    create.runtimeFlags.backendRuntimePersistenceActiveMigrationValidationRequired,
  activeMigrationValidated: create.runtimeFlags.backendRuntimePersistenceActiveMigrationValidated,
  migrationDeployed: create.runtimeFlags.migrationDeployed,
  privateInvokeReady: create.runtimeFlags.privateInvokeReady,
  generatedLocalFixturePassedClaimed: create.runtimeFlags.generatedLocalFixturePassedClaimed,
  nextPrompt: create.nextPrompt,
}, null, 2))
