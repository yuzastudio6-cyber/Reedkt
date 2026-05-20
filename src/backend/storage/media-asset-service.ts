import type {
  GeneratedAssetFormat,
  GeneratedAssetRecord,
  GeneratedAssetType,
  MediaAssetRecord,
  MediaAssetType,
  ReferenceAssetRecord,
} from '../../types'
import type { MediaAssetStorageRecordResult, UploadPlan } from '../../types/upload'

const MOCK_NOW = '2026-05-20T12:00:00.000Z'

export function createMediaAssetRecordFromUploadPlan(
  uploadPlan: UploadPlan,
): MediaAssetStorageRecordResult {
  if (!uploadPlan.projectId) {
    return {
      ok: false,
      mode: uploadPlan.mockOnly ? 'mock' : 'backend_required',
      message: 'A project id is required before creating a project media asset record.',
      warnings: ['Profile and brand uploads can be planned without a project, but media_assets are project-scoped.'],
    }
  }

  const mediaAssetRecord = createMediaRecord(uploadPlan)

  return {
    ok: true,
    mode: uploadPlan.mockOnly ? 'mock' : 'supabase_frontend',
    mediaAssetRecord,
    message: 'Created a mock media asset record from the upload plan. No database insert was attempted.',
    warnings: recordCreationWarnings(uploadPlan),
  }
}

export function createReferenceAssetRecordFromUploadPlan(
  uploadPlan: UploadPlan,
): MediaAssetStorageRecordResult {
  const mediaResult = createMediaAssetRecordFromUploadPlan(uploadPlan)

  if (!mediaResult.ok || !mediaResult.mediaAssetRecord || !uploadPlan.projectId) {
    return mediaResult
  }

  const referenceAssetRecord: ReferenceAssetRecord = {
    id: `${uploadPlan.id}-reference-record`,
    projectId: uploadPlan.projectId,
    mediaAssetId: mediaResult.mediaAssetRecord.id,
    status: 'draft',
    userInstructions: 'Reference upload placeholder. Future Reference DNA analysis is backend/worker work.',
    createdAt: MOCK_NOW,
    updatedAt: MOCK_NOW,
    metadata: {
      mockOnly: true,
      storageBucket: uploadPlan.bucketName,
      storagePath: uploadPlan.objectPath,
      doNotCopyShotForShot: true,
    },
  }

  return {
    ok: true,
    mode: uploadPlan.mockOnly ? 'mock' : 'supabase_frontend',
    mediaAssetRecord: mediaResult.mediaAssetRecord,
    referenceAssetRecord,
    message: 'Created mock media and reference asset records from the upload plan.',
    warnings: recordCreationWarnings(uploadPlan),
  }
}

export function createGeneratedAssetRecordFromStorage(
  uploadPlan: UploadPlan,
): MediaAssetStorageRecordResult {
  if (!uploadPlan.projectId) {
    return missingProjectRecordResult(uploadPlan, 'generated asset')
  }

  const generatedAssetRecord: GeneratedAssetRecord = {
    id: `${uploadPlan.id}-generated-record`,
    workspaceId: uploadPlan.workspaceId,
    projectId: uploadPlan.projectId,
    assetType: mapGeneratedAssetType(uploadPlan),
    assetStatus: 'draft',
    assetFormat: mapGeneratedAssetFormat(uploadPlan),
    signatureSystem: 'none',
    status: 'draft',
    fileName: uploadPlan.fileName,
    displayName: uploadPlan.fileName,
    storageProvider: uploadPlan.mockOnly ? 'local_mock' : 'supabase_storage',
    storageBucket: uploadPlan.bucketName,
    storagePath: uploadPlan.objectPath,
    fileSizeBytes: uploadPlan.fileSizeBytes,
    transparentBackground: false,
    wordLevelTiming: false,
    usableForRender: false,
    qualityNotes: [
      'Generated asset storage record is a placeholder. Provider and worker generation are not run by RP-FIX-07.',
    ],
    createdAt: MOCK_NOW,
    updatedAt: MOCK_NOW,
    metadata: {
      uploadPurpose: uploadPlan.purpose,
      mockOnly: uploadPlan.mockOnly ?? false,
    },
  }

  return {
    ok: true,
    mode: uploadPlan.mockOnly ? 'mock' : 'backend_required',
    generatedAssetRecord,
    message: 'Created a mock generated asset record from storage metadata. No database insert was attempted.',
    warnings: recordCreationWarnings(uploadPlan),
  }
}

export function createAudioAssetRecordFromStorage(
  uploadPlan: UploadPlan,
): MediaAssetStorageRecordResult {
  const result = createMediaAssetRecordFromUploadPlan(uploadPlan)

  if (!result.ok || !result.mediaAssetRecord) return result

  const audioAssetRecord: MediaAssetRecord = {
    ...result.mediaAssetRecord,
    assetType: 'generated_audio',
    metadata: {
      ...result.mediaAssetRecord.metadata,
      audioAssetStoragePlaceholder: true,
      providerExecution: 'not_run',
    },
  }

  return {
    ok: true,
    mode: uploadPlan.mockOnly ? 'mock' : 'backend_required',
    mediaAssetRecord: result.mediaAssetRecord,
    audioAssetRecord,
    message: 'Created a mock audio asset record from storage metadata.',
    warnings: recordCreationWarnings(uploadPlan),
  }
}

export function createThumbnailAssetRecordFromStorage(
  uploadPlan: UploadPlan,
): MediaAssetStorageRecordResult {
  const result = createMediaAssetRecordFromUploadPlan(uploadPlan)

  if (!result.ok || !result.mediaAssetRecord) return result

  const thumbnailAssetRecord: MediaAssetRecord = {
    ...result.mediaAssetRecord,
    assetType: 'source_image',
    metadata: {
      ...result.mediaAssetRecord.metadata,
      thumbnailStoragePlaceholder: true,
    },
  }

  return {
    ok: true,
    mode: uploadPlan.mockOnly ? 'mock' : 'supabase_frontend',
    mediaAssetRecord: result.mediaAssetRecord,
    thumbnailAssetRecord,
    message: 'Created a mock thumbnail media asset record from storage metadata.',
    warnings: recordCreationWarnings(uploadPlan),
  }
}

export function createMediaAssetStorageSummary(result: MediaAssetStorageRecordResult): string {
  if (!result.ok) return result.message
  if (result.mode === 'backend_required') {
    return 'Storage metadata record is mock-ready, but production DB writes should run through backend services.'
  }
  return 'Storage metadata record is mock-ready and no real database write was attempted.'
}

function createMediaRecord(uploadPlan: UploadPlan): MediaAssetRecord {
  return {
    id: `${uploadPlan.id}-media-record`,
    workspaceId: uploadPlan.workspaceId,
    projectId: uploadPlan.projectId,
    assetType: mapMediaAssetType(uploadPlan),
    storageProvider: uploadPlan.mockOnly ? 'local_mock' : 'supabase_storage',
    storagePath: uploadPlan.objectPath,
    fileName: uploadPlan.fileName,
    mimeType: uploadPlan.mimeType,
    byteSize: uploadPlan.fileSizeBytes,
    status: 'draft',
    createdAt: MOCK_NOW,
    updatedAt: MOCK_NOW,
    metadata: {
      uploadPurpose: uploadPlan.purpose,
      storageBucket: uploadPlan.bucketName,
      mockOnly: uploadPlan.mockOnly ?? false,
      noDatabaseWriteAttempted: true,
    },
  }
}

function mapMediaAssetType(uploadPlan: UploadPlan): MediaAssetType {
  if (uploadPlan.purpose === 'preview_render') return 'preview_render'
  if (uploadPlan.purpose === 'final_export') return 'final_export'
  if (uploadPlan.purpose === 'audio_asset') return 'generated_audio'
  if (uploadPlan.purpose === 'thumbnail') return 'source_image'
  if (uploadPlan.purpose === 'generated_asset') return uploadPlan.mimeType.startsWith('audio/')
    ? 'generated_audio'
    : 'generated_overlay'
  if (uploadPlan.purpose === 'reference_media') {
    return uploadPlan.mimeType.startsWith('image/') ? 'reference_image' : 'reference_video'
  }
  if (uploadPlan.mimeType.startsWith('audio/')) return 'source_audio'
  if (uploadPlan.mimeType.startsWith('image/')) return 'source_image'
  return 'source_video'
}

function mapGeneratedAssetType(uploadPlan: UploadPlan): GeneratedAssetType | MediaAssetType {
  if (uploadPlan.mimeType.startsWith('audio/')) return 'sound_effect'
  if (uploadPlan.mimeType.startsWith('video/')) return 'video'
  if (uploadPlan.mimeType.startsWith('image/')) return 'image'
  return 'other'
}

function mapGeneratedAssetFormat(uploadPlan: UploadPlan): GeneratedAssetFormat {
  const extension = uploadPlan.fileName.split('.').at(-1)?.toLowerCase()

  if (
    extension === 'mp4'
    || extension === 'webm'
    || extension === 'mov'
    || extension === 'png'
    || extension === 'jpg'
    || extension === 'webp'
    || extension === 'wav'
    || extension === 'mp3'
  ) {
    return extension
  }

  if (extension === 'jpeg') return 'jpg'
  return 'unknown'
}

function missingProjectRecordResult(
  uploadPlan: UploadPlan,
  label: string,
): MediaAssetStorageRecordResult {
  return {
    ok: false,
    mode: uploadPlan.mockOnly ? 'mock' : 'backend_required',
    message: `A project id is required before creating a ${label} record.`,
    warnings: ['Project-scoped storage records should not be created without a project context.'],
  }
}

function recordCreationWarnings(uploadPlan: UploadPlan): string[] {
  return [
    'RP-FIX-07 creates mock typed records only; it does not insert rows into Supabase.',
    ...(uploadPlan.mockOnly ? ['Supabase is not configured, so this record remains mock-only.'] : []),
    ...(uploadPlan.purpose === 'generated_asset' || uploadPlan.purpose === 'preview_render' || uploadPlan.purpose === 'final_export'
      ? ['Backend workers should create generated/render/export records in production.']
      : []),
  ]
}
