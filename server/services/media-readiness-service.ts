import { ApiError } from '../errors/api-error'
import type { ApiErrorCode } from '../errors/error-codes'
import type { ServiceContext } from '../types'
import { getMockMediaAsset } from './upload-service'
import { createProjectService } from './project-service'
import { sanitizeJson, throwOnSupabaseError } from './service-helpers'

export type MediaReadinessStatus = 'ready' | 'blocked' | 'backend_required' | 'mock_only'
export type MediaReadinessContext = 'planning' | 'render' | 'transcript' | 'timing' | 'worker' | 'preview'

export interface MediaReadinessInput {
  workspaceId: string
  projectId: string
  mediaAssetId?: string
  storageObjectRecordId?: string
  uploadedClipId?: string
  sourceSequenceItemId?: string
  sourceOrder?: number
  contentType?: string
  durationSeconds?: number
  width?: number
  height?: number
  frameRate?: number
  audioStreamRequired?: boolean
  transcriptRequired?: boolean
  timingRequired?: boolean
  readinessContext?: MediaReadinessContext
  localFixtureId?: string
  metadata?: Record<string, unknown>
  idempotencyKey?: string
  probeTool?: 'ffprobe' | 'future_worker'
  requestReason?: string
  languageHint?: string
  observationPurpose?: string
  masterTimingMapId?: string
  validationPurpose?: 'approval' | 'preview' | 'render' | 'worker'
  editSessionId?: string
}

interface MediaBlocker {
  gate: string
  code: ApiErrorCode
  message: string
}

interface RequiredRecord {
  table: string
  id?: string
  status: 'present' | 'missing' | 'backend_required' | 'not_applicable'
  note: string
}

interface MediaSummary {
  id?: string
  workspaceId?: string
  projectId?: string
  assetType?: string
  fileName?: string
  contentType?: string
  durationSeconds?: number
  width?: number
  height?: number
  frameRate?: number
  sizeBytes?: number
  status?: string
  metadata?: Record<string, unknown>
  mockOnly?: boolean
}

interface StorageSummary {
  id?: string
  workspaceId?: string
  projectId?: string
  mediaAssetId?: string
  uploadIntentId?: string
  bucketName?: string
  objectPath?: string
  objectPurpose?: string
  contentType?: string
  sizeBytes?: number
  status?: string
  canonicalPath?: boolean
  sourceMediaPrivate?: boolean
}

export interface MediaReadinessResult {
  status: MediaReadinessStatus
  canProceed: boolean
  canProbe: boolean
  canPlan: boolean
  canRender: boolean
  blockers: MediaBlocker[]
  warnings: string[]
  requiredRecords: RequiredRecord[]
  nextAction: string
  mediaSummary?: MediaSummary | null
  mediaSummaries?: MediaSummary[]
  storageSummary?: StorageSummary | null
  sourceSequenceSummary?: Record<string, unknown> | null
  probeSummary?: Record<string, unknown> | null
  transcriptSummary?: Record<string, unknown> | null
  observationSummary?: Record<string, unknown> | null
  timingSummary?: Record<string, unknown> | null
  idempotencySummary?: Record<string, unknown> | null
  auditEvent?: Record<string, unknown>
}

interface Row {
  [key: string]: unknown
}

const UNSAFE_KEY_TERMS = [
  'secret',
  'token',
  'apikey',
  'providerkey',
  'servicerole',
  'signedurl',
  'uploadurl',
  'downloadurl',
  'temporaryurl',
  'privatekey',
  'password',
  'credential',
  'stripe',
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  return undefined
}

function normalizeKey(key: string): string {
  return key.replace(/[-_\s.]/g, '').toLowerCase()
}

function collectUnsafeJsonPaths(value: unknown, path = 'metadata', paths: string[] = []): string[] {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectUnsafeJsonPaths(item, `${path}[${index}]`, paths))
    return paths
  }

  if (!isRecord(value)) return paths

  for (const [key, child] of Object.entries(value)) {
    const normalized = normalizeKey(key)
    if (UNSAFE_KEY_TERMS.some((term) => normalized.includes(term))) {
      paths.push(`${path}.${key}`)
    }
    collectUnsafeJsonPaths(child, `${path}.${key}`, paths)
  }

  return paths
}

function assertSafeMetadata(value: Record<string, unknown> | undefined): void {
  if (!value) return
  const unsafePaths = collectUnsafeJsonPaths(value)
  if (unsafePaths.length > 0) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Media readiness metadata must not include secrets, tokens, signed URLs, provider keys, service-role data, Stripe keys, or credentials.',
      400,
      { unsafePaths },
    )
  }
}

function baseResult(warnings: string[] = []): MediaReadinessResult {
  return {
    status: 'ready',
    canProceed: true,
    canProbe: false,
    canPlan: true,
    canRender: false,
    blockers: [],
    warnings,
    requiredRecords: [],
    nextAction: 'No action required.',
  }
}

function addBlocker(result: MediaReadinessResult, gate: string, code: ApiErrorCode, message: string): void {
  result.blockers.push({ gate, code, message })
  result.canProceed = false
  result.canProbe = false
  result.canPlan = false
  result.canRender = false
  result.status = code === 'BACKEND_REQUIRED' ? 'backend_required' : 'blocked'
}

function addRequiredRecord(result: MediaReadinessResult, record: RequiredRecord): void {
  result.requiredRecords.push(record)
}

function finalize(result: MediaReadinessResult): MediaReadinessResult {
  if (result.blockers.length === 0) {
    result.status = result.status === 'mock_only' ? 'mock_only' : 'ready'
    result.canProceed = true
    result.canPlan = true
    result.canProbe = Boolean(result.mediaSummary && result.storageSummary)
    result.canRender = false
    result.nextAction = 'Media readiness boundary passed. Prompt 9 still does not execute media analysis, workers, providers, rendering, or tools.'
    return result
  }

  result.status = result.blockers.some((blocker) => blocker.code === 'BACKEND_REQUIRED') ? 'backend_required' : 'blocked'
  result.canProceed = false
  result.canProbe = false
  result.canPlan = false
  result.canRender = false
  result.nextAction = result.status === 'backend_required'
    ? 'Use a future reviewed backend media worker/runtime milestone before executing probe, transcript, observation, or timing writes.'
    : 'Resolve listed media readiness blockers before proceeding.'
  return result
}

function backendRequiredResult(scope: string, input?: MediaReadinessInput): MediaReadinessResult {
  const result = baseResult([
    `${scope} requires a configured backend/service-role media readiness runtime.`,
    'Prompt 9 does not process real user media, execute workers, run media tools, create jobs, call providers, render media, execute tools, mutate credits, upload/download storage, or run remote Supabase.',
  ])
  result.idempotencySummary = input?.idempotencyKey
    ? { idempotencyKeyPresent: true, mutationBoundaryOnly: true }
    : undefined
  result.auditEvent = sanitizeJson({
    eventName: `media.${scope.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.backend_required`,
    workspaceId: input?.workspaceId,
    projectId: input?.projectId,
    mediaAssetId: input?.mediaAssetId,
  })
  addBlocker(result, 'BackendMediaRuntimeGate', 'BACKEND_REQUIRED', `${scope} is backend-required and fail-closed in Prompt 9.`)
  return finalize(result)
}

function mapMediaAsset(row: Row, fallbackWorkspaceId?: string): MediaSummary {
  const metadata = isRecord(row.metadata_json)
    ? row.metadata_json
    : isRecord(row.metadata)
      ? row.metadata
      : {}

  return {
    id: stringValue(row.id),
    workspaceId: stringValue(row.workspace_id) ?? fallbackWorkspaceId,
    projectId: stringValue(row.project_id),
    assetType: stringValue(row.asset_type),
    fileName: stringValue(row.file_name) ?? stringValue(row.display_name),
    contentType: stringValue(row.mime_type) ?? stringValue(row.content_type),
    durationSeconds: numberValue(row.duration_seconds),
    width: numberValue(row.width),
    height: numberValue(row.height),
    frameRate: numberValue(row.frame_rate),
    sizeBytes: numberValue(row.size_bytes) ?? numberValue(row.file_size_bytes),
    status: stringValue(row.status) ?? stringValue(row.processing_status),
    metadata: sanitizeJson(metadata),
  }
}

function mapStorageObject(row: Row): StorageSummary {
  return {
    id: stringValue(row.id),
    workspaceId: stringValue(row.workspace_id),
    projectId: stringValue(row.project_id),
    mediaAssetId: stringValue(row.media_asset_id),
    uploadIntentId: stringValue(row.upload_intent_id),
    bucketName: stringValue(row.bucket_name),
    objectPath: stringValue(row.object_path),
    objectPurpose: stringValue(row.object_purpose),
    contentType: stringValue(row.mime_type) ?? stringValue(row.content_type),
    sizeBytes: numberValue(row.size_bytes),
    status: stringValue(row.status),
    canonicalPath: false,
    sourceMediaPrivate: true,
  }
}

function canonicalObjectPath(storage: StorageSummary | null | undefined, workspaceId: string, projectId: string): boolean {
  const objectPath = storage?.objectPath
  if (!objectPath) return false
  return objectPath.startsWith(`workspaces/${workspaceId}/projects/${projectId}/`) &&
    !objectPath.includes('..') &&
    !objectPath.includes('\\')
}

function applyInputMetadata(result: MediaReadinessResult, input: MediaReadinessInput): void {
  if (!input.contentType && input.durationSeconds === undefined && input.width === undefined && input.height === undefined && input.frameRate === undefined) return
  result.mediaSummary = {
    ...(result.mediaSummary ?? {}),
    contentType: input.contentType ?? result.mediaSummary?.contentType,
    durationSeconds: input.durationSeconds ?? result.mediaSummary?.durationSeconds,
    width: input.width ?? result.mediaSummary?.width,
    height: input.height ?? result.mediaSummary?.height,
    frameRate: input.frameRate ?? result.mediaSummary?.frameRate,
    metadata: sanitizeJson(input.metadata),
  }
}

function addMetadataBlockers(result: MediaReadinessResult, input: MediaReadinessInput): void {
  const summary = result.mediaSummary
  const duration = input.durationSeconds ?? summary?.durationSeconds
  const width = input.width ?? summary?.width
  const height = input.height ?? summary?.height
  const frameRate = input.frameRate ?? summary?.frameRate
  const contentType = input.contentType ?? summary?.contentType

  if (input.mediaAssetId || summary) {
    addRequiredRecord(result, {
      table: 'media_assets',
      id: input.mediaAssetId ?? summary?.id,
      status: summary ? 'present' : 'missing',
      note: summary ? 'Media asset metadata is available for readiness checks.' : 'Media asset metadata is required.',
    })
  }

  if (!contentType) {
    addBlocker(result, 'MediaMetadataGate', 'SOURCE_MEDIA_NOT_READY', 'Media content type is missing.')
  }
  if (duration === undefined) {
    addBlocker(result, 'MediaDurationGate', 'SOURCE_MEDIA_NOT_READY', 'Media duration is missing.')
  }
  if (width === undefined || height === undefined) {
    addBlocker(result, 'MediaResolutionGate', 'SOURCE_MEDIA_NOT_READY', 'Media resolution is missing.')
  }
  if (frameRate === undefined && contentType?.startsWith('video/')) {
    addBlocker(result, 'MediaFrameRateGate', 'SOURCE_MEDIA_NOT_READY', 'Video frame rate is missing.')
  }
  if (input.audioStreamRequired) {
    result.warnings.push('Audio stream readiness requires future probe/transcript worker validation.')
    addBlocker(result, 'MediaAudioStreamGate', 'BACKEND_REQUIRED', 'Audio stream presence requires future media probe runtime.')
  }
}

function placeholderTranscript(input: MediaReadinessInput): Record<string, unknown> {
  return sanitizeJson({
    mediaAssetId: input.mediaAssetId,
    storageObjectRecordId: input.storageObjectRecordId,
    languageHint: input.languageHint,
    transcriptRequired: input.transcriptRequired ?? true,
    status: 'placeholder_only',
    message: 'Transcript readiness is a placeholder boundary; no transcription ran.',
  })
}

function placeholderTiming(input: MediaReadinessInput): Record<string, unknown> {
  return sanitizeJson({
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    sourceSequenceItemId: input.sourceSequenceItemId,
    durationSeconds: input.durationSeconds,
    frameRate: input.frameRate,
    status: 'placeholder_only',
    message: 'Timing seed readiness is a placeholder boundary; no timing analysis ran.',
  })
}

export function createMediaReadinessService(context: ServiceContext) {
  async function checkProjectAccess(result: MediaReadinessResult, workspaceId: string, projectId: string): Promise<void> {
    const access = await createProjectService(context).checkProjectAccess(projectId)
    result.warnings.push(...access.warnings)
    addRequiredRecord(result, {
      table: 'projects',
      id: projectId,
      status: access.status === 'ready' ? 'present' : 'backend_required',
      note: access.status === 'ready' ? 'Project access verified through workspace membership.' : 'Project access needs backend runtime.',
    })

    if (access.status !== 'ready') {
      addBlocker(result, 'ProjectAccessGate', 'BACKEND_REQUIRED', 'Project access check requires backend runtime.')
      return
    }

    if (access.project?.workspaceId && access.project.workspaceId !== workspaceId) {
      addBlocker(result, 'WorkspaceGate', 'WORKSPACE_ACCESS_DENIED', 'Project does not belong to the requested workspace.')
    }
  }

  async function loadMediaAsset(input: MediaReadinessInput): Promise<MediaSummary | null> {
    if (!input.mediaAssetId) return null
    const mockAsset = getMockMediaAsset(input.mediaAssetId)
    if (mockAsset) {
      return {
        id: mockAsset.id,
        workspaceId: mockAsset.workspaceId,
        projectId: mockAsset.projectId,
        assetType: mockAsset.assetType,
        fileName: mockAsset.fileName,
        contentType: mockAsset.mimeType,
        sizeBytes: mockAsset.sizeBytes,
        status: mockAsset.status,
        mockOnly: true,
      }
    }

    if (!context.clients.admin || context.env.mockOnly) return null

    const { data, error } = await context.clients.admin
      .from('media_assets')
      .select('*')
      .eq('id', input.mediaAssetId)
      .maybeSingle()

    throwOnSupabaseError(error, 'SOURCE_MEDIA_NOT_READY')
    return data ? mapMediaAsset(data as Row, input.workspaceId) : null
  }

  async function loadStorageObject(input: MediaReadinessInput): Promise<StorageSummary | null> {
    if (!context.clients.admin || context.env.mockOnly) return null
    let query = context.clients.admin.from('storage_object_records').select('*').limit(1)
    if (input.storageObjectRecordId) query = query.eq('id', input.storageObjectRecordId)
    else if (input.mediaAssetId) query = query.eq('media_asset_id', input.mediaAssetId)
    else return null

    const { data, error } = await query.maybeSingle()
    throwOnSupabaseError(error, 'STORAGE_OBJECT_NOT_FOUND')
    if (!data) return null
    const storage = mapStorageObject(data as Row)
    return {
      ...storage,
      canonicalPath: canonicalObjectPath(storage, input.workspaceId, input.projectId),
      sourceMediaPrivate: true,
    }
  }

  async function listMediaAssets(workspaceId: string, projectId: string): Promise<MediaSummary[]> {
    if (!context.clients.admin || context.env.mockOnly) return []
    const { data, error } = await context.clients.admin
      .from('media_assets')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    throwOnSupabaseError(error, 'SOURCE_MEDIA_NOT_READY')
    return Array.isArray(data) ? data.map((row) => mapMediaAsset(row as Row, workspaceId)) : []
  }

  async function sourceSequenceSummary(input: MediaReadinessInput): Promise<Record<string, unknown> | null> {
    if (!context.clients.admin || context.env.mockOnly) return null

    const { data: clips, error: clipError } = await context.clients.admin
      .from('uploaded_clips')
      .select('id, media_asset_id, uploaded_order, status, source_role, is_important, is_optional')
      .eq('project_id', input.projectId)
      .order('uploaded_order', { ascending: true })

    throwOnSupabaseError(clipError, 'SOURCE_MEDIA_NOT_READY')

    const { data: sequenceItems, error: sequenceError } = await context.clients.admin
      .from('source_sequence_items')
      .select('id, uploaded_clip_id, source_order, confirmed_order, user_confirmed')
      .eq('project_id', input.projectId)
      .order('source_order', { ascending: true })

    throwOnSupabaseError(sequenceError, 'SOURCE_MEDIA_NOT_READY')

    return sanitizeJson({
      projectId: input.projectId,
      uploadedClipCount: Array.isArray(clips) ? clips.length : 0,
      sourceSequenceItemCount: Array.isArray(sequenceItems) ? sequenceItems.length : 0,
      firstUploadedOrder: Array.isArray(clips) && clips.length > 0 ? clips[0]?.uploaded_order : undefined,
      allSequenceItemsConfirmed: Array.isArray(sequenceItems) && sequenceItems.length > 0
        ? sequenceItems.every((item) => Boolean((item as Row).user_confirmed))
        : false,
      recordsReadOnly: true,
    })
  }

  async function baseReadiness(input: MediaReadinessInput): Promise<MediaReadinessResult> {
    assertSafeMetadata(input.metadata)
    const result = baseResult()
    await checkProjectAccess(result, input.workspaceId, input.projectId)
    result.mediaSummary = await loadMediaAsset(input)
    applyInputMetadata(result, input)
    result.storageSummary = await loadStorageObject(input)

    if (input.storageObjectRecordId || input.mediaAssetId) {
      addRequiredRecord(result, {
        table: 'storage_object_records',
        id: input.storageObjectRecordId,
        status: result.storageSummary ? 'present' : context.clients.admin && !context.env.mockOnly ? 'missing' : 'backend_required',
        note: result.storageSummary
          ? 'Storage object record stores bucket/path metadata only.'
          : 'Storage object metadata is required before media probe/timing execution.',
      })
    }

    if (result.storageSummary && !result.storageSummary.canonicalPath) {
      addBlocker(result, 'StorageObjectGate', 'SOURCE_MEDIA_NOT_READY', 'Storage object path is not canonical for the requested workspace/project.')
    }

    addMetadataBlockers(result, input)

    if (!context.clients.admin || context.env.mockOnly) {
      addBlocker(result, 'BackendReadinessGate', 'BACKEND_REQUIRED', 'Backend service-role runtime is required to validate persisted media readiness records.')
    }

    return result
  }

  return {
    async checkMediaReadiness(input: MediaReadinessInput): Promise<MediaReadinessResult> {
      const result = await baseReadiness(input)
      result.sourceSequenceSummary = await sourceSequenceSummary(input)
      if (input.transcriptRequired) {
        result.transcriptSummary = placeholderTranscript(input)
        addBlocker(result, 'TranscriptReadinessGate', 'BACKEND_REQUIRED', 'Transcript readiness requires future transcript alignment runtime.')
      }
      if (input.timingRequired) {
        result.timingSummary = placeholderTiming(input)
        addBlocker(result, 'TimingSeedGate', 'BACKEND_REQUIRED', 'Timing seed readiness requires future timing runtime.')
      }
      return finalize(result)
    },

    async getSource(input: MediaReadinessInput): Promise<MediaReadinessResult> {
      const result = await baseReadiness(input)
      return finalize(result)
    },

    async listSourcesForProject(input: MediaReadinessInput): Promise<MediaReadinessResult> {
      const result = baseResult()
      await checkProjectAccess(result, input.workspaceId, input.projectId)
      result.mediaSummaries = await listMediaAssets(input.workspaceId, input.projectId)
      addRequiredRecord(result, {
        table: 'media_assets',
        status: context.clients.admin && !context.env.mockOnly ? 'present' : 'backend_required',
        note: 'Project-scoped media source list is read-only.',
      })
      if (!context.clients.admin || context.env.mockOnly) {
        addBlocker(result, 'BackendReadinessGate', 'BACKEND_REQUIRED', 'Backend runtime is required to list persisted project media sources.')
      }
      return finalize(result)
    },

    async checkSourceSequenceReadiness(input: MediaReadinessInput): Promise<MediaReadinessResult> {
      assertSafeMetadata(input.metadata)
      const result = baseResult()
      await checkProjectAccess(result, input.workspaceId, input.projectId)
      result.sourceSequenceSummary = await sourceSequenceSummary(input)
      addRequiredRecord(result, {
        table: 'uploaded_clips',
        id: input.uploadedClipId,
        status: result.sourceSequenceSummary ? 'present' : context.clients.admin && !context.env.mockOnly ? 'missing' : 'backend_required',
        note: 'Uploaded clips preserve source order context.',
      })
      addRequiredRecord(result, {
        table: 'source_sequence_items',
        id: input.sourceSequenceItemId,
        status: result.sourceSequenceSummary ? 'present' : context.clients.admin && !context.env.mockOnly ? 'missing' : 'backend_required',
        note: 'Source sequence readiness is read-only in Prompt 9.',
      })
      if (!result.sourceSequenceSummary) {
        addBlocker(result, 'SourceSequenceGate', 'BACKEND_REQUIRED', 'Source sequence readiness requires backend runtime and canonical source records.')
      }
      return finalize(result)
    },

    async checkProbeReadiness(input: MediaReadinessInput): Promise<MediaReadinessResult> {
      const result = await baseReadiness(input)
      result.probeSummary = sanitizeJson({
        probeTool: input.probeTool ?? 'ffprobe',
        canRequestProbeLater: result.blockers.length === 0,
        executionMode: 'backend_required',
        message: 'Probe readiness was evaluated without running a media probe.',
      })
      addBlocker(result, 'MediaProbeGate', 'BACKEND_REQUIRED', 'Media probe execution requires a future approved worker/tool runtime.')
      return finalize(result)
    },

    async requestProbe(input: MediaReadinessInput): Promise<MediaReadinessResult> {
      const readiness = await baseReadiness(input)
      readiness.probeSummary = sanitizeJson({
        probeTool: input.probeTool ?? 'ffprobe',
        requestReason: input.requestReason,
        idempotencyKeyPresent: Boolean(input.idempotencyKey),
        intendedAction: 'media_probe_request',
        executionMode: 'backend_required',
        message: 'Probe request was validated, but no job, worker, or media tool was executed.',
      })
      readiness.idempotencySummary = {
        idempotencyKeyPresent: Boolean(input.idempotencyKey),
        mutationBoundaryOnly: true,
      }
      readiness.auditEvent = sanitizeJson({
        eventName: 'media.probe_request.backend_required',
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        mediaAssetId: input.mediaAssetId,
        storageObjectRecordId: input.storageObjectRecordId,
      })
      addBlocker(readiness, 'WorkerRuntimeGate', 'BACKEND_REQUIRED', 'Probe request requires future worker runtime and remains fail-closed.')
      return finalize(readiness)
    },

    async getProbeResult(input: MediaReadinessInput): Promise<MediaReadinessResult> {
      const result = await baseReadiness(input)
      result.probeSummary = sanitizeJson({
        mediaAssetId: input.mediaAssetId,
        storageObjectRecordId: input.storageObjectRecordId,
        status: 'placeholder_only',
        message: 'No persisted probe result is produced by Prompt 9.',
      })
      addBlocker(result, 'MediaProbeGate', 'BACKEND_REQUIRED', 'Persisted probe results require future media probe worker runtime.')
      return finalize(result)
    },

    async checkTranscriptReadiness(input: MediaReadinessInput): Promise<MediaReadinessResult> {
      const result = await baseReadiness(input)
      result.transcriptSummary = placeholderTranscript(input)
      addBlocker(result, 'TranscriptReadinessGate', 'BACKEND_REQUIRED', 'Transcript alignment requires future transcript worker/provider runtime.')
      return finalize(result)
    },

    async getTranscriptPlaceholder(input: MediaReadinessInput): Promise<MediaReadinessResult> {
      const result = await baseReadiness(input)
      result.transcriptSummary = placeholderTranscript(input)
      addBlocker(result, 'TranscriptTimingGate', 'BACKEND_REQUIRED', 'Transcript timing anchors are placeholder-only in Prompt 9.')
      return finalize(result)
    },

    async checkVisualObservationReadiness(input: MediaReadinessInput): Promise<MediaReadinessResult> {
      const result = await baseReadiness(input)
      result.observationSummary = sanitizeJson({
        mediaAssetId: input.mediaAssetId,
        observationType: 'visual',
        observationPurpose: input.observationPurpose,
        status: 'placeholder_only',
        message: 'Visual observation readiness is a placeholder; no OCR, VLM, object, or face analysis ran.',
      })
      addBlocker(result, 'VisualObservationReadinessGate', 'BACKEND_REQUIRED', 'Visual observation requires future worker/provider runtime.')
      return finalize(result)
    },

    async checkAudioObservationReadiness(input: MediaReadinessInput): Promise<MediaReadinessResult> {
      const result = await baseReadiness(input)
      result.observationSummary = sanitizeJson({
        mediaAssetId: input.mediaAssetId,
        observationType: 'audio',
        observationPurpose: input.observationPurpose,
        status: 'placeholder_only',
        message: 'Audio observation readiness is a placeholder; no audio analysis ran.',
      })
      addBlocker(result, 'AudioObservationReadinessGate', 'BACKEND_REQUIRED', 'Audio observation requires future worker/tool runtime.')
      return finalize(result)
    },

    async checkTimingSeedReadiness(input: MediaReadinessInput): Promise<MediaReadinessResult> {
      assertSafeMetadata(input.metadata)
      const result = baseResult()
      await checkProjectAccess(result, input.workspaceId, input.projectId)
      result.mediaSummary = await loadMediaAsset(input)
      applyInputMetadata(result, input)
      result.timingSummary = placeholderTiming(input)
      if (input.durationSeconds === undefined && !result.mediaSummary?.durationSeconds) {
        addBlocker(result, 'TimingSeedGate', 'SOURCE_MEDIA_NOT_READY', 'Timing seed requires duration metadata.')
      }
      if (input.frameRate === undefined && !result.mediaSummary?.frameRate) {
        addBlocker(result, 'TimingValidationGate', 'SOURCE_MEDIA_NOT_READY', 'Frame-aware timing seed requires frame rate metadata.')
      }
      addBlocker(result, 'TimingSeedRuntimeGate', 'BACKEND_REQUIRED', 'Master timing seed persistence requires future timing runtime.')
      return finalize(result)
    },

    async getTimingSeedPlaceholder(input: MediaReadinessInput): Promise<MediaReadinessResult> {
      const result = baseResult()
      await checkProjectAccess(result, input.workspaceId, input.projectId)
      result.timingSummary = placeholderTiming(input)
      addBlocker(result, 'TimingSeedGate', 'BACKEND_REQUIRED', 'Timing seed placeholder is not a persisted timing plan.')
      return finalize(result)
    },

    async checkTimingValidationReadiness(input: MediaReadinessInput): Promise<MediaReadinessResult> {
      const result = await this.checkTimingSeedReadiness(input)
      result.timingSummary = sanitizeJson({
        ...result.timingSummary,
        masterTimingMapId: input.masterTimingMapId,
        validationPurpose: input.validationPurpose ?? 'approval',
        message: 'Timing validation readiness is a placeholder; no frame-accurate timing validation ran.',
      })
      addBlocker(result, 'TimingValidationGate', 'BACKEND_REQUIRED', 'Timing validation requires future timing QA/runtime.')
      return finalize(result)
    },

    backendRequired(scope: string, input?: MediaReadinessInput): MediaReadinessResult {
      return backendRequiredResult(scope, input)
    },
  }
}
