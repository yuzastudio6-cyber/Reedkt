import type {
  CreditRevisionActionRecord,
  CreditRevisionPauseReason,
  CreditRevisionUserOption,
  CreditSettlementRecord,
  EditCreditCostSummary,
  EditCreditCostSummaryLine,
  PreviewCreditSettlementRequest,
  PreviewCreditSettlementResponse,
  JSONObject,
} from '../../src/types'
import {
  calculateReEditProFinalChargeCredits,
  REEDITPRO_CREDIT_POLICY_VERSION,
  REEDITPRO_EXPORT_LOCK_ACTION_REQUIRED_COPY,
  REEDITPRO_REVISED_ESTIMATE_ACTION_REQUIRED_COPY,
  REEDITPRO_SERVICE_FEE_POLICY_VERSION,
} from '../../src/types/credit-policy'
import { creditRevisionActionRecordSchema, creditSettlementRecordSchema } from '../validation/credit-data-schemas'
import { createMockId, nowIso } from './service-helpers'
import { TOOL_COST_RATE_CARD_VERSION } from '../tool-cost-metering/rate-card'
import { summarizeMockToolCostEvents } from '../tool-cost-metering/cost-math'
import {
  createMockToolCostStore,
  listMockToolCostEventsByIds,
  listMockToolCostEventsForProject,
  type MockToolCostStore,
} from '../tool-cost-metering/mock-tool-cost-store'
import type { MockToolCostEvent } from '../tool-cost-metering/types'

export interface MockCreditDataStore {
  creditSettlements: CreditSettlementRecord[]
  creditRevisionActions: CreditRevisionActionRecord[]
  toolCostStore: MockToolCostStore
  walletMutationRecords: unknown[]
  reservationMutationRecords: unknown[]
  ledgerMutationRecords: unknown[]
  exportUnlockRecords: unknown[]
  jobEnqueueRecords: unknown[]
}

export interface CreateCreditRevisionActionInput {
  workspaceId: string
  projectId: string
  editPlanId?: string | null
  chatSessionId?: string | null
  jobBatchId?: string | null
  jobId?: string | null
  creditEstimateId: string
  creditReservationId: string
  previousCreditEstimateId?: string | null
  revisedCreditEstimateId?: string | null
  editComputeLevel: CreditRevisionActionRecord['editComputeLevel']
  status?: CreditRevisionActionRecord['status']
  pauseReason: CreditRevisionPauseReason
  approvedMaxCredits: number
  usedOrCommittedCredits: number
  additionalLowCredits: number
  additionalExpectedCredits: number
  additionalHighCredits: number
  newMaximumEstimatedCredits: number
  reasonSummary: string
  selectedOptionId?: string | null
  resolvedByUserId?: string | null
  resolvedAt?: string | null
  idempotencyKey: string
  metadata?: JSONObject
  expiresAt?: string | null
}

export function createMockCreditDataStore(
  toolCostEvents: MockToolCostEvent[] = [],
): MockCreditDataStore {
  return {
    creditSettlements: [],
    creditRevisionActions: [],
    toolCostStore: createMockToolCostStore(toolCostEvents),
    walletMutationRecords: [],
    reservationMutationRecords: [],
    ledgerMutationRecords: [],
    exportUnlockRecords: [],
    jobEnqueueRecords: [],
  }
}

export function insertCreditSettlement(
  store: MockCreditDataStore,
  settlement: CreditSettlementRecord,
): CreditSettlementRecord {
  const validated = creditSettlementRecordSchema.parse(settlement) as CreditSettlementRecord
  store.creditSettlements.push(validated)
  return validated
}

export function getCreditSettlement(
  store: MockCreditDataStore,
  id: string,
): CreditSettlementRecord | undefined {
  return store.creditSettlements.find((settlement) => settlement.id === id)
}

export function listCreditSettlementsForProject(
  store: MockCreditDataStore,
  projectId: string,
): CreditSettlementRecord[] {
  return store.creditSettlements.filter((settlement) => settlement.projectId === projectId)
}

export function upsertCreditSettlementByIdempotencyKey(
  store: MockCreditDataStore,
  settlement: CreditSettlementRecord,
): CreditSettlementRecord {
  const existing = store.creditSettlements.find((record) =>
    record.workspaceId === settlement.workspaceId &&
    record.idempotencyKey === settlement.idempotencyKey)
  if (existing) return existing
  return insertCreditSettlement(store, settlement)
}

export function insertCreditRevisionAction(
  store: MockCreditDataStore,
  action: CreditRevisionActionRecord,
): CreditRevisionActionRecord {
  const validated = creditRevisionActionRecordSchema.parse(action) as CreditRevisionActionRecord
  store.creditRevisionActions.push(validated)
  return validated
}

export function getCreditRevisionAction(
  store: MockCreditDataStore,
  id: string,
): CreditRevisionActionRecord | undefined {
  return store.creditRevisionActions.find((action) => action.id === id)
}

export function listCreditRevisionActionsForProject(
  store: MockCreditDataStore,
  projectId: string,
): CreditRevisionActionRecord[] {
  return store.creditRevisionActions.filter((action) => action.projectId === projectId)
}

export function upsertCreditRevisionActionByIdempotencyKey(
  store: MockCreditDataStore,
  action: CreditRevisionActionRecord,
): CreditRevisionActionRecord {
  const existing = store.creditRevisionActions.find((record) =>
    record.workspaceId === action.workspaceId &&
    record.idempotencyKey === action.idempotencyKey)
  if (existing) return existing
  return insertCreditRevisionAction(store, action)
}

export function createCreditRevisionActionRecord(
  input: CreateCreditRevisionActionInput,
): CreditRevisionActionRecord {
  const copy = input.pauseReason === 'export_top_up_required'
    ? createExportTopUpCopy()
    : createRevisedEstimateCopy()

  return {
    id: createMockId('credit_revision_action'),
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId ?? null,
    chatSessionId: input.chatSessionId ?? null,
    jobBatchId: input.jobBatchId ?? null,
    jobId: input.jobId ?? null,
    creditEstimateId: input.creditEstimateId,
    creditReservationId: input.creditReservationId,
    previousCreditEstimateId: input.previousCreditEstimateId ?? null,
    revisedCreditEstimateId: input.revisedCreditEstimateId ?? null,
    editComputeLevel: input.editComputeLevel,
    status: input.status ?? 'action_required',
    pauseReason: input.pauseReason,
    approvedMaxCredits: input.approvedMaxCredits,
    usedOrCommittedCredits: input.usedOrCommittedCredits,
    additionalLowCredits: input.additionalLowCredits,
    additionalExpectedCredits: input.additionalExpectedCredits,
    additionalHighCredits: input.additionalHighCredits,
    newMaximumEstimatedCredits: input.newMaximumEstimatedCredits,
    reasonSummary: input.reasonSummary,
    actionRequiredTitle: copy.title,
    actionRequiredMessage: copy.message,
    userOptions: copy.options,
    selectedOptionId: input.selectedOptionId ?? null,
    resolvedByUserId: input.resolvedByUserId ?? null,
    resolvedAt: input.resolvedAt ?? null,
    idempotencyKey: input.idempotencyKey,
    metadata: input.metadata ?? { mockOnly: true },
    createdAt: nowIso(),
    updatedAt: nowIso(),
    expiresAt: input.expiresAt ?? null,
  }
}

export function previewCreditSettlement(
  store: MockCreditDataStore,
  request: PreviewCreditSettlementRequest,
): PreviewCreditSettlementResponse {
  const events = request.toolCostEventIds?.length
    ? listMockToolCostEventsByIds(store.toolCostStore, request.toolCostEventIds)
    : listMockToolCostEventsForProject(store.toolCostStore, request.projectId)
  const aggregation = summarizeMockToolCostEvents(events)
  const finalCharge = calculateReEditProFinalChargeCredits({
    actualToolCostCredits: aggregation.actualBillableCostCredits,
    durationSeconds: request.finalVideoDurationSeconds,
    editLevel: request.editComputeLevel,
  })
  const customEstimateRequired = finalCharge.finalChargeCredits === null || finalCharge.serviceFeeCredits === null
  const reeditproServiceFeeCredits = finalCharge.serviceFeeCredits ?? 0
  const finalChargeCredits = finalCharge.finalChargeCredits ?? aggregation.actualBillableCostCredits
  const outstandingCredits = customEstimateRequired
    ? 0
    : Math.max(0, finalChargeCredits - request.reservedCredits)
  const releasedCredits = customEstimateRequired
    ? 0
    : Math.max(0, request.reservedCredits - finalChargeCredits)

  const status: CreditSettlementRecord['status'] = customEstimateRequired
    ? 'requires_revised_estimate'
    : outstandingCredits > 0
      ? 'requires_top_up_before_export'
      : 'previewed'
  const settlementReason: CreditSettlementRecord['settlementReason'] = customEstimateRequired
    ? 'projected_overage'
    : outstandingCredits > 0
      ? 'approved_but_unfunded'
      : 'edit_completed'

  const settlement: CreditSettlementRecord = {
    id: createMockId('credit_settlement_preview'),
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editPlanId: request.editPlanId ?? null,
    chatSessionId: null,
    jobBatchId: null,
    creditWalletId: null,
    creditEstimateId: request.creditEstimateId,
    creditReservationId: request.creditReservationId,
    creditApprovalId: null,
    editComputeLevel: request.editComputeLevel,
    finalVideoDurationSeconds: request.finalVideoDurationSeconds,
    status,
    settlementReason,
    reservedCredits: request.reservedCredits,
    actualToolCostCents: aggregation.actualBillableCostCents,
    actualToolCostCredits: aggregation.actualBillableCostCredits,
    reeditproServiceFeeCredits,
    finalChargeCredits,
    releasedCredits,
    absorbedOverageCredits: 0,
    outstandingCredits,
    billableToolEventCount: aggregation.billableEventCount,
    nonBillableToolEventCount: aggregation.nonBillableEventCount,
    toolCostEventIds: events.map((event) => event.id),
    rateCardVersion: TOOL_COST_RATE_CARD_VERSION,
    creditPolicyVersion: REEDITPRO_CREDIT_POLICY_VERSION,
    serviceFeePolicyVersion: REEDITPRO_SERVICE_FEE_POLICY_VERSION,
    idempotencyKey: request.idempotencyKey,
    settlementPayload: {
      previewOnly: true,
      noWalletMutation: true,
      noReservationMutation: true,
      noLedgerWrite: true,
      noExportUnlock: true,
    },
    receiptPayload: {},
    metadata: {
      mockOnly: true,
      readOnlyPreview: true,
      customEstimateRequired,
    },
    createdAt: nowIso(),
    updatedAt: nowIso(),
    settledAt: null,
    failedAt: null,
  }
  const summary = buildEditCreditCostSummary(settlement, events)
  settlement.receiptPayload = asJsonObject({
    userFacingLines: summary.userFacingLines.map((line): JSONObject => ({
      label: line.label,
      credits: line.credits,
      ...(line.description ? { description: line.description } : {}),
    })),
    warnings: summary.warnings,
  })

  return {
    settlement,
    summary,
    requiresAction: status === 'requires_revised_estimate' || status === 'requires_top_up_before_export',
    requiredActionType: status === 'requires_revised_estimate'
      ? 'revised_estimate'
      : status === 'requires_top_up_before_export'
        ? 'top_up_before_export'
        : 'none',
    warnings: [
      'Settlement preview is read-only; no wallet, reservation, ledger, job, export, Stripe, or provider mutation occurred.',
      ...(customEstimateRequired ? ['Custom duration requires a revised estimate before paid continuation.'] : []),
      ...(outstandingCredits > 0 ? ['Outstanding credits must be addressed before export in a later milestone.'] : []),
    ],
  }
}

export function buildEditCreditCostSummary(
  settlement: CreditSettlementRecord,
  events: readonly MockToolCostEvent[],
): EditCreditCostSummary {
  const aggregation = summarizeMockToolCostEvents(events)
  const lines: EditCreditCostSummaryLine[] = [
    receiptLine('Transcription', categoryCredits(aggregation.byUsageCategory, ['transcription', 'transcript'])),
    receiptLine('Media analysis', categoryCredits(aggregation.byUsageCategory, ['media_analysis'])),
    receiptLine('Captions', categoryCredits(aggregation.byUsageCategory, ['captions'])),
    receiptLine('Stroke Motion', categoryCredits(aggregation.byUsageCategory, ['stroke_motion'])),
    receiptLine('Graphic Design', categoryCredits(aggregation.byUsageCategory, ['graphic_design'])),
    receiptLine('Real Motion', categoryCredits(aggregation.byUsageCategory, ['real_motion'])),
    receiptLine('SoundSync', categoryCredits(aggregation.byUsageCategory, ['soundsync'])),
    receiptLine('Rendering/export', categoryCredits(aggregation.byUsageCategory, ['rendering', 'render_export'])),
    receiptLine('Other tools', categoryCredits(aggregation.byUsageCategory, ['other', 'basic_edit', 'pro_edit', 'signature_edit', 'premium_signature_edit', 'revision', 'admin'])),
    receiptLine('Actual tool cost', settlement.actualToolCostCredits, 'Tool owner cost only; ReEditPro service fee is separate.'),
    receiptLine('ReEditPro service fee', settlement.reeditproServiceFeeCredits),
    receiptLine('Final charge', settlement.finalChargeCredits),
    receiptLine('Reserved', settlement.reservedCredits),
    receiptLine('Returned', settlement.releasedCredits),
  ]

  if (settlement.absorbedOverageCredits > 0) {
    lines.push(receiptLine('ReEditPro absorbed', settlement.absorbedOverageCredits))
  }
  if (settlement.outstandingCredits > 0) {
    lines.push(receiptLine('Outstanding credits', settlement.outstandingCredits))
  }

  return {
    workspaceId: settlement.workspaceId,
    projectId: settlement.projectId,
    editPlanId: settlement.editPlanId,
    creditEstimateId: settlement.creditEstimateId,
    creditReservationId: settlement.creditReservationId,
    creditSettlementId: settlement.id,
    editComputeLevel: settlement.editComputeLevel,
    finalVideoDurationSeconds: settlement.finalVideoDurationSeconds,
    reservedCredits: settlement.reservedCredits,
    actualToolCostCents: settlement.actualToolCostCents,
    actualToolCostCredits: settlement.actualToolCostCredits,
    reeditproServiceFeeCredits: settlement.reeditproServiceFeeCredits,
    finalChargeCredits: settlement.finalChargeCredits,
    releasedCredits: settlement.releasedCredits,
    absorbedOverageCredits: settlement.absorbedOverageCredits,
    outstandingCredits: settlement.outstandingCredits,
    byUsageCategory: aggregation.byUsageCategory,
    nonBillableAbsorbed: aggregation.nonBillableEventCount > 0
      ? {
          eventCount: aggregation.nonBillableEventCount,
          actualInternalCostCents: aggregation.nonBillableCostCents,
          credits: aggregation.nonBillableCredits,
          reasons: aggregation.nonBillableReasons,
        }
      : undefined,
    userFacingLines: lines,
    warnings: [
      'Mock receipt summary only; no live billing, wallet mutation, reservation spend/release/refund, ledger write, or export unlock occurred.',
      ...(settlement.outstandingCredits > 0 ? ['Outstanding credits are informational only in this milestone.'] : []),
    ],
  }
}

function createRevisedEstimateCopy(): {
  title: string
  message: string
  options: CreditRevisionUserOption[]
} {
  return {
    title: REEDITPRO_REVISED_ESTIMATE_ACTION_REQUIRED_COPY.title,
    message: REEDITPRO_REVISED_ESTIMATE_ACTION_REQUIRED_COPY.explanation,
    options: [
      { id: 'approve-and-continue', label: 'Approve & Continue', action: 'approve_and_continue' },
      { id: 'choose-lower-cost-option', label: 'Choose Lower-Cost Option', action: 'choose_lower_cost_option' },
      { id: 'cancel-extra-work', label: 'Cancel Extra Work', action: 'cancel_extra_work' },
    ],
  }
}

function createExportTopUpCopy(): {
  title: string
  message: string
  options: CreditRevisionUserOption[]
} {
  return {
    title: REEDITPRO_EXPORT_LOCK_ACTION_REQUIRED_COPY.title,
    message: 'This export is ready, but the approved final charge is not fully funded. Add credits before export unlocks in a later runtime milestone.',
    options: [
      { id: 'add-credits-and-unlock-export', label: 'Add Credits & Unlock Export', action: 'add_credits_and_unlock_export' },
      { id: 'choose-lower-cost-option', label: 'Choose Lower-Cost Option', action: 'choose_lower_cost_option' },
      { id: 'cancel-extra-work', label: 'Cancel Extra Work', action: 'cancel_extra_work' },
    ],
  }
}

function receiptLine(label: string, credits: number, description?: string): EditCreditCostSummaryLine {
  return description ? { label, credits, description } : { label, credits }
}

function categoryCredits(
  byUsageCategory: EditCreditCostSummary['byUsageCategory'],
  keys: readonly string[],
): number {
  return keys.reduce((sum, key) => sum + (byUsageCategory[key]?.credits ?? 0), 0)
}

function asJsonObject(value: Record<string, unknown>): JSONObject {
  return value as JSONObject
}
