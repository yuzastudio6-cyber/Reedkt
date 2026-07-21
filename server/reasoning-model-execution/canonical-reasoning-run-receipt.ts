import { createHash } from 'node:crypto'

import type {
  ReEditProReasoningModelRouteId,
} from '../../src/types/reasoning-model-routing'
import { getReEditProReasoningModelRoute } from '../../src/lib/reasoning-model-routing-contract'
import {
  aggregateReasoningModelAttemptCostsV2,
  validateReasoningModelAttemptCostEvidenceV2,
  type ReasoningModelAttemptCostAggregateV2,
  type ReasoningModelAttemptCostEvidenceV2,
  type ReasoningModelAttemptTerminalOutcome,
  type ReasoningModelCostResult,
  type PrePlanEditReferenceStudyChatReasoningAuthority,
} from '../reasoning-model-cost'

export const CANONICAL_REASONING_ROUTE_ATTEMPT_LIFECYCLE_VERSION =
  'canonical-reasoning-route-attempt-lifecycle-v1' as const

export const CANONICAL_REASONING_RUN_RECEIPT_VERSION =
  'canonical-reasoning-run-receipt-v1' as const

export interface CanonicalReasoningRouteAttemptLifecycleInput {
  readonly costEvidence: ReasoningModelAttemptCostEvidenceV2
  readonly providerRequestRecordId: string
  readonly providerRequestEvidenceDigestSha256: string
  readonly oneUseSubmissionAuthorityDigestSha256: string
  readonly providerObservationDigestSha256: string
  readonly providerCheckbackRecordId: string | null
  readonly providerWorkflowRecordId: string | null
  readonly startedAt: string
  readonly terminalAt: string | null
  readonly sanitizedFailureCode: string | null
}

export interface CanonicalReasoningRouteAttemptLifecycleEvidence {
  readonly schemaVersion: typeof CANONICAL_REASONING_ROUTE_ATTEMPT_LIFECYCLE_VERSION
  readonly reasoningRunId: string
  readonly attemptId: string
  readonly attemptOrdinal: 1 | 2 | 3
  readonly routeId: ReEditProReasoningModelRouteId
  readonly routeAuthorizationDigestSha256: string
  readonly attemptCostEvidenceHashSha256: string
  readonly provider: string
  readonly exactProviderModelId: string
  readonly providerBoundary: string
  readonly providerRequestRecordId: string
  readonly providerRequestEvidenceDigestSha256: string
  readonly oneUseSubmissionAuthorityDigestSha256: string
  readonly providerUsageEvidenceHashSha256: string
  readonly providerObservationDigestSha256: string
  readonly providerCheckbackRecordId: string | null
  readonly providerWorkflowRecordId: string | null
  readonly terminalOutcome: ReasoningModelAttemptTerminalOutcome
  readonly startedAt: string
  readonly terminalAt: string | null
  readonly providerCallMayHaveOccurred: true
  readonly providerSubmissionCount: 1
  readonly retryCount: 0
  readonly resubmissionAllowed: false
  readonly sanitizedFailureCode: string | null
  readonly credentialValuePersisted: false
  readonly credentialValueLogged: false
  readonly rawRequestBodyPersisted: false
  readonly rawProviderResponsePersisted: false
  readonly providerUrlPersisted: false
  readonly localPathProjected: false
  readonly callerSelectedExecutableAllowed: false
  readonly callerSelectedProviderRouteAllowed: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
  readonly lifecycleEvidenceDigestSha256: string
}

export type CanonicalReasoningRunTerminalState =
  | 'completed'
  | 'blocked_fallback_unavailable'
  | 'failed_exhausted'
  | 'unknown_reconciliation_required'

export interface CanonicalReasoningRunReceipt {
  readonly schemaVersion: typeof CANONICAL_REASONING_RUN_RECEIPT_VERSION
  readonly sourceAuthority: 'canonical_backend_reasoning_route_contract'
  readonly evidenceClass: 'source_verified_contract_fixture_unreleased'
  readonly promotionAllowed: false
  readonly productionReady: false
  readonly workloadAuthority: PrePlanEditReferenceStudyChatReasoningAuthority
  readonly reasoningRunId: string
  readonly terminalState: CanonicalReasoningRunTerminalState
  readonly routeAttempts: CanonicalReasoningRouteAttemptLifecycleEvidence[]
  readonly routeAttemptCostEvidence: ReasoningModelAttemptCostEvidenceV2[]
  readonly costAggregate: ReasoningModelAttemptCostAggregateV2
  readonly finalResultDigestSha256: string | null
  readonly createdAt: string
  readonly terminalAt: string
  readonly failedAttemptCostRetained: true
  readonly providerCallsMadeByReceiptBuilder: false
  readonly customerPriceCalculated: false
  readonly customerCreditsCalculated: false
  readonly customerCreditsMutated: false
  readonly customerChargeCreated: false
  readonly walletMutationMade: false
  readonly serviceFeeIncluded: false
  readonly receiptDigestSha256: string
}

export function createCanonicalReasoningRouteAttemptLifecycleEvidence(
  input: CanonicalReasoningRouteAttemptLifecycleInput,
): ReasoningModelCostResult<CanonicalReasoningRouteAttemptLifecycleEvidence> {
  const validatedCost = validateReasoningModelAttemptCostEvidenceV2(input.costEvidence)
  if (!validatedCost.ok) return validatedCost
  const cost = validatedCost.data
  const route = getReEditProReasoningModelRoute(cost.routeId)
  for (const [field, value] of Object.entries({
    providerRequestRecordId: input.providerRequestRecordId,
    providerCheckbackRecordId: input.providerCheckbackRecordId,
    providerWorkflowRecordId: input.providerWorkflowRecordId,
  })) {
    if (value !== null && !ID_PATTERN.test(value)) {
      return failure('invalid_provider_lifecycle_identity', field, `${field} is invalid.`)
    }
  }
  for (const [field, value] of Object.entries({
    providerRequestEvidenceDigestSha256: input.providerRequestEvidenceDigestSha256,
    oneUseSubmissionAuthorityDigestSha256: input.oneUseSubmissionAuthorityDigestSha256,
    providerObservationDigestSha256: input.providerObservationDigestSha256,
  })) {
    if (!SHA256_PATTERN.test(value)) {
      return failure('invalid_provider_lifecycle_digest', field, `${field} must be lowercase SHA-256.`)
    }
  }
  if (!isIsoDate(input.startedAt)) {
    return failure('invalid_lifecycle_timestamp', 'startedAt', 'The provider attempt start timestamp is invalid.')
  }
  if (cost.terminalOutcome === 'unknown_reconciliation_required') {
    if (
      input.terminalAt !== null
      || input.sanitizedFailureCode !== null
      || input.providerCheckbackRecordId === null
      || input.providerWorkflowRecordId === null
    ) {
      return failure('unknown_lifecycle_reconciliation_invalid', 'terminalAt', 'Unknown provider truth requires canonical checkback/workflow identities and cannot claim a terminal timestamp or failure code.')
    }
  } else {
    if (
      !isIsoDate(input.terminalAt)
      || Date.parse(input.terminalAt) < Date.parse(input.startedAt)
    ) {
      return failure('invalid_lifecycle_timestamp', 'terminalAt', 'A terminal provider attempt requires an ordered terminal timestamp.')
    }
    if (cost.terminalOutcome === 'completed' && input.sanitizedFailureCode !== null) {
      return failure('completed_failure_code', 'sanitizedFailureCode', 'A completed provider attempt cannot retain a failure code.')
    }
    if (cost.terminalOutcome === 'failed' && !SAFE_CODE_PATTERN.test(input.sanitizedFailureCode ?? '')) {
      return failure('missing_sanitized_failure_code', 'sanitizedFailureCode', 'A failed provider attempt requires one safe failure code.')
    }
  }

  const withoutDigest = {
    schemaVersion: CANONICAL_REASONING_ROUTE_ATTEMPT_LIFECYCLE_VERSION,
    reasoningRunId: cost.reasoningRunId,
    attemptId: cost.attemptId,
    attemptOrdinal: cost.attemptOrdinal,
    routeId: cost.routeId,
    routeAuthorizationDigestSha256: cost.routeAuthorizationDigestSha256,
    attemptCostEvidenceHashSha256: cost.evidenceHashSha256,
    provider: route.provider,
    exactProviderModelId: route.exactProviderModelId,
    providerBoundary: route.providerBoundary,
    providerRequestRecordId: input.providerRequestRecordId,
    providerRequestEvidenceDigestSha256: input.providerRequestEvidenceDigestSha256,
    oneUseSubmissionAuthorityDigestSha256: input.oneUseSubmissionAuthorityDigestSha256,
    providerUsageEvidenceHashSha256: cost.providerUsageEvidenceHashSha256,
    providerObservationDigestSha256: input.providerObservationDigestSha256,
    providerCheckbackRecordId: input.providerCheckbackRecordId,
    providerWorkflowRecordId: input.providerWorkflowRecordId,
    terminalOutcome: cost.terminalOutcome,
    startedAt: new Date(input.startedAt).toISOString(),
    terminalAt: input.terminalAt ? new Date(input.terminalAt).toISOString() : null,
    providerCallMayHaveOccurred: true as const,
    providerSubmissionCount: 1 as const,
    retryCount: 0 as const,
    resubmissionAllowed: false as const,
    sanitizedFailureCode: input.sanitizedFailureCode,
    credentialValuePersisted: false as const,
    credentialValueLogged: false as const,
    rawRequestBodyPersisted: false as const,
    rawProviderResponsePersisted: false as const,
    providerUrlPersisted: false as const,
    localPathProjected: false as const,
    callerSelectedExecutableAllowed: false as const,
    callerSelectedProviderRouteAllowed: false as const,
    customerPriceCalculated: false as const,
    customerCreditsMutated: false as const,
    serviceFeeIncluded: false as const,
  }
  return {
    ok: true,
    data: {
      ...withoutDigest,
      lifecycleEvidenceDigestSha256: sha256(stableStringify(withoutDigest)),
    },
  }
}

export function createCanonicalReasoningRunReceipt(input: {
  readonly workloadAuthority: PrePlanEditReferenceStudyChatReasoningAuthority
  readonly attempts: readonly {
    readonly costEvidence: ReasoningModelAttemptCostEvidenceV2
    readonly lifecycleEvidence: CanonicalReasoningRouteAttemptLifecycleEvidence
  }[]
  readonly finalResultDigestSha256: string | null
  readonly createdAt: string
  readonly terminalAt: string
}): ReasoningModelCostResult<CanonicalReasoningRunReceipt> {
  if (!isIsoDate(input.createdAt) || !isIsoDate(input.terminalAt)) {
    return failure('invalid_run_timestamp', 'createdAt', 'The reasoning run requires valid timestamps.')
  }
  if (Date.parse(input.terminalAt) < Date.parse(input.createdAt)) {
    return failure('invalid_run_timestamp_order', 'terminalAt', 'The reasoning run terminal timestamp precedes its creation.')
  }
  const costs = input.attempts.map((attempt) => attempt.costEvidence)
  const aggregate = aggregateReasoningModelAttemptCostsV2(costs)
  if (!aggregate.ok) return aggregate
  if (aggregate.data.workloadAuthority.authorityDigestSha256 !== input.workloadAuthority.authorityDigestSha256) {
    return failure('run_workload_authority_mismatch', 'workloadAuthority', 'The run does not match the exact workload authority.')
  }

  for (const [index, attempt] of input.attempts.entries()) {
    const lifecycle = attempt.lifecycleEvidence
    const cost = attempt.costEvidence
    if (lifecycle.lifecycleEvidenceDigestSha256 !== lifecycleEvidenceHash(lifecycle)) {
      return failure('invalid_lifecycle_evidence_hash', 'lifecycleEvidenceDigestSha256', `Attempt ${cost.attemptId} lifecycle evidence failed integrity verification.`)
    }
    if (
      lifecycle.reasoningRunId !== cost.reasoningRunId
      || lifecycle.attemptId !== cost.attemptId
      || lifecycle.attemptOrdinal !== cost.attemptOrdinal
      || lifecycle.routeId !== cost.routeId
      || lifecycle.routeAuthorizationDigestSha256 !== cost.routeAuthorizationDigestSha256
      || lifecycle.attemptCostEvidenceHashSha256 !== cost.evidenceHashSha256
      || lifecycle.providerUsageEvidenceHashSha256 !== cost.providerUsageEvidenceHashSha256
      || lifecycle.terminalOutcome !== cost.terminalOutcome
      || Date.parse(lifecycle.startedAt) < Date.parse(input.createdAt)
      || (lifecycle.terminalAt && Date.parse(lifecycle.terminalAt) > Date.parse(input.terminalAt))
    ) {
      return failure('lifecycle_cost_evidence_mismatch', `attempts.${index}`, 'Provider lifecycle evidence does not match its exact route-attempt cost evidence.')
    }
  }

  const last = costs[costs.length - 1]
  const terminalState = deriveRunTerminalState(last, costs.length)
  if (terminalState === 'completed') {
    if (!SHA256_PATTERN.test(input.finalResultDigestSha256 ?? '')) {
      return failure('missing_final_result_digest', 'finalResultDigestSha256', 'A completed reasoning run requires the exact bounded result digest.')
    }
  } else if (input.finalResultDigestSha256 !== null) {
    return failure('unexpected_final_result_digest', 'finalResultDigestSha256', 'A non-completed reasoning run cannot claim a final answer digest.')
  }

  const withoutDigest = {
    schemaVersion: CANONICAL_REASONING_RUN_RECEIPT_VERSION,
    sourceAuthority: 'canonical_backend_reasoning_route_contract' as const,
    evidenceClass: 'source_verified_contract_fixture_unreleased' as const,
    promotionAllowed: false as const,
    productionReady: false as const,
    workloadAuthority: input.workloadAuthority,
    reasoningRunId: aggregate.data.reasoningRunId,
    terminalState,
    routeAttempts: input.attempts.map((attempt) => ({ ...attempt.lifecycleEvidence })),
    routeAttemptCostEvidence: input.attempts.map((attempt) => ({ ...attempt.costEvidence })),
    costAggregate: aggregate.data,
    finalResultDigestSha256: input.finalResultDigestSha256,
    createdAt: new Date(input.createdAt).toISOString(),
    terminalAt: new Date(input.terminalAt).toISOString(),
    failedAttemptCostRetained: true as const,
    providerCallsMadeByReceiptBuilder: false as const,
    customerPriceCalculated: false as const,
    customerCreditsCalculated: false as const,
    customerCreditsMutated: false as const,
    customerChargeCreated: false as const,
    walletMutationMade: false as const,
    serviceFeeIncluded: false as const,
  }
  return {
    ok: true,
    data: {
      ...withoutDigest,
      receiptDigestSha256: sha256(stableStringify(withoutDigest)),
    },
  }
}

export function validateCanonicalReasoningRunReceipt(
  receipt: CanonicalReasoningRunReceipt,
): ReasoningModelCostResult<CanonicalReasoningRunReceipt> {
  if (
    receipt.schemaVersion !== CANONICAL_REASONING_RUN_RECEIPT_VERSION
    || receipt.sourceAuthority !== 'canonical_backend_reasoning_route_contract'
    || receipt.evidenceClass !== 'source_verified_contract_fixture_unreleased'
    || receipt.promotionAllowed !== false
    || receipt.productionReady !== false
    || receipt.failedAttemptCostRetained !== true
    || receipt.providerCallsMadeByReceiptBuilder !== false
    || receipt.customerPriceCalculated !== false
    || receipt.customerCreditsCalculated !== false
    || receipt.customerCreditsMutated !== false
    || receipt.customerChargeCreated !== false
    || receipt.walletMutationMade !== false
    || receipt.serviceFeeIncluded !== false
  ) {
    return failure('invalid_run_boundary', 'receipt', 'The reasoning run receipt crosses a forbidden runtime or commercial boundary.')
  }
  if (receipt.receiptDigestSha256 !== canonicalReasoningRunReceiptHash(receipt)) {
    return failure('invalid_run_receipt_hash', 'receiptDigestSha256', 'The reasoning run receipt failed integrity verification.')
  }
  const recreated = createCanonicalReasoningRunReceipt({
    workloadAuthority: receipt.workloadAuthority,
    attempts: receipt.routeAttempts.map((lifecycleEvidence, index) => ({
      lifecycleEvidence,
      costEvidence: receipt.routeAttemptCostEvidence[index],
    })),
    finalResultDigestSha256: receipt.finalResultDigestSha256,
    createdAt: receipt.createdAt,
    terminalAt: receipt.terminalAt,
  })
  if (!recreated.ok) return recreated
  if (recreated.data.receiptDigestSha256 !== receipt.receiptDigestSha256) {
    return failure('run_receipt_reconstruction_mismatch', 'receipt', 'The reasoning run receipt does not reconstruct from its immutable evidence.')
  }
  return { ok: true, data: receipt }
}

function deriveRunTerminalState(
  last: ReasoningModelAttemptCostEvidenceV2,
  attemptCount: number,
): CanonicalReasoningRunTerminalState {
  if (last.terminalOutcome === 'completed') return 'completed'
  if (last.terminalOutcome === 'unknown_reconciliation_required') {
    return 'unknown_reconciliation_required'
  }
  return attemptCount === 3 ? 'failed_exhausted' : 'blocked_fallback_unavailable'
}

function lifecycleEvidenceHash(
  evidence: CanonicalReasoningRouteAttemptLifecycleEvidence,
): string {
  const withoutHash = Object.fromEntries(Object.entries(evidence).filter(
    ([key]) => key !== 'lifecycleEvidenceDigestSha256',
  ))
  return sha256(stableStringify(withoutHash))
}

function canonicalReasoningRunReceiptHash(receipt: CanonicalReasoningRunReceipt): string {
  const withoutHash = Object.fromEntries(Object.entries(receipt).filter(
    ([key]) => key !== 'receiptDigestSha256',
  ))
  return sha256(stableStringify(withoutHash))
}

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const SAFE_CODE_PATTERN = /^[a-z][a-z0-9_]{0,119}$/

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

function failure<T>(
  code: string,
  field: string,
  message: string,
): ReasoningModelCostResult<T> {
  return { ok: false, error: { code, field, message } }
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
