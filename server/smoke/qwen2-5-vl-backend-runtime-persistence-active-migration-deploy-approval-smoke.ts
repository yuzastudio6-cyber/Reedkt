import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_DEPLOY_APPROVAL } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-deploy-approval'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_DEPLOY_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-deploy-plan'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_backend_runtime_persistence_active_migration_deploy_approval_recorded_deploy_execution_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58BE-BACKEND-RUNTIME-PERSISTENCE-ACTIVE-MIGRATION-DEPLOY-EXECUTE: deploy validated Qwen persistence migration to approved Supabase target, no assets/no beta'
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
  ['concrete public URL', /\bhttps?:\/\/(?!127\.0\.0\.1\b|localhost\b)/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
  ['identity token assignment', /\b(identityToken|idToken|accessToken)\s*[:=]\s*['"][^'"]+['"]/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  ['unsafe deploy true claim', /\b(migrationDeployed|supabaseCloudTouched|stagingTouched|productionTouched|privateInvokeReady|betaReady|productionReady|inferenceRun|workersDispatched)\b\s*[:=]\s*(true|"true")/i],
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
    'backendRuntimePersistenceActiveMigrationDeployed',
    'migrationDeployed',
    'supabaseCloudTouched',
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
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-deploy-approval.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-deploy-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-deploy-approval.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-deploy-plan.ts',
  ACTIVE_MIGRATION,
  TEST_SQL,
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

check(!fs.existsSync(path.join(ROOT, 'supabase/.temp')), 'Supabase temp metadata must not be left behind.')
check(!fs.existsSync(path.join(ROOT, 'supabase/.branches')), 'Supabase branch metadata must not be left behind.')

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-active-migration-deploy-approval'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-active-migration-deploy-approval-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-deploy-approval.md')
for (const phrase of [
  DECISION,
  ACTIVE_MIGRATION,
  TEST_SQL,
  '`20260629011700`',
  '`nvidia_l4`',
  '`bounded_preview_scale_to_zero`',
  'Approved target class: ReEditPro owner-approved Supabase cloud project for backend runtime persistence.',
  'Project reference stored in repo evidence: false.',
  'This approval is intentionally target-class approval rather than a credential or connection record.',
  'Data API exposure is checked to remain unchanged because this migration adds no new tables',
  '`backendRuntimePersistenceActiveMigrationDeployApprovalRecorded=true`',
  '`backendRuntimePersistenceActiveMigrationDeployApprovalRequired=false`',
  '`backendRuntimePersistenceActiveMigrationDeploymentTargetApproved=true`',
  '`backendRuntimePersistenceActiveMigrationDeployExecutionRequired=true`',
  '`backendRuntimePersistenceActiveMigrationDeployed=false`',
  '`migrationDeployed=false`',
  '`supabaseCloudTouched=false`',
  '`privateInvokeReady=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-deploy-approval.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-deploy-approval.ts',
]) {
  assertNoForbiddenText(file)
}

const approval = QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_DEPLOY_APPROVAL
assert.equal(approval.decision, DECISION)
assert.equal(
  approval.upstreamActiveMigrationDeployPlanDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_DEPLOY_PLAN.decision,
)
assert.equal(approval.approvedDeploymentTarget.projectRefResolvedNow, false)
assert.equal(approval.approvedDeploymentTarget.projectRefStoredInRepoEvidence, false)
assert.equal(approval.approvedDeploymentTarget.credentialsStoredInRepoEvidence, false)
assert.equal(approval.approvedMigration.migrationFile, ACTIVE_MIGRATION)
assert.equal(approval.approvedMigration.migrationHistoryVersion, '20260629011700')
assert.equal(approval.approvedMigration.activeMigrationLocallyValidated, true)
assert.equal(approval.approvedMigration.qwenLocalSqlTestsPassed, true)
assert.equal(approval.approvedMigration.selectedGpu, 'nvidia_l4')
assert.equal(approval.futureExecutionPreconditions.targetProjectMustBeConfirmedAtExecutionTime, true)
assert.equal(approval.futureExecutionPreconditions.migrationStatusMustBeInspectedBeforeDeploy, true)
assert.equal(approval.futureExecutionPreconditions.dataApiExposureMustRemainUnchanged, true)
assert.equal(approval.futureExecutionPreconditions.mayRunSupabaseLoginNow, false)
assert.equal(approval.futureExecutionPreconditions.mayRunSupabaseLinkNow, false)
assert.equal(approval.futureExecutionPreconditions.mayRunSupabaseDbPushNow, false)
assert.equal(approval.futureExecutionPreconditions.mayRunSqlNow, false)
assert.equal(approval.futureExecutionPreconditions.mayTouchCloudNow, false)
assert.equal(approval.approvedDeployScope.validatedActiveMigrationOnly, true)
assert.equal(approval.approvedDeployScope.createsNewTables, false)
assert.equal(approval.approvedDeployScope.seedsRows, false)
assert.equal(approval.approvedDeployScope.enablesPrivateInvoke, false)
assert.equal(approval.approvedDeployScope.enablesBeta, false)
assert.equal(approval.approvedDeployScope.enablesProduction, false)
assert.equal(approval.runtimeFlags.backendRuntimePersistenceActiveMigrationDeployApprovalRecorded, true)
assert.equal(approval.runtimeFlags.backendRuntimePersistenceActiveMigrationDeployApprovalRequired, false)
assert.equal(approval.runtimeFlags.backendRuntimePersistenceActiveMigrationDeploymentTargetApproved, true)
assert.equal(approval.runtimeFlags.backendRuntimePersistenceActiveMigrationDeployExecutionRequired, true)
assertFalseFlags(approval.runtimeFlags)
assert.equal(approval.nextPrompt, NEXT_PROMPT)

const forbiddenDataFindings = scanValues({ approval })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden value in deploy approval data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: approval.decision,
      migrationFile: approval.approvedMigration.migrationFile,
      migrationHistoryVersion: approval.approvedMigration.migrationHistoryVersion,
      deploymentTargetApproved: approval.runtimeFlags.backendRuntimePersistenceActiveMigrationDeploymentTargetApproved,
      deployExecutionRequired: approval.runtimeFlags.backendRuntimePersistenceActiveMigrationDeployExecutionRequired,
      migrationDeployed: approval.runtimeFlags.migrationDeployed,
      supabaseCloudTouched: approval.runtimeFlags.supabaseCloudTouched,
      privateInvokeReady: approval.runtimeFlags.privateInvokeReady,
      generatedLocalFixturePassedClaimed: approval.runtimeFlags.generatedLocalFixturePassedClaimed,
      nextPrompt: approval.nextPrompt,
    },
    null,
    2,
  ),
)
