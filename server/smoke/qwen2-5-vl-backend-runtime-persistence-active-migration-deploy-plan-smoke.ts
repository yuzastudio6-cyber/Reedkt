import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_DEPLOY_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-deploy-plan'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_VALIDATION_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-validation-result'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_backend_runtime_persistence_active_migration_deploy_plan_recorded_deploy_approval_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58BD-BACKEND-RUNTIME-PERSISTENCE-ACTIVE-MIGRATION-DEPLOY-APPROVAL: approve deployment target for validated Qwen persistence migration, no deploy/no cloud/no assets/no beta'
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
    'backendRuntimePersistenceActiveMigrationDeploymentTargetApproved',
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
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-deploy-plan.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-validation-result.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-deploy-plan.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-validation-result.ts',
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
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-active-migration-deploy-plan'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-active-migration-deploy-plan-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-deploy-plan.md')
for (const phrase of [
  DECISION,
  ACTIVE_MIGRATION,
  TEST_SQL,
  '`20260629011700`',
  '`nvidia_l4`',
  '`bounded_preview_scale_to_zero`',
  'Supabase deployment documentation and changelog were inspected',
  'Data API exposure/grant expectations',
  'No rollback command or migration was created by this plan.',
  '`backendRuntimePersistenceActiveMigrationDeployPlanRecorded=true`',
  '`backendRuntimePersistenceActiveMigrationDeployApprovalRequired=true`',
  '`backendRuntimePersistenceActiveMigrationDeploymentTargetApproved=false`',
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
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-deploy-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-active-migration-deploy-plan.ts',
]) {
  assertNoForbiddenText(file)
}

const plan = QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_DEPLOY_PLAN
assert.equal(plan.decision, DECISION)
assert.equal(
  plan.upstreamActiveMigrationValidationDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_VALIDATION_RESULT.decision,
)
assert.equal(plan.deploymentCandidate.migrationFile, ACTIVE_MIGRATION)
assert.equal(plan.deploymentCandidate.migrationHistoryVersion, '20260629011700')
assert.equal(plan.deploymentCandidate.activeMigrationLocallyValidated, true)
assert.equal(plan.deploymentCandidate.activeMigrationLocallyApplied, true)
assert.equal(plan.deploymentCandidate.qwenLocalSqlTestsPassed, true)
assert.equal(plan.deploymentCandidate.selectedGpu, 'nvidia_l4')
assert.equal(plan.deploymentCandidate.servingProfile, 'bounded_preview_scale_to_zero')
assert.equal(plan.futureDeploymentPreconditions.deploymentTargetRequiresOwnerApproval, true)
assert.equal(plan.futureDeploymentPreconditions.deploymentTargetApprovedNow, false)
assert.equal(plan.futureDeploymentPreconditions.advisorsRequiredBeforeDeployWhereAvailable, true)
assert.equal(plan.futureDeploymentPreconditions.rollbackPlanRequired, true)
assert.equal(plan.futureDeploymentPreconditions.dataApiExposureMustRemainUnchanged, true)
assert.equal(plan.futureDeploymentPreconditions.localDefaultSecretsRecordedInRepo, false)
assert.equal(plan.futureCommandPlan.commandsAreFutureOnlyExamples, true)
assert.equal(plan.futureCommandPlan.mayRunSupabaseLoginNow, false)
assert.equal(plan.futureCommandPlan.mayRunSupabaseLinkNow, false)
assert.equal(plan.futureCommandPlan.mayRunSupabaseDbPushNow, false)
assert.equal(plan.futureCommandPlan.mayRunSupabaseMigrationUpNow, false)
assert.equal(plan.futureCommandPlan.mayRunSqlNow, false)
assert.equal(plan.futureCommandPlan.mayTouchCloudNow, false)
assert.equal(plan.deployScope.validatedActiveMigrationOnly, true)
assert.equal(plan.deployScope.createsNewTables, false)
assert.equal(plan.deployScope.seedsRows, false)
assert.equal(plan.deployScope.createsWorkerRuntimeConfigRows, false)
assert.equal(plan.deployScope.createsToolCapabilityRows, false)
assert.equal(plan.deployScope.enablesPrivateInvoke, false)
assert.equal(plan.deployScope.enablesBeta, false)
assert.equal(plan.deployScope.enablesProduction, false)
assert.equal(plan.runtimeFlags.backendRuntimePersistenceActiveMigrationDeployPlanRecorded, true)
assert.equal(plan.runtimeFlags.backendRuntimePersistenceActiveMigrationDeployApprovalRequired, true)
assertFalseFlags(plan.runtimeFlags)
assert.equal(plan.nextPrompt, NEXT_PROMPT)

const forbiddenDataFindings = scanValues({ plan })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden value in deploy plan data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: plan.decision,
      migrationFile: plan.deploymentCandidate.migrationFile,
      migrationHistoryVersion: plan.deploymentCandidate.migrationHistoryVersion,
      deployPlanRecorded: plan.runtimeFlags.backendRuntimePersistenceActiveMigrationDeployPlanRecorded,
      deployApprovalRequired: plan.runtimeFlags.backendRuntimePersistenceActiveMigrationDeployApprovalRequired,
      migrationDeployed: plan.runtimeFlags.migrationDeployed,
      supabaseCloudTouched: plan.runtimeFlags.supabaseCloudTouched,
      privateInvokeReady: plan.runtimeFlags.privateInvokeReady,
      generatedLocalFixturePassedClaimed: plan.runtimeFlags.generatedLocalFixturePassedClaimed,
      nextPrompt: plan.nextPrompt,
    },
    null,
    2,
  ),
)
