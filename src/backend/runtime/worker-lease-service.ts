import type { JobRuntimeQueueItem } from '../../types/job-runtime'
import type {
  WorkerHeartbeatResult,
  WorkerLeaseCheckResult,
  WorkerLeaseClaimAttemptRecord,
  WorkerLeaseRecord,
  WorkerRuntimeKind,
} from '../../types/worker-lease'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, findMockRecord, insertMockRecord, nowIso } from '../mock/mock-database'

const ACTIVE_LEASE_STATUSES = new Set(['claimed', 'active', 'renewed'])
const TERMINAL_LEASE_STATUSES = new Set(['released', 'completed', 'failed', 'expired', 'stale', 'cancelled'])

export interface ClaimWorkerLeaseInput {
  jobId: string
  jobBatchId?: string
  workspaceId?: string
  projectId?: string
  editPlanId?: string
  workerId: string
  workerKind: WorkerRuntimeKind
  queueItem?: JobRuntimeQueueItem
  leaseDurationMinutes?: number
}

export function claimWorkerLeaseMock(
  db: MockDatabase,
  input: ClaimWorkerLeaseInput,
): WorkerLeaseCheckResult {
  const job = findMockRecord(db, 'jobs', input.jobId)
  const queueItem = input.queueItem

  if (!job && !queueItem) {
    return recordClaim(db, input, 'job_not_found', 'Job was not found in mock database or queue item.')
  }

  const ready = queueItem
    ? queueItem.queueStatus === 'queued' || queueItem.queueStatus === 'retry_scheduled'
    : job?.status === 'queued' || job?.status === 'retrying'

  if (!ready) {
    return recordClaim(db, input, 'job_not_ready', `Job is not ready to lease. Status: ${queueItem?.queueStatus ?? job?.status ?? 'missing'}.`)
  }

  if (queueItem && !queueItem.gateCheck.ok) {
    return recordClaim(db, input, 'gate_failed', queueItem.gateCheck.message)
  }

  const activeLease = db.workerLeases.find((lease) =>
    lease.jobId === input.jobId &&
    ACTIVE_LEASE_STATUSES.has(lease.status) &&
    !isExpired(lease),
  )

  if (activeLease) {
    return recordClaim(db, input, 'already_claimed', `Job is already leased by ${activeLease.workerId}.`, activeLease)
  }

  const expiredLease = db.workerLeases.find((lease) =>
    lease.jobId === input.jobId &&
    ACTIVE_LEASE_STATUSES.has(lease.status) &&
    isExpired(lease),
  )

  if (expiredLease) {
    expiredLease.status = 'stale'
  }

  const lease: WorkerLeaseRecord = insertMockRecord(db, 'workerLeases', {
    id: createMockId('worker-lease'),
    jobId: input.jobId,
    jobBatchId: input.jobBatchId ?? queueItem?.jobBatchId ?? job?.jobBatchId,
    workspaceId: input.workspaceId ?? queueItem?.workspaceId ?? job?.workspaceId,
    projectId: input.projectId ?? queueItem?.projectId ?? job?.projectId,
    editPlanId: input.editPlanId ?? queueItem?.editPlanId ?? job?.editPlanId,
    workerId: input.workerId,
    workerKind: input.workerKind,
    status: 'claimed',
    leaseToken: createMockId('lease-token'),
    claimedAt: nowIso(),
    heartbeatAt: nowIso(),
    expiresAt: addMinutes(input.leaseDurationMinutes ?? defaultLeaseMinutes(input.workerKind)),
    claimAttemptCount: (expiredLease?.claimAttemptCount ?? 0) + 1,
    renewalCount: 0,
    mockOnly: true,
  })

  return recordClaim(
    db,
    input,
    expiredLease ? 'lease_expired_reclaimed' : 'claimed',
    expiredLease ? 'Expired lease reclaimed in mock runtime.' : 'Mock worker lease claimed.',
    lease,
  )
}

export function claimWorkerLease(): WorkerLeaseCheckResult {
  return {
    ok: false,
    claimResult: 'backend_required',
    message: 'Real worker lease claim requires backend/service-role runtime.',
    warnings: ['No remote lease mutation was attempted.'],
    mockOnly: true,
  }
}

export function renewWorkerLeaseMock(
  db: MockDatabase,
  leaseId: string,
  leaseToken: string,
  leaseDurationMinutes?: number,
): WorkerHeartbeatResult {
  const lease = findMockRecord(db, 'workerLeases', leaseId)
  if (!lease || lease.leaseToken !== leaseToken || TERMINAL_LEASE_STATUSES.has(lease.status)) {
    return heartbeatFailure(leaseId, 'Worker lease cannot be renewed.')
  }

  lease.status = 'renewed'
  lease.heartbeatAt = nowIso()
  lease.expiresAt = addMinutes(leaseDurationMinutes ?? defaultLeaseMinutes(lease.workerKind))
  lease.renewalCount += 1
  return heartbeatSuccess(lease, 'Mock worker lease renewed.')
}

export function heartbeatWorkerLeaseMock(
  db: MockDatabase,
  leaseId: string,
  leaseToken: string,
): WorkerHeartbeatResult {
  const lease = findMockRecord(db, 'workerLeases', leaseId)
  if (!lease || lease.leaseToken !== leaseToken || TERMINAL_LEASE_STATUSES.has(lease.status)) {
    return heartbeatFailure(leaseId, 'Worker heartbeat rejected.')
  }

  lease.status = 'active'
  lease.heartbeatAt = nowIso()
  lease.expiresAt = addMinutes(defaultLeaseMinutes(lease.workerKind))
  return heartbeatSuccess(lease, 'Mock worker heartbeat accepted.')
}

export function releaseWorkerLeaseMock(db: MockDatabase, leaseId: string, leaseToken: string): WorkerLeaseCheckResult {
  return finishLease(db, leaseId, leaseToken, 'released', 'Mock worker lease released.')
}

export function completeWorkerLeaseMock(db: MockDatabase, leaseId: string, leaseToken: string): WorkerLeaseCheckResult {
  return finishLease(db, leaseId, leaseToken, 'completed', 'Mock worker lease completed.')
}

export function failWorkerLeaseMock(db: MockDatabase, leaseId: string, leaseToken: string): WorkerLeaseCheckResult {
  return finishLease(db, leaseId, leaseToken, 'failed', 'Mock worker lease failed.')
}

export function cancelWorkerLeaseMock(db: MockDatabase, leaseId: string, leaseToken: string): WorkerLeaseCheckResult {
  return finishLease(db, leaseId, leaseToken, 'cancelled', 'Mock worker lease cancelled.')
}

export function createWorkerLeaseSummary(result: WorkerLeaseCheckResult): string {
  return result.message
}

export function defaultLeaseMinutes(workerKind: WorkerRuntimeKind): number {
  return workerKind === 'render_worker' || workerKind === 'provider_worker' || workerKind === 'lyria_worker' || workerKind === 'sfx_worker'
    ? 30
    : 5
}

function recordClaim(
  db: MockDatabase,
  input: ClaimWorkerLeaseInput,
  claimResult: WorkerLeaseCheckResult['claimResult'],
  reason: string,
  lease?: WorkerLeaseRecord,
): WorkerLeaseCheckResult {
  const attempt: WorkerLeaseClaimAttemptRecord = {
    id: createMockId('worker-lease-claim'),
    jobId: input.jobId,
    workerId: input.workerId,
    workerKind: input.workerKind,
    claimResult,
    reason,
    createdAt: nowIso(),
    mockOnly: true,
  }
  insertMockRecord(db, 'workerLeaseClaimAttempts', attempt)

  return {
    ok: claimResult === 'claimed' || claimResult === 'lease_expired_reclaimed',
    claimResult,
    lease,
    message: reason,
    warnings: ['Mock lease only; real lease claim must be transactional and backend-only.'],
    mockOnly: true,
  }
}

function finishLease(
  db: MockDatabase,
  leaseId: string,
  leaseToken: string,
  status: WorkerLeaseRecord['status'],
  message: string,
): WorkerLeaseCheckResult {
  const lease = findMockRecord(db, 'workerLeases', leaseId)
  if (!lease || lease.leaseToken !== leaseToken) {
    return {
      ok: false,
      claimResult: 'failed',
      message: 'Worker lease token did not match.',
      warnings: ['No lease was updated.'],
      mockOnly: true,
    }
  }

  lease.status = status
  if (status === 'released') lease.releasedAt = nowIso()
  if (status === 'completed') lease.completedAt = nowIso()
  if (status === 'failed') lease.failedAt = nowIso()

  return {
    ok: true,
    claimResult: 'claimed',
    lease,
    message,
    warnings: ['Mock lease lifecycle only; no remote worker lease was mutated.'],
    mockOnly: true,
  }
}

function heartbeatSuccess(lease: WorkerLeaseRecord, message: string): WorkerHeartbeatResult {
  return {
    ok: true,
    leaseId: lease.id,
    heartbeatAt: lease.heartbeatAt ?? nowIso(),
    expiresAt: lease.expiresAt,
    message,
    warnings: ['Mock heartbeat only; no remote heartbeat table was updated.'],
    mockOnly: true,
  }
}

function heartbeatFailure(leaseId: string, message: string): WorkerHeartbeatResult {
  return {
    ok: false,
    leaseId,
    heartbeatAt: nowIso(),
    expiresAt: nowIso(),
    message,
    warnings: ['No lease heartbeat was recorded.'],
    mockOnly: true,
  }
}

function isExpired(lease: WorkerLeaseRecord): boolean {
  return new Date(lease.expiresAt).getTime() <= new Date(nowIso()).getTime()
}

function addMinutes(minutes: number): string {
  const date = new Date(nowIso())
  date.setMinutes(date.getMinutes() + minutes)
  return date.toISOString()
}
