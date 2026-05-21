import type { GeneratedAssetRecord } from './generation'
import type { MediaAssetRecord, ReferenceAssetRecord, SourceClipSequenceItem, SourceClipSequenceRecord } from './media'
import type { ID } from './shared'

export type UploadPurpose =
  | 'source_media'
  | 'reference_media'
  | 'generated_asset'
  | 'processed_media'
  | 'preview'
  | 'export'
  | 'preview_render'
  | 'final_export'
  | 'thumbnail'
  | 'audio_asset'
  | 'profile_asset'
  | 'brand_asset'
  | 'qa_artifact'
  | 'worker_temp'

export type UploadValidationStatus =
  | 'valid'
  | 'too_large'
  | 'unsupported_type'
  | 'missing_file'
  | 'missing_workspace'
  | 'missing_project'
  | 'requires_auth'
  | 'blocked'

export type UploadRuntimeMode = 'mock' | 'supabase_frontend' | 'backend_required'

export type UploadStorageOperationStatus =
  | 'not_configured'
  | 'ready'
  | 'uploaded'
  | 'signed_url_ready'
  | 'public_url_ready'
  | 'blocked'
  | 'error'

export type UploadNextStep =
  | 'configure_supabase_env'
  | 'sign_in_required'
  | 'fix_upload_input'
  | 'ready_to_upload'
  | 'backend_signed_upload_required'
  | 'mock_ready'
  | 'error'

export interface UploadFileLike {
  name: string
  type?: string
  size?: number
}

export interface UploadValidationContext {
  workspaceId?: ID
  projectId?: ID
  userId?: ID
  requiresAuth?: boolean
}

export interface UploadValidationResult {
  ok: boolean
  status: UploadValidationStatus
  maxBytes: number
  fileSizeBytes?: number
  mimeType?: string
  extension?: string
  warnings: string[]
  message: string
}

export interface UploadPlan {
  id: string
  workspaceId: string
  projectId?: string
  purpose: UploadPurpose
  bucketName: string
  objectPath: string
  fileName: string
  mimeType: string
  fileSizeBytes: number
  requiresAuth: boolean
  createsMediaAsset: boolean
  mockOnly?: boolean
  uploadedOrder?: number
}

export interface CreateUploadPlanInput extends UploadValidationContext {
  file: UploadFileLike
  purpose: UploadPurpose
  assetId?: ID
  uploadedOrder?: number
}

export interface UploadPlanResult {
  ok: boolean
  mode: UploadRuntimeMode
  validation: UploadValidationResult
  uploadPlan?: UploadPlan
  nextStep: UploadNextStep
  message: string
  warnings: string[]
}

export interface StorageClientStatus {
  configured: boolean
  mode: UploadRuntimeMode
  status: UploadStorageOperationStatus
  missingEnvKeys: string[]
  message: string
  warnings: string[]
}

export interface StorageOperationResult {
  ok: boolean
  mode: UploadRuntimeMode
  status: UploadStorageOperationStatus
  bucketName?: string
  objectPath?: string
  publicUrl?: string
  signedUrl?: string
  expiresAt?: string
  message: string
  warnings: string[]
}

export interface MediaAssetStorageRecordResult {
  ok: boolean
  mode: UploadRuntimeMode
  mediaAssetRecord?: MediaAssetRecord
  referenceAssetRecord?: ReferenceAssetRecord
  generatedAssetRecord?: GeneratedAssetRecord
  audioAssetRecord?: MediaAssetRecord
  thumbnailAssetRecord?: MediaAssetRecord
  message: string
  warnings: string[]
}

export interface SourceUploadFlowItem {
  uploadPlan: UploadPlan
  uploadedOrder?: number
  userNotes?: string
  isImportant?: boolean
  isOptional?: boolean
}

export interface SourceUploadOrderSummary {
  ok: boolean
  orderedUploadPlanIds: ID[]
  missingOrderIds: ID[]
  duplicateOrders: number[]
  warnings: string[]
  message: string
}

export interface SourceUploadFlowResult {
  ok: boolean
  sourceSequenceRecord?: SourceClipSequenceRecord
  sourceSequenceItems: SourceClipSequenceItem[]
  mediaAssetRecords: MediaAssetRecord[]
  uploadOrderSummary: SourceUploadOrderSummary
  nextStep: UploadNextStep
  message: string
  warnings: string[]
}
