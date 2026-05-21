import type {
  ApiIdempotencyKeyRecord,
  ApprovedPlanSnapshotRuntimeRecord,
  ProviderRequestAttemptRecord,
  ProviderWebhookEventRecord,
  RuntimeRegion,
  RuntimeUploadPurpose,
  SignedUrlEventRecord,
  SignedUrlPurpose,
  StorageObjectRecord,
  StorageObjectPurpose,
  ToolRuntimeCheckRecord,
  ToolRuntimeCheckStatus,
  ToolRuntimeName,
  UploadIntentRecord,
  WorkerJobClaimRecord,
  WorkerJobClaimStatus,
} from '../../types'
import type { JSONObject } from '../../types/shared'

export interface CreateApprovedPlanSnapshotRequest {
  workspaceId: string
  projectId: string
  chatSessionId?: string
  editPlanId: string
  creditEstimateId: string
  creditApprovalId: string
  creditReservationId: string
  approvedByUserId: string
  snapshotVersion: number
  snapshotJson: JSONObject
  planHash: string
  creditHash: string
  sourceSequenceHash: string
  timingHash: string
  idempotencyKey?: string
}

export interface CreateApprovedPlanSnapshotResponse {
  approvedPlanSnapshot: ApprovedPlanSnapshotRuntimeRecord
  warnings: string[]
}

export interface CreateApiIdempotencyKeyRequest {
  workspaceId: string
  userId: string
  idempotencyKey: string
  requestMethod: string
  requestPath: string
  requestHash: string
  expiresAt: string
}

export interface CreateApiIdempotencyKeyResponse {
  idempotencyKeyRecord: ApiIdempotencyKeyRecord
}

export interface CreateUploadIntentRequest {
  workspaceId: string
  projectId: string
  chatSessionId?: string
  requestedByUserId: string
  uploadPurpose: RuntimeUploadPurpose
  targetBucket: string
  targetPath: string
  originalFileName?: string
  mimeType?: string
  expectedSizeBytes?: number
  checksumSha256?: string
  expiresAt: string
  idempotencyKey?: string
}

export interface CreateUploadIntentResponse {
  uploadIntent: UploadIntentRecord
  warnings: string[]
}

export interface FinalizeUploadIntentRequest {
  workspaceId: string
  projectId: string
  uploadIntentId: string
  mediaAssetId?: string
  storageObjectPurpose: StorageObjectPurpose
  bucketName: string
  objectPath: string
  mimeType?: string
  sizeBytes?: number
  checksumSha256?: string
  region?: RuntimeRegion
}

export interface FinalizeUploadIntentResponse {
  uploadIntent: UploadIntentRecord
  storageObjectRecord: StorageObjectRecord
  warnings: string[]
}

export interface CreateSignedUrlEventRequest {
  workspaceId: string
  projectId?: string
  storageObjectRecordId?: string
  uploadIntentId?: string
  requestedByUserId?: string
  urlPurpose: SignedUrlPurpose
  expiresAt: string
  metadataJson?: JSONObject
}

export interface CreateSignedUrlEventResponse {
  signedUrlEvent: SignedUrlEventRecord
}

export interface ClaimWorkerJobRequest {
  workspaceId: string
  projectId?: string
  jobId: string
  workerType: string
  workerInstanceId: string
  leaseExpiresAt: string
  attemptNumber?: number
  idempotencyKey: string
}

export interface ClaimWorkerJobResponse {
  claim: WorkerJobClaimRecord
  canClaim: boolean
  warnings: string[]
}

export interface ReleaseWorkerJobClaimRequest {
  claimId: string
  jobId: string
  workerInstanceId: string
  claimStatus: Exclude<WorkerJobClaimStatus, 'active'>
  releasedAt?: string
}

export interface ReleaseWorkerJobClaimResponse {
  claim: WorkerJobClaimRecord
}

export interface RecordToolRuntimeCheckRequest {
  workspaceId: string
  workerType: string
  runtimeRegion?: RuntimeRegion
  toolName: ToolRuntimeName
  toolVersion?: string
  checkStatus: ToolRuntimeCheckStatus
  checkSummary: string
  binaryPath?: string
  capabilitiesJson?: JSONObject
  checkedAt?: string
}

export interface RecordToolRuntimeCheckResponse {
  toolRuntimeCheck: ToolRuntimeCheckRecord
}

export interface RecordProviderRequestAttemptRequest {
  workspaceId: string
  projectId?: string
  generationRequestId?: string
  jobId?: string
  approvedPlanSnapshotId?: string
  creditReservationId?: string
  providerRoute: string
  providerModel?: string
  attemptStatus: ProviderRequestAttemptRecord['attemptStatus']
  idempotencyKey: string
  requestPayloadHash: string
  normalizedErrorCode?: string
  normalizedErrorMessage?: string
  startedAt?: string
  completedAt?: string
}

export interface RecordProviderRequestAttemptResponse {
  providerRequestAttempt: ProviderRequestAttemptRecord
}

export interface RecordProviderWebhookEventRequest {
  workspaceId: string
  projectId?: string
  providerRoute: string
  providerEventId: string
  generationRequestId?: string
  jobId?: string
  eventStatus: ProviderWebhookEventRecord['eventStatus']
  signatureVerified: boolean
  receivedAt?: string
  processedAt?: string
  eventPayloadSummaryJson?: JSONObject
}

export interface RecordProviderWebhookEventResponse {
  providerWebhookEvent: ProviderWebhookEventRecord
}
