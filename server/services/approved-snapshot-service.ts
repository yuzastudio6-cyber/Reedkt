import { createHash } from 'node:crypto'
import { ApiError } from '../errors/api-error'
import type { ApiErrorCode } from '../errors/error-codes'
import type { ServiceContext } from '../types'
import { createProjectService } from './project-service'
import { getRequiredAuthUserId, nowIso, sanitizeJson, throwOnSupabaseError } from './service-helpers'

export type ApprovedSnapshotGateStatus = 'passed' | 'blocked' | 'backend_required'
export type ApprovedSnapshotReadinessStatus = 'ready' | 'blocked' | 'backend_required'

export interface CreateApprovedSnapshotInput {
  workspaceId: string
  projectId: string
  chatSessionId?: string
  editPlanId: string
  editSessionId: string
  editPlanVersionId: string
  approvalRecordId: string
  creditEstimateId: string
  creditReservationId: string
  approvedByUserId?: string
  idempotencyKey?: string
  snapshotVersion: number
  snapshotJson: Record<string, unknown>
  planHash: string
  creditHash: string
  sourceSequenceHash: string
  timingHash: string
  expectedSnapshotHash?: string
}

export interface ApprovedSnapshotReadinessInput extends Omit<CreateApprovedSnapshotInput, 'snapshotVersion'> {
  snapshotVersion?: number
}

interface ApprovedSnapshotGate {
  gate: string
  status: ApprovedSnapshotGateStatus
  message: string
  code?: ApiErrorCode
}

interface ApprovedSnapshotBlocker {
  gate: string
  code: ApiErrorCode
  message: string
}

interface ReadinessResult {
  status: ApprovedSnapshotReadinessStatus
  ready: boolean
  gates: ApprovedSnapshotGate[]
  blockers: ApprovedSnapshotBlocker[]
  warnings: string[]
}

interface SnapshotRow {
  id?: string
  workspace_id?: string | null
  project_id?: string | null
  chat_session_id?: string | null
  edit_session_id?: string | null
  edit_plan_id?: string | null
  edit_plan_version_id?: string | null
  credit_estimate_id?: string | null
  credit_approval_id?: string | null
  credit_reservation_id?: string | null
  approved_by?: string | null
  approved_by_user_id?: string | null
  approved_at?: string | null
  snapshot_version?: string | number | null
  snapshot_status?: string | null
  status?: string | null
  snapshot_json?: Record<string, unknown> | null
  plan_hash?: string | null
  credit_hash?: string | null
  source_sequence_hash?: string | null
  timing_hash?: string | null
  immutable?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

interface RecordRow {
  [key: string]: unknown
}

const APPROVED_PLAN_STATUSES = new Set(['approved'])
const APPROVED_ESTIMATE_STATUSES = new Set(['approved', 'accepted'])
const ACTIVE_RESERVATION_STATUSES = new Set(['reserved', 'active', 'partially_spent'])
const BLOCKED_KEY_TERMS = [
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
]
const RAW_CHAT_KEY_TERMS = ['rawchat', 'rawchatmessages']

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function normalizeKey(key: string): string {
  return key.replace(/[-_\s.]/g, '').toLowerCase()
}

function hasUnsafeKey(key: string): boolean {
  const normalized = normalizeKey(key)
  return BLOCKED_KEY_TERMS.some((term) => normalized.includes(term)) ||
    RAW_CHAT_KEY_TERMS.some((term) => normalized.includes(term))
}

function collectUnsafeJsonPaths(value: unknown, path = 'snapshotJson', paths: string[] = []): string[] {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectUnsafeJsonPaths(item, `${path}[${index}]`, paths))
    return paths
  }

  if (!isRecord(value)) return paths

  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`
    if (hasUnsafeKey(key)) paths.push(childPath)
    collectUnsafeJsonPaths(child, childPath, paths)
  }

  return paths
}

function assertSafeSnapshotJson(snapshotJson: Record<string, unknown>): void {
  const unsafePaths = collectUnsafeJsonPaths(snapshotJson)
  if (unsafePaths.length > 0) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Approved snapshot JSON must not include secrets, tokens, signed URLs, provider keys, service-role data, or raw chat as execution source.',
      400,
      { unsafePaths },
    )
  }
}

function stableNormalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableNormalize)
  if (!isRecord(value)) return value

  return Object.keys(value)
    .sort()
    .reduce<Record<string, unknown>>((normalized, key) => {
      normalized[key] = stableNormalize(value[key])
      return normalized
    }, {})
}

function removeStoredSnapshotHash(snapshotJson: Record<string, unknown>): Record<string, unknown> {
  const normalized = stableNormalize(snapshotJson)
  if (!isRecord(normalized)) return {}

  const integrity = normalized.integrity
  if (!isRecord(integrity) || !Object.prototype.hasOwnProperty.call(integrity, 'snapshotHash')) {
    return normalized
  }

  const integrityWithoutHash = Object.fromEntries(
    Object.entries(integrity).filter(([key]) => key !== 'snapshotHash'),
  )
  return {
    ...normalized,
    integrity: integrityWithoutHash,
  }
}

function deterministicSnapshotHash(snapshotJson: Record<string, unknown>): string {
  return createHash('sha256')
    .update(JSON.stringify(stableNormalize(snapshotJson)))
    .digest('hex')
}

function buildSnapshotJsonWithIntegrity(input: CreateApprovedSnapshotInput, approvedByUserId: string) {
  const safeSnapshotJson = sanitizeJson(input.snapshotJson)
  const baseSnapshotJson = {
    ...safeSnapshotJson,
    integrity: {
      ...(isRecord(safeSnapshotJson.integrity) ? safeSnapshotJson.integrity : {}),
      contractVersion: 'approved_plan_snapshot_v1',
      approvalRecordId: input.approvalRecordId,
      editPlanId: input.editPlanId,
      editPlanVersionId: input.editPlanVersionId,
      creditEstimateId: input.creditEstimateId,
      creditReservationId: input.creditReservationId,
      approvedByUserId,
      planHash: input.planHash,
      creditHash: input.creditHash,
      sourceSequenceHash: input.sourceSequenceHash,
      timingHash: input.timingHash,
    },
  }
  const snapshotHash = deterministicSnapshotHash(baseSnapshotJson)

  if (input.expectedSnapshotHash && input.expectedSnapshotHash !== snapshotHash) {
    throw new ApiError('VALIDATION_FAILED', 'Approved snapshot hash did not match the expected deterministic hash.', 409, {
      expectedSnapshotHash: input.expectedSnapshotHash,
      computedSnapshotHash: snapshotHash,
    })
  }

  return {
    snapshotHash,
    snapshotJson: {
      ...baseSnapshotJson,
      integrity: {
        ...baseSnapshotJson.integrity,
        snapshotHash,
      },
    },
  }
}

function snapshotSummary(row: SnapshotRow) {
  return {
    id: stringValue(row.id),
    workspaceId: stringValue(row.workspace_id),
    projectId: stringValue(row.project_id),
    chatSessionId: stringValue(row.chat_session_id),
    editSessionId: stringValue(row.edit_session_id),
    editPlanId: stringValue(row.edit_plan_id),
    editPlanVersionId: stringValue(row.edit_plan_version_id),
    creditEstimateId: stringValue(row.credit_estimate_id),
    creditReservationId: stringValue(row.credit_reservation_id),
    compatibilityCreditApprovalId: stringValue(row.credit_approval_id),
    approvedByUserId: stringValue(row.approved_by_user_id) ?? stringValue(row.approved_by),
    approvedAt: stringValue(row.approved_at),
    snapshotVersion: row.snapshot_version,
    snapshotStatus: stringValue(row.snapshot_status) ?? stringValue(row.status),
    snapshotHash: isRecord(row.snapshot_json?.integrity) ? stringValue(row.snapshot_json.integrity.snapshotHash) : undefined,
    planHash: stringValue(row.plan_hash),
    creditHash: stringValue(row.credit_hash),
    sourceSequenceHash: stringValue(row.source_sequence_hash),
    timingHash: stringValue(row.timing_hash),
    immutable: row.immutable === true,
    createdAt: stringValue(row.created_at),
    updatedAt: stringValue(row.updated_at),
  }
}

function addGate(
  gates: ApprovedSnapshotGate[],
  blockers: ApprovedSnapshotBlocker[],
  gate: string,
  status: ApprovedSnapshotGateStatus,
  message: string,
  code?: ApiErrorCode,
) {
  gates.push({ gate, status, message, ...(code ? { code } : {}) })
  if (status !== 'passed' && code) blockers.push({ gate, code, message })
}

function statusOf(value: unknown): string {
  return stringValue(value)?.toLowerCase() ?? ''
}

function matches(value: unknown, expected: string): boolean {
  return stringValue(value) === expected
}

function isExpired(value: unknown): boolean {
  const expiresAt = stringValue(value)
  return Boolean(expiresAt && Number.isFinite(Date.parse(expiresAt)) && Date.parse(expiresAt) <= Date.now())
}

function extractStorageObjectRecordIds(snapshotJson: Record<string, unknown>): string[] {
  const ids = new Set<string>()

  function visit(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }

    if (!isRecord(value)) return

    for (const [key, child] of Object.entries(value)) {
      const normalized = normalizeKey(key)
      if ((normalized === 'storageobjectrecordid' || normalized === 'storageobjectrecordids') && typeof child === 'string') {
        ids.add(child)
      }
      if (normalized === 'storageobjectrecordids' && Array.isArray(child)) {
        child.forEach((item) => {
          if (typeof item === 'string' && item.trim()) ids.add(item.trim())
        })
      }
      visit(child)
    }
  }

  visit(snapshotJson)
  return [...ids]
}

function hasTimingContext(snapshotJson: Record<string, unknown>): boolean {
  return Boolean(
    isRecord(snapshotJson.masterTimingPlan) ||
    isRecord(snapshotJson.timingPlan) ||
    isRecord(snapshotJson.timing) ||
    (isRecord(snapshotJson.executionConstraints) && isRecord(snapshotJson.executionConstraints.timing)),
  )
}

function hasBlockingQa(snapshotJson: Record<string, unknown>): boolean {
  const qaBlockers = snapshotJson.qaBlockers
  if (Array.isArray(qaBlockers) && qaBlockers.length > 0) return true

  const qaPlan = snapshotJson.qaPlan
  if (!isRecord(qaPlan)) return false
  return Array.isArray(qaPlan.blockingIssues) && qaPlan.blockingIssues.length > 0
}

function readinessStatus(blockers: ApprovedSnapshotBlocker[]): ApprovedSnapshotReadinessStatus {
  if (blockers.length === 0) return 'ready'
  return blockers.some((blocker) => blocker.code === 'BACKEND_REQUIRED') ? 'backend_required' : 'blocked'
}

function throwForReadiness(readiness: ReadinessResult): void {
  if (readiness.ready) return
  const blocker = readiness.blockers[0]
  if (!blocker) throw new ApiError('VALIDATION_FAILED', 'Approved snapshot readiness failed.', 409)
  throw new ApiError(blocker.code, blocker.message, blocker.code === 'BACKEND_REQUIRED' ? 501 : 409, {
    readiness,
  })
}

export function createApprovedSnapshotService(context: ServiceContext) {
  async function checkSnapshotReadiness(input: ApprovedSnapshotReadinessInput): Promise<ReadinessResult> {
    const gates: ApprovedSnapshotGate[] = []
    const blockers: ApprovedSnapshotBlocker[] = []
    const warnings: string[] = [
      'Approved snapshot readiness checks do not start jobs, workers, provider calls, rendering, tools, or credit mutation.',
    ]

    let approvedByUserId: string | undefined
    try {
      approvedByUserId = getRequiredAuthUserId(context)
      addGate(gates, blockers, 'AuthGate', 'passed', 'Authenticated user context is present.')
    } catch {
      addGate(gates, blockers, 'AuthGate', 'blocked', 'Approved snapshot actions require authenticated user context.', 'AUTH_REQUIRED')
    }

    if (input.idempotencyKey) {
      addGate(gates, blockers, 'IdempotencyGate', 'passed', 'Idempotency key is present for the mutation route.')
    } else {
      addGate(gates, blockers, 'IdempotencyGate', 'blocked', 'Approved snapshot creation requires an Idempotency-Key header.', 'IDEMPOTENCY_KEY_REQUIRED')
    }

    try {
      assertSafeSnapshotJson(input.snapshotJson)
      addGate(gates, blockers, 'SnapshotJsonSafetyGate', 'passed', 'Snapshot JSON does not contain blocked secret, signed URL, provider key, service-role, or raw chat fields.')
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Approved snapshot JSON is not safe to persist.'
      addGate(gates, blockers, 'SnapshotJsonSafetyGate', 'blocked', message, 'VALIDATION_FAILED')
    }

    if (hasTimingContext(input.snapshotJson) && input.timingHash.trim().length > 0) {
      addGate(gates, blockers, 'TimingValidationGate', 'passed', 'Snapshot includes timing context and timing hash.')
    } else {
      addGate(gates, blockers, 'TimingValidationGate', 'blocked', 'Approved snapshot requires frozen timing context and a timing hash before worker execution can ever begin.', 'VALIDATION_FAILED')
    }

    if (hasBlockingQa(input.snapshotJson)) {
      addGate(gates, blockers, 'QABlockerGate', 'blocked', 'Snapshot contains blocking QA issues and cannot become execution-ready.', 'QA_BLOCKED_PREVIEW')
    } else {
      addGate(gates, blockers, 'QABlockerGate', 'passed', 'No blocking QA issues are present in the snapshot JSON.')
    }

    try {
      const projectAccess = await createProjectService(context).checkProjectAccess(input.projectId)
      if (projectAccess.status === 'backend_required') {
        addGate(gates, blockers, 'ProjectAccessGate', 'backend_required', 'Project access cannot be verified without backend service-role runtime.', 'BACKEND_REQUIRED')
      } else if (projectAccess.project?.workspaceId !== input.workspaceId) {
        addGate(gates, blockers, 'WorkspaceGate', 'blocked', 'Project workspace does not match the requested workspace.', 'WORKSPACE_ACCESS_DENIED')
      } else {
        addGate(gates, blockers, 'ProjectAccessGate', 'passed', 'Workspace membership grants access to the project.')
        addGate(gates, blockers, 'WorkspaceGate', 'passed', 'Project belongs to the requested workspace.')
      }
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError('WORKSPACE_ACCESS_DENIED', 'Project access could not be verified.', 403)
      addGate(gates, blockers, 'ProjectAccessGate', 'blocked', apiError.message, apiError.code)
    }

    if (!context.clients.admin || context.env.mockOnly) {
      addGate(gates, blockers, 'PlanApprovalGate', 'backend_required', 'Canonical edit_plan_versions approval state requires backend service-role runtime.', 'BACKEND_REQUIRED')
      addGate(gates, blockers, 'CreditEstimateApprovalGate', 'backend_required', 'Canonical credit_estimates approval state requires backend service-role runtime.', 'BACKEND_REQUIRED')
      addGate(gates, blockers, 'ApprovalRecordGate', 'backend_required', 'Canonical approval_records validation requires backend service-role runtime.', 'BACKEND_REQUIRED')
      addGate(gates, blockers, 'CreditReservationGate', 'backend_required', 'Canonical credit_reservations validation requires backend service-role runtime.', 'BACKEND_REQUIRED')
      addGate(gates, blockers, 'ApprovedSnapshotPersistenceGate', 'backend_required', 'approved_plan_snapshots writes require backend service-role runtime.', 'BACKEND_REQUIRED')
      const status = readinessStatus(blockers)
      return { status, ready: status === 'ready', gates, blockers, warnings }
    }

    const admin = context.clients.admin

    const { data: planData, error: planError } = await admin
      .from('edit_plan_versions')
      .select('id, project_id, edit_session_id, status, approved_at, approved_by, credit_estimate_id')
      .eq('id', input.editPlanVersionId)
      .maybeSingle()
    throwOnSupabaseError(planError, 'PLAN_NOT_APPROVED')

    const plan = (planData ?? null) as RecordRow | null
    if (!plan) {
      addGate(gates, blockers, 'PlanApprovalGate', 'blocked', 'Approved edit plan version was not found.', 'PLAN_NOT_APPROVED')
    } else if (!matches(plan.project_id, input.projectId) || !matches(plan.edit_session_id, input.editSessionId)) {
      addGate(gates, blockers, 'PlanApprovalGate', 'blocked', 'Edit plan version does not match the requested project/session boundary.', 'PLAN_NOT_APPROVED')
    } else if (!APPROVED_PLAN_STATUSES.has(statusOf(plan.status)) || !stringValue(plan.approved_at)) {
      addGate(gates, blockers, 'PlanApprovalGate', 'blocked', 'Edit plan version must be approved before snapshot creation.', 'PLAN_NOT_APPROVED')
    } else if (approvedByUserId && stringValue(plan.approved_by) && stringValue(plan.approved_by) !== approvedByUserId) {
      addGate(gates, blockers, 'PlanApprovalGate', 'blocked', 'Authenticated user does not match the plan approval user.', 'WORKSPACE_ACCESS_DENIED')
    } else {
      addGate(gates, blockers, 'PlanApprovalGate', 'passed', 'Canonical edit_plan_versions row is approved and scoped to the project/session.')
    }

    const { data: estimateData, error: estimateError } = await admin
      .from('credit_estimates')
      .select('id, project_id, edit_plan_version_id, status')
      .eq('id', input.creditEstimateId)
      .maybeSingle()
    throwOnSupabaseError(estimateError, 'CREDIT_ESTIMATE_NOT_APPROVED')

    const estimate = (estimateData ?? null) as RecordRow | null
    if (!estimate) {
      addGate(gates, blockers, 'CreditEstimateApprovalGate', 'blocked', 'Approved credit estimate was not found.', 'CREDIT_ESTIMATE_NOT_APPROVED')
    } else if (!matches(estimate.project_id, input.projectId) || !matches(estimate.edit_plan_version_id, input.editPlanVersionId)) {
      addGate(gates, blockers, 'CreditEstimateApprovalGate', 'blocked', 'Credit estimate does not match the approved edit plan version.', 'CREDIT_ESTIMATE_NOT_APPROVED')
    } else if (!APPROVED_ESTIMATE_STATUSES.has(statusOf(estimate.status))) {
      addGate(gates, blockers, 'CreditEstimateApprovalGate', 'blocked', 'Credit estimate must be approved or accepted before snapshot creation.', 'CREDIT_ESTIMATE_NOT_APPROVED')
    } else {
      addGate(gates, blockers, 'CreditEstimateApprovalGate', 'passed', 'Canonical credit_estimates row is approved for the edit plan version.')
    }

    const { data: approvalData, error: approvalError } = await admin
      .from('approval_records')
      .select('id, project_id, edit_session_id, edit_plan_version_id, credit_estimate_id, approved_by, approved_at, approved_snapshot_id')
      .eq('id', input.approvalRecordId)
      .maybeSingle()
    throwOnSupabaseError(approvalError, 'PLAN_NOT_APPROVED')

    const approval = (approvalData ?? null) as RecordRow | null
    if (!approval) {
      addGate(gates, blockers, 'ApprovalRecordGate', 'blocked', 'Canonical approval record was not found.', 'PLAN_NOT_APPROVED')
    } else if (
      !matches(approval.project_id, input.projectId) ||
      !matches(approval.edit_session_id, input.editSessionId) ||
      !matches(approval.edit_plan_version_id, input.editPlanVersionId) ||
      !matches(approval.credit_estimate_id, input.creditEstimateId)
    ) {
      addGate(gates, blockers, 'ApprovalRecordGate', 'blocked', 'Approval record does not match the plan version and credit estimate.', 'PLAN_NOT_APPROVED')
    } else if (!stringValue(approval.approved_at)) {
      addGate(gates, blockers, 'ApprovalRecordGate', 'blocked', 'Approval record must have approved_at before snapshot creation.', 'PLAN_NOT_APPROVED')
    } else if (approvedByUserId && stringValue(approval.approved_by) !== approvedByUserId) {
      addGate(gates, blockers, 'ApprovalRecordGate', 'blocked', 'Authenticated user does not match the canonical approval record approver.', 'WORKSPACE_ACCESS_DENIED')
    } else if (stringValue(approval.approved_snapshot_id)) {
      addGate(gates, blockers, 'ApprovalRecordGate', 'blocked', 'Approval record is already linked to an approved snapshot.', 'VALIDATION_FAILED')
    } else {
      addGate(gates, blockers, 'ApprovalRecordGate', 'passed', 'Canonical approval_records row is approved and still available for snapshot creation.')
    }

    const { data: reservationData, error: reservationError } = await admin
      .from('credit_reservations')
      .select('id, workspace_id, project_id, credit_estimate_id, status, expires_at')
      .eq('id', input.creditReservationId)
      .maybeSingle()
    throwOnSupabaseError(reservationError, 'CREDITS_NOT_RESERVED')

    const reservation = (reservationData ?? null) as RecordRow | null
    if (!reservation) {
      addGate(gates, blockers, 'CreditReservationGate', 'blocked', 'Active credit reservation was not found.', 'CREDITS_NOT_RESERVED')
    } else if (
      !matches(reservation.workspace_id, input.workspaceId) ||
      !matches(reservation.project_id, input.projectId) ||
      !matches(reservation.credit_estimate_id, input.creditEstimateId)
    ) {
      addGate(gates, blockers, 'CreditReservationGate', 'blocked', 'Credit reservation does not match workspace, project, and estimate.', 'CREDITS_NOT_RESERVED')
    } else if (!ACTIVE_RESERVATION_STATUSES.has(statusOf(reservation.status))) {
      addGate(gates, blockers, 'CreditReservationGate', 'blocked', 'Credit reservation must be active/reserved before snapshot creation.', 'CREDITS_NOT_RESERVED')
    } else if (isExpired(reservation.expires_at)) {
      addGate(gates, blockers, 'CreditReservationGate', 'blocked', 'Credit reservation is expired.', 'CREDITS_NOT_RESERVED')
    } else {
      addGate(gates, blockers, 'CreditReservationGate', 'passed', 'Canonical credit_reservations row is active for the estimate.')
    }

    const storageObjectRecordIds = extractStorageObjectRecordIds(input.snapshotJson)
    if (storageObjectRecordIds.length === 0) {
      addGate(gates, blockers, 'StorageObjectGate', 'passed', 'Snapshot does not declare required canonical storage object records.')
    } else {
      const { data: storageData, error: storageError } = await admin
        .from('storage_object_records')
        .select('id, workspace_id, project_id')
        .in('id', storageObjectRecordIds)
      throwOnSupabaseError(storageError, 'STORAGE_OBJECT_NOT_FOUND')

      const rows = (storageData ?? []) as RecordRow[]
      const foundIds = new Set(rows.map((row) => stringValue(row.id)).filter(Boolean))
      const missingIds = storageObjectRecordIds.filter((id) => !foundIds.has(id))
      const crossScopeRows = rows.filter((row) =>
        stringValue(row.workspace_id) !== input.workspaceId ||
        (stringValue(row.project_id) && stringValue(row.project_id) !== input.projectId),
      )

      if (missingIds.length > 0 || crossScopeRows.length > 0) {
        addGate(gates, blockers, 'StorageObjectGate', 'blocked', 'Snapshot references missing or cross-project storage object records.', 'STORAGE_OBJECT_NOT_FOUND')
      } else {
        addGate(gates, blockers, 'StorageObjectGate', 'passed', 'Declared storage object records exist within the workspace/project boundary.')
      }
    }

    addGate(gates, blockers, 'ToolRuntimeReadinessGate', 'passed', 'Tool execution remains future/blocked; snapshot creation does not execute tools.')
    addGate(gates, blockers, 'ProviderReadinessGate', 'passed', 'Provider execution remains future/blocked; snapshot creation does not call providers.')
    addGate(gates, blockers, 'ApprovedSnapshotPersistenceGate', 'passed', 'Backend service-role runtime is available for approved_plan_snapshots persistence.')

    const status = readinessStatus(blockers)
    return { status, ready: status === 'ready', gates, blockers, warnings }
  }

  async function getSnapshotRow(snapshotId: string): Promise<SnapshotRow> {
    if (!context.clients.admin || context.env.mockOnly) {
      throw new ApiError('BACKEND_REQUIRED', 'Approved snapshot reads require backend service-role runtime so project access can be verified.', 501)
    }

    const { data, error } = await context.clients.admin
      .from('approved_plan_snapshots')
      .select('id, workspace_id, project_id, chat_session_id, edit_session_id, edit_plan_id, edit_plan_version_id, credit_estimate_id, credit_approval_id, credit_reservation_id, approved_by, approved_by_user_id, approved_at, snapshot_version, snapshot_status, status, snapshot_json, plan_hash, credit_hash, source_sequence_hash, timing_hash, immutable, created_at, updated_at')
      .eq('id', snapshotId)
      .maybeSingle()

    throwOnSupabaseError(error, 'APPROVED_SNAPSHOT_REQUIRED')
    if (!data) throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Approved snapshot was not found.', 404)
    return data as SnapshotRow
  }

  async function assertProjectAccessForRow(row: SnapshotRow, expectedWorkspaceId?: string) {
    const projectId = stringValue(row.project_id)
    if (!projectId) throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Approved snapshot is missing project scope.', 404)
    const projectAccess = await createProjectService(context).checkProjectAccess(projectId)
    if (projectAccess.status === 'backend_required') {
      throw new ApiError('BACKEND_REQUIRED', 'Project access cannot be verified without backend service-role runtime.', 501)
    }
    const workspaceId = stringValue(row.workspace_id) ?? projectAccess.project?.workspaceId
    if (expectedWorkspaceId && workspaceId !== expectedWorkspaceId) {
      throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Approved snapshot workspace does not match request scope.', 403)
    }
    return projectAccess
  }

  return {
    async checkSnapshotReadiness(input: ApprovedSnapshotReadinessInput) {
      return checkSnapshotReadiness(input)
    },

    async getSnapshotBlockers(input: ApprovedSnapshotReadinessInput) {
      const readiness = await checkSnapshotReadiness(input)
      return { readiness, blockers: readiness.blockers, warnings: readiness.warnings }
    },

    async createApprovedSnapshot(input: CreateApprovedSnapshotInput) {
      const approvedByUserId = context.auth?.userId ?? input.approvedByUserId
      if (!approvedByUserId) throw new ApiError('AUTH_REQUIRED', 'Approved snapshot requires an authenticated approver.', 401)
      if (!input.idempotencyKey) throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for approved snapshot creation.', 400)

      const readiness = await checkSnapshotReadiness(input)
      throwForReadiness(readiness)

      if (!context.clients.admin || context.env.mockOnly) {
        throw new ApiError('BACKEND_REQUIRED', 'Approved snapshot creation requires backend service-role runtime.', 501)
      }

      assertSafeSnapshotJson(input.snapshotJson)
      const { snapshotHash, snapshotJson } = buildSnapshotJsonWithIntegrity(input, approvedByUserId)
      const approvedAt = nowIso()

      const { data, error } = await context.clients.admin
        .from('approved_plan_snapshots')
        .insert({
          workspace_id: input.workspaceId,
          project_id: input.projectId,
          chat_session_id: input.chatSessionId ?? null,
          edit_session_id: input.editSessionId,
          edit_plan_id: input.editPlanId,
          edit_plan_version_id: input.editPlanVersionId,
          credit_estimate_id: input.creditEstimateId,
          credit_approval_id: null,
          credit_reservation_id: input.creditReservationId,
          approved_by: approvedByUserId,
          approved_by_user_id: approvedByUserId,
          approved_at: approvedAt,
          snapshot_version: `v${input.snapshotVersion}`,
          status: 'approved',
          snapshot_status: 'approved',
          snapshot_json: snapshotJson,
          immutable: true,
          plan_hash: input.planHash,
          credit_hash: input.creditHash,
          source_sequence_hash: input.sourceSequenceHash,
          timing_hash: input.timingHash,
        })
        .select('*')
        .single()

      throwOnSupabaseError(error)
      const approvedPlanSnapshot = snapshotSummary(data as SnapshotRow)
      return {
        approvedPlanSnapshot: {
          ...approvedPlanSnapshot,
          approvalRecordId: input.approvalRecordId,
          snapshotHash,
          compatibilityCreditApprovalId: null,
        },
        readiness,
        warnings: [
          ...readiness.warnings,
          'Approved snapshot was created as a record boundary only; no job, provider, render, tool, storage, or credit mutation was started.',
        ],
      }
    },

    async getApprovedSnapshot(snapshotId: string, workspaceId?: string) {
      const row = await getSnapshotRow(snapshotId)
      await assertProjectAccessForRow(row, workspaceId)

      return {
        approvedPlanSnapshot: snapshotSummary(row),
        warnings: ['Approved snapshot read returned scoped metadata only; workers still require future backend execution paths.'],
      }
    },

    async listApprovedSnapshotsForProject(projectId: string, workspaceId: string) {
      if (!context.clients.admin || context.env.mockOnly) {
        throw new ApiError('BACKEND_REQUIRED', 'Approved snapshot listing requires backend service-role runtime so project access can be verified.', 501)
      }

      const projectAccess = await createProjectService(context).checkProjectAccess(projectId)
      if (projectAccess.status === 'backend_required') {
        throw new ApiError('BACKEND_REQUIRED', 'Project access cannot be verified without backend service-role runtime.', 501)
      }
      if (projectAccess.project?.workspaceId !== workspaceId) {
        throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Project workspace does not match request scope.', 403)
      }

      const { data, error } = await context.clients.admin
        .from('approved_plan_snapshots')
        .select('id, workspace_id, project_id, chat_session_id, edit_session_id, edit_plan_id, edit_plan_version_id, credit_estimate_id, credit_approval_id, credit_reservation_id, approved_by, approved_by_user_id, approved_at, snapshot_version, snapshot_status, status, snapshot_json, plan_hash, credit_hash, source_sequence_hash, timing_hash, immutable, created_at, updated_at')
        .eq('project_id', projectId)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      throwOnSupabaseError(error)
      return {
        approvedPlanSnapshots: ((data ?? []) as SnapshotRow[]).map(snapshotSummary),
        warnings: ['Approved snapshot listing returned scoped metadata only.'],
      }
    },

    async verifySnapshotIntegrity(snapshotId: string, expectedSnapshotHash?: string, workspaceId?: string) {
      const row = await getSnapshotRow(snapshotId)
      await assertProjectAccessForRow(row, workspaceId)

      const snapshotJson = row.snapshot_json ?? {}
      const recomputedSnapshotHash = deterministicSnapshotHash(removeStoredSnapshotHash(snapshotJson))
      const storedSnapshotHash = isRecord(snapshotJson.integrity) ? stringValue(snapshotJson.integrity.snapshotHash) : undefined
      const expectedHash = expectedSnapshotHash ?? storedSnapshotHash
      const verified = Boolean(expectedHash && recomputedSnapshotHash === expectedHash && storedSnapshotHash === expectedHash)

      return {
        integrity: {
          snapshotId,
          verified,
          expectedSnapshotHash: expectedHash ?? null,
          storedSnapshotHash: storedSnapshotHash ?? null,
          recomputedSnapshotHash,
          immutable: row.immutable === true,
          snapshotStatus: stringValue(row.snapshot_status) ?? stringValue(row.status),
        },
        warnings: [
          'Integrity verification recomputes the deterministic snapshot hash only; it does not start worker execution.',
        ],
      }
    },
  }
}
