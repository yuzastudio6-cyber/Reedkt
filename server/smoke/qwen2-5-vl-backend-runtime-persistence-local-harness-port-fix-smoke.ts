import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_PORT_FIX } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-port-fix'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-result'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_backend_runtime_persistence_local_harness_port_fix_non_conflicting_ports_configured'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58V-BACKEND-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY: retry Qwen persistence draft validation with non-conflicting local Supabase harness ports, no deploy/no cloud/no assets/no beta'

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
  ['environment expansion', /\benv\s*\(/i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  ['raw prompt payload field', /\b(raw_prompt|rawWorkerPrompt|raw_provider_prompt|raw_worker_prompt)\b/i],
]

const unsafeTrueClaimPatterns: Array<[string, RegExp]> = [
  ['unsafe validation pass claim', /\b(localHarnessStarted|localHarnessValidationAttempted|localHarnessValidationPassed|draftSqlApplied|localSqlTestsExecuted|databaseCreated|databaseReset|activeMigrationCreated|migrationDeployed)\b\s*[:=]\s*(true|"true")/i],
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
    'localHarnessStarted',
    'localHarnessValidationAttempted',
    'localHarnessValidationPassed',
    'supabaseCliExecuted',
    'dockerStarted',
    'databaseCreated',
    'databaseReset',
    'activeMigrationCreated',
    'migrationDeployed',
    'draftSqlApplied',
    'localSqlTestsExecuted',
    'unrelatedLocalSupabaseProjectStopped',
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
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-port-fix.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-result.md',
  'supabase/config.toml',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-port-fix.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-result.ts',
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
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-port-fix'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-port-fix-smoke.ts',
  'package script mismatch',
)

const config = read('supabase/config.toml')
for (const phrase of [
  'project_id = "reeditpro_qwen_local_harness"',
  'port = 55431',
  'port = 55432',
  'shadow_port = 55430',
  'port = 55433',
  'api_url = "http://127.0.0.1:55431"',
  'port = 55434',
]) {
  assert.ok(config.includes(phrase), `Config missing phrase: ${phrase}`)
}
for (const oldPort of ['54320', '54321', '54322', '54323', '54324']) {
  assert.equal(config.includes(oldPort), false, `Config must not include old port ${oldPort}`)
}
for (const phrase of [
  'supabase.co',
  'service_role',
  'anon_key',
  'jwt_secret',
  'db_password',
  'provider_key',
  'stripe',
  'cloud_run',
  'model_runtime',
  'signed_url',
  'env(',
]) {
  assert.equal(config.toLowerCase().includes(phrase), false, `Config must not include ${phrase}`)
}
assertOnlyLoopbackUrls('supabase/config.toml')

const doc = read('docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-port-fix.md')
for (const phrase of [
  DECISION,
  'Previous Qwen DB port: `54322`',
  'Previous conflicting local project: `reeditpro`',
  '`55430`',
  '`55431`',
  '`55432`',
  '`55433`',
  '`55434`',
  '`portFixRecorded=true`',
  '`configUpdated=true`',
  '`nonConflictingPortsConfigured=true`',
  '`supabaseCliExecuted=false`',
  '`dockerStarted=false`',
  '`sqlExecuted=false`',
  '`unrelatedLocalSupabaseProjectStopped=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const result = QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_PORT_FIX
assert.equal(result.decision, DECISION)
assert.equal(
  result.upstreamBackendRuntimePersistenceLocalHarnessValidationResultDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RESULT.decision,
)
assert.equal(result.priorPortConflict.conflictingPort, 54322)
assert.equal(result.priorPortConflict.conflictingLocalProjectId, 'reeditpro')
assert.equal(result.priorPortConflict.qwenLocalHarnessStartStoppedBeforeSql, true)
assert.equal(result.priorPortConflict.unrelatedLocalProjectStopped, false)
assert.deepEqual(result.fixedLocalPorts, {
  dbShadow: 55430,
  api: 55431,
  db: 55432,
  studio: 55433,
  inbucket: 55434,
})
assert.equal(result.configSafety.projectId, 'reeditpro_qwen_local_harness')
assert.equal(result.configSafety.loopbackOnlyUrls, true)
assert.equal(result.configSafety.remoteProjectRefPresent, false)
assert.equal(result.configSafety.keyValuesPresent, false)
assert.equal(result.configSafety.databasePasswordPresent, false)
assert.equal(result.runtimeFlags.portFixRecorded, true)
assert.equal(result.runtimeFlags.configUpdated, true)
assert.equal(result.runtimeFlags.nonConflictingPortsConfigured, true)
assert.equal(result.runtimeFlags.portAvailabilityChecked, true)
assert.equal(result.runtimeFlags.previousPortConflictResolvedInConfig, true)
assert.equal(result.runtimeFlags.localHarnessRetryRequired, true)
assertFalseRuntimeSideEffects(result.runtimeFlags)
assert.equal(result.nextPrompt, NEXT_PROMPT)

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-port-fix.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-port-fix.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ result })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen local harness port fix data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  fixedLocalPorts: result.fixedLocalPorts,
  localHarnessRetryRequired: result.runtimeFlags.localHarnessRetryRequired,
  supabaseCliExecuted: result.runtimeFlags.supabaseCliExecuted,
  dockerStarted: result.runtimeFlags.dockerStarted,
  sqlExecuted: result.runtimeFlags.sqlExecuted,
  generatedLocalFixturePassedClaimed: result.runtimeFlags.generatedLocalFixturePassedClaimed,
  nextPrompt: result.nextPrompt,
}, null, 2))
