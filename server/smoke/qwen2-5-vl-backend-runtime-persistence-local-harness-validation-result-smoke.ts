import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_CONFIG_VERIFY } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-config-verify'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-result'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_backend_runtime_persistence_local_harness_validation_blocked_port_conflict'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58U-BACKEND-RUNTIME-PERSISTENCE-LOCAL-HARNESS-PORT-FIX: adjust Qwen local Supabase harness ports and retry validation, no deploy/no cloud/no assets/no beta'

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
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
  ['identity token assignment', /\b(identityToken|idToken|accessToken)\s*[:=]\s*['"][^'"]+['"]/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token|db[_-]?password|jwt[_-]?secret)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['real storage URI', /\b(gs:\/\/|s3:\/\/|r2:\/\/|az:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  ['raw prompt payload field', /\b(raw_prompt|rawWorkerPrompt|raw_provider_prompt|raw_worker_prompt)\b/i],
]

const unsafeTrueClaimPatterns: Array<[string, RegExp]> = [
  ['unsafe validation pass claim', /\b(localHarnessValidationPassed|backendRuntimePersistenceLocalHarnessValidationPassed|draftSqlApplied|localSqlTestsExecuted|localDatabaseReset|qwenLocalDatabaseCreated|activeMigrationCreated)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe runtime true claim', /\b(realJobCreated|realLeaseClaimed|idempotencyRowCreated|workerClaimCreated|jobEventCreated|backendRuntimeMessageCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|serviceUrlResolvedNow|audienceResolvedNow|identityTokenFetched|authHeaderCreated|inferenceRun|workersDispatched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe generated/public claim', /\b(generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated|mediaProcessingRun|renderExportRun|creditMutationCreated)\b\s*[:=]\s*(true|"true")/i],
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

function assertOnlyLoopbackUrls(relativePath: string) {
  const urls = collectUrls(read(relativePath))
  const nonLoopback = urls.filter((url) => {
    try {
      const parsed = new URL(url)
      return parsed.hostname !== '127.0.0.1' && parsed.hostname !== 'localhost'
    } catch {
      return true
    }
  })
  assert.deepEqual(nonLoopback, [], `Non-loopback URLs in ${relativePath}: ${nonLoopback.join('; ')}`)
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
    'backendRuntimePersistenceLocalHarnessValidationPassed',
    'backendRuntimePersistenceLocalHarnessStarted',
    'unrelatedLocalSupabaseProjectStopped',
    'qwenLocalContainersLeftBehind',
    'activeMigrationCreated',
    'draftSqlApplied',
    'localSqlTestsExecuted',
    'localDatabaseReset',
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
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-result.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-config-verify-report.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-config-create-report.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-plan.md',
  'database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql',
  'database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql',
  'supabase/config.toml',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-config-verify.ts',
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

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-validation-result'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-validation-result-smoke.ts',
  'package script mismatch',
)

assertOnlyLoopbackUrls('supabase/config.toml')
const config = read('supabase/config.toml')
assert.ok(config.includes('project_id = "reeditpro_qwen_local_harness"'))
assert.ok(config.includes('port = 54322'))

const doc = read('docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-result.md')
for (const phrase of [
  DECISION,
  'port `54322` was already allocated',
  'existing Supabase project named `reeditpro`',
  'Supabase CLI local start attempted: true',
  'SQL executed: false',
  'Draft migration applied: false',
  'Draft tests executed: false',
  'Qwen local containers left behind: false',
  '`backendRuntimePersistenceLocalHarnessValidationAttempted=true`',
  '`backendRuntimePersistenceLocalHarnessValidationPassed=false`',
  '`backendRuntimePersistenceLocalHarnessStartAttempted=true`',
  '`backendRuntimePersistenceLocalHarnessStarted=false`',
  '`backendRuntimePersistenceLocalHarnessPortConflictDetected=true`',
  '`backendRuntimePersistenceLocalHarnessPortFixRequired=true`',
  '`sqlExecuted=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const result = QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RESULT
assert.equal(result.decision, DECISION)
assert.equal(
  result.upstreamBackendRuntimePersistenceLocalHarnessConfigVerifyDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_CONFIG_VERIFY.decision,
)
assert.equal(result.validationTarget.projectId, 'reeditpro_qwen_local_harness')
assert.equal(result.validationTarget.qwenLocalDbPort, 54322)
assert.equal(result.preflight.configTomlExists, true)
assert.equal(result.preflight.configVerificationPassed, true)
assert.equal(result.preflight.localToolchainVerificationPassed, true)
assert.equal(result.attempt.supabaseLocalStartAttempted, true)
assert.equal(result.attempt.sanitizedFailureReason, 'local_db_port_54322_already_allocated')
assert.equal(result.attempt.conflictingLocalProjectId, 'reeditpro')
assert.equal(result.attempt.qwenLocalHarnessStarted, false)
assert.equal(result.attempt.qwenLocalContainersLeftBehind, false)
assert.equal(result.attempt.stoppedBeforeSql, true)
assert.equal(result.attempt.unrelatedLocalProjectStopped, false)
assert.equal(result.validationOutcome.status, 'blocked_port_conflict')
assert.equal(result.validationOutcome.localHarnessValidationAttempted, true)
assert.equal(result.validationOutcome.localHarnessValidationPassed, false)
assert.equal(result.validationOutcome.baselineLoadStatus, 'not_attempted')
assert.equal(result.validationOutcome.draftMigrationStatus, 'blocked')
assert.equal(result.validationOutcome.draftTestsStatus, 'blocked')
assert.equal(result.validationOutcome.cleanupRequired, false)
assert.equal(result.validationOutcome.cleanupVerified, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationResultRecorded, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalHarnessValidationAttempted, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalHarnessStartAttempted, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalHarnessPortConflictDetected, true)
assert.equal(result.runtimeFlags.backendRuntimePersistenceLocalHarnessPortFixRequired, true)
assert.equal(result.runtimeFlags.existingLocalSupabaseProjectDetected, true)
assertFalseRuntimeSideEffects(result.runtimeFlags)
assert.equal(result.nextPrompt, NEXT_PROMPT)

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-result.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-result.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ result })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen local harness validation result data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  localHarnessValidationAttempted: result.validationOutcome.localHarnessValidationAttempted,
  localHarnessValidationPassed: result.validationOutcome.localHarnessValidationPassed,
  status: result.validationOutcome.status,
  qwenLocalDbPort: result.validationTarget.qwenLocalDbPort,
  sqlExecuted: result.runtimeFlags.sqlExecuted,
  draftSqlApplied: result.runtimeFlags.draftSqlApplied,
  localSqlTestsExecuted: result.runtimeFlags.localSqlTestsExecuted,
  generatedLocalFixturePassedClaimed: result.runtimeFlags.generatedLocalFixturePassedClaimed,
  nextPrompt: result.nextPrompt,
}, null, 2))
