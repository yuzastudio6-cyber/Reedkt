import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_ADOPTED_LOCAL_VALIDATION } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-adopted-local-validation'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_HISTORY_RECONCILIATION } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-history-reconciliation'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_REMOTE_SATISFACTION_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-remote-satisfaction-review'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_backend_runtime_persistence_active_migration_remote_satisfaction_review_accepted_no_deploy_runtime_dispatch_readiness_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58BJ-RUNTIME-PERSISTENCE-TO-WORKER-DISPATCH-READINESS-REVIEW: review persisted Qwen worker dispatch readiness, no invocation/no assets/no beta'
const ADOPTED_MIGRATION =
  'supabase/migrations/20260628000100_qwen2_5_vl_backend_runtime_persistence.sql'
const SUPERSEDED_MIGRATION =
  'supabase/migrations/20260629011700_qwen2_5_vl_backend_runtime_persistence.sql'
const REVIEW_DOC =
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-remote-satisfaction-review.md'
const REVIEW_SPEC =
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-remote-satisfaction-review.ts'

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
    'unsafe runtime true claim',
    /\b(privateInvokeReady|betaReady|productionReady|inferenceRun|workersDispatched|supabaseCloudTouched|stagingTouched|productionTouched)\b\s*[:=]\s*(true|"true")/i,
  ],
  [
    'unsafe pass claim',
    /\b(dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i,
  ],
]

const activeMigrationForbiddenPatterns: Array<[string, RegExp]> = [
  ['draft-only banner', /MIGRATION DRAFT ONLY|DO NOT RUN|DO NOT APPLY/i],
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase cloud hostname', /\bsupabase\.co\b/i],
  [
    'signed URL token',
    /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i,
  ],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
  ['credential assignment', /\b(api[_-]?key|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
]

const forbiddenValuePatterns: Array<[string, RegExp]> = [
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase cloud hostname', /\bsupabase\.co\b/i],
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
    'backendRuntimePersistenceActiveMigrationDeployCommandRequiredNow',
    'backendRuntimePersistenceActiveMigrationDeployCommandRun',
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
  REVIEW_DOC,
  REVIEW_SPEC,
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-history-reconciliation.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-history-adoption.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-adopted-local-validation.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-history-reconciliation.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-history-adoption.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-adopted-local-validation.ts',
  ADOPTED_MIGRATION,
  'database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

check(!fs.existsSync(path.join(ROOT, SUPERSEDED_MIGRATION)), 'Superseded local duplicate migration must stay removed.')
check(!fs.existsSync(path.join(ROOT, 'supabase/.temp')), 'Supabase temp metadata must not be present.')
check(!fs.existsSync(path.join(ROOT, 'supabase/.branches')), 'Supabase branch metadata must not be present.')

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-active-migration-remote-satisfaction-review'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-active-migration-remote-satisfaction-review-smoke.ts',
  'package script mismatch',
)

const doc = read(REVIEW_DOC)
for (const phrase of [
  DECISION,
  ADOPTED_MIGRATION,
  SUPERSEDED_MIGRATION,
  '`20260628000100`',
  'Remote schema equivalence for required Qwen guards and indexes: true',
  'Required remote constraints observed: 7',
  'Required remote indexes observed: 5',
  'Adopted local migration validation passed: true',
  'Superseded local duplicate history observed: false',
  'Qwen local SQL tests passed: true',
  '`deployCommandRequiredNow=false`',
  '`deployCommandRun=false`',
  '`migrationDeployed=false`',
  '`backendRuntimePersistenceActiveMigrationRemoteSatisfactionReviewRecorded=true`',
  '`backendRuntimePersistenceActiveMigrationRemoteSatisfied=true`',
  '`backendRuntimePersistenceActiveMigrationNoDeployAccepted=true`',
  '`backendRuntimePersistenceActiveMigrationDeployCommandRequiredNow=false`',
  '`persistedWorkerDispatchReadinessReviewRequired=true`',
  '`privateInvokeReady=false`',
  '`workersDispatched=false`',
  '`supabaseCloudTouched=false`',
  '`dryRunPassedClaimed=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const migrationText = read(ADOPTED_MIGRATION)
for (const phrase of [
  'Qwen2.5-VL backend runtime persistence guards.',
  'migration version 20260628000100 to avoid duplicate Qwen persistence history',
  'QWEN2_5_VL_REQUIRES_REEDITPRO_RUNTIME_BASELINE',
  'qwen25_vl_jobs_payload_refs_check',
  'qwen25_vl_worker_runtime_config_check',
  "'Qwen/Qwen2.5-VL-7B-Instruct'",
  "'cc594898137f460bfe9f0759e9844b3ce807cfb5'",
  "'nvidia_l4'",
  "'bounded_preview_scale_to_zero'",
  "'qwen_vl'",
]) {
  assert.ok(migrationText.includes(phrase), `Adopted active migration missing phrase: ${phrase}`)
}
const activeMigrationFindings = activeMigrationForbiddenPatterns
  .filter(([, pattern]) => pattern.test(migrationText))
  .map(([name]) => name)
assert.deepEqual(
  activeMigrationFindings,
  [],
  `Forbidden active migration content: ${activeMigrationFindings.join('; ')}`,
)

for (const file of [REVIEW_DOC, REVIEW_SPEC]) {
  assertNoForbiddenText(file)
}

const review = QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_REMOTE_SATISFACTION_REVIEW
assert.equal(review.decision, DECISION)
assert.equal(
  review.upstreamHistoryReconciliationDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_HISTORY_RECONCILIATION.decision,
)
assert.equal(
  review.upstreamAdoptedLocalValidationDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_ADOPTED_LOCAL_VALIDATION.decision,
)
assert.equal(review.satisfactionEvidence.remoteSemanticMigrationVersionObserved, '20260628000100')
assert.equal(review.satisfactionEvidence.remoteSchemaEquivalentForRequiredGuards, true)
assert.equal(review.satisfactionEvidence.requiredRemoteConstraintCountObserved, 7)
assert.equal(review.satisfactionEvidence.requiredRemoteIndexCountObserved, 5)
assert.equal(review.satisfactionEvidence.adoptedRepoMigrationVersion, '20260628000100')
assert.equal(review.satisfactionEvidence.supersededLocalDuplicateVersionRemoved, '20260629011700')
assert.equal(review.satisfactionEvidence.adoptedLocalValidationPassed, true)
assert.equal(review.satisfactionEvidence.qwenLocalSqlTestsPassed, true)
assert.equal(review.noDeployDecision.remoteSatisfied, true)
assert.equal(review.noDeployDecision.noDeployAccepted, true)
assert.equal(review.noDeployDecision.deployCommandRequiredNow, false)
assert.equal(review.noDeployDecision.deployCommandRun, false)
assert.equal(review.noDeployDecision.migrationDeployed, false)
assert.equal(review.runtimeFlags.backendRuntimePersistenceActiveMigrationRemoteSatisfactionReviewRecorded, true)
assert.equal(review.runtimeFlags.backendRuntimePersistenceActiveMigrationRemoteSatisfied, true)
assert.equal(review.runtimeFlags.backendRuntimePersistenceActiveMigrationNoDeployAccepted, true)
assert.equal(review.runtimeFlags.persistedWorkerDispatchReadinessReviewRequired, true)
assertFalseFlags(review.runtimeFlags)
assert.deepEqual(scanValues(review), [], 'Remote satisfaction review spec must not contain forbidden runtime values')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: review.decision,
      remoteSatisfied: review.noDeployDecision.remoteSatisfied,
      noDeployAccepted: review.noDeployDecision.noDeployAccepted,
      deployCommandRequiredNow: review.noDeployDecision.deployCommandRequiredNow,
      migrationDeployed: review.runtimeFlags.migrationDeployed,
      privateInvokeReady: review.runtimeFlags.privateInvokeReady,
      persistedWorkerDispatchReadinessReviewRequired:
        review.runtimeFlags.persistedWorkerDispatchReadinessReviewRequired,
      generatedLocalFixturePassedClaimed: review.runtimeFlags.generatedLocalFixturePassedClaimed,
      nextPrompt: review.nextPrompt,
    },
    null,
    2,
  ),
)
