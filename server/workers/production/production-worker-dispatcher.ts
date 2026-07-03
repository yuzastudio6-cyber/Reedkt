import type { ToolExecutionPlan } from '../../../src/backend/contracts/tool-execution-contracts'
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
    pushEvent(state, payload, 'job_created', 'Production worker job accepted by backend dispatcher.', 0),
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
  events.push(pushEvent(state, payload, 'job_started', 'Production worker route started.', 40))
  events.push(pushEvent(state, payload, 'step_started', 'Production worker step started.', 50))

  const output = await routeProductionWorkerJob(payload)

  events.push(pushEvent(
    state,
    payload,
    'step_completed',
    output.mockOnly
      ? 'Production worker mock-safe step completed without running real tools.'
      : 'Production worker real backend handler step completed.',
    80,
    {
    futureHandler: output.futureHandler,
    mockOnly: output.mockOnly,
  }))
  releaseWorkerLease(state, lease.leaseId)
  events.push(pushEvent(state, payload, 'job_completed', output.mockOnly
    ? 'Production worker mock-safe job completed.'
    : 'Production worker real backend handler job completed.', 100, {
    leaseId: lease.leaseId,
    mockOnly: output.mockOnly,
  }))

  return createProductionWorkerResult({
    payload,
    status: 'completed',
    gateChecks,
    events,
    output,
    warnings: collectGateWarnings(gateChecks),
    startedAt,
  })
}
