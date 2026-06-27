import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_INTERNAL_CALLER_DEPLOY_PREFLIGHT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-internal-caller-deploy-preflight'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_INTERNAL_ROUTE_APPROVAL } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-internal-route-approval'

const MODE = 'qwen2_5_vl_private_invoke_internal_route_approval_only'
const DECISION =
  'qwen2_5_vl_private_invoke_internal_route_approval_conditional_direct_vpc_no_config_no_inference'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_55B-PRIVATE-INVOKE-DIRECT-VPC-ROUTE-CONFIG: configure Direct VPC private route for CPU-only caller harness, no inference'

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
  ['unsafe config true claim', /\b(gcpNetworkMutationAllowedNow|privateGoogleAccessChanged|directVpcEgressConfigured|internalLoadBalancerCreated|privateServiceConnectConfigured|vpcConnectorCreated)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe deploy true claim', /\b(callerHarnessDeployAllowedNow|callerHarnessDeployed|callerHarnessExecuted)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe auth or request true claim', /\b(serviceUrlResolvedNow|identityTokenFetched|cloudRunInvocationAttempted|serviceRuntimeRequestSent)\b\s*[:=]\s*(true|"true")/i],
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
    'serverlessVpcAccessConnectorPreferred',
    'publicIngressRelaxationAllowed',
    'unauthenticatedInvokerAllowed',
    'gcpNetworkMutationAllowedNow',
    'privateGoogleAccessChanged',
    'directVpcEgressConfigured',
    'internalLoadBalancerCreated',
    'privateServiceConnectConfigured',
    'vpcConnectorCreated',
    'callerHarnessDeployAllowedNow',
    'callerHarnessDeployed',
    'callerHarnessExecuted',
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
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-internal-route-approval.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-internal-caller-deploy-preflight.md',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-internal-route-approval.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-internal-caller-deploy-preflight.ts',
  'server/smoke/qwen2-5-vl-private-invoke-internal-route-approval-smoke.ts',
  'package.json',
]) {
  check(existsSync(file), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-private-invoke-internal-route-approval'],
  'tsx server/smoke/qwen2-5-vl-private-invoke-internal-route-approval-smoke.ts',
)

const docText = read('docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-internal-route-approval.md')
for (const phrase of [
  MODE,
  DECISION,
  '`direct_vpc_egress_with_private_google_access`',
  '`internal-and-cloud-load-balancing`',
  'Private Google Access disabled',
  '`futureDirectVpcRouteConfigApproved=true`',
  '`futurePrivateGoogleAccessConfigApproved=true`',
  '`gcpNetworkMutationAllowedNow=false`',
  '`privateGoogleAccessChanged=false`',
  '`directVpcEgressConfigured=false`',
  '`callerHarnessDeployed=false`',
  '`cloudRunInvocationAttempted=false`',
  '`inferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(docText.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const approval = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_INTERNAL_ROUTE_APPROVAL
assert.equal(approval.mode, MODE)
assert.equal(approval.decision, DECISION)
assert.equal(
  approval.upstreamDeployPreflightDecision,
  QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_INTERNAL_CALLER_DEPLOY_PREFLIGHT.decision,
)
assert.equal(approval.selectedFutureRoute.id, 'direct_vpc_egress_with_private_google_access')
assert.equal(approval.selectedFutureRoute.preferred, true)
assert.equal(approval.selectedFutureRoute.requiresPrivateGoogleAccess, true)
assert.equal(approval.selectedFutureRoute.configAllowedNow, false)
assert.equal(approval.currentEvidence.targetServiceReady, true)
assert.equal(approval.currentEvidence.targetServiceIngress, 'internal-and-cloud-load-balancing')
assert.equal(approval.currentEvidence.targetServiceGpu, 'nvidia_l4')
assert.equal(approval.currentEvidence.defaultSubnetPrivateGoogleAccess, false)
assert.equal(approval.currentEvidence.dedicatedCallerJobExists, false)
assert.equal(approval.currentEvidence.cpuOnlyCallerImageDefined, false)
assert.ok(approval.futureConfigAcceptanceCriteria.includes('use_cpu_only_cloud_run_job_caller'))
assert.ok(approval.futureConfigAcceptanceCriteria.includes('keep_beta_and_production_blocked'))
assert.equal(approval.runtimeFlags.internalRouteApprovalRecorded, true)
assert.equal(approval.runtimeFlags.futureDirectVpcRouteConfigApproved, true)
assert.equal(approval.runtimeFlags.futurePrivateGoogleAccessConfigApproved, true)
assert.equal(approval.runtimeFlags.fallbackInternalLoadBalancerAllowedIfDirectVpcBlocked, true)
assert.equal(approval.runtimeFlags.fallbackPrivateServiceConnectAllowedIfDirectVpcBlocked, true)
assertFalseFlags(approval.runtimeFlags as JsonRecord)
assert.equal(approval.nextPrompt, NEXT_PROMPT)

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-internal-route-approval.md',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-internal-route-approval.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ approval })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen internal route approval data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  mode: approval.mode,
  decision: approval.decision,
  selectedFutureRoute: approval.selectedFutureRoute.id,
  futureDirectVpcRouteConfigApproved: approval.runtimeFlags.futureDirectVpcRouteConfigApproved,
  gcpNetworkMutationAllowedNow: approval.runtimeFlags.gcpNetworkMutationAllowedNow,
  privateGoogleAccessChanged: approval.runtimeFlags.privateGoogleAccessChanged,
  cloudRunInvocationAttempted: approval.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: approval.runtimeFlags.inferenceRun,
  nextPrompt: approval.nextPrompt,
}, null, 2))
