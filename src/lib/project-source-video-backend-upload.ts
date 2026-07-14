import { getSupabaseClient } from '../backend/supabase/supabase-client'
import type {
  ProjectSourceVideoBackendUploadConfig,
  ProjectSourceVideoBackendUploadResult,
} from '../types/project-source-video'
import { uploadFileToTemporaryObjectTarget } from './temporary-object-upload-client'
import type { TemporaryUploadProtocol } from '../types/large-media'

interface UploadEnvelope<TData> {
  ok?: boolean
  data?: TData
  warnings?: string[]
  error?: {
    code?: string
    message?: string
  }
}

interface UploadIntentView {
  id: string
  targetBucket: string
  targetPath: string
}

interface UploadTargetView {
  uploadMethod?: 'PUT' | 'POST'
  uploadUrl: string
  uploadHeaders: Record<string, string>
  uploadProtocol?: TemporaryUploadProtocol
  supportsResume?: boolean
  recommendedChunkSizeBytes?: number
}

interface CreateUploadIntentData {
  uploadIntent: UploadIntentView
  uploadTarget: UploadTargetView
}

interface FinalizeUploadIntentData {
  storageObjectRecord: {
    id: string
    bucketName: string
    objectPath: string
    sizeBytes?: number
    checksumSha256?: string
  }
  mediaAsset?: {
    id: string
  }
}

export interface ProjectSourceVideoBackendUploadInput {
  apiBaseUrl: string
  editSessionId: string
  file: File
  projectId: string
  workspaceId: string
  fetchImpl?: typeof fetch
  getAccessToken?: () => Promise<string | undefined>
}

const DEFAULT_WORKSPACE_ID = 'mock-workspace'

function envValue(env: Record<string, string | undefined>, key: string): string | undefined {
  const value = env[key]?.trim()
  return value ? value : undefined
}

export function createProjectSourceVideoBackendUploadConfig(
  env: Record<string, string | undefined>,
): ProjectSourceVideoBackendUploadConfig {
  const apiBaseUrl = envValue(env, 'VITE_REEDITPRO_API_BASE_URL') ?? envValue(env, 'VITE_API_BASE_URL')
  const uploadEnabled = envValue(env, 'VITE_REEDITPRO_SOURCE_VIDEO_BACKEND_UPLOAD') === 'true'
  const workspaceId = envValue(env, 'VITE_REEDITPRO_INTERNAL_TEST_WORKSPACE_ID') ?? DEFAULT_WORKSPACE_ID

  if (!apiBaseUrl) {
    return {
      available: false,
      workspaceId,
      mode: 'unavailable',
      message: 'Backend upload is not configured; Brief can still use browser-local video preview.',
      warnings: ['Set VITE_REEDITPRO_API_BASE_URL and VITE_REEDITPRO_SOURCE_VIDEO_BACKEND_UPLOAD=true for internal backend-local upload testing.'],
    }
  }

  if (!uploadEnabled) {
    return {
      available: false,
      apiBaseUrl,
      workspaceId,
      mode: 'unavailable',
      message: 'Backend upload is configured but disabled by the internal upload gate.',
      warnings: ['Set VITE_REEDITPRO_SOURCE_VIDEO_BACKEND_UPLOAD=true only for explicit internal testing.'],
    }
  }

  return {
    available: true,
    apiBaseUrl,
    workspaceId,
    mode: 'mock_backend_local',
    message: 'Backend-local source upload is available for internal testing.',
    warnings: [
      'Uploads use the backend upload-intent flow and canonical bucket/object metadata.',
      'This does not start media processing, workers, providers, rendering, credits, external beta, or production use.',
    ],
  }
}

async function getSupabaseAccessToken(): Promise<string | undefined> {
  const client = getSupabaseClient()
  if (!client) return undefined
  const { data } = await client.auth.getSession()
  return data.session?.access_token
}

function joinUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

function createIdempotencyKey(prefix: string): string {
  return `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 10)}`
}

function createHeaders(input: Record<string, string | undefined>): Headers {
  const headers = new Headers()
  for (const [key, value] of Object.entries(input)) {
    if (value) headers.set(key, value)
  }
  return headers
}

async function parseEnvelope<TData>(response: Response): Promise<UploadEnvelope<TData>> {
  const payload = await response.json().catch(() => undefined)
  if (!payload || typeof payload !== 'object') {
    return {
      ok: false,
      error: {
        code: 'UPLOAD_BAD_RESPONSE',
        message: 'Upload backend returned a non-JSON response.',
      },
    }
  }
  return payload as UploadEnvelope<TData>
}

function assertOk<TData>(envelope: UploadEnvelope<TData>, fallback: string): TData {
  if (!envelope.ok || !envelope.data) {
    throw new Error(envelope.error?.message ?? fallback)
  }
  return envelope.data
}

export async function uploadProjectSourceVideoToBackend(
  input: ProjectSourceVideoBackendUploadInput,
): Promise<ProjectSourceVideoBackendUploadResult> {
  const fetchImpl = input.fetchImpl ?? fetch
  const accessToken = await (input.getAccessToken ?? getSupabaseAccessToken)()
  const createIdempotencyKeyValue = createIdempotencyKey('source-video-upload-intent')
  const finalizeIdempotencyKeyValue = createIdempotencyKey('source-video-upload-finalize')
  const mimeType = sourceVideoMimeType(input.file.type, input.file.name)

  const createResponse = await fetchImpl(joinUrl(input.apiBaseUrl, `/v1/projects/${encodeURIComponent(input.projectId)}/upload-intents`), {
    method: 'POST',
    headers: createHeaders({
      'Content-Type': 'application/json',
      'idempotency-key': createIdempotencyKeyValue,
      authorization: accessToken ? `Bearer ${accessToken}` : undefined,
    }),
    body: JSON.stringify({
      workspaceId: input.workspaceId,
      chatSessionId: input.editSessionId,
      uploadPurpose: 'source_media',
      originalFileName: input.file.name,
      mimeType,
      expectedSizeBytes: input.file.size,
    }),
  })
  const created = assertOk(
    await parseEnvelope<CreateUploadIntentData>(createResponse),
    'Upload intent creation failed.',
  )

  await uploadFileToTemporaryObjectTarget({
    apiBaseUrl: input.apiBaseUrl,
    authorization: accessToken ? `Bearer ${accessToken}` : undefined,
    fetchImpl,
    file: input.file,
    mimeType,
    target: {
      ...created.uploadTarget,
      uploadMethod: created.uploadTarget.uploadMethod ?? 'PUT',
    },
  })

  const finalizeResponse = await fetchImpl(joinUrl(input.apiBaseUrl, `/v1/upload-intents/${encodeURIComponent(created.uploadIntent.id)}/finalize`), {
    method: 'POST',
    headers: createHeaders({
      'Content-Type': 'application/json',
      'idempotency-key': finalizeIdempotencyKeyValue,
      authorization: accessToken ? `Bearer ${accessToken}` : undefined,
    }),
    body: JSON.stringify({
      workspaceId: input.workspaceId,
      sizeBytes: input.file.size,
    }),
  })
  const finalizedEnvelope = await parseEnvelope<FinalizeUploadIntentData>(finalizeResponse)
  const finalized = assertOk(finalizedEnvelope, 'Upload finalization failed.')
  const warnings = [
    ...(finalizedEnvelope.warnings ?? []),
    'Backend-local upload completed without media processing, provider calls, workers, renders, credits, Supabase writes, or GCS writes.',
  ]

  return {
    status: 'uploaded',
    uploadIntentId: created.uploadIntent.id,
    storageObjectRecordId: finalized.storageObjectRecord.id,
    mediaAssetId: finalized.mediaAsset?.id,
    bucketName: finalized.storageObjectRecord.bucketName,
    objectPath: finalized.storageObjectRecord.objectPath,
    fileName: input.file.name,
    mimeType,
    sizeBytes: finalized.storageObjectRecord.sizeBytes ?? input.file.size,
    checksumSha256: finalized.storageObjectRecord.checksumSha256,
    uploadedAt: new Date().toISOString(),
    backendLocalUploadMade: true,
    browserFileBytesSent: true,
    fileBytesReadByBackend: true,
    storageWriteMade: true,
    supabaseWriteMade: false,
    gcsWriteMade: false,
    mediaProcessingStarted: false,
    workerJobCreated: false,
    providerCallMade: false,
    renderJobCreated: false,
    exportJobCreated: false,
    creditReservedOrSpent: false,
    productReady: false,
    warnings,
  }
}

function sourceVideoMimeType(declaredMimeType: string, fileName: string): string {
  const normalized = declaredMimeType.trim().toLowerCase()
  if (normalized === 'video/mov') return 'video/quicktime'
  if (normalized === 'video/mxf' || normalized === 'application/x-mxf') return 'application/mxf'
  if (normalized === 'video/mkv' || normalized === 'application/x-matroska') return 'video/x-matroska'
  if (normalized === 'video/avi' || normalized === 'video/msvideo' || normalized === 'video/vnd.avi') return 'video/x-msvideo'
  if (normalized === 'video/x-mpeg2ts' || normalized === 'video/vnd.dlna.mpeg-tts') return 'video/mp2t'
  if (normalized && normalized !== 'application/octet-stream') return normalized

  const extension = fileName.split('.').pop()?.toLowerCase()
  if (extension === 'avi') return 'video/x-msvideo'
  if (extension === 'm2ts' || extension === 'mts' || extension === 'ts') return 'video/mp2t'
  if (extension === 'm4v') return 'video/x-m4v'
  if (extension === 'mkv') return 'video/x-matroska'
  if (extension === 'mov') return 'video/quicktime'
  if (extension === 'mxf') return 'application/mxf'
  if (extension === 'webm') return 'video/webm'
  return 'video/mp4'
}
