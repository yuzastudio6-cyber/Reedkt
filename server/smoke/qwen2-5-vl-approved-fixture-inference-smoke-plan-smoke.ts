import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-smoke-plan'
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT, validateQwen25VlLocalQueueFixture } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract'
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-runtime-contract'
import { QWEN2_5_VL_PRIVATE_INVOKE_RUNTIME_READINESS_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-private-invoke-runtime-readiness-review'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_approved_fixture_inference_smoke_plan_defined_no_execution'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58-APPROVED-FIXTURE-INFERENCE-SMOKE-EXECUTE: run first private approved-fixture Qwen inference smoke, no generated assets/no beta'

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
  ['unsafe execution true claim', /\b(firstApprovedFixtureInferenceSmokeExecuted|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated)\b\s*[:=]\s*(true|"true")/i],
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
    'firstApprovedFixtureInferenceSmokeExecuted',
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
  'docs/qwen2-5-vl-7b-approved-fixture-inference-smoke-plan.md',
  'docs/qwen2-5-vl-7b-private-invoke-runtime-readiness-review.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-runtime-contract.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-local-queue-contract.md',
  'src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-smoke-plan.ts',
  'server/smoke/qwen2-5-vl-approved-fixture-inference-smoke-plan-smoke.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-approved-fixture-inference-smoke-plan'],
  'tsx server/smoke/qwen2-5-vl-approved-fixture-inference-smoke-plan-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-approved-fixture-inference-smoke-plan.md')
for (const phrase of [
  DECISION,
  'NVIDIA L4',
  '`Qwen/Qwen2.5-VL-7B-Instruct`',
  '`cc594898137f460bfe9f0759e9844b3ce807cfb5`',
  '`46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b`',
  'approved plan snapshot id and hash',
  'credit reservation id',
  'queue lease metadata',
  'idempotency key',
  'structured finding ids',
  'edit intent ids',
  'Public URLs and signed URLs are not source of truth.',
  '`visual_understanding`',
  '`frame_asset_qa`',
  '`broll_candidate_review`',
  '`caption_visual_consistency_qa`',
  '`approvedFixtureInferenceSmokePlanDefined=true`',
  '`firstApprovedFixtureInferenceSmokeExecuted=false`',
  '`modelImportRun=false`',
  '`modelLoadRun=false`',
  '`vllmEngineInitialized=false`',
  '`inferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const plan = QWEN2_5_VL_APPROVED_FIXTURE_INFERENCE_SMOKE_PLAN
assert.equal(plan.decision, DECISION)
assert.equal(
  plan.upstreamRuntimeReadinessReviewDecision,
  QWEN2_5_VL_PRIVATE_INVOKE_RUNTIME_READINESS_REVIEW.decision,
)
assert.equal(
  plan.upstreamRuntimeContractDecision,
  QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT.decision,
)
assert.equal(
  plan.upstreamLocalQueueContractDecision,
  QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.decision,
)
assert.equal(plan.selectedRuntime.gpu, 'nvidia_l4')
assert.equal(plan.selectedRuntime.region, 'us-central1')
assert.equal(plan.selectedRuntime.runtime, 'vllm')
assert.equal(plan.selectedRuntime.runOnUseStopWhenIdle, true)
assert.equal(plan.selectedRuntime.minInstancesRequired, 0)
assert.equal(plan.selectedRuntime.maxInstancesForFirstFixtureSmoke, 1)
assert.equal(plan.selectedRuntime.cpuFallbackAllowedForRealQwenVlm, false)
assert.deepEqual(plan.modelPolicy, QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT.modelPolicyRequired)
assert.equal(plan.plannedFixture.approvedPlanSnapshotId, 'aps_mock_qwen_queue_001')
assert.equal(plan.plannedFixture.publicUrlsAreSourceOfTruth, false)
assert.equal(plan.plannedFixture.signedUrlsAreSourceOfTruth, false)
assert.deepEqual(
  plan.useCaseRanking.map((item) => item.useCase),
  ['visual_understanding', 'frame_asset_qa', 'broll_candidate_review', 'caption_visual_consistency_qa'],
)
assert.equal(plan.futureExecutionPreflight.verifyApprovedQueueFixture, true)
assert.equal(plan.futureExecutionPreflight.verifyNoPublicOrSignedUrlSourceOfTruth, true)
assert.equal(plan.futureExecutionPreflight.verifyNoRawPrompt, true)
assert.equal(plan.futureRuntimeGateDelta.mayEnableModelImportOnlyInsideFutureSmoke, true)
assert.equal(plan.futureRuntimeGateDelta.mayEnableModelLoadOnlyInsideFutureSmoke, true)
assert.equal(plan.futureRuntimeGateDelta.mayEnableInferenceOnlyInsideFutureSmoke, true)
assert.equal(plan.futureRuntimeGateDelta.mayCreateGeneratedAsset, false)
assert.equal(plan.futureRuntimeGateDelta.mayCreatePublicArtifact, false)
assert.equal(plan.futureRuntimeGateDelta.mayCreateSignedUrl, false)
assertFalseFlags(plan.runtimeFlags)
assert.equal(plan.runtimeFlags.approvedFixtureInferenceSmokePlanDefined, true)
assert.equal(plan.runtimeFlags.approvedQueueFixtureAvailable, true)
assert.equal(plan.runtimeFlags.privateInvokeContractPathReady, true)
assert.equal(plan.runtimeFlags.modelRevisionPinned, true)
assert.equal(plan.nextPrompt, NEXT_PROMPT)

const queueValidation = validateQwen25VlLocalQueueFixture(
  QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture,
)
assert.equal(queueValidation.ok, true, 'approved local queue fixture must remain valid')
assert.equal(queueValidation.acceptedForFutureDispatch, true)
assert.equal(queueValidation.dispatchAllowedNow, false)
assert.equal(queueValidation.cloudRunInvocationAllowedNow, false)
assert.equal(queueValidation.inferenceAllowedNow, false)

for (const file of [
  'docs/qwen2-5-vl-7b-approved-fixture-inference-smoke-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-smoke-plan.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ plan })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen fixture inference smoke plan data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  selectedGpu: plan.selectedRuntime.gpu,
  modelRevision: plan.modelPolicy.modelRevision,
  rankedUseCases: plan.useCaseRanking.map((item) => item.useCase),
  approvedFixtureInferenceSmokePlanDefined:
    plan.runtimeFlags.approvedFixtureInferenceSmokePlanDefined,
  firstApprovedFixtureInferenceSmokeExecuted:
    plan.runtimeFlags.firstApprovedFixtureInferenceSmokeExecuted,
  inferenceRun: plan.runtimeFlags.inferenceRun,
  generatedAssetsCreated: plan.runtimeFlags.generatedAssetsCreated,
  nextPrompt: plan.nextPrompt,
}, null, 2))
