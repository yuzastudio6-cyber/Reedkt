import { ApiError } from '../errors/api-error'
import type { ApiErrorCode } from '../errors/error-codes'
import type { ServiceContext } from '../types'
import { createProjectService } from './project-service'
import { sanitizeJson, throwOnSupabaseError } from './service-helpers'

export type QaRevisionStatus = 'ready' | 'blocked' | 'backend_required' | 'mock_only'
export type QaRevisionSeverity = 'info' | 'warning' | 'blocking' | 'critical'
export type QaBlockerStatus = 'open' | 'acknowledged' | 'resolved_boundary' | 'blocked'
export type FallbackDecisionType =
  | 'retry_same_path'
  | 'use_approved_fallback'
  | 'request_user_review'
  | 'require_new_approval'
  | 'block_export'
export type RepairPlanType =
  | 'qa_recheck'
  | 'caption_adjustment'
  | 'safe_zone_adjustment'
  | 'asset_replacement'
  | 'timing_repair'
  | 'requires_future_worker'

export interface QaRevisionInput {
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
  qaReportId?: string
  qaIssueId?: string
  qaReportItemId?: string
  previewReviewId?: string
  reviewCommentId?: string
  revisionRequestId?: string
  fallbackDecisionId?: string
  affectedSegmentIds?: string[]
  affectedAssetIds?: string[]
  affectedRenderIds?: string[]
  requestedChange?: string
  severity?: QaRevisionSeverity
  blockerStatus?: QaBlockerStatus
  requiresNewGeneration?: boolean
  requiresNewRender?: boolean
  requiresCreditEstimate?: boolean
  requiresApproval?: boolean
  fallbackDecisionType?: FallbackDecisionType
  repairPlanType?: RepairPlanType
  requestedBy?: string
  metadata?: Record<string, unknown>
  idempotencyKey?: string
}

interface QaRevisionBlocker {
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

export interface QaRevisionResult {
  status: QaRevisionStatus
  canCreateQAReport: boolean
  canReviewPreview: boolean
  canRequestRevision: boolean
  canPlanFallback: boolean
  canProceedToExport: boolean
  blockers: QaRevisionBlocker[]
  warnings: string[]
  requiredRecords: RequiredRecord[]
  nextAction: string
  approvedSnapshotSummary?: Record<string, unknown> | null
  renderSummary?: Record<string, unknown> | null
  qaSummary?: Record<string, unknown> | null
  qaReports?: Record<string, unknown>[]
  qaBlockers?: Record<string, unknown>[]
  previewReviewSummary?: Record<string, unknown> | null
  previewReviews?: Record<string, unknown>[]
  reviewComments?: Record<string, unknown>[]
  revisionSummary?: Record<string, unknown> | null
  revisionRequests?: Record<string, unknown>[]
  fallbackSummary?: Record<string, unknown> | null
  repairPlanSummary?: Record<string, unknown> | null
  creditSummary?: Record<string, unknown> | null
  exportBlockerSummary?: Record<string, unknown> | null
  idempotencySummary?: Record<string, unknown> | null
  auditEvent?: Record<string, unknown>
}

const BLOCKING_QA_STATUSES = new Set(['blocked', 'failed', 'needs_revision', 'critical'])
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
  'env',
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
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

function assertSafeMetadata(metadata: Record<string, unknown> | undefined): void {
  if (!metadata) return
  const unsafePaths = collectUnsafeMetadataPaths(metadata)
  if (unsafePaths.length > 0) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'QA/revision metadata must not include secrets, tokens, signed URLs, provider keys, service-role data, Stripe keys, credentials, or private env values.',
      400,
      { unsafePaths },
    )
  }
}

function baseResult(warnings: string[] = []): QaRevisionResult {
  return {
    status: 'ready',
    canCreateQAReport: false,
    canReviewPreview: false,
    canRequestRevision: false,
    canPlanFallback: false,
    canProceedToExport: false,
    blockers: [],
    warnings,
    requiredRecords: [],
    nextAction: 'No action required.',
  }
}

function addBlocker(result: QaRevisionResult, gate: string, code: ApiErrorCode, message: string): void {
  result.blockers.push({ gate, code, message })
  result.status = code === 'BACKEND_REQUIRED' ? 'backend_required' : 'blocked'
  result.canCreateQAReport = false
  result.canReviewPreview = false
  result.canRequestRevision = false
  result.canPlanFallback = false
  result.canProceedToExport = false
}

function addRequiredRecord(result: QaRevisionResult, record: RequiredRecord): void {
  result.requiredRecords.push(record)
}

function finalize(result: QaRevisionResult): QaRevisionResult {
  if (result.blockers.length === 0) {
    result.status = result.status === 'mock_only' ? 'mock_only' : 'ready'
    result.canCreateQAReport = false
    result.canReviewPreview = true
    result.canRequestRevision = true
    result.canPlanFallback = true
    result.canProceedToExport = false
    result.nextAction = 'QA/revision/fallback readiness boundary passed. Prompt 11 still does not execute QA, revisions, fallback actions, workers, providers, tools, media processing, rendering, storage writes, or credit mutation.'
    return result
  }

  result.status = result.blockers.some((blocker) => blocker.code === 'BACKEND_REQUIRED') ? 'backend_required' : 'blocked'
  result.nextAction = result.status === 'backend_required'
    ? 'Use a future reviewed QA/revision/fallback worker/runtime milestone before writing QA reports, revision requests, fallback decisions, repair plans, or downstream execution records.'
    : 'Resolve listed QA/revision/fallback blockers before proceeding.'
  return result
}

function summarizeRow(row: Row | null, allowedKeys: string[]): Record<string, unknown> | null {
  if (!row) return null
  return sanitizeJson(Object.fromEntries(allowedKeys.map((key) => [key, row[key]])))
}

function statusValue(row: Row | null | undefined): string {
  return stringValue(row?.status) ??
    stringValue(row?.qa_status) ??
    stringValue(row?.review_status) ??
    stringValue(row?.revision_status) ??
    stringValue(row?.export_status) ??
    ''
}

function auditPreview(eventName: string, input: QaRevisionInput): Record<string, unknown> {
  return sanitizeJson({
    eventName,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedSnapshotId: input.approvedSnapshotId,
    renderId: input.renderId,
    exportId: input.exportId,
    qaReportId: input.qaReportId,
    previewReviewId: input.previewReviewId,
    revisionRequestId: input.revisionRequestId,
  })
}

function boundarySummary(boundary: string, input: QaRevisionInput): Record<string, unknown> {
  return sanitizeJson({
    boundary,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedSnapshotId: input.approvedSnapshotId,
    renderId: input.renderId,
    exportId: input.exportId,
    severity: input.severity,
    blockerStatus: input.blockerStatus,
    requiresNewGeneration: input.requiresNewGeneration,
    requiresNewRender: input.requiresNewRender,
    requiresCreditEstimate: input.requiresCreditEstimate,
    requiresApproval: input.requiresApproval,
    fallbackDecisionType: input.fallbackDecisionType,
    repairPlanType: input.repairPlanType,
    affectedSegmentIds: input.affectedSegmentIds,
    affectedAssetIds: input.affectedAssetIds,
    affectedRenderIds: input.affectedRenderIds,
  })
}

async function applyProjectAccessGate(context: ServiceContext, input: QaRevisionInput, result: QaRevisionResult): Promise<void> {
  const access = await createProjectService(context).checkProjectAccess(input.projectId)
  if (access.status !== 'ready' || !access.hasAccess) {
    addBlocker(result, 'ProjectAccessGate', 'BACKEND_REQUIRED', 'Project/workspace access requires backend service-role runtime before QA/revision/fallback boundaries can proceed.')
    addRequiredRecord(result, {
      table: 'projects',
      id: input.projectId,
      status: 'backend_required',
      note: 'Project access could not be verified without backend runtime.',
    })
    return
  }

  const projectWorkspaceId = stringValue(access.project?.workspaceId)
  if (projectWorkspaceId && projectWorkspaceId !== input.workspaceId) {
    addBlocker(result, 'WorkspaceGate', 'WORKSPACE_ACCESS_DENIED', 'Project does not belong to the requested workspace.')
  }

  addRequiredRecord(result, {
    table: 'projects',
    id: input.projectId,
    status: 'present',
    note: 'Project access verified through workspace membership.',
  })
}

function adminUnavailable(context: ServiceContext): boolean {
  return !context.clients.admin || context.env.mockOnly
}

function addRuntimeBlocker(result: QaRevisionResult, input: QaRevisionInput, scope: string): void {
  result.idempotencySummary = input.idempotencyKey
    ? { idempotencyKeyPresent: true, mutationBoundaryOnly: true }
    : undefined
  result.auditEvent = auditPreview(`qa_revision.${scope}.backend_required`, input)
  addBlocker(result, 'QaRevisionRuntimeGate', 'BACKEND_REQUIRED', `${scope} is backend-required and fail-closed in Prompt 11.`)
}

export function createQaRevisionService(context: ServiceContext) {
  async function createReadiness(input: QaRevisionInput, scope: string): Promise<QaRevisionResult> {
    assertSafeMetadata(input.metadata)
    const result = baseResult([
      'Prompt 11 does not execute QA workers, inspect media, regenerate assets, call providers, render/export media, execute tools, mutate credits, create jobs, upload/download storage, or run remote Supabase.',
    ])
    await applyProjectAccessGate(context, input, result)

    addRequiredRecord(result, {
      table: 'approved_plan_snapshots',
      id: input.approvedSnapshotId,
      status: input.approvedSnapshotId ? 'present' : 'missing',
      note: 'QA/revision/fallback work must reference the approved execution snapshot before downstream execution.',
    })
    addRequiredRecord(result, {
      table: 'credit_reservations',
      id: input.creditReservationId,
      status: input.creditReservationId ? 'present' : 'backend_required',
      note: 'Revision/fallback paths that spend credits require an active reservation in a later milestone.',
    })
    addRequiredRecord(result, {
      table: 'renders',
      id: input.renderId,
      status: input.renderId ? 'present' : 'missing',
      note: 'Preview review and export blockers depend on a project-scoped render/preview reference.',
    })

    result.qaSummary = boundarySummary(scope, input)
    result.previewReviewSummary = input.renderId ? boundarySummary('preview_review_reference', input) : null
    result.revisionSummary = boundarySummary('revision_boundary', input)
    result.fallbackSummary = boundarySummary('fallback_boundary', input)
    result.repairPlanSummary = boundarySummary('repair_plan_boundary', input)
    result.creditSummary = boundarySummary('credit_revision_boundary', input)
    result.exportBlockerSummary = boundarySummary('export_blocker_boundary', input)
    result.auditEvent = auditPreview(`qa_revision.${scope}.readiness_checked`, input)

    if (adminUnavailable(context)) {
      addBlocker(result, 'BackendReadinessGate', 'BACKEND_REQUIRED', 'Readiness summaries require backend service-role runtime for project-scoped QA/revision/fallback records.')
    }

    return finalize(result)
  }

  async function createBoundary(input: QaRevisionInput, scope: string): Promise<QaRevisionResult> {
    const result = await createReadiness(input, scope)
    addRuntimeBlocker(result, input, scope)
    return finalize(result)
  }

  async function getSingleRecord(input: QaRevisionInput, table: string, id: string | undefined, allowedKeys: string[], scope: string): Promise<QaRevisionResult> {
    const result = await createReadiness(input, scope)
    if (!id) {
      addBlocker(result, 'RecordReferenceGate', 'VALIDATION_FAILED', `${table} id is required.`)
      return finalize(result)
    }
    if (adminUnavailable(context)) {
      addBlocker(result, 'BackendReadGate', 'BACKEND_REQUIRED', `${table} read requires backend service-role runtime.`)
      return finalize(result)
    }

    const { data, error } = await context.clients.admin!
      .from(table)
      .select(allowedKeys.join(', '))
      .eq('id', id)
      .eq('project_id', input.projectId)
      .maybeSingle()

    throwOnSupabaseError(error)
    const summary = summarizeRow((data as Row | null) ?? null, allowedKeys)
    if (!summary) addBlocker(result, 'RecordReferenceGate', 'VALIDATION_FAILED', `${table} record was not found for the project.`)
    result.qaSummary = table === 'qa_reports' ? summary : result.qaSummary
    result.previewReviewSummary = table === 'preview_reviews' ? summary : result.previewReviewSummary
    result.revisionSummary = table === 'revision_requests' ? summary : result.revisionSummary
    result.fallbackSummary = table === 'qa_check_results' ? summary : result.fallbackSummary
    return finalize(result)
  }

  async function listRecords(input: QaRevisionInput, table: string, allowedKeys: string[], scope: string, filter?: { column: string; value: string | undefined }): Promise<QaRevisionResult> {
    const result = await createReadiness(input, scope)
    if (adminUnavailable(context)) {
      addBlocker(result, 'BackendReadGate', 'BACKEND_REQUIRED', `${table} listing requires backend service-role runtime.`)
      return finalize(result)
    }

    let query = context.clients.admin!
      .from(table)
      .select(allowedKeys.join(', '))
      .eq('project_id', input.projectId)
      .limit(50)

    if (filter?.value) query = query.eq(filter.column, filter.value)

    const { data, error } = await query
    throwOnSupabaseError(error)
    const rows = ((data ?? []) as Row[]).map((row) => summarizeRow(row, allowedKeys)).filter(isRecord)
    if (table === 'qa_reports') result.qaReports = rows
    if (table === 'qa_check_results') {
      result.qaBlockers = rows.filter((row) => BLOCKING_QA_STATUSES.has(statusValue(row)))
      if (result.qaBlockers.length > 0) {
        addBlocker(result, 'QABlockerGate', 'QA_BLOCKED_PREVIEW', 'Blocking QA records prevent final export readiness.')
      }
    }
    if (table === 'preview_reviews') result.previewReviews = rows
    if (table === 'review_comments') result.reviewComments = rows
    if (table === 'revision_requests') result.revisionRequests = rows
    return finalize(result)
  }

  return {
    checkQaReadiness(input: QaRevisionInput) {
      return createReadiness(input, 'qa_readiness')
    },
    createQaReportBoundary(input: QaRevisionInput) {
      return createBoundary(input, 'qa_report_create')
    },
    getQaReport(input: QaRevisionInput) {
      return getSingleRecord(input, 'qa_reports', input.qaReportId, ['id', 'project_id', 'approved_snapshot_id', 'render_id', 'status', 'qa_status', 'created_at', 'updated_at'], 'qa_report_get')
    },
    listQaReportsForProject(input: QaRevisionInput) {
      return listRecords(input, 'qa_reports', ['id', 'project_id', 'approved_snapshot_id', 'render_id', 'status', 'qa_status', 'created_at', 'updated_at'], 'qa_report_list')
    },
    listQaBlockers(input: QaRevisionInput) {
      return listRecords(input, 'qa_check_results', ['id', 'project_id', 'qa_report_id', 'status', 'severity', 'check_type', 'created_at', 'updated_at'], 'qa_blockers_list')
    },
    resolveQaBlockerBoundary(input: QaRevisionInput) {
      return createBoundary(input, 'qa_blocker_resolve_boundary')
    },
    createPreviewReviewBoundary(input: QaRevisionInput) {
      return createBoundary(input, 'preview_review_create')
    },
    getPreviewReview(input: QaRevisionInput) {
      return getSingleRecord(input, 'preview_reviews', input.previewReviewId, ['id', 'project_id', 'render_id', 'status', 'review_status', 'created_at', 'updated_at'], 'preview_review_get')
    },
    listPreviewReviewsForRender(input: QaRevisionInput) {
      return listRecords(input, 'preview_reviews', ['id', 'project_id', 'render_id', 'status', 'review_status', 'created_at', 'updated_at'], 'preview_review_list', { column: 'render_id', value: input.renderId })
    },
    createReviewCommentBoundary(input: QaRevisionInput) {
      return createBoundary(input, 'review_comment_create')
    },
    listReviewComments(input: QaRevisionInput) {
      return listRecords(input, 'review_comments', ['id', 'project_id', 'preview_review_id', 'status', 'created_at', 'updated_at'], 'review_comment_list', { column: 'preview_review_id', value: input.previewReviewId })
    },
    createRevisionRequestBoundary(input: QaRevisionInput) {
      return createBoundary(input, 'revision_request_create')
    },
    getRevisionRequest(input: QaRevisionInput) {
      return getSingleRecord(input, 'revision_requests', input.revisionRequestId, ['id', 'project_id', 'approved_snapshot_id', 'render_id', 'status', 'revision_status', 'created_at', 'updated_at'], 'revision_request_get')
    },
    listRevisionRequestsForProject(input: QaRevisionInput) {
      return listRecords(input, 'revision_requests', ['id', 'project_id', 'approved_snapshot_id', 'render_id', 'status', 'revision_status', 'created_at', 'updated_at'], 'revision_request_list')
    },
    checkRevisionEstimateReadiness(input: QaRevisionInput) {
      return createReadiness(input, 'revision_estimate_readiness')
    },
    checkRevisionApprovalRequired(input: QaRevisionInput) {
      return createReadiness(input, 'revision_approval_required')
    },
    checkFallbackReadiness(input: QaRevisionInput) {
      return createReadiness(input, 'fallback_readiness')
    },
    planFallbackDecisionBoundary(input: QaRevisionInput) {
      return createBoundary(input, 'fallback_decision_plan')
    },
    getFallbackDecision(input: QaRevisionInput) {
      return getSingleRecord(input, 'qa_check_results', input.fallbackDecisionId, ['id', 'project_id', 'qa_report_id', 'status', 'severity', 'check_type', 'created_at', 'updated_at'], 'fallback_decision_get')
    },
    checkRepairPlanReadiness(input: QaRevisionInput) {
      return createReadiness(input, 'repair_plan_readiness')
    },
    checkExportBlockers(input: QaRevisionInput) {
      return listRecords(input, 'qa_check_results', ['id', 'project_id', 'qa_report_id', 'status', 'severity', 'check_type', 'created_at', 'updated_at'], 'export_blockers_check')
    },
  }
}
