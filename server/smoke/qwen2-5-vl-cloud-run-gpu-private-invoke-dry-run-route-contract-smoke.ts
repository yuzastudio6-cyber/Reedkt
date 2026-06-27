import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  createMockApiRouterSummary,
  createMockApiRuntimeContext,
  handleMockApiRequest,
} from '../../src/backend/api/mock-api-router'
import { getApiRouteById } from '../../src/backend/api/api-route-registry'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_DRY_RUN_ROUTE } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-dry-run-route'

const ROOT = process.cwd()
const ROUTE_ID = 'jobs.qwen2_5_vl.privateInvoke.dryRun'
const DECISION =
  'qwen2_5_vl_7b_cloud_run_gpu_private_invoke_dry_run_route_contract_registered_mock_only'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_49-PRIVATE-INVOKE-AUTH-REVERIFY-PLAN: prepare guarded auth reverify after user gcloud reauth, no invocation'

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
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
  ['identity token assignment', /\b(identityToken|idToken|accessToken)\s*[:=]\s*['"][^'"]+['"]/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  ['execution true claim', /\b(transportAttemptedNow|serviceUrlResolvedNow|authHeaderCreated|identityTokenFetched|cloudRunInvocationAttempted|serviceRuntimeRequestSent|dispatchSubmitted|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe pass claim', /\b(dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i],
]

const forbiddenValuePatterns: Array<[string, RegExp]> = [
  ['concrete URL', /\bhttps?:\/\//i],
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
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
    'serviceUrlResolvedNow',
    'authHeaderCreated',
    'identityTokenFetched',
    'cloudRunInvocationAttempted',
    'serviceRuntimeRequestSent',
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

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-dry-run-route-contract.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-dry-run-coordinator.md',
  'src/backend/api/routes/job-api-routes.ts',
  'src/backend/api/mock-api-router.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-dry-run-route.ts',
  'server/smoke/qwen2-5-vl-cloud-run-gpu-private-invoke-dry-run-route-contract-smoke.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-7b-cloud-run-gpu-private-invoke-dry-run-route-contract'],
  'tsx server/smoke/qwen2-5-vl-cloud-run-gpu-private-invoke-dry-run-route-contract-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-dry-run-route-contract.md')
for (const phrase of [
  DECISION,
  ROUTE_ID,
  '`POST`',
  '`/api/jobs/qwen2-5-vl/private-invoke/dry-run/mock`',
  '`mock_ready`',
  '`workspace_editor`',
  '`handleMockQwenPrivateInvokeDryRun`',
  '`blocked_transport_not_attempted`',
  '`transportAttemptedNow=false`',
  '`identityTokenFetched=false`',
  '`cloudRunInvocationAttempted=false`',
  '`inferenceRun=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const route = getApiRouteById(ROUTE_ID)
check(route, 'Qwen dry-run route must be registered')
assert.equal(route.id, ROUTE_ID)
assert.equal(route.domain, 'jobs')
assert.equal(route.method, 'POST')
assert.equal(route.path, '/api/jobs/qwen2-5-vl/private-invoke/dry-run/mock')
assert.equal(route.status, 'mock_ready')
assert.equal(route.runtimeMode, 'mock')
assert.equal(route.securityLevel, 'workspace_editor')
assert.equal(route.requiresSupabase, false)
assert.equal(route.requiresServiceRole, false)
assert.equal(route.requiresProviderSecret, false)
assert.equal(route.requiresStripeSecret, false)
assert.equal(route.mockHandlerName, 'handleMockQwenPrivateInvokeDryRun')

const evidence = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_DRY_RUN_ROUTE
assert.equal(evidence.decision, DECISION)
assert.equal(evidence.routeId, ROUTE_ID)
assert.equal(evidence.nextPrompt, NEXT_PROMPT)
assert.equal(evidence.routeBoundaries.registeredInApiRouteMap, true)
assert.equal(evidence.routeBoundaries.rawPromptBodyRejectedByMockHandler, true)
assert.equal(evidence.runtimeFlags.routeContractRegistered, true)
assert.equal(evidence.runtimeFlags.mockHandlerRegistered, true)
assertFalseFlags(evidence.runtimeFlags)

const summary = createMockApiRouterSummary()
assert.ok(summary.mockReadyRouteIds.includes(ROUTE_ID), 'route must appear in mock-ready route ids')

const response = await handleMockApiRequest({
  routeId: ROUTE_ID,
  context: createMockApiRuntimeContext({
    requestId: 'mock-qwen-route-smoke-001',
    workspaceId: 'workspace_mock_qwen_route_001',
    projectId: 'project_mock_qwen_route_001',
  }),
})
assert.equal(response.ok, true)
assert.equal(response.statusCode, 200)
const data = response.data as JsonRecord
assert.equal(data.status, 'blocked_transport_not_attempted')
assert.equal(data.transportAttemptedNow, false)
assert.equal(data.invocationAllowedNow, false)
assert.equal(data.runtimeCanAdvanceNow, false)
assert.equal((data.responseClassification as JsonRecord).status, 'blocked_transport_auth')
assertFalseFlags(data.runtimeFlags as JsonRecord)

const rawPromptResponse = await handleMockApiRequest({
  routeId: ROUTE_ID,
  context: createMockApiRuntimeContext({
    requestId: 'mock-qwen-route-smoke-raw-prompt',
    workspaceId: 'workspace_mock_qwen_route_001',
    projectId: 'project_mock_qwen_route_001',
  }),
  body: {
    raw_prompt: 'blocked mock raw prompt',
  },
})
assert.equal(rawPromptResponse.ok, false)
assert.equal(rawPromptResponse.statusCode, 400)
assert.equal(rawPromptResponse.error?.code, 'qwen_private_invoke_dry_run_raw_prompt_rejected')
assert.equal(rawPromptResponse.mockOnly, true)

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-dry-run-route-contract.md',
  'src/backend/api/routes/job-api-routes.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-dry-run-route.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ route, evidence, response: response.data })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen dry-run route data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  routeId: ROUTE_ID,
  routeStatus: route.status,
  routeRuntimeMode: route.runtimeMode,
  mockResponseStatus: data.status,
  rawPromptRejected: rawPromptResponse.error?.code,
  transportAttemptedNow: data.transportAttemptedNow,
  cloudRunInvocationAttempted: (data.runtimeFlags as JsonRecord).cloudRunInvocationAttempted,
  identityTokenFetched: (data.runtimeFlags as JsonRecord).identityTokenFetched,
  inferenceRun: (data.runtimeFlags as JsonRecord).inferenceRun,
  nextPrompt: NEXT_PROMPT,
}, null, 2))
