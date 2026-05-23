import type { ID, ISODateString, JSONObject } from './shared'
import type { UploadPurpose as BaseUploadPurpose } from './upload'

export type ApprovedPlanSnapshotRuntimeStatus =
  | 'draft'
  | 'approved'
  | 'locked'
  | 'superseded'
  | 'cancelled'
  | 'failed'

export type RuntimeUploadPurpose = BaseUploadPurpose

export type StorageMode = 'local' | 'gcs_disabled' | 'gcs'

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
  | BaseUploadPurpose
  | 'source_media'
  | 'reference_media'
  | 'generated_asset'
  | 'processed_media'
  | 'preview'
  | 'export'
  | 'preview_render'
  | 'final_export'
  | 'thumbnail'
  | 'qa_artifact'
  | 'worker_temp'
  | 'audio_asset'
  | 'caption_asset'
  | 'other'

export interface UploadTarget {
  uploadMethod: 'PUT' | 'POST'
  uploadUrl: string
  uploadHeaders: Record<string, string>
  expiresAt: ISODateString
  bucketName: string
  objectPath: string
  temporary: true
}

export interface DownloadTarget {
  downloadMethod: 'GET'
  downloadUrl: string
  expiresAt: ISODateString
  bucketName: string
  objectPath: string
  temporary: true
}

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

export type WorkerRuntimeMode = 'local' | 'mock' | 'cloud_run' | 'disabled'

export type WorkerType =
  | 'noop_worker'
  | 'approved_snapshot_readiness_worker'
  | 'source_media_readiness_worker'
  | 'media_probe_worker'
  | 'basic_render_smoke_worker'
  | 'render_worker'
  | 'sfx_worker'
  | 'provider_gateway_worker'
  | 'quality_check_worker'

export type WorkerToolName = ToolRuntimeName

export type ToolReadinessStatus = ToolRuntimeCheckStatus | 'available' | 'unavailable'

export interface ToolReadinessCheckResult {
  toolName: WorkerToolName
  status: ToolReadinessStatus
  required: boolean
  version?: string
  binaryPath?: string
  capabilities: string[]
  summary: string
  checkedAt: ISODateString
  durationMs: number
  errorCode?: string
  mockOnly?: boolean
}

export interface WorkerGateCheckResult {
  gate: string
  passed: boolean
  required: boolean
  message: string
  details?: JSONObject
}

export interface WorkerJobClaimRequest {
  workspaceId: ID
  projectId?: ID
  jobId: ID
  workerType: WorkerType | string
  workerInstanceId: string
  idempotencyKey: string
  leaseExpiresAt?: ISODateString
  dryRun?: boolean
}

export interface WorkerJobClaimResponse {
  claim?: WorkerJobClaimRecord
  gateChecks: WorkerGateCheckResult[]
  toolChecks: ToolReadinessCheckResult[]
  warnings: string[]
}

export interface WorkerJobHeartbeatRequest {
  jobId: ID
  claimId?: ID
  workerInstanceId?: string
}

export interface WorkerJobReleaseRequest {
  jobId: ID
  claimId?: ID
  workerInstanceId?: string
  claimStatus: Exclude<WorkerJobClaimStatus, 'active'>
}

export interface WorkerEventPayload {
  eventName: string
  jobId: ID
  workerType: string
  workerInstanceId?: string
  message: string
  progressPercent?: number
  payloadJson?: JSONObject
  createdAt: ISODateString
}

export interface MediaProbeResult {
  mediaAssetId?: ID
  storageObjectRecordId?: ID
  durationSeconds?: number
  width?: number
  height?: number
  codecName?: string
  formatName?: string
  sizeBytes?: number
  streamCount: number
  probeTool: 'ffprobe'
  mockOnly?: boolean
}

export interface MediaProbeSummary {
  durationSeconds?: number
  width?: number
  height?: number
  videoCodec?: string
  audioCodec?: string
  formatName?: string
  sizeBytes?: number
  streamCount: number
  rawSummary: JSONObject
}

export interface BasicPreviewRenderOutput {
  durationSeconds: number
  sizeBytes: number
  checksumSha256: string
  commandSummary: JSONObject
}

export type PersistedRenderExecutionMode =
  | 'metadata_stub'
  | 'local_ffmpeg'
  | 'staging_cloud_run_remotion_canary'
  | 'staging_real_video_upload_preview_canary'

export type RenderSmokeStatus = 'preview_ready' | 'skipped' | 'failed'

export interface RenderSmokeQAResult {
  qaReportId: ID
  status: 'passed' | 'failed' | 'skipped'
  checks: string[]
  warnings: string[]
}

export interface BasicRenderSmokeRequest {
  workspaceId?: ID
  projectId?: ID
  sourceStorageObjectId: ID
  sourceStorageObject?: {
    id: ID
    mediaAssetId: ID
    bucketName: string
    objectPath: string
    mimeType?: string
    sizeBytes?: number
    checksumSha256?: string
  }
  approvedPlanSnapshotId: ID
  creditReservationId: ID
  workerInstanceId?: string
  strict?: boolean
}

export interface BasicRenderSmokeResponse {
  ok: boolean
  status: RenderSmokeStatus
  renderId?: ID
  renderJobId: ID
  sourceMediaAssetId?: ID
  sourceStorageObjectId?: ID
  previewStorageObjectId?: ID
  qaReportId?: ID
  outputBucketName?: string
  outputObjectPath?: string
  durationSeconds?: number
  sizeBytes?: number
  checksumSha256?: string
  mediaProbe?: MediaProbeSummary
  previewRender?: BasicPreviewRenderOutput
  warnings: string[]
  error?: {
    code: string
    message: string
  }
}

export type SupabaseE2ESmokeMode = 'disabled' | 'live'

export type SupabaseE2ESmokeStatus = 'passed' | 'failed' | 'skipped'

export interface SupabaseTableReadinessGroupResult {
  group: string
  ok: boolean
  availableTables: string[]
  missingTables: string[]
}

export interface SupabaseTableReadinessResult {
  ok: boolean
  checkedAt: ISODateString
  availableTables: string[]
  missingTables: string[]
  groups: SupabaseTableReadinessGroupResult[]
  warnings: string[]
}

export interface SupabaseE2ESmokeRecordIds {
  workspaceId?: ID
  projectId?: ID
  userId?: ID
  chatSessionId?: ID
  chatMessageId?: ID
  uploadIntentId?: ID
  mediaAssetId?: ID
  sourceStorageObjectId?: ID
  editSessionId?: ID
  editPlanVersionId?: ID
  editPlanId?: ID
  creditWalletId?: ID
  creditEstimateId?: ID
  creditApprovalId?: ID
  creditReservationId?: ID
  approvedPlanSnapshotId?: ID
  jobBatchId?: ID
  jobId?: ID
  renderJobId?: ID
  renderId?: ID
  previewStorageObjectId?: ID
  qaReportId?: ID
}

export interface SupabaseE2ESmokeResponse {
  ok: boolean
  status: SupabaseE2ESmokeStatus
  smokeMode: SupabaseE2ESmokeMode | string
  liveSupabaseConfigured: boolean
  writesAllowed: boolean
  cleanupEnabled: boolean
  tableReadiness?: SupabaseTableReadinessResult
  records?: SupabaseE2ESmokeRecordIds
  cleanup?: {
    attempted: boolean
    deleted: Array<{ table: string; id: ID }>
    errors: string[]
  }
  renderSmoke?: WorkerExecutionResult | JSONObject
  warnings: string[]
  error?: {
    code: string
    message: string
    details?: JSONObject
  }
}

export type E2EServiceRoleRpcStatus =
  | 'disabled'
  | 'missing_env'
  | 'missing_rpc'
  | 'idempotent_replay'
  | 'approved'
  | 'reserved'
  | 'queued'
  | 'active'
  | 'released'
  | 'completed'
  | 'recorded'
  | 'ready'
  | 'preview_ready'
  | 'failed'

export interface E2EServiceRoleRpcError {
  code: string
  message: string
  details?: JSONObject
}

export interface E2EServiceRoleRpcBaseResult {
  ok: boolean
  status: E2EServiceRoleRpcStatus | string
  warnings: string[]
  error?: E2EServiceRoleRpcError
}

export interface E2EApprovedSnapshotRpcResult extends E2EServiceRoleRpcBaseResult {
  approvedPlanSnapshotId?: ID
}

export interface E2ECreditReservationRpcResult extends E2EServiceRoleRpcBaseResult {
  creditReservationId?: ID
  creditLedgerEntryId?: ID
}

export interface E2EJobBatchRenderJobRpcResult extends E2EServiceRoleRpcBaseResult {
  jobBatchId?: ID
  jobId?: ID
  renderJobId?: ID
}

export interface E2EWorkerClaimRpcResult extends E2EServiceRoleRpcBaseResult {
  workerJobClaimId?: ID
}

export interface E2EJobEventRpcResult extends E2EServiceRoleRpcBaseResult {
  jobEventId?: ID
  eventName?: string
  eventType?: string
}

export interface E2EPreviewStorageObjectRpcResult extends E2EServiceRoleRpcBaseResult {
  previewStorageObjectId?: ID
}

export interface E2EPreviewRenderRpcResult extends E2EServiceRoleRpcBaseResult {
  renderId?: ID
}

export interface E2EPreviewQARpcResult extends E2EServiceRoleRpcBaseResult {
  qaReportId?: ID
}

export interface E2EPreviewReadyRpcResult extends E2EServiceRoleRpcBaseResult {
  jobId?: ID
  renderJobId?: ID
  renderId?: ID
  qaReportId?: ID
  previewStorageObjectId?: ID
  jobEvent?: JSONObject
}

export interface E2ERpcReadinessResult {
  ok: boolean
  checkedAt: ISODateString
  availableRpcs: string[]
  missingRpcs: string[]
  warnings: string[]
}

export interface E2EPersistedRenderPipelineResult extends E2EServiceRoleRpcBaseResult {
  renderExecutionMode?: PersistedRenderExecutionMode
  smokeRunId?: ID
  workspaceId?: ID
  projectId?: ID
  sourceStorageObjectId?: ID
  approvedPlanSnapshotId?: ID
  creditReservationId?: ID
  creditLedgerEntryId?: ID
  jobBatchId?: ID
  jobId?: ID
  renderJobId?: ID
  workerJobClaimId?: ID
  renderId?: ID
  previewStorageObjectId?: ID
  qaReportId?: ID
  outputBucketName?: string
  outputObjectPath?: string
  durationSeconds?: number
  sizeBytes?: number
  checksumSha256?: string
  mediaProbe?: MediaProbeSummary
  previewRender?: BasicPreviewRenderOutput
  outputArtifactSummary?: JSONObject
  rpcReadiness?: E2ERpcReadinessResult
  events?: E2EJobEventRpcResult[]
  jobEventIds?: ID[]
}

export type E2EFullEditingFlowMode = 'local' | 'supabase'

export type E2EFullEditingFlowStatus = 'preview_ready' | 'failed' | 'skipped'

export type E2EFlowStepStatus = 'pending' | 'passed' | 'failed' | 'skipped'

export interface E2EFlowStepResult {
  name: string
  status: E2EFlowStepStatus
  details?: JSONObject
  completedAt?: ISODateString
}

export interface E2EFullEditingFlowRequest {
  workspaceId?: ID
  projectId?: ID
  projectName?: string
  strict?: boolean
  cleanup?: boolean
  idempotencyKey?: string
}

export interface E2EJobTransitionResult {
  ok: boolean
  jobId: ID
  fromStatus?: string
  toStatus: string
  warnings: string[]
  error?: E2EServiceRoleRpcError
}

export interface E2ECreditRefundPlaceholderResult {
  ok: boolean
  status: 'not_required' | 'modeled' | 'blocked' | 'failed'
  creditReservationId?: ID
  jobId?: ID
  refundRequired: boolean
  reason?: string
  warnings: string[]
  error?: E2EServiceRoleRpcError
}

export interface E2EReadinessSummary {
  ok: boolean
  localFullFlowReady: boolean
  supabaseFullFlowReady: boolean
  providerRealCallsDisabled: boolean
  remotionDisabled: boolean
  storageMode: StorageMode | string
  toolReadiness: {
    ffmpegFfprobeReady: boolean
    warnings: string[]
  }
  supabase: {
    smokeMode: SupabaseE2ESmokeMode | string
    writesAllowed: boolean
    tableStatus: SupabaseE2ESmokeStatus | string
    rpcStatus: SupabaseE2ESmokeStatus | string
  }
  blockers: string[]
  warnings: string[]
}

export interface E2EFullEditingFlowResult {
  ok: boolean
  status: E2EFullEditingFlowStatus
  mode: E2EFullEditingFlowMode
  workspaceId?: ID
  projectId?: ID
  chatSessionId?: ID
  uploadIntentId?: ID
  mediaAssetId?: ID
  sourceStorageObjectId?: ID
  approvedPlanSnapshotId?: ID
  creditReservationId?: ID
  jobBatchId?: ID
  jobId?: ID
  renderJobId?: ID
  workerJobClaimId?: ID
  renderId?: ID
  previewStorageObjectId?: ID
  qaReportId?: ID
  outputObjectPath?: string
  checksumSha256?: string
  workerResult?: JSONObject
  renderSmoke?: JSONObject
  steps: E2EFlowStepResult[]
  providerCallsAttempted: boolean
  remotionUsed: boolean
  signedUrlStoredAsCanonical: boolean
  startedAt: ISODateString
  completedAt: ISODateString
  warnings: string[]
  error?: E2EServiceRoleRpcError
}

export interface WorkerExecutionResult {
  jobId: ID
  workerType: string
  workerInstanceId: string
  status: 'completed' | 'failed' | 'blocked' | 'dry_run'
  claim?: WorkerJobClaimRecord
  gateChecks: WorkerGateCheckResult[]
  toolChecks: ToolReadinessCheckResult[]
  events: WorkerEventPayload[]
  output?: JSONObject | MediaProbeResult | BasicRenderSmokeResponse
  error?: {
    code: string
    message: string
  }
  warnings: string[]
  startedAt: ISODateString
  completedAt: ISODateString
}

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

export interface LocalObjectUploadResponse {
  uploadIntentId: ID
  bucketName: string
  objectPath: string
  mimeType?: string
  sizeBytes: number
  checksumSha256: string
  status: 'uploaded'
  temporaryMetadataOnly: boolean
}

export interface StorageObjectRecordResponse {
  storageObjectRecord: StorageObjectRecord
  canonicalOnly: true
  warnings: string[]
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
