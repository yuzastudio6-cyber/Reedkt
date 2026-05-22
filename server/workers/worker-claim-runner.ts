import { ApiError } from '../errors/api-error'
import { createWorkerClaimService } from '../services/worker-claim-service'
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
    creditReservationId: input.creditReservationId,
    payloadJson: {
      ...(input.payloadJson ?? {}),
      mediaAssetId: input.mediaAssetId ?? input.payloadJson?.mediaAssetId,
      storageObjectRecordId: input.storageObjectRecordId ?? input.payloadJson?.storageObjectRecordId,
    },
  })

  const requiredTools = requiredToolsForJob(job.jobType, input.workerType)
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
      events,
      output,
      warnings,
      startedAt,
      completedAt: new Date().toISOString(),
    }
  } catch (error) {
    const apiError = error instanceof ApiError
      ? error
      : new ApiError('INTERNAL_ERROR', error instanceof Error ? error.message : 'Worker failed.', 500)
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
      events,
      error: { code: apiError.code, message: apiError.message },
      warnings,
      startedAt,
      completedAt: new Date().toISOString(),
    }
  }
}
