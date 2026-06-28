import type { ToolExecutionPlan } from '../../../src/backend/contracts/tool-execution-contracts'
import {
  createMockToolCostStore,
  emitProductionToolCostEvent,
  estimateProductionToolCost,
  type ToolCreditPrerequisiteStatus,
} from '../../tool-cost-metering'
import { createProductionWorkerEvent } from './production-worker-events'
import { getHardFailedGates, runProductionWorkerGates } from './production-worker-gates'
import { detectDuplicateToolRun } from './production-worker-idempotency'
import {
  createProductionWorkerRuntimeState,
  createWorkerLease,
  heartbeatWorkerLease,
  releaseWorkerLease,
} from './production-worker-lease-manager'
import { collectGateWarnings, createProductionWorkerResult } from './production-worker-result-writer'
import { routeProductionWorkerJob } from './production-worker-router'
import type {
  ProductionWorkerExecutionResult,
  ProductionWorkerJobPayload,
  ProductionWorkerRuntimeState,
  ProductionWorkerToolCostMetadata,
} from './production-worker-types'

function pushEvent(
  state: ProductionWorkerRuntimeState,
  payload: ProductionWorkerJobPayload,
  eventName: Parameters<typeof createProductionWorkerEvent>[0]['eventName'],
  message: string,
  progressPercent?: number,
  payloadSummary?: Record<string, unknown>,
) {
  const event = createProductionWorkerEvent({ eventName, payload, message, progressPercent, payloadSummary })
  state.events.push(event)
  return event
}

export async function dispatchProductionWorkerJob(input: {
  payload: ProductionWorkerJobPayload
  executionPlan?: ToolExecutionPlan
  state?: ProductionWorkerRuntimeState
  workerInstanceId?: string
}): Promise<ProductionWorkerExecutionResult> {
  const state = input.state ?? createProductionWorkerRuntimeState()
  const payload = input.payload
  const startedAt = new Date().toISOString()
  const events = [
    pushEvent(state, payload, 'job_created', 'Production worker job accepted by mock-safe dispatcher.', 0),
    pushEvent(state, payload, 'gates_started', 'Production worker gates started.', 5),
  ]
  const gateChecks = runProductionWorkerGates(payload, input.executionPlan)
  const failedGates = getHardFailedGates(gateChecks)

  if (failedGates.length > 0) {
    events.push(pushEvent(state, payload, 'gates_failed', 'Production worker gates failed.', 10, {
      failedGateNames: failedGates.map((gate) => gate.gateName),
    }))
    events.push(pushEvent(state, payload, 'job_blocked', 'Production worker job blocked before lease or execution.', 100, {
      failedGateNames: failedGates.map((gate) => gate.gateName),
    }))

    return createProductionWorkerResult({
      payload,
      status: 'blocked',
      gateChecks,
      events,
      warnings: collectGateWarnings(gateChecks),
      error: {
        code: 'PRODUCTION_WORKER_GATES_FAILED',
        message: failedGates.map((gate) => gate.message).join(' '),
        failureCategory: 'policy_blocked',
      },
      startedAt,
    })
  }

  events.push(pushEvent(state, payload, 'gates_passed', 'Production worker gates passed.', 15))

  const duplicate = detectDuplicateToolRun(payload, state.idempotencyKeys)
  if (duplicate.duplicate && duplicate.existingJobId && duplicate.existingJobId !== payload.jobId) {
    events.push(pushEvent(state, payload, 'job_blocked', duplicate.message, 100, {
      existingJobId: duplicate.existingJobId,
    }))
    return createProductionWorkerResult({
      payload,
      status: 'blocked',
      gateChecks,
      events,
      warnings: [...collectGateWarnings(gateChecks), duplicate.message],
      error: {
        code: 'PRODUCTION_WORKER_IDEMPOTENCY_CONFLICT',
        message: duplicate.message,
        failureCategory: 'invalid_payload',
      },
      startedAt,
    })
  }

  const lease = createWorkerLease(state, payload, input.workerInstanceId)
  events.push(pushEvent(state, payload, 'job_claimed', 'Production worker job lease claimed.', 25, {
    leaseId: lease.leaseId,
  }))
  heartbeatWorkerLease(state, lease.leaseId)
  events.push(pushEvent(state, payload, 'heartbeat', 'Production worker lease heartbeat recorded.', 30, {
    leaseId: lease.leaseId,
  }))
  events.push(pushEvent(state, payload, 'job_started', 'Production worker placeholder route started.', 40))
  events.push(pushEvent(state, payload, 'step_started', 'Production worker placeholder step started.', 50))

  const output = await routeProductionWorkerJob(payload)

  events.push(pushEvent(state, payload, 'step_completed', 'Production worker placeholder step completed without running real tools.', 80, {
    futureHandler: output.futureHandler,
  }))
  releaseWorkerLease(state, lease.leaseId)
  events.push(pushEvent(state, payload, 'job_completed', 'Production worker placeholder job completed.', 100, {
    leaseId: lease.leaseId,
  }))

  return createProductionWorkerResult({
    payload,
    status: 'completed',
    gateChecks,
    events,
    output,
    toolCostMetadata: buildWorkerToolCostMetadata(payload),
    warnings: collectGateWarnings(gateChecks),
    startedAt,
  })
}

function buildWorkerToolCostMetadata(payload: ProductionWorkerJobPayload): ProductionWorkerToolCostMetadata {
  const store = createMockToolCostStore()
  const estimateStatuses: Record<string, ToolCreditPrerequisiteStatus> = {}
  const blockedEventStatuses: Record<string, ToolCreditPrerequisiteStatus> = {}
  const warnings: string[] = []
  const billableToUser = payload.executionMode === 'production_ready'
  const creditEstimateId = readStringMetadata(payload.metadata, 'creditEstimateId')
  const productEditLevel = readProductEditLevel(payload.metadata)

  for (const toolId of payload.requestedToolIds) {
    const estimate = estimateProductionToolCost({
      toolId,
      workspaceId: payload.workspaceId,
      projectId: payload.projectId,
      editPlanId: payload.editPlanId,
      approvedPlanSnapshotId: payload.approvedSnapshotId,
      jobId: payload.jobId,
      creditEstimateId,
      creditReservationId: payload.creditReservationId,
      productEditLevel,
      approvedReservationRemainingCredits: readNumberMetadata(payload.metadata, 'approvedReservationRemainingCredits'),
      idempotencyKey: `${payload.idempotencyKey}:${toolId}`,
      estimateOnlyWhenBlocked: true,
    })

    if (!estimate.ok) {
      blockedEventStatuses[toolId] = estimate.error.status
      warnings.push(estimate.error.message)
      continue
    }

    estimateStatuses[toolId] = estimate.data.creditPrerequisiteStatus

    const emitted = emitProductionToolCostEvent({
      store,
      toolId,
      workspaceId: payload.workspaceId,
      projectId: payload.projectId,
      editPlanId: payload.editPlanId,
      approvedPlanSnapshotId: payload.approvedSnapshotId,
      jobId: payload.jobId,
      creditEstimateId,
      creditReservationId: payload.creditReservationId,
      productEditLevel,
      idempotencyKey: `${payload.idempotencyKey}:${toolId}`,
      billableToUser,
      nonBillableReason: billableToUser ? undefined : payload.executionMode,
      metadata: {
        workerExecutionMode: payload.executionMode,
        workerType: payload.workerType,
        renderMode: payload.renderMode ?? null,
      },
    })

    if (emitted.ok) {
      warnings.push(...emitted.data.warnings)
    } else {
      blockedEventStatuses[toolId] = emitted.error.status
      warnings.push(emitted.error.message)
    }
  }

  return {
    mockOnly: true,
    serviceFeeIncluded: false,
    requestedToolCount: payload.requestedToolIds.length,
    estimateStatuses,
    emittedEvents: store.toolCostEvents,
    blockedEventStatuses,
    warnings: Array.from(new Set(warnings)),
  }
}

function readStringMetadata(metadata: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = metadata?.[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function readNumberMetadata(metadata: Record<string, unknown> | undefined, key: string): number | undefined {
  const value = metadata?.[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function readProductEditLevel(metadata: Record<string, unknown> | undefined): 'normal' | 'premium' | 'ultra_premium' {
  const value = readStringMetadata(metadata, 'productEditLevel')
  return value === 'premium' || value === 'ultra_premium' ? value : 'normal'
}
