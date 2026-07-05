import type { ProjectEditSessionExportAspectRatio } from './project-edit-brief'

export type ProjectSourceVideoInferredAspectRatio = ProjectEditSessionExportAspectRatio

export interface ProjectSourceVideoSafetyFlags {
  localOnly: true
  uploaded: false
  fileBytesReadByBackend: false
  mediaProcessingStarted: false
  workerJobCreated: false
  providerCallMade: false
  renderJobCreated: false
  exportJobCreated: false
  creditReservedOrSpent: false
  supabaseCommandRun: false
  storageWriteMade: false
  mockOnly: true
}

export interface ProjectSourceVideoLocalPreview extends ProjectSourceVideoSafetyFlags {
  id: string
  fileName: string
  objectUrl: string
  mimeType: string
  sizeBytes: number
  durationSeconds?: number
  videoWidth?: number
  videoHeight?: number
  inferredAspectRatio?: ProjectSourceVideoInferredAspectRatio
  metadataLoaded: boolean
  createdAt: string
}

export type ProjectSourceVideoBackendUploadStatus =
  | 'unavailable'
  | 'idle'
  | 'uploading'
  | 'uploaded'
  | 'failed'

export type ProjectSourceVideoLocalEditPreviewStatus =
  | 'unavailable'
  | 'waiting_for_upload'
  | 'idle'
  | 'running'
  | 'preview_ready'
  | 'blocked'
  | 'failed'

export type ProjectSourceVideoPreviewReviewStatus =
  | 'not_reviewed'
  | 'approving'
  | 'approved'
  | 'changes_requested'
  | 'failed'

export type ProjectSourceVideoProfessionalQAStatus = 'passed' | 'blocked'

export type ProjectSourceVideoProfessionalQACheckId =
  | 'source_uploaded'
  | 'approved_snapshot_present'
  | 'credit_reservation_present'
  | 'preview_ready'
  | 'preview_review_approved'
  | 'edit_assembly_ready'
  | 'private_artifact_boundary'

export interface ProjectSourceVideoProfessionalQACheck {
  id: ProjectSourceVideoProfessionalQACheckId
  label: string
  passed: boolean
  blocker: string
}

export type ProjectSourceVideoLocalFinalExportStatus =
  | 'unavailable'
  | 'waiting_for_preview_review'
  | 'idle'
  | 'running'
  | 'final_export_ready'
  | 'blocked'
  | 'failed'

export interface ProjectSourceVideoBackendUploadConfig {
  available: boolean
  apiBaseUrl?: string
  workspaceId: string
  mode: 'mock_backend_local' | 'unavailable'
  message: string
  warnings: string[]
}

export interface ProjectSourceVideoLocalEditPreviewConfig {
  available: boolean
  apiBaseUrl?: string
  workspaceId: string
  mode: 'mock_local_preview_smoke' | 'unavailable'
  message: string
  warnings: string[]
}

export interface ProjectSourceVideoBackendUploadResult {
  status: 'uploaded'
  uploadIntentId: string
  storageObjectRecordId: string
  mediaAssetId?: string
  bucketName: string
  objectPath: string
  fileName: string
  mimeType: string
  sizeBytes: number
  checksumSha256?: string
  uploadedAt: string
  backendLocalUploadMade: true
  browserFileBytesSent: true
  fileBytesReadByBackend: true
  storageWriteMade: true
  supabaseWriteMade: false
  gcsWriteMade: false
  mediaProcessingStarted: false
  workerJobCreated: false
  providerCallMade: false
  renderJobCreated: false
  exportJobCreated: false
  creditReservedOrSpent: false
  productReady: false
  warnings: string[]
}

export type ProjectSourceVideoEditAssemblyMode = 'clean_internal_preview' | 'private_final_export'

export interface ProjectSourceVideoEditAssemblyStep {
  label: string
  summary: string
}

export interface ProjectSourceVideoEditAssemblySummary {
  planId: string
  title: string
  summary: string
  steps: ProjectSourceVideoEditAssemblyStep[]
  sourceDurationSeconds?: number
  sourceAspectRatio?: string
  mode: ProjectSourceVideoEditAssemblyMode
  operationsApplied: string[]
  planStepCount: number
  productReady: false
}

export interface ProjectSourceVideoLocalEditPreviewResult {
  status: 'preview_ready'
  editPlanId: string
  creditEstimateId: string
  approvedPlanSnapshotId: string
  creditApprovalId: string
  creditReservationId: string
  renderJobId: string
  renderId?: string
  sourceStorageObjectRecordId: string
  previewStorageObjectId?: string
  outputBucketName?: string
  outputObjectPath?: string
  durationSeconds?: number
  sizeBytes?: number
  checksumSha256?: string
  editAssembly?: ProjectSourceVideoEditAssemblySummary
  qwenMainBrainLabel: string
  approvedSnapshotCreated: true
  mockCreditApprovalCreated: true
  mockCreditReservationCreated: true
  localPlanApproved: true
  workerJobCreated: true
  mediaProcessingStarted: true
  renderJobCreated: true
  previewOnly: true
  providerCallMade: false
  qwenCallMade: false
  exportJobCreated: false
  supabaseWriteMade: false
  gcsWriteMade: false
  productReady: false
  warnings: string[]
}

export interface ProjectSourceVideoPreviewReviewResult {
  id: string
  renderId: string
  workspaceId: string
  reviewStatus: 'approved' | 'changes_requested'
  notes?: string
  createdAt?: string
  mockOnly?: true
  finalExportStarted: false
  providerCallMade: false
  workerJobCreated: false
  renderJobCreated: false
  creditReservedOrSpent: false
  supabaseWriteMade: false
  gcsWriteMade: false
  productReady: false
  warnings: string[]
}

export interface ProjectSourceVideoProfessionalQAResult {
  id: string
  workspaceId: string
  editPlanId: string
  renderId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  previewReviewId: string
  status: ProjectSourceVideoProfessionalQAStatus
  createdAt: string
  checks: ProjectSourceVideoProfessionalQACheck[]
  blockers: ProjectSourceVideoProfessionalQACheckId[]
  finalExportStarted: false
  publicDeliveryEnabled: false
  providerCallMade: false
  workerJobCreated: false
  renderJobCreated: false
  mediaProcessingStarted: false
  creditReservedOrSpent: false
  supabaseWriteMade: false
  gcsWriteMade: false
  productReady: false
  warnings: string[]
}

export interface ProjectSourceVideoLocalFinalExportResult {
  status: 'final_export_ready'
  editPlanId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  renderJobId: string
  renderId?: string
  sourceStorageObjectRecordId: string
  finalExportStorageObjectId?: string
  qaReportId?: string
  outputBucketName?: string
  outputObjectPath?: string
  durationSeconds?: number
  sizeBytes?: number
  checksumSha256?: string
  editAssembly?: ProjectSourceVideoEditAssemblySummary
  previewReviewId: string
  professionalQA?: ProjectSourceVideoProfessionalQAResult
  finalExportStarted: true
  publicDeliveryEnabled: false
  providerCallMade: false
  qwenCallMade: false
  supabaseWriteMade: false
  gcsWriteMade: false
  productReady: false
  warnings: string[]
}

export interface ProjectSourceVideoMetadataSummary {
  label: string
  durationLabel: string
  dimensionLabel: string
  aspectRatioLabel: string
  boundarySummary: string
}

export interface ProjectSourceVideoMetadataUpdate {
  durationSeconds?: number
  videoWidth?: number
  videoHeight?: number
}

export interface ProjectSourceVideoExportRecommendationMetadata extends Record<string, unknown> {
  sourceVideoFileName: string
  sourceVideoDurationSeconds?: number
  sourceVideoWidth?: number
  sourceVideoHeight?: number
  sourceVideoAspectRatio?: ProjectSourceVideoInferredAspectRatio
  sourceVideoLocalOnly: true
  sourceVideoUploaded: false
  sourceVideoFileBytesReadByBackend: false
  sourceVideoMediaProcessingStarted: false
  sourceVideoFrameRateDefaultedTo30: true
}

export const PROJECT_SOURCE_VIDEO_LOCAL_PREVIEW_SAFETY_FLAGS: ProjectSourceVideoSafetyFlags = {
  localOnly: true,
  uploaded: false,
  fileBytesReadByBackend: false,
  mediaProcessingStarted: false,
  workerJobCreated: false,
  providerCallMade: false,
  renderJobCreated: false,
  exportJobCreated: false,
  creditReservedOrSpent: false,
  supabaseCommandRun: false,
  storageWriteMade: false,
  mockOnly: true,
}

export const REEDITPRO_PROJECT_SOURCE_VIDEO_LOCAL_PREVIEW_RULE =
  'Project source video preview is browser-local in RP-MEDIA-01; the file is not uploaded, processed, or persisted.'

export const REEDITPRO_PROJECT_SOURCE_VIDEO_NO_BACKEND_BYTES_RULE =
  'RP-MEDIA-01 must not read uploaded video bytes in backend/server code and must not run media workers, FFmpeg, FFprobe, render, or credits.'
