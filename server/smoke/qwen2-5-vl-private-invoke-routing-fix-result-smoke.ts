import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

import { QWEN25_PRIVATE_INVOKE_ROUTING_FIX_RESULT } from '../activation/qwen2-5-vl-cloud-run-gpu-private-invoke-routing-fix-result'

const MODE = 'qwen2_5_vl_private_invoke_routing_fix_result'
const DECISION =
  'qwen2_5_vl_private_invoke_routing_fix_blocked_internal_caller_required_no_inference'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_54-PRIVATE-INVOKE-INTERNAL-CALLER-HARNESS: create controlled internal caller or internal LB/PSC path for contract smoke, no inference'

type JsonRecord = Record<string, unknown>

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

function read(relativePath: string) {
  return readFileSync(relativePath, 'utf8')
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
  ['unsafe inference true claim', /\b(modelImportRun|modelLoadRun|vllmEngineInitialized|promptProcessed|forwardPassRun|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
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

function assertFalseFlags(flags: JsonRecord) {
  for (const key of [
    'internalCallerHarnessApproved',
    'internalCallerHarnessCreated',
    'internalLoadBalancerCreated',
    'privateServiceConnectConfigured',
    'vpcConnectorCreated',
    'publicIngressRelaxed',
    'unauthenticatedInvokerAdded',
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
    'betaUnlocked',
    'productionUnlocked',
    'dryRunPassedClaimed',
    'generatedLocalFixturePassedClaimed',
  ]) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-routing-fix-result.md',
  'server/activation/qwen2-5-vl-cloud-run-gpu-private-invoke-routing-fix-result.ts',
  'server/activation/qwen2-5-vl-cloud-run-gpu-private-invoke-smoke-execute.ts',
  'server/smoke/qwen2-5-vl-private-invoke-routing-fix-result-smoke.ts',
  'package.json',
]) {
  check(existsSync(file), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-private-invoke-routing-fix-result'],
  'tsx server/smoke/qwen2-5-vl-private-invoke-routing-fix-result-smoke.ts',
)

const docText = read('docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-routing-fix-result.md')
const runnerSource = read('server/activation/qwen2-5-vl-cloud-run-gpu-private-invoke-smoke-execute.ts')

for (const phrase of [
  MODE,
  DECISION,
  '`internal-and-cloud-load-balancing`',
  '`REEDITPRO_QWEN25_VL_PRIVATE_INVOKE_INTERNAL_ROUTE_CONFIRMED`',
  '`private_ingress_internal_caller_required`',
  '`restrictedIngressDirectLocalRequestBlocked=true`',
  '`internalCallerHarnessApproved=false`',
  '`publicIngressRelaxed=false`',
  '`cloudRunInvocationAttempted=false`',
  '`serviceRuntimeRequestSent=false`',
  '`inferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(docText.includes(phrase), `Doc missing phrase: ${phrase}`)
}

for (const phrase of [
  'const INTERNAL_ROUTE_ENV',
  'REEDITPRO_QWEN25_VL_PRIVATE_INVOKE_INTERNAL_ROUTE_CONFIRMED',
  'restrictedIngressDirectLocalRequestBlocked',
  'private_ingress_internal_caller_required',
  'readIngress(service)',
  'isRestrictedIngress(ingress)',
  NEXT_PROMPT,
]) {
  assert.ok(runnerSource.includes(phrase), `Runner missing phrase: ${phrase}`)
}

const result = QWEN25_PRIVATE_INVOKE_ROUTING_FIX_RESULT
assert.equal(result.mode, MODE)
assert.equal(result.status, 'blocked')
assert.equal(result.decision, DECISION)
assert.deepEqual(result.blockers, ['private_ingress_internal_caller_required'])
assert.equal(result.observedRoutingPosture.serviceReady, true)
assert.equal(result.observedRoutingPosture.serviceIngress, 'internal-and-cloud-load-balancing')
assert.equal(result.observedRoutingPosture.cloudRunServiceIamInvokerPresent, true)
assert.equal(result.observedRoutingPosture.directLocalServiceHostSmokeAllowed, false)
assert.equal(result.observedRoutingPosture.directLocalServiceHostPreviouslyReturned404, true)
assert.equal(result.observedRoutingPosture.internalLoadBalancerRouteFound, false)
assert.equal(result.observedRoutingPosture.urlMapsFound, false)
assert.equal(result.observedRoutingPosture.backendServicesFound, false)
assert.equal(result.observedRoutingPosture.serverlessVpcAccessApiEnabled, false)
assert.equal(result.observedRoutingPosture.publicIngressRelaxationAllowed, false)
assert.equal(result.routeFixFinding.authzNoLongerPrimaryBlocker, true)
assert.equal(result.routeFixFinding.restrictedIngressRequiresInternalCallerPath, true)
assert.equal(result.routeFixFinding.directLocalServiceHostRequestWouldNotProveContractReachability, true)
assert.ok(result.routeFixFinding.blockedBySourceOfTruth.includes('public ingress relaxation'))
assert.equal(result.runnerPatch.blocksBeforeTokenFetchWhenInternalRouteUnconfirmed, true)
assert.equal(result.runnerPatch.blocksBeforeRequestWhenInternalRouteUnconfirmed, true)
assert.equal(result.runnerPatch.serviceUrlValueStored, false)
assert.equal(result.runnerPatch.tokenValueStored, false)
assert.equal(result.runtimeFlags.routingFixRecorded, true)
assert.equal(result.runtimeFlags.restrictedIngressObserved, true)
assert.equal(result.runtimeFlags.restrictedIngressDirectLocalRequestBlocked, true)
assertFalseFlags(result.runtimeFlags as JsonRecord)
assert.equal(result.nextPrompt, NEXT_PROMPT)

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-routing-fix-result.md',
  'server/activation/qwen2-5-vl-cloud-run-gpu-private-invoke-routing-fix-result.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ result })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen private invoke routing fix result data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  mode: result.mode,
  decision: result.decision,
  runId: result.runId,
  status: result.status,
  blockers: result.blockers,
  serviceIngress: result.observedRoutingPosture.serviceIngress,
  directLocalServiceHostSmokeAllowed: result.observedRoutingPosture.directLocalServiceHostSmokeAllowed,
  internalCallerHarnessApproved: result.runtimeFlags.internalCallerHarnessApproved,
  cloudRunInvocationAttempted: result.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: result.runtimeFlags.inferenceRun,
  nextPrompt: result.nextPrompt,
}, null, 2))
