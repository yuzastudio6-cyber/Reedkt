import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  VisualIntelligenceEvidence,
  VisualIntelligenceEvidenceRef,
  VisualIntelligencePreparedEvidence,
} from '../../src/types/visual-intelligence'
import {
  VISUAL_INTELLIGENCE_MODEL_ID,
} from '../../src/types/visual-intelligence'
import {
  assertRuntimeCanStart,
  loadRuntimeEnv,
} from '../config/env'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createProfessionalHighVisualIntelligenceQualityPolicy,
  createVisualIntelligenceEvidenceRef,
  createVisualIntelligenceRequest,
  visualIntelligenceCanonicalJson,
} from '../visual-intelligence/visual-intelligence-contract'
import type {
  VisualIntelligenceConcurrencyPort,
} from '../visual-intelligence/visual-intelligence-lifecycle-service'
import type {
  VisualIntelligencePrivateObjectReadPort,
} from '../visual-intelligence/visual-intelligence-private-object-read-port'
import {
  createVisualIntelligenceProductionRuntime,
} from '../visual-intelligence/visual-intelligence-production-runtime'
import {
  createControlledVisualIntelligenceAccountEffectiveRateAuthority,
  rateAuthorityRef,
} from '../visual-intelligence/visual-intelligence-account-effective-cost-owner'
import {
  VISUAL_INTELLIGENCE_DETERMINISTIC_EVIDENCE_VERSION,
  VISUAL_INTELLIGENCE_PROMPT_VERSION,
  VISUAL_INTELLIGENCE_RESPONSE_SCHEMA_VERSION,
} from '../visual-intelligence/visual-intelligence-profile-registry'
import {
  createControlledVisualIntelligenceRuntimeRelease,
  visualIntelligenceRuntimeReleaseRef,
} from '../visual-intelligence/visual-intelligence-runtime-release'
import type {
  VisualIntelligenceGeminiGeneratePort,
} from '../visual-intelligence/vertex-gemini-pro-visual-intelligence-adapter'

const rawSha = (value: string | Buffer) => createHash('sha256')
  .update(value).digest('hex')
const ref = (id: string, value: unknown = { id }) =>
  createVisualIntelligenceEvidenceRef(id, value)
const now = new Date('2026-08-03T12:00:00.000Z')
const frameRate = { numerator: 24, denominator: 1 } as const
const fullRange = {
  startFrame: 0,
  endFrameExclusive: 240,
  frameRate,
} as const
const releaseObject =
  'private/visual-intelligence/releases/gemini-pro-high/v1/release.json'
const rateObject =
  'private/visual-intelligence/pricing/account-effective/v1/rate.json'
const releaseGeneration = '101'
const rateGeneration = '102'
const releaseEtag = 'release-etag-101'
const rateEtag = 'rate-etag-102'
const controlPlaneBucket = 'reeditpro-control-plane'

const accountRate = createControlledVisualIntelligenceAccountEffectiveRateAuthority({
  schemaVersion: 'visual-intelligence-account-effective-rate-authority-v1',
  evidenceClass: 'billing_account_effective_pricing_api_reread',
  billingAccountPricingScopeRef: ref('billing-account-pricing-scope'),
  pricingApiObservationRef: ref('gemini-account-price-observation'),
  exactModelId: VISUAL_INTELLIGENCE_MODEL_ID,
  currency: 'USD',
  rateUnit: 'usd_nanos_per_million_tokens',
  uncachedInputUsdNanosPerMillionTokens: 1_000_000_000,
  cachedInputUsdNanosPerMillionTokens: 250_000_000,
  outputAndThinkingUsdNanosPerMillionTokens: 3_000_000_000,
  effectiveAtIso: '2026-08-03T00:00:00.000Z',
  expiresAtIso: '2026-08-03T23:59:59.000Z',
  billingAccountEffectiveRateUsed: true,
  publicListPriceUsed: false,
  customerPriceOrServiceFeeAuthorityGranted: false,
  walletMutationAuthorityGranted: false,
})
const accountRateRef = rateAuthorityRef(accountRate)
const release = createControlledVisualIntelligenceRuntimeRelease({
  schemaVersion: 'visual-intelligence-runtime-release-v1',
  evidenceClass:
    'canonical_immutable_visual_intelligence_gemini_pro_high_release_reread',
  projectId: 'reeditpro',
  vertexLocation: 'global',
  lifecycleBucketName: controlPlaneBucket,
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
  accountEffectivePricingAuthorityRef: accountRateRef,
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
const releaseBody = Buffer.from(
  visualIntelligenceCanonicalJson(release),
  'utf8',
)
const rateBody = Buffer.from(
  visualIntelligenceCanonicalJson(accountRate),
  'utf8',
)
const privateObjects = new Map<string, {
  body: Buffer
  generation: string
  etag: string
  contentType: string
}>([
  [releaseObject, {
    body: releaseBody,
    generation: releaseGeneration,
    etag: releaseEtag,
    contentType: 'application/json',
  }],
  [rateObject, {
    body: rateBody,
    generation: rateGeneration,
    etag: rateEtag,
    contentType: 'application/json',
  }],
])
const privateObjectReadPort: VisualIntelligencePrivateObjectReadPort = {
  async readExact(input) {
    assert.equal(input.bucketName, controlPlaneBucket)
    const stored = privateObjects.get(input.objectName)
    if (!stored) return null
    if (
      input.generation && input.generation !== stored.generation
      || input.etag && input.etag !== stored.etag
    ) return null
    return {
      ...stored,
      body: Buffer.from(stored.body),
    }
  },
}

class MemoryObjectPort implements CanonicalCreateOnlyJsonObjectPort {
  readonly values = new Map<string, Buffer>()

  async createOnly(input: {
    objectPath: string
    body: Buffer
    contentSha256: string
  }): Promise<'created' | 'already_exists'> {
    assert.equal(rawSha(input.body), input.contentSha256)
    if (this.values.has(input.objectPath)) return 'already_exists'
    this.values.set(input.objectPath, Buffer.from(input.body))
    return 'created'
  }

  async readExact(objectPath: string): Promise<Buffer | null> {
    const value = this.values.get(objectPath)
    return value ? Buffer.from(value) : null
  }
}

let acquired = 0
let released = 0
const concurrencyPort: VisualIntelligenceConcurrencyPort = {
  async acquire(input) {
    acquired += 1
    return {
      status: 'acquired',
      leaseRef: ref(`runtime-lease-${input.requestId}`),
    }
  },
  async release() { released += 1 },
}
let providerPayload: unknown = null
let providerCalls = 0
const generatePort: VisualIntelligenceGeminiGeneratePort = {
  async generate(input) {
    providerCalls += 1
    assert.equal(input.model, VISUAL_INTELLIGENCE_MODEL_ID)
    assert.ok(providerPayload)
    return {
      responseId: 'gemini-production-composition-smoke-response',
      modelVersion: VISUAL_INTELLIGENCE_MODEL_ID,
      text: JSON.stringify(providerPayload),
      finishReason: 'STOP',
      candidateCount: 1,
      promptTokenCount: 5_000,
      candidateTokenCount: 1_000,
      thinkingTokenCount: 1_500,
      cachedTokenCount: 0,
      totalTokenCount: 7_500,
      groundingMetadataPresent: false,
      urlContextMetadataPresent: false,
      functionCallPresent: false,
      executableCodePresent: false,
    }
  },
}

const env = productionEnv()
assertRuntimeCanStart(env)
const objectPort = new MemoryObjectPort()
const runtime = await createVisualIntelligenceProductionRuntime(env, {
  privateObjectReadPort,
  objectPort,
  concurrencyPort,
  generatePort,
  now: () => now,
})
assert.ok(runtime)
assert.equal(runtime.providerCapabilityId, 'visual_intelligence')
assert.equal(runtime.semanticEngine, 'gemini-3.1-pro-preview')
assert.equal(runtime.thinkingLevel, 'high')
assert.equal(runtime.mediaResolution, 'high')
assert.equal(runtime.applicationDefaultCredentialsUsed, true)
assert.equal(runtime.apiKeyUsed, false)
assert.equal(runtime.qwenFallbackAllowed, false)
assert.equal(runtime.selfHostedVisualModelFallbackAllowed, false)
assert.equal(runtime.substantiveCpuMediaProcessingAllowed, false)

const costPreflight = await runtime.costOwner.createPreflight({
  requestId: 'visual-production-source-request-1',
  maximumInputTokenCount: 100_000,
  maximumOutputAndThinkingTokenCount: 20_000,
  estimatedInputTokenCount: 10_000,
  estimatedOutputAndThinkingTokenCount: 4_000,
})
const finalizedRef = ref('source-finalized')
const probeRef = ref('source-probe')
const sourceRequest = createVisualIntelligenceRequest({
  requestId: 'visual-production-source-request-1',
  idempotencyKey: 'visual-production-source-idempotency-1',
  scope: {
    ownerUserId: 'user-1',
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    editSessionId: 'edit-1',
    approvedSnapshotId: null,
  },
  operation: 'analyze_media',
  profile: 'source_edit_planning',
  sourceArtifacts: [{
    artifactId: 'source-video-1',
    mediaKind: 'video',
    contentType: 'video/mp4',
    checksumSha256: rawSha('source-video-1'),
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
  requestedRanges: [fullRange],
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
    sourceChecksumSetRef: ref('source-checksum-set'),
    analysisAllowanceRef: ref('analysis-allowance'),
    costPreflight,
    retentionPolicyRef: ref('retention-policy'),
    privacyPolicyRef: ref('privacy-policy'),
    providerReleaseRef: visualIntelligenceRuntimeReleaseRef(
      runtime.runtimeRelease,
    ),
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
const prepared = preparedEvidence(sourceRequest.requestDigestSha256, probeRef)
await runtime.canonicalRequestPackageStore.persistCreateOnly({
  ownerClass: 'canonical_source_or_reference_owner',
  ownerAuthorityRef: ref('canonical-source-owner'),
  request: sourceRequest,
  preparedEvidence: prepared,
  inspectionRequirement: null,
})
providerPayload = {
  schemaVersion: 'visual-intelligence-provider-result-v1',
  requestId: sourceRequest.requestId,
  semanticSummary:
    'The full source contains one complete basketball instruction sequence.',
  segments: [{
    segmentId: 'segment-1',
    artifactId: 'source-video-1',
    range: fullRange,
    sceneId: 'scene-1',
    summary: 'The presenter explains and demonstrates the complete action.',
    subjectIds: ['presenter-1'],
    objectIds: ['basketball-1'],
    actionLabels: ['instruction', 'demonstration'],
    visibleTextEvidenceRefs: [],
    transcriptEvidenceRefs: [],
    evidenceRefs: [probeRef],
    confidenceBasisPoints: 9_000,
    uncertainty: null,
    sourcePlanning: {
      sourceFunction: 'active_action',
      actionIntensity: 'medium',
      editUsability: 'strong',
      cameraStability: 'stable',
      continuity: 'continuous',
    },
  }],
  findings: [{
    findingId: 'preserve-instruction-1',
    artifactId: 'source-video-1',
    range: fullRange,
    category: 'meaning_preservation',
    severity: 'info',
    summary: 'Preserve the instruction before proposing cleanup cuts.',
    evidenceRefs: [probeRef],
    expectedOutcomeRefs: [],
    confidenceBasisPoints: 9_000,
    uncertainty: null,
    recommendedOwner: 'planning',
    reinspectionRequired: false,
    directTimelineMutationAllowed: false,
    providerInstructionAccepted: false,
  }],
  targetedFollowupRanges: [],
  warnings: [],
  mediaContentTreatedAsUntrusted: true,
  providerInstructionsFollowedFromMedia: false,
  editingOrRenderingClaimed: false,
}
const completed = await runtime.lifecyclePort.execute(sourceRequest)
assert.equal(completed.status, 'completed')
assert.equal(completed.providerCallMadeDuringInvocation, true)
assert.equal(completed.costSettledDuringInvocation, true)
assert.equal(completed.directTimelineMutationPerformed, false)
const replay = await runtime.lifecyclePort.execute(sourceRequest)
assert.equal(replay.status, 'cache_replay')
assert.equal(replay.providerCallMadeDuringInvocation, false)
assert.equal(replay.costSettledDuringInvocation, false)
assert.equal(providerCalls, 1)
assert.equal(acquired, 1)
assert.equal(released, 1)

const disabled = await createVisualIntelligenceProductionRuntime(
  loadRuntimeEnv({
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    STORAGE_MODE: 'local',
    WORKER_RUNTIME_MODE: 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  }),
)
assert.equal(disabled, undefined)
await assert.rejects(() => createVisualIntelligenceProductionRuntime(
  loadRuntimeEnv({
    ...productionEnvironmentSource(),
    REEDITPRO_VISUAL_INTELLIGENCE_RELEASE_SHA256: rawSha('wrong-release'),
  }),
  {
    privateObjectReadPort,
    objectPort: new MemoryObjectPort(),
    concurrencyPort,
    generatePort,
    now: () => now,
  },
))

console.log(JSON.stringify({
  status: 'visual_intelligence_production_runtime_smoke_passed',
  exactRuntimeReleaseReread: true,
  exactAccountEffectiveRateReread: true,
  canonicalRequestPackageConsumed: true,
  providerCallCount: providerCalls,
  immutableCacheReplay: true,
  applicationDefaultCredentialsRequired: true,
  apiKeyAllowed: false,
  qwenFallbackAllowed: false,
  substantiveCpuMediaProcessingAllowed: false,
  disabledRuntimeStartedProvider: false,
  tamperedReleaseCoordinateRefused: true,
}))

function productionEnv() {
  return loadRuntimeEnv(productionEnvironmentSource())
}

function productionEnvironmentSource(): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'production',
    E2E_RUNTIME_MODE: 'cloud_run',
    STORAGE_MODE: 'gcs',
    REEDITPRO_LARGE_MEDIA_FINALIZATION_MODE: 'disabled',
    WORKER_RUNTIME_MODE: 'cloud_run',
    REEDITPRO_INTERNAL_SERVICE_TOKEN: 'controlled-internal-service-token',
    API_ALLOWED_CORS_ORIGINS: 'https://app.weeditpro.example',
    SUPABASE_URL: 'https://weeditpro.supabase.co',
    SUPABASE_ANON_KEY: 'controlled-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'controlled-service-role-key',
    GOOGLE_CLOUD_PROJECT_ID: 'reeditpro',
    GOOGLE_CLOUD_REGION: 'us-central1',
    GCS_SOURCE_MEDIA_BUCKET: 'reeditpro-source-media',
    GCS_GENERATED_ASSETS_BUCKET: 'reeditpro-generated-assets',
    GCS_PROCESSED_MEDIA_BUCKET: 'reeditpro-processed-media',
    GCS_PREVIEWS_BUCKET: 'reeditpro-previews',
    GCS_EXPORTS_BUCKET: 'reeditpro-exports',
    GCS_THUMBNAILS_BUCKET: 'reeditpro-thumbnails',
    GCS_QA_ARTIFACTS_BUCKET: 'reeditpro-qa-artifacts',
    GCS_WORKER_TEMP_BUCKET: 'reeditpro-worker-temp',
    GCS_CONTROL_PLANE_STATE_BUCKET: controlPlaneBucket,
    REEDITPRO_VISUAL_INTELLIGENCE_RUNTIME_MODE: 'cloud_run',
    REEDITPRO_VISUAL_INTELLIGENCE_RELEASE_OBJECT: releaseObject,
    REEDITPRO_VISUAL_INTELLIGENCE_RELEASE_GENERATION: releaseGeneration,
    REEDITPRO_VISUAL_INTELLIGENCE_RELEASE_ETAG: releaseEtag,
    REEDITPRO_VISUAL_INTELLIGENCE_RELEASE_SHA256: rawSha(releaseBody),
    REEDITPRO_VISUAL_INTELLIGENCE_RATE_OBJECT: rateObject,
    REEDITPRO_VISUAL_INTELLIGENCE_RATE_GENERATION: rateGeneration,
    REEDITPRO_VISUAL_INTELLIGENCE_RATE_ETAG: rateEtag,
    REEDITPRO_VISUAL_INTELLIGENCE_RATE_SHA256: rawSha(rateBody),
  }
}

function preparedEvidence(
  requestDigestSha256: string,
  probeRef: VisualIntelligenceEvidenceRef,
): VisualIntelligencePreparedEvidence {
  const deterministicEvidence: VisualIntelligenceEvidence[] = [{
    evidenceId: probeRef.id,
    evidenceRef: probeRef,
    artifactId: 'source-video-1',
    range: null,
    authority: 'media_probe',
    producingTool: 'ffprobe',
    toolVersion: 'ffprobe-8.0',
    summary: 'Canonical source dimensions and rational timing were reread.',
    privateEvidence: true,
    providerInstructionAccepted: false,
  }]
  return {
    deterministicEvidence,
    coveragePlan: {
      requestedRanges: [fullRange],
      analyzedRanges: [fullRange],
      incompleteRanges: [],
      sceneBoundaryRefs: [ref('source-scene-boundaries')],
      samplingPolicies: [{
        policyId: 'complete-source-scene-aware',
        policyVersion: 'complete-source-scene-aware-v1',
        mode: 'scene_aware_complete_coverage',
        targetFramesPerSecondNumerator: 2,
        targetFramesPerSecondDenominator: 1,
        sceneAware: true,
        highDetail: true,
        requestedRange: fullRange,
        analyzedRange: fullRange,
        samplingPolicyRef: ref('source-sampling-policy'),
      }],
      targetedFollowupRanges: [],
      completeRequestedRangeCoverage: true,
      everyTimelineFrameInspected: false,
      completeTimePixelInspectionClaimAllowed: false,
    },
    privateMediaInputs: [{
      artifactId: 'source-video-1',
      gcsUri: 'gs://reeditpro-source-media/source-video-1.mp4',
      contentType: 'video/mp4',
      checksumSha256: rawSha('source-video-1'),
      exactGenerationRereadVerified: true,
    }],
    transcriptVersion: 'faster-whisper-large-v3-authority-v1',
    ocrVersion: 'paddleocr-exact-visible-text-v1',
    toolExecutionEvidence: [
      'ffprobe',
      'ffmpeg',
      'pyscenedetect',
      'opencv',
    ].map((tool) => ({
      tool: tool as 'ffprobe' | 'ffmpeg' | 'pyscenedetect' | 'opencv',
      requirement: 'required' as const,
      executionClass: 'l4_gpu_standard' as const,
      releaseRef: ref(`${tool}-qualified-release`),
      executionRef: ref(`${tool}-source-execution`),
      substantiveCpuExecutionUsed: false as const,
      sourceArtifactChecksumBound: true as const,
    })),
    preparedEvidenceRef: ref('source-prepared-evidence', {
      requestDigestSha256,
      l4GpuEvidencePrepared: true,
      substantiveCpuMediaProcessingUsed: false,
    }),
  }
}
