import { callReeditProApi, getReeditProApiAuthorizationHeader } from '../backend/api/frontend-api-client'
import { getBackendApiBaseUrl, getBackendRuntimeStatus } from '../backend/api/backend-runtime-config'
import { uploadFileToSupabaseStorage } from '../backend/storage/storage-client-service'
import type { ApprovedEditExecutionUploadedMediaSourceAssetClientInput } from './approved-edit-execution-package-client'
import type { MediaStorageProvider } from '../types/media'
import type { ClipSource } from '../types/reeditpro'
import type {
  CreateUploadPlanInput,
  SourceUploadFlowItem,
  SourceUploadFlowResult,
  StorageOperationResult,
  UploadFileLike,
  UploadPlan,
  UploadPlanResult,
  SourceMediaMetadata,
} from '../types/upload'

export interface PlanSourceUploadsInput {
  files: File[]
  workspaceId: string
  projectId: string
  userId?: string
  startingOrder?: number
}

export interface PlannedSourceUpload {
  file: UploadFileLike
  uploadPlan: UploadPlan
  clip: ClipSource
  storageUpload?: StorageOperationResult
  warnings: string[]
}

export interface PlanSourceUploadsResult {
  ok: boolean
  plannedUploads: PlannedSourceUpload[]
  clips: ClipSource[]
  sourceSequence?: SourceUploadFlowResult
  warnings: string[]
  message: string
}

export function createExecutionSourceMediaAssetsFromClips(
  clips: ClipSource[],
  _projectId: string,
  existingAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[] = [],
): ApprovedEditExecutionUploadedMediaSourceAssetClientInput[] {
  const existingByClipId = new Map<string, ApprovedEditExecutionUploadedMediaSourceAssetClientInput>()
  for (const asset of existingAssets) {
    if (asset.uploadedClipId) existingByClipId.set(asset.uploadedClipId, asset)
    if (asset.sourceSequenceItemId) existingByClipId.set(asset.sourceSequenceItemId, asset)
  }

  return clips.flatMap((clip, index) => {
    const uploadedOrder = clip.uploadedOrder || index + 1
    const previous = existingByClipId.get(clip.id)

    if (!previous) {
      return []
    }

    return {
      ...previous,
      uploadedOrder,
      fileName: clip.fileName || previous.fileName,
      mimeType: previous.mimeType || mimeTypeFromFileName(clip.fileName),
      byteSize: previous.byteSize,
      privateArtifact: true,
      publicUrl: null,
      signedUrl: null,
    }
  })
}

export function createExecutionSourceMediaAssetsFromPlannedUploads(
  plannedUploads: PlannedSourceUpload[],
  uploadResult?: Pick<PlanSourceUploadsResult, 'sourceSequence'>,
): ApprovedEditExecutionUploadedMediaSourceAssetClientInput[] {
  const sourceItemsByUploadPlanId = new Map(
    (uploadResult?.sourceSequence?.sourceSequenceItems ?? []).flatMap((item) => {
      const uploadPlanId = typeof item.metadata?.uploadPlanId === 'string' ? item.metadata.uploadPlanId : undefined
      return uploadPlanId ? [[uploadPlanId, item] as const] : []
    }),
  )
  const mediaAssetsById = new Map(
    (uploadResult?.sourceSequence?.mediaAssetRecords ?? []).map((record) => [record.id, record] as const),
  )

  return plannedUploads.flatMap(({ uploadPlan, storageUpload }) => {
    if (storageUpload?.status !== 'uploaded' || uploadPlan.storageProvider === 'local_mock') {
      return []
    }

    const sourceSequenceItem = sourceItemsByUploadPlanId.get(uploadPlan.id)
    const mediaAsset = sourceSequenceItem ? mediaAssetsById.get(sourceSequenceItem.mediaAssetId) : undefined
    const storageProvider = toExecutionSourceStorageProvider(
      mediaAsset?.storageProvider ?? uploadPlan.storageProvider,
    )

    return {
      mediaAssetId: uploadPlan.finalizedMediaAssetId ?? mediaAsset?.id ?? `${uploadPlan.id}-media-record`,
      sourceSequenceItemId: sourceSequenceItem?.id ?? uploadPlan.id,
      uploadedClipId: uploadPlan.id,
      uploadedOrder: sourceSequenceItem?.uploadedOrder ?? uploadPlan.uploadedOrder ?? 1,
      storageProvider,
      storageBucket: mediaAsset?.storageBucket ?? uploadPlan.bucketName,
      storagePath: mediaAsset?.storagePath ?? uploadPlan.objectPath,
      fileName: mediaAsset?.fileName ?? uploadPlan.fileName,
      mimeType: mediaAsset?.mimeType ?? uploadPlan.mimeType,
      byteSize: mediaAsset?.byteSize ?? uploadPlan.fileSizeBytes,
      checksumSha256: normalizeChecksumSha256(mediaAsset?.checksum ?? uploadPlan.checksumSha256),
      sourceMetadata: mediaAsset?.sourceMetadata ?? uploadPlan.sourceMetadata,
      privateArtifact: true,
      publicUrl: null,
      signedUrl: null,
    }
  })
}

function toExecutionSourceStorageProvider(
  storageProvider: string | undefined,
): ApprovedEditExecutionUploadedMediaSourceAssetClientInput['storageProvider'] {
  if (storageProvider === 'local_private') return 'local_private'
  if (storageProvider === 'google_cloud_storage') return 'google_cloud_storage'
  if (storageProvider === 'supabase_storage') return 'supabase_storage'
  return 'supabase_storage'
}

export async function planSourceUploadsForEditor({
  files,
  projectId,
  startingOrder = 1,
  userId,
  workspaceId,
}: PlanSourceUploadsInput): Promise<PlanSourceUploadsResult> {
  const selectedFiles = files.filter(Boolean)
  const plannedUploads: PlannedSourceUpload[] = []
  const warnings: string[] = []

  for (const [index, file] of selectedFiles.entries()) {
    const uploadedOrder = startingOrder + index
    const backendUpload = await planSourceUploadThroughBackendIntent({
      file,
      projectId,
      uploadedOrder,
      userId,
      workspaceId,
    })

    if (backendUpload.attempted) {
      warnings.push(...backendUpload.warnings)
      if (backendUpload.plannedUpload) {
        plannedUploads.push(backendUpload.plannedUpload)
        continue
      }
      if (!e2eLocalPrivateSourceUploadsEnabled()) {
        continue
      }
    }

    const fileLike: UploadFileLike = {
      name: file.name,
      size: file.size,
      type: file.type || mimeTypeFromFileName(file.name),
    }
    const response = await callReeditProApi<CreateUploadPlanInput, UploadPlanResult>(
      'media.uploadPlan.create',
      {
        file: fileLike,
        purpose: 'source_media',
        projectId,
        uploadedOrder,
        userId,
        workspaceId,
      },
      {
        context: { projectId, userId, workspaceId },
      },
    )

    if (!response.ok || !response.data?.ok || !response.data.uploadPlan) {
      warnings.push(
        response.error?.message ??
          response.data?.message ??
          `${file.name} could not be added to the source sequence.`,
      )
      warnings.push(...(response.warnings ?? []), ...(response.data?.warnings ?? []))
      continue
    }

    let uploadPlan = response.data.uploadPlan
    let storageUpload: StorageOperationResult | undefined

    if (shouldUseE2ELocalPrivateSourceUpload(uploadPlan)) {
      uploadPlan = await createE2ELocalPrivateSourceUploadPlan(file, uploadPlan)
      storageUpload = createE2ELocalPrivateSourceStorageUpload(uploadPlan)
    } else {
      storageUpload = await uploadSourceFileIfReady(file, uploadPlan)

      if (!storageUpload && shouldCreateE2ELocalPrivateSourceUpload(uploadPlan)) {
        uploadPlan = await createE2ELocalPrivateSourceUploadPlan(file, uploadPlan)
        storageUpload = createE2ELocalPrivateSourceStorageUpload(uploadPlan)
      }
    }

    if (storageUpload && !storageUpload.ok) {
      warnings.push(`${file.name} could not be uploaded to private source storage.`)
      warnings.push(storageUpload.message, ...storageUpload.warnings)
      continue
    }

    plannedUploads.push({
      file: fileLike,
      uploadPlan,
      clip: clipFromUploadPlan(uploadPlan, uploadedOrder, storageUpload),
      storageUpload,
      warnings: [
        ...response.warnings,
        ...response.data.warnings,
        ...(storageUpload?.warnings ?? []),
      ],
    })
  }

  const uploadItems: SourceUploadFlowItem[] = plannedUploads.map(({ uploadPlan }) => ({
    uploadPlan,
    uploadedOrder: uploadPlan.uploadedOrder,
  }))
  const sourceSequence = uploadItems.length > 0
    ? await createSourceSequence({ projectId, uploadItems, userId, workspaceId })
    : undefined
  const sourceSequenceWarnings = sourceSequence?.warnings ?? []
  const allWarnings = [
    ...warnings,
    ...plannedUploads.flatMap((item) => item.warnings),
    ...sourceSequenceWarnings,
  ]

  const uploadedCount = plannedUploads.filter((item) => item.storageUpload?.status === 'uploaded').length

  return {
    ok: plannedUploads.length === selectedFiles.length && plannedUploads.length > 0 && (sourceSequence?.ok ?? true),
    plannedUploads,
    clips: plannedUploads.map((item) => item.clip),
    sourceSequence,
    warnings: Array.from(new Set(allWarnings)),
    message: plannedUploads.length > 0
      ? uploadedCount > 0
        ? 'Selected source files were uploaded to private storage and added to the source sequence for edit planning.'
        : 'Selected source files were converted into upload plans and a source sequence for edit planning.'
      : 'No selected source files could be planned.',
  }
}

interface BackendSourceUploadInput {
  file: File
  workspaceId: string
  projectId: string
  userId?: string
  uploadedOrder: number
}

interface BackendSourceUploadResult {
  attempted: boolean
  plannedUpload?: PlannedSourceUpload
  warnings: string[]
}

interface BackendApiEnvelope<TData> {
  ok: boolean
  data?: TData
  error?: {
    code: string
    message: string
    details?: unknown
  }
  warnings?: string[]
}

interface BackendUploadIntentData {
  uploadIntent: {
    id: string
    workspaceId: string
    projectId: string
    targetBucket: string
    targetPath: string
    originalFileName: string
    mimeType: string
    expectedSizeBytes?: number
    mockOnly?: boolean
  }
  uploadTarget: {
    uploadMethod: 'PUT' | 'POST'
    uploadUrl: string
    uploadHeaders?: Record<string, string>
    bucketName: string
    objectPath: string
  }
}

interface BackendFinalizedUploadData {
  uploadIntent: BackendUploadIntentData['uploadIntent'] & {
    mediaAssetId?: string
    status: string
    mockOnly?: boolean
  }
  storageObjectRecord: {
    id: string
    bucketName: string
    objectPath: string
    storageProvider?: string
    mimeType?: string
    sizeBytes?: number
    checksumSha256?: string
    mockOnly?: boolean
  }
  mediaAsset: {
    id: string
    workspaceId: string
    projectId: string
    fileName: string
    mimeType: string
    storageBucket: string
    storagePath: string
    storageProvider?: string
    sizeBytes?: number
    checksumSha256?: string
    checksum?: string
    status: string
    mockOnly?: boolean
    sourceMetadata?: SourceMediaMetadata
  }
}

async function planSourceUploadThroughBackendIntent({
  file,
  projectId,
  uploadedOrder,
  workspaceId,
}: BackendSourceUploadInput): Promise<BackendSourceUploadResult> {
  const runtime = getBackendRuntimeStatus()
  const apiBaseUrl = getBackendApiBaseUrl()

  if (runtime.mockOnly || runtime.mode === 'mock' || !apiBaseUrl) {
    return { attempted: false, warnings: [] }
  }

  const mimeType = file.type || mimeTypeFromFileName(file.name)
  const warnings: string[] = []

  try {
    const checksumSha256 = await computeUploadFileSha256(file)
    const uploadIntentResponse = await postBackendJson<BackendUploadIntentData>(
      apiBaseUrl,
      `/v1/projects/${encodeURIComponent(projectId)}/upload-intents`,
      {
        workspaceId,
        uploadPurpose: 'source_media',
        originalFileName: file.name,
        mimeType,
        expectedSizeBytes: file.size,
        checksumSha256,
      },
      `source-upload-intent:${workspaceId}:${projectId}:${uploadedOrder}:${file.name}:${file.size}`,
    )

    warnings.push(...(uploadIntentResponse.warnings ?? []))
    if (!uploadIntentResponse.ok || !uploadIntentResponse.data?.uploadIntent || !uploadIntentResponse.data.uploadTarget) {
      return {
        attempted: true,
        warnings: [
          uploadIntentResponse.error?.message ?? `${file.name} could not create a backend upload intent.`,
          ...warnings,
        ],
      }
    }

    const uploadTarget = uploadIntentResponse.data.uploadTarget
    const uploadAuthorization = await getReeditProApiAuthorizationHeader()
    const uploadResponse = await fetch(resolveBackendUrl(apiBaseUrl, uploadTarget.uploadUrl), {
      method: uploadTarget.uploadMethod,
      credentials: 'omit',
      headers: createBackendUploadTargetHeaders({
        apiBaseUrl,
        uploadUrl: uploadTarget.uploadUrl,
        uploadHeaders: uploadTarget.uploadHeaders,
        mimeType,
        authorization: uploadAuthorization,
      }),
      body: file,
    })

    if (!uploadResponse.ok) {
      return {
        attempted: true,
        warnings: [
          `${file.name} could not be uploaded to the backend private upload target (${uploadResponse.status}).`,
          ...warnings,
        ],
      }
    }

    const finalizedResponse = await postBackendJson<BackendFinalizedUploadData>(
      apiBaseUrl,
      `/v1/upload-intents/${encodeURIComponent(uploadIntentResponse.data.uploadIntent.id)}/finalize`,
      {
        workspaceId,
        sizeBytes: file.size,
        checksumSha256,
      },
      `source-upload-finalize:${workspaceId}:${projectId}:${uploadedOrder}:${uploadIntentResponse.data.uploadIntent.id}`,
    )

    warnings.push(...(finalizedResponse.warnings ?? []))
    if (!finalizedResponse.ok || !finalizedResponse.data?.mediaAsset || !finalizedResponse.data.storageObjectRecord) {
      return {
        attempted: true,
        warnings: [
          finalizedResponse.error?.message ?? `${file.name} uploaded but could not be finalized into canonical source media.`,
          ...warnings,
        ],
      }
    }

    const uploadPlan = uploadPlanFromBackendFinalizedUpload(finalizedResponse.data, {
      file,
      uploadedOrder,
      workspaceId,
      projectId,
    })
    const storageUpload: StorageOperationResult = {
      ok: true,
      mode: 'backend_required',
      status: 'uploaded',
      bucketName: uploadPlan.bucketName,
      objectPath: uploadPlan.objectPath,
      message: 'File uploaded through the backend private upload-intent flow.',
      warnings: [],
    }

    return {
      attempted: true,
      plannedUpload: {
        file: {
          name: file.name,
          size: file.size,
          type: mimeType,
        },
        uploadPlan,
        clip: clipFromUploadPlan(uploadPlan, uploadedOrder, storageUpload),
        storageUpload,
        warnings,
      },
      warnings: [],
    }
  } catch (error) {
    return {
      attempted: true,
      warnings: [
        error instanceof Error ? error.message : `${file.name} backend upload failed before source planning.`,
      ],
    }
  }
}

export function createBackendUploadTargetHeaders(input: {
  apiBaseUrl: string
  uploadUrl: string
  uploadHeaders?: Record<string, string>
  mimeType: string
  authorization?: string
}): Record<string, string> {
  const headers: Record<string, string> = {
    ...(input.uploadHeaders ?? {}),
    'content-type': input.mimeType,
  }

  if (input.authorization && shouldAttachBackendAuthorization(input.apiBaseUrl, input.uploadUrl)) {
    headers.authorization = input.authorization
  }

  return headers
}

function shouldAttachBackendAuthorization(apiBaseUrl: string, uploadUrl: string): boolean {
  if (!/^https?:\/\//i.test(uploadUrl)) return true

  try {
    return new URL(uploadUrl).origin === new URL(apiBaseUrl).origin
  } catch {
    return false
  }
}

function uploadPlanFromBackendFinalizedUpload(
  finalized: BackendFinalizedUploadData,
  input: {
    file: File
    workspaceId: string
    projectId: string
    uploadedOrder: number
  },
): UploadPlan {
  return {
    id: finalized.mediaAsset.id,
    finalizedMediaAssetId: finalized.mediaAsset.id,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    purpose: 'source_media',
    bucketName: finalized.storageObjectRecord.bucketName,
    objectPath: finalized.storageObjectRecord.objectPath,
    storageProvider: resolveBackendUploadStorageProvider(finalized),
    fileName: finalized.mediaAsset.fileName,
    mimeType: finalized.mediaAsset.mimeType,
    fileSizeBytes: finalized.mediaAsset.sizeBytes ?? finalized.storageObjectRecord.sizeBytes ?? input.file.size,
    checksumSha256: normalizeChecksumSha256(
      finalized.mediaAsset.checksumSha256 ??
      finalized.mediaAsset.checksum ??
      finalized.storageObjectRecord.checksumSha256,
    ),
    requiresAuth: true,
    createsMediaAsset: true,
    mockOnly: finalized.mediaAsset.mockOnly ?? finalized.storageObjectRecord.mockOnly ?? finalized.uploadIntent.mockOnly ?? false,
    uploadedOrder: input.uploadedOrder,
    sourceMetadata: finalized.mediaAsset.sourceMetadata,
  }
}

function shouldCreateE2ELocalPrivateSourceUpload(uploadPlan: UploadPlan): boolean {
  return uploadPlan.purpose === 'source_media' &&
    uploadPlan.mockOnly === true &&
    uploadPlan.storageProvider !== 'local_private' &&
    e2eLocalPrivateSourceUploadsEnabled()
}

function shouldUseE2ELocalPrivateSourceUpload(uploadPlan: UploadPlan): boolean {
  return uploadPlan.purpose === 'source_media' &&
    uploadPlan.storageProvider !== 'local_private' &&
    e2eLocalPrivateSourceUploadsEnabled()
}

async function createE2ELocalPrivateSourceUploadPlan(
  file: File,
  uploadPlan: UploadPlan,
): Promise<UploadPlan> {
  const checksumSha256 = uploadPlan.checksumSha256 ?? await computeUploadFileSha256(file)
  const fileName = sanitizeLocalPathSegment(uploadPlan.fileName || file.name || 'source-media.mp4')
  const workspaceId = sanitizeLocalPathSegment(uploadPlan.workspaceId)
  const projectId = sanitizeLocalPathSegment(uploadPlan.projectId ?? 'project')
  const uploadPlanId = sanitizeLocalPathSegment(uploadPlan.id)

  return {
    ...uploadPlan,
    bucketName: uploadPlan.bucketName || 'source-media',
    checksumSha256,
    createsMediaAsset: true,
    fileSizeBytes: uploadPlan.fileSizeBytes || file.size || 1,
    mockOnly: false,
    objectPath: `local-private/e2e/workspaces/${workspaceId}/projects/${projectId}/source-media/${uploadPlanId}/${fileName}`,
    requiresAuth: true,
    storageProvider: 'local_private',
  }
}

function createE2ELocalPrivateSourceStorageUpload(uploadPlan: UploadPlan): StorageOperationResult {
  return {
    ok: true,
    mode: 'mock',
    status: 'uploaded',
    bucketName: uploadPlan.bucketName,
    objectPath: uploadPlan.objectPath,
    message: 'Local private source upload record created for internal testing.',
    warnings: [
      'Local private upload shim: no public URL, signed URL, AI asset call, worker, or media processing ran.',
    ],
  }
}

function e2eLocalPrivateSourceUploadsEnabled(): boolean {
  const env = getRuntimeEnv()
  const viteEnv = (import.meta as ImportMeta & { env?: RuntimeEnvRecord & { DEV?: boolean } }).env
  const devOrTest = viteEnv?.DEV === true || env.NODE_ENV === 'test'
  const runtime = getBackendRuntimeStatus()
  const explicitE2EUpload = env.VITE_REEDITPRO_E2E === 'true' &&
    env.VITE_REEDITPRO_E2E_LOCAL_PRIVATE_UPLOADS === 'true'
  const explicitLocalUpload = env.VITE_REEDITPRO_LOCAL_PRIVATE_UPLOADS === 'true'
  const mockSafeLocalUpload = runtime.mockOnly || runtime.mode === 'mock'

  return devOrTest &&
    (explicitE2EUpload || explicitLocalUpload || mockSafeLocalUpload)
}

function sanitizeLocalPathSegment(value: string): string {
  const sanitized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return sanitized || 'source'
}

function normalizeChecksumSha256(value: string | undefined): string | undefined {
  return typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value)
    ? value.toLowerCase()
    : undefined
}

function resolveBackendUploadStorageProvider(finalized: BackendFinalizedUploadData): MediaStorageProvider {
  const provider = finalized.mediaAsset.storageProvider ?? finalized.storageObjectRecord.storageProvider
  if (provider === 'local_private' || provider === 'local_private_storage' || provider === 'backend_local_storage') {
    return 'local_private'
  }
  if (provider === 'local_mock') return 'local_mock'
  if (provider === 'google_cloud_storage' || provider === 'gcs') return 'google_cloud_storage'
  return finalized.mediaAsset.mockOnly ?? finalized.storageObjectRecord.mockOnly ?? finalized.uploadIntent.mockOnly
    ? 'local_mock'
    : 'supabase_storage'
}

async function postBackendJson<TData>(
  apiBaseUrl: string,
  routePath: string,
  body: Record<string, unknown>,
  idempotencyKey: string,
): Promise<BackendApiEnvelope<TData>> {
  const authorization = await getReeditProApiAuthorizationHeader()
  const headers: Record<string, string> = {
    accept: 'application/json',
    'content-type': 'application/json',
    'idempotency-key': idempotencyKey,
  }

  if (authorization) headers.authorization = authorization

  const response = await fetch(resolveBackendUrl(apiBaseUrl, routePath), {
    method: 'POST',
    credentials: 'omit',
    headers,
    body: JSON.stringify(body),
  })

  return parseBackendApiEnvelope<TData>(response)
}

async function parseBackendApiEnvelope<TData>(response: Response): Promise<BackendApiEnvelope<TData>> {
  const text = await response.text()
  const payload = text.trim() ? JSON.parse(text) as BackendApiEnvelope<TData> : { ok: response.ok }

  if (!response.ok && payload.ok !== false) {
    return {
      ok: false,
      error: {
        code: `http_${response.status}`,
        message: `Backend upload route failed with status ${response.status}.`,
      },
      warnings: payload.warnings ?? [],
    }
  }

  return {
    ...payload,
    ok: payload.ok === true && response.ok,
    warnings: payload.warnings ?? [],
  }
}

function resolveBackendUrl(apiBaseUrl: string, routeOrUrl: string): string {
  if (/^https?:\/\//i.test(routeOrUrl)) {
    return routeOrUrl
  }

  return new URL(routeOrUrl, apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`).toString()
}

async function uploadSourceFileIfReady(
  file: File,
  uploadPlan: UploadPlan,
): Promise<StorageOperationResult | undefined> {
  if (uploadPlan.mockOnly) {
    return undefined
  }

  return uploadFileToSupabaseStorage(file, uploadPlan)
}

async function createSourceSequence(input: {
  workspaceId: string
  projectId: string
  userId?: string
  uploadItems: SourceUploadFlowItem[]
}): Promise<SourceUploadFlowResult | undefined> {
  const response = await callReeditProApi<
    { workspaceId: string; projectId: string; uploads: SourceUploadFlowItem[] },
    { sourceSequenceRecords?: SourceUploadFlowResult; warnings?: string[] }
  >(
    'media.sourceSequence.create',
    {
      projectId: input.projectId,
      uploads: input.uploadItems,
      workspaceId: input.workspaceId,
    },
    {
      context: {
        projectId: input.projectId,
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    },
  )

  if (!response.ok || !response.data?.sourceSequenceRecords) {
    throw new Error(response.error?.message ?? 'Source sequence creation failed after upload planning.')
  }

  return response.data.sourceSequenceRecords
}

function clipFromUploadPlan(
  uploadPlan: UploadPlan,
  uploadedOrder: number,
  storageUpload?: StorageOperationResult,
): ClipSource {
  const uploaded = storageUpload?.status === 'uploaded'
  const sourceMetadata = uploadPlan.sourceMetadata?.probeStatus === 'probed'
    ? uploadPlan.sourceMetadata
    : undefined
  const dimensions = sourceMetadata?.width && sourceMetadata.height
    ? `${sourceMetadata.width}x${sourceMetadata.height}`
    : undefined
  const streamSummary = [
    sourceMetadata?.hasVideo ? 'video' : undefined,
    sourceMetadata?.hasAudio ? 'audio' : undefined,
  ].filter(Boolean).join('+')

  return {
    id: uploadPlan.id,
    uploadedOrder,
    fileName: uploadPlan.fileName,
    duration: sourceMetadata?.durationSeconds
      ? formatDurationSeconds(sourceMetadata.durationSeconds)
      : 'Pending analysis',
    detectedType: uploadPlan.mimeType.startsWith('audio/') ? 'Audio source' : 'Video source',
    notes: uploaded
      ? sourceMetadata
        ? 'File uploaded to private source storage; local metadata is ready for source-order planning. Deeper transcript and content analysis still wait for approved backend workers.'
        : 'File uploaded to private source storage; analysis and editing still wait for plan approval.'
      : uploadPlan.mockOnly
        ? 'Upload plan is local/mock-safe; no media bytes were uploaded in this UI session.'
        : 'Upload plan is ready for private source storage.',
    previewLabel: uploaded ? 'Source file uploaded' : 'Source file planned',
    thumbnailHint: [
      formatBytes(uploadPlan.fileSizeBytes),
      uploadPlan.mimeType,
      dimensions,
      streamSummary || undefined,
    ].filter(Boolean).join(' / '),
    sourceRole: uploadPlan.mimeType.startsWith('audio/') ? 'context' : 'main_story',
  }
}

function formatDurationSeconds(durationSeconds: number): string {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return 'Pending analysis'
  const totalSeconds = Math.max(1, Math.round(durationSeconds))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value >= 10 || unitIndex === 0 ? Math.round(value) : value.toFixed(1)} ${units[unitIndex]}`
}

type RuntimeEnvRecord = Record<string, string | undefined>

type RuntimeGlobal = typeof globalThis & {
  process?: {
    env?: RuntimeEnvRecord
  }
}

function getRuntimeEnv(): RuntimeEnvRecord {
  const viteEnv = (import.meta as ImportMeta & { env?: RuntimeEnvRecord }).env
  const processEnv = (globalThis as RuntimeGlobal).process?.env
  return viteEnv ?? processEnv ?? {}
}

async function computeUploadFileSha256(file: File): Promise<string> {
  if (typeof file.arrayBuffer !== 'function') {
    throw new Error('Source upload checksum could not be computed because file bytes are unavailable.')
  }

  const subtle = globalThis.crypto?.subtle
  if (!subtle) {
    throw new Error('Source upload checksum requires Web Crypto before private backend upload.')
  }

  const digest = await subtle.digest('SHA-256', await file.arrayBuffer())
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function mimeTypeFromFileName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase()
  if (extension === 'mov') return 'video/quicktime'
  if (extension === 'webm') return 'video/webm'
  if (extension === 'mp3') return 'audio/mpeg'
  if (extension === 'wav') return 'audio/wav'
  if (extension === 'png') return 'image/png'
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg'
  if (extension === 'webp') return 'image/webp'
  return 'video/mp4'
}
