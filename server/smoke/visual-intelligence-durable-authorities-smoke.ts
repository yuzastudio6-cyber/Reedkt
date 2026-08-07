import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type { Storage } from '@google-cloud/storage'

import {
  type VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createVisualIntelligenceAccountEffectiveCostOwner,
  createControlledVisualIntelligenceAccountEffectiveRateAuthority,
  rateAuthorityRef,
} from '../visual-intelligence/visual-intelligence-account-effective-cost-owner'
import {
  createProfessionalHighVisualIntelligenceQualityPolicy,
  createVisualIntelligenceEvidenceRef,
  createVisualIntelligenceReport,
  createVisualIntelligenceRequest,
  createVisualIntelligenceSpatialEvidence,
  visualIntelligenceCanonicalJson,
  visualIntelligenceDigest,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  createVisualIntelligenceGcsConcurrencyPort,
} from '../visual-intelligence/visual-intelligence-gcs-concurrency-port'
import {
  createVisualIntelligenceDurableLifecycleStore,
  isVisualIntelligenceDurableLifecycleStore,
} from '../visual-intelligence/visual-intelligence-gcs-lifecycle-store'
import {
  VISUAL_INTELLIGENCE_DETERMINISTIC_EVIDENCE_VERSION,
  VISUAL_INTELLIGENCE_PROMPT_VERSION,
  VISUAL_INTELLIGENCE_RESPONSE_SCHEMA_VERSION,
} from '../visual-intelligence/visual-intelligence-profile-registry'
import {
  assertAdmittedVisualIntelligenceRuntimeRelease,
  createControlledVisualIntelligenceRuntimeRelease,
  visualIntelligenceRuntimeReleaseRef,
} from '../visual-intelligence/visual-intelligence-runtime-release'

const rawSha = (value: string) => createHash('sha256')
  .update(value, 'utf8').digest('hex')
const ref = (id: string, value: unknown = { id }): VisualIntelligenceEvidenceRef =>
  createVisualIntelligenceEvidenceRef(id, value)
const nowIso = '2026-08-02T12:00:00.000Z'
const expiresIso = '2026-08-02T23:59:59.000Z'

class MemoryObjectPort implements CanonicalCreateOnlyJsonObjectPort {
  readonly values = new Map<string, Buffer>()

  async createOnly(input: {
    objectPath: string
    body: Buffer
    contentSha256: string
  }): Promise<'created' | 'already_exists'> {
    assert.equal(rawSha(input.body.toString('utf8')), input.contentSha256)
    if (this.values.has(input.objectPath)) return 'already_exists'
    this.values.set(input.objectPath, Buffer.from(input.body))
    return 'created'
  }

  async readExact(objectPath: string): Promise<Buffer | null> {
    const value = this.values.get(objectPath)
    return value ? Buffer.from(value) : null
  }
}

const objectPort = new MemoryObjectPort()
const pricingScopeRef = ref('billing-account-pricing-scope')
const pricingObservationRef = ref('gemini-effective-price-observation')
const rate = createControlledVisualIntelligenceAccountEffectiveRateAuthority({
  schemaVersion: 'visual-intelligence-account-effective-rate-authority-v2',
  evidenceClass: 'billing_account_effective_pricing_api_reread',
  billingAccountPricingScopeRef: pricingScopeRef,
  pricingReaderConfigurationRef: ref('gemini-price-reader-configuration'),
  pricingApiObservationRef: pricingObservationRef,
  exactModelBillingSkuCompatibilityQualificationRef:
    ref('gemini-3-1-pro-billing-sku-qualification'),
  exactModelId: 'gemini-3.1-pro-preview',
  providerServiceId: 'services/C7E2-9256-1C43',
  billingSkuFamily: 'gemini_3_0_pro_shared_billing_family',
  billingSkuCatalogVersion:
    'weeditpro-gemini-3_1-pro-standard-global-sku-catalog-v1',
  throughputClass: 'standard',
  contextThresholdInputTokens: 200_000,
  wholeRequestLongContextRatesRequired: true,
  currency: 'USD',
  rateUnit: 'usd_nanos_per_million_tokens',
  accountEffectiveSkuPriceTerms: controlledRateTerms(),
  priceReadStartedAtIso: '2026-08-02T00:00:00.000Z',
  priceReadFinishedAtIso: '2026-08-02T00:00:01.000Z',
  effectiveAtIso: '2026-08-02T00:00:01.000Z',
  expiresAtIso: expiresIso,
  exactSkuMetadataAndAccountPriceReread: true,
  billingAccountEffectiveRateUsed: true,
  publicListPriceUsed: false,
  customerPriceOrServiceFeeAuthorityGranted: false,
  walletMutationAuthorityGranted: false,
})
const currentRateRef = rateAuthorityRef(rate)
const costOwner = createVisualIntelligenceAccountEffectiveCostOwner({
  rateAuthorityRef: currentRateRef,
  rateReadPort: { async readExact() { return rate } },
  objectPort,
  now: () => new Date(nowIso),
})
const preflight = await costOwner.createPreflight({
  requestId: 'visual-request-1',
  maximumInputTokenCount: 1_000_000,
  maximumOutputAndThinkingTokenCount: 100_000,
  estimatedInputTokenCount: 100_000,
  estimatedOutputAndThinkingTokenCount: 10_000,
})
assert.equal(preflight.maximumAuthorizedCostMicros, 2_450_000)
assert.equal(preflight.estimatedMaximumCostMicros, 130_000)
assert.equal(preflight.serviceFeeIncluded, false)
assert.equal(preflight.publicListPriceUsedAsSettlementAuthority, false)

const usage = {
  requestId: 'visual-request-1',
  idempotencyKey: 'visual-idempotency-1',
  exactModelId: 'gemini-3.1-pro-preview' as const,
  promptTokenCount: 100_000,
  candidateTokenCount: 5_000,
  thinkingTokenCount: 5_000,
  cachedTokenCount: 20_000,
  totalTokenCount: 110_000,
  maximumAuthorizedCostMicros: preflight.maximumAuthorizedCostMicros,
  accountEffectiveRateAuthorityRef: currentRateRef,
}
const firstSettlement = await costOwner.settleAccountEffectiveUsage(usage)
const replayedSettlement = await costOwner.settleAccountEffectiveUsage(usage)
assert.equal(firstSettlement.settledCostMicros, 115_000)
assert.deepEqual(replayedSettlement.costEvidenceRef,
  firstSettlement.costEvidenceRef)
assert.equal(firstSettlement.duplicateSettlementPerformed, false)
assert.equal(firstSettlement.billingAccountEffectiveRateUsed, true)
assert.equal(firstSettlement.publicListPriceUsed, false)
const longContextSettlement = await costOwner.settleAccountEffectiveUsage({
  ...usage,
  requestId: 'visual-request-long-context',
  idempotencyKey: 'visual-idempotency-long-context',
  promptTokenCount: 200_001,
  candidateTokenCount: 5_000,
  thinkingTokenCount: 5_000,
  cachedTokenCount: 20_000,
  totalTokenCount: 210_001,
})
assert.equal(longContextSettlement.settledCostMicros, 415_002)
await assert.rejects(() => costOwner.settleAccountEffectiveUsage({
  ...usage,
  candidateTokenCount: 5_001,
  totalTokenCount: 110_001,
}))

function controlledRateTerms() {
  const terms = [
    ['standard_uncached_input', 'standard_le_200k', 'uncached_input',
      'EAC4-305F-1249', 'Gemini 3.0 Pro Text Input - Predictions',
      1_000_000_000],
    ['standard_cached_input', 'standard_le_200k', 'cached_input',
      '8308-9CED-8950', 'Gemini 3.0 Pro Text Input Caching', 250_000_000],
    ['standard_output_and_thinking', 'standard_le_200k',
      'output_and_thinking', '2737-2D33-D986',
      'Gemini 3.0 Pro Text Output - Predictions', 3_000_000_000],
    ['long_uncached_input', 'long_gt_200k', 'uncached_input',
      'E0A5-FB5D-79F4', 'Gemini 3.0 Pro Text Input (Long) - Predictions',
      2_000_000_000],
    ['long_cached_input', 'long_gt_200k', 'cached_input',
      '8A47-3936-DC92', 'Gemini 3.0 Pro Text Input Caching (Long)',
      500_000_000],
    ['long_output_and_thinking', 'long_gt_200k', 'output_and_thinking',
      '3CE8-93F8-3C8F', 'Gemini 3.0 Pro Text Output (Long) - Predictions',
      4_500_000_000],
  ] as const
  return terms.map(([rateClass, contextClass, tokenClass, skuId,
    skuDisplayName, contractPriceUsdNanosPerMillionTokens]) => ({
    rateClass,
    contextClass,
    tokenClass,
    cloudServiceId: 'services/C7E2-9256-1C43' as const,
    skuId,
    skuDisplayName,
    consumptionModel: 'consumptionModels/7754-699E-0EBF' as const,
    apiUnit: 'count' as const,
    apiUnitQuantity: '1000000' as const,
    contractPriceUsdNanosPerMillionTokens,
    skuMetadataRef: ref(`sku-metadata-${skuId}`),
    billingAccountPriceRef: ref(`account-price-${skuId}`),
    accountEffectiveContractPriceUsed: true as const,
    publicListPriceUsed: false as const,
  }))
}

const runtimeRelease = createControlledVisualIntelligenceRuntimeRelease({
  schemaVersion: 'visual-intelligence-runtime-release-v1',
  evidenceClass:
    'canonical_immutable_visual_intelligence_gemini_pro_high_release_reread',
  projectId: 'reeditpro',
  vertexLocation: 'global',
  lifecycleBucketName: 'reeditpro-private-lifecycle',
  runtimeReleaseIdentityRef: ref('visual-intelligence-runtime-release'),
  lifecycleRepositoryReleaseRef: ref('visual-intelligence-lifecycle-release'),
  concurrencyOwnerReleaseRef: ref('visual-intelligence-concurrency-release'),
  sourceEvidencePreparationReleaseRef: ref('visual-intelligence-evidence-release'),
  providerModelAccessQualificationRef: ref('gemini-model-access-qualification'),
  providerTransportQualificationRef: ref('gemini-transport-qualification'),
  providerPrivacyRetentionReviewRef: ref('gemini-privacy-review'),
  promptInjectionSafetyQualificationRef: ref('gemini-injection-safety'),
  structuredOutputQualificationRef: ref('gemini-structured-output'),
  professionalHighQualityBenchmarkRef: ref('gemini-professional-high-benchmark'),
  accountEffectivePricingAuthorityRef: currentRateRef,
  accountEffectiveCostSettlementOwnerRef: ref('gemini-cost-owner-release'),
  capabilityId: 'visual_intelligence',
  providerAdapterId: 'vertex_gemini_pro',
  providerId: 'google_vertex_ai',
  exactModelId: 'gemini-3.1-pro-preview',
  qualityProfile: 'professional_high',
  thinkingLevel: 'high',
  mediaResolution: 'high',
  providerAuthentication: 'vertex_application_default_credentials',
  providerSdkPackage: '@google/genai',
  providerSdkVersion: '2.15.0',
  providerApiVersion: 'v1alpha',
  providerAdapterVersion: 'vertex-gemini-pro-visual-intelligence-adapter-v4',
  profileRegistryVersion: 'visual-intelligence-profile-registry-v2',
  promptVersion: VISUAL_INTELLIGENCE_PROMPT_VERSION,
  responseSchemaVersion: VISUAL_INTELLIGENCE_RESPONSE_SCHEMA_VERSION,
  deterministicEvidenceVersion:
    VISUAL_INTELLIGENCE_DETERMINISTIC_EVIDENCE_VERSION,
  exactModelAccessQualified: true,
  vertexAdcAndServiceAccountIamQualified: true,
  professionalHighThinkingAndMediaResolutionQualified: true,
  completeSourceNativeVideoTransportQualified: true,
  strictStructuredOutputQualified: true,
  promptInjectionSafetyQualified: true,
  privateMediaPrivacyAndRetentionQualified: true,
  lifecycleRepositoryCreateOnlyAndRereadQualified: true,
  durableAttemptConsumptionQualified: true,
  distributedConcurrencyQualified: true,
  deterministicGpuEvidencePreparationQualified: true,
  accountEffectivePricingAuthorityQualified: true,
  accountEffectiveCostSettlementQualified: true,
  authenticatedUserTriggerRequired: true,
  automaticProviderRetryAllowed: false,
  uncertainProviderOutcomeRetryAllowed: false,
  apiKeyAuthenticationAllowed: false,
  providerToolsAllowed: false,
  searchGroundingAllowed: false,
  urlContextAllowed: false,
  codeExecutionAllowed: false,
  flashFallbackAllowed: false,
  cheaperModelFallbackAllowed: false,
  qwenVisualFallbackAllowed: false,
  selfHostedVisualModelFallbackAllowed: false,
  publicListPriceSettlementAllowed: false,
  callerReleaseObservationAccepted: false,
  directTimelineMutationAllowed: false,
  finalQaApprovalGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
})
assert.deepEqual(assertAdmittedVisualIntelligenceRuntimeRelease(runtimeRelease),
  runtimeRelease)
const providerReleaseRef = visualIntelligenceRuntimeReleaseRef(runtimeRelease)
assert.equal(runtimeRelease.qwenVisualFallbackAllowed, false)
assert.equal(runtimeRelease.selfHostedVisualModelFallbackAllowed, false)
assert.throws(() => assertAdmittedVisualIntelligenceRuntimeRelease({
  ...runtimeRelease,
}))

const lifecycleObjectPort = new MemoryObjectPort()
const lifecycleStore = createVisualIntelligenceDurableLifecycleStore({
  objectPort: lifecycleObjectPort,
})
assert.equal(isVisualIntelligenceDurableLifecycleStore(lifecycleStore), true)
const cacheIdentitySha256 = visualIntelligenceDigest({ cache: 1 })
const frameRate = { numerator: 24, denominator: 1 }
const range = { startFrame: 0, endFrameExclusive: 240, frameRate }
const finalizedRef = ref('finalized-source')
const probeRef = ref('source-probe')
const request = createVisualIntelligenceRequest({
  requestId: 'visual-request-1',
  idempotencyKey: 'visual-idempotency-1',
  scope: {
    ownerUserId: 'owner-1',
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    editSessionId: 'edit-1',
    approvedSnapshotId: null,
  },
  operation: 'analyze_media',
  profile: 'source_edit_planning',
  sourceArtifacts: [{
    artifactId: 'source-1',
    mediaKind: 'video',
    contentType: 'video/mp4',
    checksumSha256: rawSha('source-1'),
    byteLength: 1_000_000,
    width: 1920,
    height: 1080,
    durationFrames: 240,
    frameRate,
    finalizedMediaAuthorityRef: finalizedRef,
    immutableStorageObjectAuthorityRef: ref('source-storage'),
    mediaProbeEvidenceRef: probeRef,
    privateArtifact: true,
    exactGenerationRereadRequiredAtDispatch: true,
  }],
  comparisonArtifacts: [],
  requestedRanges: [range],
  requiredEvidenceRefs: [probeRef],
  expectedOutcomeRefs: [],
  outputFrame: null,
  protectedZones: [],
  qualityPolicy: createProfessionalHighVisualIntelligenceQualityPolicy(),
  admission: {
    mode: 'planning_evidence',
    authenticatedPrincipalRef: ref('principal'),
    workspaceAuthorizationRef: ref('workspace-authorization'),
    finalizedSourceAuthorityRefs: [finalizedRef],
    sourceChecksumSetRef: ref('source-checksums'),
    analysisAllowanceRef: ref('analysis-allowance'),
    costPreflight: preflight,
    retentionPolicyRef: ref('retention-policy'),
    privacyPolicyRef: ref('privacy-policy'),
    providerReleaseRef,
    globalKillSwitchOpen: false,
    providerKillSwitchOpen: false,
    reportPersistenceAllowed: true,
    timelineMutationAllowed: false,
    editingWorkerExecutionAllowed: false,
    generationAllowed: false,
    renderAllowed: false,
    exportAllowed: false,
    deliveryAllowed: false,
  },
  callerQuestion: null,
  byteFreeRequest: true,
  callerPromptAccepted: false,
  providerCredentialIncluded: false,
  publicMediaUrlIncluded: false,
  signedUrlIsSourceTruth: false,
  shellCommandIncluded: false,
  providerToolDefinitionIncluded: false,
})
const requestDigestSha256 = request.requestDigestSha256
const attempt = await lifecycleStore.beginCreateOnly({
  requestId: request.requestId,
  idempotencyKey: request.idempotencyKey,
  requestDigestSha256,
  cacheIdentitySha256,
})
assert.equal(attempt.status, 'created')
assert.ok(attempt.status === 'created')
assert.equal((await lifecycleStore.beginCreateOnly({
  requestId: request.requestId,
  idempotencyKey: request.idempotencyKey,
  requestDigestSha256,
  cacheIdentitySha256,
})).status, 'already_in_progress')
await lifecycleStore.markProviderCallStarted({
  attemptRef: attempt.attemptRef,
  dispatchConfigurationDigestSha256: visualIntelligenceDigest({ dispatch: 1 }),
  maximumAttempts: 1,
  attemptOrdinal: 1,
  uncertainProviderOutcomeRetryAllowed: false,
})
const report = createVisualIntelligenceReport({
  reportId: `visual-intelligence-report-${request.requestDigestSha256.slice(7)}`,
  requestRef: createVisualIntelligenceEvidenceRef(request.requestId, request),
  scope: request.scope,
  operation: request.operation,
  profile: request.profile,
  sourceArtifacts: [{
    artifactId: 'source-1',
    checksumSha256: rawSha('source-1'),
    mediaKind: 'video',
    durationFrames: 240,
  }],
  comparisonArtifacts: [],
  coverage: {
    requestedRanges: [range],
    analyzedRanges: [range],
    incompleteRanges: [],
    sceneBoundaryRefs: [ref('scene-boundaries')],
    samplingPolicies: [{
      policyId: 'source-complete',
      policyVersion: 'source-complete-v1',
      mode: 'native_complete_video',
      targetFramesPerSecondNumerator: 2,
      targetFramesPerSecondDenominator: 1,
      sceneAware: true,
      highDetail: true,
      requestedRange: range,
      analyzedRange: range,
      samplingPolicyRef: ref('source-sampling-policy'),
    }],
    targetedFollowupRanges: [],
    completeRequestedRangeCoverage: true,
    everyTimelineFrameInspected: false,
    completeTimePixelInspectionClaimAllowed: false,
  },
  semanticSummary: 'The complete source was semantically inspected.',
  segments: [{
    segmentId: 'segment-1',
    artifactId: 'source-1',
    range,
    sceneId: 'scene-1',
    summary: 'One complete source scene.',
    subjectIds: ['subject-1'],
    objectIds: [],
    actionLabels: ['speaking'],
    visibleTextEvidenceRefs: [],
    transcriptEvidenceRefs: [],
    evidenceRefs: [probeRef],
    confidenceBasisPoints: 9_000,
    uncertainty: null,
    sourcePlanning: {
      sourceFunction: 'dialogue',
      actionIntensity: 'medium',
      editUsability: 'strong',
      cameraStability: 'stable',
      continuity: 'continuous',
    },
  }],
  findings: [],
  evidence: [{
    evidenceId: probeRef.id,
    evidenceRef: probeRef,
    artifactId: 'source-1',
    range: null,
    authority: 'media_probe',
    producingTool: 'ffprobe',
    toolVersion: 'ffprobe-8.0',
    summary: 'Exact source timing and dimensions.',
    privateEvidence: true,
    providerInstructionAccepted: false,
  }],
  deterministicToolExecutions: [{
    tool: 'ffprobe',
    requirement: 'required',
    executionClass: 'l4_gpu_standard',
    releaseRef: ref('ffprobe-release'),
    executionRef: ref('ffprobe-execution'),
    substantiveCpuExecutionUsed: false,
    sourceArtifactChecksumBound: true,
  }],
  expectedOutcomeRefs: [],
  disposition: 'pass',
  reinspectionRequired: false,
  usage: {
    promptTokenCount: usage.promptTokenCount,
    candidateTokenCount: usage.candidateTokenCount,
    thinkingTokenCount: usage.thinkingTokenCount,
    cachedTokenCount: usage.cachedTokenCount,
    totalTokenCount: usage.totalTokenCount,
    providerResponseId: 'gemini-response-1',
    providerModelVersion: 'gemini-3.1-pro-preview',
    estimatedCostMicros: firstSettlement.estimatedCostMicros,
    settledCostMicros: firstSettlement.settledCostMicros,
    costEvidenceRef: firstSettlement.costEvidenceRef,
    billingAccountEffectiveRateUsed: true,
    publicListPriceUsed: false,
    duplicateSettlementPerformed: false,
    replayedFromCache: false,
    providerCallMade: true,
  },
  provenance: {
    providerAdapterId: 'vertex_gemini_pro',
    providerId: 'google_vertex_ai',
    exactModelId: 'gemini-3.1-pro-preview',
    thinkingLevel: 'high',
    mediaResolution: 'high',
    promptVersion: VISUAL_INTELLIGENCE_PROMPT_VERSION,
    responseSchemaVersion: VISUAL_INTELLIGENCE_RESPONSE_SCHEMA_VERSION,
    deterministicEvidenceVersion:
      VISUAL_INTELLIGENCE_DETERMINISTIC_EVIDENCE_VERSION,
    transcriptVersion: null,
    ocrVersion: null,
    cacheIdentitySha256,
    requestDigestSha256: request.requestDigestSha256,
    admissionRef: ref('admission'),
    providerReleaseRef,
    applicationDefaultCredentialsUsed: true,
    providerToolsUsed: false,
    searchGroundingUsed: false,
    urlContextUsed: false,
    codeExecutionUsed: false,
    rawProviderPayloadPersisted: false,
  },
  blockers: [],
  warnings: [],
  immutableReport: true,
  planningMayConsumeValidatedEvidence: true,
  directTimelineMutationAllowed: false,
  renderPerformedByVisualIntelligence: false,
  exportAuthorized: false,
  deliveryAuthorized: false,
})
const persisted = await lifecycleStore.persistImmutable({
  cacheIdentitySha256,
  report,
})
const spatialEvidence = createVisualIntelligenceSpatialEvidence({
  spatialEvidenceId: 'visual-intelligence-spatial-source-1',
  requestRef: report.requestRef,
  reportRef: persisted.reportRef,
  scope: report.scope,
  operation: report.operation,
  profile: report.profile,
  outputFrame: null,
  sourceArtifacts: [{
    artifactId: 'source-1',
    checksumSha256: rawSha('source-1'),
    width: 1920,
    height: 1080,
    durationFrames: 240,
    frameRate,
  }],
  comparisonArtifacts: [],
  observations: [],
  actualVisualInferenceObserved: true,
  exactCanonicalPrivateMediaSuppliedToProvider: true,
  providerVisualPreprocessingExpected: true,
  providerPreprocessingIsExactFrameInspection: false,
  everyTimelineFrameInspected: false,
  completeTimePixelInspectionClaimAllowed: false,
  immutableSpatialEvidence: true,
  directTimelineMutationAllowed: false,
  renderPerformedByVisualIntelligence: false,
  qaApprovalGranted: false,
  assetMutationAllowed: false,
  billingMutationAllowed: false,
  exportAuthorized: false,
  publicDeliveryAuthorized: false,
  productionAuthorized: false,
})
const spatialPersisted = await lifecycleStore.persistSpatialEvidenceImmutable({
  reportRef: persisted.reportRef,
  spatialEvidence,
})
assert.equal(spatialPersisted.exactRereadVerified, true)
await lifecycleStore.markCompleted({
  attemptRef: attempt.attemptRef,
  reportRef: persisted.reportRef,
  providerCallOutcome: 'executed',
  accountEffectiveCostSettled: true,
})
const restartedStore = createVisualIntelligenceDurableLifecycleStore({
  objectPort: lifecycleObjectPort,
})
assert.deepEqual(
  await restartedStore.readAcceptedByCacheIdentity({
    cacheIdentitySha256,
    scope: request.scope,
  }),
  report,
)
assert.deepEqual(
  await restartedStore.readAcceptedSpatialEvidenceByReportRef(
    persisted.reportRef,
  ),
  spatialEvidence,
)
assert.equal((await restartedStore.beginCreateOnly({
  requestId: 'visual-request-1',
  idempotencyKey: 'visual-idempotency-1',
  requestDigestSha256,
  cacheIdentitySha256,
})).status, 'already_completed')
assert.equal((await restartedStore.beginCreateOnly({
  requestId: 'visual-request-1',
  idempotencyKey: 'changed-idempotency',
  requestDigestSha256: visualIntelligenceDigest({ changed: true }),
  cacheIdentitySha256,
})).status, 'conflict')

interface MemoryGcsObject {
  body: Buffer
  generation: string
  etag: string
  contentType: string
}

class MemoryGcsFile {
  readonly bucket: MemoryGcsBucket
  readonly name: string
  readonly generation?: string

  constructor(
    bucket: MemoryGcsBucket,
    name: string,
    generation?: string,
  ) {
    this.bucket = bucket
    this.name = name
    this.generation = generation
  }

  async save(body: Buffer, options: { contentType?: string }): Promise<void> {
    if (this.bucket.objects.has(this.name)) throw cloudError(412)
    const generation = String(this.bucket.nextGeneration++)
    this.bucket.objects.set(this.name, {
      body: Buffer.from(body),
      generation,
      etag: `etag-${generation}`,
      contentType: options.contentType ?? 'application/octet-stream',
    })
  }

  async getMetadata(): Promise<[Record<string, unknown>]> {
    const value = this.requireObject()
    return [{
      generation: value.generation,
      etag: value.etag,
      size: String(value.body.byteLength),
      contentType: value.contentType,
    }]
  }

  async download(): Promise<[Buffer]> {
    return [Buffer.from(this.requireObject().body)]
  }

  async delete(options: { ifGenerationMatch?: string | number } = {}):
  Promise<[Record<string, never>]> {
    const value = this.requireObject()
    if (options.ifGenerationMatch !== undefined
      && String(options.ifGenerationMatch) !== value.generation) {
      throw cloudError(412)
    }
    this.bucket.objects.delete(this.name)
    return [{}]
  }

  private requireObject(): MemoryGcsObject {
    const value = this.bucket.objects.get(this.name)
    if (!value || (this.generation && this.generation !== value.generation)) {
      throw cloudError(404)
    }
    return value
  }
}

class MemoryGcsBucket {
  readonly objects = new Map<string, MemoryGcsObject>()
  nextGeneration = 1

  file(name: string, options?: { generation?: string }): MemoryGcsFile {
    return new MemoryGcsFile(this, name, options?.generation)
  }
}

class MemoryStorage {
  readonly memoryBucket = new MemoryGcsBucket()
  bucket(): MemoryGcsBucket { return this.memoryBucket }
}

const memoryStorage = new MemoryStorage()
let clock = 1_000_000
const concurrency = createVisualIntelligenceGcsConcurrencyPort({
  projectId: 'reeditpro',
  bucketName: 'reeditpro-private-lifecycle',
  storage: memoryStorage as unknown as Storage,
  leaseTtlMs: 60_000,
  now: () => clock,
})
const leaseOne = await concurrency.acquire({
  workspaceId: 'workspace-1',
  projectId: 'project-1',
  requestId: 'request-1',
  maximumConcurrentProviderCalls: 1,
})
assert.equal(leaseOne.status, 'acquired')
assert.equal((await concurrency.acquire({
  workspaceId: 'workspace-1',
  projectId: 'project-1',
  requestId: 'request-2',
  maximumConcurrentProviderCalls: 1,
})).status, 'capacity_exhausted')
assert.ok(leaseOne.status === 'acquired')
await concurrency.release(leaseOne.leaseRef)
assert.equal((await concurrency.acquire({
  workspaceId: 'workspace-1',
  projectId: 'project-1',
  requestId: 'request-2',
  maximumConcurrentProviderCalls: 1,
})).status, 'acquired')

const crashedStorage = new MemoryStorage()
const crashed = createVisualIntelligenceGcsConcurrencyPort({
  projectId: 'reeditpro',
  bucketName: 'reeditpro-private-lifecycle',
  storage: crashedStorage as unknown as Storage,
  leaseTtlMs: 60_000,
  now: () => clock,
})
assert.equal((await crashed.acquire({
  workspaceId: 'workspace-2',
  projectId: 'project-2',
  requestId: 'request-crashed',
  maximumConcurrentProviderCalls: 1,
})).status, 'acquired')
const restarted = createVisualIntelligenceGcsConcurrencyPort({
  projectId: 'reeditpro',
  bucketName: 'reeditpro-private-lifecycle',
  storage: crashedStorage as unknown as Storage,
  leaseTtlMs: 60_000,
  now: () => clock,
})
assert.equal((await restarted.acquire({
  workspaceId: 'workspace-2',
  projectId: 'project-2',
  requestId: 'request-before-expiry',
  maximumConcurrentProviderCalls: 1,
})).status, 'capacity_exhausted')
clock += 60_001
assert.equal((await restarted.acquire({
  workspaceId: 'workspace-2',
  projectId: 'project-2',
  requestId: 'request-after-expiry',
  maximumConcurrentProviderCalls: 1,
})).status, 'acquired')

function cloudError(code: number): Error & { code: number } {
  return Object.assign(new Error(`cloud-${code}`), { code })
}

console.log(JSON.stringify({
  status: 'visual_intelligence_durable_authorities_smoke_passed',
  exactModelId: runtimeRelease.exactModelId,
  providerAuthentication: runtimeRelease.providerAuthentication,
  accountEffectiveRateUsed: true,
  publicListPriceUsed: false,
  settlementReplayDidNotDuplicateCharge: true,
  lifecycleRestartReplayVerified: true,
  concurrencyRestartExpiryRecoveryVerified: true,
  qwenVisualFallbackAllowed: runtimeRelease.qwenVisualFallbackAllowed,
  selfHostedVisualModelFallbackAllowed:
    runtimeRelease.selfHostedVisualModelFallbackAllowed,
  canonicalReportDigest: report.reportDigestSha256,
  canonicalReleaseDigest: runtimeRelease.releaseDigestSha256,
  storedRecordCount: lifecycleObjectPort.values.size,
  serializedReportBytes: Buffer.byteLength(
    visualIntelligenceCanonicalJson(report),
    'utf8',
  ),
}, null, 2))
