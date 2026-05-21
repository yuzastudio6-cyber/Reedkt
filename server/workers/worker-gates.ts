import { ApiError } from '../errors/api-error'
import type { ToolReadinessCheckResult } from './tool-readiness-types'
import type { WorkerJobRecord } from './worker-job-loader'
import { createGateResult, type WorkerGateCheckResult } from './worker-result'

const EXPENSIVE_JOB_TYPES = new Set([
  'generation_orchestration',
  'generation',
  'stroke_motion_generation',
  'graphic_design_generation',
  'real_motion_generation',
  'soundsync_generation',
  'render_preview',
  'preview_delivery',
  'export',
  'provider_request',
])

const PROBE_SAFE_JOB_TYPES = new Set(['media_analysis', 'frame_extraction', 'source_sequence_mapping', 'other'])

export function collectWorkerGateChecks(input: {
  job: WorkerJobRecord
  workerType: string
  idempotencyKey: string
  toolResults?: ToolReadinessCheckResult[]
}): WorkerGateCheckResult[] {
  return [
    assertWorkerPayloadShape(input.job, input.workerType, input.idempotencyKey),
    assertNoRawChatExecution(input.job),
    assertJobDependenciesReady(input.job),
    assertWorkerCanClaimJob(input.job),
    assertApprovedSnapshotForJob(input.job),
    assertCreditReservationForExpensiveJob(input.job),
    assertRequiredToolReady(input.job.jobType, input.toolResults ?? []),
  ]
}

export function runWorkerGateChecks(input: {
  job: WorkerJobRecord
  workerType: string
  idempotencyKey: string
  toolResults?: ToolReadinessCheckResult[]
}): WorkerGateCheckResult[] {
  const checks = collectWorkerGateChecks(input)
  const failedRequired = checks.find((check) => check.required && !check.passed)
  if (failedRequired) {
    throw new ApiError('JOB_DEPENDENCY_NOT_READY', failedRequired.message, 409, { gate: failedRequired.gate })
  }

  return checks
}

export function assertWorkerPayloadShape(job: WorkerJobRecord, workerType: string, idempotencyKey: string): WorkerGateCheckResult {
  const passed = Boolean(job.id && job.workspaceId && workerType && idempotencyKey)
  return createGateResult({
    gate: 'worker_payload_shape',
    required: true,
    passed,
    message: passed
      ? 'Worker payload includes job ID, workspace ID, worker type, and idempotency key.'
      : 'Worker payload must include job ID, workspace ID, worker type, and idempotency key.',
  })
}

export function assertApprovedSnapshotForJob(job: WorkerJobRecord): WorkerGateCheckResult {
  const expensive = EXPENSIVE_JOB_TYPES.has(job.jobType)
  return createGateResult({
    gate: 'approved_snapshot',
    required: expensive,
    passed: !expensive || Boolean(job.approvedPlanSnapshotId),
    message: !expensive || job.approvedPlanSnapshotId
      ? 'Approved snapshot gate passed or is not required for this job.'
      : 'Execution jobs require approvedPlanSnapshotId before worker execution.',
  })
}

export function assertCreditReservationForExpensiveJob(job: WorkerJobRecord): WorkerGateCheckResult {
  const expensive = EXPENSIVE_JOB_TYPES.has(job.jobType)
  return createGateResult({
    gate: 'credit_reservation',
    required: expensive,
    passed: !expensive || Boolean(job.creditReservationId),
    message: !expensive || job.creditReservationId
      ? 'Credit reservation gate passed or is not required for this job.'
      : 'Expensive jobs require creditReservationId before worker execution.',
  })
}

export function assertJobDependenciesReady(job: WorkerJobRecord): WorkerGateCheckResult {
  const allowedStatuses = new Set(['queued', 'retrying'])
  return createGateResult({
    gate: 'job_status',
    required: true,
    passed: allowedStatuses.has(job.status),
    message: allowedStatuses.has(job.status)
      ? 'Job status allows worker execution.'
      : `Job status ${job.status} does not allow worker execution.`,
  })
}

export function assertWorkerCanClaimJob(job: WorkerJobRecord): WorkerGateCheckResult {
  return createGateResult({
    gate: 'worker_claim',
    required: true,
    passed: Boolean(job.id),
    message: 'Worker claim gate will use worker_job_claims before execution.',
  })
}

export function assertNoRawChatExecution(job: WorkerJobRecord): WorkerGateCheckResult {
  const payloadText = JSON.stringify(job.inputPayload).toLowerCase()
  const rawChatOnly = (
    payloadText.includes('rawchat') ||
    payloadText.includes('raw_chat') ||
    payloadText.includes('rawprompt') ||
    payloadText.includes('raw_prompt')
  ) && !job.approvedPlanSnapshotId && !PROBE_SAFE_JOB_TYPES.has(job.jobType)

  return createGateResult({
    gate: 'no_raw_chat_execution',
    required: true,
    passed: !rawChatOnly,
    message: rawChatOnly
      ? 'Worker jobs must execute approved records/snapshots, not raw chat or raw prompt payloads.'
      : 'No raw-chat-only execution detected.',
  })
}

export function assertRequiredToolReady(jobType: string, toolResults: ToolReadinessCheckResult[]): WorkerGateCheckResult {
  const requiredTools = requiredToolsForJob(jobType)
  if (requiredTools.length === 0) {
    return createGateResult({
      gate: 'required_tool_ready',
      required: false,
      passed: true,
      message: 'This job type has no required tool readiness check in this milestone.',
    })
  }

  const missingTools = requiredTools.filter((requiredTool) => {
    const result = toolResults.find((tool) => tool.toolName === requiredTool)
    return result?.status !== 'passed'
  })
  return createGateResult({
    gate: 'required_tool_ready',
    required: true,
    passed: missingTools.length === 0,
    message: missingTools.length === 0
      ? `${requiredTools.join(', ')} readiness passed.`
      : `${missingTools.join(', ')} readiness is required before this worker can execute.`,
    details: {
      requiredTools,
      toolResults: toolResults.map((tool) => ({
        toolName: tool.toolName,
        status: tool.status,
        summary: tool.summary,
      })),
    },
  })
}

export function requiredToolForJob(jobType: string): 'ffprobe' | 'remotion' | undefined {
  return requiredToolsForJob(jobType)[0] as 'ffprobe' | 'remotion' | undefined
}

export function requiredToolsForJob(jobType: string): Array<'ffmpeg' | 'ffprobe' | 'remotion'> {
  if (jobType === 'media_analysis' || jobType === 'frame_extraction') return ['ffprobe']
  if (jobType === 'basic_render_smoke') return ['ffmpeg', 'ffprobe']
  if (jobType === 'render_preview' || jobType === 'export') return ['remotion']
  return []
}
