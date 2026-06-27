import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

import { QWEN2_5_VL_PRIVATE_INVOKE_CPU_CALLER_CONTRACT_SMOKE_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-cpu-caller-contract-smoke-result'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CPU_CALLER_DEPLOY_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-cpu-caller-deploy-result'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CPU_CALLER_SOURCE } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-cpu-caller-source'

const MODE = 'qwen2_5_vl_private_invoke_cpu_caller_contract_smoke_result'
const DECISION =
  'qwen2_5_vl_private_invoke_cpu_caller_contract_smoke_passed_fail_closed_no_inference'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_56-PRIVATE-INVOKE-RUNTIME-READINESS-REVIEW: review contract smoke and plan first approved-fixture inference smoke, no generated assets/no beta'

type JsonRecord = Record<string, unknown>

function read(relativePath: string) {
  return readFileSync(relativePath, 'utf8')
}

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

const forbiddenTextPatterns: Array<[string, RegExp]> = [
  ['concrete URL', /\bhttps?:\/\//i],
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
  ['bearer token value', /\bBearer\s+[A-Za-z0-9._~+/-]+/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  ['unsafe pass claim', /\b(dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i],
]

const forbiddenValuePatterns: Array<[string, RegExp]> = [
  ['concrete URL', /\bhttps?:\/\//i],
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['bearer token value', /\bBearer\s+[A-Za-z0-9._~+/-]+/i],
  ['credential-looking value', /\b(sk-[A-Za-z0-9]{12,}|hf_[A-Za-z0-9]{12,}|ya29\.[A-Za-z0-9._-]+)/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
]

function assertNoForbiddenText(relativePath: string) {
  const text = read(relativePath)
  const findings = forbiddenTextPatterns.filter(([, pattern]) => pattern.test(text)).map(([name]) => name)
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

function assertFalseRuntimeFlags(flags: JsonRecord) {
  for (const key of [
    'identityTokenPrinted',
    'identityTokenValueStored',
    'runtimeContractExecutesNow',
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
    'generatedLocalFixturePassedClaimed',
  ]) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-cpu-caller-contract-smoke-result.md',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-cpu-caller-contract-smoke-result.ts',
  'server/smoke/qwen2-5-vl-private-invoke-cpu-caller-contract-smoke-result-smoke.ts',
  'server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py',
  'docker/prod/qwen2-5-vl-private-invoke-cpu-caller/Dockerfile',
  'package.json',
]) {
  check(existsSync(file), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-private-invoke-cpu-caller-contract-smoke-result'],
  'tsx server/smoke/qwen2-5-vl-private-invoke-cpu-caller-contract-smoke-result-smoke.ts',
)

const docText = read('docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-cpu-caller-contract-smoke-result.md')
for (const phrase of [
  MODE,
  DECISION,
  '`20260627-e9260862-contract-json`',
  '`fail-closed-contract-handler-e9260862-20260627t1519z`',
  '`sha256:5afbcbd7ec65b02c3be8971402648cc8484ff3f0b4ec9094d9e6ad046597ef9d`',
  '`reeditpro-qwen2-5-vl-l4-worker-00004-b72`',
  '`MODEL_DOWNLOADS_ENABLED=false`',
  '`QWEN_MODEL_IMPORT_ON_STARTUP=false`',
  '`QWEN_INFERENCE_ENABLED=false`',
  '`reeditpro-qwen2-5-vl-private-caller-nlc88`',
  '`httpStatus=403`',
  '`serviceReason=qwen_inference_disabled_after_contract_check`',
  '`contractSatisfiedForFutureRuntime=true`',
  '`runtimeContractExecutesNow=false`',
  '`identityTokenFetched=true`',
  '`identityTokenPrinted=false`',
  '`serviceRuntimeRequestSent=true`',
  '`modelInferenceEnabled=false`',
  '`QWEN_CPU_CALLER_EXECUTION_ENABLED=false`',
  '`targetOverridePersisted: false`',
  '`audienceOverridePersisted: false`',
  '`inferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(docText.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const result = QWEN2_5_VL_PRIVATE_INVOKE_CPU_CALLER_CONTRACT_SMOKE_RESULT
assert.equal(result.mode, MODE)
assert.equal(result.decision, DECISION)
assert.equal(
  result.upstreamCpuCallerSourceDecision,
  QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CPU_CALLER_SOURCE.decision,
)
assert.equal(
  result.upstreamCpuCallerDeployDecision,
  QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CPU_CALLER_DEPLOY_RESULT.decision,
)
assert.equal(result.cpuCallerFixes.dockerCommandRunsCallerByDefault, true)
assert.equal(result.cpuCallerFixes.dockerCommandPrintStatusOnlyRemoved, true)
assert.equal(result.cpuCallerFixes.responseBodyJsonParsed, true)
assert.equal(result.cpuCallerImageRefresh.currentJobImageTag, '20260627-e9260862-contract-json')
assert.equal(result.gpuServiceContractHandlerRefresh.ready, true)
assert.equal(result.gpuServiceContractHandlerRefresh.modelImportOnStartup, false)
assert.equal(result.gpuServiceContractHandlerRefresh.modelInferenceEnabled, false)
assert.equal(result.gpuServiceContractHandlerRefresh.maxScale, 1)
assert.equal(result.gpuServiceContractHandlerRefresh.scaleToZeroPosturePreserved, true)
assert.equal(result.smokeExecution.executionName, 'reeditpro-qwen2-5-vl-private-caller-nlc88')
assert.equal(result.smokeExecution.completed, true)
assert.equal(result.smokeExecution.exitCode, 0)
assert.equal(result.smokeExecution.httpStatus, 403)
assert.equal(result.smokeExecution.expectedHttpStatus, 403)
assert.equal(result.smokeExecution.serviceReason, 'qwen_inference_disabled_after_contract_check')
assert.equal(result.smokeExecution.contractSatisfiedForFutureRuntime, true)
assert.equal(result.smokeExecution.runtimeContractExecutesNow, false)
assert.equal(result.smokeExecution.identityTokenFetched, true)
assert.equal(result.smokeExecution.identityTokenPrinted, false)
assert.equal(result.smokeExecution.serviceRuntimeRequestSent, true)
assert.equal(result.smokeExecution.modelInferenceEnabled, false)
assert.equal(result.persistentPostSmokeConfig.cpuCallerDefaultExecutionEnabled, false)
assert.equal(result.persistentPostSmokeConfig.cpuCallerTargetOverridePersisted, false)
assert.equal(result.persistentPostSmokeConfig.cpuCallerAudienceOverridePersisted, false)
assert.equal(result.runtimeFlags.contractSmokeResultRecorded, true)
assert.equal(result.runtimeFlags.callerHarnessExecuted, true)
assert.equal(result.runtimeFlags.jobExecutionCount, 1)
assert.equal(result.runtimeFlags.identityTokenFetched, true)
assert.equal(result.runtimeFlags.cloudRunInvocationAttempted, true)
assert.equal(result.runtimeFlags.serviceRuntimeRequestSent, true)
assert.equal(result.runtimeFlags.failClosedResponseObserved, true)
assert.equal(result.runtimeFlags.contractSatisfiedForFutureRuntime, true)
assertFalseRuntimeFlags(result.runtimeFlags as JsonRecord)
assert.deepEqual(result.remainingBlockers.map((blocker) => blocker.id), [
  'runtime_readiness_review_required_before_inference',
])
assert.equal(result.nextPrompt, NEXT_PROMPT)

const callerSource = read('server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py')
for (const phrase of [
  '_parse_json_body',
  'bodyJson',
  'serviceReason',
  'contractSatisfiedForFutureRuntime',
  'runtimeContractExecutesNow',
  'qwen_inference_disabled_after_contract_check',
]) {
  assert.ok(callerSource.includes(phrase), `Caller source missing phrase: ${phrase}`)
}

const dockerfile = read('docker/prod/qwen2-5-vl-private-invoke-cpu-caller/Dockerfile')
assert.ok(
  dockerfile.includes('CMD ["python", "/app/server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py"]'),
  'Caller Dockerfile must run the contract caller by default.',
)
assert.ok(!dockerfile.includes('--print-status"]'), 'Caller Dockerfile must not default to status-only mode.')

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-cpu-caller-contract-smoke-result.md',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-cpu-caller-contract-smoke-result.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ result })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen contract smoke result data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  mode: result.mode,
  decision: result.decision,
  executionName: result.smokeExecution.executionName,
  httpStatus: result.smokeExecution.httpStatus,
  serviceReason: result.smokeExecution.serviceReason,
  contractSatisfiedForFutureRuntime: result.smokeExecution.contractSatisfiedForFutureRuntime,
  runtimeContractExecutesNow: result.smokeExecution.runtimeContractExecutesNow,
  identityTokenPrinted: result.smokeExecution.identityTokenPrinted,
  inferenceRun: result.runtimeFlags.inferenceRun,
  nextPrompt: result.nextPrompt,
}, null, 2))
