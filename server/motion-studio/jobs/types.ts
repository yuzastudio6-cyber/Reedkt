import type {
  MotionStudioJobAttemptStatus,
  MotionStudioJobStatus,
  MotionStudioWorkGraphDto,
} from '../../../src/types/motion-studio'
import type { MotionStudioProductionRow } from '../commands/types'

export interface MotionStudioJobRow {
  id: string
  workspace_id: string
  project_id: string
  edit_session_id: string
  production_id: string
  approved_snapshot_id: string
  approved_work_item_id: string
  cost_budget_id: string
  work_item_key: string
  sequence_number: number
  work_item_type: string
  required: boolean
  required_worker_class: string
  status: MotionStudioJobStatus
  maximum_authorized_internal_cost_micros: number
  max_attempts: number
  timeout_seconds: number
  attempt_count: number
  record_version: number
  run_after: string
  cancellation_requested_at: string | null
  started_at: string | null
  completed_at: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface MotionStudioJobDependencyRow {
  approved_snapshot_id: string
  upstream_job_id: string
  downstream_job_id: string
}

export interface MotionStudioJobAttemptRow {
  id: string
  job_id: string
  attempt_number: number
  status: MotionStudioJobAttemptStatus
  failure_category: string | null
  claimed_at: string
  started_at: string | null
  completed_at: string | null
  attempt_deadline_at: string
}

export interface MotionStudioSafeLeaseRow {
  attempt_id: string
  status: 'active' | 'released' | 'expired'
  expires_at: string
  issued_at: string
}

export interface MotionStudioCostBudgetRow {
  id: string
  production_id: string
  estimate_id: string
  approved_snapshot_id: string
  status: MotionStudioWorkGraphDto['status']
}

export interface MotionStudioAttemptUsageLine {
  costEstimateItemId: string
  meterId: string
  quantity: number
  internalCostMicros: number
  evidenceClass: 'provider_reported' | 'infrastructure_metered' | 'invoice_reconciled' | 'manually_adjusted'
  evidenceDigest: string
}

export interface MotionStudioClaimedJobResult {
  status: 'claimed'
  productionId: string
  jobId: string
  approvedSnapshotId: string
  workItemKey: string
  attemptId: string
  attemptNumber: number
  leaseId: string
  leaseNonce: string
  workerIdentityId: string
  expiresAt: string
  attemptDeadlineAt: string
  maximumAuthorizedInternalCostMicros: number
}

export interface MotionStudioNoReadyJobResult {
  status: 'no_ready_job'
  productionId: string
  workerIdentityId: string
}

export type MotionStudioJobClaimResult = MotionStudioClaimedJobResult | MotionStudioNoReadyJobResult

export interface MotionStudioAsyncFollowupLeaseResumeResult {
  status: 'resumed'
  productionId: string
  jobId: string
  attemptId: string
  leaseId: string
  leaseNonce: string
  workerIdentityId: string
  expiresAt: string
  externalOperationIdHash: string
  attemptCount: 1
  providerResubmissionAllowed: false
  automaticPollingAllowed: false
  maximumNetworkCallsPerCommand: 1
}

export interface MotionStudioAsyncFollowupHeartbeatResult {
  status: 'active'
  jobId: string
  attemptId: string
  leaseId: string
  expiresAt: string
  attemptDeadlineAt: string
  followupAuthorityExpiresAt: string
  attemptCount: 1
  providerResubmissionAllowed: false
  automaticPollingAllowed: false
  maximumNetworkCallsPerCommand: 1
}

export interface MotionStudioLocalMediaRecoveryLeaseResult {
  status: 'recovery_ready'
  productionId: string
  jobId: string
  attemptId: string
  leaseId: string
  leaseNonce: string
  workerIdentityId: string
  expiresAt: string
  attemptDeadlineAt: string
  externalOperationIdHash: string
  attemptCount: 1
  providerCallAllowed: false
  providerDownloadAllowed: false
  providerResubmissionAllowed: false
  automaticPollingAllowed: false
  maximumNetworkCalls: 0
}

export interface MotionStudioProviderSuccessReconciliationLeaseResult {
  status: 'resumed'
  productionId: string
  jobId: string
  attemptId: string
  leaseId: string
  leaseNonce: string
  workerIdentityId: string
  expiresAt: string
  attemptDeadlineAt: string
  externalOperationIdHash: string
  attemptCount: 1
  providerSubmissionMade: false
  providerResubmissionAllowed: false
  automaticPollingAllowed: false
  maximumNetworkCallsPerCommand: 1
  observedProviderStatus: 'Success'
  providerNativeWidth: 1364
  providerNativeHeight: 768
  diagnosticStatusQueryCount: 1
  observedResponseDigest: string
  observedEventDigest: string
}

export interface MotionStudioWorkerClaimPackage {
  job: MotionStudioJobRow
  approvedWorkItem: {
    id: string
    approvedSnapshotId: string
    workItemKey: string
    sequenceNumber: number
    workItemType: string
    payload: Record<string, unknown>
    payloadDigest: string
    required: boolean
  }
  costItems: readonly {
    id: string
    capabilityOrToolId: string
    rateCardVersionId: string
    quantity: number
    unit: string
    maximumAuthorizedInternalCostMicros: number
  }[]
}

export interface MotionStudioJobRepository {
  findProduction(productionId: string): Promise<MotionStudioProductionRow | undefined>
  authorizeWorkGraph(input: {
    productionId: string
    approvedSnapshotId: string
    costEstimateId: string
    actorUserId: string
    idempotencyKey: string
    requestHash: string
  }): Promise<{ productionId: string; approvedSnapshotId: string; costEstimateId: string; jobs: readonly { jobId: string }[] }>
  readWorkGraph(productionId: string): Promise<MotionStudioWorkGraphDto | undefined>
  cancelJob(input: {
    jobId: string
    reason: string
    actorUserId: string
    idempotencyKey: string
    requestHash: string
  }): Promise<{ jobId: string; status: MotionStudioJobStatus }>
  claimJob(input: {
    productionId: string
    workerIdentityId: string
    candidateLeaseId: string
    candidateLeaseNonce: string
    candidateCredentialHash: string
    leaseDurationSeconds: number
    actorUserId: string
    idempotencyKey: string
    requestHash: string
  }): Promise<MotionStudioJobClaimResult>
  resumeAsyncFollowupLease(input: {
    operationId: string
    workerIdentityId: string
    candidateLeaseId: string
    candidateLeaseNonce: string
    candidateCredentialHash: string
    leaseDurationSeconds: number
    actorUserId: string
    idempotencyKey: string
    requestHash: string
  }): Promise<MotionStudioAsyncFollowupLeaseResumeResult>
  heartbeatAsyncFollowupLease(input: LeaseMutationInput & {
    operationId: string
    extensionSeconds: number
  }): Promise<MotionStudioAsyncFollowupHeartbeatResult>
  resumeLocalMediaRecoveryLease(input: {
    operationId: string
    workerIdentityId: string
    candidateLeaseId: string
    candidateLeaseNonce: string
    candidateCredentialHash: string
    leaseDurationSeconds: number
    actorUserId: string
    idempotencyKey: string
    requestHash: string
  }): Promise<MotionStudioLocalMediaRecoveryLeaseResult>
  reconcileProviderSuccessLease(input: {
    operationId: string
    originalResponseDigest: string
    observedResponseDigest: string
    observedEventDigest: string
    externalOperationIdHash: string
    providerWidth: 1364
    providerHeight: 768
    diagnosticStatusQueryCount: 1
    observedAt: string
    workerIdentityId: string
    candidateLeaseId: string
    candidateLeaseNonce: string
    candidateCredentialHash: string
    leaseDurationSeconds: number
    actorUserId: string
    idempotencyKey: string
    requestHash: string
  }): Promise<MotionStudioProviderSuccessReconciliationLeaseResult>
  reconcileHailuoFileParseFailure(input: {
    operationId: string
    fileCallId: string
    evidenceDigest: string
    actorUserId: string
    idempotencyKey: string
    requestHash: string
  }): Promise<Record<string, unknown>>
  readWorkerClaimPackage(jobId: string): Promise<MotionStudioWorkerClaimPackage>
  startAttempt(input: LeaseMutationInput): Promise<Record<string, unknown>>
  heartbeatLease(input: LeaseMutationInput & { extensionSeconds: number }): Promise<Record<string, unknown>>
  finishAttempt(input: LeaseMutationInput & {
    outcome: 'succeeded' | 'failed' | 'cancelled'
    failureCategory?: string
    usage: readonly MotionStudioAttemptUsageLine[]
    outcomeDigest: string
  }): Promise<Record<string, unknown>>
  expireLease(input: Omit<LeaseMutationInput, 'credentialHash'>): Promise<Record<string, unknown>>
  reconcileAttempt(input: {
    jobId: string
    attemptId: string
    decision: 'no_side_effect' | 'side_effect_observed' | 'manual_review'
    usage: readonly MotionStudioAttemptUsageLine[]
    evidenceDigest: string
    actorUserId: string
    idempotencyKey: string
    requestHash: string
  }): Promise<Record<string, unknown>>
}

export interface LeaseMutationInput {
  leaseId: string
  credentialHash: string
  actorUserId: string
  idempotencyKey: string
  requestHash: string
}
