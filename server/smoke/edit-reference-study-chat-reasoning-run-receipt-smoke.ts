import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  EDIT_REFERENCE_STUDY_CHAT_REASONING_REQUEST_VERSION,
  hashEditReferenceStudyChatReasoningRequest,
  type EditReferenceStudyChatReasoningRequest,
} from '../edit-references/edit-reference-study-chat-reasoning-contract'
import {
  createEditReferenceStudyChatReasoningRunReceipt,
} from '../edit-references/edit-reference-study-chat-reasoning-run-receipt'
import {
  createCanonicalReasoningRouteAttemptLifecycleEvidence,
  createCanonicalReasoningRunReceipt,
  validateCanonicalReasoningRunReceipt,
} from '../reasoning-model-execution/canonical-reasoning-run-receipt'
import {
  aggregateReasoningModelAttemptCostsV2,
  createPrePlanEditReferenceStudyChatReasoningAuthority,
  createReasoningModelAttemptCostEvidenceV2,
  type ReasoningModelAttemptCostEvidenceV2,
  type ReasoningModelAttemptTerminalOutcome,
  type ReasoningModelTokenUsage,
} from '../reasoning-model-cost'
import type {
  ReEditProReasoningFallbackTrigger,
  ReEditProReasoningModelRouteId,
} from '../../src/types/reasoning-model-routing'

const request: EditReferenceStudyChatReasoningRequest = {
  schemaVersion: EDIT_REFERENCE_STUDY_CHAT_REASONING_REQUEST_VERSION,
  workspaceId: 'workspace-reasoning-run-smoke',
  actorUserId: 'user-reasoning-run-smoke',
  editReferenceId: 'reference-reasoning-run-smoke',
  studySessionId: 'study-reasoning-run-smoke',
  expectedStudyRevision: 7,
  clientMessageDigestSha256: sha256('client-message-reasoning-run-smoke'),
  structuredContextDigestSha256: sha256('structured-context-reasoning-run-smoke'),
  maxContextCharacters: 32_000,
  executionScope: 'production',
  approvedUsageEstimateId: 'study-usage-estimate-reasoning-run-smoke',
  internalCostBudgetId: 'study-cost-budget-reasoning-run-smoke',
  immutableRateCardSnapshotId: 'rate-card-snapshot-reasoning-run-smoke',
  maximumAuthorizedInternalCostMicros: '5000000',
  rawMediaInputAllowed: false,
  rawTranscriptInputAllowed: false,
  projectChatHistoryInputAllowed: false,
  externalUrlFetchAllowed: false,
  exactReferenceWordingTransferAllowed: false,
  exactReferenceSequenceTransferAllowed: false,
  exactReferenceTimingTransferAllowed: false,
  referenceIdentityTransferAllowed: false,
  evidenceMutationAllowed: false,
  dnaMutationAllowed: false,
  approvalMutationAllowed: false,
  targetOperationCreationAllowed: false,
  customerPriceCalculationAllowed: false,
  customerCreditMutationAllowed: false,
  serviceFeeCalculationAllowed: false,
}
const requestDigest = hashEditReferenceStudyChatReasoningRequest(request)
const authorityResult = createPrePlanEditReferenceStudyChatReasoningAuthority({
  workspaceId: request.workspaceId,
  actorUserId: request.actorUserId,
  editReferenceId: request.editReferenceId,
  studySessionId: request.studySessionId,
  studyRevision: request.expectedStudyRevision,
  reasoningRequestDigestSha256: requestDigest,
  approvedUsageEstimateId: request.approvedUsageEstimateId as string,
  internalCostBudgetId: request.internalCostBudgetId as string,
  immutableRateCardSnapshotId: request.immutableRateCardSnapshotId as string,
  maximumAuthorizedInternalCostMicros: request.maximumAuthorizedInternalCostMicros as string,
})
if (!authorityResult.ok) throw new Error(authorityResult.error.message)
const authority = authorityResult.data

const nativeUsage: ReasoningModelTokenUsage = {
  uncachedInputTokens: 100_000,
  cachedInputTokens: 50_000,
  cacheCreationInputTokens: 0,
  outputTokens: 10_000,
  cacheBillingMode: 'provider_native',
}

const qwenUsage: ReasoningModelTokenUsage = {
  uncachedInputTokens: 100_000,
  cachedInputTokens: 50_000,
  cacheCreationInputTokens: 0,
  outputTokens: 10_000,
  cacheBillingMode: 'qwen_implicit',
}

const kimi = attempt({
  routeId: 'kimi_k3_primary',
  ordinal: 1,
  entryFallbackTrigger: null,
  terminalOutcome: 'failed',
  terminalFallbackTrigger: 'provider_timeout',
  usage: nativeUsage,
  recordedAt: '2026-07-20T16:00:10.000Z',
})
const qwen = attempt({
  routeId: 'qwen_3_7_fallback',
  ordinal: 2,
  entryFallbackTrigger: 'provider_timeout',
  terminalOutcome: 'failed',
  terminalFallbackTrigger: 'malformed_structured_output',
  usage: qwenUsage,
  fxSnapshot: {
    snapshotId: 'fx-cny-usd-study-chat-smoke-v1',
    source: 'immutable controlled FX fixture',
    sourceUrl: 'https://example.com/immutable-fx-fixture',
    observedAt: '2026-07-20T15:59:00.000Z',
    cnyToUsdMicrosPerCny: 140_000,
  },
  recordedAt: '2026-07-20T16:00:20.000Z',
})
const deepseek = attempt({
  routeId: 'deepseek_v4_pro_fallback',
  ordinal: 3,
  entryFallbackTrigger: 'malformed_structured_output',
  terminalOutcome: 'completed',
  terminalFallbackTrigger: null,
  usage: nativeUsage,
  recordedAt: '2026-07-20T16:00:30.000Z',
})

const aggregate = aggregateReasoningModelAttemptCostsV2([kimi, qwen, deepseek])
if (!aggregate.ok) throw new Error(aggregate.error.message)
assert.deepEqual(aggregate.data.routeIds, [
  'kimi_k3_primary',
  'qwen_3_7_fallback',
  'deepseek_v4_pro_fallback',
])
assert.equal(aggregate.data.failedAttemptCount, 2)
assert.equal(aggregate.data.completedAttemptCount, 1)
assert.equal(aggregate.data.failedAttemptCostRetained, true)
assert.equal(aggregate.data.allAttemptCostsVerifiedAndUsdNormalized, true)
assert.equal(aggregate.data.withinAuthorizedInternalCostCeiling, true)
assert.equal(aggregate.data.customerPriceCalculated, false)
assert.equal(aggregate.data.customerCreditsCalculated, false)
assert.equal(aggregate.data.serviceFeeIncluded, false)

const evidence = [
  lifecycle(kimi, '2026-07-20T16:00:00.000Z', '2026-07-20T16:00:10.000Z', 'provider_timeout'),
  lifecycle(qwen, '2026-07-20T16:00:11.000Z', '2026-07-20T16:00:20.000Z', 'malformed_structured_output'),
  lifecycle(deepseek, '2026-07-20T16:00:21.000Z', '2026-07-20T16:00:30.000Z', null),
]
const canonical = createCanonicalReasoningRunReceipt({
  workloadAuthority: authority,
  attempts: [
    { costEvidence: kimi, lifecycleEvidence: evidence[0] },
    { costEvidence: qwen, lifecycleEvidence: evidence[1] },
    { costEvidence: deepseek, lifecycleEvidence: evidence[2] },
  ],
  finalResultDigestSha256: sha256('bounded-study-chat-answer'),
  createdAt: '2026-07-20T16:00:00.000Z',
  terminalAt: '2026-07-20T16:00:30.000Z',
})
if (!canonical.ok) throw new Error(canonical.error.message)
assert.equal(canonical.data.terminalState, 'completed')
assert.equal(canonical.data.evidenceClass, 'source_verified_contract_fixture_unreleased')
assert.equal(canonical.data.promotionAllowed, false)
assert.equal(canonical.data.productionReady, false)
assert.equal(validateCanonicalReasoningRunReceipt(canonical.data).ok, true)

const studyReceipt = createEditReferenceStudyChatReasoningRunReceipt({
  request,
  canonicalReceipt: canonical.data,
})
assert.equal(studyReceipt.reasoningRunId, 'reasoning-run-study-chat-smoke')
assert.deepEqual(studyReceipt.routeIds, [
  'kimi_k3_primary',
  'qwen_3_7_fallback',
  'deepseek_v4_pro_fallback',
])
assert.equal(studyReceipt.failedAttemptCount, 2)
assert.equal(studyReceipt.failedAttemptCostRetained, true)
assert.equal(studyReceipt.approvedPlanSnapshotFabricated, false)
assert.equal(studyReceipt.creditReservationFabricated, false)
assert.equal(studyReceipt.providerCallsMadeByProjection, false)
assert.equal(studyReceipt.productionReady, false)

const unknown = attempt({
  routeId: 'kimi_k3_primary',
  ordinal: 1,
  entryFallbackTrigger: null,
  terminalOutcome: 'unknown_reconciliation_required',
  terminalFallbackTrigger: null,
  usage: null,
  recordedAt: '2026-07-20T17:00:05.000Z',
  suffix: 'unknown',
})
const unknownLifecycle = lifecycle(
  unknown,
  '2026-07-20T17:00:00.000Z',
  null,
  null,
)
assert.equal(createCanonicalReasoningRouteAttemptLifecycleEvidence({
  costEvidence: unknown,
  providerRequestRecordId: 'provider-request-unknown-without-checkback',
  providerRequestEvidenceDigestSha256: sha256('provider-request-unknown-without-checkback'),
  oneUseSubmissionAuthorityDigestSha256: sha256('one-use-unknown-without-checkback'),
  providerObservationDigestSha256: sha256('provider-observation-unknown-without-checkback'),
  providerCheckbackRecordId: null,
  providerWorkflowRecordId: null,
  startedAt: '2026-07-20T17:00:00.000Z',
  terminalAt: null,
  sanitizedFailureCode: null,
}).ok, false)
const unknownRun = createCanonicalReasoningRunReceipt({
  workloadAuthority: authority,
  attempts: [{ costEvidence: unknown, lifecycleEvidence: unknownLifecycle }],
  finalResultDigestSha256: null,
  createdAt: '2026-07-20T17:00:00.000Z',
  terminalAt: '2026-07-20T17:00:05.000Z',
})
if (!unknownRun.ok) throw new Error(unknownRun.error.message)
assert.equal(unknownRun.data.terminalState, 'unknown_reconciliation_required')
assert.equal(unknownRun.data.costAggregate.unknownAttemptCount, 1)
assert.equal(unknownRun.data.costAggregate.normalizedUsdCostMicros, null)
assert.equal(
  unknownRun.data.costAggregate.maximumUnverifiedExposureMicros,
  request.maximumAuthorizedInternalCostMicros,
)

const missingFx = createReasoningModelAttemptCostEvidenceV2({
  ...attemptInput({
    routeId: 'qwen_3_7_fallback',
    ordinal: 2,
    entryFallbackTrigger: 'provider_timeout',
    terminalOutcome: 'completed',
    terminalFallbackTrigger: null,
    usage: qwenUsage,
    recordedAt: '2026-07-20T18:00:00.000Z',
  }),
})
assert.equal(missingFx.ok, false)
if (!missingFx.ok) assert.equal(missingFx.error.code, 'missing_fx_normalization')

assert.equal(aggregateReasoningModelAttemptCostsV2([qwen]).ok, false)
const mismatchedFallback = attempt({
  routeId: 'qwen_3_7_fallback',
  ordinal: 2,
  entryFallbackTrigger: 'provider_unavailable',
  terminalOutcome: 'completed',
  terminalFallbackTrigger: null,
  usage: qwenUsage,
  fxSnapshot: {
    snapshotId: 'fx-cny-usd-study-chat-smoke-mismatch',
    source: 'immutable controlled FX fixture',
    sourceUrl: 'https://example.com/immutable-fx-fixture-mismatch',
    observedAt: '2026-07-20T18:00:00.000Z',
    cnyToUsdMicrosPerCny: 140_000,
  },
  recordedAt: '2026-07-20T18:00:01.000Z',
  suffix: 'qwen-mismatched-entry',
})
assert.equal(aggregateReasoningModelAttemptCostsV2([kimi, mismatchedFallback]).ok, false)
const completedKimi = attempt({
  routeId: 'kimi_k3_primary',
  ordinal: 1,
  entryFallbackTrigger: null,
  terminalOutcome: 'completed',
  terminalFallbackTrigger: null,
  usage: nativeUsage,
  recordedAt: '2026-07-20T18:00:02.000Z',
  suffix: 'kimi-completed-before-fallback',
})
assert.equal(aggregateReasoningModelAttemptCostsV2([completedKimi, qwen]).ok, false)
assert.equal(aggregateReasoningModelAttemptCostsV2([
  { ...kimi, evidenceHashSha256: '0'.repeat(64) },
]).ok, false)
assert.equal(aggregateReasoningModelAttemptCostsV2([{
  ...kimi,
  workloadAuthority: { ...authority, unexpectedCredentialField: 'must-not-persist' } as never,
}]).ok, false)

const lowCeilingAuthority = createPrePlanEditReferenceStudyChatReasoningAuthority({
  ...authority,
  maximumAuthorizedInternalCostMicros: '1',
})
if (!lowCeilingAuthority.ok) throw new Error(lowCeilingAuthority.error.message)
const overCeilingKimi = createReasoningModelAttemptCostEvidenceV2({
  ...attemptInput({
    routeId: 'kimi_k3_primary',
    ordinal: 1,
    entryFallbackTrigger: null,
    terminalOutcome: 'completed',
    terminalFallbackTrigger: null,
    usage: nativeUsage,
    recordedAt: '2026-07-20T18:01:00.000Z',
  }),
  workloadAuthority: lowCeilingAuthority.data,
})
if (!overCeilingKimi.ok) throw new Error(overCeilingKimi.error.message)
assert.equal(aggregateReasoningModelAttemptCostsV2([overCeilingKimi.data]).ok, false)

assert.throws(() => createEditReferenceStudyChatReasoningRunReceipt({
  request: { ...request, structuredContextDigestSha256: sha256('different-context') },
  canonicalReceipt: canonical.data,
}), /does not match the exact Study Chat request/i)

assert.equal(validateCanonicalReasoningRunReceipt({
  ...canonical.data,
  productionReady: true,
} as never).ok, false)

console.log(JSON.stringify({
  status: 'passed',
  contract: 'edit-reference-study-chat-canonical-reasoning-run-v1',
  routeOrder: studyReceipt.routeIds,
  attemptCount: studyReceipt.attemptIds.length,
  failedAttemptCount: studyReceipt.failedAttemptCount,
  failedAttemptCostRetained: studyReceipt.failedAttemptCostRetained,
  normalizedUsdInternalCostMicros: studyReceipt.normalizedUsdInternalCostMicros,
  unknownOutcomeBlocksFallback: true,
  qwenRequiresVersionedFx: true,
  approvedPlanSnapshotFabricated: false,
  creditReservationFabricated: false,
  providerCallMade: false,
  customerPriceCalculated: false,
  customerCreditsMutated: false,
  serviceFeeIncluded: false,
  productionReady: false,
}))

function attempt(input: AttemptInput): ReasoningModelAttemptCostEvidenceV2 {
  const created = createReasoningModelAttemptCostEvidenceV2(attemptInput(input))
  if (!created.ok) throw new Error(created.error.message)
  return created.data
}

function attemptInput(input: AttemptInput) {
  const suffix = input.suffix ?? input.routeId
  return {
    workloadAuthority: authority,
    reasoningRunId: 'reasoning-run-study-chat-smoke',
    attemptId: `reasoning-attempt-${suffix}`,
    attemptOrdinal: input.ordinal,
    routeId: input.routeId,
    routeAuthorizationDigestSha256: sha256(`route-authorization-${suffix}`),
    idempotencyKeyDigestSha256: sha256(`idempotency-${suffix}`),
    requestPayloadHashSha256: requestDigest,
    providerUsageEvidenceHashSha256: sha256(`provider-usage-${suffix}`),
    entryFallbackTrigger: input.entryFallbackTrigger,
    terminalOutcome: input.terminalOutcome,
    terminalFallbackTrigger: input.terminalFallbackTrigger,
    usage: input.usage,
    ...(input.fxSnapshot ? { fxSnapshot: input.fxSnapshot } : {}),
    recordedAt: input.recordedAt,
  }
}

function lifecycle(
  costEvidence: ReasoningModelAttemptCostEvidenceV2,
  startedAt: string,
  terminalAt: string | null,
  sanitizedFailureCode: string | null,
) {
  const created = createCanonicalReasoningRouteAttemptLifecycleEvidence({
    costEvidence,
    providerRequestRecordId: `provider-request-${costEvidence.attemptId}`,
    providerRequestEvidenceDigestSha256: sha256(`provider-request-evidence-${costEvidence.attemptId}`),
    oneUseSubmissionAuthorityDigestSha256: sha256(`one-use-submission-${costEvidence.attemptId}`),
    providerObservationDigestSha256: sha256(`provider-observation-${costEvidence.attemptId}`),
    providerCheckbackRecordId: costEvidence.terminalOutcome === 'unknown_reconciliation_required'
      ? `provider-checkback-${costEvidence.attemptId}`
      : null,
    providerWorkflowRecordId: costEvidence.terminalOutcome === 'unknown_reconciliation_required'
      ? `provider-workflow-${costEvidence.attemptId}`
      : null,
    startedAt,
    terminalAt,
    sanitizedFailureCode,
  })
  if (!created.ok) throw new Error(created.error.message)
  return created.data
}

interface AttemptInput {
  readonly routeId: ReEditProReasoningModelRouteId
  readonly ordinal: 1 | 2 | 3
  readonly entryFallbackTrigger: ReEditProReasoningFallbackTrigger | null
  readonly terminalOutcome: ReasoningModelAttemptTerminalOutcome
  readonly terminalFallbackTrigger: ReEditProReasoningFallbackTrigger | null
  readonly usage: ReasoningModelTokenUsage | null
  readonly fxSnapshot?: {
    readonly snapshotId: string
    readonly source: string
    readonly sourceUrl: string
    readonly observedAt: string
    readonly cnyToUsdMicrosPerCny: number
  }
  readonly recordedAt: string
  readonly suffix?: string
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
