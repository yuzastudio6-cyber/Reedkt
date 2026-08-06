import {
  uploadFileToTemporaryTarget,
  type BrowserTemporaryUploadProgress,
} from './resumable-file-upload'
import {
  openEditReferenceMediaUploadRecovery,
  type EditReferenceMediaUploadRecoveryStorage,
  type EditReferenceMediaUploadRecoverySummary,
} from './edit-reference-media-upload-recovery'
import { getSupabaseClient } from '../backend/supabase/supabase-client'

interface ApiSuccess<T> {
  ok: true
  data: T
  warnings?: string[]
}

interface ApiFailure {
  error?: { code?: string; message?: string }
}

interface UploadIntentData {
  uploadIntent: { id: string }
  uploadTarget: {
    uploadMethod: 'PUT'
    uploadProtocol?: 'single_put' | 'resumable_content_range_v1' | 'managed_segmented_content_range_v1'
    uploadUrl?: string
    uploadHeaders?: Record<string, string>
    uploadStatusUrl?: string
    recommendedChunkSizeBytes?: number
    retryFromVerifiedOffset?: boolean
  }
}

interface FinalizeUploadData {
  storageObjectRecord: {
    id: string
    mimeType?: string
    sizeBytes?: number
    checksumSha256?: string
  }
  mediaAsset: {
    id: string
    mimeType: string
    fileName: string
  }
}

export interface EditReferenceMediaUploadResult {
  ok: boolean
  storageObjectRecordId?: string
  mediaAssetId?: string
  fileName?: string
  mimeType?: string
  sizeBytes?: number
  checksumSha256?: string
  recovery?: EditReferenceMediaUploadRecoverySummary
  warnings: string[]
  message: string
}

export async function uploadEditReferenceMedia(input: {
  editReferenceId: string
  file: File
  studySessionId: string
  workspaceId: string
  configuredBaseUrl?: string
  fetchImpl?: typeof fetch
  getAccessToken?: () => Promise<string | undefined>
  recoveryStorage?: EditReferenceMediaUploadRecoveryStorage
  onProgress?: (progress: BrowserTemporaryUploadProgress) => void
  onStageChange?: (stage: 'preparing' | 'uploading' | 'finalizing') => void
}): Promise<EditReferenceMediaUploadResult> {
  const baseUrl = (input.configuredBaseUrl
    ?? import.meta.env.VITE_REEDITPRO_EDIT_REFERENCE_API_BASE_URL as string | undefined
    ?? import.meta.env.VITE_REEDITPRO_API_BASE_URL as string | undefined
    ?? import.meta.env.VITE_API_BASE_URL as string | undefined)
    ?.trim()
    .replace(/\/$/, '')
  if (!baseUrl) return failure('The private media backend is not configured for this browser runtime.')
  const mimeType = resolveReferenceVideoMimeType(input.file)
  if (!mimeType) return failure('Choose an MP4, MOV, or WebM reference video.')
  const fetchImpl = input.fetchImpl ?? fetch
  const accessToken = await (input.getAccessToken ?? getSupabaseAccessToken)()
  const authorization = accessToken ? `Bearer ${accessToken}` : undefined

  input.onStageChange?.('preparing')
  const recovery = await openEditReferenceMediaUploadRecovery({
    workspaceId: input.workspaceId,
    editReferenceId: input.editReferenceId,
    studySessionId: input.studySessionId,
    file: input.file,
    ...(input.recoveryStorage ? { storage: input.recoveryStorage } : {}),
  }).catch(() => undefined)
  if (!recovery) {
    return failure('ReEditPro could not prepare a safe upload recovery record. Choose the file and try again.')
  }
  if (
    recovery.descriptor.stage === 'finalized'
    && recovery.descriptor.storageObjectRecordId
    && recovery.descriptor.mediaAssetId
  ) {
    return {
      ok: true,
      storageObjectRecordId: recovery.descriptor.storageObjectRecordId,
      mediaAssetId: recovery.descriptor.mediaAssetId,
      fileName: input.file.name,
      mimeType,
      sizeBytes: input.file.size,
      recovery: recovery.summary(),
      warnings: [],
      message: 'Recovered the verified private upload. ReEditPro will finish attaching it to this study.',
    }
  }
  const create = await jsonRequest<UploadIntentData>(
    `${baseUrl}/v1/edit-references/${encodeURIComponent(input.editReferenceId)}/upload-intents`,
    {
      method: 'POST',
      headers: mutationHeaders(recovery.descriptor.idempotencyKey, authorization),
      body: JSON.stringify({
        workspaceId: input.workspaceId,
        chatSessionId: input.studySessionId,
        uploadPurpose: 'reference_media',
        originalFileName: input.file.name,
        mimeType,
        expectedSizeBytes: input.file.size,
      }),
    },
    fetchImpl,
  )
  if (!create.ok) return failure(create.message, recovery.summary())
  recovery.update({
    stage: 'intent_created',
    uploadIntentId: create.data.uploadIntent.id,
  })
  const uploadUrl = create.data.uploadTarget.uploadUrl
  if (!uploadUrl) return failure('The private upload target did not return a usable destination.', recovery.summary())
  try {
    input.onStageChange?.('uploading')
    recovery.update({ stage: 'uploading' })
    await uploadFileToTemporaryTarget({
      file: input.file,
      target: {
        ...create.data.uploadTarget,
        uploadUrl,
      },
      baseUrl,
      authorization,
      fetchImpl,
      onProgress: (progress) => {
        recovery.update({ stage: 'uploading', acceptedBytes: progress.acceptedBytes })
        input.onProgress?.(progress)
      },
    })
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : 'The reference video could not be stored privately.',
      recovery.summary(),
    )
  }

  input.onStageChange?.('finalizing')
  recovery.update({ stage: 'finalizing', acceptedBytes: input.file.size })
  const finalized = await jsonRequest<FinalizeUploadData>(
    `${baseUrl}/v1/upload-intents/${encodeURIComponent(create.data.uploadIntent.id)}/finalize`,
    {
      method: 'POST',
      headers: mutationHeaders(`reference-upload-finalize-${create.data.uploadIntent.id}`, authorization),
      body: JSON.stringify({ workspaceId: input.workspaceId, sizeBytes: input.file.size }),
    },
    fetchImpl,
  )
  if (!finalized.ok) return failure(finalized.message, recovery.summary())

  recovery.update({
    stage: 'finalized',
    acceptedBytes: input.file.size,
    storageObjectRecordId: finalized.data.storageObjectRecord.id,
    mediaAssetId: finalized.data.mediaAsset.id,
  })

  return {
    ok: true,
    storageObjectRecordId: finalized.data.storageObjectRecord.id,
    mediaAssetId: finalized.data.mediaAsset.id,
    fileName: finalized.data.mediaAsset.fileName,
    mimeType: finalized.data.mediaAsset.mimeType,
    sizeBytes: finalized.data.storageObjectRecord.sizeBytes,
    checksumSha256: finalized.data.storageObjectRecord.checksumSha256,
    recovery: recovery.summary(),
    warnings: [...(create.warnings ?? []), ...(finalized.warnings ?? [])],
    message: 'Reference video stored privately and ready for analysis.',
  }
}

async function jsonRequest<T>(
  url: string,
  init: RequestInit,
  fetchImpl: typeof fetch,
): Promise<{ ok: true; data: T; warnings: string[] } | { ok: false; message: string }> {
  try {
    const response = await fetchImpl(url, init)
    const payload = await response.json().catch(() => undefined) as ApiSuccess<T> | ApiFailure | undefined
    if (!response.ok || !payload || !('ok' in payload) || payload.ok !== true) {
      const message = payload && 'error' in payload ? payload.error?.message : undefined
      return { ok: false, message: message ?? 'Private media request failed.' }
    }
    return { ok: true, data: payload.data, warnings: payload.warnings ?? [] }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Private media backend could not be reached.' }
  }
}

function mutationHeaders(idempotencyKey: string, authorization?: string): Record<string, string> {
  return {
    accept: 'application/json',
    'content-type': 'application/json',
    'idempotency-key': idempotencyKey,
    ...(authorization ? { authorization } : {}),
  }
}

async function getSupabaseAccessToken(): Promise<string | undefined> {
  try {
    const client = getSupabaseClient()
    if (!client) return undefined
    const { data } = await client.auth.getSession()
    return data.session?.access_token
  } catch {
    return undefined
  }
}

function resolveReferenceVideoMimeType(file: File): string | undefined {
  if (file.type.startsWith('video/')) return file.type
  const extension = file.name.trim().toLowerCase().match(/\.([a-z0-9]+)$/)?.[1]
  if (extension === 'mp4' || extension === 'm4v') return 'video/mp4'
  if (extension === 'mov') return 'video/quicktime'
  if (extension === 'webm') return 'video/webm'
  return undefined
}

function failure(
  message: string,
  recovery?: EditReferenceMediaUploadRecoverySummary,
): EditReferenceMediaUploadResult {
  return { ok: false, warnings: [], message, ...(recovery ? { recovery } : {}) }
}
