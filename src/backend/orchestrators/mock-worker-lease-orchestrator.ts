import type { BackendRuntimeEnvelope, BackendRuntimeTransportResult } from '../../types/backend-runtime'
import type { JobRuntimeEvent, JobRuntimeQueueItem } from '../../types/job-runtime'
import type { WorkerHeartbeatResult, WorkerLeaseCheckResult, WorkerLeaseRecord, WorkerRuntimeKind } from '../../types/worker-lease'
import {
  getDefaultMockWorkerLeaseScenario,
  getMockWorkerLeaseScenarioById,
  type MockWorkerLeaseScenario,
  type MockWorkerLeaseScenarioId,
} from '../mock/mock-worker-lease-scenarios'
import {
  getMockJobRuntimeScenarioById,
  prepareMockJobRuntimeScenario,
  type MockJobRuntimeScenario,
  type MockJobRuntimeScenarioId,
} from '../mock/mock-job-runtime-scenarios'
import type { MockDatabase } from '../mock/mock-database'
import { createMockDatabase } from '../mock/mock-database'
import {
  createJobCompletedEvent,
  createJobFailedEvent,
  createJobProgressEvent,
  createJobQueuedEvent,
} from '../services/job-event-runtime-service'
import { queueMockJob } from '../services/job-queue-runtime-service'
import { dispatchMockWorkerJob, type WorkerDispatchRuntimeResult } from '../services/worker-dispatch-service'
import { createBackendRuntimeEnvelope } from '../runtime/backend-runtime-envelope-service'
import { sendBackendRuntimeEnvelope } from '../runtime/backend-runtime-transport-service'
import {
  checkIdempotencyConflictMock,
  createIdempotencyKey,
  createJobIdempotencyKey,
  recordIdempotencyResultMock,
  type IdempotencyCheckResult,
} from '../runtime/idempotency-service'
import {
  claimWorkerLease,
  claimWorkerLeaseMock,
  completeWorkerLeaseMock,
  failWorkerLeaseMock,
  heartbeatWorkerLeaseMock,
  releaseWorkerLeaseMock,
  renewWorkerLeaseMock,
} from '../runtime/worker-lease-service'
import {
  detectStaleWorkerLeasesMock,
  recoverStaleWorkerLeaseMock,
  type StaleLeaseRecoveryPlan,
} from '../runtime/worker-lease-recovery-service'

export interface MockWorkerLeaseFlowOutput {
  runtimeEnvelope?: BackendRuntimeEnvelope<Record<string, unknown>>
  transportResult?: BackendRuntimeTransportResult
  lease?: WorkerLeaseRecord
  heartbeat?: WorkerHeartbeatResult
  recoveryPlan?: StaleLeaseRecoveryPlan
  idempotencyResult?: IdempotencyCheckResult | ReturnType<typeof recordIdempotencyResultMock>
  queueItem?: JobRuntimeQueueItem
  workerOutput?: WorkerDispatchRuntimeResult
  jobEvents: JobRuntimeEvent[]
  chatSummary?: string
  nextStep: string
  warnings: string[]
}

export function runMockWorkerLeaseClaimFlow(
  scenarioInput: MockWorkerLeaseScenario | MockWorkerLeaseScenarioId = getDefaultMockWorkerLeaseScenario(),
): MockWorkerLeaseFlowOutput {
  const scenario = typeof scenarioInput === 'string'
    ? getScenarioOrThrow(scenarioInput)
    : scenarioInput

  if (scenario.id === 'claim-already-leased-job-blocked') return runAlreadyClaimedFlow()
  if (scenario.id === 'expired-lease-reclaimed') return runExpiredReclaimFlow()
  if (scenario.id === 'render-job-long-lease') return runClaimFlowFor('queue-mock-render-readiness-job-success', 'mock-render-worker', 'render_worker', scenario)
  if (scenario.id === 'frontend-safe-route-cannot-claim-real-lease') return runRealClaimBlockedFlow()

  return runClaimFlowFor('queue-mock-sfx-job-success', 'mock-sfx-worker', 'sfx_worker', scenario)
}

export function runMockWorkerHeartbeatFlow(): MockWorkerLeaseFlowOutput {
  const context = createQueuedJobContext('queue-mock-sfx-job-success')
  const claim = claimLease(context, 'mock-sfx-worker', 'sfx_worker')
  const heartbeat = claim.lease
    ? heartbeatWorkerLeaseMock(context.db, claim.lease.id, claim.lease.leaseToken)
    : undefined

  return {
    lease: heartbeat?.ok ? context.db.workerLeases.find((lease) => lease.id === heartbeat.leaseId) : claim.lease,
    heartbeat,
    queueItem: context.queueItem,
    jobEvents: heartbeat ? [createJobProgressEvent(context.queueItem.jobId, heartbeat.message)] : [],
    chatSummary: heartbeat?.message,
    nextStep: heartbeat?.ok ? 'heartbeat_recorded' : 'heartbeat_failed',
    warnings: [
      'Mock heartbeat only; no remote worker heartbeat was recorded.',
      ...(heartbeat?.warnings ?? claim.warnings),
    ],
  }
}

export function runMockWorkerLeaseRenewFlow(): MockWorkerLeaseFlowOutput {
  const context = createQueuedJobContext('queue-mock-sfx-job-success')
  const claim = claimLease(context, 'mock-sfx-worker', 'sfx_worker')
  const heartbeat = claim.lease
    ? renewWorkerLeaseMock(context.db, claim.lease.id, claim.lease.leaseToken)
    : undefined

  return {
    lease: heartbeat?.ok ? context.db.workerLeases.find((lease) => lease.id === heartbeat.leaseId) : claim.lease,
    heartbeat,
    queueItem: context.queueItem,
    jobEvents: heartbeat ? [createJobProgressEvent(context.queueItem.jobId, heartbeat.message)] : [],
    chatSummary: heartbeat?.message,
    nextStep: heartbeat?.ok ? 'lease_renewed' : 'renew_failed',
    warnings: [
      'Mock lease renewal only; no remote worker heartbeat was recorded.',
      ...(heartbeat?.warnings ?? claim.warnings),
    ],
  }
}

export function runMockWorkerLeaseCompleteFlow(): MockWorkerLeaseFlowOutput {
  const context = createQueuedJobContext('queue-mock-sfx-job-success')
  const claim = claimLease(context, 'mock-sfx-worker', 'sfx_worker')
  const complete = claim.lease
    ? completeWorkerLeaseMock(context.db, claim.lease.id, claim.lease.leaseToken)
    : claim

  return leaseLifecycleOutput(context, complete, 'lease_completed', [createJobCompletedEvent(context.queueItem.jobId, complete.message)])
}

export function runMockWorkerLeaseFailureFlow(): MockWorkerLeaseFlowOutput {
  const context = createQueuedJobContext('queue-mock-sfx-job-success')
  const claim = claimLease(context, 'mock-sfx-worker', 'sfx_worker')
  const failed = claim.lease
    ? failWorkerLeaseMock(context.db, claim.lease.id, claim.lease.leaseToken)
    : claim

  return leaseLifecycleOutput(context, failed, 'retry_or_recover', [createJobFailedEvent(context.queueItem.jobId, failed.message)])
}

export function runMockStaleLeaseRecoveryFlow(providerSideEffectsKnown = true): MockWorkerLeaseFlowOutput {
  const context = createQueuedJobContext('queue-mock-music-job-success')
  const claim = claimLease(context, 'mock-lyria-worker', 'lyria_worker')
  if (claim.lease) claim.lease.expiresAt = '2000-01-01T00:00:00.000Z'
  const staleLeases = detectStaleWorkerLeasesMock(context.db)
  const recoveryPlan = claim.lease
    ? recoverStaleWorkerLeaseMock(context.db, claim.lease.id, providerSideEffectsKnown)
    : undefined

  return {
    lease: recoveryPlan?.recoveredLease ?? claim.lease,
    recoveryPlan,
    queueItem: context.queueItem,
    jobEvents: [createJobProgressEvent(context.queueItem.jobId, `Detected ${staleLeases.length} stale lease(s).`)],
    chatSummary: recoveryPlan?.message,
    nextStep: recoveryPlan?.action === 'retry_scheduled' ? 'retry_scheduled' : 'manual_review_required',
    warnings: [
      'Mock stale lease recovery only; production recovery must verify provider side effects and idempotency.',
      ...(recoveryPlan?.warnings ?? claim.warnings),
    ],
  }
}

export function runMockIdempotencyConflictFlow(): MockWorkerLeaseFlowOutput {
  const db = createMockDatabase()
  const idempotencyKey = createIdempotencyKey('dispatch', 'duplicate-job')
  recordIdempotencyResultMock(db, {
    idempotencyKey,
    scope: 'job',
    sourceId: 'first-job',
    result: { status: 'completed' },
  })
  const idempotencyResult = checkIdempotencyConflictMock(db, idempotencyKey, 'second-job')

  return {
    idempotencyResult,
    jobEvents: [],
    chatSummary: idempotencyResult.message,
    nextStep: idempotencyResult.conflict ? 'block_duplicate_dispatch' : 'idempotency_recorded',
    warnings: idempotencyResult.warnings,
  }
}

export function runMockWorkerLeaseBackendRuntimeTransportFlow(): MockWorkerLeaseFlowOutput {
  const db = createMockDatabase()
  const runtimeEnvelope = createBackendRuntimeEnvelope<Record<string, unknown>>({
    requestId: 'mock-worker-lease-runtime-request',
    jobId: 'mock-worker-lease-job',
    target: 'api_route',
    transportMode: 'mock',
    safetyLevel: 'backend_required',
    payload: { mockOnly: true },
    mockOnly: true,
  })
  const transportResult = sendBackendRuntimeEnvelope(runtimeEnvelope, db)

  return {
    runtimeEnvelope,
    transportResult,
    jobEvents: [],
    chatSummary: transportResult.ok ? 'Mock backend runtime envelope acknowledged.' : transportResult.error?.message,
    nextStep: transportResult.ok ? 'runtime_message_acknowledged' : 'backend_required',
    warnings: transportResult.warnings,
  }
}

export function runMockWorkerLeaseRuntimeTransportBlockedFlow(): MockWorkerLeaseFlowOutput {
  const runtimeEnvelope = createBackendRuntimeEnvelope<Record<string, unknown>>({
    requestId: 'mock-worker-lease-cloud-run-request',
    jobId: 'mock-worker-lease-cloud-run-job',
    target: 'render_worker',
    transportMode: 'cloud_run_job',
    safetyLevel: 'cloud_runtime_required',
    payload: { mockOnly: true },
    mockOnly: false,
  })
  const transportResult = sendBackendRuntimeEnvelope(runtimeEnvelope)

  return {
    runtimeEnvelope,
    transportResult,
    jobEvents: [],
    chatSummary: transportResult.error?.message,
    nextStep: 'backend_required',
    warnings: transportResult.warnings,
  }
}

export function runMockLeaseReleaseFlow(): MockWorkerLeaseFlowOutput {
  const context = createQueuedJobContext('queue-mock-sfx-job-success')
  const claim = claimLease(context, 'mock-sfx-worker', 'sfx_worker')
  const release = claim.lease
    ? releaseWorkerLeaseMock(context.db, claim.lease.id, claim.lease.leaseToken)
    : claim

  return leaseLifecycleOutput(context, release, 'lease_released', [createJobProgressEvent(context.queueItem.jobId, release.message)])
}

export function runMockWorkerLeaseDispatchFlow(
  scenarioId: MockJobRuntimeScenarioId = 'queue-mock-render-readiness-job-success',
): MockWorkerLeaseFlowOutput {
  const context = createQueuedJobContext(scenarioId)
  const workerOutput = dispatchMockWorkerJob(context.queueItem, context.db)

  return {
    lease: workerOutput.lease,
    heartbeat: workerOutput.heartbeat,
    queueItem: context.queueItem,
    workerOutput,
    jobEvents: workerOutput.jobEvents,
    chatSummary: workerOutput.message,
    nextStep: workerOutput.ok ? 'worker_completed_mock' : 'worker_review_or_retry',
    warnings: workerOutput.warnings,
  }
}

function runClaimFlowFor(
  jobScenarioId: MockJobRuntimeScenarioId,
  workerId: string,
  workerKind: WorkerRuntimeKind,
  scenario: MockWorkerLeaseScenario,
): MockWorkerLeaseFlowOutput {
  const context = createQueuedJobContext(jobScenarioId)
  const claim = claimLease(context, workerId, workerKind)

  return leaseLifecycleOutput(context, claim, scenario.expectedNextStep, [createJobQueuedEvent(context.queueItem.jobId)])
}

function runAlreadyClaimedFlow(): MockWorkerLeaseFlowOutput {
  const context = createQueuedJobContext('queue-mock-sfx-job-success')
  claimLease(context, 'first-worker', 'sfx_worker')
  const secondClaim = claimLease(context, 'second-worker', 'sfx_worker')

  return leaseLifecycleOutput(context, secondClaim, 'wait_for_active_lease', [createJobProgressEvent(context.queueItem.jobId, secondClaim.message)])
}

function runExpiredReclaimFlow(): MockWorkerLeaseFlowOutput {
  const context = createQueuedJobContext('queue-mock-sfx-job-success')
  const firstClaim = claimLease(context, 'first-worker', 'sfx_worker')
  if (firstClaim.lease) firstClaim.lease.expiresAt = '2000-01-01T00:00:00.000Z'
  const reclaim = claimLease(context, 'second-worker', 'sfx_worker')

  return leaseLifecycleOutput(context, reclaim, 'lease_reclaimed', [createJobProgressEvent(context.queueItem.jobId, reclaim.message)])
}

function runRealClaimBlockedFlow(): MockWorkerLeaseFlowOutput {
  const claim = claimWorkerLease()

  return {
    jobEvents: [],
    chatSummary: claim.message,
    nextStep: 'backend_required',
    warnings: claim.warnings,
  }
}

function createQueuedJobContext(
  scenarioId: MockJobRuntimeScenarioId,
): {
  db: MockDatabase
  queueItem: JobRuntimeQueueItem
  scenario: MockJobRuntimeScenario
} {
  const scenario = getJobScenarioOrThrow(scenarioId)
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
    payload: {
      scenarioId: scenario.id,
      idempotencyKey: createJobIdempotencyKey(`${scenario.id}-job`),
    },
  })

  return {
    db: prepared.db,
    queueItem,
    scenario,
  }
}

function claimLease(
  context: { db: MockDatabase; queueItem: JobRuntimeQueueItem },
  workerId: string,
  workerKind: WorkerRuntimeKind,
): WorkerLeaseCheckResult {
  return claimWorkerLeaseMock(context.db, {
    jobId: context.queueItem.jobId,
    jobBatchId: context.queueItem.jobBatchId,
    workspaceId: context.queueItem.workspaceId,
    projectId: context.queueItem.projectId,
    editPlanId: context.queueItem.editPlanId,
    workerId,
    workerKind,
    queueItem: context.queueItem,
  })
}

function leaseLifecycleOutput(
  context: { queueItem: JobRuntimeQueueItem },
  leaseResult: WorkerLeaseCheckResult,
  nextStep: string,
  jobEvents: JobRuntimeEvent[],
): MockWorkerLeaseFlowOutput {
  return {
    lease: leaseResult.lease,
    queueItem: context.queueItem,
    jobEvents,
    chatSummary: leaseResult.message,
    nextStep,
    warnings: [
      'Mock worker lease lifecycle only; real lease mutation is backend-required.',
      ...leaseResult.warnings,
    ],
  }
}

function getScenarioOrThrow(id: MockWorkerLeaseScenarioId): MockWorkerLeaseScenario {
  const scenario = getMockWorkerLeaseScenarioById(id)
  if (!scenario) throw new Error(`Missing mock worker lease scenario: ${id}`)
  return scenario
}

function getJobScenarioOrThrow(id: MockJobRuntimeScenarioId): MockJobRuntimeScenario {
  const scenario = getMockJobRuntimeScenarioById(id)
  if (!scenario) throw new Error(`Missing mock job runtime scenario: ${id}`)
  return scenario
}
