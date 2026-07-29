import { z } from 'zod'

import {
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_SETTLEMENT_CONTRIBUTION_CLASS,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_SETTLEMENT_CONTRIBUTION_VERSION,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_SETTLEMENT_OPEN_GATES,
  type LivingFrameControlledIllustrationSettlementAuthorityBoundary,
  type LivingFrameControlledIllustrationSettlementContribution,
  type LivingFrameControlledIllustrationSettlementContributionDraft,
  type LivingFrameControlledIllustrationSettlementContributionEvent,
} from '../../src/types/living-frame-controlled-illustration-settlement-contribution'
import type {
  LivingFrameControlledIllustrationActualCostAttribution,
} from '../../src/types/living-frame-controlled-illustration-actual-cost-attribution'
import { CREDIT_RETAIL_VALUE_CENTS } from '../../src/types/credit-policy'
import { ApiError } from '../errors/api-error'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import { COST_MICROS_PER_CENT } from '../tool-cost-metering/rate-card'
import {
  verifyLivingFrameControlledIllustrationActualCostAttribution,
} from './living-frame-controlled-illustration-actual-cost-attribution'

const SHA256 = /^[a-f0-9]{64}$/u
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const MICROS_PER_CREDIT =
  COST_MICROS_PER_CENT * CREDIT_RETAIL_VALUE_CENTS

const AUTHORITY_BOUNDARY:
  LivingFrameControlledIllustrationSettlementAuthorityBoundary =
  Object.freeze({
    controlledSettlementProjectionOnly: true,
    officialRateAuthority: false,
    invoiceAuthority: false,
    customerPriceAuthority: false,
    finalCustomerCreditAuthority: false,
    billabilityAuthority: false,
    serviceFeeAuthority: false,
    approvalAuthority: false,
    reservationAuthority: false,
    overageDecisionAuthority: false,
    refundAuthority: false,
    walletAuthority: false,
    ledgerAuthority: false,
    settlementTransactionAuthority: false,
    exportUnlockAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

const inputSchema = z.object({
  contributionId: z.string().regex(SAFE_ID),
  actualCostAttribution: z.unknown(),
  approvedCustomerEstimateDigestSha256: z.string().regex(SHA256),
  canonicalBillabilityPolicyDigestSha256: z.string().regex(SHA256),
  approvedLivingFrameToolCostCreditCeiling:
    z.number().int().nonnegative().max(10_000_000),
}).strict()

const eventSchema = z.object({
  order: z.number().int().nonnegative().max(10_000),
  sourceEvidenceId: z.string().regex(SAFE_ID),
  sourceEvidenceHashSha256: z.string().regex(SHA256),
  executionAttemptId: z.string().regex(SAFE_ID),
  approvedWorkItemId: z.string().regex(SAFE_ID),
  costComponentId: z.enum([
    'shared_controlled_illustration_gpu_host',
    'auraface_cpu_continuity_measurement',
  ]),
  actualInternalCostMicros:
    z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  outcome: z.enum(['completed', 'failed', 'unknown']),
  includedInBillableToolCostCandidate: z.boolean(),
  billabilityReason: z.enum([
    'completed_attempt_candidate',
    'reeditpro_failure_absorbed',
    'unknown_attempt_absorbed',
  ]),
  allocatedBillableToolCostCredits:
    z.number().int().nonnegative().max(10_000_000),
  serviceFeeIncluded: z.literal(false),
  customerChargeAuthority: z.literal(false),
}).strict()

const authorityBoundarySchema = z.object({
  controlledSettlementProjectionOnly: z.literal(true),
  officialRateAuthority: z.literal(false),
  invoiceAuthority: z.literal(false),
  customerPriceAuthority: z.literal(false),
  finalCustomerCreditAuthority: z.literal(false),
  billabilityAuthority: z.literal(false),
  serviceFeeAuthority: z.literal(false),
  approvalAuthority: z.literal(false),
  reservationAuthority: z.literal(false),
  overageDecisionAuthority: z.literal(false),
  refundAuthority: z.literal(false),
  walletAuthority: z.literal(false),
  ledgerAuthority: z.literal(false),
  settlementTransactionAuthority: z.literal(false),
  exportUnlockAuthority: z.literal(false),
  runtimeAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

const draftSchema = z.object({
  contractVersion: z.literal(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_SETTLEMENT_CONTRIBUTION_VERSION,
  ),
  resultClass: z.literal(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_SETTLEMENT_CONTRIBUTION_CLASS,
  ),
  contributionId: z.string().regex(SAFE_ID),
  sourceBindings: z.object({
    actualCostAttributionDigestSha256: z.string().regex(SHA256),
    approvedCustomerEstimateDigestSha256: z.string().regex(SHA256),
    canonicalBillabilityPolicyDigestSha256: z.string().regex(SHA256),
  }).strict(),
  approvedLivingFrameToolCostCreditCeiling:
    z.number().int().nonnegative().max(10_000_000),
  events: z.array(eventSchema).max(1_000),
  aggregate: z.object({
    totalObservedInternalCostMicros:
      z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    billableCandidateInternalCostMicros:
      z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    absorbedInternalCostMicros:
      z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    billableCandidateToolCostCredits:
      z.number().int().nonnegative().max(10_000_000),
    approvedLivingFrameToolCostCreditCeiling:
      z.number().int().nonnegative().max(10_000_000),
    projectedUnapprovedOverageCredits:
      z.number().int().nonnegative().max(10_000_000),
    withinApprovedLivingFrameToolCostCeiling: z.boolean(),
    completedCandidateCount:
      z.number().int().nonnegative().max(1_000),
    absorbedFailureCount:
      z.number().int().nonnegative().max(1_000),
    absorbedUnknownCount:
      z.number().int().nonnegative().max(1_000),
    exactReuseCount: z.number().int().nonnegative().max(1_000),
    aggregateMicrosBeforeCreditRounding: z.literal(true),
    allocatedEventCreditsEqualAggregateCredits: z.literal(true),
    sixCapabilitiesNeverBecomeSixCharges: z.literal(true),
    exactReuseCreatesNoSettlementEvent: z.literal(true),
  }).strict(),
  openGateCodes: z.array(z.enum(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_SETTLEMENT_OPEN_GATES,
  )).length(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_SETTLEMENT_OPEN_GATES.length,
  ),
  authorityBoundary: authorityBoundarySchema,
  serviceFeeLinePresent: z.literal(false),
  finalCustomerChargePresent: z.literal(false),
  walletMutationPerformed: z.literal(false),
  settlementEventPersisted: z.literal(false),
  productionReady: z.literal(false),
}).strict()

const contributionSchema = draftSchema.extend({
  contributionDigestSha256: z.string().regex(SHA256),
}).strict()

export function compileLivingFrameControlledIllustrationSettlementContribution(
  rawInput: {
    readonly contributionId: string
    readonly actualCostAttribution:
      LivingFrameControlledIllustrationActualCostAttribution
    readonly approvedCustomerEstimateDigestSha256: string
    readonly canonicalBillabilityPolicyDigestSha256: string
    readonly approvedLivingFrameToolCostCreditCeiling: number
  },
): LivingFrameControlledIllustrationSettlementContribution {
  const parsed = inputSchema.safeParse(rawInput)
  if (!parsed.success) throw invalid('Settlement contribution input is invalid.')
  if (
    !verifyLivingFrameControlledIllustrationActualCostAttribution(
      parsed.data.actualCostAttribution,
    )
  ) throw invalid('Actual-cost attribution is invalid.')
  const attribution = parsed.data.actualCostAttribution
  const events =
    attribution.attemptAttributions.map((attempt, order) =>
      compileEvent(attempt, order))
  const completedEvents = events.filter((event) =>
    event.includedInBillableToolCostCandidate)
  const billableMicros = safeSum(completedEvents.map((event) =>
    event.actualInternalCostMicros))
  const billableCredits = billableMicros === 0
    ? 0
    : Math.ceil(billableMicros / MICROS_PER_CREDIT)
  const allocations = allocateAggregateCredits(
    completedEvents,
    billableCredits,
  )
  const allocatedEvents = events.map((event) => Object.freeze({
    ...event,
    allocatedBillableToolCostCredits:
      allocations.get(event.sourceEvidenceId) ?? 0,
  }))
  const totalObservedMicros =
    attribution.aggregate.totalObservedAttemptInternalCostMicros
  const absorbedMicros = totalObservedMicros - billableMicros
  if (absorbedMicros < 0) {
    throw invalid('Settlement contribution cost conservation failed.')
  }
  const ceiling =
    parsed.data.approvedLivingFrameToolCostCreditCeiling
  const draft:
    LivingFrameControlledIllustrationSettlementContributionDraft = {
      contractVersion:
        LIVING_FRAME_CONTROLLED_ILLUSTRATION_SETTLEMENT_CONTRIBUTION_VERSION,
      resultClass:
        LIVING_FRAME_CONTROLLED_ILLUSTRATION_SETTLEMENT_CONTRIBUTION_CLASS,
      contributionId: parsed.data.contributionId,
      sourceBindings: {
        actualCostAttributionDigestSha256:
          attribution.attributionDigestSha256,
        approvedCustomerEstimateDigestSha256:
          parsed.data.approvedCustomerEstimateDigestSha256,
        canonicalBillabilityPolicyDigestSha256:
          parsed.data.canonicalBillabilityPolicyDigestSha256,
      },
      approvedLivingFrameToolCostCreditCeiling: ceiling,
      events: allocatedEvents,
      aggregate: {
        totalObservedInternalCostMicros: totalObservedMicros,
        billableCandidateInternalCostMicros: billableMicros,
        absorbedInternalCostMicros: absorbedMicros,
        billableCandidateToolCostCredits: billableCredits,
        approvedLivingFrameToolCostCreditCeiling: ceiling,
        projectedUnapprovedOverageCredits:
          Math.max(0, billableCredits - ceiling),
        withinApprovedLivingFrameToolCostCeiling:
          billableCredits <= ceiling,
        completedCandidateCount: completedEvents.length,
        absorbedFailureCount:
          events.filter((event) => event.outcome === 'failed').length,
        absorbedUnknownCount:
          events.filter((event) => event.outcome === 'unknown').length,
        exactReuseCount:
          attribution.exactReuseAttributions.length,
        aggregateMicrosBeforeCreditRounding: true,
        allocatedEventCreditsEqualAggregateCredits: true,
        sixCapabilitiesNeverBecomeSixCharges: true,
        exactReuseCreatesNoSettlementEvent: true,
      },
      openGateCodes: [
        ...LIVING_FRAME_CONTROLLED_ILLUSTRATION_SETTLEMENT_OPEN_GATES,
      ],
      authorityBoundary: AUTHORITY_BOUNDARY,
      serviceFeeLinePresent: false,
      finalCustomerChargePresent: false,
      walletMutationPerformed: false,
      settlementEventPersisted: false,
      productionReady: false,
    }
  assertSemantics(draft)
  return Object.freeze({
    ...draft,
    contributionDigestSha256: sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameControlledIllustrationSettlementContribution(
  value: unknown,
): value is LivingFrameControlledIllustrationSettlementContribution {
  const parsed = contributionSchema.safeParse(value)
  if (!parsed.success) return false
  const { contributionDigestSha256, ...draft } = parsed.data
  try {
    assertSemantics(draft)
    return (
      contributionDigestSha256 === sha256AuthorityValue(draft)
      && stableAuthorityStringify(draft.openGateCodes)
        === stableAuthorityStringify(
          LIVING_FRAME_CONTROLLED_ILLUSTRATION_SETTLEMENT_OPEN_GATES,
        )
      && stableAuthorityStringify(draft.authorityBoundary)
        === stableAuthorityStringify(AUTHORITY_BOUNDARY)
    )
  } catch {
    return false
  }
}

function compileEvent(
  attempt:
    LivingFrameControlledIllustrationActualCostAttribution[
      'attemptAttributions'
    ][number],
  order: number,
): Omit<
  LivingFrameControlledIllustrationSettlementContributionEvent,
  'allocatedBillableToolCostCredits'
> {
  const completed = attempt.outcome === 'completed'
  return Object.freeze({
    order,
    sourceEvidenceId: attempt.evidenceId,
    sourceEvidenceHashSha256: attempt.evidenceHashSha256,
    executionAttemptId: attempt.executionAttemptId,
    approvedWorkItemId: attempt.approvedWorkItemId,
    costComponentId: attempt.costComponentId,
    actualInternalCostMicros: attempt.actualInternalCostMicros,
    outcome: attempt.outcome,
    includedInBillableToolCostCandidate: completed,
    billabilityReason: completed
      ? 'completed_attempt_candidate' as const
      : attempt.outcome === 'failed'
        ? 'reeditpro_failure_absorbed' as const
        : 'unknown_attempt_absorbed' as const,
    serviceFeeIncluded: false,
    customerChargeAuthority: false,
  })
}

function allocateAggregateCredits(
  events: readonly Omit<
    LivingFrameControlledIllustrationSettlementContributionEvent,
    'allocatedBillableToolCostCredits'
  >[],
  totalCredits: number,
): ReadonlyMap<string, number> {
  if (events.length === 0) return new Map()
  const rows = events.map((event) => ({
    id: event.sourceEvidenceId,
    floorCredits:
      Math.floor(event.actualInternalCostMicros / MICROS_PER_CREDIT),
    remainderMicros:
      event.actualInternalCostMicros % MICROS_PER_CREDIT,
  }))
  let remaining = totalCredits - safeSum(
    rows.map((row) => row.floorCredits),
  )
  const ordered = [...rows].sort((left, right) =>
    right.remainderMicros - left.remainderMicros
    || left.id.localeCompare(right.id))
  const allocation = new Map(
    rows.map((row) => [row.id, row.floorCredits]),
  )
  for (const row of ordered) {
    if (remaining <= 0) break
    allocation.set(row.id, (allocation.get(row.id) ?? 0) + 1)
    remaining -= 1
  }
  if (remaining !== 0) {
    throw invalid('Aggregate credit allocation failed.')
  }
  return allocation
}

function assertSemantics(
  draft: LivingFrameControlledIllustrationSettlementContributionDraft,
): void {
  draft.events.forEach((event, order) => {
    if (event.order !== order) {
      throw invalid('Settlement contribution event order changed.')
    }
    const completed = event.outcome === 'completed'
    if (
      event.includedInBillableToolCostCandidate !== completed
      || (completed
        && event.billabilityReason !==
          'completed_attempt_candidate')
      || (!completed
        && event.outcome === 'failed'
        && event.billabilityReason !==
          'reeditpro_failure_absorbed')
      || (!completed
        && event.outcome === 'unknown'
        && event.billabilityReason !==
          'unknown_attempt_absorbed')
      || (!completed
        && event.allocatedBillableToolCostCredits !== 0)
    ) throw invalid('Settlement contribution billability changed.')
  })
  assertUnique(draft.events.map((event) => event.sourceEvidenceId))
  const billableEvents = draft.events.filter((event) =>
    event.includedInBillableToolCostCandidate)
  const totalMicros = safeSum(draft.events.map((event) =>
    event.actualInternalCostMicros))
  const billableMicros = safeSum(billableEvents.map((event) =>
    event.actualInternalCostMicros))
  const billableCredits = safeSum(billableEvents.map((event) =>
    event.allocatedBillableToolCostCredits))
  const expectedCredits = billableMicros === 0
    ? 0
    : Math.ceil(billableMicros / MICROS_PER_CREDIT)
  if (
    totalMicros !== draft.aggregate.totalObservedInternalCostMicros
    || billableMicros !==
      draft.aggregate.billableCandidateInternalCostMicros
    || totalMicros - billableMicros !==
      draft.aggregate.absorbedInternalCostMicros
    || billableCredits !== expectedCredits
    || billableCredits !==
      draft.aggregate.billableCandidateToolCostCredits
    || draft.aggregate.approvedLivingFrameToolCostCreditCeiling
      !== draft.approvedLivingFrameToolCostCreditCeiling
    || draft.aggregate.projectedUnapprovedOverageCredits
      !== Math.max(
        0,
        expectedCredits
          - draft.approvedLivingFrameToolCostCreditCeiling,
      )
    || draft.aggregate.withinApprovedLivingFrameToolCostCeiling
      !== (
        expectedCredits
        <= draft.approvedLivingFrameToolCostCreditCeiling
      )
  ) throw invalid('Settlement contribution aggregate changed.')
}

function assertUnique(values: readonly string[]): void {
  if (new Set(values).size !== values.length) {
    throw invalid('Settlement contribution identity is duplicated.')
  }
}

function safeSum(values: readonly number[]): number {
  const total = values.reduce((sum, value) => sum + value, 0)
  if (!Number.isSafeInteger(total) || total < 0) {
    throw invalid('Settlement contribution total is invalid.')
  }
  return total
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400, {
    productionReady: false,
    settlementAuthority: false,
  })
}
