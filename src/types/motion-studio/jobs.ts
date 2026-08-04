import type { ID, ISODateString } from '../shared'

export type MotionStudioJobStatus =
  | 'waiting'
  | 'queued'
  | 'claimed'
  | 'running'
  | 'cancel_requested'
  | 'reconciliation_required'
  | 'blocked'
  | 'succeeded'
  | 'failed'
  | 'cancelled'

export type MotionStudioJobAttemptStatus =
  | 'claimed'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'unknown'

export interface AuthorizeMotionStudioWorkGraphRequest {
  approvedSnapshotId: ID
  costEstimateId: ID
}

export interface CancelMotionStudioJobRequest {
  reason: string
}

export interface MotionStudioJobAttemptSummaryDto {
  id: ID
  attemptNumber: number
  status: MotionStudioJobAttemptStatus
  failureCategory?: string
  claimedAt: ISODateString
  startedAt?: ISODateString
  completedAt?: ISODateString
  attemptDeadlineAt: ISODateString
  lease?: {
    status: 'active' | 'released' | 'expired'
    expiresAt: ISODateString
  }
}

export interface MotionStudioJobDto {
  id: ID
  productionId: ID
  approvedSnapshotId: ID
  approvedWorkItemId: ID
  workItemKey: string
  sequenceNumber: number
  workItemType: string
  required: boolean
  status: MotionStudioJobStatus
  attemptCount: number
  maxAttempts: number
  runAfter: ISODateString
  cancellationRequestedAt?: ISODateString
  startedAt?: ISODateString
  completedAt?: ISODateString
  upstreamJobIds: readonly ID[]
  currentAttempt?: MotionStudioJobAttemptSummaryDto
}

export interface MotionStudioJobDependencyDto {
  upstreamJobId: ID
  downstreamJobId: ID
}

/**
 * Browser-safe durable execution projection. It deliberately excludes worker
 * identities, lease IDs/nonces/hashes, approved payloads, estimate lines,
 * raw budget events, internal cost amounts, and commercial pricing.
 */
export interface MotionStudioWorkGraphDto {
  productionId: ID
  approvedSnapshotId: ID
  costEstimateId: ID
  status: 'authorized' | 'incurring' | 'paused' | 'released' | 'exhausted' | 'cancelled'
  jobs: readonly MotionStudioJobDto[]
  dependencies: readonly MotionStudioJobDependencyDto[]
  localCandidateOnly: true
}

export interface MotionStudioWorkGraphAuthorizationReceiptDto {
  productionId: ID
  approvedSnapshotId: ID
  costEstimateId: ID
  jobCount: number
  localCandidateOnly: true
}

export interface MotionStudioJobCancellationReceiptDto {
  jobId: ID
  status: MotionStudioJobStatus
  localCandidateOnly: true
}
