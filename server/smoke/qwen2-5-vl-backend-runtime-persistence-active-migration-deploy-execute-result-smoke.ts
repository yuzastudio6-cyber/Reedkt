import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_DEPLOY_APPROVAL } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-deploy-approval'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_DEPLOY_EXECUTE_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-deploy-execute-result'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_backend_runtime_persistence_active_migration_deploy_execution_blocked_history_reconciliation_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58BF-BACKEND-RUNTIME-PERSISTENCE-ACTIVE-MIGRATION-HISTORY-RECONCILIATION: reconcile remote Qwen migration history before deploy, no cloud mutation/no assets/no beta'
const ACTIVE_MIGRATION =
  'supabase/migrations/20260629011700_qwen2_5_vl_backend_runtime_persistence.sql'
const REMOTE_QWEN_VERSION = '20260628000100'
const LOCAL_QWEN_VERSION = '20260629011700'

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
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
  ['identity token assignment', /\b(identityToken|idToken|accessToken)\s*[:=]\s*['"][^'"]+['"]/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['project ref evidence', /\b[a-z]{20}\b/],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  ['unsafe deploy true claim', /\b(migrationDeployed|supabaseCloudMutationOccurred|stagingTouched|productionTouched|privateInvokeReady|betaReady|productionReady|inferenceRun|workersDispatched)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe pass claim', /\b(dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i],
]

const forbiddenValuePatterns: Array<[string, RegExp]> = [
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase cloud hostname', /\bsupabase\.co\b/i],
  ['concrete public URL', /\bhttps?:\/\/(?!127\.0\.0\.1\b|localhost\b)/i],
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
    'backendRuntimePersistenceActiveMigrationDeployExecutionAttempted',
    'backendRuntimePersistenceActiveMigrationDeployCommandRun',
    'backendRuntimePersistenceActiveMigrationDeployDryRunRun',
    'backendRuntimePersistenceActiveMigrationDeployed',
    'migrationDeployed',
    'supabaseCloudMutationOccurred',
    'stagingTouched',
    'productionTouched',
    'sqlExecuted',
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
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-deploy-execute-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-deploy-approval.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-deploy-execute-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-deploy-approval.ts',
  ACTIVE_MIGRATION,
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

check(!fs.existsSync(path.join(ROOT, 'supabase/.temp')), 'Supabase temp metadata must not be left behind.')
check(!fs.existsSync(path.join(ROOT, 'supabase/.branches')), 'Supabase branch metadata must not be left behind.')

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-active-migration-deploy-execute-result'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-active-migration-deploy-execute-result-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-deploy-execute-result.md')
for (const phrase of [
  DECISION,
  ACTIVE_MIGRATION,
  REMOTE_QWEN_VERSION,
  LOCAL_QWEN_VERSION,
  'Supabase connector metadata listed migrations on the active ReEditPro project and both preview branches.',
  'Deployment was blocked before any deploy command because the remote migration history and local migration files are not reconciled',
  'Applying another semantically identical Qwen migration without reconciliation risks duplicate migration history',
  '`backendRuntimePersistenceActiveMigrationDeployExecutionPreflightRecorded=true`',
  '`backendRuntimePersistenceActiveMigrationDeployExecutionAttempted=false`',
  '`backendRuntimePersistenceActiveMigrationDeployCommandRun=false`',
  '`backendRuntimePersistenceActiveMigrationDeployHistoryReconciliationRequired=true`',
  '`backendRuntimePersistenceActiveMigrationRemoteQwenMigrationObserved=true`',
  '`backendRuntimePersistenceActiveMigrationRemoteQwenVersion=20260628000100`',
  '`backendRuntimePersistenceActiveMigrationLocalValidatedVersion=20260629011700`',
  '`backendRuntimePersistenceActiveMigrationDeployed=false`',
  '`migrationDeployed=false`',
  '`supabaseCloudMutationOccurred=false`',
  '`sqlExecuted=false`',
  '`privateInvokeReady=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-deploy-execute-result.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-deploy-execute-result.ts',
]) {
  assertNoForbiddenText(file)
}

const result = QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_DEPLOY_EXECUTE_RESULT
assert.equal(result.decision, DECISION)
assert.equal(
  result.upstreamActiveMigrationDeployApprovalDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_DEPLOY_APPROVAL.decision,
)
assert.equal(result.preflight.supabaseCliVersion, '2.105.0')
assert.equal(result.preflight.supabaseCliHelpInspected, true)
assert.equal(result.preflight.supabaseMetadataProjectsListed, true)
assert.equal(result.preflight.supabaseMetadataBranchesListed, true)
assert.equal(result.preflight.supabaseMetadataMigrationsListed, true)
assert.equal(result.preflight.supabaseCliDeployCommandRun, false)
assert.equal(result.preflight.supabaseDbPushRun, false)
assert.equal(result.preflight.sqlExecutorUsed, false)
assert.equal(result.migrationStatus.localValidatedMigrationVersion, LOCAL_QWEN_VERSION)
assert.equal(result.migrationStatus.activeProjectRemoteQwenMigrationObserved, true)
assert.equal(result.migrationStatus.activeProjectRemoteQwenMigrationVersion, REMOTE_QWEN_VERSION)
assert.equal(result.migrationStatus.localRemoteMigrationFilePresent, false)
assert.equal(result.migrationStatus.previewBranchesHavePartialBaselineHistories, true)
assert.equal(result.migrationStatus.previewBranchesContainValidatedMigration, false)
assert.equal(result.deployDecision.mayDeployNow, false)
assert.equal(result.deployDecision.deployBlockedBeforeCommand, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceActiveMigrationDeployExecutionPreflightRecorded, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceActiveMigrationDeployHistoryReconciliationRequired, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceActiveMigrationRemoteQwenMigrationObserved, true)
assertFalseFlags(result.runtimeFlags)
assert.equal(result.nextPrompt, NEXT_PROMPT)

const forbiddenDataFindings = scanValues({ result })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden value in deploy execute result data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      localValidatedMigrationVersion: result.migrationStatus.localValidatedMigrationVersion,
      remoteQwenMigrationVersion: result.migrationStatus.activeProjectRemoteQwenMigrationVersion,
      deployBlockedReason: result.migrationStatus.deployBlockedReason,
      deployCommandRun: result.runtimeFlags.backendRuntimePersistenceActiveMigrationDeployCommandRun,
      migrationDeployed: result.runtimeFlags.migrationDeployed,
      sqlExecuted: result.runtimeFlags.sqlExecuted,
      privateInvokeReady: result.runtimeFlags.privateInvokeReady,
      generatedLocalFixturePassedClaimed: result.runtimeFlags.generatedLocalFixturePassedClaimed,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
