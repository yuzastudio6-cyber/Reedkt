import type { WorkerLeaseRecord } from '../../types/worker-lease'
import type { MockDatabase } from '../mock/mock-database'
import { findMockRecord, nowIso } from '../mock/mock-database'

export interface StaleLeaseRecoveryPlan {
  staleLeases: WorkerLeaseRecord[]
  recoveredLease?: WorkerLeaseRecord
  action: 'none' | 'retry_scheduled' | 'blocked_requires_idempotency_review'
  message: string
  warnings: string[]
  mockOnly: boolean
}

export function detectStaleWorkerLeasesMock(db: MockDatabase): WorkerLeaseRecord[] {
  const now = new Date(nowIso()).getTime()
  return db.workerLeases.filter((lease) =>
    ['claimed', 'active', 'renewed'].includes(lease.status) &&
    new Date(lease.expiresAt).getTime() <= now,
  )
}

export function markWorkerLeaseStaleMock(db: MockDatabase, leaseId: string): WorkerLeaseRecord | undefined {
  const lease = findMockRecord(db, 'workerLeases', leaseId)
  if (!lease) return undefined
  lease.status = 'stale'
  return lease
}

export function recoverStaleWorkerLeaseMock(
  db: MockDatabase,
  leaseId: string,
  providerSideEffectsKnown = true,
): StaleLeaseRecoveryPlan {
  const lease = markWorkerLeaseStaleMock(db, leaseId)
  if (!lease) return createStaleLeaseRecoveryPlan([], 'none', 'No stale lease found.')

  const job = findMockRecord(db, 'jobs', lease.jobId)
  const providerLike = lease.workerKind === 'provider_worker' || lease.workerKind === 'lyria_worker' || lease.workerKind === 'sfx_worker'
  if (providerLike && !providerSideEffectsKnown) {
    return createStaleLeaseRecoveryPlan([lease], 'blocked_requires_idempotency_review', 'Provider-like stale lease requires idempotency review before retry.', lease)
  }

  if (job) {
    job.status = 'retrying'
    job.scheduledFor = nowIso()
    job.updatedAt = nowIso()
  }

  return createStaleLeaseRecoveryPlan([lease], 'retry_scheduled', 'Mock stale lease recovery scheduled a retry.', lease)
}

export function createStaleLeaseRecoveryPlan(
  staleLeases: WorkerLeaseRecord[],
  action: StaleLeaseRecoveryPlan['action'] = 'none',
  message = 'No stale lease recovery needed.',
  recoveredLease?: WorkerLeaseRecord,
): StaleLeaseRecoveryPlan {
  return {
    staleLeases,
    recoveredLease,
    action,
    message,
    warnings: ['Mock stale lease recovery only; production needs backend idempotency and worker-side-effect checks.'],
    mockOnly: true,
  }
}

export function createWorkerLeaseRecoverySummary(plan: StaleLeaseRecoveryPlan): string {
  return `${plan.action}: ${plan.message}`
}
