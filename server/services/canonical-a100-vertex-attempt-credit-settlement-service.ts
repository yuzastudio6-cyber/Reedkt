import { randomUUID } from 'node:crypto'

import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  assertCanonicalA100VertexCustomJobExecutionRecord,
  assertCanonicalA100VertexCustomJobLaunchAuthority,
  type CanonicalA100VertexCustomJobLaunchAuthority,
} from './canonical-a100-vertex-custom-job-launch-port'
import { assertPlainSerializedData } from
  './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalA100VertexCustomJobTerminalRead,
  type CanonicalA100VertexCustomJobExecutionReadRepository,
  type CanonicalA100VertexCustomJobTerminalRead,
} from './canonical-a100-vertex-custom-job-terminal-port'
import {
  type AuthorityA100VertexAttemptCreditSettlementRecord,
  mutatePrivateEditAuthorityAggregate,
  readPrivateEditAuthorityAggregate,
  sha256AuthorityValue,
  walletBalanceAfter,
} from './private-edit-authority-store'
import { authorizeWorkspaceAccess } from './workspace-access-service'
import {
  assertCanonicalA100VertexAttemptCostReceipt,
  assertCanonicalA100VertexProviderAllocationCostReceipt,
  CANONICAL_A100_VERTEX_ATTEMPT_COST_RECEIPT_VERSION,
  CANONICAL_A100_VERTEX_PROVIDER_ALLOCATION_COST_RECEIPT_VERSION,
  type CanonicalA100VertexAttemptCostReceipt,
  type CanonicalA100VertexProviderAllocationCostReceipt,
} from '../tool-cost-metering/canonical-a100-vertex-attempt-cost-authority'

type CanonicalA100VertexSettleableCostReceipt =
  | CanonicalA100VertexAttemptCostReceipt
  | CanonicalA100VertexProviderAllocationCostReceipt

export const CANONICAL_A100_VERTEX_ATTEMPT_CREDIT_SETTLEMENT_VERSION =
  'canonical-a100-vertex-attempt-credit-settlement-v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
const requestSchema = z.object({
  executionRef: evidenceRefSchema,
  settledAt: timestamp,
}).strict()

export interface CanonicalA100VertexLaunchAuthorityReadPort {
  rereadLaunchAuthority(input: {
    readonly authorityRef: z.infer<typeof evidenceRefSchema>
  }): Promise<unknown>
}

export interface CanonicalA100VertexTerminalReadPort {
  reread(input: {
    readonly executionRef: z.infer<typeof evidenceRefSchema>
  }): Promise<unknown>
}

export interface CanonicalA100VertexAttemptCostReceiptReadPort {
  rereadAttemptCostReceipt(input: {
    readonly receiptId: string
  }): Promise<unknown>
}

export interface CanonicalA100VertexAttemptCreditSettlementResult {
  readonly settlement: AuthorityA100VertexAttemptCreditSettlementRecord
  readonly idempotentReplay: boolean
  readonly exactAuthorityExecutionTerminalCostAndReservationReread: true
  readonly sharedPlanReservationRetainedForRemainingApprovedWork: true
  readonly serviceFeeAndFinalUnusedReservationSettlementRemainSeparate: true
  readonly billingAccountIdentifierReturned: false
  readonly externalCustomerWalletMutated: false
  readonly publicBillingAuthorityGranted: false
  readonly productionAuthorityGranted: false
}

/**
 * Spends only the exact customer-eligible infrastructure credits for one
 * completed Vertex A100 attempt. System failures, cancellation and expiry are
 * recorded at zero customer charge. The shared plan reservation retains the
 * unused ceiling for other approved work; service fees and final release stay
 * with the existing final-plan settlement owner.
 */
export async function settleCanonicalA100VertexAttemptCredits(input: {
  readonly context: ServiceContext
  readonly executionRef: unknown
  readonly executionRepository:
    CanonicalA100VertexCustomJobExecutionReadRepository
  readonly authorityReadPort: CanonicalA100VertexLaunchAuthorityReadPort
  readonly terminalReadPort: CanonicalA100VertexTerminalReadPort
  readonly receiptReadPort: CanonicalA100VertexAttemptCostReceiptReadPort
  readonly settledAt: string
}): Promise<CanonicalA100VertexAttemptCreditSettlementResult> {
  const request = requestSchema.safeParse({
    executionRef: input.executionRef,
    settledAt: input.settledAt,
  })
  if (!request.success) throw new ApiError(
    'VALIDATION_FAILED',
    'Vertex A100 attempt settlement request is malformed.',
    400,
  )
  const execution = assertCanonicalA100VertexCustomJobExecutionRecord(
    await input.executionRepository.rereadExecution({
      executionRef: request.data.executionRef,
    }),
  )
  if (!sameRef(request.data.executionRef, ref(
    execution.executionRecordId,
    execution.executionRecordHash,
  ))) throw conflict('execution_reference_mismatch')

  const authority = assertCanonicalA100VertexCustomJobLaunchAuthority(
    await input.authorityReadPort.rereadLaunchAuthority({
      authorityRef: execution.authorityRef,
    }),
  )
  const terminal = assertCanonicalA100VertexCustomJobTerminalRead(
    await input.terminalReadPort.reread({
      executionRef: request.data.executionRef,
    }),
  )
  if (
    terminal.disposition !== 'terminal'
    || terminal.attemptCostReceiptRef === null
    || terminal.terminalOutcome === null
    || terminal.providerInferenceOrSubstantiveWorkOutcome === 'unknown'
  ) throw conflict('terminal_result_not_settleable')
  const receipt = assertCanonicalA100VertexSettleableCostReceipt(
    await input.receiptReadPort.rereadAttemptCostReceipt({
      receiptId: terminal.attemptCostReceiptRef.id,
    }),
  )
  const terminalOutcome = assertExactLineage({
    authority,
    execution,
    executionRef: request.data.executionRef,
    terminal,
    receipt,
  })
  if (
    Date.parse(request.data.settledAt) < Date.parse(terminal.observedAt)
    || Date.parse(request.data.settledAt) < Date.parse(receipt.recordedAt)
  ) throw conflict('settlement_time_precedes_evidence')

  const access = await authorizeWorkspaceAccess(
    input.context,
    authority.workspaceId,
    'write',
  )
  const settlementId = `vertex-a100-settlement:${receipt.receiptHash}`
  const idempotencyKey = settlementId
  let idempotentReplay = false
  const settlement = await mutatePrivateEditAuthorityAggregate({
    scope: {
      localStorageRoot: input.context.env.localStorageRoot,
      workspaceId: authority.workspaceId,
      ownerUserId: access.userId,
    },
    planningDomainScope: {
      localStorageRoot: input.context.env.localStorageRoot,
      workspaceId: authority.workspaceId,
      ownerUserId: access.userId,
      projectId: authority.projectId,
      editSessionId: authority.editSessionId,
    },
    now: request.data.settledAt,
    mutation: (aggregate) => {
      const collisions = aggregate.gpuAttemptCreditSettlements.filter(
        (record) => record.id === settlementId
          || record.attemptCostReceiptId === receipt.receiptId
          || record.executionAttemptId === authority.executionAttemptRef.id
          || record.idempotencyKey === idempotencyKey,
      )
      if (collisions.length > 0) {
        const existing = collisions[0]
        if (
          collisions.length !== 1
          || existing?.schemaVersion !==
            CANONICAL_A100_VERTEX_ATTEMPT_CREDIT_SETTLEMENT_VERSION
          || !sameExisting({
            settlement: existing,
            terminal,
            authority,
            execution,
            receipt,
          })
        ) throw conflict('idempotency_identity_reused')
        idempotentReplay = true
        return { result: existing, changed: false }
      }

      const snapshot = aggregate.snapshots.find((record) =>
        record.snapshotId === authority.approvedSnapshotRef.id)
      const reservation = aggregate.reservations.find((record) =>
        record.id === authority.fundedReservationRef.id)
      const approval = aggregate.approvals.find((record) =>
        record.id === authority.userApprovalRecordRef.id)
      const estimate = aggregate.estimates.find((record) =>
        record.id === authority.approvedEstimateRef.id)
      const approvedWorkItem = aggregate.approvedWorkItems.find((record) =>
        record.id === authority.approvedWorkItemRef.id)
      const plan = snapshot && aggregate.plans.find((record) =>
        record.id === snapshot.planId)
      const remaining = reservation
        ? reservation.reservedCredits - reservation.spentCredits
          - reservation.releasedCredits - reservation.refundedCredits
        : -1
      const charge = receipt.customerEligibleToolCostCredits
      const completed = terminalOutcome === 'completed'
      const priorReservationSettlements = reservation
        ? aggregate.gpuAttemptCreditSettlements.filter((record) =>
          record.reservationId === reservation.id)
        : []
      const exact = snapshot && reservation && approval && estimate
        && approvedWorkItem && plan
        && snapshot.workspaceId === authority.workspaceId
        && snapshot.projectId === authority.projectId
        && snapshot.editSessionId === authority.editSessionId
        && snapshot.snapshotHash ===
          authority.approvedSnapshotRef.contentHash.slice(7)
        && snapshot.reservationId === reservation.id
        && snapshot.approvalId === approval.id
        && snapshot.estimateId === estimate.id
        && reservation.snapshotId === snapshot.snapshotId
        && reservation.approvalId === approval.id
        && reservation.estimateId === estimate.id
        && reservation.planId === plan.id
        && reservation.projectId === authority.projectId
        && reservation.editSessionId === authority.editSessionId
        && approval.snapshotId === snapshot.snapshotId
        && approval.reservationId === reservation.id
        && approval.estimateId === estimate.id
        && approval.planId === plan.id
        && estimate.estimateHash ===
          authority.approvedEstimateRef.contentHash.slice(7)
        && sha256AuthorityValue(approval) ===
          authority.userApprovalRecordRef.contentHash.slice(7)
        && approvedWorkItem.snapshotId === snapshot.snapshotId
        && approvedWorkItem.maximumCreditBudget ===
          authority.maximumReservedToolCostCredits
        && sha256AuthorityValue(approvedWorkItem) ===
          authority.approvedWorkItemRef.contentHash.slice(7)
        && (priorReservationSettlements.length > 0
          || sha256AuthorityValue(reservation) ===
            authority.fundedReservationRef.contentHash.slice(7))
      const activeReservation = reservation?.status === 'reserved'
        || reservation?.status === 'partially_spent'
      if (
        !exact
        || !['approved', 'cancellation_pending'].includes(plan!.status)
        || estimate!.status !== 'approved'
        || !activeReservation
        || (completed && remaining < charge)
        || aggregate.wallet.reservedCredits < charge
      ) throw conflict('approved_reservation_lineage_changed')

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
          CANONICAL_A100_VERTEX_ATTEMPT_CREDIT_SETTLEMENT_VERSION,
        id: settlementId,
        vertexTerminalReadId: `vertex-a100-terminal-read:${terminal.terminalReadHash.slice(0, 48)}`,
        vertexTerminalReadHash: terminal.terminalReadHash,
        launchAuthorityId: authority.authorityId,
        launchAuthorityHash: authority.authorityHash,
        executionRecordId: execution.executionRecordId,
        executionRecordHash: execution.executionRecordHash,
        attemptCostReceiptId: receipt.receiptId,
        attemptCostReceiptHash: receipt.receiptHash,
        executionAttemptId: authority.executionAttemptRef.id,
        snapshotId: snapshot!.snapshotId,
        approvalId: approval!.id,
        reservationId: reservation!.id,
        approvedWorkItemId: approvedWorkItem!.id,
        terminalOutcome,
        settlementDisposition: completed
          ? 'charged_eligible_cost_to_shared_plan_reservation' as const
          : 'no_charge_weeditpro_absorbed_failure' as const,
        approvedToolCeilingCredits: receipt.approvedReservedToolCostCredits,
        customerChargedCredits: charge,
        weeditproAbsorbedInfrastructureCostUsdNanos:
          receipt.weeditproAbsorbedInfrastructureCostUsdNanos,
        unusedToolCeilingCreditsRetainedInSharedPlanReservation:
          receipt.creditsRecommendedToRetainForRemainingApprovedPlanWork,
        creditsHeldPendingReconciliation: 0 as const,
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
      const record: AuthorityA100VertexAttemptCreditSettlementRecord = {
        ...payload,
        settlementHash: sha256AuthorityValue(payload),
      }
      aggregate.gpuAttemptCreditSettlements.push(record)
      aggregate.auditEvents.push({
        id: `authority_audit_${randomUUID()}`,
        eventType: 'canonical_a100_vertex_attempt_cost_settled',
        actorUserId: access.userId,
        projectId: authority.projectId,
        editSessionId: authority.editSessionId,
        planId: plan!.id,
        snapshotId: snapshot!.snapshotId,
        createdAt: request.data.settledAt,
      })
      return { result: record, changed: true }
    },
  })
  if (settlement.schemaVersion !==
    CANONICAL_A100_VERTEX_ATTEMPT_CREDIT_SETTLEMENT_VERSION) {
    throw conflict('settlement_version_crossed')
  }

  const reread = await readPrivateEditAuthorityAggregate({
    localStorageRoot: input.context.env.localStorageRoot,
    workspaceId: authority.workspaceId,
    ownerUserId: access.userId,
  })
  const exactReread = reread?.gpuAttemptCreditSettlements.find((record) =>
    record.id === settlement.id)
  if (
    !exactReread
    || exactReread.schemaVersion !==
      CANONICAL_A100_VERTEX_ATTEMPT_CREDIT_SETTLEMENT_VERSION
    || exactReread.settlementHash !== settlement.settlementHash
  ) throw conflict('settlement_exact_reread_failed')

  return Object.freeze({
    settlement: structuredClone(exactReread),
    idempotentReplay,
    exactAuthorityExecutionTerminalCostAndReservationReread: true,
    sharedPlanReservationRetainedForRemainingApprovedWork: true,
    serviceFeeAndFinalUnusedReservationSettlementRemainSeparate: true,
    billingAccountIdentifierReturned: false,
    externalCustomerWalletMutated: false,
    publicBillingAuthorityGranted: false,
    productionAuthorityGranted: false,
  })
}

function assertExactLineage(input: {
  authority: CanonicalA100VertexCustomJobLaunchAuthority
  execution: ReturnType<
    typeof assertCanonicalA100VertexCustomJobExecutionRecord
  >
  executionRef: z.infer<typeof evidenceRefSchema>
  terminal: CanonicalA100VertexCustomJobTerminalRead
  receipt: CanonicalA100VertexSettleableCostReceipt
}): AuthorityA100VertexAttemptCreditSettlementRecord['terminalOutcome'] {
  const { authority, execution, executionRef, terminal, receipt } = input
  const exactReceiptOutcome = terminal.terminalOutcome === 'completed'
    ? receipt.terminalOutcome === 'completed'
    : terminal.terminalOutcome === 'failed'
      ? receipt.terminalOutcome === 'weeditpro_failed'
      : receipt.terminalOutcome === terminal.terminalOutcome
  if (
    !sameRef(execution.authorityRef,
      ref(authority.authorityId, authority.authorityHash))
    || !sameRef(execution.releaseRef, authority.releaseRef)
    || !sameRef(terminal.executionRef, executionRef)
    || !sameRef(receipt.executionRef, executionRef)
    || !sameRef(receipt.authorityRef,
      ref(authority.authorityId, authority.authorityHash))
    || !sameRef(receipt.releaseRef, authority.releaseRef)
    || !sameRef(receipt.cloudTerminalObservationRef,
      terminal.cloudTerminalObservationRef!)
    || !sameRef(receipt.rateAuthorityRef,
      terminal.currentAccountPriceAuthorityRef!)
    || !sameRef(terminal.attemptCostReceiptRef!,
      ref(receipt.receiptId, receipt.receiptHash))
    || !sameRef(receipt.approvedSnapshotRef,
      authority.approvedSnapshotRef)
    || !sameRef(receipt.approvedWorkItemRef,
      authority.approvedWorkItemRef)
    || !sameRef(receipt.fundedReservationRef,
      authority.fundedReservationRef)
    || !sameRef(receipt.approvedEstimateRef,
      authority.approvedEstimateRef)
    || !sameRef(receipt.userApprovalRecordRef,
      authority.userApprovalRecordRef)
    || !sameRef(receipt.executionAttemptRef,
      authority.executionAttemptRef)
    || receipt.providerInferenceOrSubstantiveWorkOutcome !==
      terminal.providerInferenceOrSubstantiveWorkOutcome
    || !exactReceiptOutcome
    || receipt.customerWalletOrLedgerMutationPerformed !== false
    || terminal.customerWalletOrLedgerMutated !== false
  ) throw conflict('terminal_cost_lineage_mismatch')
  return terminal.terminalOutcome === 'completed'
    ? 'completed'
    : 'reeditpro_failed'
}

function sameExisting(input: {
  settlement: AuthorityA100VertexAttemptCreditSettlementRecord
  terminal: CanonicalA100VertexCustomJobTerminalRead
  authority: CanonicalA100VertexCustomJobLaunchAuthority
  execution: ReturnType<
    typeof assertCanonicalA100VertexCustomJobExecutionRecord
  >
  receipt: CanonicalA100VertexSettleableCostReceipt
}): boolean {
  return input.settlement.vertexTerminalReadHash ===
      input.terminal.terminalReadHash
    && input.settlement.launchAuthorityHash === input.authority.authorityHash
    && input.settlement.executionRecordHash ===
      input.execution.executionRecordHash
    && input.settlement.attemptCostReceiptHash === input.receipt.receiptHash
}

function ref(id: string, hash: string, version = 1) {
  return evidenceRefSchema.parse({
    id,
    version,
    contentHash: `sha256:${hash}`,
  })
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function assertCanonicalA100VertexSettleableCostReceipt(
  value: unknown,
): CanonicalA100VertexSettleableCostReceipt {
  assertPlainSerializedData(value, 'vertex_a100_settleable_cost_receipt')
  const version = (value as { readonly schemaVersion?: unknown }).schemaVersion
  if (version === CANONICAL_A100_VERTEX_ATTEMPT_COST_RECEIPT_VERSION) {
    return assertCanonicalA100VertexAttemptCostReceipt(value)
  }
  if (version ===
    CANONICAL_A100_VERTEX_PROVIDER_ALLOCATION_COST_RECEIPT_VERSION) {
    return assertCanonicalA100VertexProviderAllocationCostReceipt(value)
  }
  throw conflict('attempt_cost_receipt_version_unsupported')
}

function conflict(reason: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    `Vertex A100 attempt settlement: ${reason}.`,
    409,
  )
}
