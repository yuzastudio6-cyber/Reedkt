import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_CONFIG_CREATE } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-config-create'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_CONFIG_VERIFY } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-config-verify'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_backend_runtime_persistence_local_harness_config_verified_harness_validation_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58T-BACKEND-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION: run Qwen persistence draft validation in approved local Supabase harness, no deploy/no cloud/no assets/no beta'

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
  ['unsafe runtime true claim', /\b(localHarnessStarted|localHarnessValidationAttempted|approvedLocalHarnessExists|activeMigrationCreated|draftSqlApplied|localSqlTestsExecuted|supabaseCliExecuted|dockerStarted|localDatabaseCreated|localDatabaseDropped|realJobCreated|realLeaseClaimed|idempotencyRowCreated|workerClaimCreated|jobEventCreated|backendRuntimeMessageCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|inferenceRun|workersDispatched|supabaseTouched|cloudSupabaseTouched|sqlExecuted|generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated|mediaProcessingRun|renderExportRun|creditMutationCreated|privateInvokeReady|betaReady|productionReady|dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i],
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
    'cloudSupabaseTouched',
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
  'supabase/config.toml',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-config-verify-report.md',
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-config-create-report.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-config-verify.ts',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-config-create.ts',
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
  packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-local-harness-config-verify'],
  'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-local-harness-config-verify-smoke.ts',
  'package script mismatch',
)

const config = read('supabase/config.toml')
assert.ok(config.includes('project_id = "reeditpro_qwen_local_harness"'))
assert.ok(config.includes('[api]'))
assert.ok(config.includes('[db]'))
assert.ok(config.includes('[auth]'))
assert.ok(config.includes('[storage]'))
assert.ok(config.includes('[edge_runtime]'))
assert.ok(config.includes('[analytics]'))
assertOnlyLoopbackUrls('supabase/config.toml')

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

const report = read('docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-config-verify-report.md')
for (const phrase of [
  DECISION,
  '`project_id = "reeditpro_qwen_local_harness"`',
  '`configVerificationPassed=true`',
  '`localToolchainVerificationPassed=true`',
  '`supabaseCliCompatible=true`',
  '`dockerCliAvailable=true`',
  '`readyForLocalHarnessValidation=true`',
  '`localHarnessValidationAttempted=false`',
  '`supabaseCliExecuted=false`',
  '`dockerStarted=false`',
  '`sqlExecuted=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  'Supabase CLI version: `2.105.0`',
  'Docker CLI version: `Docker version 29.5.2, build 79eb04c`',
  NEXT_PROMPT,
]) {
  assert.ok(report.includes(phrase), `Report missing phrase: ${phrase}`)
}

const result = QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_CONFIG_VERIFY
assert.equal(result.decision, DECISION)
assert.equal(
  result.upstreamBackendRuntimePersistenceLocalHarnessConfigCreateDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_CONFIG_CREATE.decision,
)
assert.equal(result.configPath, 'supabase/config.toml')
assert.equal(result.configVerification.configTomlExists, true)
assert.equal(result.configVerification.projectId, 'reeditpro_qwen_local_harness')
assert.equal(result.configVerification.loopbackOnlyUrls, true)
assert.equal(result.configVerification.remoteProjectRefPresent, false)
assert.equal(result.configVerification.keyValuesPresent, false)
assert.equal(result.configVerification.databasePasswordPresent, false)
assert.equal(result.localToolchainVerification.hostArchitecture, 'arm64')
assert.equal(result.localToolchainVerification.homebrewPath, '/opt/homebrew/bin/brew')
assert.equal(result.localToolchainVerification.nodeArchitecture, 'Mach-O 64-bit executable arm64')
assert.equal(result.localToolchainVerification.nodeVersion, 'v26.3.0')
assert.equal(result.localToolchainVerification.supabaseCliArchitecture, 'Mach-O 64-bit executable arm64')
assert.equal(result.localToolchainVerification.supabaseCliVersion, '2.105.0')
assert.equal(result.runtimeFlags.configVerificationRequired, false)
assert.equal(result.runtimeFlags.configVerificationPassed, true)
assert.equal(result.runtimeFlags.localToolchainVerificationPassed, true)
assert.equal(result.runtimeFlags.readyForLocalHarnessValidation, true)
assertFalseRuntimeSideEffects(result.runtimeFlags)
assert.equal(result.nextPrompt, NEXT_PROMPT)

for (const file of [
  'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-config-verify-report.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-config-verify.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ result })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen local harness config verify data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  configPath: result.configPath,
  configVerificationPassed: result.runtimeFlags.configVerificationPassed,
  localToolchainVerificationPassed: result.runtimeFlags.localToolchainVerificationPassed,
  readyForLocalHarnessValidation: result.runtimeFlags.readyForLocalHarnessValidation,
  supabaseCliExecuted: result.runtimeFlags.supabaseCliExecuted,
  dockerStarted: result.runtimeFlags.dockerStarted,
  sqlExecuted: result.runtimeFlags.sqlExecuted,
  generatedLocalFixturePassedClaimed: result.runtimeFlags.generatedLocalFixturePassedClaimed,
  nextPrompt: result.nextPrompt,
}, null, 2))
