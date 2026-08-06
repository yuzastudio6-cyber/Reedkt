import { createHash } from 'node:crypto'

import {
  hashEditReferenceStudyChatReasoningRequest,
  validateEditReferenceStudyChatReasoningRequest,
  type EditReferenceStudyChatReasoningRequest,
} from './edit-reference-study-chat-reasoning-contract'
import {
  CANONICAL_REASONING_RUN_RECEIPT_VERSION,
  validateCanonicalReasoningRunReceipt,
  type CanonicalReasoningRunReceipt,
  type CanonicalReasoningRunTerminalState,
} from '../reasoning-model-execution/canonical-reasoning-run-receipt'

export const EDIT_REFERENCE_STUDY_CHAT_REASONING_RUN_RECEIPT_VERSION =
  'edit-reference-study-chat-reasoning-run-receipt-v1' as const

export interface EditReferenceStudyChatReasoningRunReceipt {
  readonly schemaVersion: typeof EDIT_REFERENCE_STUDY_CHAT_REASONING_RUN_RECEIPT_VERSION
  readonly sourceReceiptVersion: typeof CANONICAL_REASONING_RUN_RECEIPT_VERSION
  readonly sourceAuthority: 'shared_backend_reasoning_route_contract'
  readonly evidenceClass: 'source_verified_contract_fixture_unreleased'
  readonly promotionAllowed: false
  readonly productionReady: false
  readonly workspaceId: string
  readonly actorUserId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly studyRevision: number
  readonly reasoningRequestDigestSha256: string
  readonly reasoningRunId: string
  readonly terminalState: CanonicalReasoningRunTerminalState
  readonly routeIds: CanonicalReasoningRunReceipt['costAggregate']['routeIds']
  readonly attemptIds: string[]
  readonly failedAttemptCount: number
  readonly failedAttemptCostRetained: true
  readonly allAttemptCostsVerifiedAndUsdNormalized: boolean
  readonly normalizedUsdInternalCostMicros: number | null
  readonly maximumUnverifiedExposureMicros: string | null
  readonly withinAuthorizedInternalCostCeiling: boolean
  readonly finalResultDigestSha256: string | null
  readonly canonicalReasoningRunReceiptDigestSha256: string
  readonly approvedPlanSnapshotFabricated: false
  readonly creditReservationFabricated: false
  readonly providerCallsMadeByProjection: false
  readonly customerPriceCalculated: false
  readonly customerCreditsCalculated: false
  readonly customerCreditsMutated: false
  readonly customerChargeCreated: false
  readonly walletMutationMade: false
  readonly serviceFeeIncluded: false
  readonly receiptDigestSha256: string
}

export function createEditReferenceStudyChatReasoningRunReceipt(input: {
  readonly request: EditReferenceStudyChatReasoningRequest
  readonly canonicalReceipt: CanonicalReasoningRunReceipt
}): EditReferenceStudyChatReasoningRunReceipt {
  validateEditReferenceStudyChatReasoningRequest(input.request)
  if (input.request.executionScope !== 'production') {
    throw new Error('The canonical Study Chat reasoning-run receipt requires production-scoped pre-plan cost authority.')
  }
  const validated = validateCanonicalReasoningRunReceipt(input.canonicalReceipt)
  if (!validated.ok) throw new Error(validated.error.message)
  const receipt = validated.data
  const authority = receipt.workloadAuthority
  const requestDigestSha256 = hashEditReferenceStudyChatReasoningRequest(input.request)
  if (
    authority.workspaceId !== input.request.workspaceId
    || authority.actorUserId !== input.request.actorUserId
    || authority.editReferenceId !== input.request.editReferenceId
    || authority.studySessionId !== input.request.studySessionId
    || authority.studyRevision !== input.request.expectedStudyRevision
    || authority.reasoningRequestDigestSha256 !== requestDigestSha256
    || authority.approvedUsageEstimateId !== input.request.approvedUsageEstimateId
    || authority.internalCostBudgetId !== input.request.internalCostBudgetId
    || authority.immutableRateCardSnapshotId !== input.request.immutableRateCardSnapshotId
    || authority.maximumAuthorizedInternalCostMicros !== input.request.maximumAuthorizedInternalCostMicros
  ) {
    throw new Error('The canonical reasoning run does not match the exact Study Chat request and pre-plan cost authority.')
  }

  const withoutDigest = {
    schemaVersion: EDIT_REFERENCE_STUDY_CHAT_REASONING_RUN_RECEIPT_VERSION,
    sourceReceiptVersion: CANONICAL_REASONING_RUN_RECEIPT_VERSION,
    sourceAuthority: 'shared_backend_reasoning_route_contract' as const,
    evidenceClass: 'source_verified_contract_fixture_unreleased' as const,
    promotionAllowed: false as const,
    productionReady: false as const,
    workspaceId: authority.workspaceId,
    actorUserId: authority.actorUserId,
    editReferenceId: authority.editReferenceId,
    studySessionId: authority.studySessionId,
    studyRevision: authority.studyRevision,
    reasoningRequestDigestSha256: requestDigestSha256,
    reasoningRunId: receipt.reasoningRunId,
    terminalState: receipt.terminalState,
    routeIds: [...receipt.costAggregate.routeIds],
    attemptIds: [...receipt.costAggregate.attemptIds],
    failedAttemptCount: receipt.costAggregate.failedAttemptCount,
    failedAttemptCostRetained: true as const,
    allAttemptCostsVerifiedAndUsdNormalized:
      receipt.costAggregate.allAttemptCostsVerifiedAndUsdNormalized,
    normalizedUsdInternalCostMicros: receipt.costAggregate.normalizedUsdCostMicros,
    maximumUnverifiedExposureMicros: receipt.costAggregate.maximumUnverifiedExposureMicros,
    withinAuthorizedInternalCostCeiling:
      receipt.costAggregate.withinAuthorizedInternalCostCeiling,
    finalResultDigestSha256: receipt.finalResultDigestSha256,
    canonicalReasoningRunReceiptDigestSha256: receipt.receiptDigestSha256,
    approvedPlanSnapshotFabricated: false as const,
    creditReservationFabricated: false as const,
    providerCallsMadeByProjection: false as const,
    customerPriceCalculated: false as const,
    customerCreditsCalculated: false as const,
    customerCreditsMutated: false as const,
    customerChargeCreated: false as const,
    walletMutationMade: false as const,
    serviceFeeIncluded: false as const,
  }
  return {
    ...withoutDigest,
    receiptDigestSha256: sha256(stableStringify(withoutDigest)),
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
    return `{${entries.join(',')}}`
  }
  return JSON.stringify(value)
}
