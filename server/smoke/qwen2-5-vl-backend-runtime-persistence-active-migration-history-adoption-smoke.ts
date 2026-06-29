import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_HISTORY_ADOPTION } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-history-adoption'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_HISTORY_RECONCILIATION } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-history-reconciliation'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_backend_runtime_persistence_active_migration_history_adopted_remote_version_local_validation_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58BH-BACKEND-RUNTIME-PERSISTENCE-ACTIVE-MIGRATION-ADOPTED-LOCAL-VALIDATION: validate adopted remote-version Qwen migration locally, no deploy/no assets/no beta'
const ADOPTED_MIGRATION =
  'supabase/migrations/20260628000100_qwen2_5_vl_backend_runtime_persistence.sql'
const SUPERSEDED_MIGRATION =
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
  ['concrete public URL', /\bhttps?:\/\/(?!127\.0\.0\.1\b|localhost\b)/i],
  [
    'signed URL token',
    /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i,
  ],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
  ['identity token assignment', /\b(identityToken|idToken|accessToken)\s*[:=]\s*['"][^'"]+['"]/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  [
    'unsafe deploy true claim',
    /\b(migrationDeployed|supabaseCloudMutationOccurred|stagingTouched|productionTouched|privateInvokeReady|betaReady|productionReady|inferenceRun|workersDispatched)\b\s*[:=]\s*(true|"true")/i,
  ],
  [
    'unsafe pass claim',
    /\b(dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i,
  ],
]

const forbiddenValuePatterns: Array<[string, RegExp]> = [
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase cloud hostname', /\bsupabase\.co\b/i],
  ['concrete public URL', /\bhttps?:\/\/(?!127\.0\.0\.1\b|localhost\b)/i],
  [
    'signed URL token',
    /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i,
  ],
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
    return Object.entries(value as JsonRecord).flatMap(([key, nested]) =>
      scanValues(nested, [...pathParts, key]),
    )
  }
  return []
}

function assertFalseFlags(flags: JsonRecord) {
  for (const key of [
    'backendRuntimePersistenceActiveMigrationDeployCommandRun',
    'backendRuntimePersistenceActiveMigrationDeployed',
    'migrationDeployed',
    'supabaseCloudMutationOccurred',
    'sqlMutationExecuted',
    'readUserRows',
    'stagingTouched',
    'productionTouched',
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
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-history-adoption.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-history-reconciliation.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-history-adoption.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-history-reconciliation.ts',
  ADOPTED_MIGRATION,
  TEST_SQL,
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

check(!fs.existsSync(path.join(ROOT, SUPERSEDED_MIGRATION)), 'Superseded local duplicate migration must be removed.')
check(!fs.existsSync(path.join(ROOT, 'supabase/.temp')), 'Supabase temp metadata must not be left behind.')
check(!fs.existsSync(path.join(ROOT, 'supabase/.branches')), 'Supabase branch metadata must not be left behind.')

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-active-migration-history-adoption'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-active-migration-history-adoption-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-history-adoption.md')
for (const phrase of [
  DECISION,
  ADOPTED_MIGRATION,
  SUPERSEDED_MIGRATION,
  TEST_SQL,
  'Remote semantic migration version adopted locally: `20260628000100`.',
  'Superseded local semantic duplicate removed: `20260629011700`.',
  '`backendRuntimePersistenceActiveMigrationHistoryAdoptionRecorded=true`',
  '`backendRuntimePersistenceActiveMigrationAdoptedFilePresent=true`',
  '`backendRuntimePersistenceActiveMigrationSupersededLocalVersionRemoved=true`',
  '`backendRuntimePersistenceActiveMigrationDuplicateSemanticHistoryAvoided=true`',
  '`backendRuntimePersistenceActiveMigrationAdoptedLocalValidationRequired=true`',
  '`backendRuntimePersistenceActiveMigrationDeployCommandRun=false`',
  '`migrationDeployed=false`',
  '`supabaseCloudMutationOccurred=false`',
  '`sqlMutationExecuted=false`',
  '`privateInvokeReady=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const adoptedMigrationText = read(ADOPTED_MIGRATION)
check(
  adoptedMigrationText.includes('migration version 20260628000100 to avoid duplicate Qwen persistence history'),
  'Adopted migration must record the history-adoption reason.',
)

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-history-adoption.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-history-adoption.ts',
]) {
  assertNoForbiddenText(file)
}

const result = QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_HISTORY_ADOPTION
assert.equal(result.decision, DECISION)
assert.equal(
  result.upstreamHistoryReconciliationDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_HISTORY_RECONCILIATION.decision,
)
assert.equal(result.adoptionResult.remoteSemanticMigrationVersionAdoptedLocally, '20260628000100')
assert.equal(result.adoptionResult.supersededLocalSemanticDuplicateRemoved, '20260629011700')
assert.equal(result.adoptionResult.adoptedActiveMigrationFilePresent, true)
assert.equal(result.adoptionResult.supersededLocalCandidateFilePresent, false)
assert.equal(result.adoptionResult.duplicateSemanticMigrationHistoryAvoided, true)
assert.equal(result.adoptionResult.adoptedLocalValidationRequired, true)
assert.equal(result.nextPrompt, NEXT_PROMPT)
assertFalseFlags(result.runtimeFlags)
assert.deepEqual(scanValues(result), [], 'Adoption spec must not contain forbidden runtime values')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      adoptedMigration: result.adoptionResult.remoteSemanticMigrationVersionAdoptedLocally,
      supersededLocalMigrationRemoved: true,
      localValidationRequired: result.adoptionResult.adoptedLocalValidationRequired,
      migrationDeployed: result.runtimeFlags.migrationDeployed,
      supabaseCloudMutationOccurred: result.runtimeFlags.supabaseCloudMutationOccurred,
      sqlMutationExecuted: result.runtimeFlags.sqlMutationExecuted,
      privateInvokeReady: result.runtimeFlags.privateInvokeReady,
      generatedLocalFixturePassedClaimed: result.runtimeFlags.generatedLocalFixturePassedClaimed,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
