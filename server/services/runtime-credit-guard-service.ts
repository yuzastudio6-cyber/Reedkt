import type { CreditReservationRecord, CreditRevisionActionRecord, JSONObject } from '../../src/types'
import type { ReEditProCanonicalEditLevel } from '../../src/types/edit-level'
import { calculateReEditProFinalChargeCredits } from '../../src/types/credit-policy'
import {
  estimateProductionToolCost,
  listMockToolCostEventsForProject,
  summarizeMockToolCostEvents,
  type CalculateToolActualCostMicrosInput,
  type MockToolCostEvent,
  type ProductionToolCostEstimate,
  type ToolCostEventAggregation,
  type ToolCreditPrerequisiteStatus,
} from '../tool-cost-metering'
import {
  createCreditRevisionActionRecord,
  type MockCreditDataStore,
  upsertCreditRevisionActionByIdempotencyKey,
} from './mock-credit-data-store'
import {
  getEditCreditEstimatePreview,
  type MockCreditEstimateStore,
} from './mock-credit-estimate-store'
import {
  getCreditReservation,
  type MockCreditReservationStore,
} from './mock-credit-reservation-store'
import {
  sharedMockCreditDataStore,
  sharedMockCreditEstimateStore,
  sharedMockCreditReservationStore,
} from './mock-credit-foundation-stores'

export const RUNTIME_CREDIT_GUARD_STATUSES = [
  'ready',
  'blocked_missing_approved_plan',
  'blocked_missing_approved_credit_estimate',
  'blocked_missing_active_credit_reservation',
  'blocked_missing_idempotency_key',
  'blocked_invalid_context',
  'blocked_tool_prerequisite',
  'paused_projected_overage',
] as const

export type RuntimeCreditGuardStatus = typeof RUNTIME_CREDIT_GUARD_STATUSES[number]

export interface EvaluatePaidToolRuntimeGuardInput {
  workspaceId: string
  projectId: string
  editPlanId?: string | null
  jobId?: string | null
  jobBatchId?: string | null
  approvedPlanSnapshotId?: string | null
  toolId: string
  productEditLevel: ReEditProCanonicalEditLevel
  estimatedFinalVideoDurationSeconds: number
  creditEstimateId?: string | null
  creditReservationId?: string | null
  idempotencyKey?: string | null
  nextToolUsageInput?: CalculateToolActualCostMicrosInput | Record<string, unknown>
  approvedPlanStatus?: string | null
  estimateStatus?: string | null
  allowEstimateOnly?: boolean
  committedPendingHighCredits?: number
  estimateStore?: MockCreditEstimateStore
  reservationStore?: MockCreditReservationStore
  creditDataStore?: MockCreditDataStore
}

export interface RuntimeCreditGuardProjection {
  approvedReservedCredits: number
  currentBillableToolCredits: number
  committedPendingHighCredits: number
  nextToolLowCredits: number
  nextToolExpectedCredits: number
  nextToolHighCredits: number
  projectedLowToolCredits: number
  projectedExpectedToolCredits: number
  projectedHighToolCredits: number
  projectedLowServiceFeeCredits: number
  projectedExpectedServiceFeeCredits: number
  projectedHighServiceFeeCredits: number
  projectedLowFinalCredits: number
  projectedExpectedFinalCredits: number
  projectedHighFinalCredits: number
  additionalLowCredits: number
  additionalExpectedCredits: number
  additionalHighCredits: number
  billableToolEventCount: number
  nonBillableToolEventCount: number
  billableToolEventIds: string[]
  nonBillableToolEventIds: string[]
}

export interface RuntimeCreditGuardSafetyFlags {
  mockOnly: true
  walletMutated: false
  reservationMutated: false
  creditsSpent: false
  creditsReleased: false
  creditsRefunded: false
  ledgerWritten: false
  settlementExecuted: false
  providerCalled: false
  workerRun: false
  renderOrExportStarted: false
  exportUnlocked: false
  checkoutOrTopUpStarted: false
  supabaseWritten: false
  serviceFeeIncludedInToolCosts: false
  revisionActionCreated: boolean
}

export interface RuntimeCreditGuardResult {
  canStart: boolean
  status: RuntimeCreditGuardStatus
  prerequisiteFailures: string[]
  creditPrerequisiteStatus?: ToolCreditPrerequisiteStatus
  reservation?: CreditReservationRecord | null
  toolEstimate?: ProductionToolCostEstimate
  projection?: RuntimeCreditGuardProjection
  revisionAction?: CreditRevisionActionRecord | null
  safetyFlags: RuntimeCreditGuardSafetyFlags
  warnings: string[]
}

export function evaluatePaidToolRuntimeGuard(
  input: EvaluatePaidToolRuntimeGuardInput,
): RuntimeCreditGuardResult {
  const estimateStore = input.estimateStore ?? sharedMockCreditEstimateStore
  const reservationStore = input.reservationStore ?? sharedMockCreditReservationStore
  const creditDataStore = input.creditDataStore ?? sharedMockCreditDataStore

  const basicFailure = validateBasicPrerequisites(input)
  if (basicFailure) return basicFailure

  const preview = input.creditEstimateId
    ? getEditCreditEstimatePreview(estimateStore, input.creditEstimateId)
    : undefined
  const estimateStatus = input.estimateStatus ?? preview?.estimate.status
  if (estimateStatus !== 'approved') {
    return blocked('blocked_missing_approved_credit_estimate', input, [
      `Credit estimate status is ${estimateStatus ?? 'missing'}.`,
    ])
  }

  const reservation = input.creditReservationId
    ? getCreditReservation(reservationStore, input.creditReservationId)
    : undefined
  const reservationFailure = validateActiveReservation(input, reservation)
  if (reservationFailure) return reservationFailure

  const estimated = estimateProductionToolCost({
    toolId: input.toolId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId ?? undefined,
    jobId: input.jobId,
    jobBatchId: input.jobBatchId,
    creditEstimateId: input.creditEstimateId,
    creditReservationId: input.creditReservationId,
    productEditLevel: input.productEditLevel,
    usage: normalizeUsageInput(input.nextToolUsageInput),
    idempotencyKey: input.idempotencyKey,
    estimateOnlyWhenBlocked: input.allowEstimateOnly ?? true,
    metadata: {
      milestone: 'RP-RUNTIME-GUARD-01',
      runtimeGuard: true,
    },
  })
  if (!estimated.ok) {
    return blocked('blocked_tool_prerequisite', input, [estimated.error.message], {
      creditPrerequisiteStatus: estimated.error.status,
    })
  }
  if (estimated.data.creditPrerequisiteStatus !== 'ready') {
    return blocked('blocked_tool_prerequisite', input, estimated.data.warnings, {
      creditPrerequisiteStatus: estimated.data.creditPrerequisiteStatus,
      toolEstimate: estimated.data,
    })
  }

  const matchingEvents = matchingBillableContextEvents(creditDataStore.toolCostStore.toolCostEvents, input)
  const aggregation = summarizeMockToolCostEvents(matchingEvents)
  const projection = buildProjection({
    input,
    approvedReservedCredits: reservation?.reservedCredits ?? 0,
    estimate: estimated.data,
    aggregation,
  })

  if (projection.projectedHighFinalCredits > projection.approvedReservedCredits) {
    const action = upsertCreditRevisionActionByIdempotencyKey(
      creditDataStore,
      createCreditRevisionActionRecord({
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        editPlanId: input.editPlanId ?? null,
        jobBatchId: input.jobBatchId ?? null,
        jobId: input.jobId ?? null,
        creditEstimateId: input.creditEstimateId as string,
        creditReservationId: input.creditReservationId as string,
        editComputeLevel: input.productEditLevel,
        pauseReason: 'projected_overage',
        approvedMaxCredits: projection.approvedReservedCredits,
        usedOrCommittedCredits: projection.currentBillableToolCredits + projection.committedPendingHighCredits,
        additionalLowCredits: projection.additionalLowCredits,
        additionalExpectedCredits: projection.additionalExpectedCredits,
        additionalHighCredits: projection.additionalHighCredits,
        newMaximumEstimatedCredits: projection.projectedHighFinalCredits,
        reasonSummary: 'Projected paid tool cost may exceed the approved max reservation.',
        idempotencyKey: `${input.idempotencyKey}:runtime-credit-guard:projected-overage`,
        metadata: asJsonObject({
          mockOnly: true,
          milestone: 'RP-RUNTIME-GUARD-01',
          serviceFeeIncludedInToolCosts: false,
          toolId: input.toolId,
          approvedMaxCredits: projection.approvedReservedCredits,
          projectedHighFinalCredits: projection.projectedHighFinalCredits,
          billableToolEventIds: projection.billableToolEventIds,
        }),
      }),
    )
    return {
      canStart: false,
      status: 'paused_projected_overage',
      prerequisiteFailures: ['projected_overage'],
      creditPrerequisiteStatus: estimated.data.creditPrerequisiteStatus,
      reservation,
      toolEstimate: estimated.data,
      projection,
      revisionAction: action,
      safetyFlags: safetyFlags(true),
      warnings: [
        'Action required: revised credit estimate needed',
        'This edit is paused before paid work starts because the high projection exceeds approved reserved credits.',
        'No paid worker, provider, render/export, settlement, spend/release/refund, ledger, checkout, top-up, or production persistence occurred.',
      ],
    }
  }

  return {
    canStart: true,
    status: 'ready',
    prerequisiteFailures: [],
    creditPrerequisiteStatus: estimated.data.creditPrerequisiteStatus,
    reservation,
    toolEstimate: estimated.data,
    projection,
    revisionAction: null,
    safetyFlags: safetyFlags(false),
    warnings: [
      'Runtime credit guard passed in mock-safe mode.',
      'Tool-cost estimate excludes ReEditPro service fee; service fee is projected separately.',
    ],
  }
}

function validateBasicPrerequisites(
  input: EvaluatePaidToolRuntimeGuardInput,
): RuntimeCreditGuardResult | null {
  if (!input.idempotencyKey) {
    return blocked('blocked_missing_idempotency_key', input, ['Paid runtime guard requires idempotencyKey.'])
  }
  if (!input.creditEstimateId) {
    return blocked('blocked_missing_approved_credit_estimate', input, ['Paid runtime guard requires creditEstimateId.'])
  }
  if (!input.creditReservationId) {
    return blocked('blocked_missing_active_credit_reservation', input, ['Paid runtime guard requires creditReservationId.'])
  }
  if (!Number.isFinite(input.estimatedFinalVideoDurationSeconds) || input.estimatedFinalVideoDurationSeconds <= 0) {
    return blocked('blocked_invalid_context', input, ['estimatedFinalVideoDurationSeconds must be positive.'])
  }
  const approvedPlanPresent = Boolean(input.approvedPlanSnapshotId) || input.approvedPlanStatus === 'approved'
  if (!approvedPlanPresent) {
    return blocked('blocked_missing_approved_plan', input, [
      `Approved plan status is ${input.approvedPlanStatus ?? 'missing'}.`,
    ])
  }
  return null
}

function validateActiveReservation(
  input: EvaluatePaidToolRuntimeGuardInput,
  reservation: CreditReservationRecord | undefined,
): RuntimeCreditGuardResult | null {
  if (!reservation) {
    return blocked('blocked_missing_active_credit_reservation', input, ['Credit reservation was not found.'])
  }
  if (reservation.status !== 'reserved') {
    return blocked('blocked_missing_active_credit_reservation', input, [
      `Credit reservation status ${reservation.status} is not active for new paid work.`,
    ], { reservation })
  }
  if (reservation.expiresAt && Date.parse(reservation.expiresAt) <= Date.now()) {
    return blocked('blocked_missing_active_credit_reservation', input, ['Credit reservation is expired.'], { reservation })
  }
  if (
    reservation.workspaceId !== input.workspaceId ||
    reservation.projectId !== input.projectId ||
    reservation.creditEstimateId !== input.creditEstimateId
  ) {
    return blocked('blocked_missing_active_credit_reservation', input, [
      'Credit reservation does not match workspace, project, or estimate.',
    ], { reservation })
  }
  return null
}

function buildProjection(input: {
  input: EvaluatePaidToolRuntimeGuardInput
  approvedReservedCredits: number
  estimate: ProductionToolCostEstimate
  aggregation: ToolCostEventAggregation
}): RuntimeCreditGuardProjection {
  const committedPendingHighCredits = normalizeInteger(input.input.committedPendingHighCredits)
  const currentBillableToolCredits = input.aggregation.actualBillableCostCredits
  const nextToolLowCredits = input.estimate.range.lowCredits
  const nextToolExpectedCredits = input.estimate.range.expectedCredits
  const nextToolHighCredits = input.estimate.range.highCredits
  const projectedLowToolCredits = currentBillableToolCredits + committedPendingHighCredits + nextToolLowCredits
  const projectedExpectedToolCredits = currentBillableToolCredits + committedPendingHighCredits + nextToolExpectedCredits
  const projectedHighToolCredits = currentBillableToolCredits + committedPendingHighCredits + nextToolHighCredits
  const projectedLowServiceFeeCredits = serviceFeeCredits(input.input, projectedLowToolCredits)
  const projectedExpectedServiceFeeCredits = serviceFeeCredits(input.input, projectedExpectedToolCredits)
  const projectedHighServiceFeeCredits = serviceFeeCredits(input.input, projectedHighToolCredits)
  const projectedLowFinalCredits = projectedLowToolCredits + projectedLowServiceFeeCredits
  const projectedExpectedFinalCredits = projectedExpectedToolCredits + projectedExpectedServiceFeeCredits
  const projectedHighFinalCredits = projectedHighToolCredits + projectedHighServiceFeeCredits

  return {
    approvedReservedCredits: input.approvedReservedCredits,
    currentBillableToolCredits,
    committedPendingHighCredits,
    nextToolLowCredits,
    nextToolExpectedCredits,
    nextToolHighCredits,
    projectedLowToolCredits,
    projectedExpectedToolCredits,
    projectedHighToolCredits,
    projectedLowServiceFeeCredits,
    projectedExpectedServiceFeeCredits,
    projectedHighServiceFeeCredits,
    projectedLowFinalCredits,
    projectedExpectedFinalCredits,
    projectedHighFinalCredits,
    additionalLowCredits: Math.max(0, projectedLowFinalCredits - input.approvedReservedCredits),
    additionalExpectedCredits: Math.max(0, projectedExpectedFinalCredits - input.approvedReservedCredits),
    additionalHighCredits: Math.max(0, projectedHighFinalCredits - input.approvedReservedCredits),
    billableToolEventCount: input.aggregation.billableEventCount,
    nonBillableToolEventCount: input.aggregation.nonBillableEventCount,
    billableToolEventIds: input.aggregation.billableEventIds,
    nonBillableToolEventIds: input.aggregation.nonBillableEventIds,
  }
}

function serviceFeeCredits(input: EvaluatePaidToolRuntimeGuardInput, toolCredits: number): number {
  const charge = calculateReEditProFinalChargeCredits({
    actualToolCostCredits: toolCredits,
    durationSeconds: input.estimatedFinalVideoDurationSeconds,
    editLevel: input.productEditLevel,
  })
  return charge.serviceFeeCredits ?? 0
}

function matchingBillableContextEvents(
  events: readonly MockToolCostEvent[],
  input: EvaluatePaidToolRuntimeGuardInput,
): MockToolCostEvent[] {
  return listMockToolCostEventsForProject({ toolCostEvents: [...events] }, input.projectId)
    .filter((event) =>
      event.workspaceId === input.workspaceId &&
      event.creditEstimateId === input.creditEstimateId &&
      event.creditReservationId === input.creditReservationId)
}

function blocked(
  status: Exclude<RuntimeCreditGuardStatus, 'ready' | 'paused_projected_overage'>,
  input: EvaluatePaidToolRuntimeGuardInput,
  warnings: string[],
  extra: {
    creditPrerequisiteStatus?: ToolCreditPrerequisiteStatus
    reservation?: CreditReservationRecord
    toolEstimate?: ProductionToolCostEstimate
  } = {},
): RuntimeCreditGuardResult {
  return {
    canStart: false,
    status,
    prerequisiteFailures: [status],
    creditPrerequisiteStatus: extra.creditPrerequisiteStatus,
    reservation: extra.reservation ?? null,
    toolEstimate: extra.toolEstimate,
    revisionAction: null,
    safetyFlags: safetyFlags(false),
    warnings: [
      ...warnings,
      'Paid runtime guard blocked before paid worker/provider/render start.',
      `Idempotency key: ${input.idempotencyKey ?? 'missing'}.`,
      'No revision action was created for missing prerequisites.',
    ],
  }
}

function safetyFlags(revisionActionCreated: boolean): RuntimeCreditGuardSafetyFlags {
  return {
    mockOnly: true,
    walletMutated: false,
    reservationMutated: false,
    creditsSpent: false,
    creditsReleased: false,
    creditsRefunded: false,
    ledgerWritten: false,
    settlementExecuted: false,
    providerCalled: false,
    workerRun: false,
    renderOrExportStarted: false,
    exportUnlocked: false,
    checkoutOrTopUpStarted: false,
    supabaseWritten: false,
    serviceFeeIncludedInToolCosts: false,
    revisionActionCreated,
  }
}

function normalizeUsageInput(
  value: CalculateToolActualCostMicrosInput | Record<string, unknown> | undefined,
): CalculateToolActualCostMicrosInput | undefined {
  if (!value || typeof value !== 'object' || !('sourceKind' in value)) return undefined
  return value as CalculateToolActualCostMicrosInput
}

function normalizeInteger(value: number | undefined): number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : 0
}

function asJsonObject(value: Record<string, unknown>): JSONObject {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) =>
      item === null ||
      typeof item === 'string' ||
      typeof item === 'number' ||
      typeof item === 'boolean' ||
      Array.isArray(item)
    ),
  ) as JSONObject
}
