import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_DISPATCH_ADAPTER } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-fail-closed-dispatch-adapter'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-config'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-plan'
import { QWEN2_5_VL_PRIVATE_RUNTIME_READINESS_REVIEW_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-private-runtime-readiness-review-result'
import { QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_RESULT_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-structured-fixture-output-result-review'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_private_runtime_readiness_review_accepted_worker_integration_review_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58I-APPROVED-WORKER-INTEGRATION-READINESS: review Qwen approved worker integration after private runtime acceptance, no beta/no generated assets'

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
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  ['unsafe runtime ready claim', /\b(privateInvokeReady|workersDispatched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe generated/public claim', /\b(generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe unlock claim', /\b(betaReady|productionReady|dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i],
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
    return Object.entries(value as JsonRecord).flatMap(([key, nested]) =>
      scanValues(nested, [...pathParts, key]),
    )
  }
  return []
}

function assertFalseFlags(flags: JsonRecord) {
  for (const key of [
    'privateInvokeReady',
    'betaReady',
    'productionReady',
    'providerCallsMade',
    'workersDispatched',
    'supabaseTouched',
    'sqlExecuted',
    'generatedAssetsCreated',
    'publicArtifactsCreated',
    'signedUrlsCreated',
    'mediaProcessingRun',
    'renderExportRun',
    'creditMutationCreated',
    'dryRunPassedClaimed',
    'generatedLocalFixturePassedClaimed',
  ]) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

for (const file of [
  'docs/qwen2-5-vl-7b-private-runtime-readiness-review-result.md',
  'docs/qwen2-5-vl-7b-structured-fixture-output-result-review.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-dispatch-adapter.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-plan.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config.md',
  'src/backend/mock/mock-qwen2-5-vl-private-runtime-readiness-review-result.ts',
  'server/smoke/qwen2-5-vl-private-runtime-readiness-review-result-smoke.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-private-runtime-readiness-review-result'],
  'tsx server/smoke/qwen2-5-vl-private-runtime-readiness-review-result-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-private-runtime-readiness-review-result.md')
for (const phrase of [
  DECISION,
  'NVIDIA L4',
  'run-on-use',
  'scale to zero',
  '`parsedJson=true`',
  '`schemaValid=true`',
  '`objectCount=3`',
  '`textLikeRegionCount=1`',
  '`spatialRelationCount=2`',
  '`blockedActionCount=4`',
  '`privateRuntimeReadinessReviewRecorded=true`',
  '`controlledPrivateFixtureRuntimeEvidenceAccepted=true`',
  '`privateFixtureStructuredMetadataAccepted=true`',
  '`privateInvokeReadyForControlledFixtureMetadata=true`',
  '`approvedWorkerIntegrationReviewRequired=true`',
  '`privateInvokeReady=false`',
  '`betaReady=false`',
  '`productionReady=false`',
  '`workersDispatched=false`',
  '`generatedAssetsCreated=false`',
  '`publicArtifactsCreated=false`',
  '`signedUrlsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const review = QWEN2_5_VL_PRIVATE_RUNTIME_READINESS_REVIEW_RESULT
assert.equal(review.decision, DECISION)
assert.equal(
  review.upstreamStructuredFixtureOutputResultReviewDecision,
  QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_RESULT_REVIEW.decision,
)
assert.equal(
  review.upstreamFailClosedDispatchAdapterDecision,
  QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_DISPATCH_ADAPTER.decision,
)
assert.equal(review.upstreamPrivateInvokePlanDecision, QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_PLAN.decision)
assert.equal(
  review.upstreamPrivateInvokeConfigDecision,
  QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG.decision,
)
assert.equal(review.selectedRuntime.gpu, 'nvidia_l4')
assert.equal(review.selectedRuntime.costPosture, 'scale_to_zero_required')
assert.equal(review.selectedRuntime.runOnUseStopWhenIdle, true)
assert.equal(review.selectedRuntime.minInstancesRequired, 0)
assert.equal(review.selectedRuntime.maxInstancesForControlledFixture, 1)
assert.equal(review.readinessDecision.controlledPrivateFixtureRuntimeEvidenceAccepted, true)
assert.equal(review.readinessDecision.privateRuntimeReadinessReviewRecorded, true)
assert.equal(review.readinessDecision.privateRuntimeEvidenceAcceptedForMetadataOnlyFixtureReview, true)
assert.equal(review.readinessDecision.privateInvokeReadyForControlledFixtureMetadata, true)
assert.equal(review.readinessDecision.privateInvokeReadyForUserFacingWorkerDispatch, false)
assert.equal(review.readinessDecision.privateInvokeReadyForBeta, false)
assert.equal(review.readinessDecision.privateInvokeReadyForProduction, false)
assert.equal(review.readinessDecision.approvedWorkerIntegrationReviewRequired, true)
assert.equal(review.runtimeFlags.privateRuntimeReadinessReviewRecorded, true)
assert.equal(review.runtimeFlags.controlledPrivateFixtureRuntimeEvidenceAccepted, true)
assert.equal(review.runtimeFlags.privateFixtureStructuredMetadataAccepted, true)
assert.equal(review.runtimeFlags.privateInvokeReadyForControlledFixtureMetadata, true)
assert.equal(review.runtimeFlags.approvedWorkerIntegrationReviewRequired, true)
assertFalseFlags(review.runtimeFlags)

for (const required of [
  'backend_dispatch_route_for_qwen2_5_vl_cloud_run_gpu_worker',
  'service_role_transactional_job_create_claim_lease_heartbeat_completion_failure_and_stale_recovery',
  'approved_plan_snapshot_hash_and_immutable_version_verification',
  'credit_reservation_verification_and_failure_release_or_refund',
  'private_source_of_truth_refs_with_manifests_and_checksums',
  'backend_only_cloud_run_target_and_audience_resolution',
  'idempotent_invocation_and_retry_policy',
  'observability_for_dispatch_attempt_response_failure_and_retry_decision',
  'no_raw_chat_raw_prompt_signed_url_public_url_provider_response_or_frontend_bypass',
]) {
  assert.ok(
    (review.workerIntegrationRequirements as readonly string[]).includes(required),
    `missing requirement ${required}`,
  )
}

for (const file of [
  'docs/qwen2-5-vl-7b-private-runtime-readiness-review-result.md',
  'src/backend/mock/mock-qwen2-5-vl-private-runtime-readiness-review-result.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ review })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen private runtime readiness review data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: review.decision,
  selectedGpu: review.selectedRuntime.gpu,
  costPosture: review.selectedRuntime.costPosture,
  privateInvokeReadyForControlledFixtureMetadata:
    review.runtimeFlags.privateInvokeReadyForControlledFixtureMetadata,
  approvedWorkerIntegrationReviewRequired:
    review.runtimeFlags.approvedWorkerIntegrationReviewRequired,
  privateInvokeReady: review.runtimeFlags.privateInvokeReady,
  betaReady: review.runtimeFlags.betaReady,
  productionReady: review.runtimeFlags.productionReady,
  generatedAssetsCreated: review.runtimeFlags.generatedAssetsCreated,
  nextPrompt: review.nextPrompt,
}, null, 2))
