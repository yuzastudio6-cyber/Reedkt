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
    uploadUrl?: string
    uploadHeaders?: Record<string, string>
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
}): Promise<EditReferenceMediaUploadResult> {
  const baseUrl = (input.configuredBaseUrl
    ?? import.meta.env.VITE_REEDITPRO_EDIT_REFERENCE_API_BASE_URL as string | undefined)
    ?.trim()
    .replace(/\/$/, '')
  if (!baseUrl) return failure('The private media backend is not configured for this browser runtime.')
  if (!input.file.type.startsWith('video/')) return failure('Choose an MP4, MOV, or WebM reference video.')

  const create = await jsonRequest<UploadIntentData>(
    `${baseUrl}/v1/projects/${encodeURIComponent(input.editReferenceId)}/upload-intents`,
    {
      method: 'POST',
      headers: mutationHeaders(`reference-upload-intent-${crypto.randomUUID()}`),
      body: JSON.stringify({
        workspaceId: input.workspaceId,
        chatSessionId: input.studySessionId,
        uploadPurpose: 'reference_media',
        originalFileName: input.file.name,
        mimeType: input.file.type || 'video/mp4',
        expectedSizeBytes: input.file.size,
      }),
    },
  )
  if (!create.ok) return failure(create.message)
  const uploadUrl = create.data.uploadTarget.uploadUrl
  if (!uploadUrl) return failure('The private upload target did not return a usable destination.')
  const uploadResponse = await fetch(uploadUrl.startsWith('http') ? uploadUrl : `${baseUrl}${uploadUrl}`, {
    method: create.data.uploadTarget.uploadMethod,
    headers: {
      'content-type': input.file.type || 'video/mp4',
      ...(create.data.uploadTarget.uploadHeaders ?? {}),
    },
    body: input.file,
  })
  if (!uploadResponse.ok) return failure('The reference video could not be stored privately.')

  const finalized = await jsonRequest<FinalizeUploadData>(
    `${baseUrl}/v1/upload-intents/${encodeURIComponent(create.data.uploadIntent.id)}/finalize`,
    {
      method: 'POST',
      headers: mutationHeaders(`reference-upload-finalize-${create.data.uploadIntent.id}`),
      body: JSON.stringify({ workspaceId: input.workspaceId, sizeBytes: input.file.size }),
    },
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
    message: 'Reference video stored privately and ready for a bounded local study.',
  }
}

async function jsonRequest<T>(
  url: string,
  init: RequestInit,
): Promise<{ ok: true; data: T; warnings: string[] } | { ok: false; message: string }> {
  try {
    const response = await fetch(url, init)
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

function mutationHeaders(idempotencyKey: string): Record<string, string> {
  return {
    accept: 'application/json',
    'content-type': 'application/json',
    'idempotency-key': idempotencyKey,
  }
}

function failure(message: string): EditReferenceMediaUploadResult {
  return { ok: false, warnings: [], message }
}
