import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_APPROVED_WORKER_INTEGRATION_READINESS_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-approved-worker-integration-readiness-review'
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract'
import { QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_DISPATCH_ADAPTER } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-fail-closed-dispatch-adapter'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-config'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-plan'
import { QWEN2_5_VL_PRIVATE_RUNTIME_READINESS_REVIEW_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-private-runtime-readiness-review-result'
import { QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_RESULT_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-structured-fixture-output-result-review'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_approved_worker_integration_readiness_review_accepted_backend_runtime_dispatch_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58J-BACKEND-RUNTIME-DISPATCH-IMPLEMENTATION-PLAN: plan Qwen backend runtime dispatch integration after approved worker readiness, no beta/no generated assets'

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
  ['unsafe runtime ready claim', /\b(privateInvokeReady|readyForRealWorkerDispatch|workersDispatched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
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
    'readyForRealWorkerDispatch',
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
  'docs/qwen2-5-vl-7b-approved-worker-integration-readiness-review.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-local-queue-contract.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-dispatch-readiness.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-dispatch-adapter.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-plan.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config.md',
  'docs/qwen2-5-vl-7b-structured-fixture-output-result-review.md',
  'docs/qwen2-5-vl-7b-private-runtime-readiness-review-result.md',
  'src/backend/mock/mock-qwen2-5-vl-approved-worker-integration-readiness-review.ts',
  'server/smoke/qwen2-5-vl-approved-worker-integration-readiness-review-smoke.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-approved-worker-integration-readiness-review'],
  'tsx server/smoke/qwen2-5-vl-approved-worker-integration-readiness-review-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-approved-worker-integration-readiness-review.md')
for (const phrase of [
  DECISION,
  '`runWorkerJobSchema`',
  '`qwen2_5_vl_cloud_run_gpu_worker`',
  '`media_analysis`',
  '`qwen2_5_vl_cloud_run_gpu_runtime_request_v1`',
  '`blocked_fail_closed_cloud_run_invocation_disabled`',
  'backend runtime dispatch implementation required: true',
  'ready for real worker dispatch: false',
  '`approvedWorkerIntegrationReadinessReviewRecorded=true`',
  '`approvedWorkerIntegrationEvidenceAccepted=true`',
  '`localQueueContractAcceptedForWorkerIntegration=true`',
  '`failClosedDispatchAdapterAcceptedForWorkerIntegration=true`',
  '`privateInvokePlanAndConfigAcceptedForWorkerIntegration=true`',
  '`backendRuntimeDispatchImplementationRequired=true`',
  '`approvedWorkerIntegrationReviewRequired=false`',
  '`readyForRealWorkerDispatch=false`',
  '`privateInvokeReady=false`',
  '`workersDispatched=false`',
  '`generatedAssetsCreated=false`',
  '`publicArtifactsCreated=false`',
  '`signedUrlsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const review = QWEN2_5_VL_APPROVED_WORKER_INTEGRATION_READINESS_REVIEW
assert.equal(review.decision, DECISION)
assert.equal(
  review.upstreamLocalQueueContractDecision,
  QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.decision,
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
assert.equal(
  review.upstreamStructuredFixtureOutputResultReviewDecision,
  QWEN2_5_VL_STRUCTURED_FIXTURE_OUTPUT_RESULT_REVIEW.decision,
)
assert.equal(
  review.upstreamPrivateRuntimeReadinessReviewResultDecision,
  QWEN2_5_VL_PRIVATE_RUNTIME_READINESS_REVIEW_RESULT.decision,
)

assert.equal(review.readinessDecision.approvedWorkerIntegrationReadinessReviewRecorded, true)
assert.equal(review.readinessDecision.approvedWorkerIntegrationEvidenceAccepted, true)
assert.equal(review.readinessDecision.localQueueContractAcceptedForWorkerIntegration, true)
assert.equal(review.readinessDecision.failClosedDispatchAdapterAcceptedForWorkerIntegration, true)
assert.equal(review.readinessDecision.privateInvokePlanAndConfigAcceptedForWorkerIntegration, true)
assert.equal(review.readinessDecision.structuredFixtureMetadataAcceptedForWorkerIntegration, true)
assert.equal(review.readinessDecision.privateRuntimeEvidenceAcceptedForWorkerIntegration, true)
assert.equal(review.readinessDecision.backendRuntimeDispatchImplementationRequired, true)
assert.equal(review.readinessDecision.approvedWorkerIntegrationReviewRequired, false)
assertFalseFlags(review.runtimeFlags)

for (const required of [
  'backend_dispatch_route_for_qwen2_5_vl_cloud_run_gpu_worker',
  'privileged_transactional_job_create_claim_lease_heartbeat_completion_failure_and_stale_recovery',
  'approved_plan_snapshot_hash_and_immutable_version_verification',
  'credit_reservation_verification_and_failure_release_or_refund',
  'private_source_of_truth_refs_with_manifests_and_checksums',
  'backend_only_cloud_run_target_and_audience_resolution',
  'idempotent_invocation_and_retry_policy',
  'observability_for_dispatch_attempt_response_failure_retry_and_cleanup',
  'no_raw_chat_raw_prompt_signed_url_public_url_provider_response_or_frontend_bypass',
]) {
  assert.ok(
    (review.backendRuntimeDispatchRequirements as readonly string[]).includes(required),
    `missing requirement ${required}`,
  )
}

for (const evidenceId of [
  'approved_snapshot_local_queue_contract',
  'runtime_payload_contract',
  'fail_closed_dispatch_adapter',
  'private_runtime_structured_metadata',
  'browser_boundary',
]) {
  assert.ok(
    review.acceptedIntegrationEvidence.some((row) => row.id === evidenceId && row.status === 'accepted'),
    `missing accepted evidence ${evidenceId}`,
  )
}

for (const blocked of [
  'real_backend_worker_dispatch',
  'live_supabase_queue_or_storage_mutation',
  'credit_reservation_spend_release_or_refund',
  'cloud_run_request_from_user_facing_queue',
  'generated_asset_creation',
  'public_artifact_or_signed_url_delivery',
  'frontend_or_raw_prompt_invocation',
  'beta_or_production_traffic',
]) {
  assert.ok((review.blockedUses as readonly string[]).includes(blocked), `missing blocked use ${blocked}`)
}

assert.equal(review.nextPrompt, NEXT_PROMPT)

for (const file of [
  'docs/qwen2-5-vl-7b-approved-worker-integration-readiness-review.md',
  'src/backend/mock/mock-qwen2-5-vl-approved-worker-integration-readiness-review.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ review })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen approved worker integration readiness review data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: review.decision,
  approvedWorkerIntegrationEvidenceAccepted:
    review.runtimeFlags.approvedWorkerIntegrationEvidenceAccepted,
  backendRuntimeDispatchImplementationRequired:
    review.runtimeFlags.backendRuntimeDispatchImplementationRequired,
  readyForRealWorkerDispatch: review.runtimeFlags.readyForRealWorkerDispatch,
  privateInvokeReady: review.runtimeFlags.privateInvokeReady,
  workersDispatched: review.runtimeFlags.workersDispatched,
  generatedAssetsCreated: review.runtimeFlags.generatedAssetsCreated,
  nextPrompt: review.nextPrompt,
}, null, 2))
