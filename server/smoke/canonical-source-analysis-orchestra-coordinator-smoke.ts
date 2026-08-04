import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  ORCHESTRA_SKILL_CALL_VERSION,
  ORCHESTRA_SKILL_JOB_RESULT_VERSION,
} from '../../src/types/orchestra-skill-capability'
import type {
  VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import {
  CANONICAL_SOURCE_ANALYSIS_ORCHESTRA_WORK_READ_PORT_VERSION,
  CANONICAL_SOURCE_ANALYSIS_PLANNING_SCOPE_READ_PORT_VERSION,
  assertCanonicalSourceAnalysisOrchestraWork,
  assertCanonicalSourceAnalysisUserTrigger,
  createCanonicalSourceAnalysisOrchestraCoordinator,
  createCanonicalSourceAnalysisOrchestraWork,
  createCanonicalSourceAnalysisUserTrigger,
} from '../orchestra/canonical-source-analysis-orchestra-coordinator'
import {
  createOrchestraSkillCall,
  createOrchestraSkillJobResult,
  orchestraDigest,
  orchestraEvidenceRef,
} from '../orchestra/orchestra-skill-capability-contract'
import {
  createCanonicalQualityFirstUserTriggeredGpuPolicy,
} from '../edit-architecture/canonical-quality-first-user-triggered-gpu-policy'
import {
  CANONICAL_SOURCE_ANALYSIS_L4_PROBE_ATTEMPT_OWNER_VERSION,
  type CanonicalSourceAnalysisL4ProbeAttemptOwner,
} from '../services/canonical-source-analysis-l4-probe-attempt-owner'
import {
  CANONICAL_SOURCE_ANALYSIS_PREPARATION_OWNER_VERSION,
  type CanonicalSourceAnalysisPreparationOwner,
} from '../services/canonical-source-analysis-preparation-owner'
import {
  createCanonicalSourceCleanupVisualIntelligenceBinding,
} from '../services/canonical-source-cleanup-visual-intelligence-binding'
import {
  canonicalSourceLedTranscriptEvidenceSchema,
  canonicalSourceLedVisualIntelligenceEvidenceSchema,
  createCanonicalSourceLedContentAnalysisEvidence,
  createCanonicalSourceLedSourceFrameAuthority,
  digestCanonicalSourceLedStructuredSelection,
} from '../services/canonical-source-led-content-analysis-evidence'
import {
  CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_READ_PORT_VERSION,
  CANONICAL_SOURCE_LED_ORCHESTRA_PLANNING_RECONCILIATION_VERSION,
  type CanonicalSourceAnalysisPlanningScope,
} from '../services/canonical-source-led-orchestra-planning-reconciliation'
import {
  CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_READ_PORT_VERSION,
} from '../services/canonical-source-led-orchestra-content-analysis-reconciliation'
import {
  createCanonicalSourceLedProfessionalContentAnalysisRequestIdentity,
  type CanonicalVisualIntelligenceSourceTranscriptResult,
} from '../services/canonical-source-visual-intelligence-analysis-contract'
import type {
  CanonicalSourceLedContentReasoningSelection,
} from '../services/canonical-source-led-content-analysis-reasoner'
import type {
  CanonicalSourceLedProfessionalContentAnalysisInput,
} from '../services/canonical-source-led-professional-content-analysis-port'
import {
  CANONICAL_SOURCE_TRANSCRIPT_A100_ATTEMPT_OWNER_VERSION,
  type CanonicalSourceTranscriptA100AttemptOwner,
} from '../services/canonical-source-transcript-a100-attempt-owner'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  VISUAL_INTELLIGENCE_ORCHESTRA_JOB_RUNTIME_VERSION,
  type VisualIntelligenceOrchestraJobRuntime,
} from '../visual-intelligence/visual-intelligence-orchestra-job-runtime'

const sha = (value: string) => createHash('sha256').update(value).digest('hex')
const ref = (
  id: string,
  value: unknown = { id },
): VisualIntelligenceEvidenceRef => orchestraEvidenceRef(
  id,
  `sha256:${sha256AuthorityValue(value)}`,
)
const sequence: string[] = []
const privateFixtureChecksum =
  process.env.REEDITPRO_TEST_PRIVATE_SOURCE_SHA256
const privateFixtureByteLength =
  process.env.REEDITPRO_TEST_PRIVATE_SOURCE_BYTE_LENGTH
if ((privateFixtureChecksum === undefined) !==
  (privateFixtureByteLength === undefined)) {
  throw new Error('Private fixture checksum and byte length must be paired.')
}
if (
  privateFixtureChecksum !== undefined
  && !/^[a-f0-9]{64}$/u.test(privateFixtureChecksum)
) throw new Error('Private fixture checksum is invalid.')
const parsedPrivateFixtureByteLength = privateFixtureByteLength === undefined
  ? null
  : Number(privateFixtureByteLength)
if (
  parsedPrivateFixtureByteLength !== null
  && (!Number.isSafeInteger(parsedPrivateFixtureByteLength)
    || parsedPrivateFixtureByteLength < 1)
) throw new Error('Private fixture byte length is invalid.')
const privateFixtureIdentityBound = privateFixtureChecksum !== undefined
const sourceChecksum = privateFixtureChecksum
  ?? sha('exact-private-source-video-bytes')
const sourceByteLength = parsedPrivateFixtureByteLength ?? 4_096
const planningDirection =
  'Watch the complete source, resolve spoken edit directions, remove only evidence-bound weak sections, and preserve meaning.'
const planningDirectionDigestSha256 = sha(planningDirection)
const userInstructionDigestSha256 = sha('saved-chat-instruction-authority')
const probeRef = ref('source-probe')
const finalizedRef = ref('finalized-source')
const storageRef = ref('finalized-storage')
const transcriptSegments = [{
  segmentId: 'transcript-complete-explanation',
  startFrame: 0,
  endFrameExclusive: 240,
  text: 'Keep this complete explanation.',
  confidenceBasisPoints: 9_800,
  wordsVerified: true,
}]
const transcriptCoverageWithoutDigest = {
  schemaVersion: 'canonical-source-audio-complete-timeline-coverage-v1' as const,
  coveredStartFrame: 0 as const,
  coveredEndFrameExclusive: 240,
  completeAudioTimelineProcessed: true as const,
  speechSegmentsMayOmitSilence: true as const,
  embeddedInstructionDetectionRequired: true as const,
}
const transcript = canonicalSourceLedTranscriptEvidenceSchema.parse({
  status: 'completed',
  modelId: 'faster-whisper-large-v3',
  modelDigestSha256: sha('faster-whisper-large-v3'),
  runtimeVersion: 'faster-whisper-1.2.1',
  transcriptDigestSha256: sha256AuthorityValue(transcriptSegments),
  segments: transcriptSegments,
  coverage: {
    ...transcriptCoverageWithoutDigest,
    coverageDigestSha256: sha256AuthorityValue(
      transcriptCoverageWithoutDigest,
    ),
  },
  rawAudioPersisted: false,
  modelDownloadPerformed: false,
  networkAttempted: false,
})
const transcriptAuthorityRef = orchestraEvidenceRef(
  'source-transcript-authority',
  `sha256:${transcript.transcriptDigestSha256}`,
)
const gpuPolicy = createCanonicalQualityFirstUserTriggeredGpuPolicy()
const transcriptResult: CanonicalVisualIntelligenceSourceTranscriptResult = {
  schemaVersion: 'canonical-visual-intelligence-source-transcript-result-v1',
  transcriptAuthorityRef,
  transcript,
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
    completedRuntimeReleaseRef: ref('a100-transcript-release'),
    fallbackAdmissionRef: null,
    attemptCostEvidenceRefs: [ref('a100-transcript-cost')],
    routePolicyDigestSha256: `sha256:${gpuPolicy.policyHash}`,
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

const request: CanonicalSourceLedProfessionalContentAnalysisInput = {
  workspaceId: 'workspace-1',
  projectId: 'project-1',
  editSessionId: 'edit-1',
  planningDirection,
  planningDirectionDigestSha256,
  userInstructionDigestSha256,
  fps: 30,
  sources: [{
    sourceSequenceItemId: 'source-item-1',
    mediaAssetId: 'media-asset-1',
    uploadedOrder: 1,
    storageProvider: 'google_cloud_storage',
    storageBucket: 'private-source-bucket',
    storagePath: 'workspace-1/source.mp4',
    checksumSha256: sourceChecksum,
    byteLength: sourceByteLength,
    durationFrames: 240,
    managedApiAuthority: {
      ownerUserId: 'user-1',
      storageBucket: 'private-source-bucket',
      storagePath: 'workspace-1/source.mp4',
      contentType: 'video/mp4',
      storageGeneration: '1001',
      storageEtag: 'source-etag-1',
      width: 1_920,
      height: 1_080,
      hasAudio: true,
      audioProbe: {
        disposition: 'verified_audio_stream',
        videoStreamIndex: 0,
        videoStartTimeBaseUnits: 0,
        videoTimeBaseNumerator: 1,
        videoTimeBaseDenominator: 24,
        audioStreamIndex: 1,
        audioStartTimeBaseUnits: 0,
        audioDurationTimeBaseUnits: 480_000,
        audioTimeBaseNumerator: 1,
        audioTimeBaseDenominator: 48_000,
        audioSampleRateHertz: 48_000,
        audioChannelCount: 2,
      },
      fpsNumerator: 24,
      fpsDenominator: 1,
      frameCount: 240,
      sourceTimeBaseNumerator: 1,
      sourceTimeBaseDenominator: 24,
      finalizedMediaAuthorityRef: finalizedRef,
      finalizedStorageObjectAuthorityRef: storageRef,
      sourceBindingManifestCandidateRef: ref('source-binding-manifest'),
      sourceProbeAuthorityRef: probeRef,
      providerMediaReadAuthorityRef: ref('provider-media-read'),
      sourceAnalysisConsentRef: ref('source-analysis-consent'),
      platformAnalysisCostCapRef: ref('source-analysis-cost-cap'),
    },
  }],
}
const identity =
  createCanonicalSourceLedProfessionalContentAnalysisRequestIdentity(request)
const planningScope: CanonicalSourceAnalysisPlanningScope = {
  ownerUserId: 'user-1',
  workspaceId: request.workspaceId,
  projectId: request.projectId,
  editSessionId: request.editSessionId,
  planningDirection,
  planningDirectionDigestSha256,
  userInstructionDigestSha256,
  sources: request.sources.map((source) => ({
    sourceSequenceItemId: source.sourceSequenceItemId,
    mediaAssetId: source.mediaAssetId,
    uploadedOrder: source.uploadedOrder,
    storageProvider: 'google_cloud_storage' as const,
    storageBucket: source.storageBucket,
    storagePath: source.storagePath,
    contentType: 'video/mp4' as const,
    checksumSha256: source.checksumSha256,
    byteLength: source.byteLength,
    storageGeneration: source.managedApiAuthority!.storageGeneration,
    storageEtag: source.managedApiAuthority!.storageEtag,
  })),
}

const sourceFrameAuthority = createCanonicalSourceLedSourceFrameAuthority({
  fpsNumerator: 24,
  fpsDenominator: 1,
  frameCount: 240,
  timeBaseNumerator: 1,
  timeBaseDenominator: 24,
})
const visualObservations = [{
  observationId: 'visual-complete-source-window',
  windowIndex: 1,
  startFrame: 0,
  endFrameExclusive: 240,
  sourceFunction: 'dialogue',
  actionIntensity: 'low',
  editUsability: 'strong',
  cameraStability: 'stable',
  continuity: 'continuous',
  confidenceBasisPoints: 9_600,
  evidenceRefs: [probeRef, transcriptAuthorityRef],
  providerObservationScope:
    'complete_source_range_semantic_partition',
  exactProviderSampleFramesKnown: false,
}] as const
const visualCoverageWithoutDigest = {
  schemaVersion:
    'canonical-source-visual-intelligence-semantic-coverage-v4' as const,
  profileId:
    'visual_intelligence_source_edit_planning_professional_high_v1' as const,
  coveredStartFrame: 0 as const,
  coveredEndFrameExclusive: 240,
  maximumWindowFrames: 240 as const,
  windowCount: 1 as const,
  gapCount: 0 as const,
  completeSourceRangeRequested: true as const,
  completeRequestedRangeSemanticCoverage: true as const,
  orderedGaplessObservationPartition: true as const,
  deterministicGpuEvidenceUsed: true as const,
  providerVisualPreprocessingExpected: true as const,
  everyTimelineFrameInspected: false as const,
  completeTimePixelInspectionClaimAllowed: false as const,
  providerAudioUnderstandingClaimAllowed: false as const,
  completeAudioTranscriptSuppliedToHeadReasonerSeparately: true as const,
}
const visual = canonicalSourceLedVisualIntelligenceEvidenceSchema.parse({
  status: 'completed',
  evidenceMode: 'visual_intelligence_gemini_pro_high_v1',
  providerCapabilityId: 'visual_intelligence',
  providerSkillId: 'visual_intelligence.analyze_media',
  operation: 'analyze_media',
  profile: 'source_edit_planning',
  providerAdapterId: 'vertex_gemini_pro',
  providerId: 'google_vertex_ai',
  providerModel: 'gemini-3.1-pro-preview',
  qualityProfile: 'professional_high',
  thinkingLevel: 'high',
  mediaResolution: 'high',
  requestRef: ref('compiled-visual-request'),
  reportRef: ref('source-visual-report'),
  admissionRef: ref('source-visual-admission'),
  providerReleaseRef: ref('gemini-provider-release'),
  costEvidenceRef: ref('gemini-account-effective-cost'),
  observationDigestSha256: sha256AuthorityValue(visualObservations),
  observations: visualObservations,
  coverage: {
    ...visualCoverageWithoutDigest,
    coverageDigestSha256: sha256AuthorityValue(
      visualCoverageWithoutDigest,
    ),
  },
  lifecycleInvocationDisposition: 'completed',
  providerCallMadeDuringInvocation: true,
  costSettledDuringInvocation: true,
  exactImmutableReportRereadVerified: true,
  applicationDefaultCredentialsUsed: true,
  accountEffectiveBillingRateUsed: true,
  publicListPriceUsedAsSettlementAuthority: false,
  providerVisualPreprocessingExpected: true,
  completeTimePixelInspectionClaimAllowed: false,
  selfHostedQwenRuntimeUsed: false,
  managedQwenApiUsed: false,
  localQwen25VlRuntimeUsed: false,
  signedReadUrlPersisted: false,
  signedReadUrlReturned: false,
  rawModelOutputPersisted: false,
  orchestraLineage: {
    consumerBindingRef: ref('source-orchestra-binding'),
    callRef: ref('source-orchestra-call'),
    compiledRequestRef: ref('compiled-visual-request'),
    resultRef: ref('source-orchestra-result'),
    manifestRef: ref('visual-intelligence-manifest'),
    qualificationSnapshotRef: ref('visual-intelligence-qualification'),
    exactConsumerBindingRereadVerified: true,
    exactOrchestraResultRereadVerified: true,
    resultReturnedThroughOrchestra: true,
    headIntelligenceDirectProviderCallAllowed: false,
    headIntelligenceDirectGpuDispatchAllowed: false,
  },
})
const selection = {
  sources: [{
    sourceSequenceItemId: 'source-item-1',
    mediaAssetId: 'media-asset-1',
    uploadedOrder: 1,
    selectedRanges: [{
      rangeId: 'keep-complete-explanation',
      startFrame: 0,
      endFrameExclusive: 240,
      role: 'main_story',
      reason: 'Keep the complete, clear explanation.',
      confidenceBasisPoints: 9_600,
      phraseBoundaryAligned: true,
      preservesSourceMeaning: true,
      userReviewRequired: false,
      evidenceIds: [
        'transcript-complete-explanation',
        'visual-complete-source-window',
      ],
      keepReasonCodes: ['clear_explanation'],
      removedContextCodes: [],
      decisionBasis: 'content_understanding',
      instructionIds: [],
      timeOnlyDecision: false,
    }],
    removedRanges: [],
    embeddedEditInstructions: [],
  }],
  sourceOrderPreserved: true,
  completeSourceCoverageVerified: true,
  allTimelineIntervalsReviewed: true,
  embeddedInstructionsEvaluated: true,
  timeOnlyCutDecisionCount: 0,
  meaningPreservationPassed: true,
  userReviewRequired: false,
  reviewReasons: [],
} as const satisfies CanonicalSourceLedContentReasoningSelection
const cleanupEvidence = createCanonicalSourceLedContentAnalysisEvidence({
  schemaVersion: 'canonical-source-led-content-analysis-evidence-v5',
  source: 'server_private_source_understanding_pipeline',
  identity: {
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editSessionId: request.editSessionId,
    analysisRunId: identity.analysisRunId,
    userInstructionDigestSha256,
    fps: 30,
  },
  sources: [{
    ...selection.sources[0],
    checksumSha256: sourceChecksum,
    byteLength: sourceByteLength,
    durationFrames: 240,
    sourceFrameAuthority,
    transcript,
    visual,
  }],
  reasoning: {
    status: 'completed',
    routeId: 'kimi_k3_primary',
    providerModel: 'kimi-k3',
    credentialSource: 'google_secret_manager_pinned_version',
    credentialVersion: 1,
    providerCallMade: true,
    modelCallMade: true,
    attemptDigestSha256: sha('head-reasoning-attempt'),
    structuredResultDigestSha256:
      digestCanonicalSourceLedStructuredSelection(selection),
    completeSourceCoverageConfirmed: true,
    allTimelineIntervalsReviewed: true,
    embeddedInstructionsEvaluated: true,
    timeOnlyCutDecisionsAllowed: false,
    rawProviderResponsePersisted: false,
  },
  summary: {
    selectedSourceCount: 1,
    selectedRangeCount: 1,
    selectedTotalFrames: 240,
    originalTotalFrames: 240,
    originalTotalTimelineFrames: 300,
    selectedTotalTimelineFrames: 300,
    rationalSourceFrameMappingVerified: true,
    sourceOrderPreserved: true,
    everySelectionEvidenceBound: true,
    everyRemovalEvidenceBound: true,
    completeSourceCoverageVerified: true,
    allTimelineIntervalsReviewed: true,
    embeddedInstructionsEvaluated: true,
    embeddedInstructionCount: 0,
    unresolvedEmbeddedInstructionCount: 0,
    timeOnlyCutDecisionCount: 0,
    meaningPreservationPassed: true,
    userReviewRequired: false,
  },
  boundaries: {
    privateEvidence: true,
    sourceBytesSerialized: false,
    localPathsSerialized: false,
    rawModelOutputSerialized: false,
    rawChatUsedAsWorkerInstruction: false,
    planPublished: false,
    approvalGranted: false,
    executionStarted: false,
    customerChargeCreated: false,
    publicDeliveryCreated: false,
    productionAuthority: false,
  },
})
const cleanupBinding = createCanonicalSourceCleanupVisualIntelligenceBinding({
  evidence: cleanupEvidence,
  expectedScope: {
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editSessionId: request.editSessionId,
    planningDirectionDigestSha256,
    userInstructionDigestSha256,
  },
})
const cleanupAuthorityRef = Object.freeze({
  id: 'source-cleanup-authority',
  version: 1 as const,
  contentHash: `sha256:${sha256AuthorityValue({
    id: 'source-cleanup-authority',
  })}`,
})
const dispatchPackageRef = ref('source-vi-dispatch-package')

const planningScopeReadPort = {
  schemaVersion: CANONICAL_SOURCE_ANALYSIS_PLANNING_SCOPE_READ_PORT_VERSION,
  async readExactPlanningScope() {
    sequence.push('planning_scope')
    return structuredClone(planningScope)
  },
} as const
const probeAttemptOwner: CanonicalSourceAnalysisL4ProbeAttemptOwner = {
  schemaVersion: CANONICAL_SOURCE_ANALYSIS_L4_PROBE_ATTEMPT_OWNER_VERSION,
  operationId: 'internal.visual_intelligence.probe_source_timing.v1',
  routeProfileId: 'quality_l4_user_triggered_standard_media_job_v1',
  acceleratorClass: 'nvidia_l4',
  userTriggeredScaleFromZero: true,
  minimumIdleInstances: 0,
  maximumAttempts: 1,
  automaticRetryAfterUncertainOutcomeAllowed: false,
  platformFundedPreapprovalAnalysis: true,
  customerCreditMutationAllowed: false,
  async executeOneShot(trigger) {
    sequence.push('l4_probe')
    assert.equal(trigger.sourceIdentity.checksumSha256, sourceChecksum)
    assert.equal(trigger.browserStorageIdentityAccepted, false)
    return {
      status: 'ready',
      disposition: 'created',
      invocationId: 'probe-invocation-1',
      sourceProbeAuthorityRef: probeRef,
      usageCostEvidenceRef: ref('l4-probe-cost'),
      persistedProbeAuthorityExactRereadVerified: true,
      workerResultAndAccountEffectiveCostLineageBound: true,
      scaleBackToZeroVerified: true,
      platformFundedPreapprovalAnalysis: true,
      customerCreditMutated: false,
      publicDeliveryGranted: false,
      productionAuthorityGranted: false,
    }
  },
}
const preparationOwner: CanonicalSourceAnalysisPreparationOwner = {
  schemaVersion: CANONICAL_SOURCE_ANALYSIS_PREPARATION_OWNER_VERSION,
  userTriggeredOnly: true,
  approximateDurationToFrameInferenceAllowed: false,
  browserProbeAuthorityAccepted: false,
  directTranscriptDispatchAllowed: false,
  directVisualIntelligenceDispatchAllowed: false,
  async prepareForOrchestra() {
    sequence.push('preparation')
    return {
      status: 'ready',
      disposition: 'created',
      analysisRunId: identity.analysisRunId,
      requestDigestSha256: identity.requestDigest,
      repositoryRecordRef: ref('prepared-source-analysis-request'),
      sourceCount: 1,
      exactFinalizedSourceRereadVerified: true,
      exactL4ProbeRereadVerified: true,
      preparedRequestPersisted: true,
      transcriptDispatched: false,
      visualIntelligenceDispatched: false,
      providerCalled: false,
      gpuJobStarted: false,
      customerCreditMutated: false,
    }
  },
}
const requestAuthorityReadPort = {
  schemaVersion: CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_READ_PORT_VERSION,
  async readExactPreparedRequest() {
    sequence.push('prepared_request_reread')
    return structuredClone(request)
  },
} as const
const transcriptAttemptOwner: CanonicalSourceTranscriptA100AttemptOwner = {
  schemaVersion: CANONICAL_SOURCE_TRANSCRIPT_A100_ATTEMPT_OWNER_VERSION,
  operationId: 'internal.source_transcript.transcribe_complete_audio_timeline.v2',
  routeProfileId: 'quality_a100_80gb_user_triggered_heavy_job_v1',
  acceleratorClass: 'nvidia_a100_80gb',
  userTriggeredScaleFromZero: true,
  minimumIdleInstances: 0,
  maximumAttempts: 1,
  automaticRetryAfterUncertainOutcomeAllowed: false,
  cpuInferenceFallbackAllowed: false,
  l4FallbackRequiresSeparateClassifiedAdmission: true,
  platformFundedPreapprovalAnalysis: true,
  customerCreditMutationAllowed: false,
  async executeOneShot(trigger) {
    sequence.push('a100_transcript')
    assert.equal(trigger.sourceSequenceItemId, 'source-item-1')
    assert.equal(trigger.customerCreditMutationAuthorized, false)
    return {
      status: 'ready',
      disposition: 'created',
      invocationId: 'transcript-invocation-1',
      transcriptAuthorityRef,
      attemptCostEvidenceRef: ref('a100-transcript-cost'),
      exactTranscriptRereadVerified: true,
      scaleBackToZeroVerified: true,
      platformFundedPreapprovalAnalysis: true,
      customerCreditMutated: false,
      publicDeliveryGranted: false,
      productionAuthorityGranted: false,
    }
  },
}
const transcriptReadPort = {
  schemaVersion: CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_READ_PORT_VERSION,
  async readCompleted() {
    sequence.push('transcript_reread')
    return structuredClone(transcriptResult)
  },
} as const

let callForResult: ReturnType<typeof createOrchestraSkillCall> | null = null
const orchestraWorkReadPort = {
  schemaVersion: CANONICAL_SOURCE_ANALYSIS_ORCHESTRA_WORK_READ_PORT_VERSION,
  async readExactSourceVideoUnderstandingWork(scope: Parameters<
    typeof createCanonicalSourceAnalysisOrchestraWork
  >[0]['scope']) {
    sequence.push('orchestra_work_reread')
    const call = createOrchestraSkillCall({
      schemaVersion: ORCHESTRA_SKILL_CALL_VERSION,
      callId: 'orchestra-source-video-understanding-1',
      orchestraPlanRef: ref('orchestra-source-analysis-plan'),
      orchestraJobRef: ref('orchestra-source-analysis-job'),
      parentJobRef: null,
      requestedBy: { kind: 'orchestra' },
      targetSkillKey: 'visual_intelligence',
      jobType: 'source_video_understanding',
      phase: 'planning',
      scope: {
        scopeType: 'video',
        sourceArtifactRef: scope.sourceArtifactRef,
        authorizedRanges: [{
          startFrame: 0,
          endFrameExclusive: 240,
          frameRate: { numerator: 24, denominator: 1 },
        }],
        completeSourceCoverageRequired: true,
        outputId: null,
      },
      sceneContextSnapshotRef: scope.planningContextAuthorityRef,
      sourceArtifactRefs: [scope.sourceArtifactRef],
      comparisonArtifactRefs: [],
      expectedOutcomeRefs: [ref('source-edit-planning-evidence')],
      requiredEvidenceRefs: [
        scope.sourceProbeAuthorityRef,
        scope.transcriptAuthorityRef,
      ],
      manifestRef: ref('visual-intelligence-manifest'),
      qualificationSnapshotRef: ref('visual-intelligence-qualification'),
      timeBudgetRef: ref('visual-intelligence-time-budget'),
      creditBudgetRef: ref('visual-intelligence-credit-budget'),
      attemptEnvelopeRef: ref('visual-intelligence-attempt-envelope'),
      approvedSnapshotRef: null,
      idempotencyKey: 'orchestra-source-video-understanding-1',
      orchestraDispatchAuthorized: true,
      directProviderCallAllowed: false,
      directTimelineMutationAllowed: false,
      directArtifactMutationAllowed: false,
      scopeExpansionAllowed: false,
      peerSkillExecutionAuthorityAccepted: false,
    })
    callForResult = call
    return createCanonicalSourceAnalysisOrchestraWork({
      scope,
      call,
      dispatchPackageRef,
    })
  },
} as const
const orchestraRuntime: VisualIntelligenceOrchestraJobRuntime = {
  schemaVersion: VISUAL_INTELLIGENCE_ORCHESTRA_JOB_RUNTIME_VERSION,
  async execute(input) {
    sequence.push('gemini_through_orchestra')
    assert.equal(input.authenticatedOwnerUserId, 'user-1')
    assert.equal(input.expectedWorkspaceId, 'workspace-1')
    assert.ok(input.consumerBindingRequest)
    const call = callForResult!
    const result = createOrchestraSkillJobResult({
      schemaVersion: ORCHESTRA_SKILL_JOB_RESULT_VERSION,
      resultId: 'orchestra-source-video-understanding-result-1',
      callRef: orchestraEvidenceRef(call.callId, call.callDigestSha256),
      manifestRef: call.manifestRef,
      qualificationSnapshotRef: call.qualificationSnapshotRef,
      targetSkillKey: call.targetSkillKey,
      jobType: call.jobType,
      phase: call.phase,
      scope: call.scope,
      disposition: 'completed',
      producedArtifactRefs: [visual.reportRef],
      evidenceRefs: [visual.reportRef],
      proposedFollowupRanges: [],
      followupReasonCode: null,
      estimatedAdditionalTimeRef: null,
      estimatedAdditionalCreditsRef: null,
      resultReturnsToOrchestra: true,
      directTimelineMutationPerformed: false,
      directArtifactMutationPerformed: false,
      scopeExpandedWithoutOrchestra: false,
      providerAuthorityGrantedToCaller: false,
      finalQaApprovalGranted: false,
      publicDeliveryGranted: false,
      productionAuthorityGranted: false,
    })
    return {
      schemaVersion: VISUAL_INTELLIGENCE_ORCHESTRA_JOB_RUNTIME_VERSION,
      status: 'completed',
      result,
      resultRef: ref('source-orchestra-result'),
      dispatchPackageRef,
      canonicalRequestPackageRef: ref('canonical-visual-request-package'),
      consumerBindingRef: ref('source-orchestra-binding'),
      providerCallMadeDuringInvocation: true,
      costSettledDuringInvocation: true,
      duplicateProviderCallAvoided: false,
      duplicateCostSettlementAvoided: false,
      resultReturnsToOrchestra: true,
      directTimelineOrArtifactMutationPerformed: false,
      finalQaApprovalGranted: false,
      publicDeliveryGranted: false,
      productionAuthorityGranted: false,
    }
  },
}
const planningReconciliationPort = {
  schemaVersion:
    CANONICAL_SOURCE_LED_ORCHESTRA_PLANNING_RECONCILIATION_VERSION,
  preparedRequestRereadRequired: true,
  completedTranscriptRereadRequired: true,
  completedVisualIntelligenceRereadRequired: true,
  visualIntelligenceResultMustReturnThroughOrchestra: true,
  headDirectProviderDispatchAllowed: false,
  headDirectGpuDispatchAllowed: false,
  async reconcileForPlanning() {
    sequence.push('head_reconciliation')
    return {
      status: 'ready' as const,
      analysisRunId: identity.analysisRunId,
      requestDigestSha256: identity.requestDigest,
      evidenceDigestSha256: cleanupEvidence.evidenceDigestSha256,
      preparedRequestReread: true as const,
      cleanupAuthorityPersisted: true as const,
      completedTranscriptRereadRequired: true as const,
      completedVisualIntelligenceRereadRequired: true as const,
      visualIntelligenceResultReturnedThroughOrchestra: true as const,
      directProviderDispatchAllowed: false as const,
      directGpuDispatchAllowed: false as const,
      browserSourceAuthorityAccepted: false as const,
    }
  },
} as const
const cleanupAuthorityReadPort = {
  async readForPlanning() {
    sequence.push('cleanup_authority_reread')
    return {
      status: 'ready' as const,
      authority: {
        binding: cleanupBinding,
        evidence: cleanupEvidence,
        repositoryRecordRef: cleanupAuthorityRef,
        expectedScope: {
          workspaceId: request.workspaceId,
          projectId: request.projectId,
          editSessionId: request.editSessionId,
          planningDirectionDigestSha256,
          userInstructionDigestSha256,
        },
      },
      repositoryRecordRef: cleanupAuthorityRef,
    }
  },
}

const coordinator = createCanonicalSourceAnalysisOrchestraCoordinator({
  planningScopeReadPort,
  probeAttemptOwner,
  preparationOwner,
  transcriptAttemptOwner,
  requestAuthorityReadPort,
  transcriptReadPort,
  orchestraWorkReadPort,
  orchestraRuntime,
  planningReconciliationPort,
  cleanupAuthorityReadPort,
})
const trigger = createCanonicalSourceAnalysisUserTrigger({
  requestId: 'source-analysis-user-trigger-1',
  ownerUserId: 'user-1',
  workspaceId: 'workspace-1',
  projectId: 'project-1',
  editSessionId: 'edit-1',
  userTriggerRecordRef: ref('authenticated-user-trigger'),
  idempotencyKey: 'source-analysis-user-trigger-1',
  triggeredAt: '2026-08-03T12:00:00.000Z',
  exactServerPlanningScopeRereadRequired: true,
  browserSourceOrWorkAuthorityAccepted: false,
  callerPathUrlBytesCommandOrEnvironmentAccepted: false,
  customerCreditMutationAuthorized: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
})
const result = await coordinator.execute(trigger)
assert.equal(result.status, 'ready')
if (result.status !== 'ready') throw new Error('Coordinator did not complete.')
assert.equal(result.analysisRunId, identity.analysisRunId)
assert.equal(result.requestDigestSha256, identity.requestDigest)
assert.equal(result.sourceCount, 1)
assert.equal(result.l4ProbeScaleToZeroVerified, true)
assert.equal(
  result.a100TranscriptScaleToZeroOrNoAudioBypassVerified,
  true,
)
assert.equal(result.allVisualIntelligenceResultsReturnedThroughOrchestra, true)
assert.equal(result.directTimelineMutationPerformed, false)
assert.equal(result.customerCreditMutated, false)
assert.equal(result.productionAuthorityGranted, false)
assert.deepEqual(sequence, [
  'planning_scope',
  'l4_probe',
  'preparation',
  'prepared_request_reread',
  'a100_transcript',
  'transcript_reread',
  'orchestra_work_reread',
  'gemini_through_orchestra',
  'head_reconciliation',
  'cleanup_authority_reread',
])

assert.throws(() => assertCanonicalSourceAnalysisUserTrigger({
  ...trigger,
  workspaceId: 'attacker-workspace',
}))
assert.throws(() => assertCanonicalSourceAnalysisUserTrigger({
  ...trigger,
  customerCreditMutationAuthorized: true,
}))
const validWork = await orchestraWorkReadPort
  .readExactSourceVideoUnderstandingWork(
    // The ready run caused the exact work port to observe this same scope.
    createBindingScope(),
  )
assert.throws(() => assertCanonicalSourceAnalysisOrchestraWork({
  value: {
    ...(validWork as object),
    directProviderDispatchAllowed: true,
  },
  expectedScope: createBindingScope(),
}))

let probeBlockedDownstreamCalls = 0
const blockedCoordinator = createCanonicalSourceAnalysisOrchestraCoordinator({
  planningScopeReadPort,
  probeAttemptOwner: {
    ...probeAttemptOwner,
    async executeOneShot() {
      return {
        status: 'reconciliation_required' as const,
        invocationId: 'probe-unknown-1',
        blockerCode: 'source_probe_cloud_outcome_unknown' as const,
        cloudJobStartState: 'unknown' as const,
        automaticRetryAllowed: false as const,
        unknownOutcomeChargedToCustomer: false as const,
        customerCreditMutated: false as const,
      }
    },
  },
  preparationOwner: {
    ...preparationOwner,
    async prepareForOrchestra() {
      probeBlockedDownstreamCalls += 1
      return preparationOwner.prepareForOrchestra(planningScope)
    },
  },
  transcriptAttemptOwner,
  requestAuthorityReadPort,
  transcriptReadPort,
  orchestraWorkReadPort,
  orchestraRuntime,
  planningReconciliationPort,
  cleanupAuthorityReadPort,
})
const blockedResult = await blockedCoordinator.execute(trigger)
assert.deepEqual(blockedResult, {
  status: 'blocked',
  stage: 'l4_probe',
  sourceIndex: 1,
  blockerCode: 'source_probe_cloud_outcome_unknown',
  automaticRetryStarted: false,
  automaticHeavyFallbackDispatched: false,
  browserSourceOrWorkAuthorityAccepted: false,
  customerCreditMutated: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
})
assert.equal(probeBlockedDownstreamCalls, 0)

let transcriptBlockedWorkCalls = 0
const transcriptBlockedCoordinator =
  createCanonicalSourceAnalysisOrchestraCoordinator({
    planningScopeReadPort,
    probeAttemptOwner,
    preparationOwner,
    transcriptAttemptOwner: {
      ...transcriptAttemptOwner,
      async executeOneShot() {
        return {
          status: 'reconciliation_required' as const,
          blockerCode: 'source_transcript_a100_outcome_unknown' as const,
          invocationId: 'transcript-unknown-1',
          automaticRetryAllowed: false as const,
          unknownOutcomeChargedToCustomer: false as const,
          customerCreditMutated: false as const,
        }
      },
    },
    requestAuthorityReadPort,
    transcriptReadPort,
    orchestraWorkReadPort: {
      ...orchestraWorkReadPort,
      async readExactSourceVideoUnderstandingWork(scope) {
        transcriptBlockedWorkCalls += 1
        return orchestraWorkReadPort
          .readExactSourceVideoUnderstandingWork(scope)
      },
    },
    orchestraRuntime,
    planningReconciliationPort,
    cleanupAuthorityReadPort,
  })
const transcriptBlocked = await transcriptBlockedCoordinator.execute(trigger)
assert.equal(transcriptBlocked.status, 'blocked')
if (transcriptBlocked.status !== 'blocked') {
  throw new Error('Unknown transcript outcome did not block.')
}
assert.equal(transcriptBlocked.stage, 'a100_transcript')
assert.equal(
  transcriptBlocked.blockerCode,
  'source_transcript_a100_outcome_unknown',
)
assert.equal(transcriptBlocked.automaticRetryStarted, false)
assert.equal(transcriptBlocked.automaticHeavyFallbackDispatched, false)
assert.equal(transcriptBlockedWorkCalls, 0)

console.log(JSON.stringify({
  schemaVersion: coordinator.schemaVersion,
  owner: coordinator.owner,
  visualSkillKey: coordinator.visualSkillKey,
  sourceCount: result.sourceCount,
  exactStageOrderVerified: true,
  userTriggeredOnly: coordinator.userTriggeredOnly,
  sourceProbeRoute: coordinator.sourceProbeRoute,
  heavyTranscriptRoute: coordinator.heavyTranscriptRoute,
  geminiReturnedThroughOrchestra: true,
  headCleanupAuthorityReread: true,
  uncertainProbeOutcomeStoppedPipeline: true,
  uncertainTranscriptOutcomeStoppedPipeline: true,
  privateFixtureByteIdentityBound: privateFixtureIdentityBound,
  privateFixtureMediaDecodedOrSemanticallyAnalyzed: false,
  automaticRetryStarted: false,
  automaticHeavyFallbackDispatched: false,
  browserAuthorityAccepted: false,
  customerCreditMutated: false,
  productionAuthorityGranted: false,
}, null, 2))

function createBindingScope() {
  const contextDigest = orchestraDigest({
    planningDirectionDigestSha256,
    userInstructionDigestSha256,
  })
  return {
    ownerUserId: 'user-1',
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    editSessionId: 'edit-1',
    analysisRunId: identity.analysisRunId,
    sourceSequenceItemId: 'source-item-1',
    mediaAssetId: 'media-asset-1',
    uploadedOrder: 1,
    checksumSha256: sourceChecksum,
    byteLength: sourceByteLength,
    durationFrames: 240,
    sourceFrameAuthority,
    sourceArtifactRef: finalizedRef,
    sourceProbeAuthorityRef: probeRef,
    transcriptAuthorityRef,
    transcriptDigestSha256: transcript.transcriptDigestSha256,
    planningDirectionDigestSha256,
    userInstructionDigestSha256,
    planningContextAuthorityRef: orchestraEvidenceRef(
      `source-analysis-context-${contextDigest.slice(7, 39)}`,
      contextDigest,
    ),
  } as const
}
