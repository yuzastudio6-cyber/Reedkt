import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  OrchestraEvidenceRef,
  OrchestraSkillCall,
  OrchestraSkillScope,
  SkillCapabilityManifest,
  SkillQualificationSnapshot,
} from '../../src/types/orchestra-skill-capability'
import {
  ORCHESTRA_SKILL_CALL_VERSION,
  ORCHESTRA_SKILL_QUALIFICATION_SNAPSHOT_VERSION,
} from '../../src/types/orchestra-skill-capability'
import type {
  VisualIntelligenceEvidence,
  VisualIntelligenceEvidenceRef,
  VisualIntelligenceCostPreflight,
  VisualIntelligencePreparedEvidence,
  VisualIntelligenceRequest,
  VisualIntelligenceToolExecutionEvidence,
} from '../../src/types/visual-intelligence'
import {
  VISUAL_INTELLIGENCE_MODEL_ID,
} from '../../src/types/visual-intelligence'
import {
  assertRuntimeCanStart,
  loadRuntimeEnv,
} from '../config/env'
import { ApiError } from '../errors/api-error'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createEditReferenceVisualIntelligenceOrchestraBindingRequest,
} from '../edit-references/edit-reference-visual-intelligence-result-bridge'
import {
  createCanonicalSourceLedSourceFrameAuthority,
} from '../services/canonical-source-led-content-analysis-evidence'
import {
  prepareCanonicalSourceVisualIntelligenceOrchestraBindingRequest,
} from '../services/canonical-source-visual-intelligence-orchestra-result-bridge'
import {
  createOrchestraSkillCall,
  createSkillQualificationSnapshot,
  orchestraDigest,
  orchestraEvidenceRef,
  parseOrchestraSkillJobResult,
} from '../orchestra/orchestra-skill-capability-contract'
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
  VisualIntelligenceProviderTrafficGuardPort,
} from '../visual-intelligence/visual-intelligence-provider-traffic-guard'
import type {
  VisualIntelligencePrivateObjectReadPort,
} from '../visual-intelligence/visual-intelligence-private-object-read-port'
import {
  createVisualIntelligenceProductionRuntime,
} from '../visual-intelligence/visual-intelligence-production-runtime'
import {
  createVisualIntelligenceOrchestraCapabilityManifest,
  createVisualIntelligenceOrchestraCapabilityManifestForQualification,
  createVisualIntelligenceOrchestraQualificationSnapshot,
} from '../visual-intelligence/visual-intelligence-orchestra-capability-manifest'
import type {
  VisualIntelligenceOrchestraCompilationEvidence,
} from '../visual-intelligence/visual-intelligence-orchestra-invocation-compiler'
import {
  createVisualIntelligenceOrchestraInvocationCompiler,
} from '../visual-intelligence/visual-intelligence-orchestra-invocation-compiler'
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
  'private/visual-intelligence/pricing/account-effective/v2/rate.json'
const releaseGeneration = '101'
const rateGeneration = '102'
const releaseEtag = 'release-etag-101'
const rateEtag = 'rate-etag-102'
const controlPlaneBucket = 'reeditpro-control-plane'

const accountRate = createControlledVisualIntelligenceAccountEffectiveRateAuthority({
  schemaVersion: 'visual-intelligence-account-effective-rate-authority-v2',
  evidenceClass: 'billing_account_effective_pricing_api_reread',
  billingAccountPricingScopeRef: ref('billing-account-pricing-scope'),
  pricingReaderConfigurationRef: ref('gemini-price-reader-configuration'),
  pricingApiObservationRef: ref('gemini-account-price-observation'),
  exactModelBillingSkuCompatibilityQualificationRef:
    ref('gemini-3-1-pro-billing-sku-qualification'),
  exactModelId: VISUAL_INTELLIGENCE_MODEL_ID,
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

function controlledRateTerms() {
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
let trafficGuardAcquired = 0
let trafficGuardReleased = 0
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
const providerTrafficGuardPort: VisualIntelligenceProviderTrafficGuardPort = {
  async acquire(input) {
    trafficGuardAcquired += 1
    return {
      status: 'acquired',
      lease: { ownerId: input.ownerId } as never,
    }
  },
  async release() {
    trafficGuardReleased += 1
    return {} as never
  },
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
  providerTrafficGuardPort,
  generatePort,
  now: () => now,
})
assert.ok(runtime)
assert.equal(runtime.schemaVersion, 'visual-intelligence-production-runtime-v19')
assert.equal(runtime.providerTrafficGuardPort, providerTrafficGuardPort)
assert.equal(runtime.captionPostrenderOwnerResultRepository.authorityBoundary,
  'canonical_visual_intelligence_postrender_owner')
assert.equal(runtime.captionPostrenderEvidenceRepository.repositoryVersion,
  'canonical-caption-postrender-visual-intelligence-evidence-repository-v1')
assert.equal(runtime.captionPostrenderOwnerService.serviceVersion,
  'canonical-caption-postrender-visual-intelligence-owner-service-v1')
assert.equal(runtime.providerCapabilityId, 'visual_intelligence')
assert.equal(runtime.semanticEngine, 'gemini-3.1-pro-preview')
assert.equal(runtime.thinkingLevel, 'high')
assert.equal(runtime.mediaResolution, 'high')
assert.equal(runtime.applicationDefaultCredentialsUsed, true)
assert.equal(runtime.apiKeyUsed, false)
assert.equal(runtime.qwenFallbackAllowed, false)
assert.equal(runtime.selfHostedVisualModelFallbackAllowed, false)
assert.equal(runtime.substantiveCpuMediaProcessingAllowed, false)
assert.equal(
  runtime.skillQualificationRegistryReadPort.schemaVersion,
  'canonical-skill-qualification-registry-v1',
)
assert.equal(
  'persistCreateOnly' in runtime.skillQualificationRegistryReadPort,
  false,
)
assert.equal(
  runtime.specialistSupportResumeRepository.schemaVersion,
  'canonical-specialist-support-resume-repository-v1',
)
assert.equal(
  runtime.captionEvidenceRepository.schemaVersion,
  'canonical-caption-visual-intelligence-evidence-repository-v1',
)
assert.equal(
  runtime.captionSupportService.schemaVersion,
  'canonical-caption-visual-intelligence-support-service-v1',
)
assert.equal(
  runtime.editReferenceBindingStore.schemaVersion,
  'edit-reference-visual-intelligence-orchestra-binding-store-v2',
)
assert.equal(
  runtime.editReferenceReadPort.schemaVersion,
  'edit-reference-visual-intelligence-orchestra-read-port-v1',
)
assert.equal(
  runtime.sourceVideoUnderstandingBindingStore.schemaVersion,
  'canonical-source-visual-intelligence-orchestra-binding-store-v1',
)
assert.equal(
  runtime.sourceVideoUnderstandingReadPort.schemaVersion,
  'canonical-source-visual-intelligence-orchestra-read-port-v1',
)
assert.equal(
  runtime.sourceLedOrchestraPlanningReconciliationPort.schemaVersion,
  'canonical-source-led-orchestra-planning-reconciliation-v1',
)
assert.equal(
  runtime.sourceAnalysisRequestAuthorityRepository.repositoryVersion,
  'canonical-source-analysis-request-authority-repository-v1',
)
const sourceAnalysisPreparationOwner =
  runtime.createSourceAnalysisPreparationOwner({
    finalizedAuthorityReadPort: {
      schemaVersion:
        'canonical-source-analysis-finalized-authority-read-port-v1',
      async readExactFinalizedSource() {
        return null
      },
    },
  })
assert.equal(
  sourceAnalysisPreparationOwner.schemaVersion,
  'canonical-source-analysis-preparation-owner-v2',
)
assert.equal(
  sourceAnalysisPreparationOwner.approximateDurationToFrameInferenceAllowed,
  false,
)
assert.equal(
  runtime.sourceAnalysisProbeAuthorityRepository.repositoryVersion,
  'canonical-source-analysis-probe-authority-repository-v1',
)
assert.equal(
  runtime.sourceTranscriptOrchestraRepository.repositoryVersion,
  'canonical-source-transcript-orchestra-repository-v1',
)
assert.equal(
  runtime.sourceAnalysisL4VisualEvidenceRepository.repositoryVersion,
  'canonical-source-analysis-l4-visual-evidence-repository-v4',
)
assert.equal(
  runtime.sourceAnalysisL4VisualEvidenceAuthorityRepository.repositoryVersion,
  'canonical-source-analysis-l4-visual-evidence-authority-repository-v1',
)
assert.equal(
  runtime.sourceAnalysisL4VisualEvidenceAuthorityRepository
    .admissionReadPort.schemaVersion,
  'canonical-source-analysis-l4-visual-evidence-admission-read-port-v1',
)
assert.equal(
  runtime.sourceAnalysisL4VisualEvidenceAuthorityRepository
    .releaseReadPort.schemaVersion,
  'canonical-source-analysis-l4-visual-evidence-release-read-port-v1',
)
assert.equal(
  runtime.sourceAnalysisL4VisualEvidenceAuthorityRepository
    .terminalReadPort.schemaVersion,
  'canonical-source-analysis-l4-visual-evidence-terminal-read-port-v1',
)
assert.equal(
  runtime.sourceAnalysisL4VisualEvidenceAuthorityRepository
    .cloudRunOperationAuthorityPort.schemaVersion,
  'canonical-source-analysis-l4-visual-evidence-cloud-run-operation-authority-port-v1',
)
assert.equal(
  runtime.sourceAnalysisL4VisualEvidenceWorkerBootstrapOwner.schemaVersion,
  'canonical-source-analysis-l4-visual-evidence-worker-bootstrap-owner-v3',
)
assert.equal(
  runtime.sourceAnalysisL4VisualEvidenceWorkerBootstrapOwner
    .cloudRunEnvironmentMayContainOnlyInvocationId,
  true,
)
assert.equal(
  runtime.sourceAnalysisL4VisualEvidenceWorkerEvidenceOwner.schemaVersion,
  'canonical-source-analysis-l4-visual-evidence-worker-evidence-owner-v1',
)
assert.equal(
  runtime.sourceAnalysisL4VisualEvidenceToolArtifactOwner.schemaVersion,
  'canonical-source-analysis-l4-visual-evidence-tool-artifact-read-port-v1',
)
assert.equal(
  runtime.sourceAnalysisL4VisualEvidenceToolArtifactOwner.ownerVersion,
  'canonical-source-analysis-l4-visual-evidence-tool-artifact-owner-v1',
)
assert.equal(
  runtime.sourceAnalysisL4VisualEvidenceToolchainQualificationOwner
    .schemaVersion,
  'canonical-source-analysis-l4-visual-evidence-toolchain-qualification-read-port-v2',
)
assert.equal(
  runtime.sourceAnalysisL4VisualEvidenceToolchainQualificationOwner
    .ownerVersion,
  'canonical-source-analysis-l4-visual-evidence-toolchain-qualification-owner-v2',
)
assert.equal(
  runtime.sourceAnalysisL4VisualEvidenceTerminalReconciliationOwner
    .schemaVersion,
  'canonical-source-analysis-l4-visual-evidence-terminal-reconciliation-owner-v1',
)
assert.equal(
  runtime.sourceAnalysisL4VisualEvidenceTerminalReconciliationOwner
    .workerMayClaimTerminalOrScaleToZero,
  false,
)
assert.equal(
  typeof runtime.createSourceAnalysisL4ProbeAttemptOwner,
  'function',
)
assert.equal(
  typeof runtime.createSourceAnalysisL4VisualEvidenceAttemptOwner,
  'function',
)
assert.equal(
  typeof runtime.createSourceAnalysisL4VisualEvidenceAdmissionOwner,
  'function',
)
assert.equal(
  typeof runtime.createSourceTranscriptA100AttemptOwner,
  'function',
)
assert.equal(
  typeof runtime.createSourceAnalysisOrchestraCoordinator,
  'function',
)
const missingSourceCleanupAuthority =
  await runtime.sourceCleanupAuthorityRepository.readForPlanning({
    ownerUserId: 'user-1',
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    editSessionId: 'edit-1',
    planningDirectionDigestSha256: rawSha('source-planning-direction'),
    userInstructionDigestSha256: rawSha('source-instructions'),
    sources: [{
      sourceSequenceItemId: 'source-item-1',
      mediaAssetId: 'source-video-1',
      uploadedOrder: 1,
      checksumSha256: rawSha('source-video-1'),
    }],
  })
assert.equal(missingSourceCleanupAuthority.status, 'not_found')

const costPreflight = await runtime.costOwner.createPreflight({
  requestId: 'visual-production-source-request-1',
  maximumInputTokenCount: 100_000,
  maximumOutputAndThinkingTokenCount: 20_000,
  estimatedInputTokenCount: 10_000,
  estimatedOutputAndThinkingTokenCount: 4_000,
})
const finalizedRef = ref('source-finalized')
const probeRef = ref('source-probe')
const transcriptDigestSha256 = rawSha('complete-source-transcript')
const transcriptRef = orchestraEvidenceRef(
  'source-transcript',
  `sha256:${transcriptDigestSha256}`,
)
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
  schemaVersion: 'visual-intelligence-provider-result-v2',
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
  spatialObservations: [],
  targetedFollowupRanges: [],
  warnings: [],
  mediaContentTreatedAsUntrusted: true,
  providerInstructionsFollowedFromMedia: false,
  editingOrRenderingClaimed: false,
}
const baselineOrchestraQualification =
  createVisualIntelligenceOrchestraQualificationSnapshot()
const baselineOrchestraManifest =
  createVisualIntelligenceOrchestraCapabilityManifest()
const orchestraQualification = createQualifiedOrchestraSnapshot({
  baselineQualification: baselineOrchestraQualification,
  baselineManifest: baselineOrchestraManifest,
  qualifiedJobTypes: [
    'scene_primary_subject_identification',
    'source_video_understanding',
    'reference_preference_analysis',
  ],
})
const orchestraManifest =
  createVisualIntelligenceOrchestraCapabilityManifestForQualification(
    orchestraQualification,
  )
const orchestraScope: OrchestraSkillScope = {
  scopeType: 'video',
  sourceArtifactRef: finalizedRef,
  authorizedRanges: [fullRange],
  completeSourceCoverageRequired: true,
  outputId: null,
}
const planningDirectionDigestSha256 = rawSha('professional cleanup direction')
const userInstructionDigestSha256 = rawSha(
  'authenticated saved chat authority',
)
const planningContextAuthorityRef = orchestraEvidenceRef(
  'source-analysis-planning-context',
  orchestraDigest({
    planningDirectionDigestSha256,
    userInstructionDigestSha256,
  }),
)
const orchestraCall = createPlanningOrchestraCall({
  manifest: orchestraManifest,
  qualification: orchestraQualification,
  scope: orchestraScope,
  jobType: 'source_video_understanding',
  suffix: 'production-runtime',
  requiredEvidenceRefs: [probeRef, transcriptRef],
  sceneContextSnapshotRef: planningContextAuthorityRef,
})
const sourceBindingScope = {
  ownerUserId: 'user-1',
  workspaceId: 'workspace-1',
  projectId: 'project-1',
  editSessionId: 'edit-1',
  analysisRunId: 'source-analysis-production-runtime',
  sourceSequenceItemId: 'source-item-1',
  mediaAssetId: 'source-video-1',
  uploadedOrder: 1,
  checksumSha256: rawSha('source-video-1'),
  byteLength: 1_000_000,
  durationFrames: 240,
  sourceFrameAuthority: createCanonicalSourceLedSourceFrameAuthority({
    fpsNumerator: 24,
    fpsDenominator: 1,
    frameCount: 240,
    timeBaseNumerator: 1,
    timeBaseDenominator: 24,
  }),
  sourceArtifactRef: finalizedRef,
  sourceProbeAuthorityRef: probeRef,
  transcriptAuthorityRef: transcriptRef,
  transcriptDigestSha256,
  planningDirectionDigestSha256,
  userInstructionDigestSha256,
  planningContextAuthorityRef,
} as const
const sourceBindingRequest =
  prepareCanonicalSourceVisualIntelligenceOrchestraBindingRequest({
    scope: sourceBindingScope,
    orchestraCall,
  })
const orchestraCostPreflight = await runtime.costOwner.createPreflight({
  requestId: orchestraCall.callId,
  maximumInputTokenCount: 100_000,
  maximumOutputAndThinkingTokenCount: 20_000,
  estimatedInputTokenCount: 10_000,
  estimatedOutputAndThinkingTokenCount: 4_000,
})
const orchestraCompilationEvidence = createOrchestraCompilationEvidence({
  call: orchestraCall,
  sourceRequest,
  costPreflight: orchestraCostPreflight,
})
const orchestraPreparedEvidence = preparedEvidence(
  orchestraCall.callDigestSha256,
  probeRef,
  [transcriptRef],
)
const orchestraCompiledRequest = await compileOrchestraRequestForEvidence({
  call: orchestraCall,
  manifest: orchestraManifest,
  qualificationSnapshot: orchestraQualification,
  compilationEvidence: orchestraCompilationEvidence,
})
const orchestraPreparedRecord =
  await runtime.canonicalPreparedEvidenceStore.persistCreateOnly({
    ownerClass: 'canonical_source_analysis_evidence_owner',
    ownerAuthorityRef: ref('source-analysis-evidence-owner'),
    request: orchestraCompiledRequest,
    preparedEvidence: orchestraPreparedEvidence,
  })
const replayedPreparedRecord =
  await runtime.canonicalPreparedEvidenceStore.persistCreateOnly({
    ownerClass: 'canonical_source_analysis_evidence_owner',
    ownerAuthorityRef: ref('source-analysis-evidence-owner'),
    request: orchestraCompiledRequest,
    preparedEvidence: orchestraPreparedEvidence,
  })
assert.equal(replayedPreparedRecord.disposition, 'identical_replay')
assert.deepEqual(
  replayedPreparedRecord.recordRef,
  orchestraPreparedRecord.recordRef,
)
await assert.rejects(
  runtime.canonicalPreparedEvidenceStore.persistCreateOnly({
    ownerClass: 'canonical_planning_evidence_owner',
    ownerAuthorityRef: ref('source-analysis-evidence-owner'),
    request: orchestraCompiledRequest,
    preparedEvidence: orchestraPreparedEvidence,
  }),
)
await assert.rejects(
  runtime.canonicalPreparedEvidenceStore.persistCreateOnly({
    ownerClass: 'canonical_source_analysis_evidence_owner',
    ownerAuthorityRef: ref('source-analysis-evidence-owner'),
    request: orchestraCompiledRequest,
    preparedEvidence: orchestraPreparedEvidence,
    callerPreparedEvidenceAccepted: true,
  } as unknown as Parameters<
    typeof runtime.canonicalPreparedEvidenceStore.persistCreateOnly
  >[0]),
)
let hostilePreparedEvidenceGetterInvoked = false
const hostilePreparedEvidenceInput = Object.defineProperty({
  ownerClass: 'canonical_source_analysis_evidence_owner',
  ownerAuthorityRef: ref('source-analysis-evidence-owner'),
  request: orchestraCompiledRequest,
}, 'preparedEvidence', {
  enumerable: true,
  get() {
    hostilePreparedEvidenceGetterInvoked = true
    return orchestraPreparedEvidence
  },
})
await assert.rejects(
  runtime.canonicalPreparedEvidenceStore.persistCreateOnly(
    hostilePreparedEvidenceInput as unknown as Parameters<
      typeof runtime.canonicalPreparedEvidenceStore.persistCreateOnly
    >[0],
  ),
)
assert.equal(hostilePreparedEvidenceGetterInvoked, false)
const hostilePreparedEvidenceProxy = new Proxy({}, {
  ownKeys() {
    throw new Error('hostile prepared evidence ownKeys trap invoked')
  },
})
await assert.rejects(
  runtime.canonicalPreparedEvidenceStore.persistCreateOnly(
    hostilePreparedEvidenceProxy as unknown as Parameters<
      typeof runtime.canonicalPreparedEvidenceStore.persistCreateOnly
    >[0],
  ),
  (error: unknown) => error instanceof ApiError
    && error.code === 'TOOL_NOT_READY',
)
const orchestraDispatchInput = {
  call: orchestraCall,
  supportRequest: null,
  manifest: orchestraManifest,
  qualificationSnapshot: orchestraQualification,
  compilationEvidence: orchestraCompilationEvidence,
  preparedEvidenceRef: orchestraPreparedRecord.recordRef,
  inspectionRequirement: null,
  orchestraDispatchAuthorityRef: orchestraCall.orchestraJobRef,
} as const
await assert.rejects(
  runtime.orchestraDispatchPackageStore.persistCreateOnly({
    ...orchestraDispatchInput,
    orchestraDispatchAuthorityRef: ref('caller-invented-dispatch-authority'),
  }),
)
await assert.rejects(
  runtime.orchestraDispatchPackageStore.persistCreateOnly({
    ...orchestraDispatchInput,
    compilationEvidence: {
      ...orchestraCompilationEvidence,
      exactOrchestraPlanAndJobReread: false,
    } as unknown as VisualIntelligenceOrchestraCompilationEvidence,
  }),
)
await assert.rejects(
  runtime.orchestraDispatchPackageStore.persistCreateOnly({
    ...orchestraDispatchInput,
    preparedEvidenceRef: ref('caller-invented-prepared-evidence'),
  }),
)
await assert.rejects(
  runtime.orchestraDispatchPackageStore.persistCreateOnly({
    ...orchestraDispatchInput,
    preparedEvidence: orchestraPreparedEvidence,
  } as unknown as typeof orchestraDispatchInput),
)
const hostileDispatchProxy = new Proxy({}, {
  ownKeys() {
    throw new Error('hostile dispatch ownKeys trap invoked')
  },
})
await assert.rejects(
  runtime.orchestraDispatchPackageStore.persistCreateOnly(
    hostileDispatchProxy as unknown as typeof orchestraDispatchInput,
  ),
  (error: unknown) => error instanceof ApiError
    && error.code === 'TOOL_NOT_READY',
)
const persistedDispatch = await runtime.orchestraDispatchPackageStore
  .persistCreateOnly(orchestraDispatchInput)
assert.equal(persistedDispatch.disposition, 'created')
const replayedDispatch = await runtime.orchestraDispatchPackageStore
  .persistCreateOnly(orchestraDispatchInput)
assert.equal(replayedDispatch.disposition, 'identical_replay')
providerPayload = {
  ...(providerPayload as Record<string, unknown>),
  requestId: orchestraCall.callId,
}
await assert.rejects(
  runtime.orchestraJobRuntimePort.execute({
    call: orchestraCall,
    supportRequest: null,
    authenticatedOwnerUserId: 'user-1',
    expectedWorkspaceId: 'workspace-1',
  }),
  (error: unknown) => error instanceof ApiError
    && error.code === 'IDEMPOTENCY_CONFLICT',
)
assert.equal(providerCalls, 0)
await assert.rejects(
  runtime.orchestraJobRuntimePort.execute({
    call: orchestraCall,
    supportRequest: null,
    authenticatedOwnerUserId: 'user-1',
    expectedWorkspaceId: 'workspace-1',
    consumerBindingRequest: {
      ...sourceBindingRequest,
      scope: {
        ...sourceBindingRequest.scope,
        userInstructionDigestSha256: rawSha('stale saved chat authority'),
      },
    },
  }),
  (error: unknown) => error instanceof ApiError
    && error.code === 'IDEMPOTENCY_CONFLICT',
)
assert.equal(providerCalls, 0)
const orchestraExecution = await runtime.orchestraJobRuntimePort.execute({
  call: orchestraCall,
  supportRequest: null,
  authenticatedOwnerUserId: 'user-1',
  expectedWorkspaceId: 'workspace-1',
  consumerBindingRequest: sourceBindingRequest,
})
assert.equal(orchestraExecution.status, 'completed')
assert.equal(
  parseOrchestraSkillJobResult(orchestraExecution.result).disposition,
  'completed',
)
assert.equal(orchestraExecution.resultReturnsToOrchestra, true)
assert.equal(
  orchestraExecution.directTimelineOrArtifactMutationPerformed,
  false,
)
assert.equal(orchestraExecution.finalQaApprovalGranted, false)
assert.equal(orchestraExecution.publicDeliveryGranted, false)
assert.equal(orchestraExecution.productionAuthorityGranted, false)
assert.ok(orchestraExecution.consumerBindingRef)
assert.equal(providerCalls, 1)
assert.equal(acquired, 1)
assert.equal(released, 1)
assert.equal(trafficGuardAcquired, 1)
assert.equal(trafficGuardReleased, 1)
const sourceVisualEvidence = await runtime.sourceVideoUnderstandingReadPort
  .readCompletedSourceVideoUnderstanding(sourceBindingScope)
assert.ok(sourceVisualEvidence)
assert.equal(
  'evidenceMode' in sourceVisualEvidence
    ? sourceVisualEvidence.evidenceMode
    : null,
  'visual_intelligence_gemini_pro_high_v1',
)
assert.equal(
  'orchestraLineage' in sourceVisualEvidence
    ? sourceVisualEvidence.orchestraLineage?.resultReturnedThroughOrchestra
    : false,
  true,
)
assert.equal(sourceVisualEvidence.observations.length, 1)
assert.equal(
  await runtime.sourceVideoUnderstandingReadPort
    .readCompletedSourceVideoUnderstanding({
      ...sourceBindingScope,
      analysisRunId: 'source-analysis-stale-revision',
    }),
  null,
)
const orchestraReplay = await runtime.orchestraJobRuntimePort.execute({
  call: orchestraCall,
  supportRequest: null,
  authenticatedOwnerUserId: 'user-1',
  expectedWorkspaceId: 'workspace-1',
  consumerBindingRequest: sourceBindingRequest,
})
assert.equal(orchestraReplay.status, 'cache_replay')
assert.equal(orchestraReplay.providerCallMadeDuringInvocation, false)
assert.equal(orchestraReplay.costSettledDuringInvocation, false)
assert.equal(orchestraReplay.duplicateProviderCallAvoided, true)
assert.equal(orchestraReplay.duplicateCostSettlementAvoided, true)
assert.equal(providerCalls, 1)
await assert.rejects(
  runtime.orchestraJobRuntimePort.execute({
    call: createPlanningOrchestraCall({
      manifest: orchestraManifest,
      qualification: orchestraQualification,
      scope: orchestraScope,
      jobType: 'source_video_understanding',
      suffix: 'not-persisted',
    }),
    supportRequest: null,
    authenticatedOwnerUserId: 'user-1',
    expectedWorkspaceId: 'workspace-1',
  }),
  (error: unknown) => error instanceof ApiError
    && error.code === 'TOOL_NOT_READY',
)
const followupScope: OrchestraSkillScope = {
  scopeType: 'scene',
  sourceArtifactRef: finalizedRef,
  sceneId: 'scene-followup',
  outputId: 'output-vertical',
  authorizedRange: fullRange,
  selectedSceneBindingRef: ref('selected-scene-followup'),
  completeSceneCoverageRequired: true,
}
const followupCall = createPlanningOrchestraCall({
  manifest: orchestraManifest,
  qualification: orchestraQualification,
  scope: followupScope,
  jobType: 'scene_primary_subject_identification',
  suffix: 'followup-without-orchestra-estimate',
})
const followupCostPreflight = await runtime.costOwner.createPreflight({
  requestId: followupCall.callId,
  maximumInputTokenCount: 100_000,
  maximumOutputAndThinkingTokenCount: 20_000,
  estimatedInputTokenCount: 10_000,
  estimatedOutputAndThinkingTokenCount: 4_000,
})
const followupCompilationEvidence = createOrchestraCompilationEvidence({
  call: followupCall,
  sourceRequest,
  costPreflight: followupCostPreflight,
})
const followupPreparedRecord =
  await runtime.canonicalPreparedEvidenceStore.persistCreateOnly({
    ownerClass: 'canonical_planning_evidence_owner',
    ownerAuthorityRef: ref('followup-evidence-owner'),
    request: await compileOrchestraRequestForEvidence({
      call: followupCall,
      manifest: orchestraManifest,
      qualificationSnapshot: orchestraQualification,
      compilationEvidence: followupCompilationEvidence,
    }),
    preparedEvidence: preparedEvidence(
      followupCall.callDigestSha256,
      probeRef,
      [],
      'bounded_query',
    ),
  })
await runtime.orchestraDispatchPackageStore.persistCreateOnly({
  call: followupCall,
  supportRequest: null,
  manifest: orchestraManifest,
  qualificationSnapshot: orchestraQualification,
  compilationEvidence: followupCompilationEvidence,
  preparedEvidenceRef: followupPreparedRecord.recordRef,
  inspectionRequirement: null,
  orchestraDispatchAuthorityRef: followupCall.orchestraJobRef,
})
providerPayload = {
  ...(providerPayload as Record<string, unknown>),
  requestId: followupCall.callId,
  segments: [{
    ...((providerPayload as { segments: Array<Record<string, unknown>> })
      .segments[0]!),
    sourcePlanning: null,
  }],
  spatialObservations: [{
    observationId: 'primary-subject-observation-followup',
    artifactId: 'source-video-1',
    sceneId: 'scene-1',
    range: fullRange,
    role: 'speaker',
    regionBasisPoints: { x: 2_000, y: 1_000, width: 4_000, height: 8_000 },
    confidenceBasisPoints: 9_000,
    temporalStabilityBasisPoints: 8_500,
    measuredContrastRatioMilli: null,
    clutterBasisPoints: 2_000,
    cropResilienceBasisPoints: 7_500,
    compositionBalanceBasisPoints: 8_000,
    findingIds: [],
    evidenceRefs: [probeRef],
    uncertaintyCode: null,
    semanticGeometryOnly: true,
    deterministicPixelGeometryClaimed: false,
  }],
  targetedFollowupRanges: [{
    startFrame: 0,
    endFrameExclusive: 24,
    frameRate,
  }],
}
const blockedFollowup = await runtime.orchestraJobRuntimePort.execute({
  call: followupCall,
  supportRequest: null,
  authenticatedOwnerUserId: 'user-1',
  expectedWorkspaceId: 'workspace-1',
})
assert.equal(blockedFollowup.result.disposition, 'blocked')
assert.deepEqual(blockedFollowup.result.proposedFollowupRanges, [])
assert.equal(blockedFollowup.result.estimatedAdditionalTimeRef, null)
assert.equal(blockedFollowup.result.estimatedAdditionalCreditsRef, null)
assert.equal(blockedFollowup.result.scopeExpandedWithoutOrchestra, false)
assert.ok(blockedFollowup.result.evidenceRefs.some((reference) =>
  reference.id.startsWith('vi-followup-estimate-blocked-')))
assert.equal(providerCalls, 2)
assert.equal(acquired, 2)
assert.equal(released, 2)
const blockedFollowupReplay = await runtime.orchestraJobRuntimePort.execute({
  call: followupCall,
  supportRequest: null,
  authenticatedOwnerUserId: 'user-1',
  expectedWorkspaceId: 'workspace-1',
})
assert.equal(blockedFollowupReplay.status, 'cache_replay')
assert.equal(blockedFollowupReplay.result.disposition, 'blocked')
assert.equal(providerCalls, 2)

const referenceSourceRef = orchestraEvidenceRef(
  'source-video-1',
  `sha256:${rawSha('source-video-1')}`,
)
const referenceEvidenceRef = ref('reference-source-evidence')
const referenceStudyRef = ref('study-1')
const referenceScope: OrchestraSkillScope = {
  scopeType: 'video',
  sourceArtifactRef: referenceSourceRef,
  authorizedRanges: [fullRange],
  completeSourceCoverageRequired: true,
  outputId: null,
}
const referenceCall = createPlanningOrchestraCall({
  manifest: orchestraManifest,
  qualification: orchestraQualification,
  scope: referenceScope,
  jobType: 'reference_preference_analysis',
  suffix: 'reference-preference-analysis',
  requiredEvidenceRefs: [probeRef],
  expectedOutcomeRefs: [ref('reference-preference-outcome')],
})
const referenceCostPreflight = await runtime.costOwner.createPreflight({
  requestId: referenceCall.callId,
  maximumInputTokenCount: 100_000,
  maximumOutputAndThinkingTokenCount: 20_000,
  estimatedInputTokenCount: 10_000,
  estimatedOutputAndThinkingTokenCount: 4_000,
})
const sourceArtifact = sourceRequest.sourceArtifacts[0]!
if (sourceRequest.admission.mode !== 'planning_evidence') {
  throw new TypeError('Reference preference smoke requires planning admission.')
}
const sourcePlanningAdmission = sourceRequest.admission
const referenceRequest = createVisualIntelligenceRequest({
  requestId: referenceCall.callId,
  idempotencyKey: referenceCall.idempotencyKey,
  scope: {
    ownerUserId: 'user-1',
    workspaceId: 'workspace-1',
    projectId: 'reference-1',
    editSessionId: 'study-1',
    approvedSnapshotId: null,
  },
  operation: 'analyze_media',
  profile: 'reference_preference_dna',
  sourceArtifacts: [{
    ...sourceArtifact,
    finalizedMediaAuthorityRef: referenceSourceRef,
  }],
  comparisonArtifacts: [],
  requestedRanges: [fullRange],
  requiredEvidenceRefs: [probeRef],
  expectedOutcomeRefs: [ref('reference-preference-outcome')],
  outputFrame: null,
  protectedZones: [],
  qualityPolicy: sourceRequest.qualityPolicy,
  admission: {
    ...sourcePlanningAdmission,
    finalizedSourceAuthorityRefs: [referenceSourceRef],
    costPreflight: referenceCostPreflight,
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
const referenceCompilationEvidence = createOrchestraCompilationEvidence({
  call: referenceCall,
  sourceRequest: referenceRequest,
  costPreflight: referenceCostPreflight,
})
const referencePreparedRecord =
  await runtime.canonicalPreparedEvidenceStore.persistCreateOnly({
    ownerClass: 'canonical_reference_analysis_evidence_owner',
    ownerAuthorityRef: ref('reference-analysis-evidence-owner'),
    request: await compileOrchestraRequestForEvidence({
      call: referenceCall,
      manifest: orchestraManifest,
      qualificationSnapshot: orchestraQualification,
      compilationEvidence: referenceCompilationEvidence,
    }),
    preparedEvidence: preparedEvidence(
      referenceRequest.requestDigestSha256,
      probeRef,
    ),
  })
await runtime.orchestraDispatchPackageStore.persistCreateOnly({
  call: referenceCall,
  supportRequest: null,
  manifest: orchestraManifest,
  qualificationSnapshot: orchestraQualification,
  compilationEvidence: referenceCompilationEvidence,
  preparedEvidenceRef: referencePreparedRecord.recordRef,
  inspectionRequirement: null,
  orchestraDispatchAuthorityRef: referenceCall.orchestraJobRef,
})
const referenceBindingScope = {
  ownerUserId: 'user-1',
  workspaceId: 'workspace-1',
  editReferenceId: 'reference-1',
  studySessionId: 'study-1',
  sourceArtifactRef: referenceSourceRef,
  sourceEvidenceId: referenceEvidenceRef.id,
  privateAssetId: referenceSourceRef.id,
  sourceEvidenceRef: referenceEvidenceRef,
  studyAuthorityRef: referenceStudyRef,
}
const referenceBindingRequest =
  createEditReferenceVisualIntelligenceOrchestraBindingRequest({
    requestId: 'reference-preference-binding-request',
    scope: referenceBindingScope,
    orchestraCallRef: orchestraEvidenceRef(
      referenceCall.callId,
      referenceCall.callDigestSha256,
    ),
  })
await assert.rejects(runtime.orchestraJobRuntimePort.execute({
  call: referenceCall,
  supportRequest: null,
  consumerBindingRequest: null,
  authenticatedOwnerUserId: 'user-1',
  expectedWorkspaceId: 'workspace-1',
}))
assert.equal(providerCalls, 2)
assert.equal(
  await runtime.editReferenceBindingStore.readExact(referenceBindingScope),
  null,
)
providerPayload = {
  ...(providerPayload as Record<string, unknown>),
  requestId: referenceCall.callId,
  targetedFollowupRanges: [],
  segments: [{
    ...((providerPayload as { segments: Array<Record<string, unknown>> })
      .segments[0]!),
    sourcePlanning: null,
  }],
  spatialObservations: [],
}
const referenceExecution = await runtime.orchestraJobRuntimePort.execute({
  call: referenceCall,
  supportRequest: null,
  consumerBindingRequest: referenceBindingRequest,
  authenticatedOwnerUserId: 'user-1',
  expectedWorkspaceId: 'workspace-1',
})
assert.equal(referenceExecution.status, 'completed')
assert.ok(referenceExecution.consumerBindingRef)
assert.equal(providerCalls, 3)
assert.ok(await runtime.editReferenceBindingStore.readExact(
  referenceBindingScope,
))
const referenceStudy = await runtime.editReferenceReadPort
  .readCompletedReferenceAnalysis(referenceBindingScope)
assert.equal(referenceStudy?.providerModel, 'gemini-3.1-pro-preview')
assert.equal(referenceStudy?.thinkingLevel, 'high')
assert.equal(referenceStudy?.mediaResolution, 'high')
const referenceReplay = await runtime.orchestraJobRuntimePort.execute({
  call: referenceCall,
  supportRequest: null,
  consumerBindingRequest: referenceBindingRequest,
  authenticatedOwnerUserId: 'user-1',
  expectedWorkspaceId: 'workspace-1',
})
assert.equal(referenceReplay.status, 'cache_replay')
assert.equal(referenceReplay.providerCallMadeDuringInvocation, false)
assert.equal(providerCalls, 3)

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
  sourceCleanupAuthorityRepositoryMounted: true,
  canonicalPreparedEvidenceStoreMounted: true,
  orchestraCannotSelfAttestPreparedEvidence: true,
  canonicalRequestPackageConsumed: true,
  captionAuthenticatedSupportServiceMounted: true,
  captionEvidenceRepositoryMounted: true,
  specialistSupportResumeRepositoryMounted: true,
  orchestraDispatchPackageConsumed: true,
  orchestraResultReturnedAndPersisted: true,
  editReferenceOrchestraBindingStoreMounted: true,
  editReferenceOrchestraReadPortMounted: true,
  editReferenceBindingPersistedBeforeProviderExecution: true,
  editReferenceBindingRequiredForReferenceJob: true,
  editReferenceResultRereadThroughConsumerPort: true,
  sourceVideoUnderstandingOrchestraBindingStoreMounted: true,
  sourceVideoUnderstandingOrchestraReadPortMounted: true,
  sourcePlanningReconciliationPortMounted: true,
  sourceHeadReasonerCallerInjectionAllowed: false,
  sourcePreparedRequestAuthorityRepositoryMounted: true,
  sourceAnalysisPreparationOwnerFactoryMounted: true,
  sourceAnalysisProbeAuthorityRepositoryMounted: true,
  sourceTranscriptOrchestraRepositoryMounted: true,
  sourceAnalysisL4ProbeAttemptOwnerFactoryMounted: true,
  sourceAnalysisL4VisualEvidenceAdmissionOwnerFactoryMounted: true,
  sourceAnalysisL4VisualEvidenceAttemptOwnerFactoryMounted: true,
  sourceAnalysisL4VisualEvidenceAuthorityRepositoryMounted: true,
  sourceAnalysisL4VisualEvidenceWorkerBootstrapOwnerMounted: true,
  sourceAnalysisL4VisualEvidenceWorkerEvidenceOwnerMounted: true,
  sourceAnalysisL4VisualEvidenceToolArtifactOwnerMounted: true,
  sourceAnalysisL4VisualEvidenceToolchainQualificationOwnerMounted: true,
  sourceAnalysisL4VisualEvidenceTerminalReconciliationOwnerMounted: true,
  sourceAnalysisL4VisualEvidenceWorkerReceivesInvocationIdOnly: true,
  sourceAnalysisL4VisualEvidenceCallerPortInjectionAllowed: false,
  sourceTranscriptA100AttemptOwnerFactoryMounted: true,
  sourceAnalysisOrchestraCoordinatorFactoryMounted: true,
  sourcePreparationRequiresExactL4ProbeAuthority: true,
  sourceBindingPersistedBeforeProviderExecution: true,
  sourceBindingRequiresProbeTranscriptAndPlanningContext: true,
  staleSavedChatAuthorityRefusedBeforeProviderExecution: true,
  staleSourceAnalysisScopeReturnsNoEvidence: true,
  sourceResultRereadThroughOrchestraConsumerPort: true,
  orchestraReplayAvoidedDuplicateProviderAndCost: true,
  unpersistedDirectCallRefused: true,
  followupWithoutOrchestraEstimateBlocked: true,
  providerCallCount: providerCalls,
  immutableCacheReplay: true,
  applicationDefaultCredentialsRequired: true,
  apiKeyAllowed: false,
  qwenFallbackAllowed: false,
  substantiveCpuMediaProcessingAllowed: false,
  disabledRuntimeStartedProvider: false,
  tamperedReleaseCoordinateRefused: true,
}))

function createQualifiedOrchestraSnapshot(input: {
  baselineQualification: SkillQualificationSnapshot
  baselineManifest: SkillCapabilityManifest
  qualifiedJobTypes: readonly string[]
}): SkillQualificationSnapshot {
  const qualified = new Set(input.qualifiedJobTypes)
  return createSkillQualificationSnapshot({
    schemaVersion: ORCHESTRA_SKILL_QUALIFICATION_SNAPSHOT_VERSION,
    snapshotId: 'visual-intelligence-production-runtime-qualification',
    skillKey: input.baselineQualification.skillKey,
    skillVersion: input.baselineQualification.skillVersion,
    contractVersion: input.baselineQualification.contractVersion,
    capabilityDefinitionDigestSha256:
      input.baselineManifest.capabilityDefinitionDigestSha256,
    observedReleaseRef: ref('visual-intelligence-production-release'),
    observedAt: now.toISOString(),
    overall: 'partially_qualified',
    jobQualifications: input.baselineQualification.jobQualifications.map(
      (item) => qualified.has(item.jobType)
        ? {
            jobType: item.jobType,
            status: 'qualified' as const,
            blockerCodes: [],
            qualifiedRouteIds: input.baselineManifest.toolRoutes
              .filter((route) => route.jobTypes.includes(item.jobType))
              .map((route) => route.routeId)
              .sort(compare),
            qualificationEvidenceRefs: [ref(
              `qualification-${item.jobType}`,
            )],
          }
        : item,
    ),
    callerCanSelfQualify: false,
    qualificationOwner: 'canonical_skill_qualification_registry',
    dispatchAuthorityGranted: false,
    providerAuthorityGranted: false,
    billingAuthorityGranted: false,
    publicDeliveryAuthorityGranted: false,
    productionAuthorityGranted: false,
  })
}

function createPlanningOrchestraCall(input: {
  manifest: SkillCapabilityManifest
  qualification: SkillQualificationSnapshot
  scope: OrchestraSkillScope
  jobType: 'scene_primary_subject_identification'
    | 'source_video_understanding'
    | 'reference_preference_analysis'
  suffix: string
  requiredEvidenceRefs?: readonly OrchestraEvidenceRef[]
  expectedOutcomeRefs?: readonly OrchestraEvidenceRef[]
  sceneContextSnapshotRef?: OrchestraEvidenceRef | null
}): OrchestraSkillCall {
  return createOrchestraSkillCall({
    schemaVersion: ORCHESTRA_SKILL_CALL_VERSION,
    callId: `orchestra-source-understanding-${input.suffix}`,
    orchestraPlanRef: ref('orchestra-production-plan'),
    orchestraJobRef: ref(`orchestra-production-job-${input.suffix}`),
    parentJobRef: null,
    requestedBy: { kind: 'orchestra' },
    targetSkillKey: 'visual_intelligence',
    jobType: input.jobType,
    phase: 'planning',
    scope: input.scope,
    sceneContextSnapshotRef: input.sceneContextSnapshotRef
      ?? (input.scope.scopeType === 'video'
        ? null
        : ref(`scene-context-${input.suffix}`)),
    sourceArtifactRefs: [input.scope.sourceArtifactRef],
    comparisonArtifactRefs: [],
    expectedOutcomeRefs: [...(input.expectedOutcomeRefs ?? [])],
    requiredEvidenceRefs: [...(input.requiredEvidenceRefs ?? [probeRef])],
    manifestRef: orchestraEvidenceRef(
      input.manifest.manifestId,
      input.manifest.manifestDigestSha256,
    ),
    qualificationSnapshotRef: orchestraEvidenceRef(
      input.qualification.snapshotId,
      input.qualification.snapshotDigestSha256,
    ),
    timeBudgetRef: ref(`time-budget-${input.suffix}`),
    creditBudgetRef: ref(`credit-budget-${input.suffix}`),
    attemptEnvelopeRef: ref(`attempt-envelope-${input.suffix}`),
    approvedSnapshotRef: null,
    idempotencyKey: `orchestra-${input.jobType}-${input.suffix}`,
    orchestraDispatchAuthorized: true,
    directProviderCallAllowed: false,
    directTimelineMutationAllowed: false,
    directArtifactMutationAllowed: false,
    scopeExpansionAllowed: false,
    peerSkillExecutionAuthorityAccepted: false,
  })
}

function createOrchestraCompilationEvidence(input: {
  call: OrchestraSkillCall
  sourceRequest: VisualIntelligenceRequest
  costPreflight: VisualIntelligenceCostPreflight
}): VisualIntelligenceOrchestraCompilationEvidence {
  if (input.sourceRequest.admission.mode !== 'planning_evidence') {
    throw new TypeError('Production smoke source request must be planning evidence.')
  }
  const callRef = orchestraEvidenceRef(
    input.call.callId,
    input.call.callDigestSha256,
  )
  const admission = {
    ...input.sourceRequest.admission,
    costPreflight: input.costPreflight,
  }
  return {
    schemaVersion: 'visual-intelligence-orchestra-compilation-evidence-v1',
    callRef,
    manifestRef: input.call.manifestRef,
    qualificationSnapshotRef: input.call.qualificationSnapshotRef,
    timeBudgetRef: input.call.timeBudgetRef,
    creditBudgetRef: input.call.creditBudgetRef,
    attemptEnvelopeRef: input.call.attemptEnvelopeRef,
    requestScope: input.sourceRequest.scope,
    sourceArtifacts: input.sourceRequest.sourceArtifacts,
    comparisonArtifacts: [],
    requiredEvidenceRefs: input.call.requiredEvidenceRefs,
    expectedOutcomeRefs: input.call.expectedOutcomeRefs,
    outputFrame: input.call.scope.outputId === null
      ? null
      : {
          outputId: input.call.scope.outputId,
          aspectRatioLabel: '9:16',
          aspectRatioNumerator: 9,
          aspectRatioDenominator: 16,
          width: 1080,
          height: 1920,
          frameRate,
          confirmedOutputFrameRef: ref('confirmed-output-frame'),
          confirmedByUser: true,
        },
    protectedZones: [],
    admission,
    budgetBindingDigestSha256: orchestraDigest({
      callRef,
      timeBudgetRef: input.call.timeBudgetRef,
      creditBudgetRef: input.call.creditBudgetRef,
      attemptEnvelopeRef: input.call.attemptEnvelopeRef,
      costPreflight: input.costPreflight,
    }),
    exactOrchestraPlanAndJobReread: true,
    exactManifestAndQualificationReread: true,
    exactMediaAuthoritiesReread: true,
    exactSceneContextReread: true,
    exactTimeAndCreditBudgetsReread: true,
    exactAttemptEnvelopeReread: true,
    callerPromptAccepted: false,
    directProviderCallMade: false,
    directTimelineMutationPerformed: false,
  }
}

async function compileOrchestraRequestForEvidence(input: {
  call: OrchestraSkillCall
  manifest: SkillCapabilityManifest
  qualificationSnapshot: SkillQualificationSnapshot
  compilationEvidence: VisualIntelligenceOrchestraCompilationEvidence
}): Promise<VisualIntelligenceRequest> {
  const compiler = createVisualIntelligenceOrchestraInvocationCompiler({
    authorityRegistryPort: {
      async readExact() {
        return {
          manifest: input.manifest,
          qualificationSnapshot: input.qualificationSnapshot,
        }
      },
    },
    compilationPort: {
      async prepareExact() {
        return input.compilationEvidence
      },
    },
  })
  return (await compiler.compile({
    call: input.call,
    supportRequest: null,
  })).request
}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

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
    WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME:
      'billingAccounts/000000-000000-000000',
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
  additionalEvidenceRefs: readonly VisualIntelligenceEvidenceRef[] = [],
  profileMode: 'source_analysis' | 'bounded_query' = 'source_analysis',
): VisualIntelligencePreparedEvidence {
  const transcriptRefs = additionalEvidenceRefs.length > 0
    ? additionalEvidenceRefs
    : [ref('source-transcript-default')]
  const ffmpegEvidenceRef = ref('source-private-proxy-evidence')
  const sceneEvidenceRef = ref('source-scene-boundaries')
  const opencvEvidenceRef = ref('source-opencv-measurements')
  const ocrEvidenceRef = ref('source-ocr-evidence')
  const samplingPolicyRef = ref('source-sampling-policy')
  const deterministicEvidence = ([
    {
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
    },
    {
      evidenceId: ffmpegEvidenceRef.id,
      evidenceRef: ffmpegEvidenceRef,
      artifactId: 'source-video-1',
      range: fullRange,
      authority: 'media_transform',
      producingTool: 'ffmpeg',
      toolVersion: 'ffmpeg-8.0',
      summary: 'The exact private analysis proxy and sampling plan were verified.',
      privateEvidence: true,
      providerInstructionAccepted: false,
    },
    {
      evidenceId: sceneEvidenceRef.id,
      evidenceRef: sceneEvidenceRef,
      artifactId: 'source-video-1',
      range: fullRange,
      authority: 'scene_detection',
      producingTool: 'pyscenedetect',
      toolVersion: 'pyscenedetect-0.7',
      summary: 'Scene-aware complete-source boundaries were verified.',
      privateEvidence: true,
      providerInstructionAccepted: false,
    },
    {
      evidenceId: opencvEvidenceRef.id,
      evidenceRef: opencvEvidenceRef,
      artifactId: 'source-video-1',
      range: fullRange,
      authority: 'pixel_measurement',
      producingTool: 'opencv',
      toolVersion: 'opencv-4.13',
      summary: 'Deterministic full-range visual measurements were verified.',
      privateEvidence: true,
      providerInstructionAccepted: false,
    },
    {
      evidenceId: ocrEvidenceRef.id,
      evidenceRef: ocrEvidenceRef,
      artifactId: 'source-video-1',
      range: fullRange,
      authority: 'exact_ocr',
      producingTool: 'ocr',
      toolVersion: 'paddleocr-exact-visible-text-v1',
      summary: 'Exact visible-text evidence was verified.',
      privateEvidence: true,
      providerInstructionAccepted: false,
    },
    {
      evidenceId: samplingPolicyRef.id,
      evidenceRef: samplingPolicyRef,
      artifactId: 'source-video-1',
      range: fullRange,
      authority: 'media_transform',
      producingTool: 'ffmpeg',
      toolVersion: 'ffmpeg-8.0',
      summary: 'The complete scene-aware sampling policy was verified.',
      privateEvidence: true,
      providerInstructionAccepted: false,
    },
    ...transcriptRefs.map((evidenceRef) => ({
      evidenceId: evidenceRef.id,
      evidenceRef,
      artifactId: 'source-video-1',
      range: fullRange,
      authority: 'canonical_transcript' as const,
      producingTool: 'faster_whisper' as const,
      toolVersion: 'faster-whisper-large-v3-authority-v1',
      summary: 'Authenticated complete-source transcript authority was reread.',
      privateEvidence: true as const,
      providerInstructionAccepted: false as const,
    })),
  ] satisfies VisualIntelligenceEvidence[]).filter(
    (evidence) => profileMode === 'source_analysis'
    || !['pyscenedetect', 'faster_whisper', 'ocr'].includes(
      evidence.producingTool,
    ),
  )
  return {
    deterministicEvidence,
    coveragePlan: {
      requestedRanges: [fullRange],
      analyzedRanges: [fullRange],
      incompleteRanges: [],
      sceneBoundaryRefs: profileMode === 'source_analysis'
        ? [sceneEvidenceRef]
        : [],
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
        samplingPolicyRef,
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
    transcriptVersion: profileMode === 'source_analysis'
      ? 'faster-whisper-large-v3-authority-v1'
      : null,
    ocrVersion: profileMode === 'source_analysis'
      ? 'paddleocr-exact-visible-text-v1'
      : null,
    conditionalToolDecisions: profileMode === 'source_analysis' ? [{
      artifactId: 'source-video-1',
      tool: 'faster_whisper',
      disposition: 'executed',
      decisionEvidenceRef: transcriptRefs[0]!,
      exactCanonicalDecisionRereadVerified: true,
      callerDecisionAccepted: false,
    }, {
      artifactId: 'source-video-1',
      tool: 'ocr',
      disposition: 'executed',
      decisionEvidenceRef: ocrEvidenceRef,
      exactCanonicalDecisionRereadVerified: true,
      callerDecisionAccepted: false,
    }] : [],
    toolExecutionEvidence: [
      'ffprobe',
      'ffmpeg',
      'pyscenedetect',
      'opencv',
      'faster_whisper',
      'ocr',
    ].filter((tool) => profileMode === 'source_analysis'
      || !['pyscenedetect', 'faster_whisper', 'ocr'].includes(tool))
      .map((tool) => ({
      tool: tool as VisualIntelligenceToolExecutionEvidence['tool'],
      requirement: (
        tool === 'faster_whisper' || tool === 'ocr'
          ? 'conditional'
          : 'required'
      ) as VisualIntelligenceToolExecutionEvidence['requirement'],
      executionClass: (
        tool === 'faster_whisper'
          ? 'a100_80gb_gpu_heavy'
          : 'l4_gpu_standard'
      ) as VisualIntelligenceToolExecutionEvidence['executionClass'],
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
