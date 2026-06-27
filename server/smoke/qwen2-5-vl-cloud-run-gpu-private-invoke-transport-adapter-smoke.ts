import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import {
  createQwen25VlPrivateInvokeRuntimeApproval,
  runQwen25VlPrivateInvokeTransportAdapter,
  QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_TRANSPORT_ADAPTER_CONTRACT,
} from '../../src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-transport-adapter'
import { QWEN25_PRIVATE_INVOKE_AUTH_REVERIFY_RESULT } from '../activation/qwen2-5-vl-cloud-run-gpu-private-invoke-auth-reverify-result'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_READINESS_ROLLUP } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-readiness-rollup'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_cloud_run_gpu_private_invoke_transport_adapter_defined_fail_closed'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_53-PRIVATE-INVOKE-ROUTING-FIX: fix controlled private invoke route/ingress contract response, no inference'

type JsonRecord = Record<string, unknown>

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

const forbiddenTextPatterns: Array<[string, RegExp]> = [
  ['concrete URL', /\bhttps?:\/\//i],
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
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

function assertNoRuntimeSideEffects(flags: JsonRecord) {
  for (const key of [
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
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-transport-adapter.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-readiness-rollup.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-auth-preflight-runner.md',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-transport-adapter.ts',
  'server/smoke/qwen2-5-vl-cloud-run-gpu-private-invoke-transport-adapter-smoke.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-7b-cloud-run-gpu-private-invoke-transport-adapter'],
  'tsx server/smoke/qwen2-5-vl-cloud-run-gpu-private-invoke-transport-adapter-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-transport-adapter.md')
for (const phrase of [
  DECISION,
  '`blocked_transport_disabled`',
  '`resolveServiceUrl`',
  '`resolveAudience`',
  '`fetchIdentityToken`',
  '`sendRequest`',
  '`invocationEnabledNow`',
  '`authReverifyPassed`',
  'auth/IAM reverify passed',
  'HTTP `404`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const disabled = await runQwen25VlPrivateInvokeTransportAdapter()
assert.equal(disabled.decision, DECISION)
assert.equal(disabled.status, 'blocked_transport_disabled')
assert.equal(disabled.envelopeAcceptedForFutureTransport, true)
assert.ok(disabled.missingApprovalGates.includes('invocationEnabledNow'))
assertNoRuntimeSideEffects(disabled.runtimeFlags)
assert.equal(disabled.runtimeFlags.localEnvelopeValidated, true)
assert.equal(disabled.runtimeFlags.runtimeApprovalChecked, true)
assert.equal(disabled.runtimeFlags.transportDependenciesChecked, false)

let dependencyCallCount = 0
const blockedBeforeDependencies = await runQwen25VlPrivateInvokeTransportAdapter({
  dependencies: {
    resolveServiceUrl: async () => {
      dependencyCallCount += 1
      return 'mock-local-service-url-not-used'
    },
  },
})
assert.equal(blockedBeforeDependencies.status, 'blocked_transport_disabled')
assert.equal(dependencyCallCount, 0, 'disabled transport must not call injected dependencies')
assertNoRuntimeSideEffects(blockedBeforeDependencies.runtimeFlags)

const incompleteApproval = await runQwen25VlPrivateInvokeTransportAdapter({
  runtimeApproval: {
    invocationEnabledNow: true,
    authReverifyPassed: false,
  },
})
assert.equal(incompleteApproval.status, 'blocked_runtime_approval_missing')
assert.ok(incompleteApproval.missingApprovalGates.includes('authReverifyPassed'))
assert.ok(incompleteApproval.missingApprovalGates.includes('cloudRunServiceDescribeVerified'))
assertNoRuntimeSideEffects(incompleteApproval.runtimeFlags)

const missingDependencies = await runQwen25VlPrivateInvokeTransportAdapter({
  runtimeApproval: createQwen25VlPrivateInvokeRuntimeApproval({
    invocationEnabledNow: true,
    authReverifyPassed: true,
    cloudRunServiceDescribeVerified: true,
    cloudRunIamPolicyVerified: true,
    runtimeServiceAccountVerified: true,
    projectInvokerPolicyVerified: true,
  }),
})
assert.equal(missingDependencies.status, 'blocked_transport_dependencies_missing')
assert.deepEqual(missingDependencies.missingDependencies, [
  'resolveServiceUrl',
  'resolveAudience',
  'fetchIdentityToken',
  'sendRequest',
])
assertNoRuntimeSideEffects(missingDependencies.runtimeFlags)
assert.equal(missingDependencies.runtimeFlags.transportDependenciesChecked, true)

const invalidEnvelope = await runQwen25VlPrivateInvokeTransportAdapter({
  queueFixture: { payloadJson: { raw_prompt: 'blocked' } },
})
assert.equal(invalidEnvelope.status, 'blocked_invalid_envelope')
assert.equal(invalidEnvelope.envelopeAcceptedForFutureTransport, false)
assertNoRuntimeSideEffects(invalidEnvelope.runtimeFlags)

const contract = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_TRANSPORT_ADAPTER_CONTRACT
assert.equal(contract.decision, DECISION)
assert.equal(contract.defaultInvocationEnabledNow, false)
assert.equal(contract.requiresInjectedTransportDependencies, true)
assert.equal(contract.requiresAuthReverifyPassed, true)
assert.equal(contract.mutatesSupabase, false)
assert.equal(contract.createsGeneratedAsset, false)
assert.equal(contract.spendsCredits, false)
assert.equal(contract.unlocksBeta, false)
assert.equal(contract.unlocksProduction, false)

assert.equal(QWEN25_PRIVATE_INVOKE_AUTH_REVERIFY_RESULT.status, 'passed')
assert.equal(
  QWEN25_PRIVATE_INVOKE_AUTH_REVERIFY_RESULT.remainingBlocker,
  'private_invoke_smoke_execution_required_no_inference',
)
assert.equal(QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_READINESS_ROLLUP.runtimeFlags.privateInvokeReady, false)

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-transport-adapter.md',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-transport-adapter.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({
  disabled,
  blockedBeforeDependencies,
  incompleteApproval,
  missingDependencies,
  invalidEnvelope,
  contract,
})
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen transport adapter data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  defaultStatus: disabled.status,
  incompleteApprovalStatus: incompleteApproval.status,
  missingDependenciesStatus: missingDependencies.status,
  invalidEnvelopeStatus: invalidEnvelope.status,
  dependencyCallCount,
  cloudRunInvocationAttempted: disabled.runtimeFlags.cloudRunInvocationAttempted,
  identityTokenFetched: disabled.runtimeFlags.identityTokenFetched,
  inferenceRun: disabled.runtimeFlags.inferenceRun,
  nextPrompt: NEXT_PROMPT,
}, null, 2))
