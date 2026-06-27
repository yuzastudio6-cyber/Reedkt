import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_DIRECT_VPC_ROUTE_CONFIG_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-direct-vpc-route-config-result'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_INTERNAL_ROUTE_APPROVAL } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-internal-route-approval'

const MODE = 'qwen2_5_vl_private_invoke_direct_vpc_route_config_result'
const DECISION =
  'qwen2_5_vl_private_invoke_direct_vpc_route_config_configured_subnet_no_deploy_no_inference'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_55C-PRIVATE-INVOKE-CPU-CALLER-SOURCE: add CPU-only internal caller harness source, no deploy/no inference'

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
  ['unsafe deploy true claim', /\b(callerHarnessDeployAllowedNow|callerHarnessDeployed|callerHarnessExecuted|internalLoadBalancerCreated|privateServiceConnectConfigured|vpcConnectorCreated)\b\s*[:=]\s*(true|"true")/i],
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

function assertFalseRuntimeFlags(flags: JsonRecord) {
  for (const key of [
    'defaultSubnetChanged',
    'defaultSubnetPrivateGoogleAccess',
    'cpuOnlyCallerImageDefined',
    'callerHarnessDeployAllowedNow',
    'callerHarnessDeployed',
    'callerHarnessExecuted',
    'internalLoadBalancerCreated',
    'privateServiceConnectConfigured',
    'vpcConnectorCreated',
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
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-direct-vpc-route-config-result.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-internal-route-approval.md',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-direct-vpc-route-config-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-internal-route-approval.ts',
  'server/smoke/qwen2-5-vl-private-invoke-direct-vpc-route-config-result-smoke.ts',
  'package.json',
]) {
  check(existsSync(file), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-private-invoke-direct-vpc-route-config-result'],
  'tsx server/smoke/qwen2-5-vl-private-invoke-direct-vpc-route-config-result-smoke.ts',
)

const docText = read('docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-direct-vpc-route-config-result.md')
for (const phrase of [
  MODE,
  DECISION,
  '`qwen-private-caller-us-central1`',
  '`10.40.0.0/26`',
  'Private Google Access: `true`',
  'default `us-central1/default` subnet remains unchanged',
  '`gcpNetworkMutationOccurred=true`',
  '`dedicatedCallerSubnetCreated=true`',
  '`dedicatedCallerSubnetPrivateGoogleAccess=true`',
  '`defaultSubnetChanged=false`',
  '`cpuOnlyCallerImageDefined=false`',
  '`callerHarnessDeployed=false`',
  '`cloudRunInvocationAttempted=false`',
  '`inferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(docText.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const result = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_DIRECT_VPC_ROUTE_CONFIG_RESULT
assert.equal(result.mode, MODE)
assert.equal(result.decision, DECISION)
assert.equal(
  result.upstreamInternalRouteApprovalDecision,
  QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_INTERNAL_ROUTE_APPROVAL.decision,
)
assert.equal(result.configuredRoute.kind, 'direct_vpc_egress_subnet')
assert.equal(result.configuredRoute.project, 'reeditpro')
assert.equal(result.configuredRoute.region, 'us-central1')
assert.equal(result.configuredRoute.network, 'default')
assert.equal(result.configuredRoute.subnet, 'qwen-private-caller-us-central1')
assert.equal(result.configuredRoute.cidr, '10.40.0.0/26')
assert.equal(result.configuredRoute.privateGoogleAccess, true)
assert.equal(result.configuredRoute.defaultSubnetChanged, false)
assert.equal(result.configuredRoute.defaultSubnetPrivateGoogleAccess, false)
assert.equal(result.routeConfigRationale.avoidsPublicIngressRelaxation, true)
assert.equal(result.routeConfigRationale.avoidsUnauthenticatedInvoker, true)
assert.equal(result.routeConfigRationale.avoidsServerlessVpcAccessConnectorIdleCost, true)
assert.equal(result.routeConfigRationale.isolatesFutureCallerNetworkingFromDefaultSubnet, true)
assert.equal(result.runtimeFlags.directVpcRouteConfigResultRecorded, true)
assert.equal(result.runtimeFlags.gcpNetworkMutationOccurred, true)
assert.equal(result.runtimeFlags.dedicatedCallerSubnetCreated, true)
assert.equal(result.runtimeFlags.dedicatedCallerSubnetPrivateGoogleAccess, true)
assert.equal(result.runtimeFlags.directVpcPrivateRoutePrerequisiteReady, true)
assertFalseRuntimeFlags(result.runtimeFlags as JsonRecord)
assert.deepEqual(
  result.remainingBlockers.map((blocker) => blocker.id),
  [
    'cpu_only_internal_caller_image_not_defined',
    'controlled_cpu_only_caller_job_not_deployed',
    'internal_contract_response_not_observed',
  ],
)
assert.equal(result.nextPrompt, NEXT_PROMPT)

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-direct-vpc-route-config-result.md',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-direct-vpc-route-config-result.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ result })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen direct VPC route config result data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  mode: result.mode,
  decision: result.decision,
  subnet: result.configuredRoute.subnet,
  privateGoogleAccess: result.configuredRoute.privateGoogleAccess,
  defaultSubnetChanged: result.configuredRoute.defaultSubnetChanged,
  gcpNetworkMutationOccurred: result.runtimeFlags.gcpNetworkMutationOccurred,
  callerHarnessDeployed: result.runtimeFlags.callerHarnessDeployed,
  cloudRunInvocationAttempted: result.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: result.runtimeFlags.inferenceRun,
  nextPrompt: result.nextPrompt,
}, null, 2))
