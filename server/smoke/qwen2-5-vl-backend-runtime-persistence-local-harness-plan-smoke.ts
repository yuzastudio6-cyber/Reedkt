import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-plan'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_VALIDATION_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-validation-result'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_backend_runtime_persistence_local_harness_plan_recorded_config_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58R-BACKEND-RUNTIME-PERSISTENCE-LOCAL-HARNESS-CONFIG-CREATE: create safe local Supabase config for Qwen persistence validation, no SQL/no deploy/no cloud/no assets/no beta'

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
  ['unsafe config true claim', /\b(configTomlCreated|approvedLocalHarnessExists|activeMigrationCreated|draftSqlApplied|localSqlTestsExecuted|supabaseCliExecuted|dockerStarted|localDatabaseCreated|localDatabaseDropped)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe runtime true claim', /\b(realJobCreated|realLeaseClaimed|idempotencyRowCreated|workerClaimCreated|jobEventCreated|backendRuntimeMessageCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|serviceUrlResolvedNow|audienceResolvedNow|identityTokenFetched|authHeaderCreated|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
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

function collectUrls(text: string): string[] {
  return text.match(/\bhttps?:\/\/[^\s"',\]]+/gi) ?? []
}

function assertConfigTextSafeIfPresent() {
  const configPath = path.join(ROOT, 'supabase/config.toml')
  if (!fs.existsSync(configPath)) return
  const text = fs.readFileSync(configPath, 'utf8')
  const findings = forbiddenConcretePatterns
    .filter(([name, pattern]) => name !== 'concrete URL' && pattern.test(text))
    .map(([name]) => name)
  const nonLoopbackUrls = collectUrls(text).filter((url) => {
    try {
      const parsed = new URL(url)
      return parsed.hostname !== '127.0.0.1' && parsed.hostname !== 'localhost'
    } catch {
      return true
    }
  })
  findings.push(...nonLoopbackUrls.map((url) => `non-loopback URL ${url}`))
  assert.deepEqual(findings, [], `Forbidden value in supabase/config.toml: ${findings.join('; ')}`)
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
    'configTomlCreated',
    'approvedLocalHarnessExists',
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
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-plan.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-validation-result.md',
  'database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql',
  'database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-plan.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-validation-result.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

check(
  !fs.existsSync(path.join(ROOT, 'supabase/migrations/024_qwen2_5_vl_backend_runtime_persistence.sql')),
  'Qwen active migration must not exist.',
)
check(
  !fs.existsSync(path.join(ROOT, 'supabase/migrations/999_qwen2_5_vl_backend_runtime_persistence.sql')),
  'Qwen active migration must not exist.',
)
assertConfigTextSafeIfPresent()

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-plan'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-plan-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-plan.md')
for (const phrase of [
  DECISION,
  '`supabase/config.toml`',
  'plain PostgreSQL without Supabase platform schemas and ReEditPro migrations is not enough',
  'Repo-local Supabase harness config',
  'Plain local PostgreSQL',
  'Cloud, staging, production, or live data',
  'Manual platform stubs',
  '`approved_plan_snapshots`',
  '`credit_reservations`',
  '`jobs`',
  '`job_events`',
  '`worker_runtime_configs`',
  '`worker_leases`',
  '`backend_runtime_messages`',
  '`job_claim_attempts`',
  '`api_idempotency_keys`',
  '`worker_job_claims`',
  '`storage_object_records`',
  '`signed_url_events`',
  '`tool_runtime_checks`',
  '`backendRuntimePersistenceLocalHarnessPlanRecorded=true`',
  '`backendRuntimePersistenceLocalHarnessConfigRequired=true`',
  '`configTomlCreated=false`',
  '`sqlExecuted=false`',
  '`supabaseTouched=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const plan = QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_PLAN
assert.equal(plan.decision, DECISION)
assert.equal(
  plan.upstreamBackendRuntimePersistenceLocalValidationResultDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_VALIDATION_RESULT.decision,
)
assert.equal(plan.currentPreflight.supabaseConfigTomlExistsNow, false)
assert.equal(plan.currentPreflight.approvedLocalHarnessExistsNow, false)
assert.equal(plan.harnessDecision.localHarnessPlanRecorded, true)
assert.equal(plan.harnessDecision.localHarnessConfigRequired, true)
assert.equal(plan.harnessDecision.configTomlCreatedNow, false)
assert.equal(plan.harnessDecision.rejectsPlainPostgres, true)
assert.equal(plan.harnessDecision.rejectsCloudStagingProduction, true)
assert.equal(plan.harnessDecision.rejectsManualPlatformStubs, true)
assert.equal(plan.requiredBaselineRelations.length, 13)
assert.equal(plan.harnessOptions.filter((option) => option.allowedForFutureValidation).length, 2)
assert.equal(plan.harnessOptions.filter((option) => option.status === 'rejected').length, 3)
assert.ok(plan.safeConfigRequirements.includes('no_remote_project_ref'))
assert.ok(plan.safeConfigRequirements.includes('no_secrets_or_key_values'))
assert.equal(plan.nextPrompt, NEXT_PROMPT)
assert.equal(plan.runtimeFlags.backendRuntimePersistenceLocalValidationResultRecorded, true)
assert.equal(plan.runtimeFlags.backendRuntimePersistenceLocalHarnessPlanRecorded, true)
assert.equal(plan.runtimeFlags.backendRuntimePersistenceLocalHarnessConfigRequired, true)
assertFalseRuntimeSideEffects(plan.runtimeFlags)

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-plan.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({
  plan,
  localValidationResult: QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_VALIDATION_RESULT,
})
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen local harness plan data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  harnessOptionCount: plan.harnessOptions.length,
  requiredBaselineRelationCount: plan.requiredBaselineRelations.length,
  configTomlCreated: plan.runtimeFlags.configTomlCreated,
  supabaseTouched: plan.runtimeFlags.supabaseTouched,
  sqlExecuted: plan.runtimeFlags.sqlExecuted,
  readyForRealWorkerDispatch: plan.runtimeFlags.readyForRealWorkerDispatch,
  generatedLocalFixturePassedClaimed: plan.runtimeFlags.generatedLocalFixturePassedClaimed,
  nextPrompt: plan.nextPrompt,
}, null, 2))
