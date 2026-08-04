import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  VisualIntelligenceEvidence,
  VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import {
  createCanonicalQualityFirstUserTriggeredGpuPolicy,
} from '../edit-architecture/canonical-quality-first-user-triggered-gpu-policy'
import {
  canonicalSourceLedTranscriptEvidenceSchema,
} from '../services/canonical-source-led-content-analysis-evidence'
import type {
  CanonicalSourceLedProfessionalContentAnalysisSource,
} from '../services/canonical-source-led-professional-content-analysis-port'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import type {
  CanonicalVisualIntelligenceSourceTranscriptResult,
} from '../services/canonical-source-visual-intelligence-analysis-contract'
import {
  createCanonicalSourceVisualIntelligenceOwner,
} from '../services/canonical-source-visual-intelligence-owner-service'
import {
  createControlledVisualIntelligenceSourceGpuEvidenceRelease,
  createControlledVisualIntelligenceSourceGpuEvidenceWorkerResult,
  createGoogleVisualIntelligenceSourceGpuEvidenceCloudRunPort,
  createVisualIntelligenceSourceGpuEvidenceCloudRunPort,
  createVisualIntelligenceSourceGpuEvidenceUsageCost,
  type VisualIntelligenceSourceGpuEvidenceWorkerResult,
  type VisualIntelligenceSourceGpuEvidenceCloudRunPort,
  type VisualIntelligenceSourceGpuEvidenceObjectPort,
  type VisualIntelligenceSourceGpuEvidenceUsageCostObserverPort,
} from '../services/canonical-visual-intelligence-source-gpu-evidence-service'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import {
  observeCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalGoogleCloudGpuRateRawObservation,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import {
  createControlledVisualIntelligenceAccountEffectiveRateAuthority,
  createVisualIntelligenceAccountEffectiveCostOwner,
  rateAuthorityRef,
} from '../visual-intelligence/visual-intelligence-account-effective-cost-owner'
import {
  createProfessionalHighVisualIntelligenceQualityPolicy,
  createVisualIntelligenceEvidenceRef,
  createVisualIntelligenceRequest,
  visualIntelligenceCanonicalJson,
  visualIntelligenceDigest,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  VISUAL_INTELLIGENCE_DETERMINISTIC_EVIDENCE_VERSION,
  VISUAL_INTELLIGENCE_PROMPT_VERSION,
  VISUAL_INTELLIGENCE_RESPONSE_SCHEMA_VERSION,
} from '../visual-intelligence/visual-intelligence-profile-registry'
import {
  createControlledVisualIntelligenceRuntimeRelease,
} from '../visual-intelligence/visual-intelligence-runtime-release'

const bucketName = 'reeditpro-private-visual-intelligence'
const sourceChecksum = rawDigest('exact-source-video-bytes')
const ref = (
  id: string,
  value: unknown = { id },
): VisualIntelligenceEvidenceRef => createVisualIntelligenceEvidenceRef(
  id,
  value,
)
const releaseRef = ref('source-gpu-evidence-release')
const imageRef = ref('source-gpu-evidence-image')
const ffprobeReleaseRef = ref('ffprobe-release')
const ffmpegReleaseRef = ref('ffmpeg-cuda-release')
const scenePolicyReleaseRef = ref('pyscenedetect-policy-release')
const opencvReleaseRef = ref('opencv-cuda-release')
const jobResource = 'projects/reeditpro/locations/us-central1/jobs/'
  + 'reeditpro-visual-intelligence-source-evidence-l4'
const serviceAccount =
  'reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com'
const immutableImage = 'us-central1-docker.pkg.dev/reeditpro/'
  + 'reeditpro-staging-workers/'
  + 'reeditpro-visual-intelligence-source-evidence-l4@'
  + imageRef.contentHash
const jobConfigurationRef: VisualIntelligenceEvidenceRef = {
  id: 'source-gpu-job-configuration',
  version: 1,
  contentHash: visualIntelligenceDigest({
    resourceName: jobResource,
    taskCount: 1,
    parallelism: 1,
    maxRetries: 0,
    timeout: '900s',
    serviceAccount,
    image: immutableImage,
    cpu: '8',
    memory: '32Gi',
    gpu: '1',
    accelerator: 'nvidia-l4',
    lifecycleBucketName: bucketName,
  }),
}
const serviceIdentityRef: VisualIntelligenceEvidenceRef = {
  id: 'source-gpu-service-identity',
  version: 1,
  contentHash: visualIntelligenceDigest({ serviceAccount }),
}
const observedAt = '2026-08-02T12:00:00.000Z'
const pricingReaderRef = ref('source-gpu-pricing-reader')
const billingAccountRef = ref('source-gpu-billing-account')
const rate = await observeCanonicalCurrentGoogleCloudGpuRateAuthority({
  rateAuthorityId: 'visual-intelligence-source-l4-rate',
  rateAuthorityVersion: 1,
  routeId: 'l4_standard_primary',
  region: 'us-central1',
  readPort: { async readCurrentRouteRate() { return rawRate() } },
})
const effectiveRateRef: VisualIntelligenceEvidenceRef = {
  id: rate.rateAuthorityId,
  version: rate.rateAuthorityVersion,
  contentHash: `sha256:${rate.rateAuthorityHash}`,
}
const release = createControlledVisualIntelligenceSourceGpuEvidenceRelease({
  schemaVersion: 'visual-intelligence-source-gpu-evidence-release-v1',
  evidenceClass: 'synthetic_contract_fixture',
  projectId: 'reeditpro',
  runtimeRegion: 'us-central1',
  cloudRunJobName: 'reeditpro-visual-intelligence-source-evidence-l4',
  operationId: 'internal.visual_intelligence.prepare_source_gpu_evidence.v1',
  releaseRef,
  immutableImageRef: imageRef,
  immutableImageDigest: imageRef.contentHash,
  lifecycleBucketName: bucketName,
  serviceIdentityRef,
  cloudRunJobConfigurationRef: jobConfigurationRef,
  cloudUsageAndCostObservationOwnerRef: ref('source-gpu-cost-owner'),
  accountEffectivePricingReaderConfigurationRef: pricingReaderRef,
  billingAccountPricingScopeRef: billingAccountRef,
  ffprobeReleaseRef,
  ffmpegCudaReleaseRef: ffmpegReleaseRef,
  pySceneDetectPolicyReleaseRef: scenePolicyReleaseRef,
  opencvCudaReleaseRef: opencvReleaseRef,
  nvdecQualificationRef: ref('nvdec-qualification'),
  opencvCudaQualificationRef: ref('opencv-cuda-qualification'),
  gpuSceneScoreQualificationRef: ref('gpu-scene-score-qualification'),
  completeSourceCoverageQualificationRef: ref('complete-source-coverage'),
  eightMinutePerformanceQualificationRef: ref('eight-minute-performance'),
  accountEffectiveL4RateAuthorityRef: effectiveRateRef,
  qualificationRunCount: 30,
  eightMinuteSourceP95WallTimeMilliseconds: 475_000,
  eightMinuteSourceTargetMilliseconds: 480_000,
  allocatedAccelerator: 'nvidia_l4',
  allocatedGpuCount: 1,
  allocatedVcpuCount: 8,
  allocatedMemoryGiB: 32,
  maximumExecutionSeconds: 900,
  minimumIdleInstances: 0,
  maximumConcurrentAttemptsPerInstance: 1,
  cloudRunTaskRetries: 0,
  userTriggeredOnly: true,
  scaleFromZeroRequired: true,
  scaleBackToZeroAfterTerminalAttemptRequired: true,
  prewarmingOrKeepaliveAllowed: false,
  nvdecUsedForSubstantiveDecode: true,
  opencvCudaUsedForPixelMeasurements: true,
  sceneScoresDerivedFromGpuPixels: true,
  pySceneDetectUsedForBoundedPolicyOnly: true,
  ffprobeUsedForMetadataOnly: true,
  substantiveCpuMediaProcessingAllowed: false,
  runtimeNetworkDownloadAllowed: false,
  callerPathUrlBytesOrCommandAllowed: false,
  privateInternalQualified: true,
  customerBillingAuthorityGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
})

class MemoryJobObjectPort implements VisualIntelligenceSourceGpuEvidenceObjectPort {
  readonly records = new Map<string, {
    body: Buffer
    generation: string
    etag: string
    contentType: string
  }>()
  private nextGeneration = 1

  async createOnly(input: {
    bucketName: string
    objectName: string
    body: Buffer
    contentType: string
  }): Promise<'created' | 'already_exists'> {
    assert.equal(input.bucketName, bucketName)
    const key = this.key(input.bucketName, input.objectName)
    if (this.records.has(key)) return 'already_exists'
    const generation = String(this.nextGeneration++)
    this.records.set(key, {
      body: Buffer.from(input.body),
      generation,
      etag: `etag-${generation}`,
      contentType: input.contentType,
    })
    return 'created'
  }

  async readExact(input: {
    bucketName: string
    objectName: string
    generation?: string
    etag?: string
  }) {
    const record = this.records.get(this.key(input.bucketName, input.objectName))
    if (!record) return null
    if (input.generation && input.generation !== record.generation) return null
    if (input.etag && input.etag !== record.etag) return null
    return { ...record, body: Buffer.from(record.body) }
  }

  private key(bucket: string, objectName: string): string {
    return `${bucket}/${objectName}`
  }
}

class MemorySourceOwnerObjectPort implements CanonicalCreateOnlyJsonObjectPort {
  readonly records = new Map<string, Buffer>()

  async createOnly(input: {
    objectPath: string
    body: Buffer
    contentSha256: string
  }): Promise<'created' | 'already_exists'> {
    assert.equal(rawDigest(input.body.toString('utf8')), input.contentSha256)
    if (this.records.has(input.objectPath)) return 'already_exists'
    this.records.set(input.objectPath, Buffer.from(input.body))
    return 'created'
  }

  async readExact(objectPath: string): Promise<Buffer | null> {
    const record = this.records.get(objectPath)
    return record ? Buffer.from(record) : null
  }
}

const objectPort = new MemoryJobObjectPort()
let dispatchCount = 0
let costObservationCount = 0
const cloudRunPort: VisualIntelligenceSourceGpuEvidenceCloudRunPort = {
  async runOnce(input) {
    dispatchCount += 1
    assert.equal(input.jobName,
      'reeditpro-visual-intelligence-source-evidence-l4')
    assert.equal(input.maximumExecutionSeconds, 900)
    await writeAcceptedWorkerResult(objectPort, input.invocationId)
    return {
      cloudRunExecutionName: `projects/reeditpro/locations/us-central1/jobs/`
        + `reeditpro-visual-intelligence-source-evidence-l4/executions/exec-1`,
      cloudRunExecutionRef: ref(`execution-${input.invocationId}`),
      cloudRunTerminalObservationRef: ref(`terminal-${input.invocationId}`),
      completed: true,
      runningTaskCount: 0,
    }
  },
}
const usageCostObserverPort:
VisualIntelligenceSourceGpuEvidenceUsageCostObserverPort = {
  async observeAndPersist(input) {
    costObservationCount += 1
    return usageCost(input)
  },
}
const port = createVisualIntelligenceSourceGpuEvidenceCloudRunPort({
  release,
  objectPort,
  cloudRunPort,
  usageCostObserverPort,
  pollMilliseconds: 1,
  maximumWaitMilliseconds: 50,
})

const sourceProbeRef = ref('source-probe')
const source: CanonicalSourceLedProfessionalContentAnalysisSource = {
  sourceSequenceItemId: 'source-item-1',
  mediaAssetId: 'media-asset-1',
  uploadedOrder: 1,
  storageProvider: 'google_cloud_storage',
  storageBucket: 'reeditpro-private-source',
  storagePath: 'workspace-1/source.mp4',
  checksumSha256: sourceChecksum,
  byteLength: 10_000_000,
  durationFrames: 480,
  managedApiAuthority: {
    ownerUserId: 'owner-1',
    storageBucket: 'reeditpro-private-source',
    storagePath: 'workspace-1/source.mp4',
    contentType: 'video/mp4',
    storageGeneration: '101',
    storageEtag: 'source-etag-101',
    width: 1920,
    height: 1080,
    hasAudio: true,
    audioProbe: {
      disposition: 'verified_audio_stream',
      videoStreamIndex: 0,
      videoStartTimeBaseUnits: 0,
      videoTimeBaseNumerator: 1,
      videoTimeBaseDenominator: 24,
      audioStreamIndex: 1,
      audioStartTimeBaseUnits: 0,
      audioDurationTimeBaseUnits: 960_000,
      audioTimeBaseNumerator: 1,
      audioTimeBaseDenominator: 48_000,
      audioSampleRateHertz: 48_000,
      audioChannelCount: 2,
    },
    fpsNumerator: 24,
    fpsDenominator: 1,
    frameCount: 480,
    sourceTimeBaseNumerator: 1,
    sourceTimeBaseDenominator: 24,
    finalizedMediaAuthorityRef: ref('finalized-media'),
    finalizedStorageObjectAuthorityRef: ref('finalized-storage'),
    sourceBindingManifestCandidateRef: ref('source-binding-manifest'),
    sourceProbeAuthorityRef: sourceProbeRef,
    providerMediaReadAuthorityRef: ref('provider-media-read'),
    sourceAnalysisConsentRef: ref('source-analysis-consent'),
    platformAnalysisCostCapRef: ref('platform-analysis-cost-cap'),
  },
}
const transcriptSegments = [{
  segmentId: 'transcript-segment-1',
  startFrame: 0,
  endFrameExclusive: 480,
  text: 'Complete source transcript.',
  confidenceBasisPoints: 9_900,
  wordsVerified: true,
}]
const coverageWithoutDigest = {
  schemaVersion: 'canonical-source-audio-complete-timeline-coverage-v1' as const,
  coveredStartFrame: 0 as const,
  coveredEndFrameExclusive: 480,
  completeAudioTimelineProcessed: true as const,
  speechSegmentsMayOmitSilence: true as const,
  embeddedInstructionDetectionRequired: true as const,
}
const transcriptAuthorityRef: VisualIntelligenceEvidenceRef = {
  id: 'transcript-authority',
  version: 1,
  contentHash: visualIntelligenceDigest(transcriptSegments),
}
const sourceTranscriptPolicy =
  createCanonicalQualityFirstUserTriggeredGpuPolicy()
const transcriptResult: CanonicalVisualIntelligenceSourceTranscriptResult = {
  schemaVersion: 'canonical-visual-intelligence-source-transcript-result-v1',
  transcriptAuthorityRef,
  transcript: canonicalSourceLedTranscriptEvidenceSchema.parse({
    status: 'completed',
    modelId: 'faster-whisper-large-v3',
    modelDigestSha256: rawDigest('faster-whisper-large-v3'),
    runtimeVersion: 'faster-whisper-1.2.1',
    transcriptDigestSha256: visualIntelligenceDigest(transcriptSegments).slice(7),
    segments: transcriptSegments,
    coverage: {
      ...coverageWithoutDigest,
      coverageDigestSha256:
        visualIntelligenceDigest(coverageWithoutDigest).slice(7),
    },
    rawAudioPersisted: false,
    modelDownloadPerformed: false,
    networkAttempted: false,
  }),
  execution: {
    executionOwner: 'canonical_quality_first_source_transcript_router',
    sourceAudioDisposition: 'transcribed_on_nvidia_a100_80gb_primary',
    routeProfileId: 'quality_a100_80gb_user_triggered_heavy_job_v1',
    acceleratorClass: 'nvidia_a100_80gb',
    primaryAttemptOutcome: 'completed',
    fallbackAttemptOutcome: 'not_attempted',
    primaryAttemptTerminalFailureClass: null,
    primaryAttemptReceiptRef: ref('a100-transcript-attempt'),
    completedAttemptReceiptRef: ref('a100-transcript-attempt'),
    completedRuntimeReleaseRef: ref('faster-whisper-a100-release'),
    fallbackAdmissionRef: null,
    attemptCostEvidenceRefs: [ref('a100-transcript-cost')],
    routePolicyDigestSha256: `sha256:${sourceTranscriptPolicy.policyHash}`,
    gpuAccelerationUsed: true,
    cpuInferenceFallbackUsed: false,
    completeAudioTimelineProcessed: true,
    modelBytesPinnedBeforeExecution: true,
    runtimeDownloadPerformed: false,
    rawAudioPersisted: false,
    transcriptRereadVerified: true,
    customerCreditMutated: false,
    systemFailureChargedToCustomer: false,
    unapprovedOverageChargedToCustomer: false,
  },
}
const request = {
  requestId: 'visual-source-request-1',
  workspaceId: 'workspace-1',
  projectId: 'project-1',
  editSessionId: 'edit-1',
  analysisRunId: 'analysis-1',
  source,
  transcriptResult,
}

const first = await port.prepare(request)
assert.equal(dispatchCount, 1)
assert.equal(first.privateMediaInputs[0]?.gcsUri,
  'gs://reeditpro-private-source/workspace-1/source.mp4')
assert.equal(first.coveragePlan.completeRequestedRangeCoverage, true)
assert.equal(first.coveragePlan.everyTimelineFrameInspected, false)
assert.equal(first.coveragePlan.completeTimePixelInspectionClaimAllowed, false)
assert.deepEqual(first.toolExecutionEvidence.map((entry) => entry.tool), [
  'ffprobe', 'ffmpeg', 'pyscenedetect', 'opencv', 'faster_whisper',
])

const replay = await port.prepare(request)
assert.deepEqual(replay, first)
assert.equal(dispatchCount, 1)
assert.equal(costObservationCount, 1)

const sourceOwnerObjectPort = new MemorySourceOwnerObjectPort()
const geminiRate = createControlledVisualIntelligenceAccountEffectiveRateAuthority({
  schemaVersion: 'visual-intelligence-account-effective-rate-authority-v2',
  evidenceClass: 'billing_account_effective_pricing_api_reread',
  billingAccountPricingScopeRef: ref('gemini-billing-pricing-scope'),
  pricingReaderConfigurationRef: ref('gemini-price-reader-configuration'),
  pricingApiObservationRef: ref('gemini-pricing-observation'),
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
  accountEffectiveSkuPriceTerms: controlledGeminiRateTerms(),
  priceReadStartedAtIso: '2026-08-03T00:00:00.000Z',
  priceReadFinishedAtIso: '2026-08-03T00:00:01.000Z',
  effectiveAtIso: '2026-08-03T00:00:01.000Z',
  expiresAtIso: '2026-08-03T23:59:59.000Z',
  exactSkuMetadataAndAccountPriceReread: true,
  billingAccountEffectiveRateUsed: true,
  publicListPriceUsed: false,
  customerPriceOrServiceFeeAuthorityGranted: false,
  walletMutationAuthorityGranted: false,
})

function controlledGeminiRateTerms() {
  const terms = [
    ['standard_uncached_input', 'standard_le_200k', 'uncached_input',
      'EAC4-305F-1249', 'Gemini 3.0 Pro Text Input - Predictions',
      2_000_000_000],
    ['standard_cached_input', 'standard_le_200k', 'cached_input',
      '8308-9CED-8950', 'Gemini 3.0 Pro Text Input Caching', 200_000_000],
    ['standard_output_and_thinking', 'standard_le_200k',
      'output_and_thinking', '2737-2D33-D986',
      'Gemini 3.0 Pro Text Output - Predictions', 12_000_000_000],
    ['long_uncached_input', 'long_gt_200k', 'uncached_input',
      'E0A5-FB5D-79F4', 'Gemini 3.0 Pro Text Input (Long) - Predictions',
      4_000_000_000],
    ['long_cached_input', 'long_gt_200k', 'cached_input',
      '8A47-3936-DC92', 'Gemini 3.0 Pro Text Input Caching (Long)',
      400_000_000],
    ['long_output_and_thinking', 'long_gt_200k', 'output_and_thinking',
      '3CE8-93F8-3C8F', 'Gemini 3.0 Pro Text Output (Long) - Predictions',
      18_000_000_000],
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
const geminiRateRef = rateAuthorityRef(geminiRate)
const geminiCostOwner = createVisualIntelligenceAccountEffectiveCostOwner({
  rateAuthorityRef: geminiRateRef,
  rateReadPort: { async readExact() { return geminiRate } },
  objectPort: sourceOwnerObjectPort,
  now: () => new Date('2026-08-03T12:00:00.000Z'),
})
const runtimeRelease = createControlledVisualIntelligenceRuntimeRelease({
  schemaVersion: 'visual-intelligence-runtime-release-v1',
  evidenceClass:
    'canonical_immutable_visual_intelligence_gemini_pro_high_release_reread',
  projectId: 'reeditpro',
  vertexLocation: 'global',
  lifecycleBucketName: bucketName,
  runtimeReleaseIdentityRef: ref('visual-intelligence-runtime-release'),
  lifecycleRepositoryReleaseRef: ref('visual-intelligence-lifecycle-release'),
  concurrencyOwnerReleaseRef: ref('visual-intelligence-concurrency-release'),
  sourceEvidencePreparationReleaseRef: releaseRef,
  providerModelAccessQualificationRef: ref('gemini-access-qualification'),
  providerTransportQualificationRef: ref('gemini-transport-qualification'),
  providerPrivacyRetentionReviewRef: ref('gemini-privacy-review'),
  promptInjectionSafetyQualificationRef: ref('gemini-prompt-safety'),
  structuredOutputQualificationRef: ref('gemini-structured-output'),
  professionalHighQualityBenchmarkRef: ref('gemini-quality-benchmark'),
  accountEffectivePricingAuthorityRef: geminiRateRef,
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
  providerAdapterVersion: 'vertex-gemini-pro-visual-intelligence-adapter-v2',
  profileRegistryVersion: 'visual-intelligence-profile-registry-v1',
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
let sourceAuthorityRereadCount = 0
const sourceOwner = createCanonicalSourceVisualIntelligenceOwner({
  authorityRereadPort: {
    async reread(value) {
      sourceAuthorityRereadCount += 1
      assert.equal(value.ownerUserId, 'owner-1')
      assert.equal(value.sourceSequenceItemId, 'source-item-1')
      return {
        status: 'admitted' as const,
        authenticatedPrincipalRef: ref('authenticated-owner'),
        workspaceAuthorizationRef: ref('workspace-authorization'),
        analysisAllowanceRef: source.managedApiAuthority!
          .sourceAnalysisConsentRef,
        retentionPolicyRef: ref('private-retention-policy'),
        privacyPolicyRef: ref('private-provider-policy'),
        exactScopeRereadVerified: true as const,
        globalKillSwitchOpen: false as const,
        providerKillSwitchOpen: false as const,
      }
    },
  },
  gpuEvidencePort: port,
  costOwner: geminiCostOwner,
  runtimeRelease,
  objectPort: sourceOwnerObjectPort,
})
const sourceOwnerPlanningInput = {
  ...request,
  idempotencyKey: 'visual-source-idempotency-1',
}
const sourceAdmission = await sourceOwner.planningAdmissionPort.admit(
  sourceOwnerPlanningInput,
)
assert.equal(sourceAdmission.timelineMutationAllowed, false)
assert.equal(sourceAdmission.editingWorkerExecutionAllowed, false)
assert.equal(sourceAdmission.providerReleaseRef.id,
  'visual-intelligence-runtime-release')
assert.equal(sourceAuthorityRereadCount, 1)
assert.equal(dispatchCount, 1)
assert.deepEqual(
  await sourceOwner.planningAdmissionPort.admit(sourceOwnerPlanningInput),
  sourceAdmission,
)
assert.equal(sourceAuthorityRereadCount, 1)
assert.equal(dispatchCount, 1)

const sourceVisualRequest = createVisualIntelligenceRequest({
  requestId: request.requestId,
  idempotencyKey: sourceOwnerPlanningInput.idempotencyKey,
  scope: {
    ownerUserId: 'owner-1',
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editSessionId: request.editSessionId,
    approvedSnapshotId: null,
  },
  operation: 'analyze_media',
  profile: 'source_edit_planning',
  sourceArtifacts: [{
    artifactId: source.mediaAssetId,
    mediaKind: 'video',
    contentType: 'video/mp4',
    checksumSha256: source.checksumSha256,
    byteLength: source.byteLength,
    width: source.managedApiAuthority!.width,
    height: source.managedApiAuthority!.height,
    durationFrames: source.durationFrames,
    frameRate: { numerator: 24, denominator: 1 },
    finalizedMediaAuthorityRef:
      source.managedApiAuthority!.finalizedMediaAuthorityRef,
    immutableStorageObjectAuthorityRef:
      source.managedApiAuthority!.finalizedStorageObjectAuthorityRef,
    mediaProbeEvidenceRef:
      source.managedApiAuthority!.sourceProbeAuthorityRef,
    privateArtifact: true,
    exactGenerationRereadRequiredAtDispatch: true,
  }],
  comparisonArtifacts: [],
  requestedRanges: [{
    startFrame: 0,
    endFrameExclusive: source.durationFrames,
    frameRate: { numerator: 24, denominator: 1 },
  }],
  requiredEvidenceRefs: [sourceProbeRef, transcriptAuthorityRef],
  expectedOutcomeRefs: [],
  outputFrame: null,
  protectedZones: [],
  qualityPolicy: createProfessionalHighVisualIntelligenceQualityPolicy(),
  admission: sourceAdmission,
  callerQuestion: null,
  byteFreeRequest: true,
  callerPromptAccepted: false,
  providerCredentialIncluded: false,
  publicMediaUrlIncluded: false,
  signedUrlIsSourceTruth: false,
  shellCommandIncluded: false,
  providerToolDefinitionIncluded: false,
})
const verifiedAdmission = await sourceOwner.admissionVerificationPort
  .verifyAndRereadExact(sourceVisualRequest)
assert.equal(verifiedAdmission.status, 'admitted')
assert.equal(verifiedAdmission.exactScopeRereadVerified, true)
assert.deepEqual(
  await sourceOwner.evidencePreparationPort.prepare({
    request: sourceVisualRequest,
    admissionRef: verifiedAdmission.admissionRef!,
  }),
  first,
)
await assert.rejects(() => sourceOwner.admissionVerificationPort
  .verifyAndRereadExact({
    ...sourceVisualRequest,
    requiredEvidenceRefs: [sourceProbeRef],
  }))
await assert.rejects(() => sourceOwner.planningAdmissionPort.admit({
  ...sourceOwnerPlanningInput,
  requestId: 'visual-source-request-bad-transcript',
  transcriptResult: {
    ...transcriptResult,
    transcriptAuthorityRef: ref('unbound-transcript-authority'),
  },
}))
assert.equal(dispatchCount, 1)

assert.throws(() => createControlledVisualIntelligenceSourceGpuEvidenceRelease({
  ...release,
  eightMinuteSourceP95WallTimeMilliseconds: 480_001,
  releaseDigestSha256: undefined,
} as never))

const tamperedObjectPort = new MemoryJobObjectPort()
const tamperedPort = createVisualIntelligenceSourceGpuEvidenceCloudRunPort({
  release,
  objectPort: tamperedObjectPort,
  cloudRunPort: {
    async runOnce(input) {
      await writeAcceptedWorkerResult(tamperedObjectPort, input.invocationId, {
        substantiveCpuMediaProcessingUsed: true,
      })
      return {
        cloudRunExecutionName: `projects/reeditpro/locations/us-central1/jobs/`
          + `reeditpro-visual-intelligence-source-evidence-l4/executions/bad`,
        cloudRunExecutionRef: ref(`execution-${input.invocationId}`),
        cloudRunTerminalObservationRef:
          ref(`terminal-${input.invocationId}`),
        completed: true,
        runningTaskCount: 0,
      }
    },
  },
  usageCostObserverPort,
  pollMilliseconds: 1,
  maximumWaitMilliseconds: 20,
})
await assert.rejects(() => tamperedPort.prepare({
  ...request,
  requestId: 'visual-source-request-tampered',
}))

let unknownStarts = 0
const unknownObjectPort = new MemoryJobObjectPort()
const unknownPort = createVisualIntelligenceSourceGpuEvidenceCloudRunPort({
  release,
  objectPort: unknownObjectPort,
  cloudRunPort: {
    async runOnce(): Promise<never> {
      unknownStarts += 1
      throw new Error('simulated unknown start outcome')
    },
  },
  usageCostObserverPort,
  pollMilliseconds: 1,
  maximumWaitMilliseconds: 5,
})
await assert.rejects(() => unknownPort.prepare({
  ...request,
  requestId: 'visual-source-request-unknown',
}))
await assert.rejects(() => unknownPort.prepare({
  ...request,
  requestId: 'visual-source-request-unknown',
}))
assert.equal(unknownStarts, 1)

const operationName = 'projects/reeditpro/locations/us-central1/'
  + 'operations/source-evidence-operation-1'
const executionName = `${jobResource}/executions/source-evidence-execution-1`
let jobConfigurationRereads = 0
let jobLaunches = 0
const googlePort = createGoogleVisualIntelligenceSourceGpuEvidenceCloudRunPort({
  release,
  pollMilliseconds: 1,
  auth: {
    async request(input: {
      url: string
      method: string
      timeout: number
      maxRedirects: number
      retry: boolean
    }) {
      assert.equal(input.timeout, 30_000)
      assert.equal(input.maxRedirects, 0)
      assert.equal(input.retry, false)
      if (input.url.endsWith(jobResource) && input.method === 'GET') {
        jobConfigurationRereads += 1
        return { data: canonicalJobRecord() }
      }
      if (input.url.endsWith(`${jobResource}:run`)) {
        jobLaunches += 1
        return { data: { name: operationName, done: false } }
      }
      if (input.url.endsWith(operationName)) {
        return {
          data: {
            name: operationName,
            done: true,
            response: { metadata: { name: executionName } },
          },
        }
      }
      if (input.url.endsWith(executionName)) {
        return { data: canonicalTerminalExecution(executionName) }
      }
      throw new Error(`Unexpected Google API request: ${input.url}`)
    },
  } as never,
})
const terminal = await googlePort.runOnce({
  projectId: 'reeditpro',
  runtimeRegion: 'us-central1',
  jobName: 'reeditpro-visual-intelligence-source-evidence-l4',
  invocationId: 'source-evidence-google-port-smoke',
  maximumExecutionSeconds: 900,
})
assert.equal(terminal.runningTaskCount, 0)
assert.equal(terminal.completed, true)
assert.equal(jobConfigurationRereads, 1)
assert.equal(jobLaunches, 1)

let tamperedJobLaunches = 0
const tamperedGooglePort =
  createGoogleVisualIntelligenceSourceGpuEvidenceCloudRunPort({
    release,
    auth: {
      async request(input: { url: string; method: string }) {
        if (input.method === 'GET') {
          return {
            data: {
              ...canonicalJobRecord(),
              template: {
                ...canonicalJobRecord().template,
                template: {
                  ...canonicalJobRecord().template.template,
                  containers: [{
                    ...canonicalJobRecord().template.template.containers[0],
                    resources: {
                      limits: {
                        cpu: '4',
                        memory: '32Gi',
                        'nvidia.com/gpu': '1',
                      },
                    },
                  }],
                },
              },
            },
          }
        }
        tamperedJobLaunches += 1
        throw new Error('Tampered job must not launch.')
      },
    } as never,
  })
await assert.rejects(() => tamperedGooglePort.runOnce({
  projectId: 'reeditpro',
  runtimeRegion: 'us-central1',
  jobName: 'reeditpro-visual-intelligence-source-evidence-l4',
  invocationId: 'source-evidence-tampered-job-smoke',
  maximumExecutionSeconds: 900,
}))
assert.equal(tamperedJobLaunches, 0)

console.log(JSON.stringify({
  status: 'visual_intelligence_source_gpu_evidence_smoke_passed',
  accelerator: release.allocatedAccelerator,
  completeSourceRangeCovered: true,
  everyTimelineFrameInspectedClaimed: false,
  substantiveCpuMediaProcessingUsed: false,
  scaleFromZeroRequired: release.scaleFromZeroRequired,
  minimumIdleInstances: release.minimumIdleInstances,
  accountEffectiveL4RateBound: true,
  eightMinuteP95Milliseconds:
    release.eightMinuteSourceP95WallTimeMilliseconds,
  duplicateDispatchAvoided: true,
  uncertainOutcomeRetryBlocked: true,
  exactCloudRunJobConfigurationReread: true,
  terminalZeroRunningTasksReread: true,
  adversarialChecks: 4,
}))

function canonicalJobRecord() {
  return {
    name: jobResource,
    template: {
      taskCount: 1,
      parallelism: 1,
      template: {
        maxRetries: 0,
        timeout: '900s',
        serviceAccount,
        nodeSelector: { accelerator: 'nvidia-l4' },
        containers: [{
          image: immutableImage,
          resources: {
            limits: {
              cpu: '8',
              memory: '32Gi',
              'nvidia.com/gpu': '1',
            },
          },
          env: [{
            name:
              'REEDITPRO_VISUAL_INTELLIGENCE_EVIDENCE_LIFECYCLE_BUCKET',
            value: bucketName,
          }],
        }],
      },
    },
  }
}

function canonicalTerminalExecution(name: string) {
  return {
    name,
    completionTime: '2026-08-02T12:00:00.000Z',
    runningCount: 0,
    succeededCount: 1,
    failedCount: 0,
    cancelledCount: 0,
    conditions: [{ type: 'Completed', state: 'CONDITION_SUCCEEDED' }],
  }
}

async function writeAcceptedWorkerResult(
  port: MemoryJobObjectPort,
  invocationId: string,
  executionOverride: Record<string, unknown> = {},
): Promise<void> {
  const envelopeObject = `private/visual-intelligence/v1/`
    + `source-gpu-evidence/requests/${invocationId}.json`
  const storedEnvelope = await port.readExact({
    bucketName,
    objectName: envelopeObject,
  })
  assert.ok(storedEnvelope)
  const envelope = JSON.parse(storedEnvelope.body.toString('utf8')) as Record<
    string,
    unknown
  >
  const sourceRecord = envelope.source as Record<string, unknown>
  assert.equal(
    envelope.schemaVersion,
    'visual-intelligence-source-gpu-evidence-envelope-v2',
  )
  assert.equal(
    (envelope.release as Record<string, unknown>).releaseDigestSha256,
    release.releaseDigestSha256,
  )
  const transcriptToolExecution = envelope.transcriptToolExecution as ReturnType<
    typeof tool
  >
  const frameRate = { numerator: 24, denominator: 1 }
  const range = {
    startFrame: 0,
    endFrameExclusive: Number(sourceRecord.durationFrames),
    frameRate,
  }
  const sceneRef = ref('source-scene-boundaries')
  const sceneEvidenceRef = ref('source-scene-evidence')
  const pixelEvidenceRef = ref('source-pixel-evidence')
  const deterministicEvidence: VisualIntelligenceEvidence[] = [
    evidence(
      sourceRecord.sourceProbeAuthorityRef as VisualIntelligenceEvidenceRef,
      'media_probe',
      'ffprobe',
      'Canonical source probe reread verifies dimensions and timing.',
    ),
    evidence(
      envelope.transcriptAuthorityRef as VisualIntelligenceEvidenceRef,
      'canonical_transcript',
      'faster_whisper',
      'Complete A100 transcript authority is bound to the source.',
    ),
    evidence(
      sceneEvidenceRef,
      'scene_detection',
      'pyscenedetect',
      'Scene policy is applied to GPU-derived frame-change scores.',
      range,
    ),
    evidence(
      pixelEvidenceRef,
      'pixel_measurement',
      'opencv',
      'CUDA pixel measurements cover the complete requested source range.',
      range,
    ),
  ]
  const coveragePlan = {
    requestedRanges: [range],
    analyzedRanges: [range],
    incompleteRanges: [],
    sceneBoundaryRefs: [sceneRef],
    samplingPolicies: [{
      policyId: 'source-scene-aware-complete-coverage',
      policyVersion: 'source-scene-aware-complete-coverage-v1',
      mode: 'scene_aware_complete_coverage',
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
  } as const
  const privateMediaInputs = [{
    artifactId: sourceRecord.mediaAssetId,
    gcsUri: `gs://${String(sourceRecord.storageBucket)}/`
      + String(sourceRecord.storagePath),
    contentType: 'video/mp4' as const,
    checksumSha256: sourceRecord.checksumSha256,
    exactGenerationRereadVerified: true as const,
  }]
  const toolExecutionEvidence = [
    tool('ffprobe', ffprobeReleaseRef),
    tool('ffmpeg', ffmpegReleaseRef),
    tool('pyscenedetect', scenePolicyReleaseRef),
    tool('opencv', opencvReleaseRef),
    transcriptToolExecution,
  ]
  const preparedPayload = {
    deterministicEvidence,
    coveragePlan,
    privateMediaInputs,
    transcriptVersion: 'canonical-visual-intelligence-source-transcript-result-v1',
    ocrVersion: null,
    toolExecutionEvidence,
  }
  const preparedEvidence = {
    ...preparedPayload,
    preparedEvidenceRef: {
      id: 'prepared-source-gpu-evidence',
      version: 1,
      contentHash: visualIntelligenceDigest(preparedPayload),
    },
  }
  const execution = {
    sourceExactGenerationEtagShaLengthRereadVerified: true,
    nvdecUsed: true,
    ffmpegCudaUsed: true,
    opencvCudaUsed: true,
    sceneScoresDerivedFromGpuPixels: true,
    pySceneDetectPolicyOnly: true,
    ffprobeMetadataOnly: true,
    substantiveCpuMediaProcessingUsed: false,
    runtimeNetworkDownloadPerformed: false,
    workerActiveMilliseconds: 420_000,
    gpuActiveMilliseconds: 390_000,
    sourceBytesRead: Number(sourceRecord.byteLength),
    persistedPrivateBytes: 24_000,
    privateArtifactRetentionMilliseconds: 86_400_000,
    classAOperationCount: 2,
    classBOperationCount: 4,
    ...executionOverride,
  } as VisualIntelligenceSourceGpuEvidenceWorkerResult['execution']
  const result = createControlledVisualIntelligenceSourceGpuEvidenceWorkerResult({
    schemaVersion: 'visual-intelligence-source-gpu-evidence-worker-result-v1',
    invocationId,
    envelopeDigestSha256: String(envelope.envelopeDigestSha256),
    releaseRef,
    preparedEvidence,
    execution,
  })
  await port.createOnly({
    bucketName,
    objectName: `private/visual-intelligence/v1/`
      + `source-gpu-evidence/worker-results/${invocationId}.json`,
    body: Buffer.from(visualIntelligenceCanonicalJson(result), 'utf8'),
    contentType: 'application/json',
  })
}

function evidence(
  evidenceRef: VisualIntelligenceEvidenceRef,
  authority: VisualIntelligenceEvidence['authority'],
  producingTool: VisualIntelligenceEvidence['producingTool'],
  summary: string,
  range: VisualIntelligenceEvidence['range'] = null,
): VisualIntelligenceEvidence {
  return {
    evidenceId: evidenceRef.id,
    evidenceRef,
    artifactId: 'media-asset-1',
    range,
    authority,
    producingTool,
    toolVersion: `${producingTool}-qualified-v1`,
    summary,
    privateEvidence: true,
    providerInstructionAccepted: false,
  }
}

function tool(
  name: 'ffprobe' | 'ffmpeg' | 'pyscenedetect' | 'opencv' | 'faster_whisper',
  releaseReference: VisualIntelligenceEvidenceRef,
  executionClass:
    | 'l4_gpu_standard'
    | 'a100_80gb_gpu_heavy' = 'l4_gpu_standard',
) {
  return {
    tool: name,
    requirement: 'required' as const,
    executionClass,
    releaseRef: releaseReference,
    executionRef: ref(`${name}-execution`),
    substantiveCpuExecutionUsed: false as const,
    sourceArtifactChecksumBound: true as const,
  }
}

function usageCost(input: {
  readonly envelope: Readonly<Record<string, unknown>>
  readonly cloudRunExecutionRef: VisualIntelligenceEvidenceRef
  readonly cloudRunTerminalObservationRef: VisualIntelligenceEvidenceRef
}) {
  const invocationId = String(input.envelope.invocationId)
  const usage = {
    coldStartMilliseconds: 10,
    activeExecutionMilliseconds: 420_000,
    shutdownMilliseconds: 10,
    totalBillableMilliseconds: 420_020,
    allocatedVcpuCount: 8 as const,
    allocatedMemoryGiB: 32 as const,
    allocatedGpuCount: 1 as const,
    persistedPrivateBytes: 24_000,
    privateArtifactRetentionMilliseconds: 86_400_000,
    networkEgressBytes: 0 as const,
    classAOperationCount: 2,
    classBOperationCount: 4,
  }
  const usageRef = ref(
    `visual-intelligence-source-gpu-usage-${invocationId}`,
    {
      invocationId,
      envelopeDigestSha256: input.envelope.envelopeDigestSha256,
      cloudRunExecutionRef: input.cloudRunExecutionRef,
      cloudRunTerminalObservationRef:
        input.cloudRunTerminalObservationRef,
      actualUsage: usage,
    },
  )
  const zeroCost = {
    gpuUsdNanos: 0,
    vcpuUsdNanos: 0,
    memoryUsdNanos: 0,
    privateStorageUsdNanos: 0,
    networkEgressUsdNanos: 0 as const,
    classAOperationUsdNanos: 0,
    classBOperationUsdNanos: 0,
    totalInternalCostUsdNanos: 0,
  }
  const costRef = ref(
    `visual-intelligence-source-gpu-cost-${invocationId}`,
    {
      invocationId,
      accountEffectiveRateAuthorityRef: effectiveRateRef,
      workerUsageEvidenceRef: usageRef,
      actualCost: zeroCost,
    },
  )
  return createVisualIntelligenceSourceGpuEvidenceUsageCost({
    schemaVersion: 'visual-intelligence-source-gpu-evidence-usage-cost-v1',
    source:
      'canonical_google_cloud_usage_and_account_effective_pricing_reread',
    evidenceClass: 'canonical_private_reread',
    invocationId,
    envelopeDigestSha256: String(input.envelope.envelopeDigestSha256),
    releaseRef,
    cloudRunExecutionRef: input.cloudRunExecutionRef,
    cloudRunTerminalObservationRef:
      input.cloudRunTerminalObservationRef,
    accountEffectiveRateAuthority: rate,
    workerUsageEvidenceRef: usageRef,
    attemptCostReceiptRef: costRef,
    actualUsage: usage,
    actualCost: zeroCost,
    exactPlatformUsageReread: true,
    exactCurrentBillingAccountPriceReread: true,
    accountEffectiveCostRecorded: true,
    publicListPriceUsedAsSettlementAuthority: false,
    platformFundedPreapprovalAnalysis: true,
    customerEligibleToolCostMicros: 0,
    customerEligibleToolCostCredits: 0,
    serviceFeeIncluded: false,
    customerCreditsMutated: false,
    unapprovedOverageChargedToCustomer: false,
    terminalGpuInstanceCount: 0,
    scaleBackToZeroVerified: true,
    observedAt,
  })
}

function rawRate(): CanonicalGoogleCloudGpuRateRawObservation {
  const components = [
    rateComponent('cloud_run_l4_gpu_second', 'gpu_second', 'a'),
    rateComponent('cloud_run_vcpu_second', 'vcpu_second', 'b'),
    rateComponent('cloud_run_memory_gib_second', 'gib_second', 'c'),
    rateComponent('private_object_storage_gib_month', 'gib_month', 'd'),
    rateComponent('network_egress_gib', 'gib', 'e'),
    rateComponent('object_class_a_per_1000', 'per_1000_operations', 'f'),
    rateComponent('object_class_b_per_1000', 'per_1000_operations', 'g'),
  ]
  const payload = {
    sourceClass: 'billing_account_effective_pricing_api' as const,
    billingAccountPricingScopeRef: billingAccountRef,
    pricingReaderConfigurationRef: pricingReaderRef,
    routeId: 'l4_standard_primary' as const,
    region: 'us-central1' as const,
    currency: 'USD' as const,
    components,
    priceRecordSetRef: ref('source-gpu-rate-record-set'),
    pricingReadStartedAt: '2026-08-02T11:59:59.000Z',
    pricingReadFinishedAt: observedAt,
  }
  return {
    ...payload,
    pricingReadDigestSha256: sha256AuthorityValue(payload),
  }
}

function rateComponent(
  componentClass:
    | 'cloud_run_l4_gpu_second'
    | 'cloud_run_vcpu_second'
    | 'cloud_run_memory_gib_second'
    | 'private_object_storage_gib_month'
    | 'network_egress_gib'
    | 'object_class_a_per_1000'
    | 'object_class_b_per_1000',
  billingUnit:
    | 'gpu_second'
    | 'vcpu_second'
    | 'gib_second'
    | 'gib_month'
    | 'gib'
    | 'per_1000_operations',
  marker: string,
) {
  const service = componentClass.startsWith('cloud_run')
    ? 'cloud-run'
    : 'cloud-storage'
  return {
    componentClass,
    cloudServiceName: service,
    skuRateBindingId: `rate-binding-${marker}`,
    skuPriceTerms: [{
      cloudServiceId: `service-${service}`,
      skuId: `sku-${marker}`,
      quantityPerBillingUnit: 1,
      consumptionModel: 'consumptionModels/default',
      apiUnit: billingUnit,
      apiUnitQuantity: '1',
      contractPriceTiers: [{
        startAmount: '0',
        contractPriceUsdNanos: 0,
      }],
      maximumContractPriceUsdNanos: 0,
      skuMetadataRef: ref(`sku-metadata-${marker}`),
      billingAccountPriceRef: ref(`billing-account-price-${marker}`),
    }],
    skuDescriptionDigestSha256: rawDigest(marker),
    skuRegion: 'us-central1' as const,
    billingUnit,
    maximumUsdNanosPerBillingUnit: 0,
    currentPriceObservedAt: observedAt,
    skuRecordRef: ref(`sku-record-${marker}`),
  }
}

function rawDigest(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
