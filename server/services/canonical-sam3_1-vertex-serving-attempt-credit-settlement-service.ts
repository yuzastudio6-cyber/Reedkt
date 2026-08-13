import { randomUUID } from 'node:crypto'

import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  assertCanonicalSam31VertexServingReconciledWindowCostReceipt,
  type CanonicalSam31VertexServingReconciledWindowCostReceipt,
} from '../tool-cost-metering/canonical-sam3_1-vertex-serving-reconciled-window-cost'
import {
  assertCanonicalSam31VertexServingWindowCostReceipt,
} from '../tool-cost-metering/canonical-sam3_1-vertex-serving-window-cost-authority'
import type { ServiceContext } from '../types'
import {
  type AuthoritySam31VertexServingAttemptCreditSettlementRecordV2,
  mutatePrivateEditAuthorityAggregate,
  readPrivateEditAuthorityAggregate,
  sha256AuthorityValue,
  stableAuthorityStringify,
  walletBalanceAfter,
} from './private-edit-authority-store'
import { authorizeWorkspaceAccess } from './workspace-access-service'

export const CANONICAL_SAM3_1_VERTEX_SERVING_ATTEMPT_CREDIT_SETTLEMENT_VERSION =
  'canonical-sam3_1-vertex-serving-attempt-credit-settlement-v2' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const requestSchema = z.object({
  receiptId: safeId,
  executionAttemptRef: evidenceRefSchema,
  settledAt: z.string().datetime({ offset: true }),
}).strict()

export interface CanonicalSam31VertexServingWindowCostReceiptReadPort {
  rereadServingWindowCostReceipt(input: {
    readonly receiptId: string
  }): Promise<unknown>
}

export interface CanonicalSam31VertexServingAttemptCreditSettlementResult {
  readonly settlement:
    AuthoritySam31VertexServingAttemptCreditSettlementRecordV2
  readonly idempotentReplay: boolean
  readonly exactWindowReceiptAllocationAndReservationReread: true
  readonly sharedPlanReservationRetainedForRemainingApprovedWork: true
  readonly serviceFeeAndFinalUnusedReservationSettlementRemainSeparate: true
  readonly billingAccountIdentifierReturned: false
  readonly externalCustomerWalletMutated: false
  readonly publicBillingAuthorityGranted: false
  readonly productionAuthorityGranted: false
}

/**
 * Applies one already-allocated serving attempt's exact eligible credits to
 * the existing plan reservation. A closed endpoint allocation window may
 * contain several attempts, so each attempt receives a unique derived cost
 * identity while retaining the one window receipt and usage hashes.
 */
export async function settleCanonicalSam31VertexServingAttemptCredits(input: {
  readonly context: ServiceContext
  readonly receiptId: string
  readonly executionAttemptRef: unknown
  readonly receiptReadPort:
    CanonicalSam31VertexServingWindowCostReceiptReadPort
  readonly settledAt: string
}): Promise<CanonicalSam31VertexServingAttemptCreditSettlementResult> {
  const request = requestSchema.safeParse({
    receiptId: input.receiptId,
    executionAttemptRef: input.executionAttemptRef,
    settledAt: input.settledAt,
  })
  if (!request.success) throw conflict('settlement_request_malformed', 400)
  const receipt = readReconciledReceipt(
    await input.receiptReadPort.rereadServingWindowCostReceipt({
      receiptId: request.data.receiptId,
    }),
  )
  if (
    receipt.receiptId !== request.data.receiptId
    || Date.parse(request.data.settledAt) < Date.parse(receipt.recordedAt)
  ) throw conflict('serving_window_receipt_identity_or_time_changed')
  const attemptIndex = receipt.usage.attempts.findIndex((candidate) =>
    sameRef(candidate.executionAttemptRef,
      request.data.executionAttemptRef))
  if (attemptIndex < 0) throw conflict('serving_attempt_not_in_window')
  const attempt = receipt.usage.attempts[attemptIndex]!
  const allocation = receipt.attemptAllocations[attemptIndex]!
  if (!sameRef(allocation.executionAttemptRef,
    attempt.executionAttemptRef)) {
    throw conflict('serving_attempt_allocation_crossed')
  }

  const access = await authorizeWorkspaceAccess(
    input.context,
    attempt.workspaceId,
    'write',
  )
  const attemptCostPayload = {
    servingWindowCostReceiptId: receipt.receiptId,
    servingWindowCostReceiptHash: receipt.receiptHash,
    executionAttemptRef: attempt.executionAttemptRef,
    allocation,
  }
  const attemptCostReceiptHash = sha256AuthorityValue(attemptCostPayload)
  const attemptCostReceiptId =
    `sam31-serving-attempt-cost:${attemptCostReceiptHash}`
  const settlementId =
    `sam31-serving-attempt-settlement:${attemptCostReceiptHash}`
  const idempotencyKey = settlementId
  let idempotentReplay = false
  const settlement = await mutatePrivateEditAuthorityAggregate({
    scope: {
      localStorageRoot: input.context.env.localStorageRoot,
      workspaceId: attempt.workspaceId,
      ownerUserId: access.userId,
    },
    planningDomainScope: {
      localStorageRoot: input.context.env.localStorageRoot,
      workspaceId: attempt.workspaceId,
      ownerUserId: access.userId,
      projectId: attempt.projectId,
      editSessionId: attempt.editSessionId,
    },
    now: request.data.settledAt,
    mutation: (aggregate) => {
      const collisions = aggregate.gpuAttemptCreditSettlements.filter(
        (record) => record.id === settlementId
          || record.attemptCostReceiptId === attemptCostReceiptId
          || record.executionAttemptId === attempt.executionAttemptRef.id
          || record.idempotencyKey === idempotencyKey,
      )
      if (collisions.length > 0) {
        const existing = collisions[0]
        if (
          collisions.length !== 1
          || existing?.schemaVersion !==
            CANONICAL_SAM3_1_VERTEX_SERVING_ATTEMPT_CREDIT_SETTLEMENT_VERSION
          || !sameExisting(existing, receipt, attemptCostReceiptId,
            attemptCostReceiptHash, attempt.executionAttemptRef.id)
        ) throw conflict('serving_settlement_idempotency_conflict')
        idempotentReplay = true
        return { result: existing, changed: false }
      }

      const snapshot = aggregate.snapshots.find((record) =>
        record.snapshotId === attempt.approvedSnapshotRef.id)
      const reservation = aggregate.reservations.find((record) =>
        record.id === attempt.fundedReservationRef.id)
      const approval = aggregate.approvals.find((record) =>
        record.id === attempt.userApprovalRecordRef.id)
      const estimate = aggregate.estimates.find((record) =>
        record.id === attempt.approvedEstimateRef.id)
      const approvedWorkItem = aggregate.approvedWorkItems.find((record) =>
        record.id === attempt.approvedWorkItemRef.id)
      const plan = snapshot && aggregate.plans.find((record) =>
        record.id === snapshot.planId)
      const priorReservationSettlements = reservation
        ? aggregate.gpuAttemptCreditSettlements.filter((record) =>
          record.reservationId === reservation.id)
        : []
      const exact = snapshot && reservation && approval && estimate
        && approvedWorkItem && plan
        && access.userId === aggregate.ownerUserId
        && snapshot.workspaceId === attempt.workspaceId
        && snapshot.projectId === attempt.projectId
        && snapshot.editSessionId === attempt.editSessionId
        && snapshot.planId === attempt.editPlanId
        && snapshot.planVersion === attempt.editPlanVersion
        && snapshot.snapshotHash ===
          attempt.approvedSnapshotRef.contentHash.slice(7)
        && snapshot.reservationId === reservation.id
        && snapshot.approvalId === approval.id
        && snapshot.estimateId === estimate.id
        && reservation.snapshotId === snapshot.snapshotId
        && reservation.approvalId === approval.id
        && reservation.estimateId === estimate.id
        && reservation.planId === plan.id
        && reservation.projectId === attempt.projectId
        && reservation.editSessionId === attempt.editSessionId
        && approval.snapshotId === snapshot.snapshotId
        && approval.reservationId === reservation.id
        && approval.estimateId === estimate.id
        && approval.planId === plan.id
        && estimate.estimateHash ===
          attempt.approvedEstimateRef.contentHash.slice(7)
        && sha256AuthorityValue(approval) ===
          attempt.userApprovalRecordRef.contentHash.slice(7)
        && approvedWorkItem.snapshotId === snapshot.snapshotId
        && approvedWorkItem.maximumCreditBudget ===
          attempt.approvedReservedToolCostCredits
        && sha256AuthorityValue(approvedWorkItem) ===
          attempt.approvedWorkItemRef.contentHash.slice(7)
        && (priorReservationSettlements.length > 0
          || sha256AuthorityValue(reservation) ===
            attempt.fundedReservationRef.contentHash.slice(7))
      const remaining = reservation
        ? reservation.reservedCredits - reservation.spentCredits
          - reservation.releasedCredits - reservation.refundedCredits
        : -1
      const charge = allocation.customerEligibleToolCostCredits
      const completed = attempt.terminalOutcome === 'completed'
      const activeReservation = reservation?.status === 'reserved'
        || reservation?.status === 'partially_spent'
      if (
        !exact
        || !['approved', 'cancellation_pending'].includes(plan!.status)
        || estimate!.status !== 'approved'
        || !activeReservation
        || remaining < charge
        || aggregate.wallet.reservedCredits < charge
      ) throw conflict('serving_settlement_plan_reservation_changed')

      if (charge > 0) {
        aggregate.wallet.reservedCredits -= charge
        aggregate.wallet.spentCredits += charge
        aggregate.wallet.ledgerSequence += 1
        reservation!.spentCredits += charge
        const after = remaining - charge
        reservation!.status = after === 0 ? 'spent' : 'partially_spent'
        reservation!.updatedAt = request.data.settledAt
        aggregate.ledgerEntries.push({
          id: `authority_ledger_${randomUUID()}`,
          sequence: aggregate.wallet.ledgerSequence,
          entryType: 'spend',
          sourceType: 'canonical_professional_gpu_attempt_credit_settlement',
          sourceId: settlementId,
          availableDelta: 0,
          reservedDelta: -charge,
          spentDelta: charge,
          balanceAfter: walletBalanceAfter(aggregate.wallet),
          idempotencyKey,
          createdAt: request.data.settledAt,
        })
        aggregate.reservationEvents.push({
          id: `authority_reservation_event_${randomUUID()}`,
          reservationId: reservation!.id,
          snapshotId: snapshot!.snapshotId,
          approvalId: approval!.id,
          eventType: 'spent',
          credits: charge,
          idempotencyKey,
          createdAt: request.data.settledAt,
        })
      }

      const payload = {
        schemaVersion:
          CANONICAL_SAM3_1_VERTEX_SERVING_ATTEMPT_CREDIT_SETTLEMENT_VERSION,
        id: settlementId,
        servingWindowCostReceiptId: receipt.receiptId,
        servingWindowCostReceiptHash: receipt.receiptHash,
        servingWindowUsageHash: receipt.usage.usageHash,
        detailedBillingExportObservationId:
          receipt.detailedBillingExportObservationRef.id,
        detailedBillingExportObservationHash:
          receipt.detailedBillingExportObservationRef.contentHash.slice(7),
        attemptCostReceiptId,
        attemptCostReceiptHash,
        allocationWindowId: receipt.usage.allocationWindowId,
        endpointDeploymentId: receipt.endpointDeploymentRef.id,
        endpointDeploymentHash:
          receipt.endpointDeploymentRef.contentHash.slice(7),
        executionAttemptId: attempt.executionAttemptRef.id,
        snapshotId: snapshot!.snapshotId,
        approvalId: approval!.id,
        reservationId: reservation!.id,
        approvedWorkItemId: approvedWorkItem!.id,
        terminalOutcome: completed
          ? 'completed' as const
          : 'reeditpro_failed' as const,
        settlementDisposition: completed
          ? 'charged_eligible_cost_to_shared_plan_reservation' as const
          : 'no_charge_weeditpro_absorbed_failure' as const,
        approvedToolCeilingCredits:
          allocation.approvedReservedToolCostCredits,
        customerChargedCredits: charge,
        weeditproAbsorbedInfrastructureCostUsdNanos:
          allocation.weeditproAbsorbedInfrastructureCostUsdNanos,
        unusedToolCeilingCreditsRetainedInSharedPlanReservation:
          allocation.creditsRecommendedToRetainForRemainingApprovedPlanWork,
        creditsHeldPendingReconciliation: 0 as const,
        creditsReleasedOrRefundedAtAttemptSettlement: 0 as const,
        reservationSpendApplied: charge > 0,
        exactTerminalAndAttemptCostReceiptReread: true as const,
        exactDetailedUsageCostExportReconciled: true as const,
        finalInvoiceMonthTaxOrAdjustmentClaimed: false as const,
        serviceFeeSettledHere: false as const,
        finalPlanSettlementStillRequired: true as const,
        publicBillingAuthorityGranted: false as const,
        productionAuthorityGranted: false as const,
        idempotencyKey,
        createdAt: request.data.settledAt,
      }
      const record:
        AuthoritySam31VertexServingAttemptCreditSettlementRecordV2 = {
        ...payload,
        settlementHash: sha256AuthorityValue(payload),
      }
      aggregate.gpuAttemptCreditSettlements.push(record)
      aggregate.auditEvents.push({
        id: `authority_audit_${randomUUID()}`,
        eventType: 'canonical_sam31_vertex_serving_attempt_cost_settled',
        actorUserId: access.userId,
        projectId: attempt.projectId,
        editSessionId: attempt.editSessionId,
        planId: plan!.id,
        snapshotId: snapshot!.snapshotId,
        createdAt: request.data.settledAt,
      })
      return { result: record, changed: true }
    },
  })
  if (settlement.schemaVersion !==
    CANONICAL_SAM3_1_VERTEX_SERVING_ATTEMPT_CREDIT_SETTLEMENT_VERSION) {
    throw conflict('serving_settlement_version_crossed')
  }
  const reread = await readPrivateEditAuthorityAggregate({
    localStorageRoot: input.context.env.localStorageRoot,
    workspaceId: attempt.workspaceId,
    ownerUserId: access.userId,
  })
  const exactReread = reread?.gpuAttemptCreditSettlements.find((record) =>
    record.id === settlement.id)
  if (
    !exactReread
    || exactReread.schemaVersion !==
      CANONICAL_SAM3_1_VERTEX_SERVING_ATTEMPT_CREDIT_SETTLEMENT_VERSION
    || exactReread.settlementHash !== settlement.settlementHash
  ) throw conflict('serving_settlement_exact_reread_failed')

  return Object.freeze({
    settlement: structuredClone(exactReread),
    idempotentReplay,
    exactWindowReceiptAllocationAndReservationReread: true,
    sharedPlanReservationRetainedForRemainingApprovedWork: true,
    serviceFeeAndFinalUnusedReservationSettlementRemainSeparate: true,
    billingAccountIdentifierReturned: false,
    externalCustomerWalletMutated: false,
    publicBillingAuthorityGranted: false,
    productionAuthorityGranted: false,
  })
}

function sameExisting(
  settlement: AuthoritySam31VertexServingAttemptCreditSettlementRecordV2,
  receipt: CanonicalSam31VertexServingReconciledWindowCostReceipt,
  attemptCostReceiptId: string,
  attemptCostReceiptHash: string,
  executionAttemptId: string,
): boolean {
  return settlement.servingWindowCostReceiptId === receipt.receiptId
    && settlement.servingWindowCostReceiptHash === receipt.receiptHash
    && settlement.servingWindowUsageHash === receipt.usage.usageHash
    && settlement.detailedBillingExportObservationId ===
      receipt.detailedBillingExportObservationRef.id
    && settlement.detailedBillingExportObservationHash ===
      receipt.detailedBillingExportObservationRef.contentHash.slice(7)
    && settlement.attemptCostReceiptId === attemptCostReceiptId
    && settlement.attemptCostReceiptHash === attemptCostReceiptHash
    && settlement.executionAttemptId === executionAttemptId
}

function readReconciledReceipt(
  value: unknown,
): CanonicalSam31VertexServingReconciledWindowCostReceipt {
  try {
    return assertCanonicalSam31VertexServingReconciledWindowCostReceipt(value)
  } catch (reconciledError) {
    try {
      const historical = assertCanonicalSam31VertexServingWindowCostReceipt(
        value,
      )
      if (!historical.usage.billingExportFinalInvoiceReconciled) {
        throw conflict('serving_window_invoice_not_reconciled')
      }
    } catch (historicalError) {
      if (historicalError instanceof ApiError) throw historicalError
    }
    throw reconciledError
  }
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function conflict(reason: string, status = 409): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    `SAM 3.1 Vertex serving attempt settlement blocked: ${reason}.`,
    status,
  )
}
