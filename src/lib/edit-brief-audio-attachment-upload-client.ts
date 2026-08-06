import {
  getBackendApiBaseUrl,
  getBackendRuntimeStatus,
} from '../backend/api/backend-runtime-config'
import {
  getReeditProApiAuthorizationHeaders,
  type ReeditProApiAuthorizationHeaders,
} from '../backend/api/frontend-api-client'
import type { TemporaryUploadProtocol } from '../types/large-media'
import {
  finalizeUploadedSource,
  type UploadedSourceFinalizationProgress,
} from './large-media-finalization-client'
import { resolveReceiverSafeFetch } from './receiver-safe-fetch'
import {
  uploadFileToTemporaryObjectTarget,
  type TemporaryObjectUploadProgress,
} from './temporary-object-upload-client'

export const EDIT_BRIEF_AUDIO_ATTACHMENT_MAX_BYTES = 64 * 1024 * 1024

const EDIT_BRIEF_AUDIO_MIME_TYPES = new Set([
  'audio/aac',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
])

interface ApiEnvelope<TData> {
  ok?: boolean
  data?: TData
  warnings?: string[]
  error?: {
    code?: string
    message?: string
  }
}

interface UploadIntentData {
  uploadIntent: {
    id: string
  }
  uploadTarget: {
    uploadMethod?: 'PUT' | 'POST'
    uploadUrl: string
    uploadHeaders?: Record<string, string>
    uploadProtocol?: TemporaryUploadProtocol
    supportsResume?: boolean
    recommendedChunkSizeBytes?: number
  }
}

interface FinalizedAudioUploadData {
  storageObjectRecord: {
    id: string
    sizeBytes?: number
    checksumSha256?: string
  }
  mediaAsset: {
    id: string
    fileName: string
    mimeType: string
    sourceMetadata?: {
      probeStatus?: string
      durationSeconds?: number
      hasAudio?: boolean
      hasVideo?: boolean
    }
  }
}

export interface EditBriefAudioAttachmentUploadResult {
  mediaAssetId: string
  storageObjectRecordId: string
  fileName: string
  mimeType: string
  durationSeconds?: number
  sizeBytes: number
  checksumSha256?: string
  warnings: string[]
}

export type EditBriefAudioAttachmentUploadStage =
  | 'preparing'
  | 'uploading'
  | 'finalizing'

export function validateEditBriefAudioAttachmentFile(file: File): {
  ok: true
  mimeType: string
} | {
  ok: false
  message: string
} {
  if (!Number.isSafeInteger(file.size) || file.size <= 0) {
    return { ok: false, message: 'Choose a non-empty audio file.' }
  }
  if (file.size > EDIT_BRIEF_AUDIO_ATTACHMENT_MAX_BYTES) {
    return { ok: false, message: 'Audio attachments are limited to 64 MiB.' }
  }
  const mimeType = editBriefAudioMimeType(file.type, file.name)
  if (!mimeType || !EDIT_BRIEF_AUDIO_MIME_TYPES.has(mimeType)) {
    return { ok: false, message: 'Choose a WAV, MP3, or AAC audio file.' }
  }
  return { ok: true, mimeType }
}

export async function uploadEditBriefAudioAttachment(input: {
  editSessionId: string
  file: File
  projectId: string
  workspaceId: string
  apiBaseUrl?: string
  fetchImpl?: typeof fetch
  getAuthorizationHeaders?: () => Promise<ReeditProApiAuthorizationHeaders>
  onProgress?: (
    progress: TemporaryObjectUploadProgress | UploadedSourceFinalizationProgress,
  ) => void
  onStageChange?: (stage: EditBriefAudioAttachmentUploadStage) => void
}): Promise<EditBriefAudioAttachmentUploadResult> {
  const validation = validateEditBriefAudioAttachmentFile(input.file)
  if (!validation.ok) throw new Error(validation.message)
  const runtime = getBackendRuntimeStatus()
  const apiBaseUrl = input.apiBaseUrl ?? getBackendApiBaseUrl()
  if (runtime.mockOnly || runtime.mode === 'mock' || !apiBaseUrl) {
    throw new Error('Private Edit Brief audio upload requires the reviewed signed-in backend.')
  }
  const fetchImpl = resolveReceiverSafeFetch(input.fetchImpl)
  const authorization = await (
    input.getAuthorizationHeaders ?? getReeditProApiAuthorizationHeaders
  )()
  const attemptId = requireSecureAttemptId()

  input.onStageChange?.('preparing')
  const created = await postJson<UploadIntentData>({
    apiBaseUrl,
    path: `/v1/projects/${encodeURIComponent(input.projectId)}/upload-intents`,
    body: {
      workspaceId: input.workspaceId,
      chatSessionId: input.editSessionId,
      uploadPurpose: 'reference_media',
      originalFileName: input.file.name,
      mimeType: validation.mimeType,
      expectedSizeBytes: input.file.size,
    },
    idempotencyKey: `edit-brief-audio-intent:${attemptId}`,
    authorization,
    fetchImpl,
  })

  input.onStageChange?.('uploading')
  await uploadFileToTemporaryObjectTarget({
    apiBaseUrl,
    authorization: authorization.authorization,
    reeditProUserAuthorization: authorization.reeditProUserAuthorization,
    file: input.file,
    mimeType: validation.mimeType,
    target: {
      ...created.data.uploadTarget,
      uploadMethod: created.data.uploadTarget.uploadMethod ?? 'PUT',
    },
    fetchImpl,
    onProgress: input.onProgress,
  })

  input.onStageChange?.('finalizing')
  const finalization = await finalizeUploadedSource<FinalizedAudioUploadData>({
    apiBaseUrl,
    uploadIntentId: created.data.uploadIntent.id,
    workspaceId: input.workspaceId,
    sizeBytes: input.file.size,
    uploadProtocol: created.data.uploadTarget.uploadProtocol,
    supportsResume: created.data.uploadTarget.supportsResume,
    authorization: authorization.authorization,
    reeditProUserAuthorization: authorization.reeditProUserAuthorization,
    finalizeIdempotencyKey: `edit-brief-audio-finalize:${created.data.uploadIntent.id}`,
    finalizationJobIdempotencyKey:
      `edit-brief-audio-finalization-job:${created.data.uploadIntent.id}`,
    fetchImpl,
    onProgress: input.onProgress,
  })
  const finalized = finalization.finalized
  const metadata = finalized.mediaAsset.sourceMetadata
  if (
    finalized.mediaAsset.id.length === 0
    || finalized.storageObjectRecord.id.length === 0
    || finalized.mediaAsset.mimeType !== validation.mimeType
    || metadata?.probeStatus !== 'probed'
    || metadata.hasAudio !== true
    || metadata.hasVideo !== false
    || !Number.isFinite(metadata.durationSeconds)
    || (metadata.durationSeconds ?? 0) <= 0
  ) {
    throw new Error(
      'The private upload finalized, but it did not verify as an audio-only attachment.',
    )
  }
  return {
    mediaAssetId: finalized.mediaAsset.id,
    storageObjectRecordId: finalized.storageObjectRecord.id,
    fileName: finalized.mediaAsset.fileName,
    mimeType: finalized.mediaAsset.mimeType,
    durationSeconds: metadata.durationSeconds,
    sizeBytes: finalized.storageObjectRecord.sizeBytes ?? input.file.size,
    checksumSha256: finalized.storageObjectRecord.checksumSha256,
    warnings: [...created.warnings, ...finalization.warnings],
  }
}

async function postJson<TData>(input: {
  apiBaseUrl: string
  path: string
  body: Record<string, unknown>
  idempotencyKey: string
  authorization: ReeditProApiAuthorizationHeaders
  fetchImpl: typeof fetch
}): Promise<{ data: TData; warnings: string[] }> {
  const headers = new Headers({
    accept: 'application/json',
    'content-type': 'application/json',
    'idempotency-key': input.idempotencyKey,
  })
  if (input.authorization.authorization) {
    headers.set('authorization', input.authorization.authorization)
  }
  if (input.authorization.reeditProUserAuthorization) {
    headers.set(
      'x-reeditpro-user-authorization',
      input.authorization.reeditProUserAuthorization,
    )
  }
  const response = await input.fetchImpl(joinUrl(input.apiBaseUrl, input.path), {
    method: 'POST',
    credentials: 'omit',
    headers,
    body: JSON.stringify(input.body),
  })
  const payload = await response.json().catch(() => undefined) as
    | ApiEnvelope<TData>
    | undefined
  if (!response.ok || payload?.ok !== true || !payload.data) {
    throw new Error(payload?.error?.message ?? 'Private audio upload request failed.')
  }
  return { data: payload.data, warnings: payload.warnings ?? [] }
}

function editBriefAudioMimeType(
  declaredMimeType: string,
  fileName: string,
): string | undefined {
  const normalized = declaredMimeType.trim().toLocaleLowerCase()
  if (normalized === 'audio/mp3') return 'audio/mpeg'
  if (EDIT_BRIEF_AUDIO_MIME_TYPES.has(normalized)) return normalized
  const extension = fileName.trim().toLocaleLowerCase().match(/\.([a-z0-9]+)$/)?.[1]
  if (extension === 'wav') return 'audio/wav'
  if (extension === 'mp3') return 'audio/mpeg'
  if (extension === 'aac') return 'audio/aac'
  return undefined
}

function requireSecureAttemptId(): string {
  const randomUUID = globalThis.crypto?.randomUUID
  if (typeof randomUUID !== 'function') {
    throw new Error('Secure browser randomness is required to attach private audio.')
  }
  return randomUUID.call(globalThis.crypto)
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}
