import type { ID, ISODateString, JSONObject } from './shared'

export type ApprovedPlanSnapshotRuntimeStatus =
  | 'draft'
  | 'approved'
  | 'locked'
  | 'superseded'
  | 'cancelled'
  | 'failed'

export type RuntimeUploadPurpose =
  | 'source_media'
  | 'reference_media'
  | 'generated_asset'
  | 'preview_render'
  | 'final_export'
  | 'thumbnail'
  | 'audio_asset'
  | 'profile_asset'
  | 'brand_asset'
  | 'qa_artifact'
  | 'worker_temp'

export type UploadIntentStatus =
  | 'planned'
  | 'signed'
  | 'uploading'
  | 'uploaded'
  | 'finalized'
  | 'expired'
  | 'cancelled'
  | 'failed'

export type StorageObjectPurpose =
  | 'source_media'
  | 'reference_media'
  | 'generated_asset'
  | 'processed_media'
  | 'preview_render'
  | 'final_export'
  | 'thumbnail'
  | 'qa_artifact'
  | 'worker_temp'
  | 'audio_asset'
  | 'caption_asset'
  | 'other'

export type StorageObjectStatus =
  | 'planned'
  | 'uploading'
  | 'ready'
  | 'processing'
  | 'archived'
  | 'deleted'
  | 'failed'
  | 'expired'

export type SignedUrlPurpose =
  | 'upload'
  | 'download'
  | 'preview_review'
  | 'thumbnail'
  | 'qa_review'
  | 'export_delivery'
  | 'worker_read'
  | 'worker_write'

export type WorkerJobClaimStatus =
  | 'active'
  | 'released'
  | 'completed'
  | 'failed'
  | 'expired'
  | 'cancelled'

export type RuntimeRegion = 'us-east1' | 'europe-west1'

export type ToolRuntimeName =
  | 'ffmpeg'
  | 'ffprobe'
  | 'remotion'
  | 'sharp_libvips'
  | 'audioflux'
  | 'signalsmith_stretch'
  | 'opencv'
  | 'vapoursynth'
  | 'playwright'

export type ToolRuntimeCheckStatus =
  | 'passed'
  | 'warning'
  | 'failed'
  | 'missing'
  | 'blocked'

export type ProviderRequestAttemptStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'blocked'
  | 'cancelled'

export type ProviderWebhookEventStatus =
  | 'received'
  | 'ignored'
  | 'processed'
  | 'failed'
  | 'blocked'

export interface ApprovedPlanSnapshotRuntimeRecord {
  id: ID
  workspaceId: ID
  projectId: ID
  chatSessionId?: ID
  editPlanId: ID
  creditEstimateId: ID
  creditApprovalId: ID
  creditReservationId: ID
  approvedByUserId: ID
  snapshotVersion: number
  snapshotStatus: ApprovedPlanSnapshotRuntimeStatus
  snapshotJson: JSONObject
  planHash: string
  creditHash: string
  sourceSequenceHash: string
  timingHash: string
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface ApiIdempotencyKeyRecord {
  id: ID
  workspaceId: ID
  userId: ID
  idempotencyKey: string
  requestMethod: string
  requestPath: string
  requestHash: string
  responseStatus?: number
  responseRecordTable?: string
  responseRecordId?: ID
  expiresAt: ISODateString
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface UploadIntentRecord {
  id: ID
  workspaceId: ID
  projectId: ID
  chatSessionId?: ID
  requestedByUserId: ID
  uploadPurpose: RuntimeUploadPurpose
  targetBucket: string
  targetPath: string
  originalFileName?: string
  mimeType?: string
  expectedSizeBytes?: number
  checksumSha256?: string
  status: UploadIntentStatus
  expiresAt: ISODateString
  finalizedAt?: ISODateString
  mediaAssetId?: ID
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface StorageObjectRecord {
  id: ID
  workspaceId: ID
  projectId?: ID
  mediaAssetId?: ID
  generatedAssetId?: ID
  renderId?: ID
  qaReportId?: ID
  uploadIntentId?: ID
  bucketName: string
  objectPath: string
  objectPurpose: StorageObjectPurpose
  mimeType?: string
  sizeBytes?: number
  checksumSha256?: string
  region?: RuntimeRegion
  status: StorageObjectStatus
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface SignedUrlEventRecord {
  id: ID
  workspaceId: ID
  projectId?: ID
  storageObjectRecordId?: ID
  uploadIntentId?: ID
  requestedByUserId?: ID
  urlPurpose: SignedUrlPurpose
  expiresAt: ISODateString
  createdAt: ISODateString
  metadataJson: JSONObject
}

export interface WorkerJobClaimRecord {
  id: ID
  workspaceId: ID
  projectId?: ID
  jobId: ID
  workerType: string
  workerInstanceId: string
  claimStatus: WorkerJobClaimStatus
  claimedAt: ISODateString
  heartbeatAt?: ISODateString
  releasedAt?: ISODateString
  leaseExpiresAt: ISODateString
  attemptNumber: number
  idempotencyKey: string
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface ToolRuntimeCheckRecord {
  id: ID
  workspaceId: ID
  workerType: string
  runtimeRegion?: RuntimeRegion
  toolName: ToolRuntimeName
  toolVersion?: string
  checkStatus: ToolRuntimeCheckStatus
  checkSummary: string
  binaryPath?: string
  capabilitiesJson: JSONObject
  checkedAt: ISODateString
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface ProviderRequestAttemptRecord {
  id: ID
  workspaceId: ID
  projectId?: ID
  generationRequestId?: ID
  jobId?: ID
  approvedPlanSnapshotId?: ID
  creditReservationId?: ID
  providerRoute: string
  providerModel?: string
  attemptStatus: ProviderRequestAttemptStatus
  idempotencyKey: string
  requestPayloadHash: string
  normalizedErrorCode?: string
  normalizedErrorMessage?: string
  startedAt?: ISODateString
  completedAt?: ISODateString
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface ProviderWebhookEventRecord {
  id: ID
  workspaceId: ID
  projectId?: ID
  providerRoute: string
  providerEventId: string
  generationRequestId?: ID
  jobId?: ID
  eventStatus: ProviderWebhookEventStatus
  signatureVerified: boolean
  receivedAt: ISODateString
  processedAt?: ISODateString
  eventPayloadSummaryJson: JSONObject
  createdAt: ISODateString
  updatedAt: ISODateString
}
