import type {
  CreateUploadPlanInput,
  UploadFileLike,
  UploadPlan,
  UploadPlanResult,
  UploadPurpose,
  UploadValidationContext,
} from '../../types/upload'
import { getSupabaseClientStatus } from '../supabase/supabase-client'
import {
  getStorageBucketForUploadPurpose,
  getStorageBucketWarningsForUploadPurpose,
  uploadPurposePrefersBackendSignedUpload,
} from './storage-buckets'
import { buildStoragePathForUploadPurpose, sanitizeStorageFileName } from './storage-path-builder'
import { validateUploadFile } from './upload-validation-service'

export function createUploadPlan(input: CreateUploadPlanInput): UploadPlanResult {
  const validation = validateUploadFile(input.file, input.purpose, input)
  const configured = getSupabaseClientStatus().configured
  const bucketWarnings = getStorageBucketWarningsForUploadPurpose(input.purpose)
  const warnings = [
    ...validation.warnings,
    ...bucketWarnings,
    ...(configured ? [] : ['Supabase is not configured; upload plan is mock-only.']),
  ]

  if (!validation.ok || !input.workspaceId) {
    return {
      ok: false,
      mode: configured ? 'supabase_frontend' : 'mock',
      validation,
      nextStep: validation.status === 'requires_auth'
        ? 'sign_in_required'
        : validation.status === 'missing_workspace'
          ? 'fix_upload_input'
          : validation.status === 'missing_project'
            ? 'fix_upload_input'
            : 'fix_upload_input',
      message: validation.message,
      warnings,
    }
  }

  const fileName = sanitizeStorageFileName(input.file.name)
  const id = input.assetId ?? createStableUploadPlanId(input.file, input.purpose)
  const bucketName = getStorageBucketForUploadPurpose(input.purpose)
  const objectPath = buildStoragePathForUploadPurpose(input.purpose, {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    assetId: id,
    fileName,
    userId: input.userId,
  })

  const uploadPlan: UploadPlan = {
    id,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    purpose: input.purpose,
    bucketName,
    objectPath,
    fileName,
    mimeType: validation.mimeType ?? input.file.type ?? 'application/octet-stream',
    fileSizeBytes: validation.fileSizeBytes ?? input.file.size ?? 0,
    requiresAuth: input.requiresAuth !== false,
    createsMediaAsset: shouldCreateMediaAsset(input.purpose),
    mockOnly: !configured,
    uploadedOrder: input.uploadedOrder,
  }

  const backendPreferred = uploadPurposePrefersBackendSignedUpload(input.purpose)

  return {
    ok: true,
    mode: configured ? 'supabase_frontend' : 'mock',
    validation,
    uploadPlan,
    nextStep: configured && backendPreferred ? 'backend_signed_upload_required' : configured ? 'ready_to_upload' : 'mock_ready',
    message: configured
      ? 'Upload plan is ready for an explicit Supabase Storage upload call.'
      : 'Upload plan is mock-ready; no upload will run until Supabase is configured and the app calls the upload helper.',
    warnings,
  }
}

export function createSourceMediaUploadPlan(
  input: Omit<CreateUploadPlanInput, 'purpose'>,
): UploadPlanResult {
  return createUploadPlan({ ...input, purpose: 'source_media' })
}

export function createReferenceMediaUploadPlan(
  input: Omit<CreateUploadPlanInput, 'purpose'>,
): UploadPlanResult {
  return createUploadPlan({ ...input, purpose: 'reference_media' })
}

export function createGeneratedAssetUploadPlan(
  input: Omit<CreateUploadPlanInput, 'purpose'>,
): UploadPlanResult {
  return createUploadPlan({ ...input, purpose: 'generated_asset' })
}

export function createPreviewRenderUploadPlan(
  input: Omit<CreateUploadPlanInput, 'purpose'>,
): UploadPlanResult {
  return createUploadPlan({ ...input, purpose: 'preview_render' })
}

export function createFinalExportUploadPlan(
  input: Omit<CreateUploadPlanInput, 'purpose'>,
): UploadPlanResult {
  return createUploadPlan({ ...input, purpose: 'final_export' })
}

export function createAudioAssetUploadPlan(
  input: Omit<CreateUploadPlanInput, 'purpose'>,
): UploadPlanResult {
  return createUploadPlan({ ...input, purpose: 'audio_asset' })
}

export function createProfileAssetUploadPlan(
  input: Omit<CreateUploadPlanInput, 'purpose' | 'projectId'> & UploadValidationContext,
): UploadPlanResult {
  return createUploadPlan({ ...input, purpose: 'profile_asset' })
}

export function createBrandAssetUploadPlan(
  input: Omit<CreateUploadPlanInput, 'purpose' | 'projectId'> & UploadValidationContext,
): UploadPlanResult {
  return createUploadPlan({ ...input, purpose: 'brand_asset' })
}

export function createThumbnailUploadPlan(
  input: Omit<CreateUploadPlanInput, 'purpose'>,
): UploadPlanResult {
  return createUploadPlan({ ...input, purpose: 'thumbnail' })
}

function shouldCreateMediaAsset(purpose: UploadPurpose): boolean {
  return purpose !== 'profile_asset' && purpose !== 'brand_asset'
}

function createStableUploadPlanId(file: UploadFileLike, purpose: UploadPurpose): string {
  const cleanName = sanitizeStorageFileName(file.name).replace(/\.[^.]+$/, '')
  const size = typeof file.size === 'number' ? file.size : 0
  return `mock-${purpose}-${cleanName || 'file'}-${size}`
}
