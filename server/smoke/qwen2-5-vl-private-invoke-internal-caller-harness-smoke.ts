import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_INTERNAL_CALLER_HARNESS } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-internal-caller-harness'
import { QWEN25_PRIVATE_INVOKE_ROUTING_FIX_RESULT } from '../activation/qwen2-5-vl-cloud-run-gpu-private-invoke-routing-fix-result'

const MODE = 'qwen2_5_vl_private_invoke_internal_caller_harness_plan_only'
const DECISION =
  'qwen2_5_vl_private_invoke_internal_caller_harness_planned_no_deploy_no_inference'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_55-PRIVATE-INVOKE-INTERNAL-CALLER-DEPLOY: deploy controlled CPU-only internal caller harness, no inference'

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
  ['unsafe deploy true claim', /\b(callerHarnessDeployed|callerHarnessExecuted|internalLoadBalancerCreated|privateServiceConnectConfigured|vpcConnectorCreated)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe runtime true claim', /\b(serviceUrlResolvedNow|identityTokenFetched|cloudRunInvocationAttempted|serviceRuntimeRequestSent|modelImportRun|modelLoadRun|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
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
    'publicIngressRelaxationAllowed',
    'unauthenticatedInvokerAllowed',
    'callerHarnessDeployed',
    'callerHarnessExecuted',
    'internalLoadBalancerCreated',
    'privateServiceConnectConfigured',
    'vpcConnectorCreated',
    'serviceUrlResolvedNow',
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
    'betaUnlocked',
    'productionUnlocked',
    'dryRunPassedClaimed',
    'generatedLocalFixturePassedClaimed',
  ]) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-internal-caller-harness.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-routing-fix-result.md',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-internal-caller-harness.ts',
  'server/smoke/qwen2-5-vl-private-invoke-internal-caller-harness-smoke.ts',
  'package.json',
]) {
  check(existsSync(file), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-private-invoke-internal-caller-harness'],
  'tsx server/smoke/qwen2-5-vl-private-invoke-internal-caller-harness-smoke.ts',
)

const docText = read('docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-internal-caller-harness.md')
for (const phrase of [
  MODE,
  DECISION,
  '`internal-and-cloud-load-balancing`',
  'CPU-only Cloud Run Job',
  'Direct VPC egress',
  'avoids Serverless VPC Access connector idle VM cost',
  '`qwen_inference_disabled_after_contract_check`',
  '`publicIngressRelaxationAllowed=false`',
  '`callerHarnessDeployed=false`',
  '`callerHarnessExecuted=false`',
  '`cloudRunInvocationAttempted=false`',
  '`inferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(docText.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const harness = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_INTERNAL_CALLER_HARNESS
assert.equal(harness.mode, MODE)
assert.equal(harness.decision, DECISION)
assert.equal(harness.upstreamRoutingFixRunId, QWEN25_PRIVATE_INVOKE_ROUTING_FIX_RESULT.runId)
assert.equal(harness.currentRoutingPosture.serviceIngress, 'internal-and-cloud-load-balancing')
assert.equal(harness.currentRoutingPosture.serviceInvokerBindingPresent, true)
assert.equal(harness.currentRoutingPosture.directLocalGeneratedHostSmokeAllowed, false)
assert.equal(harness.currentRoutingPosture.urlMapsFound, false)
assert.equal(harness.currentRoutingPosture.backendServicesFound, false)
assert.equal(harness.currentRoutingPosture.serverlessNetworkEndpointGroupsFound, false)
assert.equal(harness.preferredHarness.kind, 'cloud_run_job_cpu_only')
assert.equal(harness.preferredHarness.gpuRequired, false)
assert.equal(harness.preferredHarness.minInstances, 0)
assert.equal(harness.preferredHarness.taskCount, 1)
assert.equal(harness.preferredHarness.maxRetries, 0)
assert.equal(harness.preferredHarness.networkPath, 'direct_vpc_egress_preferred')
assert.equal(harness.futureSmokeContract.expectedHttpStatus, 403)
assert.equal(harness.futureSmokeContract.expectedReason, 'qwen_inference_disabled_after_contract_check')
assert.equal(harness.futureSmokeContract.oneRequestOnly, true)
assert.equal(harness.futureSmokeContract.retryAllowed, false)
assert.equal(harness.futureSmokeContract.rawPromptAllowed, false)
assert.equal(harness.futureSmokeContract.inferenceEnabled, false)
assert.equal(harness.futureSmokeContract.outputPersistenceAllowed, false)
assert.ok(harness.requiredFuturePreconditions.includes('prove_private_vpc_or_internal_lb_or_psc_route'))
assert.equal(harness.runtimeFlags.internalCallerHarnessPlanRecorded, true)
assert.equal(harness.runtimeFlags.preferredHarnessIsCpuOnlyCloudRunJob, true)
assert.equal(harness.runtimeFlags.directVpcEgressPreferred, true)
assertFalseFlags(harness.runtimeFlags as JsonRecord)
assert.equal(harness.nextPrompt, NEXT_PROMPT)

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-internal-caller-harness.md',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-internal-caller-harness.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ harness })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen internal caller harness data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  mode: harness.mode,
  decision: harness.decision,
  serviceIngress: harness.currentRoutingPosture.serviceIngress,
  preferredHarness: harness.preferredHarness.kind,
  gpuRequired: harness.preferredHarness.gpuRequired,
  costPosture: harness.preferredHarness.costPosture,
  callerHarnessDeployed: harness.runtimeFlags.callerHarnessDeployed,
  cloudRunInvocationAttempted: harness.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: harness.runtimeFlags.inferenceRun,
  nextPrompt: harness.nextPrompt,
}, null, 2))
