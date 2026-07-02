import {
  assertWorkerEventPayloadSanitized,
  buildWorkerIdempotencyKey,
  runProductionWorkerRuntime,
  sanitizeWorkerEventPayload,
  shouldRetryWorkerJob,
} from '../workers/production'
import type { ProductionWorkerJobPayload } from '../workers/production'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function withIdempotency(payload: Omit<ProductionWorkerJobPayload, 'idempotencyKey'>): ProductionWorkerJobPayload {
  const candidate = { ...payload, idempotencyKey: '' }
  return { ...candidate, idempotencyKey: buildWorkerIdempotencyKey(candidate) }
}

const basePayload = withIdempotency({
  jobId: 'prod-worker-job-cpu-valid',
  workspaceId: 'workspace-prod-smoke',
  projectId: 'project-prod-smoke',
  mediaAssetId: 'media-prod-smoke',
  approvedSnapshotId: 'approved-snapshot-prod-smoke',
  editPlanId: 'edit-plan-prod-smoke',
  toolExecutionPlanId: 'tool-exec-prod-smoke',
  mediaAnalysisReportId: 'media-analysis-prod-smoke',
  workerType: 'cpu_analysis_worker',
  executionMode: 'dry_run',
  attempt: 1,
  maxAttempts: 3,
  requestedToolIds: ['ffprobe'],
  requestedRecipeIds: ['smart_cut_recipe'],
  storageReferenceIds: ['source_media/workspaces/workspace-prod-smoke/projects/project-prod-smoke/source.mov'],
  createdAt: new Date().toISOString(),
})

const validCpu = await runProductionWorkerRuntime({ payload: basePayload })
assert(validCpu.status === 'completed', 'Valid CPU dry_run payload should complete placeholder orchestration.')
assert(validCpu.events.some((event) => event.eventName === 'job_claimed'), 'Valid CPU payload should claim a lease.')
assert(validCpu.events.some((event) => event.eventName === 'job_completed'), 'Valid CPU payload should complete.')
assert(validCpu.output?.mockOnly === true, 'Valid CPU payload should route only to mock-safe placeholder output.')

const missingSnapshotPayload = withIdempotency({ ...basePayload, jobId: 'prod-worker-missing-snapshot', approvedSnapshotId: '' })
const missingSnapshot = await runProductionWorkerRuntime({ payload: missingSnapshotPayload })
assert(missingSnapshot.status === 'blocked', 'Payload without approvedSnapshotId should block.')
assert(missingSnapshot.gateChecks.some((gate) => gate.gateName === 'approved_snapshot' && gate.hardBlock), 'Approved snapshot gate should hard block.')

const missingIdempotency = await runProductionWorkerRuntime({
  payload: { ...basePayload, jobId: 'prod-worker-missing-idempotency', idempotencyKey: '' },
})
assert(missingIdempotency.status === 'blocked', 'Payload without idempotencyKey should block.')
assert(missingIdempotency.gateChecks.some((gate) => gate.gateName === 'idempotency' && gate.hardBlock), 'Idempotency gate should hard block.')

const rawPromptPayload = withIdempotency({
  ...basePayload,
  jobId: 'prod-worker-raw-prompt',
  metadata: { rawPrompt: 'cut this video from chat text' },
})
const rawPrompt = await runProductionWorkerRuntime({ payload: rawPromptPayload })
assert(rawPrompt.status === 'blocked', 'Payload with rawPrompt should block.')
assert(rawPrompt.gateChecks.some((gate) => gate.gateName === 'raw_prompt_block' && gate.hardBlock), 'Raw prompt gate should hard block.')

const signedUrlPayload = withIdempotency({
  ...basePayload,
  jobId: 'prod-worker-signed-url',
  storageReferenceIds: ['https://storage.googleapis.com/private-object?X-Goog-Signature=abc'],
})
const signedUrl = await runProductionWorkerRuntime({ payload: signedUrlPayload })
assert(signedUrl.status === 'blocked', 'Payload with signed URL should block.')
assert(signedUrl.gateChecks.some((gate) => gate.gateName === 'signed_url_block' && gate.hardBlock), 'Signed URL gate should hard block.')

const gpuOnCpuPayload = withIdempotency({
  ...basePayload,
  jobId: 'prod-worker-gpu-on-cpu',
  requestedToolIds: ['real_esrgan'],
})
const gpuOnCpu = await runProductionWorkerRuntime({ payload: gpuOnCpuPayload })
assert(gpuOnCpu.status === 'blocked', 'GPU tool requested on CPU worker should block.')
assert(gpuOnCpu.gateChecks.some((gate) => gate.gateName === 'registry_runtime' && gate.hardBlock), 'Registry runtime gate should hard block wrong worker placement.')

const revideoProductionPayload = withIdempotency({
  ...basePayload,
  jobId: 'prod-worker-revideo-production',
  workerType: 'render_worker',
  executionMode: 'production_ready',
  requestedToolIds: ['revideo'],
  creditReservationId: 'credit-reservation-prod-smoke',
  requiredQualityGateIds: ['quality-gate-render-integrity'],
  renderMode: 'final_export',
})
const revideoProduction = await runProductionWorkerRuntime({ payload: revideoProductionPayload })
assert(revideoProduction.status === 'blocked', 'Revideo production execution should block.')

const evaluationProductionPayload = withIdempotency({
  ...basePayload,
  jobId: 'prod-worker-eval-tool-production',
  workerType: 'gpu_ai_worker',
  executionMode: 'production_ready',
  requestedToolIds: ['whisper_cpp'],
  creditReservationId: 'credit-reservation-prod-smoke',
})
const evaluationProduction = await runProductionWorkerRuntime({ payload: evaluationProductionPayload })
assert(evaluationProduction.status === 'blocked', 'Evaluation-only tool production execution should block.')

const modelWeightProductionPayload = withIdempotency({
  ...basePayload,
  jobId: 'prod-worker-model-weight-production',
  workerType: 'gpu_ai_worker',
  executionMode: 'production_ready',
  requestedToolIds: ['real_esrgan'],
  creditReservationId: 'credit-reservation-prod-smoke',
})
const modelWeightProduction = await runProductionWorkerRuntime({ payload: modelWeightProductionPayload })
assert(modelWeightProduction.status === 'blocked', 'Unreviewed model-weight tool production execution should block.')
assert(modelWeightProduction.gateChecks.some((gate) => gate.gateName === 'license_model_weight' && gate.hardBlock), 'License/model-weight gate should hard block.')

const mockSafeSecretPayload = withIdempotency({
  ...basePayload,
  jobId: 'prod-worker-mock-safe-secret',
  executionMode: 'mock_safe',
  metadata: { serviceRoleKey: 'never-store-this' },
})
const mockSafeSecret = await runProductionWorkerRuntime({ payload: mockSafeSecretPayload })
assert(mockSafeSecret.status === 'blocked', 'mock_safe payload with secrets should still block.')
assert(mockSafeSecret.gateChecks.some((gate) => gate.gateName === 'secret_block' && gate.hardBlock), 'Secret gate should hard block in mock_safe mode.')

assert(
  !shouldRetryWorkerJob({ failureCategory: 'policy_blocked', attempt: 1, maxAttempts: 3 }),
  'Retry policy must not retry policy_blocked failures.',
)

const sanitized = sanitizeWorkerEventPayload({
  rawPrompt: 'secret prompt',
  sourceReference: 'https://example.com/file.mov?x-goog-signature=abc',
  providerApiKey: 'secret',
  safe: 'ok',
})
assertWorkerEventPayloadSanitized(sanitized)
assert(JSON.stringify(sanitized).includes('[REDACTED_URL]'), 'Sanitized event payload should redact URL-like values.')

const samePayloadKey = buildWorkerIdempotencyKey(basePayload)
assert(samePayloadKey === basePayload.idempotencyKey, 'Idempotency key should be stable for same stable IDs.')
const changedPayload = withIdempotency({ ...basePayload, jobId: 'prod-worker-changed-job', toolExecutionPlanId: 'tool-exec-prod-smoke-changed' })
assert(changedPayload.idempotencyKey !== basePayload.idempotencyKey, 'Idempotency key should change when stable IDs change.')

const renderNoQaPayload = withIdempotency({
  ...basePayload,
  jobId: 'prod-worker-render-no-qa',
  workerType: 'render_worker',
  executionMode: 'dry_run',
  requestedToolIds: ['remotion'],
  renderMode: 'final_export',
})
const renderNoQa = await runProductionWorkerRuntime({ payload: renderNoQaPayload })
assert(renderNoQa.status === 'blocked', 'Render final export without QA gate references should block.')
assert(renderNoQa.gateChecks.some((gate) => gate.gateName === 'qa_policy' && gate.hardBlock), 'QA policy gate should hard block final export.')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'valid_cpu_dry_run_completes',
    'missing_approved_snapshot_blocks',
    'missing_idempotency_blocks',
    'raw_prompt_blocks',
    'signed_url_blocks',
    'gpu_tool_on_cpu_blocks',
    'revideo_production_blocks',
    'evaluation_only_production_blocks',
    'model_weight_production_blocks',
    'mock_safe_secret_blocks',
    'policy_blocked_not_retried',
    'events_are_sanitized',
    'idempotency_stable',
    'idempotency_changes_with_stable_ids',
    'render_final_export_requires_qa_gates',
  ],
}))
