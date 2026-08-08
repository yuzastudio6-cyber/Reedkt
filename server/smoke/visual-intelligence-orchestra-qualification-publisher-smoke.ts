import assert from 'node:assert/strict'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSkillQualificationRegistry,
} from '../orchestra/canonical-skill-qualification-registry'
import {
  createVisualIntelligenceEvidenceRef,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  createVisualIntelligenceOrchestraQualificationPublisher,
  parseVisualIntelligenceOrchestraQualificationPublicationReceipt,
} from '../visual-intelligence/visual-intelligence-orchestra-qualification-publisher'
import {
  createControlledVisualIntelligenceRuntimeRelease,
  parseVisualIntelligenceRuntimeRelease,
} from '../visual-intelligence/visual-intelligence-runtime-release'
import {
  VISUAL_INTELLIGENCE_DETERMINISTIC_EVIDENCE_VERSION,
  VISUAL_INTELLIGENCE_PROMPT_VERSION,
  VISUAL_INTELLIGENCE_RESPONSE_SCHEMA_VERSION,
} from '../visual-intelligence/visual-intelligence-profile-registry'

class MemoryObjectPort implements CanonicalCreateOnlyJsonObjectPort {
  readonly values = new Map<string, Buffer>()

  async createOnly(input: {
    readonly objectPath: string
    readonly body: Buffer
    readonly contentSha256: string
  }): Promise<'created' | 'already_exists'> {
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
const qualificationRegistry = createCanonicalSkillQualificationRegistry({
  objectPort,
})
const publisher = createVisualIntelligenceOrchestraQualificationPublisher({
  qualificationRegistry,
})
const runtimeRelease = createControlledVisualIntelligenceRuntimeRelease({
  schemaVersion: 'visual-intelligence-runtime-release-v1',
  evidenceClass:
    'canonical_immutable_visual_intelligence_gemini_pro_high_release_reread',
  projectId: 'reeditpro',
  vertexLocation: 'global',
  lifecycleBucketName: 'reeditpro-production-control-plane',
  runtimeReleaseIdentityRef: ref('visual-intelligence-runtime-release'),
  lifecycleRepositoryReleaseRef: ref('visual-intelligence-lifecycle-release'),
  concurrencyOwnerReleaseRef: ref('visual-intelligence-concurrency-release'),
  sourceEvidencePreparationReleaseRef:
    ref('visual-intelligence-evidence-release'),
  providerModelAccessQualificationRef:
    ref('gemini-model-access-qualification'),
  providerTransportQualificationRef: ref('gemini-transport-qualification'),
  providerPrivacyRetentionReviewRef: ref('gemini-privacy-review'),
  promptInjectionSafetyQualificationRef: ref('gemini-injection-safety'),
  structuredOutputQualificationRef: ref('gemini-structured-output'),
  professionalHighQualityBenchmarkRef:
    ref('gemini-professional-high-benchmark'),
  accountEffectivePricingAuthorityRef: ref('gemini-account-effective-rate'),
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

const first = await publisher.publish({
  runtimeRelease,
  observedAt: '2026-08-08T12:00:00.000Z',
})
const accepted =
  parseVisualIntelligenceOrchestraQualificationPublicationReceipt(first)
assert.equal(accepted.disposition, 'created')
assert.equal(accepted.qualifiedJobTypes.length, 19)
assert.equal(accepted.blockedJobs.length, 10)
assert.ok(accepted.qualifiedJobTypes.includes('source_video_understanding'))
assert.ok(accepted.qualifiedJobTypes.includes('reference_preference_analysis'))
assert.ok(!accepted.qualifiedJobTypes.includes(
  'final_render_visual_review_support',
))
assert.deepEqual(blockers(accepted, 'final_render_visual_review_support'), [
  'complete_time_deterministic_qa_and_private_review_remain_separate',
])
assert.deepEqual(blockers(accepted, 'scene_subject_occlusion_analysis'), [
  'track_all_manifest_and_exact_artifact_route_not_observed',
])
assert.deepEqual(blockers(accepted, 'caption_boundary_readability_analysis'), [
  'exact_l4_ocr_route_not_qualified',
])
assert.equal(JSON.stringify(accepted).includes(
  'live_gemini_3_1_pro_high_release_not_reread',
), false)
assert.equal(JSON.stringify(accepted).includes(
  'exact_video_scene_boundary_media_transport_not_qualified',
), false)
assert.equal(accepted.providerOrModelExecuted, false)
assert.equal(accepted.gpuJobStarted, false)
assert.equal(accepted.customerCreditsMutated, false)
assert.equal(accepted.productionAuthorityGranted, false)

const replay = await publisher.publish({
  runtimeRelease,
  observedAt: '2026-08-08T12:00:00.000Z',
})
assert.equal(replay.disposition, 'identical_replay')
assert.notEqual(replay.receiptDigestSha256, first.receiptDigestSha256)
assert.deepEqual(replay.manifestRef, first.manifestRef)
assert.deepEqual(replay.qualificationSnapshotRef,
  first.qualificationSnapshotRef)

const detached = parseVisualIntelligenceRuntimeRelease(
  structuredClone(runtimeRelease),
)
await assert.rejects(
  publisher.publish({
    runtimeRelease: detached,
    observedAt: '2026-08-08T12:00:00.000Z',
  }),
  (error: unknown) => Boolean(
    error && typeof error === 'object'
    && 'details' in error
    && (error as { details?: { requiredGate?: string } }).details
      ?.requiredGate === 'visual_intelligence_release_not_exact_reread',
  ),
)
assert.throws(() =>
  parseVisualIntelligenceOrchestraQualificationPublicationReceipt({
    ...first,
    qualifiedJobTypes: [...first.qualifiedJobTypes, 'invented_job'],
  }),
)
assert.throws(() =>
  createVisualIntelligenceOrchestraQualificationPublisher({
    qualificationRegistry: {} as never,
  }),
)

console.log(JSON.stringify({
  smoke: 'visual-intelligence-orchestra-qualification-publisher',
  productName: 'WeEditPro',
  exactRuntimeReleaseRereadRequired: true,
  qualifiedJobCount: first.qualifiedJobTypes.length,
  blockedJobCount: first.blockedJobs.length,
  exactOcrRemainsIndependent: true,
  trackAllSam31RemainsIndependent: true,
  completeTimeQaAndPrivateReviewRemainIndependent: true,
  providerOrModelExecuted: false,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))

function ref(id: string) {
  return createVisualIntelligenceEvidenceRef(id, { id })
}

function blockers(
  receipt: typeof accepted,
  jobType: string,
): string[] | undefined {
  return receipt.blockedJobs.find((item) => item.jobType === jobType)
    ?.blockerCodes
}
