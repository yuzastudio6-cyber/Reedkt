import { createHash } from 'node:crypto'

import { inspectForSecretLikeValues } from '../../src/backend/cloud/cloud-runtime-contracts'
import { nowIso, sanitizeJson } from './service-helpers'

export type InternalBetaCreditReservationLocalRuntimeStatus =
  | 'local_credit_reservation_validated_no_remote_mutation'
  | 'blocked_invalid_credit_reservation_input'

export interface InternalBetaCreditReservationLocalRuntimeInput {
  workspaceId?: string
  projectId?: string
  userId?: string
  editPlanId?: string
  editPlanVersionId?: string
  approvedPlanSnapshotId?: string
  creditEstimateId?: string
  creditApprovalId?: string
  creditEstimateStatus?: 'draft' | 'ready_for_review' | 'approved' | 'expired' | 'revised' | 'cancelled'
  estimatedCredits?: number
  reservationPurpose?: 'internal_beta_preview' | 'internal_beta_export' | 'internal_beta_private_fixture'
  idempotencyKey?: string
  approvedByUserId?: string
  approvedAt?: string
  expiresAt?: string
  metadata?: Record<string, unknown>
}

export interface InternalBetaLocalCreditReservationRecord {
  id: string
  workspaceId: string
  projectId: string
  userId?: string
  editPlanId: string
  editPlanVersionId?: string
  approvedPlanSnapshotId: string
  creditEstimateId: string
  creditApprovalId: string
  status: 'reserved'
  reservedCredits: number
  spentCredits: 0
  releasedCredits: 0
  refundedCredits: 0
  reservationPurpose: NonNullable<InternalBetaCreditReservationLocalRuntimeInput['reservationPurpose']>
  idempotencyKeyHash: string
  approvedByUserId: string
  approvedAt: string
  reservedAt: string
  expiresAt?: string
  localOnly: true
  remoteCreditMutation: false
  stripePaymentProcessing: false
  metadata: Record<string, unknown>
}

export interface InternalBetaLocalCreditLedgerEntry {
  id: string
  reservationId: string
  workspaceId: string
  projectId: string
  creditEstimateId: string
  creditApprovalId: string
  entryType: 'reservation'
  amount: number
  localOnly: true
  remoteCreditMutation: false
  stripePaymentProcessing: false
  idempotencyKeyHash: string
  createdAt: string
  metadata: Record<string, unknown>
}

export interface InternalBetaCreditReservationLocalRuntimeSafety {
  routeExecution: false
  remoteSupabaseMutation: false
  sqlExecution: false
  serviceRoleRouteExecution: false
  serviceRoleSecretPayloadAccess: false
  frontendServiceRoleCredentialExposure: false
  realCreditMutation: false
  stripePaymentProcessing: false
  walletBalanceMutation: false
  jobEnqueue: false
  workerExecution: false
  workerDispatch: false
  providerModelCall: false
  rawPromptExecution: false
  renderExportExecution: false
  previewArtifactCreation: false
  finalExportCreation: false
  storageObjectCreation: false
  storageObjectRead: false
  signedUrlCreation: false
  publicArtifactCreation: false
  internalBetaUnlock: false
  externalBetaUnlock: false
  productionUnlock: false
}

export interface InternalBetaCreditReservationLocalRuntimeResult {
  ok: boolean
  status: InternalBetaCreditReservationLocalRuntimeStatus
  createdAt: string
  reservation?: InternalBetaLocalCreditReservationRecord
  ledgerEntry?: InternalBetaLocalCreditLedgerEntry
  reservationHash?: string
  validation: {
    ok: boolean
    errors: string[]
    warnings: string[]
  }
  localCreditReservationRecordCreated: boolean
  localLedgerEntryCreated: boolean
  localOnly: true
  remoteCreditMutation: false
  stripePaymentProcessing: false
  persistedToSupabase: false
  requiredBeforeRemoteCreditRuntime: string[]
  safety: InternalBetaCreditReservationLocalRuntimeSafety
  inputSummary: Record<string, unknown>
}

export const INTERNAL_BETA_CREDIT_RESERVATION_LOCAL_RUNTIME_RULE =
  'Credit reservation local runtime validates approved estimate reservation metadata without Stripe, Supabase, or real credit mutation.'

export const INTERNAL_BETA_CREDIT_RESERVATION_FORBIDDEN_INPUT_KEYS = [
  'rawChat',
  'rawUserMessage',
  'rawUserMessages',
  'rawPrompt',
  'promptText',
  'providerPrompt',
  'directPrompt',
  'signedUrl',
  'publicUrl',
  'serviceRoleKey',
  'stripeSecret',
  'paymentIntent',
]

const REQUIRED_REMOTE_CREDIT_GATES = [
  'approved_supabase_credential_context_present',
  'confirmed_supabase_target_rls_storage_validation',
  'service_role_credit_runtime_enablement',
  'append_only_credit_ledger_rls_validation',
  'wallet_balance_transaction_contract',
  'reservation_idempotency_key_enforcement',
  'job_completion_spend_release_refund_transaction_contract',
  'negative_no_generation_before_approval_regression',
  'stripe_payment_processing_separate_sandbox_gate',
]

const SAFETY_FALSE: InternalBetaCreditReservationLocalRuntimeSafety = {
  routeExecution: false,
  remoteSupabaseMutation: false,
  sqlExecution: false,
  serviceRoleRouteExecution: false,
  serviceRoleSecretPayloadAccess: false,
  frontendServiceRoleCredentialExposure: false,
  realCreditMutation: false,
  stripePaymentProcessing: false,
  walletBalanceMutation: false,
  jobEnqueue: false,
  workerExecution: false,
  workerDispatch: false,
  providerModelCall: false,
  rawPromptExecution: false,
  renderExportExecution: false,
  previewArtifactCreation: false,
  finalExportCreation: false,
  storageObjectCreation: false,
  storageObjectRead: false,
  signedUrlCreation: false,
  publicArtifactCreation: false,
  internalBetaUnlock: false,
  externalBetaUnlock: false,
  productionUnlock: false,
}

export function createInternalBetaCreditReservationLocalRuntime(
  input: InternalBetaCreditReservationLocalRuntimeInput,
): InternalBetaCreditReservationLocalRuntimeResult {
  const createdAt = nowIso()
  const errors: string[] = []
  const warnings: string[] = []

  requireNonEmpty(input.workspaceId, 'workspaceId', errors)
  requireNonEmpty(input.projectId, 'projectId', errors)
  requireNonEmpty(input.editPlanId, 'editPlanId', errors)
  requireNonEmpty(input.approvedPlanSnapshotId, 'approvedPlanSnapshotId', errors)
  requireNonEmpty(input.creditEstimateId, 'creditEstimateId', errors)
  requireNonEmpty(input.creditApprovalId, 'creditApprovalId', errors)
  requireNonEmpty(input.approvedByUserId, 'approvedByUserId', errors)
  requireNonEmpty(input.idempotencyKey, 'idempotencyKey', errors)

  if (input.creditEstimateStatus !== 'approved') {
    errors.push('creditEstimateStatus must be approved before local reservation metadata can be created.')
  }

  if (typeof input.estimatedCredits !== 'number' || !Number.isFinite(input.estimatedCredits)) {
    errors.push('estimatedCredits must be a finite number.')
  } else if (input.estimatedCredits < 0) {
    errors.push('estimatedCredits must not be negative.')
  }

  const forbiddenInputKeys = findForbiddenInputKeys({ metadata: input.metadata ?? {} })
  forbiddenInputKeys.forEach((path) => {
    errors.push(`Credit reservation input must not contain raw prompt, signed/public URL, Stripe secret, or service-role fields: ${path}.`)
  })

  const metadataSecretCheck = inspectForSecretLikeValues(input.metadata ?? {})
  errors.push(...metadataSecretCheck.errors)
  warnings.push(...metadataSecretCheck.warnings)

  if (errors.length > 0) {
    return createResult({ createdAt, status: 'blocked_invalid_credit_reservation_input', errors, warnings, input })
  }

  const approvedAt = input.approvedAt ?? createdAt
  const idempotencyKeyHash = sha256Hex(input.idempotencyKey ?? '')
  const reservationPurpose = input.reservationPurpose ?? 'internal_beta_preview'
  const reservationBasis = {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    userId: input.userId,
    editPlanId: input.editPlanId,
    editPlanVersionId: input.editPlanVersionId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    creditEstimateId: input.creditEstimateId,
    creditApprovalId: input.creditApprovalId,
    estimatedCredits: input.estimatedCredits,
    reservationPurpose,
    idempotencyKeyHash,
    approvedByUserId: input.approvedByUserId,
    approvedAt,
  }
  const reservationHash = sha256Hex(stableStringify(reservationBasis))
  const reservationId = `credit_reservation_${reservationHash.slice(0, 24)}`
  const metadata = {
    ...sanitizeJson(input.metadata ?? {}),
    localRuntime: true,
    persistenceMode: 'local_validation_only_no_supabase_write',
    realCreditMutation: false,
    stripePaymentProcessing: false,
  }
  const reservation: InternalBetaLocalCreditReservationRecord = {
    id: reservationId,
    workspaceId: input.workspaceId ?? '',
    projectId: input.projectId ?? '',
    userId: input.userId,
    editPlanId: input.editPlanId ?? '',
    editPlanVersionId: input.editPlanVersionId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId ?? '',
    creditEstimateId: input.creditEstimateId ?? '',
    creditApprovalId: input.creditApprovalId ?? '',
    status: 'reserved',
    reservedCredits: input.estimatedCredits ?? 0,
    spentCredits: 0,
    releasedCredits: 0,
    refundedCredits: 0,
    reservationPurpose,
    idempotencyKeyHash,
    approvedByUserId: input.approvedByUserId ?? '',
    approvedAt,
    reservedAt: createdAt,
    expiresAt: input.expiresAt,
    localOnly: true,
    remoteCreditMutation: false,
    stripePaymentProcessing: false,
    metadata,
  }
  const ledgerEntry: InternalBetaLocalCreditLedgerEntry = {
    id: `credit_ledger_reservation_${reservationHash.slice(0, 24)}`,
    reservationId,
    workspaceId: reservation.workspaceId,
    projectId: reservation.projectId,
    creditEstimateId: reservation.creditEstimateId,
    creditApprovalId: reservation.creditApprovalId,
    entryType: 'reservation',
    amount: reservation.reservedCredits,
    localOnly: true,
    remoteCreditMutation: false,
    stripePaymentProcessing: false,
    idempotencyKeyHash,
    createdAt,
    metadata: {
      localRuntime: true,
      futureRequiresBackendTransaction: true,
      realCreditMutation: false,
    },
  }

  return createResult({
    createdAt,
    status: 'local_credit_reservation_validated_no_remote_mutation',
    errors,
    warnings,
    input,
    reservation,
    ledgerEntry,
    reservationHash,
  })
}

function createResult(input: {
  createdAt: string
  status: InternalBetaCreditReservationLocalRuntimeStatus
  errors: string[]
  warnings: string[]
  input: InternalBetaCreditReservationLocalRuntimeInput
  reservation?: InternalBetaLocalCreditReservationRecord
  ledgerEntry?: InternalBetaLocalCreditLedgerEntry
  reservationHash?: string
}): InternalBetaCreditReservationLocalRuntimeResult {
  const ok = input.status === 'local_credit_reservation_validated_no_remote_mutation'

  return {
    ok,
    status: input.status,
    createdAt: input.createdAt,
    reservation: ok ? input.reservation : undefined,
    ledgerEntry: ok ? input.ledgerEntry : undefined,
    reservationHash: ok ? input.reservationHash : undefined,
    validation: {
      ok,
      errors: input.errors,
      warnings: input.warnings,
    },
    localCreditReservationRecordCreated: ok,
    localLedgerEntryCreated: ok,
    localOnly: true,
    remoteCreditMutation: false,
    stripePaymentProcessing: false,
    persistedToSupabase: false,
    requiredBeforeRemoteCreditRuntime: [...REQUIRED_REMOTE_CREDIT_GATES],
    safety: { ...SAFETY_FALSE },
    inputSummary: summarizeInput(input.input),
  }
}

function summarizeInput(input: InternalBetaCreditReservationLocalRuntimeInput): Record<string, unknown> {
  return {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    userId: input.userId,
    editPlanId: input.editPlanId,
    editPlanVersionId: input.editPlanVersionId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    creditEstimateId: input.creditEstimateId,
    creditApprovalId: input.creditApprovalId,
    creditEstimateStatus: input.creditEstimateStatus,
    estimatedCredits: input.estimatedCredits,
    reservationPurpose: input.reservationPurpose ?? 'internal_beta_preview',
    idempotencyKeyPresent: Boolean(input.idempotencyKey),
    approvedByUserId: input.approvedByUserId,
    approvedAt: input.approvedAt,
    expiresAt: input.expiresAt,
    metadataKeys: input.metadata ? Object.keys(sanitizeJson(input.metadata)).sort() : [],
  }
}

function requireNonEmpty(value: unknown, label: string, errors: string[]) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`${label} is required.`)
  }
}

function findForbiddenInputKeys(value: unknown, path = 'input'): string[] {
  if (!value || typeof value !== 'object') return []
  if (Array.isArray(value)) return value.flatMap((item, index) => findForbiddenInputKeys(item, `${path}[${index}]`))

  const result: string[] = []
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const nextPath = `${path}.${key}`
    if (INTERNAL_BETA_CREDIT_RESERVATION_FORBIDDEN_INPUT_KEYS.some((forbidden) => forbidden.toLowerCase() === key.toLowerCase())) {
      result.push(nextPath)
    }
    result.push(...findForbiddenInputKeys(nested, nextPath))
  }
  return result
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
