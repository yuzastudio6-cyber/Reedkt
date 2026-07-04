import type { ServiceContext } from '../types'
import { createCreditGateService } from '../services/credit-gate-service'

export type BetaPlatformCreditReservationHoldQaEnvironment = 'local_mock' | 'staging_persistent' | 'production_persistent'
export type BetaPlatformCreditReservationHoldQaStatus = 'passed' | 'blocked' | 'warning'
export type BetaPlatformCreditReservationHoldPersistenceMode =
  | 'mock_memory'
  | 'supabase_service_role'
  | 'blocked_without_explicit_persistent_qa'

export interface BetaPlatformCreditReservationHoldQaInput {
  workspaceId: string
  projectId: string
  sourceId: string
  sourceSha?: string
  environment?: BetaPlatformCreditReservationHoldQaEnvironment
  allowPersistentReservationHoldQa?: boolean
  editPlanId?: string
  creditWalletId?: string
  creditApprovalId?: string
  creditEstimateId?: string
  reservedCredits?: number
  expiresAt?: string
  notes?: string[]
}

export interface BetaPlatformCreditReservationHoldQaCheck {
  id: string
  label: string
  status: BetaPlatformCreditReservationHoldQaStatus
  evidence: string[]
  nextAction?: string
}

export interface BetaPlatformCreditReservationHoldEvidence {
  reservationId: string
  creditEstimateId?: string
  creditWalletId?: string
  creditApprovalId?: string
  reservedCredits: number
  status: string
  idempotencyKey?: string
  replayed: boolean
}

export interface BetaPlatformCreditReservationHoldQaReport {
  reportId: string
  createdAt: string
  sourceId: string
  sourceSha?: string
  environment: BetaPlatformCreditReservationHoldQaEnvironment
  persistenceMode: BetaPlatformCreditReservationHoldPersistenceMode
  wouldClearWalletReserveBlocker: false
  reservationEvidence?: BetaPlatformCreditReservationHoldEvidence
  reservationHoldVerified: boolean
  idempotentReplayVerified: boolean
  stripeBoundaryPreserved: boolean
  serviceFeeExcluded: boolean
  checks: BetaPlatformCreditReservationHoldQaCheck[]
  missingProductionEvidence: string[]
  notes: string[]
}

export async function runBetaPlatformCreditReservationHoldQa(
  context: ServiceContext,
  input: BetaPlatformCreditReservationHoldQaInput,
  idempotencyKey: string,
): Promise<BetaPlatformCreditReservationHoldQaReport> {
  const createdAt = new Date().toISOString()
  const requestedEnvironment = input.environment ?? 'local_mock'
  const hasPersistentRuntime = Boolean(context.clients.admin && !context.env.mockOnly)

  if (hasPersistentRuntime && input.allowPersistentReservationHoldQa !== true) {
    return buildBlockedPersistentReport(input, requestedEnvironment, createdAt, [
      'service-role runtime is available',
      'persistent reservation hold QA requires allowPersistentReservationHoldQa=true',
      'no persistent credit reservation write was attempted',
    ], [
      'persistent reservation hold QA explicit confirmation',
      'approved deployed wallet, approval, and estimate fixture ids',
      'staging or production reservation hold evidence',
    ], 'Set allowPersistentReservationHoldQa=true with approved deployed fixture ids before running persistent reservation hold QA.')
  }

  if (hasPersistentRuntime) {
    const fixtureBlockers = persistentFixtureBlockers(input)
    if (fixtureBlockers.length > 0) {
      return buildBlockedPersistentReport(input, requestedEnvironment, createdAt, fixtureBlockers, [
        'approved persistent reservation hold fixture ids',
        'wallet balance before/after hold evidence',
        'staging or production reservation hold evidence',
      ], 'Provide deployed wallet, credit approval, credit estimate, and positive reserved credits before running persistent reservation hold QA.')
    }
  }

  const service = createCreditGateService(context)
  const reservationInput = {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId ?? 'platform-credit-reservation-hold-qa-edit-plan',
    creditWalletId: input.creditWalletId ?? 'platform-credit-reservation-hold-qa-credit-wallet',
    creditApprovalId: input.creditApprovalId ?? 'platform-credit-reservation-hold-qa-credit-approval',
    creditEstimateId: input.creditEstimateId ?? 'platform-credit-reservation-hold-qa-credit-estimate',
    reservedCredits: input.reservedCredits ?? 12,
    expiresAt: input.expiresAt,
    idempotencyKey,
    metadata: {
      qaHarness: 'beta-platform-credit-reservation-hold-qa',
      sourceId: input.sourceId,
      stripeCallAttempted: false,
      reeditproServiceFeeIncluded: false,
    },
  }
  const reservationResult = await service.reserveCredits(reservationInput)
  const replayResult = await service.reserveCredits(reservationInput)
  const reservation = normalizeReservation(reservationResult.creditReservation, replayResult.replayed === true)
  const reservationHoldVerified = reservation.status === 'reserved' && reservation.reservedCredits > 0
  const idempotentReplayVerified = reservation.replayed && reservation.reservationId === normalizeReservation(replayResult.creditReservation, true).reservationId

  return {
    reportId: `beta-platform-credit-reservation-hold-qa-${hashFragment(idempotencyKey, input.sourceId)}`,
    createdAt,
    sourceId: input.sourceId,
    sourceSha: input.sourceSha,
    environment: hasPersistentRuntime ? requestedEnvironment : 'local_mock',
    persistenceMode: hasPersistentRuntime ? 'supabase_service_role' : 'mock_memory',
    wouldClearWalletReserveBlocker: false,
    reservationEvidence: reservation,
    reservationHoldVerified,
    idempotentReplayVerified,
    stripeBoundaryPreserved: true,
    serviceFeeExcluded: true,
    checks: [
      check('reservation_hold', 'Credit reservation hold is recorded with a positive reserved credit amount', reservationHoldVerified, evidenceForReservation(reservation), 'Fix reservation hold before paid-production wallet reserve evidence can pass.'),
      check('idempotent_replay', 'Reservation idempotency replays without duplicate hold', idempotentReplayVerified, [`replayed=${reservation.replayed}`, `reservationId=${reservation.reservationId}`], 'Fix idempotent replay before paid-production wallet reserve evidence can pass.'),
      check('stripe_boundary', 'Stripe remains outside reservation hold QA', true, ['stripeCallAttempted=false', 'serviceFeeIncluded=false'], 'Keep Stripe separated from reservation hold QA.'),
    ],
    missingProductionEvidence: missingProductionEvidence(hasPersistentRuntime),
    notes: [
      ...(input.notes ?? []),
      hasPersistentRuntime
        ? 'This QA harness may write a controlled credit reservation row only when persistent QA is explicitly confirmed with deployed fixture ids.'
        : 'This QA harness uses mock memory only; no real reservation, wallet, ledger, Supabase, or Stripe mutation occurred.',
      'Transactional reservation RPC, wallet balance hold/readback, and deployed RLS/member readback remain separate production gates.',
      'The report is blocker-reduction evidence only; it does not enable beta, paid production, media processing, providers, workers, or public delivery.',
    ],
  }
}

function buildBlockedPersistentReport(
  input: BetaPlatformCreditReservationHoldQaInput,
  environment: BetaPlatformCreditReservationHoldQaEnvironment,
  createdAt: string,
  evidence: string[],
  missingProductionEvidence: string[],
  nextAction: string,
): BetaPlatformCreditReservationHoldQaReport {
  return {
    reportId: `beta-platform-credit-reservation-hold-qa-blocked-${hashFragment(input.workspaceId, input.projectId, input.sourceId)}`,
    createdAt,
    sourceId: input.sourceId,
    sourceSha: input.sourceSha,
    environment,
    persistenceMode: 'blocked_without_explicit_persistent_qa',
    wouldClearWalletReserveBlocker: false,
    reservationHoldVerified: false,
    idempotentReplayVerified: false,
    stripeBoundaryPreserved: true,
    serviceFeeExcluded: true,
    checks: [{
      id: 'persistent_reservation_hold_qa_requires_explicit_approval',
      label: 'Persistent reservation hold QA requires explicit confirmation and approved fixture ids before non-mock writes',
      status: 'blocked',
      evidence,
      nextAction,
    }],
    missingProductionEvidence,
    notes: [
      ...(input.notes ?? []),
      'No persistent write was attempted because persistent reservation hold QA must be explicitly confirmed with approved deployed fixture ids.',
    ],
  }
}

function persistentFixtureBlockers(input: BetaPlatformCreditReservationHoldQaInput): string[] {
  return [
    isUuid(input.workspaceId) ? undefined : 'workspaceId must be a deployed UUID fixture.',
    isUuid(input.projectId) ? undefined : 'projectId must be a deployed UUID fixture.',
    isUuid(input.creditWalletId) ? undefined : 'creditWalletId must be a deployed UUID fixture.',
    isUuid(input.creditApprovalId) ? undefined : 'creditApprovalId must be a deployed UUID fixture.',
    isUuid(input.creditEstimateId) ? undefined : 'creditEstimateId must be a deployed UUID fixture.',
    Number.isInteger(input.reservedCredits) && (input.reservedCredits ?? 0) > 0 ? undefined : 'reservedCredits must be a positive integer.',
  ].filter((item): item is string => Boolean(item))
}

function normalizeReservation(value: unknown, replayed: boolean): BetaPlatformCreditReservationHoldEvidence {
  const record = isRecord(value) ? value : {}
  return {
    reservationId: stringValue(record.id) ?? 'reservation-id-missing',
    creditEstimateId: stringValue(record.creditEstimateId) ?? stringValue(record.credit_estimate_id),
    creditWalletId: stringValue(record.creditWalletId) ?? stringValue(record.credit_wallet_id),
    creditApprovalId: stringValue(record.creditApprovalId) ?? stringValue(record.credit_approval_id),
    reservedCredits: numberValue(record.reservedCredits) ?? numberValue(record.reserved_credits) ?? 0,
    status: stringValue(record.status) ?? 'unknown',
    idempotencyKey: stringValue(record.idempotencyKey) ?? stringValue(record.idempotency_key),
    replayed,
  }
}

function check(
  id: string,
  label: string,
  passed: boolean,
  evidence: string[],
  nextAction: string,
): BetaPlatformCreditReservationHoldQaCheck {
  return {
    id,
    label,
    status: passed ? 'passed' : 'blocked',
    evidence,
    ...(passed ? {} : { nextAction }),
  }
}

function evidenceForReservation(reservation: BetaPlatformCreditReservationHoldEvidence): string[] {
  return [
    `reservationId=${reservation.reservationId}`,
    `status=${reservation.status}`,
    `reservedCredits=${reservation.reservedCredits}`,
    `creditEstimateId=${reservation.creditEstimateId ?? 'missing'}`,
    `creditWalletId=${reservation.creditWalletId ?? 'missing'}`,
    `creditApprovalId=${reservation.creditApprovalId ?? 'missing'}`,
  ]
}

function missingProductionEvidence(hasPersistentRuntime: boolean): string[] {
  return [
    hasPersistentRuntime
      ? 'deployed transactional reservation RPC evidence'
      : 'staging or production credit reservation migration deployment evidence',
    'transactional reservation RPC evidence',
    'wallet balance before/after reservation hold readback evidence',
    'service-role-only reservation mutation evidence from deployed runtime',
    'authenticated RLS member reservation readback evidence',
    'reservation hold idempotency evidence from deployed runtime',
    'Stripe boundary owner approval evidence',
    'monitoring and billing QA evidence from staging or production',
    'deployment, security, storage, legal, support, billing, and operations owner approvals',
  ]
}

function hashFragment(...parts: string[]): string {
  let hash = 0
  for (const part of parts.join(':')) {
    hash = ((hash << 5) - hash + part.charCodeAt(0)) | 0
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  return undefined
}
