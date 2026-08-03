import { randomUUID } from 'node:crypto'

import { z } from 'zod'

import {
  calculateReEditProServiceFeeCredits,
  REEDITPRO_CREDIT_POLICY_VERSION,
  REEDITPRO_FINAL_CHARGE_FORMULA,
  REEDITPRO_SERVICE_FEE_POLICY_VERSION,
} from '../../src/types/credit-policy'
import {
  CANONICAL_CUSTOMER_ESTIMATE_AUTHORITY_COMPONENT_KEY,
  CANONICAL_CUSTOMER_ESTIMATE_AUTHORITY_SOURCE,
  CANONICAL_CUSTOMER_ESTIMATE_AUTHORITY_VERSION,
} from '../../src/types/canonical-customer-estimate-authority'
import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  assertCanonicalProfessionalGpuPlanPricingAuthorityBundle,
  type CanonicalProfessionalGpuPlanPricingAuthorityReadPort,
} from './canonical-professional-gpu-plan-funded-dispatch-service'
import {
  type AuthorityGpuPlanFinalCreditSettlementRecord,
  type AuthorityGpuPlanFinalCreditSettlementWorkBinding,
  mutatePrivateEditAuthorityAggregate,
  readPrivateAuthorityJsonBlob,
  readPrivateEditAuthorityAggregate,
  sha256AuthorityValue,
  stableAuthorityStringify,
  walletBalanceAfter,
} from './private-edit-authority-store'
import { authorizeWorkspaceAccess } from './workspace-access-service'

export const CANONICAL_PROFESSIONAL_GPU_PLAN_FINAL_SETTLEMENT_READINESS_VERSION =
  'canonical-professional-gpu-plan-final-settlement-readiness-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_PLAN_FINAL_CREDIT_SETTLEMENT_VERSION =
  'canonical-professional-gpu-plan-final-credit-settlement-v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()

const finalSettlementRequestSchema = z.object({
  workspaceId: safeId,
  snapshotId: safeId,
  pricingAuthorityLookupWorkItemKey: safeId,
  settledAt: timestamp,
}).strict()

const readinessWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_PLAN_FINAL_SETTLEMENT_READINESS_VERSION,
  ),
  source: z.literal(
    'canonical_private_professional_edit_completion_readiness_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  readinessObservationId: safeId,
  approvedSnapshotRef: evidenceRefSchema,
  approvedPlanRef: evidenceRefSchema,
  approvedCustomerEstimateRef: evidenceRefSchema,
  fundedReservationRef: evidenceRefSchema,
  finalArtifactRef: evidenceRefSchema,
  deterministicQaRef: evidenceRefSchema,
  completeTimeVisualQaRef: evidenceRefSchema,
  qualifiedVisualQaRef: evidenceRefSchema,
  privateReviewDecisionRef: evidenceRefSchema,
  allRequiredApprovedWorkTerminal: z.literal(true),
  allRequiredAssetsReconciled: z.literal(true),
  deterministicQaPassed: z.literal(true),
  completeTimeVisualQaPassed: z.literal(true),
  qualifiedVisualQaPassed: z.literal(true),
  privateReviewAccepted: z.literal(true),
  activeGpuJobCount: z.literal(0),
  activeGpuInstances: z.literal(0),
  allGpuWorkersStoppedVerified: z.literal(true),
  callerOrBrowserCompletionAccepted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict()

export const canonicalProfessionalGpuPlanFinalSettlementReadinessSchema =
  readinessWithoutHashSchema.extend({ readinessObservationHash: sha256 })
    .strict()

export type CanonicalProfessionalGpuPlanFinalSettlementReadiness = z.infer<
  typeof canonicalProfessionalGpuPlanFinalSettlementReadinessSchema
>

export interface CanonicalProfessionalGpuPlanFinalSettlementReadinessReadPort {
  rereadPrivateCompletionReadiness(input: {
    readonly workspaceId: string
    readonly snapshotId: string
  }): Promise<unknown>
}

export interface CanonicalProfessionalGpuPlanFinalCreditSettlementResult {
  readonly settlement: AuthorityGpuPlanFinalCreditSettlementRecord
  readonly idempotentReplay: boolean
  readonly exactPersistedFinalSettlementReread: true
  readonly reservationFinalized: true
  readonly userTriggeredGpuCapacityVerifiedAtZero: true
  readonly externalCustomerWalletMutated: false
  readonly publicBillingAuthorityGranted: false
  readonly productionAuthorityGranted: false
}

const serviceFeeMetadataSchema = z.object({
  lineItemRole: z.literal('reeditpro_service_fee'),
  serverDerived: z.literal(true),
  productEditLevel: z.enum(['normal', 'premium', 'ultra_premium']),
  durationSeconds: z.number().finite().nonnegative(),
  durationBucket: z.enum([
    '0_5_min',
    '5_10_min',
    '10_20_min',
    '20_60_min',
    '60_plus_custom',
  ]),
  conservativeToolCostBasisCredits: z.number().int().nonnegative(),
  lengthFloorFeeCredits: z.number().int().nonnegative(),
  percentageFeeCredits: z.number().int().nonnegative(),
  serviceFeeCredits: z.number().int().nonnegative(),
  serviceFeeIncluded: z.literal(true),
  toolCostsIncludeServiceFee: z.literal(false),
  creditPolicyVersion: z.literal(REEDITPRO_CREDIT_POLICY_VERSION),
  serviceFeePolicyVersion: z.literal(REEDITPRO_SERVICE_FEE_POLICY_VERSION),
  finalChargeFormula: z.literal(REEDITPRO_FINAL_CHARGE_FORMULA),
  creditsReservedOnlyAfterApproval: z.literal(true),
  unusedApprovedReservationMustBeReleased: z.literal(true),
  billingExecuted: z.literal(false),
}).strict()

export function createCanonicalProfessionalGpuPlanFinalSettlementReadiness(
  input: z.input<typeof readinessWithoutHashSchema>,
): CanonicalProfessionalGpuPlanFinalSettlementReadiness {
  assertPlainSerializedData(input, 'GPU final-settlement readiness input')
  const payload = readinessWithoutHashSchema.parse(input)
  return canonicalProfessionalGpuPlanFinalSettlementReadinessSchema.parse({
    ...payload,
    readinessObservationHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalProfessionalGpuPlanFinalSettlementReadiness(
  value: unknown,
): CanonicalProfessionalGpuPlanFinalSettlementReadiness {
  try {
    assertPlainSerializedData(value, 'GPU final-settlement readiness')
    const record = canonicalProfessionalGpuPlanFinalSettlementReadinessSchema
      .parse(value)
    const { readinessObservationHash, ...payload } = record
    if (readinessObservationHash !== sha256AuthorityValue(payload)) {
      throw new ApiError(
        'VALIDATION_FAILED',
        'GPU final-settlement readiness digest is invalid.',
        409,
      )
    }
    return record
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(
      'VALIDATION_FAILED',
      'GPU final-settlement readiness is malformed.',
      409,
    )
  }
}

/**
 * Finalizes a GPU-only professional plan after every priced GPU work item has
 * one completed terminal settlement and the private completion owner has
 * accepted the final artifact. Attempt costs have already been spent exactly
 * once. This mutation spends only the recalculated service fee, absorbs any
 * unapproved overage, and releases the remaining shared plan reservation.
 *
 * Plans containing any positive non-GPU/non-service estimate line fail closed
 * until that tool owner supplies a versioned actual-cost settlement bridge.
 */
export async function settleCanonicalProfessionalGpuPlanFinalCredits(input: {
  readonly context: ServiceContext
  readonly workspaceId: string
  readonly snapshotId: string
  readonly pricingAuthorityLookupWorkItemKey: string
  readonly pricingAuthorityReadPort:
    CanonicalProfessionalGpuPlanPricingAuthorityReadPort
  readonly readinessReadPort:
    CanonicalProfessionalGpuPlanFinalSettlementReadinessReadPort
  readonly settledAt: string
}): Promise<CanonicalProfessionalGpuPlanFinalCreditSettlementResult> {
  const request = finalSettlementRequestSchema.safeParse({
    workspaceId: input.workspaceId,
    snapshotId: input.snapshotId,
    pricingAuthorityLookupWorkItemKey:
      input.pricingAuthorityLookupWorkItemKey,
    settledAt: input.settledAt,
  })
  if (!request.success) throw new ApiError(
    'VALIDATION_FAILED',
    'GPU final plan settlement request is malformed.',
    400,
  )
  const access = await authorizeWorkspaceAccess(
    input.context,
    request.data.workspaceId,
    'write',
  )
  const scope = {
    localStorageRoot: input.context.env.localStorageRoot,
    workspaceId: request.data.workspaceId,
    ownerUserId: access.userId,
  }
  const initial = await readPrivateEditAuthorityAggregate(scope)
  const snapshot = initial?.snapshots.find((record) =>
    record.snapshotId === request.data.snapshotId)
  const plan = snapshot && initial?.plans.find((record) =>
    record.id === snapshot.planId)
  if (!initial || !snapshot || !plan) throw new ApiError(
    'VALIDATION_FAILED',
    'GPU final settlement cannot find the approved snapshot authority.',
    409,
  )
  const settlementId = `gpu-plan-final-settlement:${snapshot.snapshotId}`
  const idempotencyKey = settlementId
  const existing = initial.gpuPlanFinalCreditSettlements.find((record) =>
    record.id === settlementId)

  const bundle = assertCanonicalProfessionalGpuPlanPricingAuthorityBundle(
    await input.pricingAuthorityReadPort.rereadPrivatePricingAuthority({
      workspaceId: request.data.workspaceId,
      snapshotId: request.data.snapshotId,
      workItemKey: request.data.pricingAuthorityLookupWorkItemKey,
      at: request.data.settledAt,
    }),
  )
  const readiness =
    assertCanonicalProfessionalGpuPlanFinalSettlementReadiness(
      await input.readinessReadPort.rereadPrivateCompletionReadiness({
        workspaceId: request.data.workspaceId,
        snapshotId: request.data.snapshotId,
      }),
    )
  if (existing) {
    if (
      existing.pricingAuthorityBundleId !== bundle.bundleId
      || existing.pricingAuthorityBundleHash !== bundle.bundleHash
      || existing.finalReadinessObservationId !==
        readiness.readinessObservationId
      || existing.finalReadinessObservationHash !==
        readiness.readinessObservationHash
    ) throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'GPU final settlement identity was reused with different evidence.',
      409,
    )
    return finalResult(existing, true)
  }

  const estimate = initial.estimates.find((record) =>
    record.id === snapshot.estimateId)
  const approval = initial.approvals.find((record) =>
    record.id === snapshot.approvalId)
  const reservation = initial.reservations.find((record) =>
    record.id === snapshot.reservationId)
  if (!estimate || !approval || !reservation) throw new ApiError(
    'VALIDATION_FAILED',
    'GPU final settlement approval, estimate, or reservation is missing.',
    409,
  )
  assertFinalLineage({
    snapshot,
    plan,
    estimate,
    approval,
    reservation,
    bundle,
    readiness,
    settledAt: request.data.settledAt,
  })
  const customerEstimateAuthorityRef = snapshot.componentRefs[
    CANONICAL_CUSTOMER_ESTIMATE_AUTHORITY_COMPONENT_KEY
  ]
  if (
    !customerEstimateAuthorityRef
    || stableAuthorityStringify(plan.componentRefs[
      CANONICAL_CUSTOMER_ESTIMATE_AUTHORITY_COMPONENT_KEY
    ]) !== stableAuthorityStringify(customerEstimateAuthorityRef)
  ) throw new ApiError(
    'VALIDATION_FAILED',
    'GPU final settlement is missing the immutable customer estimate authority.',
    409,
  )
  const customerEstimateAuthority = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: customerEstimateAuthorityRef,
  })
  if (Array.isArray(customerEstimateAuthority)) throw new ApiError(
    'VALIDATION_FAILED',
    'Canonical customer estimate authority must be an object.',
    409,
  )
  const estimateLines = await Promise.all(estimate.lineItems.map(async (line) => ({
    lineKey: line.lineKey,
    label: line.label,
    category: line.category,
    estimatedCredits: line.estimatedCredits,
    removable: line.removable,
    metadata: await readPrivateAuthorityJsonBlob({
      localStorageRoot: input.context.env.localStorageRoot,
      ref: line.metadataRef,
    }),
  })))
  const serviceLines = estimateLines.filter((line) =>
    line.lineKey === 'weeditpro-service-edit-fee'
    || line.category === 'service_fee')
  if (serviceLines.length !== 1 || Array.isArray(serviceLines[0]!.metadata)) {
    throw notReady('GPU final settlement requires one canonical service fee.')
  }
  const serviceLine = serviceLines[0]!
  const serviceMetadata = serviceFeeMetadataSchema.parse(serviceLine.metadata)
  const nonServiceLines = estimateLines.filter((line) => line !== serviceLine)
  const gpuLines = nonServiceLines.filter((line) =>
    line.category === 'gpu_tool_infrastructure'
    || line.lineKey.startsWith('gpu-tool-'))
  const unsupportedPositiveLines = nonServiceLines.filter((line) =>
    !gpuLines.includes(line) && line.estimatedCredits > 0)
  if (unsupportedPositiveLines.length > 0) throw notReady(
    'Positive non-GPU tool costs need their own actual-cost settlement owner.',
  )
  const expectedGpuLines = bundle.preapprovalManifest.entries.map((entry) =>
    entry.customerEstimateLine)
  if (stableAuthorityStringify(gpuLines) !==
    stableAuthorityStringify(expectedGpuLines)) throw new ApiError(
    'VALIDATION_FAILED',
    'Approved GPU estimate lines differ from the frozen pricing authority.',
    409,
  )
  const conservativeToolCredits = nonServiceLines.reduce((total, line) =>
    total + line.estimatedCredits, 0)
  const estimatedFee = calculateReEditProServiceFeeCredits({
    actualToolCostCredits: conservativeToolCredits,
    durationSeconds: serviceMetadata.durationSeconds,
    editLevel: serviceMetadata.productEditLevel,
  })
  if (
    estimatedFee.customEstimateRequired
    || estimatedFee.serviceFeeCredits === null
    || serviceLine.lineKey !== 'weeditpro-service-edit-fee'
    || serviceLine.label !== 'WeEditPro service/edit fee'
    || serviceLine.category !== 'service_fee'
    || serviceLine.removable
    || serviceLine.estimatedCredits !== estimatedFee.serviceFeeCredits
    || serviceMetadata.conservativeToolCostBasisCredits !==
      conservativeToolCredits
    || serviceMetadata.lengthFloorFeeCredits !==
      estimatedFee.lengthFloorFeeCredits
    || serviceMetadata.percentageFeeCredits !==
      estimatedFee.percentageFeeCredits
    || serviceMetadata.serviceFeeCredits !== estimatedFee.serviceFeeCredits
    || serviceMetadata.durationBucket !== estimatedFee.durationBucket
    || estimate.estimatedCredits !== estimateLines.reduce((total, line) =>
      total + line.estimatedCredits, 0)
    || estimate.approvedMaximumCredits !== estimate.estimatedCredits
      + estimate.fallbackAllowanceCredits
  ) throw new ApiError(
    'VALIDATION_FAILED',
    'Approved service-fee line failed exact server-policy reconstruction.',
    409,
    {
      serviceLineCredits: serviceLine.estimatedCredits,
      calculatedServiceFeeCredits: estimatedFee.serviceFeeCredits,
      metadataServiceFeeCredits: serviceMetadata.serviceFeeCredits,
      conservativeToolCredits,
      metadataConservativeToolCredits:
        serviceMetadata.conservativeToolCostBasisCredits,
      approvedEstimateCredits: estimate.estimatedCredits,
      reconstructedEstimateCredits: estimateLines.reduce((total, line) =>
        total + line.estimatedCredits, 0),
      approvedMaximumCredits: estimate.approvedMaximumCredits,
      fallbackAllowanceCredits: estimate.fallbackAllowanceCredits,
    },
  )
  assertCustomerEstimateAuthorityForSettlement({
    authority: customerEstimateAuthority,
    estimateLines,
    fallbackAllowanceCredits: estimate.fallbackAllowanceCredits,
    estimatedCredits: estimate.estimatedCredits,
    approvedMaximumCredits: estimate.approvedMaximumCredits,
    serviceMetadata,
  })

  const workBindings = buildWorkBindings({
    aggregate: initial,
    bundle,
    snapshotId: snapshot.snapshotId,
  })
  const actualToolCredits = workBindings.reduce((total, binding) =>
    total + binding.customerChargedToolCredits, 0)
  const actualFee = calculateReEditProServiceFeeCredits({
    actualToolCostCredits: actualToolCredits,
    durationSeconds: serviceMetadata.durationSeconds,
    editLevel: serviceMetadata.productEditLevel,
  })
  if (actualFee.customEstimateRequired || actualFee.serviceFeeCredits === null) {
    throw notReady('Actual GPU plan service fee requires a reviewed estimate.')
  }

  let idempotentReplay = false
  const settlement = await mutatePrivateEditAuthorityAggregate({
    scope,
    planningDomainScope: {
      ...scope,
      projectId: snapshot.projectId,
      editSessionId: snapshot.editSessionId,
    },
    now: request.data.settledAt,
    mutation: (aggregate) => {
      const replay = aggregate.gpuPlanFinalCreditSettlements.find((record) =>
        record.id === settlementId
        || record.snapshotId === snapshot.snapshotId
        || record.reservationId === reservation.id
        || record.idempotencyKey === idempotencyKey)
      if (replay) {
        if (
          replay.id !== settlementId
          || replay.pricingAuthorityBundleHash !== bundle.bundleHash
          || replay.finalReadinessObservationHash !==
            readiness.readinessObservationHash
        ) throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'GPU final settlement identity was reused with different evidence.',
          409,
        )
        idempotentReplay = true
        return { result: replay, changed: false }
      }
      const currentSnapshot = aggregate.snapshots.find((record) =>
        record.snapshotId === snapshot.snapshotId)
      const currentPlan = aggregate.plans.find((record) =>
        record.id === plan.id)
      const currentEstimate = aggregate.estimates.find((record) =>
        record.id === estimate.id)
      const currentApproval = aggregate.approvals.find((record) =>
        record.id === approval.id)
      const currentReservation = aggregate.reservations.find((record) =>
        record.id === reservation.id)
      const currentBindings = buildWorkBindings({
        aggregate,
        bundle,
        snapshotId: snapshot.snapshotId,
      })
      const currentActualToolCredits = currentBindings.reduce(
        (total, binding) => total + binding.customerChargedToolCredits,
        0,
      )
      const remaining = currentReservation
        ? currentReservation.reservedCredits
          - currentReservation.spentCredits
          - currentReservation.releasedCredits
          - currentReservation.refundedCredits
        : -1
      const grossFinalCharge = currentActualToolCredits
        + actualFee.serviceFeeCredits!
      const customerFinalCharge = Math.min(
        grossFinalCharge,
        estimate.approvedMaximumCredits,
      )
      const incrementalSpend = customerFinalCharge
        - currentActualToolCredits
      const release = estimate.approvedMaximumCredits - customerFinalCharge
      if (
        !currentSnapshot || !currentPlan || !currentEstimate
        || !currentApproval || !currentReservation
        || currentPlan.status !== 'approved'
        || currentEstimate.status !== 'approved'
        || !['reserved', 'partially_spent'].includes(currentReservation.status)
        || currentReservation.spentCredits !== currentActualToolCredits
        || currentReservation.releasedCredits !== 0
        || currentReservation.refundedCredits !== 0
        || remaining !== incrementalSpend + release
        || aggregate.wallet.reservedCredits < remaining
        || sha256AuthorityValue(currentSnapshot) !==
          sha256AuthorityValue(snapshot)
        || sha256AuthorityValue(currentPlan) !== sha256AuthorityValue(plan)
        || sha256AuthorityValue(currentEstimate) !==
          sha256AuthorityValue(estimate)
        || sha256AuthorityValue(currentApproval) !==
          sha256AuthorityValue(approval)
        || readiness.fundedReservationRef.contentHash !==
          `sha256:${sha256AuthorityValue(currentReservation)}`
        || stableAuthorityStringify(currentBindings) !==
          stableAuthorityStringify(workBindings)
      ) throw new ApiError(
        'IDEMPOTENCY_CONFLICT',
        'GPU final settlement authority changed before wallet finalization.',
        409,
      )

      if (incrementalSpend > 0) {
        aggregate.wallet.reservedCredits -= incrementalSpend
        aggregate.wallet.spentCredits += incrementalSpend
        aggregate.wallet.ledgerSequence += 1
        currentReservation.spentCredits += incrementalSpend
        aggregate.ledgerEntries.push({
          id: `authority_ledger_${randomUUID()}`,
          sequence: aggregate.wallet.ledgerSequence,
          entryType: 'spend',
          sourceType:
            'canonical_professional_gpu_plan_final_credit_settlement',
          sourceId: settlementId,
          availableDelta: 0,
          reservedDelta: -incrementalSpend,
          spentDelta: incrementalSpend,
          balanceAfter: walletBalanceAfter(aggregate.wallet),
          idempotencyKey: `${idempotencyKey}:service-fee`,
          createdAt: request.data.settledAt,
        })
        aggregate.reservationEvents.push({
          id: `authority_reservation_event_${randomUUID()}`,
          reservationId: currentReservation.id,
          snapshotId: currentSnapshot.snapshotId,
          approvalId: currentApproval.id,
          eventType: 'spent',
          credits: incrementalSpend,
          idempotencyKey: `${idempotencyKey}:service-fee`,
          createdAt: request.data.settledAt,
        })
      }
      if (release > 0) {
        aggregate.wallet.availableCredits += release
        aggregate.wallet.reservedCredits -= release
        aggregate.wallet.ledgerSequence += 1
        currentReservation.releasedCredits += release
        aggregate.ledgerEntries.push({
          id: `authority_ledger_${randomUUID()}`,
          sequence: aggregate.wallet.ledgerSequence,
          entryType: 'release',
          sourceType:
            'canonical_professional_gpu_plan_final_credit_settlement',
          sourceId: settlementId,
          availableDelta: release,
          reservedDelta: -release,
          spentDelta: 0,
          balanceAfter: walletBalanceAfter(aggregate.wallet),
          idempotencyKey: `${idempotencyKey}:release`,
          createdAt: request.data.settledAt,
        })
        aggregate.reservationEvents.push({
          id: `authority_reservation_event_${randomUUID()}`,
          reservationId: currentReservation.id,
          snapshotId: currentSnapshot.snapshotId,
          approvalId: currentApproval.id,
          eventType: 'released',
          credits: release,
          idempotencyKey: `${idempotencyKey}:release`,
          createdAt: request.data.settledAt,
        })
      }
      currentReservation.status = release > 0 ? 'released' : 'spent'
      currentReservation.updatedAt = request.data.settledAt
      const payload = {
        schemaVersion:
          CANONICAL_PROFESSIONAL_GPU_PLAN_FINAL_CREDIT_SETTLEMENT_VERSION,
        id: settlementId,
        pricingAuthorityBundleId: bundle.bundleId,
        pricingAuthorityBundleHash: bundle.bundleHash,
        finalReadinessObservationId: readiness.readinessObservationId,
        finalReadinessObservationHash: readiness.readinessObservationHash,
        snapshotId: currentSnapshot.snapshotId,
        approvalId: currentApproval.id,
        reservationId: currentReservation.id,
        planId: currentPlan.id,
        estimateId: currentEstimate.id,
        workBindings: currentBindings,
        actualBillableGpuToolCostCredits: currentActualToolCredits,
        calculatedServiceFeeCredits: actualFee.serviceFeeCredits!,
        grossFinalChargeCredits: grossFinalCharge,
        approvedMaximumCredits: currentEstimate.approvedMaximumCredits,
        customerCreditsSpentBeforeFinalSettlement: currentActualToolCredits,
        customerServiceFeeCreditsChargedAtFinalSettlement: incrementalSpend,
        customerTotalChargedCredits: customerFinalCharge,
        weeditproAbsorbedOverageCredits:
          grossFinalCharge - customerFinalCharge,
        unusedReservationCreditsReleased: release,
        unknownGpuAttemptOutcomeCount: 0 as const,
        allPricedGpuWorkCompletedExactlyOnce: true as const,
        exactApprovedEstimateAndServiceFeePolicyReread: true as const,
        exactAttemptSettlementSetReread: true as const,
        exactPrivateCompletionReadinessReread: true as const,
        activeGpuInstancesAtFinalSettlement: 0 as const,
        reservationFinalized: true as const,
        privateInternalWalletMutated: true as const,
        externalCustomerWalletMutated: false as const,
        publicBillingAuthorityGranted: false as const,
        publicDeliveryAuthorityGranted: false as const,
        productionAuthorityGranted: false as const,
        idempotencyKey,
        createdAt: request.data.settledAt,
      }
      const record: AuthorityGpuPlanFinalCreditSettlementRecord = {
        ...payload,
        settlementHash: sha256AuthorityValue(payload),
      }
      aggregate.gpuPlanFinalCreditSettlements.push(record)
      aggregate.auditEvents.push({
        id: `authority_audit_${randomUUID()}`,
        eventType: 'canonical_professional_gpu_plan_final_credit_settled',
        actorUserId: access.userId,
        projectId: currentSnapshot.projectId,
        editSessionId: currentSnapshot.editSessionId,
        planId: currentPlan.id,
        snapshotId: currentSnapshot.snapshotId,
        createdAt: request.data.settledAt,
      })
      return { result: record, changed: true }
    },
  })

  const reread = await readPrivateEditAuthorityAggregate(scope)
  const rereadSettlement = reread?.gpuPlanFinalCreditSettlements.find(
    (record) => record.id === settlement.id,
  )
  if (
    !rereadSettlement
    || rereadSettlement.settlementHash !== settlement.settlementHash
    || sha256AuthorityValue({
      ...rereadSettlement,
      settlementHash: undefined,
    }) !== rereadSettlement.settlementHash
  ) throw new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'GPU final plan credit settlement exact reread failed.',
    409,
  )
  return finalResult(rereadSettlement, idempotentReplay)
}

function assertFinalLineage(input: {
  snapshot: NonNullable<Awaited<ReturnType<
    typeof readPrivateEditAuthorityAggregate
  >>>['snapshots'][number]
  plan: NonNullable<Awaited<ReturnType<
    typeof readPrivateEditAuthorityAggregate
  >>>['plans'][number]
  estimate: NonNullable<Awaited<ReturnType<
    typeof readPrivateEditAuthorityAggregate
  >>>['estimates'][number]
  approval: NonNullable<Awaited<ReturnType<
    typeof readPrivateEditAuthorityAggregate
  >>>['approvals'][number]
  reservation: NonNullable<Awaited<ReturnType<
    typeof readPrivateEditAuthorityAggregate
  >>>['reservations'][number]
  bundle: ReturnType<typeof assertCanonicalProfessionalGpuPlanPricingAuthorityBundle>
  readiness: CanonicalProfessionalGpuPlanFinalSettlementReadiness
  settledAt: string
}): void {
  const { snapshot, plan, estimate, approval, reservation, bundle,
    readiness } = input
  const exact = snapshot.planId === plan.id
    && snapshot.estimateId === estimate.id
    && snapshot.approvalId === approval.id
    && snapshot.reservationId === reservation.id
    && plan.status === 'approved'
    && estimate.status === 'approved'
    && ['reserved', 'partially_spent'].includes(reservation.status)
    && reservation.reservedCredits === estimate.approvedMaximumCredits
    && reservation.releasedCredits === 0
    && reservation.refundedCredits === 0
    && bundle.pricingBasis.scope.workspaceId === snapshot.workspaceId
    && bundle.pricingBasis.scope.projectId === snapshot.projectId
    && bundle.pricingBasis.scope.editSessionId === snapshot.editSessionId
    && bundle.publicationBinding.publishedPlanRef.id === plan.id
    && bundle.publicationBinding.publishedPlanRef.version === plan.planVersion
    && bundle.publicationBinding.publishedPlanRef.contentHash ===
      `sha256:${plan.planHash}`
    && bundle.publicationBinding.publishedCustomerEstimateRef.id ===
      estimate.id
    && bundle.publicationBinding.publishedCustomerEstimateRef.version ===
      estimate.estimateVersion
    && bundle.publicationBinding.publishedCustomerEstimateRef.contentHash ===
      `sha256:${estimate.estimateHash}`
    && sameRef(readiness.approvedSnapshotRef, {
      id: snapshot.snapshotId,
      version: snapshot.planVersion,
      contentHash: `sha256:${snapshot.snapshotHash}`,
    })
    && sameRef(readiness.approvedPlanRef,
      bundle.publicationBinding.publishedPlanRef)
    && sameRef(readiness.approvedCustomerEstimateRef,
      bundle.publicationBinding.publishedCustomerEstimateRef)
    && sameRef(readiness.fundedReservationRef, {
      id: reservation.id,
      version: 1,
      contentHash: `sha256:${sha256AuthorityValue(reservation)}`,
    })
    && Date.parse(readiness.observedAt) <= Date.parse(input.settledAt)
  if (!exact) throw new ApiError(
    'VALIDATION_FAILED',
    'GPU final settlement plan, estimate, reservation, or readiness crossed.',
    409,
  )
}

function buildWorkBindings(input: {
  aggregate: NonNullable<Awaited<ReturnType<
    typeof readPrivateEditAuthorityAggregate
  >>>
  bundle: ReturnType<typeof assertCanonicalProfessionalGpuPlanPricingAuthorityBundle>
  snapshotId: string
}): AuthorityGpuPlanFinalCreditSettlementWorkBinding[] {
  const expectedIds = new Set<string>()
  const bindings = input.bundle.dispatchEstimateSet.entries.map((entry) => {
    const unit = input.bundle.pricingBasis.pricingUnits.find((candidate) =>
      candidate.workItemKey === entry.workItemKey)
    const approvedWork = input.aggregate.approvedWorkItems.find((record) =>
      record.id === entry.approvedWorkItemRef.id)
    if (
      !unit || !approvedWork
      || approvedWork.workItemKey !== entry.workItemKey
      || approvedWork.snapshotId !== input.snapshotId
      || entry.approvedWorkItemRef.contentHash !==
        `sha256:${sha256AuthorityValue(approvedWork)}`
      || approvedWork.maximumCreditBudget !==
        entry.estimate.maximumReservedToolCostCredits
    ) throw new ApiError(
      'VALIDATION_FAILED',
      'GPU final settlement approved work binding is invalid.',
      409,
    )
    const attempts = input.aggregate.gpuAttemptCreditSettlements
      .filter((record) => record.approvedWorkItemId === approvedWork.id)
      .sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0)
    const completed = attempts.filter((record) =>
      record.terminalOutcome === 'completed')
    if (
      attempts.length === 0
      || attempts.some((record) =>
        record.snapshotId !== approvedWork.snapshotId
        || record.terminalOutcome === 'unknown_requires_reconciliation')
      || completed.length !== 1
      || attempts.reduce((total, record) =>
        total + record.customerChargedCredits, 0) >
        approvedWork.maximumCreditBudget
    ) throw notReady(
      'Every priced GPU work item needs one known completed attempt settlement.',
    )
    attempts.forEach((record) => expectedIds.add(record.id))
    return {
      workItemKey: entry.workItemKey,
      approvedWorkItemId: approvedWork.id,
      approvedToolCeilingCredits: approvedWork.maximumCreditBudget,
      completedAttemptSettlementId: completed[0]!.id,
      attemptSettlementIds: attempts.map((record) => record.id),
      attemptSettlementHashes: attempts.map((record) => record.settlementHash),
      customerChargedToolCredits: attempts.reduce((total, record) =>
        total + record.customerChargedCredits, 0),
    }
  }).sort((left, right) => left.workItemKey < right.workItemKey
    ? -1 : left.workItemKey > right.workItemKey ? 1 : 0)
  const reservationId = input.aggregate.snapshots.find((record) =>
    record.snapshotId === input.snapshotId)?.reservationId
  const allForReservation = input.aggregate.gpuAttemptCreditSettlements
    .filter((record) => record.reservationId === reservationId)
  if (
    expectedIds.size !== allForReservation.length
    || allForReservation.some((record) => !expectedIds.has(record.id))
  ) throw new ApiError(
    'VALIDATION_FAILED',
    'GPU final settlement contains an extra or unbound attempt settlement.',
    409,
  )
  return bindings
}

function assertCustomerEstimateAuthorityForSettlement(input: {
  authority: Record<string, unknown>
  estimateLines: readonly {
    lineKey: string
    label: string
    category: string
    estimatedCredits: number
    removable: boolean
    metadata: Record<string, unknown> | unknown[]
  }[]
  fallbackAllowanceCredits: number
  estimatedCredits: number
  approvedMaximumCredits: number
  serviceMetadata: z.infer<typeof serviceFeeMetadataSchema>
}): void {
  const authority = input.authority
  const digest = authority.authorityDigestSha256
  const payload = { ...authority }
  Reflect.deleteProperty(payload, 'authorityDigestSha256')
  const serviceProjection = authority.serviceFeeProjection
  const normalizedEstimate = authority.normalizedEstimate
  const exact = authority.schemaVersion ===
      CANONICAL_CUSTOMER_ESTIMATE_AUTHORITY_VERSION
    && authority.source === CANONICAL_CUSTOMER_ESTIMATE_AUTHORITY_SOURCE
    && authority.evidenceClass ===
      'private_internal_server_recalculated_customer_estimate'
    && typeof digest === 'string'
    && digest === sha256AuthorityValue(payload)
    && isPlainRecord(serviceProjection)
    && serviceProjection.lineKey === 'weeditpro-service-edit-fee'
    && serviceProjection.productEditLevel ===
      input.serviceMetadata.productEditLevel
    && serviceProjection.durationSeconds === input.serviceMetadata.durationSeconds
    && serviceProjection.durationBucket === input.serviceMetadata.durationBucket
    && serviceProjection.conservativeToolCostBasisCredits ===
      input.serviceMetadata.conservativeToolCostBasisCredits
    && serviceProjection.lengthFloorFeeCredits ===
      input.serviceMetadata.lengthFloorFeeCredits
    && serviceProjection.percentageFeeCredits ===
      input.serviceMetadata.percentageFeeCredits
    && serviceProjection.serviceFeeCredits ===
      input.serviceMetadata.serviceFeeCredits
    && serviceProjection.serviceFeeIncludedInToolCosts === false
    && isPlainRecord(normalizedEstimate)
    && stableAuthorityStringify(normalizedEstimate) ===
      stableAuthorityStringify({
        lineItems: input.estimateLines,
        fallbackAllowanceCredits: input.fallbackAllowanceCredits,
        validForSeconds: normalizedEstimate.validForSeconds,
      })
    && authority.normalizedEstimatedCredits === input.estimatedCredits
    && authority.normalizedApprovedMaximumCredits ===
      input.approvedMaximumCredits
    && authority.creditPolicyVersion === REEDITPRO_CREDIT_POLICY_VERSION
    && authority.serviceFeePolicyVersion ===
      REEDITPRO_SERVICE_FEE_POLICY_VERSION
    && authority.finalChargeFormula === REEDITPRO_FINAL_CHARGE_FORMULA
    && authority.estimatePresentedBeforeApproval === true
    && authority.creditsReservedOnlyAfterApproval === true
    && authority.actualChargeStillRequiresActualBillableToolCost === true
    && authority.unusedApprovedReservationMustBeReleased === true
    && authority.customerWalletMutationAuthority === false
    && authority.creditReservationAuthority === false
    && authority.ledgerAuthority === false
    && authority.approvalAuthority === false
    && authority.providerAuthority === false
    && authority.toolExecutionAuthority === false
    && authority.workerAuthority === false
    && authority.renderAuthority === false
    && authority.billingAuthority === false
    && authority.productionAuthority === false
  if (!exact) throw new ApiError(
    'VALIDATION_FAILED',
    'Canonical customer estimate authority failed final settlement reread.',
    409,
  )
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value)
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype
}

function finalResult(
  settlement: AuthorityGpuPlanFinalCreditSettlementRecord,
  idempotentReplay: boolean,
): CanonicalProfessionalGpuPlanFinalCreditSettlementResult {
  return Object.freeze({
    settlement: structuredClone(settlement),
    idempotentReplay,
    exactPersistedFinalSettlementReread: true as const,
    reservationFinalized: true as const,
    userTriggeredGpuCapacityVerifiedAtZero: true as const,
    externalCustomerWalletMutated: false as const,
    publicBillingAuthorityGranted: false as const,
    productionAuthorityGranted: false as const,
  })
}

function sameRef(
  left: { readonly id: string; readonly version: number;
    readonly contentHash: string },
  right: { readonly id: string; readonly version: number;
    readonly contentHash: string },
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function notReady(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 409, {
    requiredGate: 'canonical_gpu_plan_final_credit_settlement',
  })
}

function assertPlainSerializedData(
  value: unknown,
  label: string,
  state: {
    readonly seen: Set<object>
    entries: number
    characters: number
  } = { seen: new Set<object>(), entries: 0, characters: 0 },
  depth = 0,
): void {
  if (depth > 18) throw new Error(`${label} nesting is too deep.`)
  if (
    value === null
    || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value))
  ) return
  if (typeof value === 'string') {
    state.characters += value.length
    if (value.length > 16_384 || state.characters > 4_000_000) {
      throw new Error(`${label} string data is too large.`)
    }
    return
  }
  if (typeof value !== 'object') {
    throw new Error(`${label} is not serialized plain data.`)
  }
  if (state.seen.has(value)) throw new Error(`${label} contains a cycle.`)
  state.seen.add(value)
  let prototype: object | null
  let keys: readonly PropertyKey[]
  try {
    prototype = Object.getPrototypeOf(value)
    keys = Reflect.ownKeys(value)
  } catch {
    throw new Error(`${label} cannot be inspected safely.`)
  }
  if (
    prototype !== Object.prototype
    && prototype !== Array.prototype
  ) throw new Error(`${label} has a non-plain prototype.`)
  if (keys.length > 1_024) throw new Error(`${label} has too many entries.`)
  state.entries += keys.length
  if (state.entries > 16_384) {
    throw new Error(`${label} serialized tree is too large.`)
  }
  for (const key of keys) {
    if (typeof key !== 'string') throw new Error(`${label} has a symbol key.`)
    let descriptor: PropertyDescriptor | undefined
    try {
      descriptor = Object.getOwnPropertyDescriptor(value, key)
    } catch {
      throw new Error(`${label}.${key} cannot be inspected safely.`)
    }
    if (!descriptor || !('value' in descriptor)) {
      throw new Error(`${label}.${key} has an accessor.`)
    }
    assertPlainSerializedData(
      descriptor.value,
      `${label}.${key}`,
      state,
      depth + 1,
    )
  }
  state.seen.delete(value)
}
