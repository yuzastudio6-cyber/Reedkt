import type {
  ProductionWorkerJobPayload,
  ProductionWorkerLease,
  ProductionWorkerRuntimeState,
} from './production-worker-types'

function nowIso(): string {
  return new Date().toISOString()
}

function addMs(ms: number): string {
  return new Date(Date.now() + ms).toISOString()
}

export function createProductionWorkerRuntimeState(): ProductionWorkerRuntimeState {
  return {
    leases: [],
    idempotencyKeys: new Map<string, string>(),
    events: [],
  }
}

export function buildLeaseId(payload: ProductionWorkerJobPayload, workerInstanceId: string): string {
  return `lease:${payload.jobId}:${payload.workerType}:${workerInstanceId}:attempt-${payload.attempt}`
}

export function canClaimJob(state: ProductionWorkerRuntimeState, payload: ProductionWorkerJobPayload): boolean {
  return !state.leases.some((lease) => (
    lease.jobId === payload.jobId &&
    (lease.leaseStatus === 'claimed' || lease.leaseStatus === 'active') &&
    new Date(lease.expiresAt).getTime() > Date.now()
  ))
}

export function createWorkerLease(
  state: ProductionWorkerRuntimeState,
  payload: ProductionWorkerJobPayload,
  workerInstanceId = `worker-${payload.workerType}-local`,
  leaseDurationMs = 5 * 60 * 1000,
): ProductionWorkerLease {
  if (!canClaimJob(state, payload)) {
    throw new Error(`Production worker job is already leased: ${payload.jobId}`)
  }

  const lease: ProductionWorkerLease = {
    leaseId: buildLeaseId(payload, workerInstanceId),
    jobId: payload.jobId,
    workerType: payload.workerType,
    workerInstanceId,
    leaseStatus: 'claimed',
    claimedAt: nowIso(),
    heartbeatAt: nowIso(),
    expiresAt: addMs(leaseDurationMs),
  }

  state.leases.push(lease)
  return lease
}

export function heartbeatWorkerLease(
  state: ProductionWorkerRuntimeState,
  leaseId: string,
  leaseDurationMs = 5 * 60 * 1000,
): ProductionWorkerLease {
  const lease = state.leases.find((item) => item.leaseId === leaseId)
  if (!lease) {
    throw new Error(`Production worker lease not found: ${leaseId}`)
  }

  lease.leaseStatus = 'active'
  lease.heartbeatAt = nowIso()
  lease.expiresAt = addMs(leaseDurationMs)
  return lease
}

export function releaseWorkerLease(
  state: ProductionWorkerRuntimeState,
  leaseId: string,
): ProductionWorkerLease {
  const lease = state.leases.find((item) => item.leaseId === leaseId)
  if (!lease) {
    throw new Error(`Production worker lease not found: ${leaseId}`)
  }

  lease.leaseStatus = 'released'
  lease.releasedAt = nowIso()
  return lease
}

export function markLeaseStale(
  state: ProductionWorkerRuntimeState,
  leaseId: string,
): ProductionWorkerLease {
  const lease = state.leases.find((item) => item.leaseId === leaseId)
  if (!lease) {
    throw new Error(`Production worker lease not found: ${leaseId}`)
  }

  lease.leaseStatus = 'stale'
  return lease
}
