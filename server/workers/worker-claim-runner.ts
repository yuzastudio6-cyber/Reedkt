import { ApiError } from '../errors/api-error'
import { createWorkerClaimService } from '../services/worker-claim-service'
import { emitToolCostEvent, estimateToolCost } from '../tool-cost-metering'
import type { ServiceContext } from '../types'
import { runToolReadinessChecks } from './tool-readiness-runner'
import type { WorkerToolName } from './tool-readiness-types'
import { emitWorkerEvent } from './worker-events'
import { collectWorkerGateChecks, requiredToolsForJob, runWorkerGateChecks } from './worker-gates'
import { loadWorkerJob } from './worker-job-loader'
import type { WorkerExecutionResult, WorkerEventPayload } from './worker-result'
import { runWorkerHandler } from './worker-runtime'

export interface WorkerClaimRunnerInput {
  jobId: string
  workspaceId?: string
  projectId?: string
  jobType?: string
  workerType: string
  workerInstanceId?: string
  idempotencyKey: string
  dryRun?: boolean
  approvedPlanSnapshotId?: string
  creditEstimateId?: string
  creditReservationId?: string
  mediaAssetId?: string
  storageObjectRecordId?: string
  payloadJson?: Record<string, unknown>
}

export async function runWorkerClaimRunner(
  context: ServiceContext,
  input: WorkerClaimRunnerInput,
): Promise<WorkerExecutionResult> {
  const startedAt = new Date().toISOString()
  const workerInstanceId = input.workerInstanceId ?? context.env.workerInstanceId
  const events: WorkerEventPayload[] = []
  const warnings: string[] = []
  const job = await loadWorkerJob(context, {
    jobId: input.jobId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
      jobType: input.jobType,
      approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      creditEstimateId: input.creditEstimateId,
      creditReservationId: input.creditReservationId,
    payloadJson: {
      ...(input.payloadJson ?? {}),
      mediaAssetId: input.mediaAssetId ?? input.payloadJson?.mediaAssetId,
      storageObjectRecordId: input.storageObjectRecordId ?? input.payloadJson?.storageObjectRecordId,
    },
  })

  const requiredTools = requiredToolsForJob(job.jobType)
  const toolCostEstimate = buildWorkerToolCostEstimate(job, input.workerType)
  const toolResults = requiredTools.length > 0
    ? (await Promise.all(requiredTools.map((requiredTool) => runToolReadinessChecks(context, {
      workspaceId: job.workspaceId,
      workerType: input.workerType,
      toolName: requiredTool as WorkerToolName,
      recordResults: false,
      requiredTools: [requiredTool as WorkerToolName],
    })))).flatMap((result) => result.checks)
    : []

  let gateChecks = collectWorkerGateChecks({
    job,
    workerType: input.workerType,
    idempotencyKey: input.idempotencyKey,
    toolResults,
  })

  const failedGate = gateChecks.find((gate) => gate.required && !gate.passed)
  if (failedGate || input.dryRun) {
    return {
      jobId: job.id,
      workerType: input.workerType,
      workerInstanceId,
      status: input.dryRun && !failedGate ? 'dry_run' : 'blocked',
      gateChecks,
      toolChecks: toolResults,
      toolCostEstimate,
      events,
      error: failedGate ? { code: 'JOB_DEPENDENCY_NOT_READY', message: failedGate.message } : undefined,
      warnings: input.dryRun ? ['Dry run completed gates and readiness without claiming or executing the worker.'] : warnings,
      startedAt,
      completedAt: new Date().toISOString(),
    }
  }

  gateChecks = runWorkerGateChecks({
    job,
    workerType: input.workerType,
    idempotencyKey: input.idempotencyKey,
    toolResults,
  })

  const claimService = createWorkerClaimService(context)
  const claimResult = await claimService.claimJob({
    workspaceId: job.workspaceId,
    projectId: job.projectId,
    jobId: job.id,
    workerType: input.workerType,
    workerInstanceId,
    leaseExpiresAt: new Date(Date.now() + context.env.workerClaimLeaseSeconds * 1000).toISOString(),
    idempotencyKey: input.idempotencyKey,
  })
  warnings.push(...claimResult.warnings)
  events.push(await emitWorkerEvent(context, job, {
    eventName: 'worker_claimed',
    workerType: input.workerType,
    workerInstanceId,
    message: 'Worker claimed job.',
    progressPercent: 5,
    eventType: 'started',
  }))

  try {
    events.push(await emitWorkerEvent(context, job, {
      eventName: 'worker_started',
      workerType: input.workerType,
      workerInstanceId,
      message: 'Worker handler started.',
      progressPercent: 20,
      eventType: 'progress',
    }))

    const output = await runWorkerHandler({ context, job, workerType: input.workerType })
    const completedAt = new Date().toISOString()
    const toolCostEvent = buildWorkerToolCostEvent({
      job,
      workerType: input.workerType,
      startedAt,
      completedAt,
      status: 'completed',
      estimatedInternalCostCents: toolCostEstimate.expectedInternalCostCents,
    })
    await claimService.heartbeat({ jobId: job.id })
    events.push(await emitWorkerEvent(context, job, {
      eventName: 'worker_completed',
      workerType: input.workerType,
      workerInstanceId,
      message: 'Worker handler completed.',
      progressPercent: 100,
      payloadJson: { output },
      eventType: 'completed',
    }))
    const releaseResult = await claimService.release({ jobId: job.id, claimStatus: 'completed' })
    warnings.push(...releaseResult.warnings)

    return {
      jobId: job.id,
      workerType: input.workerType,
      workerInstanceId,
      status: 'completed',
      claim: claimResult.claim,
      gateChecks,
      toolChecks: toolResults,
      toolCostEstimate,
      toolCostEvent,
      events,
      output,
      warnings,
      startedAt,
      completedAt,
    }
  } catch (error) {
    const completedAt = new Date().toISOString()
    const apiError = error instanceof ApiError
      ? error
      : new ApiError('INTERNAL_ERROR', error instanceof Error ? error.message : 'Worker failed.', 500)
    const toolCostEvent = buildWorkerToolCostEvent({
      job,
      workerType: input.workerType,
      startedAt,
      completedAt,
      status: 'failed',
      estimatedInternalCostCents: toolCostEstimate.expectedInternalCostCents,
    })
    events.push(await emitWorkerEvent(context, job, {
      eventName: 'worker_failed',
      workerType: input.workerType,
      workerInstanceId,
      message: apiError.message,
      progressPercent: 100,
      payloadJson: { code: apiError.code },
      eventType: 'failed',
    }))
    const releaseResult = await claimService.release({ jobId: job.id, claimStatus: 'failed' })
    warnings.push(...releaseResult.warnings)

    return {
      jobId: job.id,
      workerType: input.workerType,
      workerInstanceId,
      status: 'failed',
      claim: claimResult.claim,
      gateChecks,
      toolChecks: toolResults,
      toolCostEstimate,
      toolCostEvent,
      events,
      error: { code: apiError.code, message: apiError.message },
      warnings,
      startedAt,
      completedAt,
    }
  }
}

const METERED_EXPENSIVE_JOB_TYPES = new Set([
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

function buildWorkerToolCostEstimate(job: Awaited<ReturnType<typeof loadWorkerJob>>, workerType: string) {
  return estimateToolCost({
    toolId: `worker:${workerType}:${job.jobType}`,
    toolName: `${workerType} ${job.jobType}`,
    usageCategory: usageCategoryForJobType(job.jobType),
    computeLevel: computeLevelForWorker(workerType),
    providerType: providerTypeForWorker(workerType),
    providerName: 'reeditpro-worker-runtime',
    modelName: null,
    qualityLevel: qualityLevelFromPayload(job.inputPayload),
    inputVideoSeconds: numberPayload(job.inputPayload, 'inputVideoSeconds'),
    outputVideoSeconds: numberPayload(job.inputPayload, 'outputVideoSeconds'),
    inputAudioSeconds: numberPayload(job.inputPayload, 'inputAudioSeconds'),
    outputAudioSeconds: numberPayload(job.inputPayload, 'outputAudioSeconds'),
    imageCount: numberPayload(job.inputPayload, 'imageCount'),
    estimatedRuntimeSeconds: numberPayload(job.inputPayload, 'estimatedRuntimeSeconds') || 60,
    resolution: stringPayload(job.inputPayload, 'resolution') ?? stringPayload(job.inputPayload, 'outputResolution') ?? '1920x1080',
    frameRate: numberPayload(job.inputPayload, 'frameRate') || numberPayload(job.inputPayload, 'outputFrameRate') || 30,
    vcpuCount: numberPayload(job.inputPayload, 'vcpuCount'),
    memoryGiB: numberPayload(job.inputPayload, 'memoryGiB'),
    gpuType: stringPayload(job.inputPayload, 'gpuType'),
    gpuCount: numberPayload(job.inputPayload, 'gpuCount'),
    approvedReservationRemainingCredits: numberPayload(job.inputPayload, 'approvedReservationRemainingCredits'),
    assumptions: ['Worker metering estimate generated before handler execution.'],
  })
}

function buildWorkerToolCostEvent(input: {
  job: Awaited<ReturnType<typeof loadWorkerJob>>
  workerType: string
  startedAt: string
  completedAt: string
  status: 'completed' | 'failed'
  estimatedInternalCostCents: number
}) {
  const expensive = METERED_EXPENSIVE_JOB_TYPES.has(input.job.jobType)
  return emitToolCostEvent({
    workspaceId: input.job.workspaceId,
    projectId: input.job.projectId ?? 'project-mock',
    editPlanId: stringPayload(input.job.inputPayload, 'editPlanId') ?? null,
    jobId: input.job.id,
    jobBatchId: input.job.jobBatchId ?? null,
    creditEstimateId: input.job.creditEstimateId ?? null,
    creditReservationId: input.job.creditReservationId ?? null,
    toolId: `worker:${input.workerType}:${input.job.jobType}`,
    toolName: `${input.workerType} ${input.job.jobType}`,
    usageCategory: usageCategoryForJobType(input.job.jobType),
    providerType: providerTypeForWorker(input.workerType),
    providerName: 'reeditpro-worker-runtime',
    modelName: null,
    qualityLevel: qualityLevelFromPayload(input.job.inputPayload),
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    wallClockMs: Math.max(0, Date.parse(input.completedAt) - Date.parse(input.startedAt)),
    vcpuCount: numberPayload(input.job.inputPayload, 'vcpuCount'),
    memoryGiB: numberPayload(input.job.inputPayload, 'memoryGiB'),
    gpuType: stringPayload(input.job.inputPayload, 'gpuType'),
    gpuCount: numberPayload(input.job.inputPayload, 'gpuCount'),
    inputVideoSeconds: numberPayload(input.job.inputPayload, 'inputVideoSeconds'),
    outputVideoSeconds: numberPayload(input.job.inputPayload, 'outputVideoSeconds'),
    inputAudioSeconds: numberPayload(input.job.inputPayload, 'inputAudioSeconds'),
    outputAudioSeconds: numberPayload(input.job.inputPayload, 'outputAudioSeconds'),
    imageCount: numberPayload(input.job.inputPayload, 'imageCount'),
    renderDurationSeconds: numberPayload(input.job.inputPayload, 'renderDurationSeconds'),
    outputResolution: stringPayload(input.job.inputPayload, 'outputResolution') ?? stringPayload(input.job.inputPayload, 'resolution') ?? null,
    outputFrameRate: numberPayload(input.job.inputPayload, 'outputFrameRate') || numberPayload(input.job.inputPayload, 'frameRate'),
    estimatedInternalCostCents: input.estimatedInternalCostCents,
    retryAttempt: numberPayload(input.job.inputPayload, 'retryAttempt'),
    retryReason: stringPayload(input.job.inputPayload, 'retryReason') ?? null,
    failureCategory: input.status === 'completed' ? 'none' : 'worker_error',
    billableToUser: input.status === 'completed' && expensive,
    approvedReservationRemainingCredits: numberPayload(input.job.inputPayload, 'approvedReservationRemainingCredits'),
    metadata: {
      mockSafeWorkerMetering: true,
      jobType: input.job.jobType,
      workerType: input.workerType,
      serviceFeeIncluded: false,
    },
  })
}

function providerTypeForWorker(workerType: string) {
  if (workerType.includes('gpu')) return 'gpu_worker'
  if (workerType.includes('render')) return 'deterministic_renderer'
  return 'cloud_run_job'
}

function computeLevelForWorker(workerType: string) {
  if (workerType.includes('gpu')) return 'premium'
  if (workerType.includes('render')) return 'standard'
  return 'economy'
}

function usageCategoryForJobType(jobType: string) {
  if (jobType.includes('caption')) return 'captions'
  if (jobType.includes('stroke_motion')) return 'stroke_motion'
  if (jobType.includes('graphic_design')) return 'graphic_design'
  if (jobType.includes('real_motion')) return 'real_motion'
  if (jobType.includes('soundsync')) return 'soundsync'
  if (jobType.includes('render')) return 'rendering'
  if (jobType.includes('export')) return 'export'
  if (jobType.includes('media_analysis') || jobType.includes('probe')) return 'media_analysis'
  if (jobType.includes('transcription')) return 'transcription'
  if (jobType.includes('qa')) return 'qa'
  return 'other'
}

function qualityLevelFromPayload(payload: Record<string, unknown>) {
  const qualityLevel = stringPayload(payload, 'qualityLevel')
  if (qualityLevel === 'draft' || qualityLevel === 'preview' || qualityLevel === 'production' || qualityLevel === 'premium') return qualityLevel
  return 'preview'
}

function numberPayload(payload: Record<string, unknown>, key: string): number | undefined {
  const value = payload[key]
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined
}

function stringPayload(payload: Record<string, unknown>, key: string): string | undefined {
  const value = payload[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}
