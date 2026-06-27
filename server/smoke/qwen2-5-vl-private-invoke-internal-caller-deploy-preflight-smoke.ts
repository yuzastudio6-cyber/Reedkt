import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_INTERNAL_CALLER_DEPLOY_PREFLIGHT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-internal-caller-deploy-preflight'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_INTERNAL_CALLER_HARNESS } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-internal-caller-harness'

const MODE = 'qwen2_5_vl_private_invoke_internal_caller_deploy_preflight_only'
const DECISION =
  'qwen2_5_vl_private_invoke_internal_caller_deploy_preflight_blocked_private_route_required_no_deploy_no_inference'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_55A-PRIVATE-INVOKE-INTERNAL-ROUTE-APPROVAL: approve Direct VPC private route for CPU-only caller harness, no inference'

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
  ['unsafe deploy true claim', /\b(callerHarnessDeployAllowedNow|callerHarnessDeployed|callerHarnessExecuted|internalLoadBalancerCreated|privateServiceConnectConfigured|vpcConnectorCreated|privateGoogleAccessChanged)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe auth or request true claim', /\b(serviceUrlResolvedNow|identityTokenFetched|cloudRunInvocationAttempted|serviceRuntimeRequestSent|serviceAccountCreated|iamPolicyChanged)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe runtime true claim', /\b(modelImportRun|modelLoadRun|vllmEngineInitialized|promptProcessed|forwardPassRun|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
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
    'dedicatedCallerJobFound',
    'defaultSubnetPrivateGoogleAccess',
    'approvedPrivateRouteReady',
    'cpuOnlyCallerImageDefined',
    'callerHarnessDeployAllowedNow',
    'callerHarnessDeployed',
    'callerHarnessExecuted',
    'internalLoadBalancerCreated',
    'privateServiceConnectConfigured',
    'vpcConnectorCreated',
    'privateGoogleAccessChanged',
    'serviceAccountCreated',
    'iamPolicyChanged',
    'serviceUrlResolvedNow',
    'serviceUrlValueStored',
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
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-internal-caller-deploy-preflight.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-internal-caller-harness.md',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-internal-caller-deploy-preflight.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-internal-caller-harness.ts',
  'server/smoke/qwen2-5-vl-private-invoke-internal-caller-deploy-preflight-smoke.ts',
  'package.json',
]) {
  check(existsSync(file), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-private-invoke-internal-caller-deploy-preflight'],
  'tsx server/smoke/qwen2-5-vl-private-invoke-internal-caller-deploy-preflight-smoke.ts',
)

const docText = read('docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-internal-caller-deploy-preflight.md')
for (const phrase of [
  MODE,
  DECISION,
  '`internal-and-cloud-load-balancing`',
  'NVIDIA L4',
  'scale-to-zero',
  'Private Google Access set to `false`',
  '`direct_vpc_egress_private_route_not_ready`',
  '`cpu_only_internal_caller_image_not_defined`',
  '`callerHarnessDeployAllowedNow=false`',
  '`callerHarnessDeployed=false`',
  '`privateGoogleAccessChanged=false`',
  '`cloudRunInvocationAttempted=false`',
  '`inferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(docText.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const preflight = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_INTERNAL_CALLER_DEPLOY_PREFLIGHT
assert.equal(preflight.mode, MODE)
assert.equal(preflight.decision, DECISION)
assert.equal(
  preflight.upstreamInternalCallerHarnessDecision,
  QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_INTERNAL_CALLER_HARNESS.decision,
)
assert.equal(preflight.targetService.service, 'reeditpro-qwen2-5-vl-l4-worker')
assert.equal(preflight.readOnlyPreflight.targetServiceReady, true)
assert.equal(preflight.readOnlyPreflight.targetServiceIngress, 'internal-and-cloud-load-balancing')
assert.equal(preflight.readOnlyPreflight.targetServiceGpu, 'nvidia_l4')
assert.equal(preflight.readOnlyPreflight.targetServiceScaleToZeroPosture, true)
assert.ok(preflight.readOnlyPreflight.artifactRegistryRepositoriesPresent.includes('reeditpro-staging-workers'))
assert.ok(preflight.readOnlyPreflight.artifactRegistryRepositoriesPresent.includes('reeditpro-workers'))
assert.equal(preflight.readOnlyPreflight.dedicatedCallerJobFound, false)
assert.equal(preflight.readOnlyPreflight.inspectedSubnet.privateGoogleAccess, false)
assert.equal(preflight.readOnlyPreflight.internalLoadBalancerFound, false)
assert.equal(preflight.readOnlyPreflight.privateServiceConnectPathFound, false)
assert.equal(preflight.readOnlyPreflight.serverlessVpcAccessConnectorSelected, false)
assert.deepEqual(
  preflight.deployBlockers.map((blocker) => blocker.id),
  ['direct_vpc_egress_private_route_not_ready', 'cpu_only_internal_caller_image_not_defined'],
)
assert.equal(preflight.preferredFutureHarness.kind, 'cloud_run_job_cpu_only')
assert.equal(preflight.preferredFutureHarness.gpuRequired, false)
assert.equal(preflight.preferredFutureHarness.deployAllowedNow, false)
assert.equal(preflight.runtimeFlags.internalCallerDeployPreflightRecorded, true)
assert.equal(preflight.runtimeFlags.targetServiceReady, true)
assert.equal(preflight.runtimeFlags.targetServiceIngressInternalAndCloudLoadBalancing, true)
assert.equal(preflight.runtimeFlags.artifactRegistryReposPresent, true)
assertFalseFlags(preflight.runtimeFlags as JsonRecord)
assert.equal(preflight.nextPrompt, NEXT_PROMPT)

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-internal-caller-deploy-preflight.md',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-internal-caller-deploy-preflight.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ preflight })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen internal caller deploy preflight data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  mode: preflight.mode,
  decision: preflight.decision,
  targetServiceReady: preflight.readOnlyPreflight.targetServiceReady,
  serviceIngress: preflight.readOnlyPreflight.targetServiceIngress,
  defaultSubnetPrivateGoogleAccess: preflight.readOnlyPreflight.inspectedSubnet.privateGoogleAccess,
  callerHarnessDeployAllowedNow: preflight.runtimeFlags.callerHarnessDeployAllowedNow,
  cloudRunInvocationAttempted: preflight.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: preflight.runtimeFlags.inferenceRun,
  nextPrompt: preflight.nextPrompt,
}, null, 2))
