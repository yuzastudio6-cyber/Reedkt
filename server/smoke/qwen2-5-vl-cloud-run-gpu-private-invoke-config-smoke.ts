import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  createQwen25VlPrivateInvokeConfigCandidate,
  QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG_CONTRACT,
  validateQwen25VlPrivateInvokeConfigCandidate,
} from '../../src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-config'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-config'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_7b_cloud_run_gpu_private_invoke_config_contract_defined_no_invocation'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_37-CLOUD-RUN-GPU-PRIVATE-INVOKE-CONFIG-SMOKE: run private invocation config contract smoke, no invocation'

type JsonRecord = Record<string, unknown>

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function parseBlock(relativePath: string, label: string) {
  const text = read(relativePath)
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = text.match(new RegExp('```json\\s+' + escaped + '\\n([\\s\\S]*?)\\n```'))
  check(match, `Missing JSON block ${label} in ${relativePath}`)
  return JSON.parse(match[1]) as JsonRecord
}

const forbiddenTextPatterns: Array<[string, RegExp]> = [
  ['concrete URL', /\bhttps?:\/\//i],
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token|access[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['execution true claim', /\b(configValuesReadNow|serviceUrlResolvedNow|audienceResolvedNow|identityTokenFetched|cloudRunInvocationAttempted|serviceRuntimeRequestSent|dispatchSubmitted|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe pass claim', /\b(dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i]
]

const forbiddenValuePatterns: Array<[string, RegExp]> = [
  ['concrete URL', /\bhttps?:\/\//i],
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['credential-looking value', /\b(api[_-]?key|hf[_-]?token|access[_-]?token|service[_-]?role)\b/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i]
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

function assertAllFalse(flags: JsonRecord, keys: string[]) {
  for (const key of keys) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config-change-log.md',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-config.ts',
  'src/backend/workers/index.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-config.ts',
  'server/smoke/qwen2-5-vl-cloud-run-gpu-private-invoke-config-smoke.ts',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-plan.md',
  'package.json'
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config'],
  'tsx server/smoke/qwen2-5-vl-cloud-run-gpu-private-invoke-config-smoke.ts',
  'package script mismatch'
)

const doc = read('docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config.md')
const changeLog = parseBlock(
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config-change-log.md',
  'qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config-change-log'
)
const config = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG
const contract = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG_CONTRACT

for (const phrase of [
  DECISION,
  '`reeditpro`',
  '`us-central1`',
  '`reeditpro-qwen2-5-vl-l4-worker`',
  '`google_signed_identity_token_backend_only`',
  '`300000ms`',
  '`65536`',
  '`QWEN25_VL_CLOUD_RUN_PROJECT`',
  '`QWEN25_VL_CLOUD_RUN_INVOCATION_ENABLED`',
  '`privateInvokeConfigContractDefined=true`',
  '`configValuesReadNow=false`',
  '`serviceUrlStoredInRepo=false`',
  '`identityTokenFetched=false`',
  '`cloudRunInvocationAttempted=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

assert.equal(config.decision, DECISION)
assert.equal(changeLog.decision, DECISION)
assert.equal(config.nextPrompt, NEXT_PROMPT)
assert.equal(changeLog.nextPrompt, NEXT_PROMPT)
assert.equal(contract.mode, 'qwen2_5_vl_cloud_run_gpu_private_invoke_config_contract')
assert.equal(contract.targetService.project, 'reeditpro')
assert.equal(contract.targetService.region, 'us-central1')
assert.equal(contract.targetService.service, 'reeditpro-qwen2-5-vl-l4-worker')
assert.equal(contract.requiredCandidateDefaults.authMode, 'google_signed_identity_token_backend_only')
assert.equal(contract.requiredCandidateDefaults.serviceUrlValueStoredInRepo, false)
assert.equal(contract.requiredCandidateDefaults.invocationEnabledNow, false)
assert.equal(contract.requiredCandidateDefaults.retriesEnabledNow, false)
assert.equal(contract.requiredCandidateDefaults.timeoutMs, 300000)
assert.equal(contract.requiredCandidateDefaults.maxBodyBytes, 65536)

for (const key of [
  'QWEN25_VL_CLOUD_RUN_PROJECT',
  'QWEN25_VL_CLOUD_RUN_REGION',
  'QWEN25_VL_CLOUD_RUN_SERVICE',
  'QWEN25_VL_CLOUD_RUN_AUDIENCE_SOURCE',
  'QWEN25_VL_CLOUD_RUN_TIMEOUT_MS',
  'QWEN25_VL_CLOUD_RUN_MAX_BODY_BYTES',
  'QWEN25_VL_CLOUD_RUN_INVOCATION_ENABLED'
]) {
  assert.ok(contract.allowedBackendConfigKeys.includes(key), `missing allowed config key ${key}`)
  assert.ok((changeLog.allowedBackendConfigKeys as string[]).includes(key), `change log missing key ${key}`)
}

const valid = validateQwen25VlPrivateInvokeConfigCandidate(
  createQwen25VlPrivateInvokeConfigCandidate()
)
assert.equal(valid.ok, true)
assert.equal(valid.acceptedForFutureRuntimeConfig, true)
assert.equal(valid.invocationAllowedNow, false)

for (const [label, candidate, issue] of [
  ['invocation enabled', createQwen25VlPrivateInvokeConfigCandidate({ invocationEnabledNow: true }), 'invocation_must_stay_disabled'],
  ['service url stored', createQwen25VlPrivateInvokeConfigCandidate({ serviceUrlValueStoredInRepo: true }), 'service_url_value_must_not_be_stored'],
  ['audience not backend', createQwen25VlPrivateInvokeConfigCandidate({ audienceResolvedByBackendOnly: false }), 'audience_must_be_backend_resolved'],
  ['retries enabled', createQwen25VlPrivateInvokeConfigCandidate({ retriesEnabledNow: true }), 'retries_must_stay_disabled'],
  ['body mismatch', createQwen25VlPrivateInvokeConfigCandidate({ maxBodyBytes: 999 }), 'max_body_bytes_mismatch']
] as const) {
  const result = validateQwen25VlPrivateInvokeConfigCandidate(candidate)
  assert.equal(result.ok, false, `${label} should fail`)
  assert.equal(result.acceptedForFutureRuntimeConfig, false, `${label} must not be accepted`)
  assert.equal(result.invocationAllowedNow, false, `${label} must not allow invocation`)
  assert.ok(result.issues.includes(issue), `${label} missing issue ${issue}`)
}

assert.equal(config.validationResults.validCandidate.ok, true)
assert.equal(config.validationResults.invocationEnabledCandidate.ok, false)
assert.equal(config.validationResults.storedUrlCandidate.ok, false)

for (const bypass of [
  'stored_concrete_service_url',
  'stored_identity_token',
  'stored_key_material',
  'frontend_runtime_config_exposure',
  'invocation_enabled_before_backend_runtime',
  'retry_enabled_before_idempotency_policy',
  'timeout_above_service_bound',
  'body_limit_above_runtime_contract'
]) {
  assert.ok(config.blockedConfigBypasses.includes(bypass), `missing bypass ${bypass}`)
  assert.ok((changeLog.blockedConfigBypasses as string[]).includes(bypass), `change log missing bypass ${bypass}`)
}

assert.equal(config.runtimeFlags.privateInvokeConfigContractDefined, true)
assert.equal(config.runtimeFlags.configValidationImplemented, true)
assert.equal(config.runtimeFlags.validConfigCandidateAcceptedForFutureRuntime, true)
assert.equal(config.runtimeFlags.unsafeConfigCandidatesRejected, true)

const falseRuntimeFlags = [
  'configValuesReadNow',
  'serviceUrlStoredInRepo',
  'serviceUrlResolvedNow',
  'audienceResolvedNow',
  'identityTokenFetched',
  'cloudRunInvocationAttempted',
  'serviceRuntimeRequestSent',
  'dispatchSubmitted',
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
  'creditMutationCreated',
  'betaUnlocked',
  'productionUnlocked',
  'dryRunPassedClaimed',
  'generatedLocalFixturePassedClaimed'
]
assertAllFalse(config.runtimeFlags as JsonRecord, falseRuntimeFlags)
assertAllFalse(changeLog.runtimeFlags as JsonRecord, falseRuntimeFlags)

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config-change-log.md',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-config.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-config.ts'
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ config, contract })
assert.deepEqual(forbiddenDataFindings, [], `Forbidden values in private invoke config data: ${forbiddenDataFindings.join('; ')}`)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  service: contract.targetService.service,
  region: contract.targetService.region,
  configKeyCount: contract.allowedBackendConfigKeys.length,
  validCandidateAcceptedForFutureRuntime: config.runtimeFlags.validConfigCandidateAcceptedForFutureRuntime,
  unsafeConfigCandidatesRejected: config.runtimeFlags.unsafeConfigCandidatesRejected,
  configValuesReadNow: config.runtimeFlags.configValuesReadNow,
  identityTokenFetched: config.runtimeFlags.identityTokenFetched,
  cloudRunInvocationAttempted: config.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: config.runtimeFlags.inferenceRun,
  nextPrompt: NEXT_PROMPT
}, null, 2))
