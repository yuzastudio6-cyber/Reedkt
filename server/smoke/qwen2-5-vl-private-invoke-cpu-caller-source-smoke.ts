import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CPU_CALLER_SOURCE } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-cpu-caller-source'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_DIRECT_VPC_ROUTE_CONFIG_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-direct-vpc-route-config-result'

const MODE = 'qwen2_5_vl_private_invoke_cpu_caller_source_only'
const DECISION =
  'qwen2_5_vl_private_invoke_cpu_caller_source_defined_no_deploy_no_inference'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_55D-PRIVATE-INVOKE-CPU-CALLER-DEPLOY: deploy controlled CPU-only internal caller harness, no inference'

type JsonRecord = Record<string, unknown>

function read(relativePath: string) {
  return readFileSync(relativePath, 'utf8')
}

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

const forbiddenSecretPatterns: Array<[string, RegExp]> = [
  ['concrete URL', /\bhttps?:\/\//i],
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
]

const forbiddenDocSpecPatterns: Array<[string, RegExp]> = [
  ...forbiddenSecretPatterns,
  ['unsafe build true claim', /\b(cpuOnlyCallerImageBuilt|cpuOnlyCallerImagePushed|cpuOnlyCallerImageDeployed)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe deploy true claim', /\b(callerHarnessDeployAllowedNow|callerHarnessDeployed|callerHarnessExecuted|directVpcEgressConfigured)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe runtime true claim', /\b(identityTokenFetched|cloudRunInvocationAttempted|serviceRuntimeRequestSent|modelImportRun|modelLoadRun|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe asset true claim', /\b(generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated|creditMutationCreated|betaUnlocked|productionUnlocked)\b\s*[:=]\s*(true|"true")/i],
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

function assertNoForbiddenText(relativePath: string, patterns: Array<[string, RegExp]>) {
  const text = read(relativePath)
  const findings = patterns.filter(([, pattern]) => pattern.test(text)).map(([name]) => name)
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

function assertFalseFlags(flags: JsonRecord) {
  for (const key of [
    'cpuOnlyCallerImageBuilt',
    'cpuOnlyCallerImagePushed',
    'cpuOnlyCallerImageDeployed',
    'callerHarnessDeployAllowedNow',
    'callerHarnessDeployed',
    'callerHarnessExecuted',
    'directVpcEgressConfigured',
    'identityTokenFetched',
    'identityTokenPrinted',
    'identityTokenValueStored',
    'cloudRunInvocationAttempted',
    'serviceRuntimeRequestSent',
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
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-cpu-caller-source.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-direct-vpc-route-config-result.md',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-cpu-caller-source.ts',
  'server/workers/qwen2_5_vl_private_invoke_cpu_caller/__init__.py',
  'server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py',
  'server/workers/qwen2_5_vl_private_invoke_cpu_caller/README.md',
  'docker/prod/qwen2-5-vl-private-invoke-cpu-caller/Dockerfile',
  'docker/prod/qwen2-5-vl-private-invoke-cpu-caller/README.md',
  'docker/prod/qwen2-5-vl-private-invoke-cpu-caller/Dockerfile.dockerignore',
  'server/smoke/qwen2-5-vl-private-invoke-cpu-caller-source-smoke.ts',
  'package.json',
]) {
  check(existsSync(file), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-private-invoke-cpu-caller-source'],
  'tsx server/smoke/qwen2-5-vl-private-invoke-cpu-caller-source-smoke.ts',
)

const docText = read('docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-cpu-caller-source.md')
for (const phrase of [
  MODE,
  DECISION,
  'server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py',
  'docker/prod/qwen2-5-vl-private-invoke-cpu-caller/Dockerfile',
  'no-model, no-vLLM, no-CUDA, no-inference',
  'standard-library Python only',
  'one task, zero retries, no GPU, no minimum instances',
  '`qwen-private-caller-us-central1`',
  '`cpuOnlyCallerSourceDefined=true`',
  '`cpuOnlyCallerImageDefined=true`',
  '`cpuOnlyCallerImageBuilt=false`',
  '`callerHarnessDeployed=false`',
  '`identityTokenFetched=false`',
  '`cloudRunInvocationAttempted=false`',
  '`serviceRuntimeRequestSent=false`',
  '`inferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(docText.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const result = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CPU_CALLER_SOURCE
assert.equal(result.mode, MODE)
assert.equal(result.decision, DECISION)
assert.equal(
  result.upstreamDirectVpcRouteConfigDecision,
  QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_DIRECT_VPC_ROUTE_CONFIG_RESULT.decision,
)
assert.equal(result.sourceArtifacts.callerModule, 'server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py')
assert.equal(result.sourceArtifacts.dockerfile, 'docker/prod/qwen2-5-vl-private-invoke-cpu-caller/Dockerfile')
assert.equal(result.callerRuntimeShape.kind, 'cloud_run_job_cpu_only')
assert.equal(result.callerRuntimeShape.language, 'python_standard_library_only')
assert.equal(result.callerRuntimeShape.gpuRequired, false)
assert.equal(result.callerRuntimeShape.cudaRequired, false)
assert.equal(result.callerRuntimeShape.vllmRequired, false)
assert.equal(result.callerRuntimeShape.modelWeightsIncluded, false)
assert.equal(result.callerRuntimeShape.modelImportOnStartup, false)
assert.equal(result.callerRuntimeShape.inferencePathIncluded, false)
assert.equal(result.callerRuntimeShape.taskCount, 1)
assert.equal(result.callerRuntimeShape.maxRetries, 0)
assert.equal(result.callerRuntimeShape.minInstances, 0)
assert.equal(result.callerRuntimeShape.defaultExecutionGateValue, false)
assert.equal(result.callerRuntimeShape.subnet, 'qwen-private-caller-us-central1')
assert.equal(result.contractPayloadShape.schemaVersion, 'qwen2_5_vl_cloud_run_gpu_runtime_request_v1')
assert.equal(result.contractPayloadShape.approvedPlanSnapshotRequired, true)
assert.equal(result.contractPayloadShape.queueLeaseRequired, true)
assert.equal(result.contractPayloadShape.idempotencyKeyRequired, true)
assert.equal(result.contractPayloadShape.rawPromptAllowed, false)
assert.equal(result.contractPayloadShape.outputMode, 'metadata_only')
assert.equal(result.contractPayloadShape.modelPolicyRequired.gpu, 'nvidia-l4')
assert.equal(result.runtimeFlags.cpuOnlyCallerSourceDefined, true)
assert.equal(result.runtimeFlags.cpuOnlyCallerImageSourceDefined, true)
assert.equal(result.runtimeFlags.cpuOnlyCallerImageDefined, true)
assertFalseFlags(result.runtimeFlags as JsonRecord)
assert.deepEqual(
  result.remainingBlockers.map((blocker) => blocker.id),
  ['controlled_cpu_only_caller_job_not_deployed', 'internal_contract_response_not_observed'],
)
assert.equal(result.nextPrompt, NEXT_PROMPT)

const callerSource = read('server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py')
for (const phrase of [
  'QWEN_CPU_CALLER_EXECUTION_ENABLED',
  'QWEN_PRIVATE_INVOKE_TARGET_URL',
  'QWEN_PRIVATE_INVOKE_AUDIENCE',
  'build_contract_payload',
  'validate_contract_payload',
  'fetch_identity_token',
  'post_contract_request',
  'metadata_only',
  'raw_prompt_fields_blocked',
]) {
  assert.ok(callerSource.includes(phrase), `Caller source missing phrase: ${phrase}`)
}
assert.ok(!callerSource.includes('import torch'), 'Caller source must not import torch')
assert.ok(!callerSource.includes('import transformers'), 'Caller source must not import transformers')
assert.ok(!callerSource.includes('import vllm'), 'Caller source must not import vLLM')
assert.ok(!callerSource.includes('qwen_vl_utils'), 'Caller source must not import qwen_vl_utils')

const dockerfile = read('docker/prod/qwen2-5-vl-private-invoke-cpu-caller/Dockerfile')
for (const phrase of [
  'FROM python:3.12-slim',
  'QWEN_CPU_CALLER_EXECUTION_ENABLED=false',
  'QWEN_INFERENCE_ENABLED=false',
  'RAW_VLM_PROMPT_ENABLED=false',
  'PROVIDER_EXECUTION_ENABLED=false',
  'MEDIA_PROCESSING_ENABLED=false',
  'PUBLIC_OUTPUT_ENABLED=false',
]) {
  assert.ok(dockerfile.includes(phrase), `Dockerfile missing phrase: ${phrase}`)
}
assert.ok(!dockerfile.includes('cuda'), 'Caller Dockerfile must not include CUDA')
assert.ok(!dockerfile.includes('pip install'), 'Caller Dockerfile must not install model/runtime deps')

const statusOutput = execFileSync(
  'python3',
  ['server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py', '--print-status'],
  { encoding: 'utf8' },
)
const status = JSON.parse(statusOutput) as JsonRecord
assert.equal(status.mode, 'qwen2_5_vl_private_invoke_cpu_caller_source_no_deploy_no_inference')
assert.equal(status.executionEnabled, false)
assert.equal(status.contractPayloadValid, true)
assert.deepEqual(status.contractRejectionReasons, [])
const runtimeSideEffects = status.runtimeSideEffects as JsonRecord
assert.equal(runtimeSideEffects.identityTokenFetched, false)
assert.equal(runtimeSideEffects.cloudRunInvocationAttempted, false)
assert.equal(runtimeSideEffects.serviceRuntimeRequestSent, false)
assert.equal(runtimeSideEffects.inferenceRun, false)
assert.equal(runtimeSideEffects.generatedAssetsCreated, false)

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-cpu-caller-source.md',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-cpu-caller-source.ts',
]) {
  assertNoForbiddenText(file, forbiddenDocSpecPatterns)
}

for (const file of [
  'server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py',
  'server/workers/qwen2_5_vl_private_invoke_cpu_caller/README.md',
  'docker/prod/qwen2-5-vl-private-invoke-cpu-caller/Dockerfile',
  'docker/prod/qwen2-5-vl-private-invoke-cpu-caller/README.md',
]) {
  assertNoForbiddenText(file, forbiddenSecretPatterns)
}

const forbiddenDataFindings = scanValues({ result, status })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen CPU caller source data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  mode: result.mode,
  decision: result.decision,
  callerSourceDefined: result.runtimeFlags.cpuOnlyCallerSourceDefined,
  cpuOnly: !result.callerRuntimeShape.gpuRequired,
  imageBuilt: result.runtimeFlags.cpuOnlyCallerImageBuilt,
  callerHarnessDeployed: result.runtimeFlags.callerHarnessDeployed,
  cloudRunInvocationAttempted: result.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: result.runtimeFlags.inferenceRun,
  nextPrompt: result.nextPrompt,
}, null, 2))
