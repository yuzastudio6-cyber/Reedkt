import type {
  ApiIdempotencyKeyRecord,
  ApprovedPlanSnapshotRuntimeRecord,
  DownloadTarget,
  LocalObjectUploadResponse,
  ProviderRequestAttemptRecord,
  ProviderWebhookEventRecord,
  RuntimeRegion,
  SignedUrlEventRecord,
  SignedUrlPurpose,
  StorageObjectRecord,
  UploadPurpose,
  UploadTarget,
  ToolRuntimeCheckRecord,
  ToolRuntimeCheckStatus,
  ToolRuntimeName,
  UploadIntentRecord,
  WorkerJobClaimRecord,
  WorkerJobClaimStatus,
  MediaProbeResult,
  ToolReadinessCheckResult,
  WorkerExecutionResult,
  WorkerGateCheckResult,
  WorkerRuntimeMode,
  WorkerType,
  BasicRenderSmokeRequest,
  BasicRenderSmokeResponse,
  BasicPreviewRenderOutput,
  MediaProbeSummary,
  RenderSmokeQAResult,
  RenderSmokeStatus,
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
  uploadPurpose: UploadPurpose
  originalFileName: string
  mimeType: string
  expectedSizeBytes?: number
  checksumSha256?: string
  idempotencyKey?: string
}

export interface CreateUploadIntentResponse {
  uploadIntent: UploadIntentRecord
  uploadTarget: UploadTarget
  signedUrlEvent?: SignedUrlEventRecord
  warnings: string[]
}

export interface LocalObjectUploadRequest {
  uploadIntentId: string
  mimeType?: string
}

export interface LocalObjectUploadResult {
  localObjectUpload: LocalObjectUploadResponse
  warnings: string[]
}

export interface FinalizeUploadIntentRequest {
  workspaceId: string
  uploadIntentId: string
  checksumSha256?: string
  sizeBytes?: number
}

export interface FinalizeUploadIntentResponse {
  uploadIntent: UploadIntentRecord
  storageObjectRecord: StorageObjectRecord
  mediaAsset: Record<string, unknown>
  warnings: string[]
}

export interface CreateDownloadTargetRequest {
  workspaceId: string
  storageObjectRecordId: string
  urlPurpose?: SignedUrlPurpose
}

export interface CreateDownloadTargetResponse {
  downloadTarget: DownloadTarget
  signedUrlEvent?: SignedUrlEventRecord
  warnings: string[]
}

export interface StorageObjectRecordResponse {
  storageObjectRecord: StorageObjectRecord
  canonicalOnly: true
  warnings: string[]
}

export interface AttachFinalizedClipsRequest {
  workspaceId: string
  projectId?: string
  chatSessionId: string
  mediaAssetIds: string[]
}

export interface AttachFinalizedClipsResponse {
  attachmentBatch: {
    id: string
    workspaceId: string
    projectId?: string
    chatSessionId: string
    mediaAssetIds: string[]
    sourceOrder: Array<{ mediaAssetId: string; order: number }>
    mockOnly?: boolean
  }
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

export interface RunToolReadinessCheckRequest {
  workspaceId: string
  workerType?: WorkerType | string
  toolName?: ToolRuntimeName
  recordResults?: boolean
}

export interface RunToolReadinessCheckResponse {
  runtimeMode: WorkerRuntimeMode
  checks: ToolReadinessCheckResult[]
  missingRequiredTools: string[]
  warnings: string[]
}

export interface RunWorkerJobRequest {
  workspaceId: string
  projectId?: string
  workerType: WorkerType | string
  workerInstanceId?: string
  idempotencyKey: string
  dryRun?: boolean
  jobType?: string
  approvedPlanSnapshotId?: string
  creditReservationId?: string
  mediaAssetId?: string
  storageObjectRecordId?: string
  payloadJson?: JSONObject
}

export interface RunWorkerJobResponse {
  result: WorkerExecutionResult
}

export interface ProbeMediaJobRequest extends RunWorkerJobRequest {
  mediaAssetId?: string
  storageObjectRecordId?: string
}

export interface ProbeMediaJobResponse {
  result: WorkerExecutionResult
  mediaProbe?: MediaProbeResult
}

export interface RunBasicRenderSmokeRequest extends BasicRenderSmokeRequest {
  renderJobId: string
}

export interface RunBasicRenderSmokeResponse {
  result: WorkerExecutionResult
  renderSmoke?: BasicRenderSmokeResponse
}

export type {
  BasicPreviewRenderOutput,
  BasicRenderSmokeRequest,
  BasicRenderSmokeResponse,
  MediaProbeSummary,
  RenderSmokeQAResult,
  RenderSmokeStatus,
}

export interface WorkerGateCheckResponse {
  gateChecks: WorkerGateCheckResult[]
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
