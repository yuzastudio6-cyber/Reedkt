import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_PRIVATE_INVOKE_CPU_CALLER_CONTRACT_SMOKE_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-cpu-caller-contract-smoke-result'
import { QWEN2_5_VL_PRIVATE_INVOKE_RUNTIME_READINESS_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-private-invoke-runtime-readiness-review'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_private_invoke_runtime_readiness_review_first_fixture_inference_plan_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_57-APPROVED-FIXTURE-INFERENCE-SMOKE-PLAN: define first private approved-fixture Qwen inference smoke, no execution'

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
  ['identity token assignment', /\b(identityToken|idToken|accessToken)\s*[:=]\s*['"][^'"]+['"]/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  ['unsafe runtime true claim', /\b(runtimeReady|betaReady|productionReady|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
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
    'workersDispatched',
    'supabaseTouched',
    'sqlExecuted',
    'gcpMutationOccurred',
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
  'docs/qwen2-5-vl-7b-private-invoke-runtime-readiness-review.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-cpu-caller-contract-smoke-result.md',
  'src/backend/mock/mock-qwen2-5-vl-private-invoke-runtime-readiness-review.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-cpu-caller-contract-smoke-result.ts',
  'server/smoke/qwen2-5-vl-private-invoke-runtime-readiness-review-smoke.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-private-invoke-runtime-readiness-review'],
  'tsx server/smoke/qwen2-5-vl-private-invoke-runtime-readiness-review-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-private-invoke-runtime-readiness-review.md')
for (const phrase of [
  DECISION,
  'HTTP `403`',
  '`qwen_inference_disabled_after_contract_check`',
  '`contractSatisfiedForFutureRuntime=true`',
  '`runtimeContractExecutesNow=false`',
  '`modelInferenceEnabled=false`',
  'NVIDIA L4',
  'scale to zero',
  '`privateInvokeContractPathReady=true`',
  '`firstApprovedFixtureInferenceSmokeReady=false`',
  '`runtimeReady=false`',
  '`betaReady=false`',
  '`productionReady=false`',
  '`modelImportRun=false`',
  '`modelLoadRun=false`',
  '`vllmEngineInitialized=false`',
  '`inferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`publicArtifactsCreated=false`',
  '`signedUrlsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  '`visual_understanding`',
  '`broll_candidate_review`',
  '`frame_asset_qa`',
  '`caption_visual_consistency_qa`',
  'approved plan snapshot',
  'private artifact manifest',
  'credit reservation evidence',
  'idempotency key',
  'model revision',
  'no public URL source of truth',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const review = QWEN2_5_VL_PRIVATE_INVOKE_RUNTIME_READINESS_REVIEW
assert.equal(review.decision, DECISION)
assert.equal(
  review.upstreamCpuCallerContractSmokeDecision,
  QWEN2_5_VL_PRIVATE_INVOKE_CPU_CALLER_CONTRACT_SMOKE_RESULT.decision,
)
assert.equal(review.selectedRuntime.gpu, 'nvidia_l4')
assert.equal(review.selectedRuntime.region, 'us-central1')
assert.equal(review.selectedRuntime.costPosture, 'scale_to_zero_required')
assert.equal(review.selectedRuntime.runOnUseStopWhenIdle, true)
assert.equal(review.selectedRuntime.minInstancesRequired, 0)
assert.equal(review.selectedRuntime.maxInstancesForFirstFixtureSmoke, 1)
assert.equal(review.selectedRuntime.cpuFallbackAllowedForRealQwenVlm, false)
assert.equal(review.readinessFlags.privateInvokeContractPathReady, true)
assert.equal(review.readinessFlags.failClosedContractSmokePassed, true)
assert.equal(review.readinessFlags.runtimeReadinessReviewRecorded, true)
assert.equal(review.readinessFlags.firstApprovedFixtureInferenceSmokeReady, false)
assert.equal(review.readinessFlags.runtimeReady, false)
assert.equal(review.readinessFlags.betaReady, false)
assert.equal(review.readinessFlags.productionReady, false)
assertFalseFlags(review.executionFlags)
assert.equal(review.nextPrompt, NEXT_PROMPT)

const requirementIds = review.firstFixtureInferenceRequirements.map((requirement) => requirement.id)
assert.deepEqual(requirementIds, [
  'approved_snapshot_and_approval',
  'credit_and_cost_gate',
  'private_input_artifact',
  'worker_runtime_contract',
  'model_revision_and_runtime_gate',
  'metadata_only_output',
  'blocked_public_delivery',
])
assert.ok(review.allowedFutureMetadataUseCases.includes('visual_understanding'))
assert.ok(review.allowedFutureMetadataUseCases.includes('broll_candidate_review'))
assert.ok(review.allowedFutureMetadataUseCases.includes('frame_asset_qa'))
assert.ok(review.allowedFutureMetadataUseCases.includes('caption_visual_consistency_qa'))
assert.ok(review.blockedUses.includes('generated_broll_video'))
assert.ok(review.blockedUses.includes('raw_prompt_execution'))
assert.ok(review.blockedUses.includes('public_or_signed_url_source_of_truth'))
assert.ok(review.blockedUses.includes('final_render_mux_export_delivery'))

for (const file of [
  'docs/qwen2-5-vl-7b-private-invoke-runtime-readiness-review.md',
  'src/backend/mock/mock-qwen2-5-vl-private-invoke-runtime-readiness-review.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ review })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen runtime readiness review data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  selectedGpu: review.selectedRuntime.gpu,
  costPosture: review.selectedRuntime.costPosture,
  acceptedEvidenceCount: review.acceptedEvidence.length,
  futureRequirementCount: review.firstFixtureInferenceRequirements.length,
  firstApprovedFixtureInferenceSmokeReady:
    review.readinessFlags.firstApprovedFixtureInferenceSmokeReady,
  runtimeReady: review.readinessFlags.runtimeReady,
  betaReady: review.readinessFlags.betaReady,
  productionReady: review.readinessFlags.productionReady,
  inferenceRun: review.executionFlags.inferenceRun,
  nextPrompt: review.nextPrompt,
}, null, 2))
