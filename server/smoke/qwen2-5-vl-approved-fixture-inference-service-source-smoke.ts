import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SERVICE_SOURCE } from '../../src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-service-source'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_approved_fixture_inference_service_source_defined_fail_closed_default'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58A-APPROVED-FIXTURE-INFERENCE-SERVICE-DEPLOY: build and deploy gated Qwen fixture inference service source, no fixture inference yet'

type JsonRecord = Record<string, unknown>

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

const forbiddenTextPatterns: Array<[string, RegExp]> = [
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  ['unsafe execution true claim', /\b(fixtureInferenceSmokeExecuted|cloudRunServiceDeployed|imageBuilt|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe pass claim', /\b(dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i],
]

const forbiddenValuePatterns: Array<[string, RegExp]> = [
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
    'imageBuilt',
    'imagePushed',
    'cloudRunServiceDeployed',
    'cpuCallerImageBuilt',
    'cpuCallerJobUpdated',
    'fixtureInferenceSmokeExecuted',
    'serviceUrlResolvedNow',
    'audienceResolvedNow',
    'authHeaderCreated',
    'identityTokenFetched',
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
    'renderExportRun',
    'betaUnlocked',
    'productionUnlocked',
    'dryRunPassedClaimed',
    'generatedLocalFixturePassedClaimed',
  ]) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

for (const file of [
  'docs/qwen2-5-vl-7b-approved-fixture-inference-service-source.md',
  'docs/qwen2-5-vl-7b-approved-fixture-inference-smoke-plan.md',
  'server/workers/qwen2_5_vl_cloud_run_gpu/service.py',
  'server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py',
  'src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-service-source.ts',
  'server/smoke/qwen2-5-vl-approved-fixture-inference-service-source-smoke.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-approved-fixture-inference-service-source'],
  'tsx server/smoke/qwen2-5-vl-approved-fixture-inference-service-source-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-approved-fixture-inference-service-source.md')
for (const phrase of [
  DECISION,
  '`QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED=true`',
  '`QWEN_INFERENCE_ENABLED=true`',
  '`QWEN_CPU_CALLER_EXPECT_FIXTURE_INFERENCE=true`',
  'lazy-loads vLLM',
  'in-memory private synthetic fixture',
  'sanitized metadata summary',
  'NVIDIA L4',
  '`serviceSourceSupportsApprovedFixtureInference=true`',
  '`cpuCallerSupportsFixtureInferenceExpectation=true`',
  '`defaultFailClosedPreserved=true`',
  '`fixtureInferenceSmokeExecuted=false`',
  '`inferenceRun=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const serviceText = read('server/workers/qwen2_5_vl_cloud_run_gpu/service.py')
for (const phrase of [
  'APPROVED_FIXTURE_INFERENCE_ENV',
  'QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED',
  'run_approved_fixture_inference',
  'qwen_fixture_inference_smoke_completed',
  'NetworkGuard',
  'LLM(**llm_kwargs)',
  'SamplingParams',
  'metadataOutput',
  'generatedAssetsCreated',
  'publicArtifactsCreated',
  'signedUrlsCreated',
]) {
  assert.ok(serviceText.includes(phrase), `Service source missing phrase: ${phrase}`)
}

const callerText = read('server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py')
for (const phrase of [
  'QWEN_CPU_CALLER_EXPECT_FIXTURE_INFERENCE',
  'qwen_fixture_inference_smoke_completed',
  'expectedHttpStatus": 200',
  'fixtureInferenceSmokePassed',
  'metadataOutput',
]) {
  assert.ok(callerText.includes(phrase), `CPU caller source missing phrase: ${phrase}`)
}

const source = QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SERVICE_SOURCE
assert.equal(source.decision, DECISION)
assert.equal(source.serviceSource.defaultFailClosedPreserved, true)
assert.equal(source.serviceSource.lazyVllmLoad, true)
assert.equal(source.serviceSource.inMemoryPrivateFixtureOnly, true)
assert.equal(source.serviceSource.sanitizedMetadataOnlyResponse, true)
assert.equal(source.cpuCallerSource.defaultContractSmokeExpectationPreserved, true)
assert.equal(source.cpuCallerSource.acceptsExpectedFixtureHttpStatus, 200)
assert.equal(source.cpuCallerSource.acceptsExpectedContractHttpStatus, 403)
assert.equal(source.selectedRuntime.gpu, 'nvidia_l4')
assert.equal(source.selectedRuntime.minInstancesRequired, 0)
assert.equal(source.selectedRuntime.maxInstancesForFirstFixtureSmoke, 1)
assert.equal(source.selectedRuntime.cpuFallbackAllowedForRealQwenVlm, false)
assert.equal(source.futureExecutionGate.qwenApprovedFixtureInferenceEnabled, true)
assert.equal(source.futureExecutionGate.generatedAssetsAllowed, false)
assert.equal(source.futureExecutionGate.publicArtifactsAllowed, false)
assert.equal(source.futureExecutionGate.signedUrlsAllowed, false)
assert.equal(source.runtimeFlags.serviceSourceSupportsApprovedFixtureInference, true)
assert.equal(source.runtimeFlags.cpuCallerSupportsFixtureInferenceExpectation, true)
assert.equal(source.runtimeFlags.defaultFailClosedPreserved, true)
assertFalseFlags(source.runtimeFlags)
assert.equal(source.nextPrompt, NEXT_PROMPT)

for (const file of [
  'docs/qwen2-5-vl-7b-approved-fixture-inference-service-source.md',
  'src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-service-source.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ source })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen fixture service source data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  selectedGpu: source.selectedRuntime.gpu,
  serviceSourceSupportsApprovedFixtureInference:
    source.runtimeFlags.serviceSourceSupportsApprovedFixtureInference,
  cpuCallerSupportsFixtureInferenceExpectation:
    source.runtimeFlags.cpuCallerSupportsFixtureInferenceExpectation,
  defaultFailClosedPreserved: source.runtimeFlags.defaultFailClosedPreserved,
  imageBuilt: source.runtimeFlags.imageBuilt,
  fixtureInferenceSmokeExecuted: source.runtimeFlags.fixtureInferenceSmokeExecuted,
  inferenceRun: source.runtimeFlags.inferenceRun,
  nextPrompt: source.nextPrompt,
}, null, 2))
