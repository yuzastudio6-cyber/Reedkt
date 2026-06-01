import { ApiError } from '../errors/api-error'
import type { ApiErrorCode } from '../errors/error-codes'
import type { ServiceContext } from '../types'
import { createProjectService } from './project-service'
import { sanitizeJson, throwOnSupabaseError } from './service-helpers'

export type RenderFoundationStatus = 'ready' | 'blocked' | 'backend_required' | 'mock_only'
export type RenderFoundationContext = 'readiness' | 'manifest' | 'preview' | 'export' | 'status' | 'blockers'
export type RenderType = 'preview' | 'final' | 'thumbnail' | 'proxy'
export type OutputFormat = 'mp4' | 'mov' | 'webm' | 'png' | 'wav'

export interface RenderFoundationInput {
  workspaceId: string
  projectId: string
  approvedSnapshotId?: string
  creditEstimateId?: string
  creditReservationId?: string
  mediaAssetId?: string
  storageObjectRecordId?: string
  renderJobId?: string
  renderId?: string
  exportId?: string
  timingManifestId?: string
  renderType?: RenderType
  outputFormat?: OutputFormat
  aspectRatio?: string
  width?: number
  height?: number
  fps?: number
  durationSeconds?: number
  manifestSchemaVersion?: string
  requestedBy?: string
  readinessContext?: RenderFoundationContext
  metadata?: Record<string, unknown>
  idempotencyKey?: string
}

interface RenderBlocker {
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

interface Row {
  [key: string]: unknown
}

export interface RenderFoundationResult {
  status: RenderFoundationStatus
  canBuildManifest: boolean
  canRequestPreview: boolean
  canRequestExport: boolean
  canRender: boolean
  canExport: boolean
  blockers: RenderBlocker[]
  warnings: string[]
  requiredRecords: RequiredRecord[]
  nextAction: string
  approvedSnapshotSummary?: Record<string, unknown> | null
  creditSummary?: Record<string, unknown> | null
  mediaReadinessSummary?: Record<string, unknown> | null
  storageSummary?: Record<string, unknown> | null
  timingSummary?: Record<string, unknown> | null
  qaSummary?: Record<string, unknown> | null
  renderManifestSummary?: Record<string, unknown> | null
  renderJobSummary?: Record<string, unknown> | null
  renderSummary?: Record<string, unknown> | null
  renders?: Record<string, unknown>[]
  renderEvents?: Record<string, unknown>[]
  exportSummary?: Record<string, unknown> | null
  exports?: Record<string, unknown>[]
  idempotencySummary?: Record<string, unknown> | null
  auditEvent?: Record<string, unknown>
}

const APPROVED_SNAPSHOT_STATUSES = new Set(['approved', 'ready', 'active', 'locked'])
const APPROVED_ESTIMATE_STATUSES = new Set(['approved', 'accepted'])
const ACTIVE_RESERVATION_STATUSES = new Set(['reserved', 'active', 'partially_spent'])
const BLOCKING_QA_STATUSES = new Set(['blocked', 'failed', 'needs_revision'])
const UNSAFE_METADATA_TERMS = [
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

function statusValue(row: Row | null | undefined): string {
  return stringValue(row?.status) ??
    stringValue(row?.render_status) ??
    stringValue(row?.export_status) ??
    stringValue(row?.snapshot_status) ??
    stringValue(row?.estimate_status) ??
    stringValue(row?.reservation_status) ??
    stringValue(row?.qa_status) ??
    ''
}

function normalizeKey(key: string): string {
  return key.replace(/[-_\s.]/g, '').toLowerCase()
}

function collectUnsafeMetadataPaths(value: unknown, path = 'metadata', paths: string[] = []): string[] {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectUnsafeMetadataPaths(item, `${path}[${index}]`, paths))
    return paths
  }

  if (!isRecord(value)) return paths

  for (const [key, child] of Object.entries(value)) {
    const normalized = normalizeKey(key)
    if (UNSAFE_METADATA_TERMS.some((term) => normalized.includes(term))) {
      paths.push(`${path}.${key}`)
    }
    collectUnsafeMetadataPaths(child, `${path}.${key}`, paths)
  }

  return paths
}

function baseResult(warnings: string[] = []): RenderFoundationResult {
  return {
    status: 'ready',
    canBuildManifest: false,
    canRequestPreview: false,
    canRequestExport: false,
    canRender: false,
    canExport: false,
    blockers: [],
    warnings,
    requiredRecords: [],
    nextAction: 'No action required.',
  }
}

function addBlocker(result: RenderFoundationResult, gate: string, code: ApiErrorCode, message: string): void {
  result.blockers.push({ gate, code, message })
  result.status = code === 'BACKEND_REQUIRED' ? 'backend_required' : 'blocked'
  result.canBuildManifest = false
  result.canRequestPreview = false
  result.canRequestExport = false
  result.canRender = false
  result.canExport = false
}

function addRequiredRecord(result: RenderFoundationResult, record: RequiredRecord): void {
  result.requiredRecords.push(record)
}

function finalize(result: RenderFoundationResult): RenderFoundationResult {
  if (result.blockers.length === 0) {
    result.status = result.status === 'mock_only' ? 'mock_only' : 'ready'
    result.canBuildManifest = true
    result.canRequestPreview = false
    result.canRequestExport = false
    result.canRender = false
    result.canExport = false
    result.nextAction = 'Render readiness boundary passed. Prompt 10 still does not execute Remotion, FFmpeg, workers, providers, tools, media analysis, storage writes, or credit mutation.'
    return result
  }

  result.status = result.blockers.some((blocker) => blocker.code === 'BACKEND_REQUIRED') ? 'backend_required' : 'blocked'
  result.nextAction = result.status === 'backend_required'
    ? 'Use a future reviewed render worker/runtime milestone before creating render jobs, rendering previews, or exporting media.'
    : 'Resolve listed render/export blockers before proceeding.'
  return result
}

function assertSafeMetadata(metadata: Record<string, unknown> | undefined): void {
  const unsafePaths = collectUnsafeMetadataPaths(metadata)
  if (unsafePaths.length > 0) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Render metadata must not include secrets, tokens, signed URLs, provider keys, service-role data, Stripe keys, or credentials.',
      400,
      { unsafePaths },
    )
  }
}

function summarizeRow(row: Row | null, allowedKeys: string[]): Record<string, unknown> | null {
  if (!row) return null
  return sanitizeJson(Object.fromEntries(allowedKeys.map((key) => [key, row[key]])))
}

function manifestSummary(input: RenderFoundationInput): Record<string, unknown> {
  return sanitizeJson({
    manifestSchemaVersion: input.manifestSchemaVersion ?? 'render_manifest_v1',
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedSnapshotId: input.approvedSnapshotId,
    creditEstimateId: input.creditEstimateId,
    creditReservationId: input.creditReservationId,
    mediaAssetId: input.mediaAssetId,
    storageObjectRecordId: input.storageObjectRecordId,
    timingManifestId: input.timingManifestId,
    renderType: input.renderType ?? 'preview',
    outputFormat: input.outputFormat ?? 'mp4',
    aspectRatio: input.aspectRatio,
    width: input.width,
    height: input.height,
    fps: input.fps,
    durationSeconds: input.durationSeconds,
    executionMode: 'backend_required',
    recordsOnly: true,
    message: 'Manifest shape was validated as a boundary DTO; no Remotion or FFmpeg execution occurred.',
  })
}

function backendRuntimeUnavailable(context: ServiceContext): boolean {
  return !context.clients.admin || context.env.mockOnly
}

export function createRenderService(context: ServiceContext) {
  const admin = context.clients.admin

  async function loadRecord(table: string, id: string | undefined): Promise<Row | null> {
    if (!admin || context.env.mockOnly || !id) return null
    const { data, error } = await admin.from(table).select('*').eq('id', id).maybeSingle()
    throwOnSupabaseError(error, 'RENDER_NOT_READY')
    return data as Row | null
  }

  async function listRecords(table: string, projectId: string): Promise<Row[]> {
    if (!admin || context.env.mockOnly) return []
    const { data, error } = await admin.from(table).select('*').eq('project_id', projectId).limit(50)
    throwOnSupabaseError(error, 'RENDER_NOT_READY')
    return Array.isArray(data) ? data as Row[] : []
  }

  async function listRenderEvents(renderId: string): Promise<Row[]> {
    if (!admin || context.env.mockOnly) return []
    const { data, error } = await admin
      .from('render_events')
      .select('*')
      .eq('render_id', renderId)
      .order('created_at', { ascending: true })
      .limit(100)
    throwOnSupabaseError(error, 'RENDER_NOT_READY')
    return Array.isArray(data) ? data as Row[] : []
  }

  async function checkProjectAccess(result: RenderFoundationResult, input: RenderFoundationInput): Promise<void> {
    const access = await createProjectService(context).checkProjectAccess(input.projectId)
    result.warnings.push(...access.warnings)
    addRequiredRecord(result, {
      table: 'projects',
      id: input.projectId,
      status: access.status === 'ready' ? 'present' : 'backend_required',
      note: access.status === 'ready' ? 'Project access verified through workspace membership.' : 'Project access requires backend runtime.',
    })

    if (access.status !== 'ready') {
      addBlocker(result, 'ProjectAccessGate', 'BACKEND_REQUIRED', 'Project access check requires backend runtime.')
      return
    }

    if (access.project?.workspaceId && access.project.workspaceId !== input.workspaceId) {
      addBlocker(result, 'WorkspaceGate', 'WORKSPACE_ACCESS_DENIED', 'Project does not belong to the requested workspace.')
    }
  }

  async function applyApprovedSnapshotGate(result: RenderFoundationResult, input: RenderFoundationInput): Promise<void> {
    if (!input.approvedSnapshotId) {
      addRequiredRecord(result, {
        table: 'approved_plan_snapshots',
        status: 'missing',
        note: 'Render/export must reference an immutable approved snapshot.',
      })
      addBlocker(result, 'ApprovedSnapshotGate', 'APPROVED_SNAPSHOT_REQUIRED', 'Approved snapshot ID is required before render/export readiness.')
      return
    }

    const snapshot = await loadRecord('approved_plan_snapshots', input.approvedSnapshotId)
    addRequiredRecord(result, {
      table: 'approved_plan_snapshots',
      id: input.approvedSnapshotId,
      status: snapshot ? 'present' : backendRuntimeUnavailable(context) ? 'backend_required' : 'missing',
      note: 'Render/export must reference an immutable approved snapshot.',
    })
    result.approvedSnapshotSummary = summarizeRow(snapshot, [
      'id',
      'project_id',
      'workspace_id',
      'edit_plan_version_id',
      'credit_estimate_id',
      'credit_reservation_id',
      'status',
      'snapshot_status',
      'created_at',
    ])
    if (!snapshot && backendRuntimeUnavailable(context)) {
      addBlocker(result, 'ApprovedSnapshotGate', 'BACKEND_REQUIRED', 'Approved snapshot validation requires backend service-role runtime.')
      return
    }
    if (!snapshot) {
      addBlocker(result, 'ApprovedSnapshotGate', 'APPROVED_SNAPSHOT_REQUIRED', 'Approved snapshot record was not found.')
      return
    }
    if (!APPROVED_SNAPSHOT_STATUSES.has(statusValue(snapshot).toLowerCase())) {
      addBlocker(result, 'ApprovedSnapshotGate', 'PLAN_NOT_APPROVED', 'Approved snapshot status is not ready for render/export.')
    }
  }

  async function applyCreditGate(result: RenderFoundationResult, input: RenderFoundationInput): Promise<void> {
    if (!input.creditEstimateId) {
      addRequiredRecord(result, {
        table: 'credit_estimates',
        status: 'missing',
        note: 'Render/export readiness requires an approved credit estimate reference.',
      })
      addBlocker(result, 'CreditEstimateApprovalGate', 'CREDIT_ESTIMATE_NOT_APPROVED', 'Credit estimate ID is required before render/export readiness.')
    } else {
      const estimate = await loadRecord('credit_estimates', input.creditEstimateId)
      addRequiredRecord(result, {
        table: 'credit_estimates',
        id: input.creditEstimateId,
        status: estimate ? 'present' : backendRuntimeUnavailable(context) ? 'backend_required' : 'missing',
        note: 'Render/export readiness requires an approved credit estimate reference.',
      })
      result.creditSummary = {
        ...(result.creditSummary ?? {}),
        estimate: summarizeRow(estimate, ['id', 'project_id', 'workspace_id', 'status', 'total_credits', 'created_at']),
      }
      if (!estimate && backendRuntimeUnavailable(context)) {
        addBlocker(result, 'CreditEstimateApprovalGate', 'BACKEND_REQUIRED', 'Credit estimate validation requires backend service-role runtime.')
      } else if (!estimate) {
        addBlocker(result, 'CreditEstimateApprovalGate', 'CREDIT_ESTIMATE_NOT_APPROVED', 'Credit estimate record was not found.')
      } else if (!APPROVED_ESTIMATE_STATUSES.has(statusValue(estimate).toLowerCase())) {
        addBlocker(result, 'CreditEstimateApprovalGate', 'CREDIT_ESTIMATE_NOT_APPROVED', 'Credit estimate is not approved.')
      }
    }

    if (!input.creditReservationId) {
      addRequiredRecord(result, {
        table: 'credit_reservations',
        status: 'missing',
        note: 'Preview/final render requires an active credit reservation when credits apply.',
      })
      addBlocker(result, 'CreditReservationGate', 'CREDITS_NOT_RESERVED', 'Credit reservation ID is required for render/export request readiness.')
      return
    }

    const reservation = await loadRecord('credit_reservations', input.creditReservationId)
    addRequiredRecord(result, {
      table: 'credit_reservations',
      id: input.creditReservationId,
      status: reservation ? 'present' : backendRuntimeUnavailable(context) ? 'backend_required' : 'missing',
      note: 'Preview/final render requires an active credit reservation when credits apply.',
    })
    result.creditSummary = {
      ...(result.creditSummary ?? {}),
      reservation: summarizeRow(reservation, ['id', 'project_id', 'workspace_id', 'credit_estimate_id', 'approved_snapshot_id', 'status', 'reserved_credits', 'created_at']),
    }
    if (!reservation && backendRuntimeUnavailable(context)) {
      addBlocker(result, 'CreditReservationGate', 'BACKEND_REQUIRED', 'Credit reservation validation requires backend service-role runtime.')
      return
    }
    if (!reservation) {
      addBlocker(result, 'CreditReservationGate', 'CREDITS_NOT_RESERVED', 'Credit reservation record was not found.')
      return
    }
    if (!ACTIVE_RESERVATION_STATUSES.has(statusValue(reservation).toLowerCase())) {
      addBlocker(result, 'CreditReservationGate', 'CREDITS_NOT_RESERVED', 'Credit reservation is not active.')
    }
  }

  async function applyMediaAndStorageGates(result: RenderFoundationResult, input: RenderFoundationInput): Promise<void> {
    if (input.mediaAssetId) {
      const mediaAsset = await loadRecord('media_assets', input.mediaAssetId)
      result.mediaReadinessSummary = summarizeRow(mediaAsset, ['id', 'project_id', 'workspace_id', 'status', 'processing_status', 'duration_seconds', 'width', 'height', 'frame_rate', 'mime_type'])
      addRequiredRecord(result, {
        table: 'media_assets',
        id: input.mediaAssetId,
        status: mediaAsset ? 'present' : backendRuntimeUnavailable(context) ? 'backend_required' : 'missing',
        note: 'Source media metadata is read-only input for render readiness.',
      })
    }

    if (input.storageObjectRecordId) {
      const storageObject = await loadRecord('storage_object_records', input.storageObjectRecordId)
      result.storageSummary = summarizeRow(storageObject, ['id', 'project_id', 'workspace_id', 'media_asset_id', 'bucket_name', 'object_path', 'object_purpose', 'status'])
      addRequiredRecord(result, {
        table: 'storage_object_records',
        id: input.storageObjectRecordId,
        status: storageObject ? 'present' : backendRuntimeUnavailable(context) ? 'backend_required' : 'missing',
        note: 'Storage object records store bucket/path only; signed URLs are not source of truth.',
      })
    }

    if (!input.mediaAssetId && !input.storageObjectRecordId) {
      addBlocker(result, 'StorageObjectGate', 'SOURCE_MEDIA_NOT_READY', 'Render readiness needs at least media or canonical storage object context.')
    }
  }

  async function applyTimingAndQaGates(result: RenderFoundationResult, input: RenderFoundationInput): Promise<void> {
    if (input.timingManifestId) {
      const timing = await loadRecord('master_timing_maps', input.timingManifestId)
      result.timingSummary = summarizeRow(timing, ['id', 'project_id', 'workspace_id', 'status', 'duration_seconds', 'frame_rate', 'created_at'])
      addRequiredRecord(result, {
        table: 'master_timing_maps',
        id: input.timingManifestId,
        status: timing ? 'present' : backendRuntimeUnavailable(context) ? 'backend_required' : 'missing',
        note: 'Timing manifest is a read-only readiness reference in Prompt 10.',
      })
    } else {
      result.timingSummary = sanitizeJson({
        timingManifestId: null,
        status: 'placeholder_only',
        message: 'No persisted timing manifest was supplied; future render execution requires approved timing.',
      })
      addBlocker(result, 'TimingManifestGate', 'BACKEND_REQUIRED', 'Approved timing manifest validation remains backend-required.')
    }

    if (!admin || context.env.mockOnly) {
      result.qaSummary = sanitizeJson({
        status: 'backend_required',
        message: 'QA blocker validation requires backend service-role runtime.',
      })
      addBlocker(result, 'QAReportGate', 'BACKEND_REQUIRED', 'QA blocker validation is required before final export.')
      return
    }

    const { data, error } = await admin
      .from('qa_reports')
      .select('id, project_id, status, qa_status, blocking, created_at')
      .eq('project_id', input.projectId)
      .limit(25)
    throwOnSupabaseError(error, 'PREVIEW_QA_FAILED')

    const rows = Array.isArray(data) ? data as Row[] : []
    const blockingReports = rows.filter((row) =>
      BLOCKING_QA_STATUSES.has(statusValue(row).toLowerCase()) || row.blocking === true,
    )
    result.qaSummary = sanitizeJson({
      reportCount: rows.length,
      blockingReportCount: blockingReports.length,
      recordsReadOnly: true,
    })
    if (blockingReports.length > 0) {
      addBlocker(result, 'QABlockerGate', 'QA_BLOCKED_PREVIEW', 'Blocking QA reports prevent preview/export readiness.')
    }
  }

  async function baseReadiness(input: RenderFoundationInput): Promise<RenderFoundationResult> {
    assertSafeMetadata(input.metadata)
    const result = baseResult()
    await checkProjectAccess(result, input)
    await applyApprovedSnapshotGate(result, input)
    await applyCreditGate(result, input)
    await applyMediaAndStorageGates(result, input)
    await applyTimingAndQaGates(result, input)
    result.renderManifestSummary = manifestSummary(input)
    return result
  }

  function applyExecutionRuntimeBlocker(result: RenderFoundationResult, scope: string, input: RenderFoundationInput): RenderFoundationResult {
    result.idempotencySummary = input.idempotencyKey
      ? { idempotencyKeyPresent: true, mutationBoundaryOnly: true }
      : null
    result.auditEvent = sanitizeJson({
      eventName: `${scope}.backend_required`,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      approvedSnapshotId: input.approvedSnapshotId,
      renderId: input.renderId,
      exportId: input.exportId,
    })
    addBlocker(result, 'RenderWorkerRuntimeGate', 'BACKEND_REQUIRED', `${scope} requires a future render/export worker runtime and remains fail-closed.`)
    return finalize(result)
  }

  async function getRenderResult(input: RenderFoundationInput): Promise<RenderFoundationResult> {
    const result = baseResult()
    await checkProjectAccess(result, input)
    const render = await loadRecord('renders', input.renderId)
    result.renderSummary = summarizeRow(render, ['id', 'project_id', 'workspace_id', 'render_job_id', 'status', 'render_status', 'render_type', 'created_at'])
    addRequiredRecord(result, {
      table: 'renders',
      id: input.renderId,
      status: render ? 'present' : backendRuntimeUnavailable(context) ? 'backend_required' : 'missing',
      note: 'Render reads are sanitized status summaries only.',
    })
    if (!render) {
      addBlocker(result, 'RenderReadGate', backendRuntimeUnavailable(context) ? 'BACKEND_REQUIRED' : 'RENDER_NOT_READY', 'Render status requires persisted backend render metadata.')
    }
    return finalize(result)
  }

  async function listRenderEventsResult(input: RenderFoundationInput): Promise<RenderFoundationResult> {
    const result = await getRenderResult(input)
    const rows = input.renderId ? await listRenderEvents(input.renderId) : []
    result.renderEvents = rows.map((row) => sanitizeJson({
      id: row.id,
      renderId: row.render_id,
      eventType: row.event_type,
      status: statusValue(row),
      createdAt: row.created_at,
    }))
    if (backendRuntimeUnavailable(context)) {
      addBlocker(result, 'RenderEventGate', 'BACKEND_REQUIRED', 'Render events require backend runtime.')
    }
    return finalize(result)
  }

  async function checkExportReadinessResult(input: RenderFoundationInput): Promise<RenderFoundationResult> {
    const result = await baseReadiness({ ...input, renderType: 'final' })
    if (input.renderId) {
      const render = await loadRecord('renders', input.renderId)
      result.renderSummary = summarizeRow(render, ['id', 'project_id', 'workspace_id', 'status', 'render_status', 'render_type', 'created_at'])
      if (!render) addBlocker(result, 'RenderReadinessGate', backendRuntimeUnavailable(context) ? 'BACKEND_REQUIRED' : 'RENDER_NOT_READY', 'Final export requires a completed render reference.')
    }
    return applyExecutionRuntimeBlocker(result, 'export.readiness', input)
  }

  async function getExportResult(input: RenderFoundationInput): Promise<RenderFoundationResult> {
    const result = baseResult()
    await checkProjectAccess(result, input)
    const finalExport = await loadRecord('final_exports', input.exportId)
    result.exportSummary = summarizeRow(finalExport, ['id', 'project_id', 'workspace_id', 'render_id', 'status', 'export_status', 'output_format', 'created_at'])
    addRequiredRecord(result, {
      table: 'final_exports',
      id: input.exportId,
      status: finalExport ? 'present' : backendRuntimeUnavailable(context) ? 'backend_required' : 'missing',
      note: 'Export reads are sanitized metadata summaries only.',
    })
    if (!finalExport) {
      addBlocker(result, 'ExportReadGate', backendRuntimeUnavailable(context) ? 'BACKEND_REQUIRED' : 'RENDER_NOT_READY', 'Final export status requires persisted backend export metadata.')
    }
    return finalize(result)
  }

  return {
    async checkRenderReadiness(input: RenderFoundationInput): Promise<RenderFoundationResult> {
      const result = await baseReadiness(input)
      return applyExecutionRuntimeBlocker(result, 'render.readiness', input)
    },

    async checkManifestReadiness(input: RenderFoundationInput): Promise<RenderFoundationResult> {
      const result = await baseReadiness(input)
      return finalize(result)
    },

    async buildManifestBoundary(input: RenderFoundationInput): Promise<RenderFoundationResult> {
      const result = await baseReadiness(input)
      result.renderManifestSummary = {
        ...manifestSummary(input),
        idempotencyKeyPresent: Boolean(input.idempotencyKey),
        intendedAction: 'render_manifest_build',
      }
      return applyExecutionRuntimeBlocker(result, 'render.manifest_build', input)
    },

    async checkPreviewReadiness(input: RenderFoundationInput): Promise<RenderFoundationResult> {
      const result = await baseReadiness({ ...input, renderType: 'preview' })
      return applyExecutionRuntimeBlocker(result, 'render.preview_readiness', input)
    },

    async requestPreview(input: RenderFoundationInput): Promise<RenderFoundationResult> {
      const result = await baseReadiness({ ...input, renderType: 'preview' })
      result.renderJobSummary = sanitizeJson({
        intendedAction: 'preview_render_request',
        renderType: 'preview',
        approvedSnapshotId: input.approvedSnapshotId,
        creditReservationId: input.creditReservationId,
        idempotencyKeyPresent: Boolean(input.idempotencyKey),
        status: 'backend_required',
      })
      return applyExecutionRuntimeBlocker(result, 'render.preview_request', input)
    },

    async getPreviewStatus(input: RenderFoundationInput): Promise<RenderFoundationResult> {
      return getRenderResult(input)
    },

    async getRender(input: RenderFoundationInput): Promise<RenderFoundationResult> {
      return getRenderResult(input)
    },

    async listRendersForProject(input: RenderFoundationInput): Promise<RenderFoundationResult> {
      const result = baseResult()
      await checkProjectAccess(result, input)
      const rows = await listRecords('renders', input.projectId)
      result.renders = rows.map((row) => sanitizeJson({
        id: row.id,
        projectId: row.project_id,
        workspaceId: row.workspace_id,
        renderJobId: row.render_job_id,
        status: statusValue(row),
        renderType: row.render_type,
        createdAt: row.created_at,
      }))
      addRequiredRecord(result, {
        table: 'renders',
        status: backendRuntimeUnavailable(context) ? 'backend_required' : 'present',
        note: 'Project render listing is read-only and sanitized.',
      })
      if (backendRuntimeUnavailable(context)) {
        addBlocker(result, 'RenderReadGate', 'BACKEND_REQUIRED', 'Render listing requires backend runtime.')
      }
      return finalize(result)
    },

    async listRenderEvents(input: RenderFoundationInput): Promise<RenderFoundationResult> {
      return listRenderEventsResult(input)
    },

    async collectBlockers(input: RenderFoundationInput): Promise<RenderFoundationResult> {
      const result = await baseReadiness(input)
      addBlocker(result, 'WorkerExecutionBlockedGate', 'BACKEND_REQUIRED', 'Prompt 10 never starts workers or render jobs.')
      addBlocker(result, 'RemotionRuntimeGate', 'BACKEND_REQUIRED', 'Prompt 10 never executes Remotion.')
      addBlocker(result, 'FFmpegPostprocessGate', 'BACKEND_REQUIRED', 'Prompt 10 never executes FFmpeg.')
      addBlocker(result, 'ProviderExecutionBlockedGate', 'BACKEND_REQUIRED', 'Prompt 10 never calls providers.')
      addBlocker(result, 'ToolExecutionBlockedGate', 'BACKEND_REQUIRED', 'Prompt 10 never executes tools.')
      return finalize(result)
    },

    async checkExportReadiness(input: RenderFoundationInput): Promise<RenderFoundationResult> {
      return checkExportReadinessResult(input)
    },

    async requestExport(input: RenderFoundationInput): Promise<RenderFoundationResult> {
      const result = await checkExportReadinessResult(input)
      result.exportSummary = sanitizeJson({
        intendedAction: 'final_export_request',
        outputFormat: input.outputFormat ?? 'mp4',
        approvedSnapshotId: input.approvedSnapshotId,
        creditReservationId: input.creditReservationId,
        renderId: input.renderId,
        idempotencyKeyPresent: Boolean(input.idempotencyKey),
        status: 'backend_required',
      })
      return applyExecutionRuntimeBlocker(result, 'export.request', input)
    },

    async getExportStatus(input: RenderFoundationInput): Promise<RenderFoundationResult> {
      return getExportResult(input)
    },

    async getExport(input: RenderFoundationInput): Promise<RenderFoundationResult> {
      return getExportResult(input)
    },

    async listExportsForProject(input: RenderFoundationInput): Promise<RenderFoundationResult> {
      const result = baseResult()
      await checkProjectAccess(result, input)
      const rows = await listRecords('final_exports', input.projectId)
      result.exports = rows.map((row) => sanitizeJson({
        id: row.id,
        projectId: row.project_id,
        workspaceId: row.workspace_id,
        renderId: row.render_id,
        status: statusValue(row),
        outputFormat: row.output_format,
        createdAt: row.created_at,
      }))
      addRequiredRecord(result, {
        table: 'final_exports',
        status: backendRuntimeUnavailable(context) ? 'backend_required' : 'present',
        note: 'Project export listing is read-only and sanitized.',
      })
      if (backendRuntimeUnavailable(context)) {
        addBlocker(result, 'ExportReadGate', 'BACKEND_REQUIRED', 'Export listing requires backend runtime.')
      }
      return finalize(result)
    },
  }
}
