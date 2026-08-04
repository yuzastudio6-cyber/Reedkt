import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  hashEditReferenceLongFormSemanticReasoningRequest,
  resolveEditReferenceLongFormSemanticReasoningRoute,
  type EditReferenceLongFormSemanticReasoningProvider,
} from '../edit-references/edit-reference-long-form-semantic-reasoning-route'
import {
  EDIT_REFERENCE_REASONING_ROUTE_AUTHORIZATION_VERSION,
  REEDITPRO_SHARED_REASONING_ROUTE_CONTRACT_VERSION,
  hashEditReferenceReasoningRouteAuthorization,
  type EditReferenceReasoningRouteAuthorization,
  type EditReferenceReasoningRouteId,
} from '../edit-references/edit-reference-reasoning-route-authorization'
import {
  createEditReferenceLongFormStudyWorkOutput,
  validateEditReferenceLongFormStudyWorkOutput,
} from '../edit-references/edit-reference-long-form-study-work-output'
import { createUnmeteredEditReferenceLongFormStudyUsage } from '../edit-references/edit-reference-long-form-study-usage-contract'
import { EDIT_REFERENCE_LONG_FORM_SEMANTIC_SPECIALIST_IDS } from '../edit-references/edit-reference-long-form-specialist-stage-contract'
import {
  QWEN_LONG_FORM_SEMANTIC_CHUNK_CONTEXT_VERSION,
  type QwenLongFormSemanticChunkContext,
  type QwenLongFormSemanticChunkProvider,
} from '../services/qwen-long-form-semantic-chunk-provider'

const digest = (value: string) => createHash('sha256').update(value).digest('hex')
const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(',')}}`
}
const createdAt = '2026-07-20T20:00:00.000Z'
const dependencyDigests = Array.from({ length: 6 }, (_entry, index) => digest(`dependency-${index}`))

const usage = {
  schemaVersion: 'edit-reference-long-form-study-usage-v1' as const,
  mode: 'production_metered' as const,
  costEvidenceSource: 'composite_metered' as const,
  observedWallClockMs: 5_000,
  inputMediaSeconds: 120,
  outputBytes: 0,
  approvedUsageEstimateId: 'usage-estimate-semantic-smoke',
  internalCostBudgetId: 'cost-budget-semantic-smoke',
  maximumAuthorizedInternalCostMicros: '5000',
  rateCardSnapshotId: 'rate-card-semantic-smoke',
  meteredProviderCostMicros: '1200',
  meteredInfrastructureCostMicros: '300',
  meteredInternalCostMicros: '1500',
  usageEventIds: ['usage-event-semantic-smoke'],
  internalCostRecordIds: ['cost-record-semantic-smoke'],
  productionCostAuthoritySatisfied: true,
  actualInternalCostFinal: false as const,
  customerPriceCalculated: false as const,
  customerCreditsMutated: false as const,
  serviceFeeIncluded: false as const,
}

const context: QwenLongFormSemanticChunkContext = {
  schemaVersion: QWEN_LONG_FORM_SEMANTIC_CHUNK_CONTEXT_VERSION,
  workspaceId: 'workspace-semantic-smoke',
  editReferenceId: 'reference-semantic-smoke',
  studySessionId: 'study-semantic-smoke',
  runId: 'run-semantic-smoke',
  workItemId: 'work-semantic-smoke',
  chunkId: 'chunk-semantic-smoke',
  privateMediaArtifactId: 'private-media-semantic-smoke',
  mediaChecksumSha256: digest('media'),
  planDigestSha256: digest('plan'),
  sourceCoverageStartSeconds: 0,
  sourceCoverageEndSeconds: 120,
  sourceHasAudio: true,
  semanticWindowPlanDigestSha256: digest('window-plan'),
  semanticWindowCount: 2,
  inputOutputDigestsSha256: dependencyDigests,
  specialistAuthorities: EDIT_REFERENCE_LONG_FORM_SEMANTIC_SPECIALIST_IDS.map((specialistId, index) => ({
    specialistId,
    status: 'analyzed' as const,
    runtimeSource: 'verified_live' as const,
    semanticResultDigestSha256: digest(`specialist-${specialistId}`),
    evidenceOutputDigestsSha256: [dependencyDigests[index % dependencyDigests.length] as string],
    summary: `Bounded ${specialistId} evidence summary.`,
    confidence: 0.9,
  })),
  boundaries: {
    specialistOutputsAreUntrustedSourceData: true,
    rawReferenceMediaAllowed: false,
    rawTranscriptAllowed: false,
    rawOcrTextAllowed: false,
    hiddenChainOfThoughtPersistenceAllowed: false,
    exactReferenceWordingTransferAllowed: false,
    exactReferenceSequenceTransferAllowed: false,
    exactReferenceTimingTransferAllowed: false,
    exactReferenceLayoutTransferAllowed: false,
    exactReferenceAudioTransferAllowed: false,
    referenceIdentityTransferAllowed: false,
    copyrightedAssetTransferAllowed: false,
    executableTargetInstructionAllowed: false,
    targetAdaptationRequired: true,
    targetEvidenceRequired: true,
    userApprovalRequired: true,
  },
}

const requestDigestSha256 = hashEditReferenceLongFormSemanticReasoningRequest({ context, usage })

function authorization(routeId: EditReferenceReasoningRouteId): EditReferenceReasoningRouteAuthorization {
  const route = routeId === 'kimi_k3_primary'
    ? {
        routeRole: 'primary' as const,
        routePriority: 1 as const,
        provider: 'moonshot_ai' as const,
        exactProviderModelId: 'kimi-k3' as const,
        providerBoundary: 'kimi_k3_provider_boundary' as const,
        previousRouteId: null,
        previousAttemptTerminal: false,
        fallbackTrigger: null,
      }
    : routeId === 'qwen_3_7_fallback'
      ? {
          routeRole: 'fallback' as const,
          routePriority: 2 as const,
          provider: 'alibaba_cloud_model_studio' as const,
          exactProviderModelId: 'qwen3.7-max-2026-06-08' as const,
          providerBoundary: 'qwen_3_7_provider_boundary' as const,
          previousRouteId: 'kimi_k3_primary' as const,
          previousAttemptTerminal: true,
          fallbackTrigger: 'provider_timeout' as const,
        }
      : {
          routeRole: 'fallback' as const,
          routePriority: 3 as const,
          provider: 'deepseek' as const,
          exactProviderModelId: 'deepseek-v4-pro' as const,
          providerBoundary: 'deepseek_v4_pro_tool_code_boundary' as const,
          previousRouteId: 'qwen_3_7_fallback' as const,
          previousAttemptTerminal: true,
          fallbackTrigger: 'deterministic_quality_validation_failed' as const,
        }
  const unsigned = {
    schemaVersion: EDIT_REFERENCE_REASONING_ROUTE_AUTHORIZATION_VERSION,
    sourceAuthority: 'shared_backend_reasoning_route' as const,
    canonicalRouteContractVersion: REEDITPRO_SHARED_REASONING_ROUTE_CONTRACT_VERSION,
    lane: 'long_form_semantic_synthesis' as const,
    reasoningRunId: 'reasoning-run-semantic-smoke',
    attemptId: `attempt-${routeId}`,
    routeId,
    ...route,
    requestDigestSha256,
    approvedUsageEstimateId: usage.approvedUsageEstimateId,
    internalCostBudgetId: usage.internalCostBudgetId,
    immutableRateCardSnapshotId: usage.rateCardSnapshotId,
    maximumAuthorizedInternalCostMicros: usage.maximumAuthorizedInternalCostMicros,
    idempotencyKeyDigestSha256: digest(`idempotency-${routeId}`),
    authorizedAt: createdAt,
    providerCallAuthorized: true as const,
    qwenVisualSpecialistSubstituted: false as const,
    customerPriceCalculated: false as const,
    customerCreditsMutated: false as const,
    serviceFeeIncluded: false as const,
  }
  return {
    ...unsigned,
    authorizationDigestSha256: hashEditReferenceReasoningRouteAuthorization(unsigned),
  }
}

function routedProvider(routeId: EditReferenceReasoningRouteId): EditReferenceLongFormSemanticReasoningProvider {
  const route = authorization(routeId)
  return {
    executionMode: 'live_provider',
    routeId,
    providerBoundary: route.providerBoundary,
    exactProviderModelId: route.exactProviderModelId,
    async analyze() {
      throw new Error('The route-resolution smoke must not call a provider.')
    },
  }
}

let resolverCalls = 0
const kimi = await resolveEditReferenceLongFormSemanticReasoningRoute({
  context,
  usage,
  authorization: authorization('kimi_k3_primary'),
  providerResolver: async (route) => {
    resolverCalls += 1
    return routedProvider(route.routeId)
  },
})
assert.equal(kimi.authorization.routeId, 'kimi_k3_primary')
assert.equal(kimi.provider.exactProviderModelId, 'kimi-k3')
assert.equal(kimi.qwenCompatibilityProviderUsed, false)
assert.equal(kimi.providerCallMade, false)
assert.equal(resolverCalls, 1)

const qwenProviderCalls = { count: 0 }
const qwenCompatibilityProvider: QwenLongFormSemanticChunkProvider = {
  executionMode: 'live_provider',
  async analyze() {
    qwenProviderCalls.count += 1
    return {
      status: 'blocked',
      findings: [],
      execution: {
        structuredEvidenceRead: true,
        providerCallMade: false,
        modelCallMade: false,
        workerJobCreated: false,
        remoteMutationMade: false,
      },
      blockers: ['smoke_no_call'],
    }
  },
}

await assert.rejects(() => resolveEditReferenceLongFormSemanticReasoningRoute({
  context,
  usage,
  authorization: authorization('kimi_k3_primary'),
  providerResolver: undefined,
  qwenFallbackProvider: qwenCompatibilityProvider,
}), /provider does not match|authorized reasoning route/)
assert.equal(qwenProviderCalls.count, 0)

const qwen = await resolveEditReferenceLongFormSemanticReasoningRoute({
  context,
  usage,
  authorization: authorization('qwen_3_7_fallback'),
  providerResolver: undefined,
  qwenFallbackProvider: qwenCompatibilityProvider,
})
assert.equal(qwen.authorization.routeId, 'qwen_3_7_fallback')
assert.equal(qwen.qwenCompatibilityProviderUsed, true)
assert.equal(qwenProviderCalls.count, 0)

const deepseek = await resolveEditReferenceLongFormSemanticReasoningRoute({
  context,
  usage,
  authorization: authorization('deepseek_v4_pro_fallback'),
  providerResolver: async (route) => routedProvider(route.routeId),
})
assert.equal(deepseek.authorization.routeId, 'deepseek_v4_pro_fallback')
assert.equal(deepseek.provider.exactProviderModelId, 'deepseek-v4-pro')

await assert.rejects(() => resolveEditReferenceLongFormSemanticReasoningRoute({
  context,
  usage,
  authorization: undefined,
  providerResolver: async () => routedProvider('kimi_k3_primary'),
}), /shared reasoning-route authority/)

const invalidFallback = {
  ...authorization('qwen_3_7_fallback'),
  previousAttemptTerminal: false,
}
await assert.rejects(() => resolveEditReferenceLongFormSemanticReasoningRoute({
  context,
  usage,
  authorization: invalidFallback,
  providerResolver: async () => routedProvider('qwen_3_7_fallback'),
}), /shared reasoning-route authority/)

await assert.rejects(() => resolveEditReferenceLongFormSemanticReasoningRoute({
  context,
  usage,
  authorization: authorization('kimi_k3_primary'),
  providerResolver: async () => routedProvider('qwen_3_7_fallback'),
}), /provider does not match/)

const kimiAuthorization = authorization('kimi_k3_primary')
const liveOutput = createEditReferenceLongFormStudyWorkOutput({
  runId: context.runId,
  planId: 'plan-semantic-smoke',
  planDigestSha256: context.planDigestSha256,
  workItemId: context.workItemId,
  stageId: 'semantic_chunk_synthesis',
  chunkId: context.chunkId,
  privateMediaArtifactId: context.privateMediaArtifactId,
  mediaChecksumSha256: context.mediaChecksumSha256,
  sourceCoverageStartSeconds: context.sourceCoverageStartSeconds,
  sourceCoverageEndSeconds: context.sourceCoverageEndSeconds,
  toolIds: ['kimi_k3'],
  artifacts: [],
  result: {
    kind: 'semantic_chunk_synthesis',
    inputOutputDigestsSha256: dependencyDigests,
    semanticWindowPlanDigestSha256: context.semanticWindowPlanDigestSha256,
    specialistCoverage: EDIT_REFERENCE_LONG_FORM_SEMANTIC_SPECIALIST_IDS.map((specialistId, index) => ({
      specialistId,
      status: 'analyzed',
      confidence: 0.9,
      runtimeSource: 'verified_live',
      semanticResultDigestSha256: digest(`specialist-output-${specialistId}`),
      evidenceOutputDigestsSha256: [dependencyDigests[index % dependencyDigests.length] as string],
    })),
    synthesisRuntime: {
      runtimeSource: 'verified_live',
      adapterId: 'kimi-long-form-semantic-adapter',
      adapterVersion: 'v1',
      providerId: 'moonshot-ai',
      modelId: 'kimi-k3',
      modelRevision: '2026-07-20',
      modelAggregateSha256: digest('kimi-model'),
      modelRoutingPolicyVersion: REEDITPRO_SHARED_REASONING_ROUTE_CONTRACT_VERSION,
      synthesisInstructionDigestSha256: digest('synthesis-instruction'),
      reasoningRouteId: 'kimi_k3_primary',
      reasoningAttemptId: kimiAuthorization.attemptId,
      reasoningRouteAuthorizationDigestSha256: kimiAuthorization.authorizationDigestSha256,
      providerCallMade: true,
      modelCallMade: true,
    },
    findings: [{
      findingId: 'finding-semantic-smoke',
      category: 'story_structure',
      summary: 'Generalized story structure evidence remains adapted to the target rather than copied.',
      confidence: 0.9,
      evidenceOutputDigestsSha256: [dependencyDigests[0] as string],
      transferable: true,
      targetAdaptationRequired: true,
      exactCopyInstructionCreated: false,
    }],
    chunkSummary: 'Kimi-primary semantic synthesis is bound to exact route, cost, and evidence authority.',
    fullChunkEvidenceReconciled: true,
    rawProviderPayloadPersisted: false,
    rawTranscriptPersistedInWorkOutput: false,
    referenceMediaCopiedToTarget: false,
    executableTargetInstructionsCreated: false,
  },
  runtimeSource: 'verified_live',
  completionAuthority: 'authoritative',
  usage,
  originalRemainsImmutable: true,
  rawProcessOutputPersisted: false,
  signedUrlPersisted: false,
  localFilePathPersisted: false,
  providerCallMade: true,
  customerPriceCalculated: false,
  customerCreditsMutated: false,
  remoteMutationMade: false,
  createdAt,
})
assert.deepEqual(liveOutput.toolIds, ['kimi_k3'])
if (liveOutput.result.kind !== 'semantic_chunk_synthesis') {
  throw new Error('Semantic reasoning-route smoke created the wrong output kind.')
}

const controlledOutput = createEditReferenceLongFormStudyWorkOutput({
  runId: liveOutput.runId,
  planId: liveOutput.planId,
  planDigestSha256: liveOutput.planDigestSha256,
  workItemId: liveOutput.workItemId,
  stageId: liveOutput.stageId,
  chunkId: liveOutput.chunkId,
  privateMediaArtifactId: liveOutput.privateMediaArtifactId,
  mediaChecksumSha256: liveOutput.mediaChecksumSha256,
  sourceCoverageStartSeconds: liveOutput.sourceCoverageStartSeconds,
  sourceCoverageEndSeconds: liveOutput.sourceCoverageEndSeconds,
  toolIds: ['controlled_specialist_fixture'],
  artifacts: [],
  result: {
    ...liveOutput.result,
    specialistCoverage: liveOutput.result.specialistCoverage.map((specialist) => ({
      ...specialist,
      runtimeSource: 'verified_local' as const,
    })),
    synthesisRuntime: {
      runtimeSource: 'verified_mock',
      adapterId: 'controlled_long_form_semantic_fixture',
      adapterVersion: 'v1',
      providerId: null,
      modelId: 'controlled_fixture',
      modelRevision: 'v1',
      modelAggregateSha256: digest('controlled-model'),
      modelRoutingPolicyVersion: 'controlled_test_only',
      synthesisInstructionDigestSha256: digest('controlled-instruction'),
      reasoningRouteId: null,
      reasoningAttemptId: null,
      reasoningRouteAuthorizationDigestSha256: null,
      providerCallMade: false,
      modelCallMade: false,
    },
  },
  runtimeSource: 'verified_mock',
  completionAuthority: 'controlled_mock',
  usage: createUnmeteredEditReferenceLongFormStudyUsage({
    mode: 'controlled_test_unmetered',
    observedWallClockMs: 1,
    inputMediaSeconds: 120,
    outputBytes: 0,
  }),
  providerCallMade: false,
  customerPriceCalculated: false,
  customerCreditsMutated: false,
  remoteMutationMade: false,
  originalRemainsImmutable: true,
  rawProcessOutputPersisted: false,
  signedUrlPersisted: false,
  localFilePathPersisted: false,
  createdAt,
})

const legacyControlledOutput = structuredClone(controlledOutput) as unknown as Record<string, unknown>
const legacyControlledResult = legacyControlledOutput.result as Record<string, unknown>
const legacyControlledRuntime = legacyControlledResult.synthesisRuntime as Record<string, unknown>
delete legacyControlledRuntime.reasoningRouteId
delete legacyControlledRuntime.reasoningAttemptId
delete legacyControlledRuntime.reasoningRouteAuthorizationDigestSha256
const legacyControlledUnsigned = { ...legacyControlledOutput }
delete legacyControlledUnsigned.outputDigestSha256
legacyControlledOutput.outputDigestSha256 = digest(stableStringify(legacyControlledUnsigned))
validateEditReferenceLongFormStudyWorkOutput(
  legacyControlledOutput as unknown as typeof controlledOutput,
)

const legacyLiveOutput = structuredClone(liveOutput) as unknown as Record<string, unknown>
const legacyLiveResult = legacyLiveOutput.result as Record<string, unknown>
const legacyLiveRuntime = legacyLiveResult.synthesisRuntime as Record<string, unknown>
delete legacyLiveRuntime.reasoningRouteId
delete legacyLiveRuntime.reasoningAttemptId
delete legacyLiveRuntime.reasoningRouteAuthorizationDigestSha256
const legacyLiveUnsigned = { ...legacyLiveOutput }
delete legacyLiveUnsigned.outputDigestSha256
legacyLiveOutput.outputDigestSha256 = digest(stableStringify(legacyLiveUnsigned))
assert.throws(
  () => validateEditReferenceLongFormStudyWorkOutput(
    legacyLiveOutput as unknown as typeof liveOutput,
  ),
  /tool attribution|runtime provenance/,
)

assert.notEqual(
  requestDigestSha256,
  hashEditReferenceLongFormSemanticReasoningRequest({
    context: { ...context, workItemId: 'work-semantic-smoke-changed' },
    usage,
  }),
)

console.log(JSON.stringify({
  status: 'passed',
  smoke: 'edit-reference-long-form-semantic-reasoning-route',
  kimiPrimaryRequired: true,
  qwenFallbackRequiresTerminalKimiFailure: true,
  deepseekFinalFallbackRequiresTerminalQwenFailure: true,
  qwenVisualSpecialistSubstituted: false,
  providerCallMadeDuringResolution: false,
  liveWorkOutputRouteBound: true,
  legacyControlledResumePreserved: true,
  legacyLiveRouteAuthorityRejected: true,
  customerPriceCalculated: false,
  customerCreditsMutated: false,
  serviceFeeIncluded: false,
  productionReady: false,
}))
