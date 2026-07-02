import type {
  BackendRuntimeEnvelope,
  BackendRuntimeTransportResult,
  RuntimeIdempotencyRecord,
} from '../../types/backend-runtime'
import type { JobRuntimeEvent } from '../../types/job-runtime'
import type { WorkerHeartbeatResult, WorkerLeaseRecord } from '../../types/worker-lease'
import {
  getDefaultMockBackendRuntimeScenario,
  getMockBackendRuntimeScenarioById,
  type MockBackendRuntimeScenario,
  type MockBackendRuntimeScenarioId,
} from '../mock/mock-backend-runtime-scenarios'
import { createMockDatabase } from '../mock/mock-database'
import {
  createBackendRuntimeEnvelope,
  createBackendRuntimeEnvelopeSummary,
} from '../runtime/backend-runtime-envelope-service'
import { sendBackendRuntimeEnvelope } from '../runtime/backend-runtime-transport-service'

export interface MockBackendRuntimeTransportFlowOutput {
  runtimeEnvelope?: BackendRuntimeEnvelope<Record<string, unknown>>
  transportResult?: BackendRuntimeTransportResult
  lease?: WorkerLeaseRecord
  heartbeat?: WorkerHeartbeatResult
  recoveryPlan?: unknown
  idempotencyResult?: RuntimeIdempotencyRecord
  jobEvents: JobRuntimeEvent[]
  chatSummary?: string
  nextStep: string
  warnings: string[]
}

export function runMockBackendRuntimeTransportFlow(
  scenarioInput: MockBackendRuntimeScenario | MockBackendRuntimeScenarioId = getDefaultMockBackendRuntimeScenario(),
): MockBackendRuntimeTransportFlowOutput {
  const scenario = typeof scenarioInput === 'string'
    ? getScenarioOrThrow(scenarioInput)
    : scenarioInput
  const db = createMockDatabase()
  const runtimeEnvelope = createBackendRuntimeEnvelope<Record<string, unknown>>({
    requestId: `mock-runtime-${scenario.id}`,
    jobId: 'mock-job-runtime-transport',
    jobBatchId: 'mock-job-batch-runtime-transport',
    workspaceId: 'mock-workspace-runtime',
    projectId: 'mock-project-runtime',
    editPlanId: 'mock-edit-plan-runtime',
    target: scenario.target,
    transportMode: scenario.transportMode,
    safetyLevel: scenario.safetyLevel,
    payload: {
      scenarioId: scenario.id,
      mockOnly: true,
    },
    mockOnly: scenario.transportMode === 'mock' || scenario.transportMode === 'frontend_mock',
  })
  const transportResult = sendBackendRuntimeEnvelope(runtimeEnvelope, db)

  return {
    runtimeEnvelope,
    transportResult,
    jobEvents: [],
    chatSummary: createBackendRuntimeEnvelopeSummary(runtimeEnvelope),
    nextStep: transportResult.ok ? 'runtime_message_acknowledged' : 'backend_required',
    warnings: [
      ...scenario.notes,
      ...transportResult.warnings,
    ],
  }
}

export function runMockRuntimeTransportBlockedFlow(): MockBackendRuntimeTransportFlowOutput {
  return runMockBackendRuntimeTransportFlow('cloud-run-job-placeholder-blocked')
}

function getScenarioOrThrow(id: MockBackendRuntimeScenarioId): MockBackendRuntimeScenario {
  const scenario = getMockBackendRuntimeScenarioById(id)
  if (!scenario) throw new Error(`Missing mock backend runtime scenario: ${id}`)
  return scenario
}
