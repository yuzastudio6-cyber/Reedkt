import { ApiError } from '../errors/api-error'
import type { ApiErrorCode } from '../errors/error-codes'
import type { ServiceContext } from '../types'
import { createAuthService } from './auth-service'
import { createProjectService } from './project-service'
import { getRequiredAuthUserId, sanitizeJson, throwOnSupabaseError } from './service-helpers'

export type CreditRuntimeStatus = 'ready' | 'blocked' | 'backend_required'
export type CreditExecutionType = 'generation' | 'render' | 'export' | 'tool' | 'provider' | 'music' | 'sfx' | 'snapshot' | 'revision'
export type CreditMutationAction = 'estimate_create' | 'estimate_approve' | 'reservation_create' | 'reservation_spend' | 'reservation_release' | 'reservation_refund'

export interface CreditLineItemInput {
  label: string
  credits: number
  category?: string
  reason?: string
  metadata?: Record<string, unknown>
}

export interface CreditEstimateCreateInput {
  workspaceId: string
  projectId: string
  editPlanVersionId?: string
  approvedSnapshotId?: string
  lineItems: CreditLineItemInput[]
  estimateReason?: string
  metadata?: Record<string, unknown>
  idempotencyKey?: string
}

export interface CreditEstimateApprovalInput {
  workspaceId: string
  projectId: string
  creditEstimateId: string
  editPlanVersionId?: string
  approvalRecordId?: string
  approvedSnapshotId?: string
  idempotencyKey?: string
  metadata?: Record<string, unknown>
}

export interface CreditGateCheckInput {
  workspaceId: string
  projectId: string
  creditEstimateId?: string
  creditReservationId?: string
  approvedSnapshotId?: string
  editPlanVersionId?: string
  executionType: CreditExecutionType
  requestedCredits: number
  requiresApprovedSnapshot?: boolean
  metadata?: Record<string, unknown>
}

export interface CreditReservationCreateInput extends CreditGateCheckInput {
  creditEstimateId: string
  approvedSnapshotId: string
  idempotencyKey?: string
}

export interface CreditReservationMutationInput {
  workspaceId: string
  projectId: string
  creditReservationId: string
  creditEstimateId?: string
  approvedSnapshotId?: string
  amount?: number
  reason: string
  metadata?: Record<string, unknown>
  idempotencyKey?: string
}

interface CreditBlocker {
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

interface CreditRuntimeResult {
  status: CreditRuntimeStatus
  canProceed: boolean
  blockers: CreditBlocker[]
  warnings: string[]
  requiredRecords: RequiredRecord[]
  nextAction: string
  creditEstimate?: Record<string, unknown> | null
  creditReservation?: Record<string, unknown> | null
  wallet?: Record<string, unknown> | null
  ledgerEntries?: Record<string, unknown>[]
  intendedPayload?: Record<string, unknown>
  auditEvent?: Record<string, unknown>
}

interface Row {
  [key: string]: unknown
}

const APPROVED_ESTIMATE_STATUSES = new Set(['approved', 'accepted'])
const ACTIVE_RESERVATION_STATUSES = new Set(['reserved', 'active', 'partially_spent'])
const SPEND_BLOCKING_LEDGER_TYPES = new Set(['spend'])
const RELEASE_BLOCKING_LEDGER_TYPES = new Set(['reservation_release', 'refund', 'failed_generation_refund'])
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

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function numericValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  return undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function statusOf(value: unknown): string {
  return stringValue(value)?.toLowerCase() ?? ''
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
      'Credit runtime metadata must not include secrets, tokens, signed URLs, provider keys, service-role data, Stripe keys, or credentials.',
      400,
      { unsafePaths },
    )
  }
}

function baseResult(warnings: string[] = []): CreditRuntimeResult {
  return {
    status: 'ready',
    canProceed: true,
    blockers: [],
    warnings,
    requiredRecords: [],
    nextAction: 'No action required.',
  }
}

function addBlocker(result: CreditRuntimeResult, gate: string, code: ApiErrorCode, message: string): void {
  result.blockers.push({ gate, code, message })
  result.canProceed = false
  result.status = code === 'BACKEND_REQUIRED' ? 'backend_required' : 'blocked'
}

function addRequiredRecord(result: CreditRuntimeResult, record: RequiredRecord): void {
  result.requiredRecords.push(record)
}

function finalize(result: CreditRuntimeResult): CreditRuntimeResult {
  if (result.blockers.length === 0) {
    result.status = 'ready'
    result.canProceed = true
    result.nextAction = 'Credit gate is ready for the bounded check. Prompt 6 still does not start downstream execution.'
    return result
  }

  result.status = result.blockers.some((blocker) => blocker.code === 'BACKEND_REQUIRED') ? 'backend_required' : 'blocked'
  result.canProceed = false
  result.nextAction = result.status === 'backend_required'
    ? 'Use a reviewed backend transactional runtime before mutating credits.'
    : 'Resolve listed credit blockers before proceeding.'
  return result
}

function backendRequiredResult(scope: string, extraWarnings: string[] = []): CreditRuntimeResult {
  const result = baseResult([
    `${scope} requires backend service-role transactional runtime.`,
    'Prompt 6 does not reserve, spend, release, refund, call Stripe, create jobs, call providers, render media, execute tools, or mutate storage.',
    ...extraWarnings,
  ])
  addBlocker(result, 'BackendRuntimeGate', 'BACKEND_REQUIRED', `${scope} is backend-required and fail-closed in Prompt 6.`)
  return finalize(result)
}

function mutationBoundaryResult(action: CreditMutationAction, input: Record<string, unknown>, readiness?: CreditRuntimeResult): CreditRuntimeResult {
  const result = baseResult([
    'Credit mutation is fail-closed in Prompt 6 until a reviewed transactional RPC/service exists.',
    'No ledger, reservation, refund, estimate, Stripe, job, provider, render, tool, storage, or approved snapshot mutation occurred.',
  ])

  if (readiness) {
    result.blockers.push(...readiness.blockers)
    result.requiredRecords.push(...readiness.requiredRecords)
    result.creditEstimate = readiness.creditEstimate
    result.creditReservation = readiness.creditReservation
    result.wallet = readiness.wallet
  }

  result.intendedPayload = sanitizeJson({
    action,
    ...input,
    prompt6BoundaryOnly: true,
  })
  result.auditEvent = sanitizeJson({
    eventName: `credit.${action}.backend_required`,
    action,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    creditEstimateId: input.creditEstimateId,
    creditReservationId: input.creditReservationId,
  })

  addBlocker(result, 'TransactionalMutationGate', 'BACKEND_REQUIRED', `Credit action ${action} requires a future transactional backend implementation.`)
  return finalize(result)
}

function creditEstimateSummary(row: Row, items: Row[] = []) {
  return sanitizeJson({
    id: stringValue(row.id),
    projectId: stringValue(row.project_id),
    editPlanVersionId: stringValue(row.edit_plan_version_id),
    status: stringValue(row.status),
    totalCredits: numericValue(row.total_credits),
    fallbackAllowanceCredits: numericValue(row.fallback_allowance_credits),
    riskLevel: stringValue(row.risk_level),
    estimateVersion: numericValue(row.estimate_version),
    createdAt: stringValue(row.created_at),
    items: items.map((item) => sanitizeJson({
      id: stringValue(item.id),
      creditEstimateId: stringValue(item.credit_estimate_id),
      label: stringValue(item.label),
      credits: numericValue(item.credits),
      reason: stringValue(item.reason),
      category: stringValue(item.category),
    })),
  })
}

function reservationSummary(row: Row) {
  return sanitizeJson({
    id: stringValue(row.id),
    workspaceId: stringValue(row.workspace_id),
    projectId: stringValue(row.project_id),
    creditEstimateId: stringValue(row.credit_estimate_id),
    approvedSnapshotId: stringValue(row.approved_plan_snapshot_id),
    reservedCredits: numericValue(row.reserved_credits),
    status: stringValue(row.status),
    expiresAt: stringValue(row.expires_at),
    releasedAt: stringValue(row.released_at),
    createdAt: stringValue(row.created_at),
    updatedAt: stringValue(row.updated_at),
  })
}

function ledgerSummary(row: Row) {
  return sanitizeJson({
    id: stringValue(row.id),
    workspaceId: stringValue(row.workspace_id),
    projectId: stringValue(row.project_id),
    creditReservationId: stringValue(row.credit_reservation_id),
    approvedSnapshotId: stringValue(row.approved_plan_snapshot_id),
    entryType: stringValue(row.entry_type),
    creditsDelta: numericValue(row.credits_delta),
    reason: stringValue(row.reason),
    createdBy: stringValue(row.created_by),
    createdAt: stringValue(row.created_at),
  })
}

function isExpired(value: unknown): boolean {
  const expiresAt = stringValue(value)
  return Boolean(expiresAt && Number.isFinite(Date.parse(expiresAt)) && Date.parse(expiresAt) <= Date.now())
}

function amountFromEstimate(row: Row | null, fallback: number): number {
  return numericValue(row?.total_credits) ?? fallback
}

export function createCreditService(context: ServiceContext) {
  async function ensureWorkspaceAccess(workspaceId: string): Promise<CreditRuntimeResult | null> {
    try {
      const membership = await createAuthService(context).checkWorkspaceMembership(workspaceId)
      if (membership.status === 'backend_required') {
        return backendRequiredResult('Workspace membership check')
      }
      if (!membership.hasAccess) {
        throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Workspace was not found or is not accessible.', 403)
      }
      return null
    } catch (error) {
      if (error instanceof ApiError && error.code === 'BACKEND_REQUIRED') return backendRequiredResult('Workspace membership check')
      throw error
    }
  }

  async function ensureProjectAccess(projectId: string, workspaceId?: string): Promise<CreditRuntimeResult | null> {
    try {
      const projectAccess = await createProjectService(context).checkProjectAccess(projectId)
      if (projectAccess.status === 'backend_required') {
        return backendRequiredResult('Project access check')
      }
      if (workspaceId && projectAccess.project?.workspaceId !== workspaceId) {
        throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Project workspace does not match request workspace.', 403)
      }
      return null
    } catch (error) {
      if (error instanceof ApiError && error.code === 'BACKEND_REQUIRED') return backendRequiredResult('Project access check')
      throw error
    }
  }

  async function loadEstimate(creditEstimateId: string): Promise<{ estimate: Row | null; items: Row[] }> {
    if (!context.clients.admin || context.env.mockOnly) {
      return { estimate: null, items: [] }
    }

    const { data: estimateData, error: estimateError } = await context.clients.admin
      .from('credit_estimates')
      .select('id, project_id, edit_plan_version_id, estimate_version, total_credits, fallback_allowance_credits, risk_level, status, created_at')
      .eq('id', creditEstimateId)
      .maybeSingle()
    throwOnSupabaseError(estimateError, 'CREDIT_ESTIMATE_NOT_APPROVED')

    if (!estimateData) return { estimate: null, items: [] }

    const { data: itemData, error: itemError } = await context.clients.admin
      .from('credit_estimate_items')
      .select('id, credit_estimate_id, label, credits, reason, category')
      .eq('credit_estimate_id', creditEstimateId)
    throwOnSupabaseError(itemError)

    return {
      estimate: estimateData as Row,
      items: (itemData ?? []) as Row[],
    }
  }

  async function loadReservation(creditReservationId: string): Promise<Row | null> {
    if (!context.clients.admin || context.env.mockOnly) return null

    const { data, error } = await context.clients.admin
      .from('credit_reservations')
      .select('id, workspace_id, project_id, credit_estimate_id, approved_plan_snapshot_id, reserved_credits, status, expires_at, released_at, created_at, updated_at')
      .eq('id', creditReservationId)
      .maybeSingle()
    throwOnSupabaseError(error, 'CREDITS_NOT_RESERVED')

    return (data ?? null) as Row | null
  }

  async function loadApprovedSnapshot(approvedSnapshotId: string): Promise<Row | null> {
    if (!context.clients.admin || context.env.mockOnly) return null

    const { data, error } = await context.clients.admin
      .from('approved_plan_snapshots')
      .select('id, workspace_id, project_id, edit_plan_version_id, credit_estimate_id, credit_reservation_id, snapshot_status, status, immutable')
      .eq('id', approvedSnapshotId)
      .maybeSingle()
    throwOnSupabaseError(error, 'APPROVED_SNAPSHOT_REQUIRED')

    return (data ?? null) as Row | null
  }

  async function loadLedgerForReservation(creditReservationId: string): Promise<Row[]> {
    if (!context.clients.admin || context.env.mockOnly) return []

    const { data, error } = await context.clients.admin
      .from('credit_ledger_entries')
      .select('id, workspace_id, project_id, credit_reservation_id, approved_plan_snapshot_id, entry_type, credits_delta, reason, created_by, created_at')
      .eq('credit_reservation_id', creditReservationId)
      .order('created_at', { ascending: true })
    throwOnSupabaseError(error)

    return (data ?? []) as Row[]
  }

  async function buildGateReadiness(input: CreditGateCheckInput): Promise<CreditRuntimeResult> {
    getRequiredAuthUserId(context)
    assertSafeMetadata(input.metadata)

    if (input.requestedCredits < 0) {
      throw new ApiError('VALIDATION_FAILED', 'requestedCredits must be zero or greater.', 400)
    }

    const accessBlock = await ensureProjectAccess(input.projectId, input.workspaceId)
    if (accessBlock) return accessBlock

    if (!context.clients.admin || context.env.mockOnly) {
      return backendRequiredResult('Credit gate check')
    }

    const result = baseResult([
      'Credit gate check is read-only and does not start jobs, providers, rendering, tools, storage execution, Stripe, or credit mutation.',
    ])

    if (input.creditEstimateId) {
      const { estimate, items } = await loadEstimate(input.creditEstimateId)
      if (!estimate) {
        addBlocker(result, 'CreditEstimateExistsGate', 'CREDIT_ESTIMATE_NOT_APPROVED', 'Credit estimate was not found.')
        addRequiredRecord(result, { table: 'credit_estimates', id: input.creditEstimateId, status: 'missing', note: 'Approved estimate is required for credit-bearing execution.' })
      } else if (stringValue(estimate.project_id) !== input.projectId) {
        addBlocker(result, 'CreditEstimateScopeGate', 'CREDIT_ESTIMATE_NOT_APPROVED', 'Credit estimate project does not match request project.')
        addRequiredRecord(result, { table: 'credit_estimates', id: input.creditEstimateId, status: 'present', note: 'Estimate exists but scope is invalid.' })
      } else if (input.editPlanVersionId && stringValue(estimate.edit_plan_version_id) !== input.editPlanVersionId) {
        addBlocker(result, 'CreditEstimateScopeGate', 'CREDIT_ESTIMATE_NOT_APPROVED', 'Credit estimate edit plan version does not match request.')
      } else if (!APPROVED_ESTIMATE_STATUSES.has(statusOf(estimate.status))) {
        addBlocker(result, 'CreditEstimateApprovedGate', 'CREDIT_ESTIMATE_NOT_APPROVED', 'Credit estimate must be approved or accepted.')
        addRequiredRecord(result, { table: 'credit_estimates', id: input.creditEstimateId, status: 'present', note: `Status is ${statusOf(estimate.status) || 'missing'}.` })
      } else {
        result.creditEstimate = creditEstimateSummary(estimate, items)
        addRequiredRecord(result, { table: 'credit_estimates', id: input.creditEstimateId, status: 'present', note: 'Approved estimate is present.' })
      }
    } else if (input.requestedCredits > 0) {
      addBlocker(result, 'CreditEstimateExistsGate', 'CREDIT_ESTIMATE_NOT_APPROVED', 'Credit-bearing execution requires a credit estimate.')
      addRequiredRecord(result, { table: 'credit_estimates', status: 'missing', note: 'No creditEstimateId was provided.' })
    }

    if (input.requiresApprovedSnapshot !== false || input.approvedSnapshotId) {
      if (!input.approvedSnapshotId) {
        addBlocker(result, 'ApprovedSnapshotGate', 'APPROVED_SNAPSHOT_REQUIRED', 'Credit-bearing execution requires an approved snapshot.')
        addRequiredRecord(result, { table: 'approved_plan_snapshots', status: 'missing', note: 'No approvedSnapshotId was provided.' })
      } else {
        const snapshot = await loadApprovedSnapshot(input.approvedSnapshotId)
        if (!snapshot) {
          addBlocker(result, 'ApprovedSnapshotGate', 'APPROVED_SNAPSHOT_REQUIRED', 'Approved snapshot was not found.')
          addRequiredRecord(result, { table: 'approved_plan_snapshots', id: input.approvedSnapshotId, status: 'missing', note: 'Snapshot is required before execution.' })
        } else if (
          stringValue(snapshot.project_id) !== input.projectId ||
          (stringValue(snapshot.workspace_id) && stringValue(snapshot.workspace_id) !== input.workspaceId) ||
          (input.creditEstimateId && stringValue(snapshot.credit_estimate_id) !== input.creditEstimateId)
        ) {
          addBlocker(result, 'ApprovedSnapshotGate', 'APPROVED_SNAPSHOT_REQUIRED', 'Approved snapshot scope does not match credit request.')
        } else if (!['approved', 'locked'].includes(statusOf(snapshot.snapshot_status) || statusOf(snapshot.status))) {
          addBlocker(result, 'ApprovedSnapshotGate', 'APPROVED_SNAPSHOT_REQUIRED', 'Approved snapshot is not approved/locked.')
        } else {
          addRequiredRecord(result, { table: 'approved_plan_snapshots', id: input.approvedSnapshotId, status: 'present', note: 'Approved snapshot is present and scoped.' })
        }
      }
    }

    if (input.creditReservationId) {
      const reservation = await loadReservation(input.creditReservationId)
      if (!reservation) {
        addBlocker(result, 'CreditReservationExistsGate', 'CREDITS_NOT_RESERVED', 'Credit reservation was not found.')
        addRequiredRecord(result, { table: 'credit_reservations', id: input.creditReservationId, status: 'missing', note: 'Active reservation is required.' })
      } else {
        result.creditReservation = reservationSummary(reservation)
        addRequiredRecord(result, { table: 'credit_reservations', id: input.creditReservationId, status: 'present', note: 'Reservation is present.' })

        if (
          stringValue(reservation.workspace_id) !== input.workspaceId ||
          stringValue(reservation.project_id) !== input.projectId ||
          (input.creditEstimateId && stringValue(reservation.credit_estimate_id) !== input.creditEstimateId) ||
          (input.approvedSnapshotId && stringValue(reservation.approved_plan_snapshot_id) && stringValue(reservation.approved_plan_snapshot_id) !== input.approvedSnapshotId)
        ) {
          addBlocker(result, 'CreditReservationScopeGate', 'CREDITS_NOT_RESERVED', 'Credit reservation scope does not match request.')
        }

        if (!ACTIVE_RESERVATION_STATUSES.has(statusOf(reservation.status))) {
          addBlocker(result, 'CreditReservationActiveGate', 'CREDITS_NOT_RESERVED', 'Credit reservation must be reserved, active, or partially_spent.')
        }

        if (isExpired(reservation.expires_at)) {
          addBlocker(result, 'CreditReservationActiveGate', 'CREDITS_NOT_RESERVED', 'Credit reservation is expired.')
        }

        const reservedCredits = numericValue(reservation.reserved_credits) ?? 0
        const requiredCredits = amountFromEstimate(result.creditEstimate as Row | null, input.requestedCredits)
        if (requiredCredits > 0 && reservedCredits < requiredCredits) {
          addBlocker(result, 'CreditReservationAmountGate', 'INSUFFICIENT_CREDITS', 'Reserved credits are lower than required credits.')
        }

        const ledgerRows = await loadLedgerForReservation(input.creditReservationId)
        const hasSpend = ledgerRows.some((row) => SPEND_BLOCKING_LEDGER_TYPES.has(statusOf(row.entry_type)))
        if (hasSpend && ['generation', 'render', 'export', 'tool', 'provider', 'music', 'sfx'].includes(input.executionType)) {
          addBlocker(result, 'NoDoubleSpendGate', 'CREDITS_NOT_RESERVED', 'Reservation already has a spend ledger entry.')
        }
      }
    } else if (input.requestedCredits > 0) {
      addBlocker(result, 'CreditReservationExistsGate', 'CREDITS_NOT_RESERVED', 'Credit-bearing execution requires an active reservation.')
      addRequiredRecord(result, { table: 'credit_reservations', status: 'missing', note: 'No creditReservationId was provided.' })
    }

    addRequiredRecord(result, { table: 'credit_ledger_entries', status: 'not_applicable', note: 'Ledger remains append-only; Prompt 6 does not insert ledger entries.' })
    return finalize(result)
  }

  async function assertReservationMutationReadiness(input: CreditReservationMutationInput, action: CreditMutationAction): Promise<CreditRuntimeResult> {
    getRequiredAuthUserId(context)
    assertSafeMetadata(input.metadata)
    const amount = input.amount ?? 0
    if (amount < 0) {
      throw new ApiError('VALIDATION_FAILED', 'amount must be zero or greater.', 400)
    }

    const accessBlock = await ensureProjectAccess(input.projectId, input.workspaceId)
    if (accessBlock) return accessBlock
    if (!context.clients.admin || context.env.mockOnly) return backendRequiredResult(`Credit ${action}`)

    const result = baseResult([`Credit ${action} readiness is read-only in Prompt 6.`])
    const reservation = await loadReservation(input.creditReservationId)
    if (!reservation) {
      addBlocker(result, 'CreditReservationExistsGate', 'CREDITS_NOT_RESERVED', 'Credit reservation was not found.')
      return finalize(result)
    }

    result.creditReservation = reservationSummary(reservation)
    if (
      stringValue(reservation.workspace_id) !== input.workspaceId ||
      stringValue(reservation.project_id) !== input.projectId ||
      (input.creditEstimateId && stringValue(reservation.credit_estimate_id) !== input.creditEstimateId) ||
      (input.approvedSnapshotId && stringValue(reservation.approved_plan_snapshot_id) && stringValue(reservation.approved_plan_snapshot_id) !== input.approvedSnapshotId)
    ) {
      addBlocker(result, 'CreditReservationScopeGate', 'CREDITS_NOT_RESERVED', 'Credit reservation scope does not match mutation request.')
    }

    const ledgerRows = await loadLedgerForReservation(input.creditReservationId)
    const entryTypes = new Set(ledgerRows.map((row) => statusOf(row.entry_type)))
    if (action === 'reservation_spend' && entryTypes.has('spend')) {
      addBlocker(result, 'NoDoubleSpendGate', 'CREDITS_NOT_RESERVED', 'Reservation already has a spend ledger entry.')
    }
    if ((action === 'reservation_release' || action === 'reservation_refund') && [...entryTypes].some((entryType) => RELEASE_BLOCKING_LEDGER_TYPES.has(entryType))) {
      addBlocker(result, 'RefundEligibilityGate', 'CREDITS_NOT_RESERVED', 'Reservation already has release/refund ledger activity.')
    }

    if (action === 'reservation_spend' && !ACTIVE_RESERVATION_STATUSES.has(statusOf(reservation.status))) {
      addBlocker(result, 'CreditReservationActiveGate', 'CREDITS_NOT_RESERVED', 'Only an active/reserved reservation can be spent.')
    }

    return finalize(result)
  }

  return {
    async getCreditWallet(workspaceId: string): Promise<CreditRuntimeResult> {
      getRequiredAuthUserId(context)
      const accessBlock = await ensureWorkspaceAccess(workspaceId)
      if (accessBlock) return accessBlock
      if (!context.clients.admin || context.env.mockOnly) return backendRequiredResult('Credit wallet read')

      const result = baseResult([
        'Prompt 6 does not target legacy credit_wallets or credit_wallet_balance_view as canonical production tables.',
      ])
      const { data, error } = await context.clients.admin
        .from('credit_ledger_entries')
        .select('id, workspace_id, project_id, credit_reservation_id, approved_plan_snapshot_id, entry_type, credits_delta, reason, created_by, created_at')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(50)
      throwOnSupabaseError(error)

      const entries = ((data ?? []) as Row[]).map(ledgerSummary)
      const totalDelta = entries.reduce((total, entry) => total + (numericValue(entry.creditsDelta) ?? 0), 0)
      result.wallet = sanitizeJson({
        workspaceId,
        canonicalSource: 'credit_ledger_entries',
        ledgerCreditDeltaTotal: totalDelta,
        legacyWalletTablesTargeted: false,
      })
      result.ledgerEntries = entries
      return finalize(result)
    },

    async createCreditEstimate(input: CreditEstimateCreateInput): Promise<CreditRuntimeResult> {
      getRequiredAuthUserId(context)
      assertSafeMetadata(input.metadata)
      input.lineItems.forEach((line) => assertSafeMetadata(line.metadata))
      const accessBlock = await ensureProjectAccess(input.projectId, input.workspaceId)
      if (accessBlock) return accessBlock
      return mutationBoundaryResult('estimate_create', {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        editPlanVersionId: input.editPlanVersionId,
        approvedSnapshotId: input.approvedSnapshotId,
        totalCredits: input.lineItems.reduce((total, line) => total + line.credits, 0),
        idempotencyKey: input.idempotencyKey,
      })
    },

    async getCreditEstimate(creditEstimateId: string, workspaceId?: string): Promise<CreditRuntimeResult> {
      getRequiredAuthUserId(context)
      if (!context.clients.admin || context.env.mockOnly) return backendRequiredResult('Credit estimate read')
      const { estimate, items } = await loadEstimate(creditEstimateId)
      if (!estimate) throw new ApiError('CREDIT_ESTIMATE_NOT_APPROVED', 'Credit estimate was not found.', 404)
      const projectId = stringValue(estimate.project_id)
      if (!projectId) throw new ApiError('INTERNAL_ERROR', 'Credit estimate is missing project_id.', 500)
      const accessBlock = await ensureProjectAccess(projectId, workspaceId)
      if (accessBlock) return accessBlock

      const result = baseResult(['Credit estimate read is metadata-only and does not reserve or spend credits.'])
      result.creditEstimate = creditEstimateSummary(estimate, items)
      return finalize(result)
    },

    async approveCreditEstimate(input: CreditEstimateApprovalInput): Promise<CreditRuntimeResult> {
      const readiness = await buildGateReadiness({
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        creditEstimateId: input.creditEstimateId,
        approvedSnapshotId: input.approvedSnapshotId,
        editPlanVersionId: input.editPlanVersionId,
        executionType: 'snapshot',
        requestedCredits: 0,
        requiresApprovedSnapshot: Boolean(input.approvedSnapshotId),
        metadata: input.metadata,
      })
      return mutationBoundaryResult('estimate_approve', {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        creditEstimateId: input.creditEstimateId,
        approvalRecordId: input.approvalRecordId,
        approvedSnapshotId: input.approvedSnapshotId,
        idempotencyKey: input.idempotencyKey,
      }, readiness)
    },

    async checkCreditGate(input: CreditGateCheckInput): Promise<CreditRuntimeResult> {
      return buildGateReadiness(input)
    },

    async createCreditReservation(input: CreditReservationCreateInput): Promise<CreditRuntimeResult> {
      const readiness = await buildGateReadiness({
        ...input,
        requiresApprovedSnapshot: true,
      })
      return mutationBoundaryResult('reservation_create', {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        creditEstimateId: input.creditEstimateId,
        approvedSnapshotId: input.approvedSnapshotId,
        requestedCredits: input.requestedCredits,
        executionType: input.executionType,
        idempotencyKey: input.idempotencyKey,
      }, readiness)
    },

    async getCreditReservation(creditReservationId: string, workspaceId?: string, projectId?: string): Promise<CreditRuntimeResult> {
      getRequiredAuthUserId(context)
      if (!context.clients.admin || context.env.mockOnly) return backendRequiredResult('Credit reservation read')
      const reservation = await loadReservation(creditReservationId)
      if (!reservation) throw new ApiError('CREDITS_NOT_RESERVED', 'Credit reservation was not found.', 404)

      const resolvedProjectId = stringValue(reservation.project_id)
      const resolvedWorkspaceId = stringValue(reservation.workspace_id)
      if (!resolvedProjectId || !resolvedWorkspaceId) throw new ApiError('INTERNAL_ERROR', 'Credit reservation is missing project/workspace scope.', 500)
      if (workspaceId && workspaceId !== resolvedWorkspaceId) throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Credit reservation workspace does not match request.', 403)
      if (projectId && projectId !== resolvedProjectId) throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Credit reservation project does not match request.', 403)
      const accessBlock = await ensureProjectAccess(resolvedProjectId, resolvedWorkspaceId)
      if (accessBlock) return accessBlock

      const result = baseResult(['Credit reservation read is metadata-only and does not mutate credits.'])
      result.creditReservation = reservationSummary(reservation)
      return finalize(result)
    },

    async spendCreditReservation(input: CreditReservationMutationInput): Promise<CreditRuntimeResult> {
      const readiness = await assertReservationMutationReadiness(input, 'reservation_spend')
      return mutationBoundaryResult('reservation_spend', input as unknown as Record<string, unknown>, readiness)
    },

    async releaseCreditReservation(input: CreditReservationMutationInput): Promise<CreditRuntimeResult> {
      const readiness = await assertReservationMutationReadiness(input, 'reservation_release')
      return mutationBoundaryResult('reservation_release', input as unknown as Record<string, unknown>, readiness)
    },

    async refundCreditReservation(input: CreditReservationMutationInput): Promise<CreditRuntimeResult> {
      const readiness = await assertReservationMutationReadiness(input, 'reservation_refund')
      return mutationBoundaryResult('reservation_refund', input as unknown as Record<string, unknown>, readiness)
    },

    async listLedgerForProject(projectId: string, workspaceId: string): Promise<CreditRuntimeResult> {
      getRequiredAuthUserId(context)
      const accessBlock = await ensureProjectAccess(projectId, workspaceId)
      if (accessBlock) return accessBlock
      if (!context.clients.admin || context.env.mockOnly) return backendRequiredResult('Credit ledger read')

      const { data, error } = await context.clients.admin
        .from('credit_ledger_entries')
        .select('id, workspace_id, project_id, credit_reservation_id, approved_plan_snapshot_id, entry_type, credits_delta, reason, created_by, created_at')
        .eq('workspace_id', workspaceId)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(100)
      throwOnSupabaseError(error)

      const result = baseResult(['Credit ledger read is metadata-only. Ledger remains append-only and Prompt 6 does not insert entries.'])
      result.ledgerEntries = ((data ?? []) as Row[]).map(ledgerSummary)
      return finalize(result)
    },

    async getCreditBlockers(input: CreditGateCheckInput): Promise<CreditRuntimeResult> {
      return buildGateReadiness(input)
    },

    async checkCreditReadiness(input: CreditGateCheckInput): Promise<CreditRuntimeResult> {
      return buildGateReadiness(input)
    },
  }
}
