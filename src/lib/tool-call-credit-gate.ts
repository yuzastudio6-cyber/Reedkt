import type {
  ToolCallCreditGateSummary,
  ToolCallIntent,
  ToolCallIntentCreditGate,
  ToolCallIntentPlan,
} from '../types/tool-call-intents'

export interface ToolCallCreditGateContext {
  approvedPlanSnapshotId?: string | null
  creditEstimateId?: string | null
  creditReservationId?: string | null
  approvedReservationRemainingCredits?: number | null
}

export function attachToolCallCreditGates(
  intents: ToolCallIntent[],
  context: ToolCallCreditGateContext = {},
): ToolCallIntent[] {
  return intents.map((intent) => ({
    ...intent,
    creditGate: buildToolCallIntentCreditGate(intent, context),
  }))
}

export function buildToolCallIntentCreditGate(
  intent: Pick<ToolCallIntent, 'costEstimate'>,
  context: ToolCallCreditGateContext = {},
): ToolCallIntentCreditGate {
  const blockerReasons = requiredCreditGateBlockers(context)
  const highCredits = intent.costEstimate.highCredits ?? intent.costEstimate.expectedCredits ?? intent.costEstimate.credits
  const reservationRemaining = normalizeOptionalNumber(context.approvedReservationRemainingCredits)
  const canRunWithinApprovedReservation = reservationRemaining === undefined || highCredits <= reservationRemaining
  const revisedEstimateRequired = blockerReasons.length === 0 && !canRunWithinApprovedReservation

  if (revisedEstimateRequired) {
    blockerReasons.push('High tool-cost estimate exceeds the approved reservation; a revised estimate and reservation are required.')
  }

  return {
    status: statusForBlockers(blockerReasons, revisedEstimateRequired),
    approvedPlanSnapshotId: normalizeOptionalString(context.approvedPlanSnapshotId),
    creditEstimateId: normalizeOptionalString(context.creditEstimateId),
    creditReservationId: normalizeOptionalString(context.creditReservationId),
    approvedReservationRemainingCredits: reservationRemaining,
    canRunWithinApprovedReservation,
    revisedEstimateRequired,
    executionBlocked: blockerReasons.length > 0,
    blockerReasons,
  }
}

export function summarizeToolCallCreditGate(
  intents: ToolCallIntent[],
  context: ToolCallCreditGateContext = {},
): ToolCallCreditGateSummary {
  const totalLowCredits = sumCredits(intents, 'lowCredits')
  const totalExpectedCredits = sumCredits(intents, 'expectedCredits')
  const totalHighCredits = sumCredits(intents, 'highCredits')
  const blockers = requiredCreditGateBlockers(context)
  const reservationRemaining = normalizeOptionalNumber(context.approvedReservationRemainingCredits)
  const canRunWithinReservation = reservationRemaining === undefined || totalHighCredits <= reservationRemaining
  const revisedEstimateRequired = blockers.length === 0 && !canRunWithinReservation

  if (revisedEstimateRequired) {
    blockers.push('High tool-call estimate exceeds the approved reservation; show a revised estimate before execution.')
  }

  const executionAllowed = blockers.length === 0

  return {
    totalLowCredits,
    totalExpectedCredits,
    totalHighCredits,
    approvedPlanSnapshotId: normalizeOptionalString(context.approvedPlanSnapshotId),
    creditEstimateId: normalizeOptionalString(context.creditEstimateId),
    creditReservationId: normalizeOptionalString(context.creditReservationId),
    approvedReservationRemainingCredits: reservationRemaining,
    executionAllowed,
    revisedEstimateRequired,
    blockers,
    userFacingSummary: buildUserFacingSummary({
      executionAllowed,
      revisedEstimateRequired,
      totalExpectedCredits,
      totalHighCredits,
      blockers,
    }),
  }
}

export function rebuildToolCallPlanCreditGateSummary(
  plan: ToolCallIntentPlan,
  context: ToolCallCreditGateContext = {},
): ToolCallIntentPlan {
  const intents = attachToolCallCreditGates(plan.intents, context)
  const creditGateSummary = summarizeToolCallCreditGate(intents, context)

  return {
    ...plan,
    intents,
    totalEstimatedCredits: creditGateSummary.totalExpectedCredits,
    creditGateSummary,
  }
}

function requiredCreditGateBlockers(context: ToolCallCreditGateContext): string[] {
  const blockers: string[] = []

  if (!normalizeOptionalString(context.approvedPlanSnapshotId)) {
    blockers.push('Missing approved plan snapshot.')
  }

  if (!normalizeOptionalString(context.creditEstimateId)) {
    blockers.push('Missing approved credit estimate.')
  }

  if (!normalizeOptionalString(context.creditReservationId)) {
    blockers.push('Missing active credit reservation.')
  } else if (normalizeOptionalNumber(context.approvedReservationRemainingCredits) === undefined) {
    blockers.push('Missing approved reservation remaining credit limit.')
  }

  return blockers
}

function statusForBlockers(blockers: string[], revisedEstimateRequired: boolean): ToolCallIntentCreditGate['status'] {
  if (revisedEstimateRequired) return 'blocked_over_budget_requires_revised_estimate'
  if (blockers.some((blocker) => blocker.includes('plan snapshot'))) return 'missing_approved_plan_snapshot'
  if (blockers.some((blocker) => blocker.includes('credit estimate'))) return 'missing_credit_estimate'
  if (blockers.some((blocker) => blocker.includes('credit reservation') || blocker.includes('reservation remaining'))) return 'missing_credit_reservation'
  return blockers.length > 0 ? 'planning_only_pending_approval' : 'ready_within_reservation'
}

function sumCredits(
  intents: ToolCallIntent[],
  key: 'lowCredits' | 'expectedCredits' | 'highCredits',
): number {
  return intents.reduce((sum, intent) => {
    const fallbackCredits = key === 'lowCredits'
      ? intent.costEstimate.credits
      : intent.costEstimate.expectedCredits ?? intent.costEstimate.credits
    return sum + Math.max(0, Math.ceil(intent.costEstimate[key] ?? fallbackCredits))
  }, 0)
}

function buildUserFacingSummary(input: {
  executionAllowed: boolean
  revisedEstimateRequired: boolean
  totalExpectedCredits: number
  totalHighCredits: number
  blockers: string[]
}): string {
  if (input.executionAllowed) {
    return `Tool-call gate ready: expected ${input.totalExpectedCredits} credits, high estimate ${input.totalHighCredits} credits, covered by the approved reservation.`
  }

  if (input.revisedEstimateRequired) {
    return `Tool-call gate blocked: high estimate ${input.totalHighCredits} credits exceeds the approved reservation. A revised estimate must be approved first.`
  }

  return `Tool-call gate pending: expected ${input.totalExpectedCredits} credits, high estimate ${input.totalHighCredits} credits. Approval, estimate, and reservation are required before any tool execution.`
}

function normalizeOptionalString(value: string | null | undefined): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function normalizeOptionalNumber(value: number | null | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}
