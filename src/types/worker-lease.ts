export type WorkerLeaseStatus =
  | 'available'
  | 'claimed'
  | 'active'
  | 'renewed'
  | 'released'
  | 'completed'
  | 'failed'
  | 'expired'
  | 'stale'
  | 'cancelled'

export type WorkerLeaseClaimResult =
  | 'claimed'
  | 'already_claimed'
  | 'job_not_found'
  | 'job_not_ready'
  | 'gate_failed'
  | 'lease_expired_reclaimed'
  | 'backend_required'
  | 'failed'

export type WorkerRuntimeKind =
  | 'mock_worker'
  | 'lyria_worker'
  | 'sfx_worker'
  | 'render_worker'
  | 'planning_worker'
  | 'qa_worker'
  | 'provider_worker'
  | 'custom_worker'

export interface WorkerLeaseRecord {
  id: string
  jobId: string
  jobBatchId?: string
  workspaceId?: string
  projectId?: string
  editPlanId?: string
  workerId: string
  workerKind: WorkerRuntimeKind
  status: WorkerLeaseStatus
  leaseToken: string
  claimedAt: string
  heartbeatAt?: string
  expiresAt: string
  releasedAt?: string
  completedAt?: string
  failedAt?: string
  claimAttemptCount: number
  renewalCount: number
  mockOnly: boolean
}

export interface WorkerLeaseCheckResult {
  ok: boolean
  claimResult: WorkerLeaseClaimResult
  lease?: WorkerLeaseRecord
  message: string
  warnings: string[]
  mockOnly: boolean
}

export interface WorkerHeartbeatResult {
  ok: boolean
  leaseId: string
  heartbeatAt: string
  expiresAt: string
  message: string
  warnings: string[]
  mockOnly: boolean
}

export interface WorkerLeaseClaimAttemptRecord {
  id: string
  jobId: string
  workerId: string
  workerKind: WorkerRuntimeKind
  claimResult: WorkerLeaseClaimResult
  reason: string
  createdAt: string
  mockOnly: boolean
}
