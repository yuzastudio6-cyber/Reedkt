import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import {
  assertToolAllowedForWorker,
  assertToolModelWeightsAllowed,
  getProductionToolProfile,
} from '../tool-registry'
import { QWEN25_PRIVATE_INVOKE_AUTH_REVERIFY_RESULT } from '../activation/qwen2-5-vl-cloud-run-gpu-private-invoke-auth-reverify-result'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_FRONTEND_CLIENT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-frontend-client'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_DRY_RUN_ROUTE } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-dry-run-route'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_READINESS_ROLLUP } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-readiness-rollup'
import { getQwen25VlPrivateInvokeFrontendClientStatus } from '../../src/backend/api/qwen2-5-vl-private-invoke-frontend-client'
import { getQwenVlPlannerRoutingUiData } from '../../src/lib/qwen-vl-planner-routing-ui'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_cloud_run_gpu_private_invoke_readiness_rollup_blocked_auth_reverify_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_50-GCLOUD-REAUTH-USER: refresh local gcloud auth outside Codex, no token/no invocation'

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
  ['identity token assignment', /\b(identityToken|idToken|accessToken)\s*[:=]\s*['"][^'"]+['"]/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  ['unsafe runtime true claim', /\b(privateInvokeReady|betaReady|productionReady|identityTokenFetched|cloudRunInvocationAttempted|serviceRuntimeRequestSent|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
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

function assertRollupFalseFlags(flags: JsonRecord) {
  for (const key of [
    'privateInvocationAuthVerified',
    'cloudRunServiceDescribeVerified',
    'cloudRunIamPolicyVerified',
    'runtimeServiceAccountVerified',
    'projectInvokerPolicyVerified',
    'privateInvokeReady',
    'betaReady',
    'productionReady',
    'serviceUrlResolvedNow',
    'authHeaderCreated',
    'identityTokenFetched',
    'cloudRunInvocationAttempted',
    'serviceRuntimeRequestSent',
    'modelImportRun',
    'modelLoadRun',
    'vllmEngineInitialized',
    'inferenceRun',
    'workersDispatched',
    'supabaseTouched',
    'sqlExecuted',
    'generatedAssetsCreated',
    'publicArtifactsCreated',
    'signedUrlsCreated',
    'creditMutationCreated',
    'dryRunPassedClaimed',
    'generatedLocalFixturePassedClaimed',
  ]) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

function assertClientFalseFlags(flags: JsonRecord) {
  for (const key of [
    'serviceUrlResolvedNow',
    'authHeaderCreated',
    'identityTokenFetched',
    'cloudRunInvocationAttempted',
    'serviceRuntimeRequestSent',
    'modelImportRun',
    'modelLoadRun',
    'vllmEngineInitialized',
    'inferenceRun',
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

function expectThrows(action: () => unknown, message: string) {
  let thrown = false
  try {
    action()
  } catch {
    thrown = true
  }
  assert.equal(thrown, true, message)
}

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-readiness-rollup.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-frontend-client.md',
  'docs/qwen2-5-vl-7b-private-invoke-auth-reverify-result.md',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-readiness-rollup.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-frontend-client.ts',
  'server/smoke/qwen2-5-vl-cloud-run-gpu-private-invoke-readiness-rollup-smoke.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-7b-cloud-run-gpu-private-invoke-readiness-rollup'],
  'tsx server/smoke/qwen2-5-vl-cloud-run-gpu-private-invoke-readiness-rollup-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-readiness-rollup.md')
for (const phrase of [
  DECISION,
  '`qwen_vl`',
  '`Qwen2.5-VL 7B Instruct`',
  '`jobs.qwen2_5_vl.privateInvoke.dryRun`',
  '`/api/jobs/qwen2-5-vl/private-invoke/dry-run/mock`',
  '`privateInvocationAuthVerified=false`',
  '`identityTokenFetched=false`',
  '`cloudRunInvocationAttempted=false`',
  '`inferenceRun=false`',
  '`workersDispatched=false`',
  '`generatedAssetsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  'NVIDIA L4',
  'scale to zero required',
  'run-on-use and stop-when-idle',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const rollup = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_READINESS_ROLLUP
assert.equal(rollup.decision, DECISION)
assert.equal(rollup.registryToolId, 'qwen_vl')
assert.equal(rollup.selectedRuntime.gpu, 'nvidia_l4')
assert.equal(rollup.selectedRuntime.costPosture, 'scale_to_zero_required')
assert.equal(rollup.selectedRuntime.minInstancesRequired, 0)
assert.equal(rollup.selectedRuntime.maxInstancesForInitialPrivateInvoke, 1)
assert.equal(rollup.selectedRuntime.cpuFallbackAllowed, false)
assert.equal(rollup.nextPrompt, NEXT_PROMPT)

const qwenProfile = getProductionToolProfile('qwen_vl')
check(qwenProfile, 'Qwen production tool profile must exist.')
assert.equal(qwenProfile.displayName, 'Qwen2.5-VL 7B Instruct')
assert.equal(qwenProfile.category, 'visual_analysis')
assert.equal(qwenProfile.workerType, 'gpu_ai_worker')
assert.equal(qwenProfile.gpuRequired, true)
assert.equal(qwenProfile.cpuAllowed, false)
assert.equal(qwenProfile.modelWeightPolicy.required, true)
assert.ok(qwenProfile.bestFor.includes('Generated fixture visual understanding'))
assert.ok(qwenProfile.notBestFor.includes('AI video generation'))
assert.ok(qwenProfile.notBestFor.includes('Final render/export'))
expectThrows(() => assertToolModelWeightsAllowed('qwen_vl'), 'Qwen model weights must remain unapproved.')
expectThrows(() => assertToolAllowedForWorker('qwen_vl', 'cpu_analysis_worker'), 'Qwen must not be CPU-worker ready.')

const route = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_DRY_RUN_ROUTE
assert.equal(route.routeId, 'jobs.qwen2_5_vl.privateInvoke.dryRun')
assert.equal(route.routeBoundaries.status, 'mock_ready')
assert.equal(route.routeBoundaries.runtimeMode, 'mock')
assert.equal(route.routeBoundaries.rawPromptBodyRejectedByMockHandler, true)

const client = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_FRONTEND_CLIENT
assert.equal(client.runtimeFlags.frontendClientDefined, true)
assert.equal(client.runtimeFlags.routeMockReady, true)
assert.equal(client.clientBoundaries.usesCentralReeditProApiClient, true)
assert.equal(client.clientBoundaries.browserMayCallCloudRun, false)
assertClientFalseFlags(client.runtimeFlags)

const status = getQwen25VlPrivateInvokeFrontendClientStatus()
assert.equal(status.mode, 'qwen2_5_vl_private_invoke_frontend_client_mock_only')
assert.equal(status.mayInvokeCloudRun, false)
assert.equal(status.mayRunInference, false)
assert.equal(status.mayDispatchWorker, false)

const ui = getQwenVlPlannerRoutingUiData()
assert.equal(ui.privateInvokeClient.currentStatus, 'blocked_auth_reverify_required')
assert.equal(ui.privateInvokeClient.routeId, 'jobs.qwen2_5_vl.privateInvoke.dryRun')
assert.equal(ui.executionGates.plannerMayInvokeCloudRun, false)
assert.equal(ui.summary.dryRunPassedClaimed, false)

const auth = QWEN25_PRIVATE_INVOKE_AUTH_REVERIFY_RESULT
assert.equal(auth.status, 'blocked')
assert.equal(auth.blockedReason, 'gcloud_auth_session_requires_interactive_reauthentication')
assert.equal(auth.qwenRuntimeReadiness.privateInvocationAuthVerified, false)
assert.equal(auth.qwenRuntimeReadiness.readyForPrivateInvocationSmoke, false)

const gateIds = rollup.readinessGates.map((gate) => gate.id)
assert.deepEqual(gateIds, [
  'production_registry_profile',
  'production_readiness_spec',
  'private_invoke_route',
  'frontend_client',
  'chat_ui_surface',
  'cloud_run_auth_reverify',
])
assert.equal(rollup.readinessGates.filter((gate) => gate.status === 'ready').length, 5)
assert.equal(
  rollup.readinessGates.filter((gate) => gate.status === 'blocked_auth_reverify_required').length,
  1,
)
assertRollupFalseFlags(rollup.runtimeFlags)
assert.equal(rollup.runtimeFlags.registryProfileReady, true)
assert.equal(rollup.runtimeFlags.productionReadinessSpecRegistered, true)
assert.equal(rollup.runtimeFlags.routeMockReady, true)
assert.equal(rollup.runtimeFlags.frontendClientReady, true)
assert.equal(rollup.runtimeFlags.uiSurfacingReady, true)

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-readiness-rollup.md',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-readiness-rollup.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ rollup, client, route, status, ui })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen readiness rollup data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  readyGateCount: rollup.readinessGates.filter((gate) => gate.status === 'ready').length,
  blockedGateCount: rollup.readinessGates.filter((gate) => gate.status !== 'ready').length,
  selectedGpu: rollup.selectedRuntime.gpu,
  costPosture: rollup.selectedRuntime.costPosture,
  privateInvokeReady: rollup.runtimeFlags.privateInvokeReady,
  betaReady: rollup.runtimeFlags.betaReady,
  productionReady: rollup.runtimeFlags.productionReady,
  blockedReason: auth.blockedReason,
  nextPrompt: rollup.nextPrompt,
}, null, 2))
