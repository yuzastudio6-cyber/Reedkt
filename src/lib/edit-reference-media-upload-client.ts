import {
  uploadFileToTemporaryTarget,
  type BrowserTemporaryUploadProgress,
} from './resumable-file-upload'
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
  const create = await jsonRequest<UploadIntentData>(
    `${baseUrl}/v1/edit-references/${encodeURIComponent(input.editReferenceId)}/upload-intents`,
    {
      method: 'POST',
      headers: mutationHeaders(`reference-upload-intent-${crypto.randomUUID()}`, authorization),
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
  if (!create.ok) return failure(create.message)
  const uploadUrl = create.data.uploadTarget.uploadUrl
  if (!uploadUrl) return failure('The private upload target did not return a usable destination.')
  try {
    input.onStageChange?.('uploading')
    await uploadFileToTemporaryTarget({
      file: input.file,
      target: {
        ...create.data.uploadTarget,
        uploadUrl,
      },
      baseUrl,
      authorization,
      fetchImpl,
      onProgress: input.onProgress,
    })
  } catch (error) {
    return failure(error instanceof Error ? error.message : 'The reference video could not be stored privately.')
  }

  input.onStageChange?.('finalizing')
  const finalized = await jsonRequest<FinalizeUploadData>(
    `${baseUrl}/v1/upload-intents/${encodeURIComponent(create.data.uploadIntent.id)}/finalize`,
    {
      method: 'POST',
      headers: mutationHeaders(`reference-upload-finalize-${create.data.uploadIntent.id}`, authorization),
      body: JSON.stringify({ workspaceId: input.workspaceId, sizeBytes: input.file.size }),
    },
    fetchImpl,
  )
  if (!finalized.ok) return failure(finalized.message)

  return {
    ok: true,
    storageObjectRecordId: finalized.data.storageObjectRecord.id,
    mediaAssetId: finalized.data.mediaAsset.id,
    fileName: finalized.data.mediaAsset.fileName,
    mimeType: finalized.data.mediaAsset.mimeType,
    sizeBytes: finalized.data.storageObjectRecord.sizeBytes,
    checksumSha256: finalized.data.storageObjectRecord.checksumSha256,
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

function failure(message: string): EditReferenceMediaUploadResult {
  return { ok: false, warnings: [], message }
}
