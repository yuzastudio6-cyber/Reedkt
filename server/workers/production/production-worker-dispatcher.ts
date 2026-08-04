import type { ToolExecutionPlan } from '../../../src/backend/contracts/tool-execution-contracts'
import {
  buildToolCostEventIdempotencyKey,
  createMockToolCostStore,
  emitProductionToolCostEvent,
  estimateProductionToolCost,
  type ToolCostFailureCategory,
  type ToolCreditPrerequisiteStatus,
} from '../../tool-cost-metering'
import type { ProductionToolId } from '../../tool-registry'
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
import {
  hasRetiredLegacyMaskRouteRequest,
  LEGACY_MASK_WORKER_ROUTE_RETIRED_ERROR,
  routeProductionWorkerJob,
} from './production-worker-router'
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

  if (hasRetiredLegacyMaskRouteRequest(payload)) {
    events.push(pushEvent(
      state,
      payload,
      'job_blocked',
      'The legacy mask worker route is retired; exact Orchestra and Track All authority is required before canonical SAM 3.1 dispatch.',
      100,
      {
        requiredGate: 'canonical_track_all_orchestra_sam3_1_dispatch',
        cpuOnlySubstantiveExecutionAllowed: false,
      },
    ))
    return createProductionWorkerResult({
      payload,
      status: 'blocked',
      gateChecks,
      events,
      warnings: [
        ...collectGateWarnings(gateChecks),
        'No legacy CPU, generic GPU, render, or QA mask lease was created.',
      ],
      error: {
        code: 'LEGACY_MASK_WORKER_ROUTE_RETIRED',
        message: LEGACY_MASK_WORKER_ROUTE_RETIRED_ERROR,
        failureCategory: 'policy_blocked',
      },
      startedAt,
    })
  }

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

  const preWorkToolCostMetadata = buildWorkerToolCostPreWorkMetadata(payload)
  const preWorkToolCostBlockers = Object.values(preWorkToolCostMetadata.blockedEventStatuses)
    .filter((status) => status !== 'ready')
  if (payload.executionMode === 'production_ready' && preWorkToolCostBlockers.length > 0) {
    events.push(pushEvent(state, payload, 'job_blocked', 'Production worker job blocked before lease because tool-cost prerequisites are incomplete.', 100, {
      blockedEventStatuses: preWorkToolCostMetadata.blockedEventStatuses,
    }))
    return createProductionWorkerResult({
      payload,
      status: 'blocked',
      gateChecks,
      events,
      toolCostMetadata: preWorkToolCostMetadata,
      warnings: [...collectGateWarnings(gateChecks), ...preWorkToolCostMetadata.warnings],
      error: {
        code: 'PRODUCTION_WORKER_TOOL_COST_PREREQUISITES_FAILED',
        message: 'Production-ready worker jobs require approved plan, approved credit estimate, active credit reservation, and idempotency before work starts.',
        failureCategory: 'credit_blocked',
      },
      startedAt,
    })
  }

  if (payload.executionMode === 'production_ready') {
    events.push(pushEvent(
      state,
      payload,
      'job_blocked',
      'The legacy mock worker cannot execute production work. Approved work must use the canonical funded A100/L4 GPU continuation.',
      100,
      {
        requiredGate:
          'canonical_professional_gpu_approved_plan_continuation',
        cpuOnlySubstantiveExecutionAllowed: false,
      },
    ))
    return createProductionWorkerResult({
      payload,
      status: 'blocked',
      gateChecks,
      events,
      toolCostMetadata: preWorkToolCostMetadata,
      warnings: [
        ...collectGateWarnings(gateChecks),
        'Legacy mock production routing is historical test support only; it cannot spend, execute media, or stand in for WeEditPro cloud GPU work.',
      ],
      error: {
        code: 'LEGACY_MOCK_WORKER_PRODUCTION_RETIRED',
        message:
          'Production-ready work requires the canonical funded A100/L4 GPU continuation and cannot run through the legacy mock worker.',
        failureCategory: 'policy_blocked',
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

function buildWorkerToolCostPreWorkMetadata(payload: ProductionWorkerJobPayload): ProductionWorkerToolCostMetadata {
  const estimateStatuses: Record<string, ToolCreditPrerequisiteStatus> = {}
  const blockedEventStatuses: Record<string, ToolCreditPrerequisiteStatus> = {}
  const billableToUserByToolId: Record<string, boolean> = {}
  const failureCategoryByToolId: Record<string, ToolCostFailureCategory> = {}
  const warnings: string[] = []
  const failureCategory = readToolCostFailureCategory(payload.metadata)
  const billableToUser = deriveWorkerToolCostBillableToUser(payload.executionMode, failureCategory)
  const creditEstimateId = readStringMetadata(payload.metadata, 'creditEstimateId')
  const productEditLevel = readProductEditLevel(payload.metadata)

  for (const toolId of payload.requestedToolIds) {
    billableToUserByToolId[toolId] = billableToUser
    failureCategoryByToolId[toolId] = failureCategory
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
      idempotencyKey: buildWorkerToolCostEventIdempotencyKey(payload, toolId),
      estimateOnlyWhenBlocked: false,
    })

    if (!estimate.ok) {
      blockedEventStatuses[toolId] = estimate.error.status
      warnings.push(estimate.error.message)
      continue
    }

    const status = deriveWorkerPreWorkToolCostStatus(payload, creditEstimateId, estimate.data.creditPrerequisiteStatus)
    estimateStatuses[toolId] = estimate.data.creditPrerequisiteStatus
    if (status !== 'ready') {
      blockedEventStatuses[toolId] = status
      warnings.push(`Tool-cost prerequisite blocked ${toolId}: ${status}.`)
    }
  }

  return {
    mockOnly: true,
    serviceFeeIncluded: false,
    requestedToolCount: payload.requestedToolIds.length,
    estimateStatuses,
    emittedEvents: [],
    blockedEventStatuses,
    billableToUserByToolId,
    failureCategoryByToolId,
    warnings: Array.from(new Set(warnings)),
  }
}

function buildWorkerToolCostEventIdempotencyKey(
  payload: ProductionWorkerJobPayload,
  toolId: ProductionToolId,
): string {
  return buildToolCostEventIdempotencyKey({
    workspaceId: payload.workspaceId,
    projectId: payload.projectId,
    toolId,
    jobId: payload.jobId,
    approvedPlanSnapshotId: payload.approvedSnapshotId,
    editPlanId: payload.editPlanId,
    retryAttempt: payload.attempt,
  })
}

function buildWorkerToolCostMetadata(payload: ProductionWorkerJobPayload): ProductionWorkerToolCostMetadata {
  const store = createMockToolCostStore()
  const estimateStatuses: Record<string, ToolCreditPrerequisiteStatus> = {}
  const blockedEventStatuses: Record<string, ToolCreditPrerequisiteStatus> = {}
  const billableToUserByToolId: Record<string, boolean> = {}
  const failureCategoryByToolId: Record<string, ToolCostFailureCategory> = {}
  const warnings: string[] = []
  const failureCategory = readToolCostFailureCategory(payload.metadata)
  const billableToUser = deriveWorkerToolCostBillableToUser(payload.executionMode, failureCategory)
  const creditEstimateId = readStringMetadata(payload.metadata, 'creditEstimateId')
  const productEditLevel = readProductEditLevel(payload.metadata)

  for (const toolId of payload.requestedToolIds) {
    billableToUserByToolId[toolId] = billableToUser
    failureCategoryByToolId[toolId] = failureCategory
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
      idempotencyKey: buildWorkerToolCostEventIdempotencyKey(payload, toolId),
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
      idempotencyKey: buildWorkerToolCostEventIdempotencyKey(payload, toolId),
      billableToUser,
      failureCategory,
      retryAttempt: payload.attempt,
      nonBillableReason: billableToUser ? undefined : deriveWorkerToolCostNonBillableReason(payload.executionMode, failureCategory),
      metadata: {
        workerExecutionMode: payload.executionMode,
        workerType: payload.workerType,
        toolCostFailureCategory: failureCategory,
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
    billableToUserByToolId,
    failureCategoryByToolId,
    warnings: Array.from(new Set(warnings)),
  }
}

function deriveWorkerPreWorkToolCostStatus(
  payload: ProductionWorkerJobPayload,
  creditEstimateId: string | undefined,
  estimateStatus: ToolCreditPrerequisiteStatus,
): ToolCreditPrerequisiteStatus {
  if (payload.executionMode !== 'production_ready') return 'ready'
  if (!creditEstimateId) return 'missing_approved_credit_estimate'
  if (!payload.creditReservationId) return 'missing_active_credit_reservation'
  return estimateStatus
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

function readToolCostFailureCategory(metadata: Record<string, unknown> | undefined): ToolCostFailureCategory {
  const value = readStringMetadata(metadata, 'toolCostFailureCategory') ?? readStringMetadata(metadata, 'failureCategory')
  switch (value) {
    case 'provider_error':
    case 'provider_variance_absorbed':
    case 'reeditpro_error_absorbed':
    case 'user_requested_retry':
    case 'validation_error':
    case 'timeout':
    case 'cancelled':
    case 'unknown':
      return value
    case 'none':
    default:
      return 'none'
  }
}

function deriveWorkerToolCostBillableToUser(
  executionMode: ProductionWorkerJobPayload['executionMode'],
  failureCategory: ToolCostFailureCategory,
): boolean {
  if (executionMode !== 'production_ready') return false
  if (failureCategory === 'none' || failureCategory === 'user_requested_retry') return true
  return false
}

function deriveWorkerToolCostNonBillableReason(
  executionMode: ProductionWorkerJobPayload['executionMode'],
  failureCategory: ToolCostFailureCategory,
): string {
  if (executionMode !== 'production_ready') return executionMode
  return failureCategory
}
