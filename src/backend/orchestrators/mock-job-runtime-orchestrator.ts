import type { CreditLedgerRuntimeResult } from '../services/credit-ledger-runtime-service'
import type { JobDependencyRuntimeChain } from '../services/job-dependency-runtime-service'
import type { JobRetryRuntimePlan } from '../services/job-retry-runtime-service'
import type { WorkerDispatchRuntimeResult } from '../services/worker-dispatch-service'
import type { JobGateCheckResult, JobRuntimeEvent, JobRuntimeQueueItem } from '../../types/job-runtime'
import {
  getDefaultMockJobRuntimeScenario,
  getMockJobRuntimeScenarioById,
  prepareMockJobRuntimeScenario,
  type MockJobRuntimeScenario,
  type MockJobRuntimeScenarioId,
} from '../mock/mock-job-runtime-scenarios'
import { refundCreditsForFailedJobMock, spendReservedCreditsMock } from '../services/credit-ledger-runtime-service'
import {
  createJobDependencySummary,
  createMusicGenerationDependencyChain,
  createRenderDependencyChain,
  createSFXGenerationDependencyChain,
  createSignatureGenerationDependencyChain,
  validateJobDependencies,
} from '../services/job-dependency-runtime-service'
import {
  createJobBlockedEvent,
  createJobCompletedEvent,
  createJobCreatedEvent,
  createJobGateCheckedEvent,
  createJobQueuedEvent,
} from '../services/job-event-runtime-service'
import { queueMockJob, markJobFailedMock, markJobCompletedMock } from '../services/job-queue-runtime-service'
import { createJobFailureRecoveryPlan } from '../services/job-retry-runtime-service'
import {
  createJobBlockedChatSummary,
  createJobCompletedChatSummary,
  createJobStatusChatSummary,
} from '../services/job-status-chat-summary-service'
import { dispatchMockWorkerJob } from '../services/worker-dispatch-service'

export interface MockJobRuntimeFlowOutput {
  queueItem?: JobRuntimeQueueItem
  dependencyChain?: JobDependencyRuntimeChain
  gateCheck?: JobGateCheckResult
  workerOutput?: unknown
  jobEvents: JobRuntimeEvent[]
  retryPlan?: JobRetryRuntimePlan
  creditRecovery?: CreditLedgerRuntimeResult
  chatSummary?: string
  nextStep: string
  warnings: string[]
}

export function runMockJobRuntimeFlow(
  scenarioInput: MockJobRuntimeScenario | MockJobRuntimeScenarioId = getDefaultMockJobRuntimeScenario(),
): MockJobRuntimeFlowOutput {
  const scenario = typeof scenarioInput === 'string'
    ? getScenarioOrThrow(scenarioInput)
    : scenarioInput
  const prepared = prepareMockJobRuntimeScenario(scenario)
  const queueItem = queueMockJob(prepared.db, {
    workspaceId: prepared.credit.gateInput.workspaceId,
    projectId: prepared.credit.gateInput.projectId,
    editPlanId: prepared.credit.editPlan?.id,
    creditEstimateId: prepared.credit.creditEstimate?.id,
    creditReservationId: prepared.credit.reservation?.id,
    generationRequestId: prepared.generationRequest?.id,
    renderTimingManifestId: prepared.renderTimingManifest?.id,
    requiredAssetIds: prepared.requiredAssetId ? [prepared.requiredAssetId] : [],
    workerKind: scenario.workerKind,
    requiresEditPlanApproval: true,
    requiresCreditEstimateApproval: scenario.workerKind !== 'custom',
    requiresCreditReservation: scenario.workerKind !== 'custom',
    requiresGenerationRequest: scenario.requiresGenerationRequest,
    requiresProvider: scenario.requiresProvider,
    providerRuntimeMode: scenario.providerRuntimeMode,
    requiresProviderSecret: false,
    requiresRequiredAssets: scenario.requiresRequiredAssets,
    requiresTimingReadiness: scenario.requiresTimingReadiness,
    mockSafe: true,
    payload: { scenarioId: scenario.id },
  })
  const jobEvents = [
    createJobCreatedEvent(queueItem.jobId),
    createJobGateCheckedEvent(queueItem.jobId, queueItem.gateCheck.message),
    queueItem.gateCheck.ok
      ? createJobQueuedEvent(queueItem.jobId)
      : createJobBlockedEvent(queueItem.jobId, queueItem.gateCheck.message),
  ]

  let workerDispatch: WorkerDispatchRuntimeResult | undefined
  if (scenario.dispatch && queueItem.gateCheck.ok) {
    workerDispatch = dispatchMockWorkerJob(queueItem, prepared.db)
    jobEvents.push(...workerDispatch.jobEvents)
  }

  const dependencyChain = chainForScenario(scenario)
  const dependencyGate = dependencyChain ? validateJobDependencies(dependencyChain) : undefined
  const chatSummary = queueItem.gateCheck.ok
    ? createJobStatusChatSummary(queueItem)
    : createJobBlockedChatSummary(queueItem)

  return {
    queueItem,
    dependencyChain,
    gateCheck: queueItem.gateCheck,
    workerOutput: workerDispatch?.workerOutput,
    jobEvents,
    chatSummary,
    nextStep: nextStepFor(queueItem, dependencyGate, workerDispatch),
    warnings: [
      'Mock job runtime only; no Cloud Run, provider, render, Stripe, storage, or remote Supabase call was made.',
      ...queueItem.gateCheck.warnings,
      ...(dependencyChain?.warnings ?? []),
      ...(workerDispatch?.warnings ?? []),
    ],
  }
}

export function runMockMusicJobRuntimeFlow(): MockJobRuntimeFlowOutput {
  return runMockJobRuntimeFlow('queue-mock-music-job-success')
}

export function runMockSFXJobRuntimeFlow(): MockJobRuntimeFlowOutput {
  return runMockJobRuntimeFlow('queue-mock-sfx-job-success')
}

export function runMockRenderJobRuntimeFlow(): MockJobRuntimeFlowOutput {
  return runMockJobRuntimeFlow('queue-mock-render-readiness-job-success')
}

export function runMockBlockedJobRuntimeFlow(): MockJobRuntimeFlowOutput {
  return runMockJobRuntimeFlow('blocked-credit-reservation-missing')
}

export function runMockJobDependencyFlow(): MockJobRuntimeFlowOutput {
  const output = runMockJobRuntimeFlow('music-dependency-chain-ready')
  output.chatSummary = output.dependencyChain ? createJobDependencySummary(output.dependencyChain) : output.chatSummary
  return output
}

export function runMockWorkerDispatchFlow(): MockJobRuntimeFlowOutput {
  return runMockJobRuntimeFlow('worker-dispatch-succeeds-mock')
}

export function runMockJobRetryFlow(): MockJobRuntimeFlowOutput {
  const output = runMockJobRuntimeFlow('job-fails-retry-scheduled')
  if (!output.queueItem) return output

  markJobFailedMock(output.queueItem)
  output.retryPlan = createJobFailureRecoveryPlan(output.queueItem, 1, 3)
  output.jobEvents.push(createJobBlockedEvent(output.queueItem.jobId, 'Mock failure recorded before retry scheduling.'))
  output.nextStep = output.retryPlan.shouldRetry ? 'retry_scheduled' : 'manual_review'
  return output
}

export function runMockJobCreditRecoveryFlow(): MockJobRuntimeFlowOutput {
  const output = runMockJobRuntimeFlow('failed-job-releases-credit-reservation')
  const prepared = prepareMockJobRuntimeScenario(getScenarioOrThrow('failed-job-releases-credit-reservation'))
  const reservation = prepared.credit.reservation

  if (reservation) {
    const recovery = refundCreditsForFailedJobMock(prepared.db, reservation.id)
    output.creditRecovery = recovery.ok ? recovery.data : undefined
  }

  output.nextStep = 'credit_recovered_mock'
  return output
}

export function runMockCompletedJobSpendFlow(): MockJobRuntimeFlowOutput {
  const output = runMockJobRuntimeFlow('completed-job-spends-reserved-credits')
  const prepared = prepareMockJobRuntimeScenario(getScenarioOrThrow('completed-job-spends-reserved-credits'))
  const reservation = prepared.credit.reservation

  if (output.queueItem) {
    markJobCompletedMock(output.queueItem)
    output.jobEvents.push(createJobCompletedEvent(output.queueItem.jobId, 'Mock completed job now spends reserved credits.'))
    output.chatSummary = createJobCompletedChatSummary(output.queueItem)
  }

  if (reservation) {
    const spend = spendReservedCreditsMock(prepared.db, reservation.id)
    output.creditRecovery = spend.ok ? spend.data : undefined
  }

  output.nextStep = 'credits_spent_mock'
  return output
}

function chainForScenario(scenario: MockJobRuntimeScenario): JobDependencyRuntimeChain | undefined {
  if (scenario.id === 'music-dependency-chain-ready' || scenario.workerKind === 'music_generation') {
    return createMusicGenerationDependencyChain()
  }

  if (scenario.id === 'sfx-dependency-chain-ready' || scenario.workerKind === 'sfx_generation') {
    return createSFXGenerationDependencyChain()
  }

  if (scenario.id === 'render-dependency-chain-blocked') {
    return createRenderDependencyChain(['render_manifest_ready'])
  }

  if (scenario.workerKind === 'render_preview' || scenario.workerKind === 'render_export') {
    return createRenderDependencyChain()
  }

  if (scenario.workerKind.includes('generation')) {
    return createSignatureGenerationDependencyChain()
  }

  return undefined
}

function nextStepFor(
  queueItem: JobRuntimeQueueItem,
  dependencyGate?: JobGateCheckResult,
  workerDispatch?: WorkerDispatchRuntimeResult,
): string {
  if (!queueItem.gateCheck.ok) return 'fix_blocking_gate'
  if (dependencyGate && !dependencyGate.ok) return 'wait_for_dependencies'
  if (workerDispatch && !workerDispatch.ok) return 'manual_worker_review'
  if (workerDispatch?.ok) return 'worker_completed_mock'
  return 'ready_for_mock_dispatch'
}

function getScenarioOrThrow(id: MockJobRuntimeScenarioId): MockJobRuntimeScenario {
  const scenario = getMockJobRuntimeScenarioById(id)
  if (!scenario) throw new Error(`Missing mock job runtime scenario: ${id}`)
  return scenario
}
