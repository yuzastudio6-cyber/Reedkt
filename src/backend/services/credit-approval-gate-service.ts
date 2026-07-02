import type { CreditEstimateRecord, CreditReservationRecord } from '../../types'
import type { CreditGateCheckInput, CreditGateCheckResult, CreditGateDecision } from '../../types/credit-runtime'
import type { MockDatabase } from '../mock/mock-database'
import { findMockRecord } from '../mock/mock-database'

const EXPENSIVE_PURPOSES = new Set<CreditGateCheckInput['purpose']>([
  'music_generation',
  'sfx_generation',
  'stroke_motion_generation',
  'graphic_design_generation',
  'real_motion_generation',
  'video_generation',
  'preview_render',
  'final_export',
  'worker_job',
  'other',
])

export function checkCreditApprovalGate(
  db: MockDatabase,
  input: CreditGateCheckInput,
): CreditGateCheckResult {
  const requiredCredits = Math.max(0, input.estimatedCredits)
  const wallet = db.creditWallets.find((candidate) =>
    candidate.workspaceId === input.workspaceId &&
    (!input.requestedByUserId || !candidate.userId || candidate.userId === input.requestedByUserId),
  )
  const availableCredits = wallet?.cachedAvailableCredits ?? 0

  if (!input.requiresApproval && requiredCredits === 0) {
    return allow(input, {
      availableCredits,
      reservedCredits: wallet?.cachedReservedCredits ?? 0,
      message: 'Credit gate allowed mock/free demo operation without reservation.',
      warnings: ['Free/mock demo operation does not spend or reserve credits.'],
    })
  }

  const editPlanResult = assertEditPlanApprovedForGeneration(db, input)
  if (!editPlanResult.ok) return editPlanResult

  const estimateResult = assertCreditEstimateApproved(db, input)
  if (!estimateResult.ok) return estimateResult

  if (requiredCredits > availableCredits && !input.creditReservationId) {
    return block('blocked_insufficient_credits', input, {
      availableCredits,
      requiredCredits,
      message: 'Credit gate blocked because available credits are lower than required credits.',
    })
  }

  if (EXPENSIVE_PURPOSES.has(input.purpose)) {
    const reservationResult = assertCreditReservationExists(db, input)
    if (!reservationResult.ok) return reservationResult

    const reservation = findMockRecord(db, 'creditReservations', input.creditReservationId as string)
    const matchResult = assertCreditReservationMatchesRequest(reservation, input)
    if (!matchResult.ok) return matchResult
  }

  return allow(input, {
    availableCredits,
    reservedCredits: db.creditReservations.find((reservation) => reservation.id === input.creditReservationId)?.reservedCredits,
    message: 'Credit gate allowed operation after approval and reservation checks.',
    warnings: ['Mock credit gate only; real enforcement must run transactionally in backend runtime.'],
  })
}

export function assertEditPlanApprovedForGeneration(
  db: MockDatabase,
  input: CreditGateCheckInput,
): CreditGateCheckResult {
  if (!input.requiresApproval) {
    return allow(input, { message: 'Edit plan approval is not required for this mock/free operation.' })
  }

  if (!input.editPlanId) {
    return block('blocked_unknown', input, {
      message: 'Credit gate blocked because edit plan id is missing.',
    })
  }

  const editPlan = findMockRecord(db, 'editPlans', input.editPlanId)

  if (!editPlan || editPlan.status !== 'approved' || editPlan.approvalStatus !== 'approved') {
    return block('blocked_estimate_not_approved', input, {
      message: 'Credit gate blocked because the edit plan is not approved.',
      warnings: [`Edit plan status: ${editPlan?.status ?? 'missing'}.`],
    })
  }

  return allow(input, { message: 'Edit plan is approved.' })
}

export function assertCreditEstimateApproved(
  db: MockDatabase,
  input: CreditGateCheckInput,
): CreditGateCheckResult {
  if (!input.requiresApproval && input.estimatedCredits === 0) {
    return allow(input, { message: 'Credit estimate approval is not required for this mock/free operation.' })
  }

  if (!input.creditEstimateId) {
    return block('blocked_no_estimate', input, {
      message: 'Credit gate blocked because no credit estimate exists.',
    })
  }

  const estimate = findMockRecord(db, 'creditEstimates', input.creditEstimateId)
  if (!estimate || estimate.status !== 'approved') {
    return block('blocked_estimate_not_approved', input, {
      message: 'Credit gate blocked because the credit estimate is missing or not approved.',
      warnings: [`Credit estimate status: ${estimate?.status ?? 'missing'}.`],
    })
  }

  return allow(input, { message: 'Credit estimate is approved.' })
}

export function assertCreditReservationExists(
  db: MockDatabase,
  input: CreditGateCheckInput,
): CreditGateCheckResult {
  if (!input.creditReservationId) {
    return block('blocked_reservation_missing', input, {
      message: 'Credit gate blocked because no credit reservation exists.',
    })
  }

  const reservation = findMockRecord(db, 'creditReservations', input.creditReservationId)
  if (!reservation) {
    return block('blocked_reservation_missing', input, {
      message: 'Credit gate blocked because the credit reservation was not found.',
    })
  }

  if (reservation.status !== 'reserved') {
    return block(reservation.status === 'expired' ? 'blocked_reservation_expired' : 'blocked_reservation_missing', input, {
      reservation,
      message: `Credit gate blocked because reservation status is ${reservation.status}.`,
    })
  }

  if (reservation.expiresAt && Date.parse(reservation.expiresAt) <= Date.now()) {
    return block('blocked_reservation_expired', input, {
      reservation,
      message: 'Credit gate blocked because the credit reservation is expired.',
    })
  }

  return allow(input, {
    reservedCredits: reservation.reservedCredits,
    message: 'Credit reservation exists and is reserved.',
  })
}

export function assertCreditReservationMatchesRequest(
  reservation: CreditReservationRecord | undefined,
  input: CreditGateCheckInput,
): CreditGateCheckResult {
  if (!reservation) {
    return block('blocked_reservation_missing', input, {
      message: 'Credit gate blocked because the reservation is missing.',
    })
  }

  const wrongScope =
    reservation.workspaceId !== input.workspaceId ||
    reservation.projectId !== input.projectId ||
    reservation.creditEstimateId !== input.creditEstimateId ||
    (input.editPlanId && reservation.editPlanId !== input.editPlanId)

  if (wrongScope) {
    return block('blocked_wrong_user_or_workspace', input, {
      reservation,
      message: 'Credit gate blocked because reservation scope does not match this request.',
    })
  }

  if (reservation.reservedCredits < input.estimatedCredits) {
    return block('blocked_insufficient_credits', input, {
      reservation,
      requiredCredits: input.estimatedCredits,
      message: 'Credit gate blocked because reserved credits are lower than required credits.',
    })
  }

  return allow(input, {
    reservedCredits: reservation.reservedCredits,
    message: 'Credit reservation matches the requested workspace, project, estimate, and edit plan.',
  })
}

export function createCreditGateCheckSummary(result: CreditGateCheckResult): string {
  if (result.ok) return 'Credit gate allowed the operation.'
  if (result.decision === 'blocked_no_estimate') return 'Credit gate blocked: no credit estimate exists.'
  if (result.decision === 'blocked_estimate_not_approved') return 'Credit gate blocked: plan or estimate is not approved.'
  if (result.decision === 'blocked_insufficient_credits') return 'Credit gate blocked: insufficient credits.'
  if (result.decision === 'blocked_reservation_missing') return 'Credit gate blocked: reservation is missing.'
  if (result.decision === 'blocked_reservation_expired') return 'Credit gate blocked: reservation is expired.'
  if (result.decision === 'blocked_wrong_user_or_workspace') return 'Credit gate blocked: reservation scope does not match.'
  if (result.decision === 'blocked_backend_required') return 'Credit gate blocked: backend runtime is required.'
  return result.message
}

function allow(
  input: CreditGateCheckInput,
  options: {
    message: string
    warnings?: string[]
    availableCredits?: number
    reservedCredits?: number
  },
): CreditGateCheckResult {
  return {
    ok: true,
    decision: 'allowed',
    creditEstimateId: input.creditEstimateId,
    creditReservationId: input.creditReservationId,
    requiredCredits: input.estimatedCredits,
    availableCredits: options.availableCredits,
    reservedCredits: options.reservedCredits,
    message: options.message,
    warnings: options.warnings ?? [],
    mockOnly: true,
  }
}

function block(
  decision: CreditGateDecision,
  input: CreditGateCheckInput,
  options: {
    message: string
    warnings?: string[]
    availableCredits?: number
    reservedCredits?: number
    requiredCredits?: number
    reservation?: Pick<CreditReservationRecord, 'id' | 'reservedCredits'>
    estimate?: Pick<CreditEstimateRecord, 'id' | 'totalEstimatedCredits'>
  },
): CreditGateCheckResult {
  return {
    ok: false,
    decision,
    creditEstimateId: input.creditEstimateId ?? options.estimate?.id,
    creditReservationId: input.creditReservationId ?? options.reservation?.id,
    requiredCredits: options.requiredCredits ?? input.estimatedCredits,
    availableCredits: options.availableCredits,
    reservedCredits: options.reservedCredits ?? options.reservation?.reservedCredits,
    message: options.message,
    warnings: [
      'No expensive operation may start until edit plan approval, credit estimate approval, and credit reservation are valid.',
      ...(options.warnings ?? []),
    ],
    mockOnly: true,
  }
}
