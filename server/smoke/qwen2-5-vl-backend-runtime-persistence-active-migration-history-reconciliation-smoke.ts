import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_DEPLOY_EXECUTE_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-deploy-execute-result'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_HISTORY_RECONCILIATION } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-history-reconciliation'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_backend_runtime_persistence_active_migration_history_reconciled_remote_schema_equivalent_local_history_alignment_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58BG-BACKEND-RUNTIME-PERSISTENCE-ACTIVE-MIGRATION-HISTORY-ADOPTION: align local Qwen active migration history with remote 20260628000100, no deploy/no assets/no beta'
const LOCAL_MIGRATION =
  'supabase/migrations/20260629011700_qwen2_5_vl_backend_runtime_persistence.sql'
const REMOTE_MIGRATION =
  'supabase/migrations/20260628000100_qwen2_5_vl_backend_runtime_persistence.sql'
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
  ['project ref evidence', /\b[a-z]{20}\b/],
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
    return Object.entries(value as JsonRecord)
      .flatMap(([key, nested]) => scanValues(nested, [...pathParts, key]))
  }
  return []
}

function assertFalseFlags(flags: JsonRecord) {
  for (const key of [
    'backendRuntimePersistenceActiveMigrationDeployExecutionAttempted',
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
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-history-reconciliation.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-deploy-execute-result.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-history-reconciliation.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-deploy-execute-result.ts',
  LOCAL_MIGRATION,
  TEST_SQL,
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

check(!fs.existsSync(path.join(ROOT, REMOTE_MIGRATION)), 'Remote semantic migration file must still be absent until adoption.')
check(!fs.existsSync(path.join(ROOT, 'supabase/.temp')), 'Supabase temp metadata must not be left behind.')
check(!fs.existsSync(path.join(ROOT, 'supabase/.branches')), 'Supabase branch metadata must not be left behind.')

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-active-migration-history-reconciliation'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-active-migration-history-reconciliation-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-history-reconciliation.md')
for (const phrase of [
  DECISION,
  LOCAL_MIGRATION,
  TEST_SQL,
  'Active ReEditPro Supabase project metadata still reports semantic migration `qwen2_5_vl_backend_runtime_persistence` at remote version `20260628000100`.',
  'A read-only metadata query inspected constraint and index names/definitions only.',
  '`qwen25_vl_jobs_payload_refs_check`',
  '`qwen25_vl_job_events_sanitized_payload_check`',
  '`qwen25_vl_worker_runtime_config_check`',
  '`qwen25_vl_worker_leases_refs_check`',
  '`qwen25_vl_backend_runtime_messages_sanitized_check`',
  '`qwen25_vl_job_claim_attempts_sanitized_check`',
  '`tool_runtime_checks_tool_name_check` including `qwen_vl`',
  '`jobs_qwen_worker_type_idx`',
  '`jobs_qwen_approved_snapshot_ref_idx`',
  '`backend_runtime_messages_qwen_target_idx`',
  '`worker_leases_qwen_active_idx`',
  '`api_idempotency_keys_qwen_request_path_idx`',
  'Do not deploy `20260629011700_qwen2_5_vl_backend_runtime_persistence.sql` now.',
  '`backendRuntimePersistenceActiveMigrationHistoryReconciliationRecorded=true`',
  '`backendRuntimePersistenceActiveMigrationReadOnlySqlMetadataQueryExecuted=true`',
  '`backendRuntimePersistenceActiveMigrationRemoteSchemaEquivalentForRequiredGuards=true`',
  '`backendRuntimePersistenceActiveMigrationRemoteMigrationFilePresentLocally=false`',
  '`backendRuntimePersistenceActiveMigrationLocalHistoryAlignmentRequired=true`',
  '`backendRuntimePersistenceActiveMigrationDeployShouldBeSkippedNow=true`',
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

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-history-reconciliation.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-history-reconciliation.ts',
]) {
  assertNoForbiddenText(file)
}

const result = QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_HISTORY_RECONCILIATION
assert.equal(result.decision, DECISION)
assert.equal(
  result.upstreamDeployExecuteDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_DEPLOY_EXECUTE_RESULT.decision,
)
assert.equal(result.metadataChecks.activeProjectMigrationsRechecked, true)
assert.equal(result.metadataChecks.activeProjectRemoteQwenMigrationObserved, true)
assert.equal(result.metadataChecks.activeProjectRemoteQwenMigrationVersion, '20260628000100')
assert.equal(result.metadataChecks.localValidatedMigrationVersion, '20260629011700')
assert.equal(result.metadataChecks.localRemoteMigrationFilePresent, false)
assert.equal(result.metadataChecks.gitHistoryContainsRemoteMigrationFile, false)
assert.equal(result.metadataChecks.gitRefsContainRemoteMigrationFile, false)
assert.equal(result.metadataChecks.readOnlySqlMetadataQueryExecuted, true)
assert.equal(result.metadataChecks.readOnlySqlMetadataOnly, true)
assert.equal(result.metadataChecks.sqlMutationExecuted, false)
assert.equal(result.remoteSchemaEquivalence.requiredConstraintCount, 7)
assert.equal(result.remoteSchemaEquivalence.observedConstraintNames.length, 7)
assert.equal(result.remoteSchemaEquivalence.requiredIndexCount, 5)
assert.equal(result.remoteSchemaEquivalence.observedIndexNames.length, 5)
assert.equal(result.remoteSchemaEquivalence.qwenWorkerPayloadGuardObserved, true)
assert.equal(result.remoteSchemaEquivalence.qwenToolRuntimeCheckAllowanceObserved, true)
assert.equal(result.remoteSchemaEquivalence.selectedGpuObserved, 'nvidia_l4')
assert.equal(result.remoteSchemaEquivalence.servingProfileObserved, 'bounded_preview_scale_to_zero')
assert.equal(result.remoteSchemaEquivalence.remoteSchemaEquivalentForRequiredGuards, true)
assert.equal(result.remoteSchemaEquivalence.exactRemoteMigrationSqlTextRecovered, false)
assert.equal(result.reconciliationDecision.mayDeployLocalValidatedMigrationNow, false)
assert.equal(result.reconciliationDecision.shouldSkipLocalValidatedMigrationDeployNow, true)
assert.equal(result.reconciliationDecision.localHistoryAlignmentRequired, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceActiveMigrationHistoryReconciliationRecorded, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceActiveMigrationRemoteMetadataRechecked, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceActiveMigrationReadOnlySqlMetadataQueryExecuted, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceActiveMigrationRemoteSchemaEquivalentForRequiredGuards, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceActiveMigrationLocalHistoryAlignmentRequired, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceActiveMigrationDeployShouldBeSkippedNow, true)
assertFalseFlags(result.runtimeFlags)
assert.equal(result.nextPrompt, NEXT_PROMPT)

const forbiddenDataFindings = scanValues({ result })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden value in history reconciliation data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      remoteQwenMigrationVersion: result.metadataChecks.activeProjectRemoteQwenMigrationVersion,
      localValidatedMigrationVersion: result.metadataChecks.localValidatedMigrationVersion,
      remoteSchemaEquivalentForRequiredGuards:
        result.remoteSchemaEquivalence.remoteSchemaEquivalentForRequiredGuards,
      shouldSkipLocalValidatedMigrationDeployNow:
        result.reconciliationDecision.shouldSkipLocalValidatedMigrationDeployNow,
      localHistoryAlignmentRequired: result.reconciliationDecision.localHistoryAlignmentRequired,
      migrationDeployed: result.runtimeFlags.migrationDeployed,
      sqlMutationExecuted: result.runtimeFlags.sqlMutationExecuted,
      privateInvokeReady: result.runtimeFlags.privateInvokeReady,
      generatedLocalFixturePassedClaimed: result.runtimeFlags.generatedLocalFixturePassedClaimed,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
