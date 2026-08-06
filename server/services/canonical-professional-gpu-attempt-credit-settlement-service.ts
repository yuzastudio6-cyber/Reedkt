import { randomUUID } from 'node:crypto'

import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  assertCanonicalProfessionalToolGpuAttemptCostReceipt,
  type CanonicalProfessionalToolGpuAttemptCostReceipt,
} from '../tool-cost-metering/canonical-professional-tool-gpu-cost-authority'
import {
  assertCanonicalProfessionalGpuFundedPrelaunch,
  assertCanonicalProfessionalGpuFundedTerminalBinding,
  type CanonicalProfessionalGpuFundedJobLifecycleStore,
} from './canonical-professional-gpu-plan-funded-job-lifecycle-service'
import {
  type AuthorityGpuAttemptCreditSettlementRecord,
  mutatePrivateEditAuthorityAggregate,
  readPrivateEditAuthorityAggregate,
  sha256AuthorityValue,
  walletBalanceAfter,
} from './private-edit-authority-store'
import { authorizeWorkspaceAccess } from './workspace-access-service'

export const CANONICAL_PROFESSIONAL_GPU_ATTEMPT_CREDIT_SETTLEMENT_VERSION =
  'canonical-professional-gpu-attempt-credit-settlement-v1' as const

const settlementRequestSchema = z.object({
  terminalBindingId: z.string().trim().min(1).max(240)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
    .refine((value) => !value.includes('..')),
  settledAt: z.string().datetime({ offset: true }),
}).strict()

export interface CanonicalProfessionalGpuAttemptCostReceiptReadPort {
  rereadAttemptCostReceipt(input: {
    readonly receiptId: string
  }): Promise<unknown>
}

export interface CanonicalProfessionalGpuAttemptCreditSettlementResult {
  readonly settlement: AuthorityGpuAttemptCreditSettlementRecord
  readonly idempotentReplay: boolean
  readonly exactPersistedSettlementReread: true
  readonly sharedPlanReservationRetainedForRemainingApprovedWork: true
  readonly finalPlanServiceFeeAndUnusedReservationSettlementStillRequired: true
  readonly publicBillingAuthorityGranted: false
  readonly productionAuthorityGranted: false
}

export function resolveCanonicalProfessionalGpuAttemptSettlementTerminalOutcome(
  input: {
    readonly terminalOutcome:
      | 'completed'
      | 'failed'
      | 'canceled'
      | 'outcome_unknown_requires_reconciliation'
    readonly providerInferenceOrSubstantiveWorkOutcome:
      'executed' | 'not_executed' | 'unknown'
  },
): AuthorityGpuAttemptCreditSettlementRecord['terminalOutcome'] {
  if (
    input.terminalOutcome === 'outcome_unknown_requires_reconciliation'
    || input.providerInferenceOrSubstantiveWorkOutcome === 'unknown'
    || input.terminalOutcome === 'canceled'
  ) return 'unknown_requires_reconciliation'
  return input.terminalOutcome === 'completed'
    ? 'completed'
    : 'reeditpro_failed'
}

/**
 * Applies one terminal GPU attempt's exact customer-eligible infrastructure
 * cost to the already-approved shared plan reservation.
 *
 * This owner deliberately does not release a per-tool remainder: the existing
 * reservation is plan-scoped and may still fund independent approved work.
 * Final plan settlement owns the service fee and release of the aggregate
 * unused balance. Verified WeEditPro failures charge zero. A cloud/provider
 * cancellation is not accepted as authenticated user cancellation: it remains
 * unknown, retains the hold, and stays retry-blocking until a separate
 * canonical reconciliation owner resolves it.
 */
export async function settleCanonicalProfessionalGpuPlanFundedAttemptCredits(
  input: {
    readonly context: ServiceContext
    readonly terminalBindingId: string
    readonly fundedLifecycleStore:
      CanonicalProfessionalGpuFundedJobLifecycleStore
    readonly attemptCostReceiptReadPort:
      CanonicalProfessionalGpuAttemptCostReceiptReadPort
    readonly settledAt: string
  },
): Promise<CanonicalProfessionalGpuAttemptCreditSettlementResult> {
  const request = settlementRequestSchema.safeParse({
    terminalBindingId: input.terminalBindingId,
    settledAt: input.settledAt,
  })
  if (!request.success) throw new ApiError(
    'VALIDATION_FAILED',
    'GPU attempt settlement request is malformed.',
    400,
  )
  const terminalBinding =
    assertCanonicalProfessionalGpuFundedTerminalBinding(
      await input.fundedLifecycleStore.rereadTerminalBinding({
        terminalBindingId: request.data.terminalBindingId,
      }),
    )
  const prelaunch = assertCanonicalProfessionalGpuFundedPrelaunch(
    await input.fundedLifecycleStore.rereadPrelaunchAuthorization({
      prelaunchAuthorizationId:
        terminalBinding.prelaunchAuthorizationRef.id,
    }),
  )
  const receipt = assertCanonicalProfessionalToolGpuAttemptCostReceipt(
    await input.attemptCostReceiptReadPort.rereadAttemptCostReceipt({
      receiptId: terminalBinding.attemptCostReceiptRef.id,
    }),
  )
  const settlementTerminalOutcome = assertExactTerminalCostLineage({
    terminalBinding,
    prelaunch,
    receipt,
  })

  const scope = prelaunch.fundedDispatchAdmission.scope
  const access = await authorizeWorkspaceAccess(
    input.context,
    scope.workspaceId,
    'write',
  )
  if (
    access.userId !== scope.ownerUserId
    || Date.parse(request.data.settledAt) < Date.parse(receipt.recordedAt)
  ) throw new ApiError(
    'WORKSPACE_ACCESS_DENIED',
    'GPU attempt settlement authority does not match the approved owner.',
    403,
  )

  const settlementId = `gpu-attempt-settlement:${receipt.receiptHash}`
  const idempotencyKey = settlementId
  let idempotentReplay = false
  const settlement = await mutatePrivateEditAuthorityAggregate({
    scope: {
      localStorageRoot: input.context.env.localStorageRoot,
      workspaceId: scope.workspaceId,
      ownerUserId: scope.ownerUserId,
    },
    planningDomainScope: {
      localStorageRoot: input.context.env.localStorageRoot,
      workspaceId: scope.workspaceId,
      ownerUserId: scope.ownerUserId,
      projectId: scope.projectId,
      editSessionId: scope.editSessionId,
    },
    now: request.data.settledAt,
    mutation: (aggregate) => {
      const collisions = aggregate.gpuAttemptCreditSettlements.filter(
        (record) => record.id === settlementId
          || record.attemptCostReceiptId === receipt.receiptId
          || record.executionAttemptId === receipt.executionAttemptId
          || record.idempotencyKey === idempotencyKey,
      )
      if (collisions.length > 0) {
        if (
          collisions.length !== 1
          || collisions[0]!.schemaVersion !==
            CANONICAL_PROFESSIONAL_GPU_ATTEMPT_CREDIT_SETTLEMENT_VERSION
          || !sameExistingSettlement({
            settlement: collisions[0]!,
            terminalBindingId: terminalBinding.terminalBindingId,
            terminalBindingHash: terminalBinding.terminalBindingHash,
            prelaunchRecordId: prelaunch.prelaunchAuthorizationId,
            prelaunchRecordHash:
              prelaunch.prelaunchAuthorizationHash,
            fundedDispatchAdmissionId:
              prelaunch.fundedDispatchAdmission.fundedAdmissionId,
            fundedDispatchAdmissionHash:
              prelaunch.fundedDispatchAdmission.fundedAdmissionHash,
            receipt,
          })
        ) throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'GPU attempt settlement identity was reused with different evidence.',
          409,
        )
        idempotentReplay = true
        return { result: collisions[0]!, changed: false }
      }

      const snapshot = aggregate.snapshots.find((record) =>
        record.snapshotId === terminalBinding.approvedSnapshotRef.id)
      const reservation = aggregate.reservations.find((record) =>
        record.id === terminalBinding.fundedReservationRef.id)
      const approval = snapshot
        ? aggregate.approvals.find((record) =>
          record.id === snapshot.approvalId)
        : undefined
      const plan = snapshot
        ? aggregate.plans.find((record) => record.id === snapshot.planId)
        : undefined
      const estimate = snapshot
        ? aggregate.estimates.find((record) =>
          record.id === snapshot.estimateId)
        : undefined
      const approvedWorkItem = aggregate.approvedWorkItems.find((record) =>
        record.id === terminalBinding.approvedWorkItemRef.id)
      const remaining = reservation
        ? reservation.reservedCredits - reservation.spentCredits
          - reservation.releasedCredits - reservation.refundedCredits
        : -1
      const charge = receipt.customerEligibleToolCostCredits
      const unknown = settlementTerminalOutcome ===
        'unknown_requires_reconciliation'
      const completed = settlementTerminalOutcome === 'completed'
      const activeReservation = reservation?.status === 'reserved'
        || reservation?.status === 'partially_spent'
      const priorReservationSettlements = reservation
        ? aggregate.gpuAttemptCreditSettlements.filter((record) =>
          record.reservationId === reservation.id)
        : []
      const exactCurrentLineage = snapshot && reservation && approval
        && plan && estimate && approvedWorkItem
        && snapshot.workspaceId === scope.workspaceId
        && snapshot.projectId === scope.projectId
        && snapshot.editSessionId === scope.editSessionId
        && snapshot.planId === scope.editPlanId
        && snapshot.planVersion === scope.editPlanVersion
        && snapshot.snapshotHash ===
          terminalBinding.approvedSnapshotRef.contentHash.slice(7)
        && plan.planHash === prelaunch.fundedDispatchAdmission
          .approvedPlanRef.contentHash.slice(7)
        && estimate.estimateHash === prelaunch.fundedDispatchAdmission
          .approvedCustomerEstimateRef.contentHash.slice(7)
        && snapshot.reservationId === reservation.id
        && snapshot.approvalId === approval.id
        && snapshot.estimateId === estimate.id
        && reservation.approvalId === approval.id
        && reservation.snapshotId === snapshot.snapshotId
        && reservation.estimateId === estimate.id
        && reservation.planId === plan.id
        && reservation.projectId === scope.projectId
        && reservation.editSessionId === scope.editSessionId
        && reservation.reservedCredits ===
          prelaunch.fundedDispatchAdmission.originallyReservedCredits
        && approval.planId === plan.id
        && approval.estimateId === estimate.id
        && approval.snapshotId === snapshot.snapshotId
        && approval.reservationId === reservation.id
        && sha256AuthorityValue(approval) ===
          prelaunch.fundedDispatchAdmission.userApprovalRecordRef
            .contentHash.slice(7)
        && approvedWorkItem.snapshotId === snapshot.snapshotId
        && approvedWorkItem.id ===
          prelaunch.fundedDispatchAdmission.approvedWorkItemRef.id
        && sha256AuthorityValue(approvedWorkItem) ===
          prelaunch.fundedDispatchAdmission.approvedWorkItemRef
            .contentHash.slice(7)
        && (priorReservationSettlements.length > 0
          || sha256AuthorityValue(reservation) ===
            prelaunch.fundedDispatchAdmission.fundedReservationRef
              .contentHash.slice(7))

      if (
        !exactCurrentLineage
        || !['approved', 'cancellation_pending'].includes(plan!.status)
        || estimate!.status !== 'approved'
        || !activeReservation
        || (completed && remaining < charge)
        || (unknown && remaining <
          receipt.creditsRecommendedToHoldPendingReconciliation)
        || aggregate.wallet.reservedCredits < charge
      ) throw new ApiError(
        'IDEMPOTENCY_CONFLICT',
        'GPU attempt settlement no longer matches funded plan authority.',
        409,
      )

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
          CANONICAL_PROFESSIONAL_GPU_ATTEMPT_CREDIT_SETTLEMENT_VERSION,
        id: settlementId,
        terminalBindingId: terminalBinding.terminalBindingId,
        terminalBindingHash: terminalBinding.terminalBindingHash,
        prelaunchRecordId: prelaunch.prelaunchAuthorizationId,
        prelaunchRecordHash: prelaunch.prelaunchAuthorizationHash,
        fundedDispatchAdmissionId:
          prelaunch.fundedDispatchAdmission.fundedAdmissionId,
        fundedDispatchAdmissionHash:
          prelaunch.fundedDispatchAdmission.fundedAdmissionHash,
        attemptCostReceiptId: receipt.receiptId,
        attemptCostReceiptHash: receipt.receiptHash,
        executionAttemptId: receipt.executionAttemptId,
        snapshotId: snapshot!.snapshotId,
        approvalId: approval!.id,
        reservationId: reservation!.id,
        approvedWorkItemId: approvedWorkItem!.id,
        terminalOutcome: settlementTerminalOutcome,
        settlementDisposition: unknown
          ? 'held_without_charge_pending_reconciliation' as const
          : completed
            ? 'charged_eligible_cost_to_shared_plan_reservation' as const
            : 'no_charge_weeditpro_absorbed_failure' as const,
        approvedToolCeilingCredits: receipt.approvedReservedToolCostCredits,
        customerChargedCredits: charge,
        weeditproAbsorbedInfrastructureCostUsdNanos:
          receipt.reeditproAbsorbedInfrastructureCostUsdNanos,
        unusedToolCeilingCreditsRetainedInSharedPlanReservation:
          receipt.creditsRecommendedToReleaseOrRefund,
        creditsHeldPendingReconciliation:
          receipt.creditsRecommendedToHoldPendingReconciliation,
        creditsReleasedOrRefundedAtAttemptSettlement: 0 as const,
        reservationSpendApplied: charge > 0,
        exactTerminalAndAttemptCostReceiptReread: true as const,
        serviceFeeSettledHere: false as const,
        finalPlanSettlementStillRequired: true as const,
        publicBillingAuthorityGranted: false as const,
        productionAuthorityGranted: false as const,
        idempotencyKey,
        createdAt: request.data.settledAt,
      }
      const record: AuthorityGpuAttemptCreditSettlementRecord = {
        ...payload,
        settlementHash: sha256AuthorityValue(payload),
      }
      aggregate.gpuAttemptCreditSettlements.push(record)
      aggregate.auditEvents.push({
        id: `authority_audit_${randomUUID()}`,
        eventType: 'canonical_professional_gpu_attempt_cost_settled',
        actorUserId: access.userId,
        projectId: scope.projectId,
        editSessionId: scope.editSessionId,
        planId: scope.editPlanId,
        snapshotId: snapshot!.snapshotId,
        createdAt: request.data.settledAt,
      })
      return { result: record, changed: true }
    },
  })
  if (settlement.schemaVersion !==
    CANONICAL_PROFESSIONAL_GPU_ATTEMPT_CREDIT_SETTLEMENT_VERSION) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'GPU attempt settlement resolved to another versioned owner.',
      409,
    )
  }

  const reread = await readPrivateEditAuthorityAggregate({
    localStorageRoot: input.context.env.localStorageRoot,
    workspaceId: scope.workspaceId,
    ownerUserId: scope.ownerUserId,
  })
  const rereadSettlement = reread?.gpuAttemptCreditSettlements.find(
    (record) => record.id === settlement.id,
  )
  if (
    !rereadSettlement
    || rereadSettlement.schemaVersion !==
      CANONICAL_PROFESSIONAL_GPU_ATTEMPT_CREDIT_SETTLEMENT_VERSION
    || rereadSettlement.settlementHash !== settlement.settlementHash
    || sha256AuthorityValue({
      ...rereadSettlement,
      settlementHash: undefined,
    }) !== rereadSettlement.settlementHash
  ) throw new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'GPU attempt credit settlement exact reread failed.',
    409,
  )

  return Object.freeze({
    settlement: structuredClone(rereadSettlement),
    idempotentReplay,
    exactPersistedSettlementReread: true,
    sharedPlanReservationRetainedForRemainingApprovedWork: true,
    finalPlanServiceFeeAndUnusedReservationSettlementStillRequired: true,
    publicBillingAuthorityGranted: false,
    productionAuthorityGranted: false,
  })
}

function assertExactTerminalCostLineage(input: {
  terminalBinding: ReturnType<
    typeof assertCanonicalProfessionalGpuFundedTerminalBinding
  >
  prelaunch: ReturnType<typeof assertCanonicalProfessionalGpuFundedPrelaunch>
  receipt: CanonicalProfessionalToolGpuAttemptCostReceipt
}): AuthorityGpuAttemptCreditSettlementRecord['terminalOutcome'] {
  const { terminalBinding, prelaunch, receipt } = input
  const admission = prelaunch.fundedDispatchAdmission
  const toolAdmission = admission.toolDispatchAdmission
  const expectedTerminalOutcome =
    resolveCanonicalProfessionalGpuAttemptSettlementTerminalOutcome(
      terminalBinding,
    )
  if (
    !sameRef(terminalBinding.prelaunchAuthorizationRef, {
      id: prelaunch.prelaunchAuthorizationId,
      version: 1,
      contentHash: `sha256:${prelaunch.prelaunchAuthorizationHash}`,
    })
    || !sameRef(terminalBinding.fundedDispatchAdmissionRef,
      prelaunch.fundedDispatchAdmissionRef)
    || !sameRef(terminalBinding.approvedSnapshotRef,
      prelaunch.approvedSnapshotRef)
    || !sameRef(terminalBinding.fundedReservationRef,
      prelaunch.fundedReservationRef)
    || !sameRef(terminalBinding.approvedWorkItemRef,
      prelaunch.approvedWorkItemRef)
    || !sameRef(terminalBinding.attemptCostReceiptRef, {
      id: receipt.receiptId,
      version: 1,
      contentHash: `sha256:${receipt.receiptHash}`,
    })
    || !sameRef(receipt.estimateRef, toolAdmission.estimateRef)
    || !sameRef(receipt.approvedSnapshotRef,
      toolAdmission.scope.approvedSnapshotRef)
    || !sameRef(receipt.approvalRecordRef,
      toolAdmission.scope.userApprovalRecordRef)
    || !sameRef(receipt.fundedReservationRef,
      toolAdmission.scope.fundedReservationRef)
    || !sameRef(receipt.scope.plannedWorkItemRef,
      toolAdmission.scope.approvedWorkItemRef)
    || receipt.executionAttemptId !==
      toolAdmission.scope.executionAttemptRef.id
    || receipt.routeId !== toolAdmission.routeId
    || receipt.scope.ownerUserId !== admission.scope.ownerUserId
    || receipt.scope.workspaceId !== admission.scope.workspaceId
    || receipt.scope.projectId !== admission.scope.projectId
    || receipt.scope.editSessionId !== admission.scope.editSessionId
    || receipt.scope.editPlanId !== admission.scope.editPlanId
    || receipt.scope.editPlanVersion !== admission.scope.editPlanVersion
    || receipt.approvedReservedToolCostCredits !==
      admission.approvedWorkItemGpuCeilingCredits
    || receipt.terminalOutcome !== expectedTerminalOutcome
    || receipt.providerOrModelInferenceOutcome !==
      terminalBinding.providerInferenceOrSubstantiveWorkOutcome
    || receipt.walletOrLedgerMutationPerformed !== false
    || terminalBinding.customerWalletOrLedgerMutated !== false
  ) throw new ApiError(
    'VALIDATION_FAILED',
    'GPU terminal binding and attempt cost receipt lineage differ.',
    409,
  )
  return expectedTerminalOutcome
}

function sameExistingSettlement(input: {
  settlement: AuthorityGpuAttemptCreditSettlementRecord
  terminalBindingId: string
  terminalBindingHash: string
  prelaunchRecordId: string
  prelaunchRecordHash: string
  fundedDispatchAdmissionId: string
  fundedDispatchAdmissionHash: string
  receipt: CanonicalProfessionalToolGpuAttemptCostReceipt
}): boolean {
  return input.settlement.terminalBindingId === input.terminalBindingId
    && input.settlement.terminalBindingHash === input.terminalBindingHash
    && input.settlement.prelaunchRecordId === input.prelaunchRecordId
    && input.settlement.prelaunchRecordHash === input.prelaunchRecordHash
    && input.settlement.fundedDispatchAdmissionId ===
      input.fundedDispatchAdmissionId
    && input.settlement.fundedDispatchAdmissionHash ===
      input.fundedDispatchAdmissionHash
    && input.settlement.attemptCostReceiptId === input.receipt.receiptId
    && input.settlement.attemptCostReceiptHash === input.receipt.receiptHash
    && input.settlement.executionAttemptId ===
      input.receipt.executionAttemptId
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
