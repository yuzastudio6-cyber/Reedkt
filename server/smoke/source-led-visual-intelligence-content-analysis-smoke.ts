import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  ApprovedEditExecutionUploadedMediaSourceAssetClientInput,
} from '../../src/lib/approved-edit-execution-package-client'
import type {
  VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import type { PlannerInput } from '../../src/types/reeditpro'
import {
  createCanonicalQualityFirstUserTriggeredGpuPolicy,
} from '../edit-architecture/canonical-quality-first-user-triggered-gpu-policy'
import {
  canonicalSourceLedVisualIntelligenceEvidenceSchema,
  canonicalSourceLedTranscriptEvidenceSchema,
  createCanonicalSourceLedContentAnalysisEvidence,
  digestCanonicalSourceLedStructuredSelection,
} from '../services/canonical-source-led-content-analysis-evidence'
import {
  createCanonicalSourceLedProfessionalContentAnalysisRequestIdentity,
  type CanonicalVisualIntelligenceSourceTranscriptResult,
} from '../services/canonical-source-visual-intelligence-analysis-contract'
import {
  CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_READ_PORT_VERSION,
  createCanonicalSourceLedOrchestraContentAnalysisReconciliationPort,
} from '../services/canonical-source-led-orchestra-content-analysis-reconciliation'
import {
  assertCanonicalSourceCleanupBindingMatchesEvidence,
  createCanonicalSourceCleanupVisualIntelligenceBinding,
  verifyCanonicalSourceCleanupVisualIntelligenceBinding,
} from '../services/canonical-source-cleanup-visual-intelligence-binding'
import {
  createCanonicalSourceCleanupAuthorityRepository,
  revalidateCanonicalSourceCleanupPlanAuthority,
  type CanonicalSourceCleanupAuthorityScope,
} from '../services/canonical-source-cleanup-authority-repository'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  compileCanonicalSourceLedPlan,
} from '../services/canonical-source-led-plan-compiler'
import type {
  CanonicalSourceLedContentReasoningSelection,
} from '../services/canonical-source-led-content-analysis-reasoner'
import type {
  CanonicalSourceLedProfessionalContentAnalysisInput,
  CanonicalSourceLedProfessionalContentAnalysisReasoner,
} from '../services/canonical-source-led-professional-content-analysis-port'
import {
  createVisualIntelligenceEvidenceRef,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  orchestraDigest,
} from '../orchestra/orchestra-skill-capability-contract'

const sha = (value: string) => createHash('sha256').update(value).digest('hex')
const ref = (id: string, value: unknown = { id }): VisualIntelligenceEvidenceRef =>
  createVisualIntelligenceEvidenceRef(id, value)
const sourceChecksum = sha('source-video-bytes')
const transcriptSegments = [{
  segmentId: 'transcript-first-take',
  startFrame: 0,
  endFrameExclusive: 120,
  text: 'This is the first take.',
  confidenceBasisPoints: 9_500,
  wordsVerified: true,
}, {
  segmentId: 'transcript-delete-instruction',
  startFrame: 120,
  endFrameExclusive: 180,
  text: 'Delete that part.',
  confidenceBasisPoints: 9_700,
  wordsVerified: true,
}, {
  segmentId: 'transcript-better-take',
  startFrame: 180,
  endFrameExclusive: 480,
  text: 'This is the better take and complete explanation.',
  confidenceBasisPoints: 9_800,
  wordsVerified: true,
}]
const transcriptCoverageWithoutDigest = {
  schemaVersion: 'canonical-source-audio-complete-timeline-coverage-v1' as const,
  coveredStartFrame: 0 as const,
  coveredEndFrameExclusive: 480,
  completeAudioTimelineProcessed: true as const,
  speechSegmentsMayOmitSilence: true as const,
  embeddedInstructionDetectionRequired: true as const,
}
const transcript = canonicalSourceLedTranscriptEvidenceSchema.parse({
  status: 'completed',
  modelId: 'faster-whisper-large-v3',
  modelDigestSha256: sha('faster-whisper-large-v3'),
  runtimeVersion: 'faster-whisper-1.2.1',
  transcriptDigestSha256: digest(transcriptSegments),
  segments: transcriptSegments,
  coverage: {
    ...transcriptCoverageWithoutDigest,
    coverageDigestSha256: digest(transcriptCoverageWithoutDigest),
  },
  rawAudioPersisted: false,
  modelDownloadPerformed: false,
  networkAttempted: false,
})
const transcriptAuthorityRef = {
  id: 'transcript-authority',
  version: 1,
  contentHash: `sha256:${transcript.transcriptDigestSha256}`,
} as const
const probeRef = ref('source-probe')
const finalizedRef = ref('finalized-source')
const storageRef = ref('immutable-storage')
const providerReleaseRef = ref('gemini-provider-release')
const gpuPolicy = createCanonicalQualityFirstUserTriggeredGpuPolicy()

const request: CanonicalSourceLedProfessionalContentAnalysisInput = {
  workspaceId: 'workspace-1',
  projectId: 'project-1',
  editSessionId: 'edit-1',
  planningDirection: 'Remove failed takes, honor spoken edit instructions, and preserve the complete lesson.',
  planningDirectionDigestSha256: sha(
    'Remove failed takes, honor spoken edit instructions, and preserve the complete lesson.',
  ),
  userInstructionDigestSha256: sha('canonical-saved-chat-authority'),
  fps: 30,
  sources: [{
    sourceSequenceItemId: 'source-item-1',
    mediaAssetId: 'media-asset-1',
    uploadedOrder: 1,
    storageProvider: 'google_cloud_storage',
    storageBucket: 'private-source-bucket',
    storagePath: 'workspace-1/source.mp4',
    checksumSha256: sourceChecksum,
    byteLength: 10_000_000,
    durationFrames: 480,
    managedApiAuthority: {
      ownerUserId: 'user-1',
      storageBucket: 'private-source-bucket',
      storagePath: 'workspace-1/source.mp4',
      contentType: 'video/mp4',
      storageGeneration: '1001',
      storageEtag: 'etag-source-1',
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
      finalizedMediaAuthorityRef: finalizedRef,
      finalizedStorageObjectAuthorityRef: storageRef,
      sourceBindingManifestCandidateRef: ref('source-binding-manifest'),
      sourceProbeAuthorityRef: probeRef,
      providerMediaReadAuthorityRef: ref('provider-media-read'),
      sourceAnalysisConsentRef: ref('source-analysis-consent'),
      platformAnalysisCostCapRef: ref('platform-analysis-cost-cap'),
    },
  }],
}

const plannerInput: PlannerInput = {
  projectName: 'Whole-video source cleanup compiler smoke',
  targetPlatform: 'youtube',
  aspectRatio: '16:9',
  aspectRatioConfirmed: true,
  aspectRatioSource: 'user_selected',
  frameTemplateType: 'youtube_side_panel',
  editingCategory: 'education_explainer',
  workflowType: 'simple_clean_edit',
  editLevel: 'premium',
  structurePreference: 'preserve_source_order',
  moodStyle: 'clean',
  visualPreference: 'no_extra_visuals',
  referenceUrl: '',
  customInstructions: request.planningDirection,
  userInstructionHistory: [request.planningDirection],
  creditPreference: 'balanced',
  clips: [{
    id: 'uploaded-clip-1',
    uploadedOrder: 1,
    fileName: 'source.mp4',
    duration: '20',
    detectedType: 'Verified uploaded video',
    sourceRole: 'main_story',
    isImportant: true,
  }],
  sourceSequenceMode: 'single_complete_video',
  sourceOrderConfirmed: true,
  cleanupPreference: 'balanced_cleanup',
  cleanupPreferenceConfirmed: true,
  preferenceDefaultsApplied: true,
  preferenceSnapshotId: 'source-cleanup-preference-snapshot',
  preferencePersistenceSource: 'authenticated_private_internal_backend',
  currentEditPreferenceAuthorityValues: {
    editLevel: 'premium',
    workflowType: 'simple_clean_edit',
    cleanupPreference: 'balanced_cleanup',
    visualPreference: 'no_extra_visuals',
    moodStyle: 'clean',
    creditPreference: 'balanced',
    targetPlatform: 'youtube',
  },
  currentEditPreferenceRecordRevision: 1,
  currentEditPreferenceRevision: 1,
  currentEditPreferencePlanningInputRevision: 1,
  currentEditPreferenceFingerprintSha256: sha('source-cleanup-preferences'),
}

const sourceMediaAssets:
  ApprovedEditExecutionUploadedMediaSourceAssetClientInput[] = [{
    mediaAssetId: 'media-asset-1',
    storageObjectRecordId: 'storage-object-1',
    sourceSequenceItemId: 'source-item-1',
    uploadedClipId: 'uploaded-clip-1',
    uploadedOrder: 1,
    storageProvider: 'google_cloud_storage',
    storageBucket: 'private-source-bucket',
    storagePath: 'workspace-1/source.mp4',
    fileName: 'source.mp4',
    mimeType: 'video/mp4',
    byteSize: 10_000_000,
    checksumSha256: sourceChecksum,
    sourceMetadata: {
      probeStatus: 'probed',
      source: 'gcs_ffprobe',
      durationSeconds: 20,
      width: 1_920,
      height: 1_080,
      videoCodec: 'h264',
      audioCodec: 'aac',
      hasVideo: true,
      hasAudio: true,
    },
    privateArtifact: true,
    publicUrl: null,
    signedUrl: null,
  }]

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
    primaryAttemptReceiptRef: ref('transcript-primary-attempt'),
    completedAttemptReceiptRef: ref('transcript-primary-attempt'),
    completedRuntimeReleaseRef: ref('transcript-a100-runtime-release'),
    fallbackAdmissionRef: null,
    attemptCostEvidenceRefs: [ref('transcript-primary-cost')],
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

const sourceAnalysisIdentity =
  createCanonicalSourceLedProfessionalContentAnalysisRequestIdentity(request)
const compiledVisualRequestRef = ref('source-visual-intelligence-request')
const visualObservations = [{
  observationId: 'visual-window-1',
  windowIndex: 1,
  startFrame: 0,
  endFrameExclusive: 240,
  sourceFunction: 'setup',
  actionIntensity: 'low',
  editUsability: 'weak',
  cameraStability: 'stable',
  continuity: 'discontinuous',
  confidenceBasisPoints: 9_200,
  evidenceRefs: [probeRef, transcriptAuthorityRef],
  providerObservationScope:
    'complete_source_range_semantic_partition',
  exactProviderSampleFramesKnown: false,
}, {
  observationId: 'visual-window-2',
  windowIndex: 2,
  startFrame: 240,
  endFrameExclusive: 480,
  sourceFunction: 'dialogue',
  actionIntensity: 'medium',
  editUsability: 'strong',
  cameraStability: 'stable',
  continuity: 'continuous',
  confidenceBasisPoints: 9_500,
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
  coveredEndFrameExclusive: 480,
  maximumWindowFrames: 240 as const,
  windowCount: visualObservations.length,
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
const orchestraVisual = canonicalSourceLedVisualIntelligenceEvidenceSchema.parse({
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
  requestRef: compiledVisualRequestRef,
  reportRef: ref('source-visual-intelligence-report'),
  admissionRef: ref('source-visual-intelligence-admission'),
  providerReleaseRef,
  costEvidenceRef: ref('source-visual-intelligence-cost'),
  observationDigestSha256: digest(visualObservations),
  observations: visualObservations,
  coverage: {
    ...visualCoverageWithoutDigest,
    coverageDigestSha256: digest(visualCoverageWithoutDigest),
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
    consumerBindingRef: ref('source-orchestra-consumer-binding'),
    callRef: {
      id: compiledVisualRequestRef.id,
      version: 1,
      contentHash: ref('source-orchestra-call').contentHash,
    },
    compiledRequestRef: compiledVisualRequestRef,
    resultRef: ref('source-orchestra-result'),
    manifestRef: ref('visual-intelligence-manifest-v3'),
    qualificationSnapshotRef: ref('visual-intelligence-qualification'),
    exactConsumerBindingRereadVerified: true,
    exactOrchestraResultRereadVerified: true,
    resultReturnedThroughOrchestra: true,
    headIntelligenceDirectProviderCallAllowed: false,
    headIntelligenceDirectGpuDispatchAllowed: false,
  },
})
const {
  orchestraLineage: omittedOrchestraLineage,
  ...unboundVisualInput
} = orchestraVisual
void omittedOrchestraLineage
const directVisual = canonicalSourceLedVisualIntelligenceEvidenceSchema.parse(
  unboundVisualInput,
)

const reasoner: CanonicalSourceLedProfessionalContentAnalysisReasoner = {
  async reason(input) {
    const selection = {
      sources: [{
        sourceSequenceItemId: 'source-item-1',
        mediaAssetId: 'media-asset-1',
        uploadedOrder: 1,
        selectedRanges: [{
          rangeId: 'keep-better-take',
          startFrame: 180,
          endFrameExclusive: 480,
          role: 'main_story',
          reason: 'Keep the complete clear take after the resolved restart.',
          confidenceBasisPoints: 9_300,
          phraseBoundaryAligned: true,
          preservesSourceMeaning: true,
          userReviewRequired: false,
          evidenceIds: ['transcript-better-take', 'visual-window-2'],
          keepReasonCodes: ['clear_explanation', 'key_story_beat'],
          removedContextCodes: ['repeated_take'],
          decisionBasis: 'content_understanding',
          instructionIds: [],
          timeOnlyDecision: false,
        }],
        removedRanges: [{
          rangeId: 'remove-first-take',
          startFrame: 0,
          endFrameExclusive: 120,
          reason: 'Remove the previous take under the resolved spoken instruction.',
          confidenceBasisPoints: 9_400,
          phraseBoundaryAligned: true,
          preservesSourceMeaning: true,
          userReviewRequired: false,
          evidenceIds: ['transcript-first-take', 'transcript-delete-instruction'],
          reasonCodes: ['repeated_take', 'resolved_embedded_instruction'],
          decisionBasis: 'resolved_embedded_instruction',
          instructionIds: ['instruction-delete-previous'],
          timeOnlyDecision: false,
        }, {
          rangeId: 'remove-editor-remark',
          startFrame: 120,
          endFrameExclusive: 180,
          reason: 'Remove the editor-directed remark from viewer-facing speech.',
          confidenceBasisPoints: 9_700,
          phraseBoundaryAligned: true,
          preservesSourceMeaning: true,
          userReviewRequired: false,
          evidenceIds: ['transcript-delete-instruction'],
          reasonCodes: ['resolved_embedded_instruction'],
          decisionBasis: 'resolved_embedded_instruction',
          instructionIds: ['instruction-delete-previous'],
          timeOnlyDecision: false,
        }],
        embeddedEditInstructions: [{
          instructionId: 'instruction-delete-previous',
          instructionType: 'delete_previous_part',
          targetRelation: 'previous_context',
          transcriptSegmentId: 'transcript-delete-instruction',
          spokenStartFrame: 120,
          spokenEndFrameExclusive: 180,
          targetStartFrame: 0,
          targetEndFrameExclusive: 120,
          reason: 'The speaker explicitly directs the editor to delete the previous take.',
          confidenceBasisPoints: 9_700,
          evidenceIds: ['transcript-delete-instruction', 'visual-window-1'],
          appliedDecisionIds: ['remove-first-take', 'remove-editor-remark'],
          spokenRemarkRemovalDecisionId: 'remove-editor-remark',
          classifiedAsEditorDirected: true,
          interpretationStatus: 'resolved',
          userReviewRequired: false,
        }],
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
    const evidenceRecord = createCanonicalSourceLedContentAnalysisEvidence({
      schemaVersion: 'canonical-source-led-content-analysis-evidence-v5',
      source: 'server_private_source_understanding_pipeline',
      identity: {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        analysisRunId: input.analysisRunId,
        userInstructionDigestSha256: input.userInstructionDigestSha256,
        fps: 30,
      },
      sources: input.sources.map((source) => ({
        ...source,
        ...selection.sources[0],
      })),
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
        selectedTotalFrames: 300,
        originalTotalFrames: 480,
        originalTotalTimelineFrames: 600,
        selectedTotalTimelineFrames: 375,
        rationalSourceFrameMappingVerified: true,
        sourceOrderPreserved: true,
        everySelectionEvidenceBound: true,
        everyRemovalEvidenceBound: true,
        completeSourceCoverageVerified: true,
        allTimelineIntervalsReviewed: true,
        embeddedInstructionsEvaluated: true,
        embeddedInstructionCount: 1,
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
    return {
      status: 'completed',
      evidence: evidenceRecord,
      primaryAttempt: {
        status: 'completed',
        routeId: 'kimi_k3_primary',
        providerModel: 'kimi-k3',
        credentialVersion: 1,
        providerCallMade: true,
        modelCallMade: true,
        attemptDigestSha256: sha('head-reasoning-attempt'),
        selection,
      },
      finalAttempt: {
        status: 'completed',
        routeId: 'kimi_k3_primary',
        providerModel: 'kimi-k3',
        credentialVersion: 1,
        providerCallMade: true,
        modelCallMade: true,
        attemptDigestSha256: sha('head-reasoning-attempt'),
        selection,
      },
      fallbackUsed: false,
    }
  },
}

const repositoryObjects = new Map<string, Buffer>()
let repositoryCreateAttempts = 0
const repositoryObjectPort: CanonicalCreateOnlyJsonObjectPort = {
  async createOnly(input) {
    repositoryCreateAttempts += 1
    const existing = repositoryObjects.get(input.objectPath)
    if (existing) {
      assert.equal(sha(existing.toString('utf8')), input.contentSha256)
      assert.deepEqual(existing, input.body)
      return 'already_exists'
    }
    assert.equal(sha(input.body.toString('utf8')), input.contentSha256)
    repositoryObjects.set(input.objectPath, Buffer.from(input.body))
    return 'created'
  },
  async readExact(objectPath) {
    const body = repositoryObjects.get(objectPath)
    return body ? Buffer.from(body) : null
  },
}
const cleanupAuthorityRepository =
  createCanonicalSourceCleanupAuthorityRepository({
    objectPort: repositoryObjectPort,
  })
const cleanupAuthorityScope: CanonicalSourceCleanupAuthorityScope = {
  ownerUserId: 'user-1',
  workspaceId: request.workspaceId,
  projectId: request.projectId,
  editSessionId: request.editSessionId,
  planningDirectionDigestSha256: request.planningDirectionDigestSha256,
  userInstructionDigestSha256: request.userInstructionDigestSha256,
  sources: request.sources.map((source) => ({
    sourceSequenceItemId: source.sourceSequenceItemId,
    mediaAssetId: source.mediaAssetId,
    uploadedOrder: source.uploadedOrder,
    checksumSha256: source.checksumSha256,
  })),
}
let transcriptRereads = 0
let orchestraVisualRereads = 0
let headReconciliationCalls = 0
const reconciliationPort =
  createCanonicalSourceLedOrchestraContentAnalysisReconciliationPort({
    transcriptReadPort: {
      schemaVersion: CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_READ_PORT_VERSION,
      async readCompleted(scope) {
        transcriptRereads += 1
        assert.equal(scope.ownerUserId, 'user-1')
        assert.equal(scope.sourceSequenceItemId, 'source-item-1')
        assert.equal(scope.checksumSha256, sourceChecksum)
        assert.deepEqual(scope.finalizedMediaAuthorityRef, finalizedRef)
        assert.deepEqual(scope.sourceProbeAuthorityRef, probeRef)
        return transcriptResult
      },
    },
    visualIntelligenceReadPort: {
      schemaVersion: 'canonical-source-visual-intelligence-orchestra-read-port-v1',
      async readCompletedSourceVideoUnderstanding(scope) {
        orchestraVisualRereads += 1
        assert.equal(
          scope.analysisRunId,
          sourceAnalysisIdentity.analysisRunId,
        )
        assert.equal(
          scope.planningContextAuthorityRef.contentHash,
          orchestraDigest({
            planningDirectionDigestSha256:
              request.planningDirectionDigestSha256,
            userInstructionDigestSha256:
              request.userInstructionDigestSha256,
          }),
        )
        assert.deepEqual(scope.transcriptAuthorityRef, transcriptAuthorityRef)
        return orchestraVisual
      },
    },
    reasoner: {
      async reason(input) {
        headReconciliationCalls += 1
        assert.equal(
          'orchestraLineage' in input.sources[0]!.visual
            ? input.sources[0]!.visual.orchestraLineage
                ?.resultReturnedThroughOrchestra
            : false,
          true,
        )
        return reasoner.reason(input)
      },
    },
    authorityRepository: cleanupAuthorityRepository,
  })
const result = await reconciliationPort.analyze(request)
assert.equal(result.schemaVersion, 'canonical-source-led-content-analysis-evidence-v5')
assert.equal(
  'orchestraLineage' in result.sources[0]!.visual
    ? result.sources[0]!.visual.orchestraLineage
        ?.resultReturnedThroughOrchestra
    : false,
  true,
)
assert.equal(transcriptRereads, 1)
assert.equal(orchestraVisualRereads, 1)
assert.equal(headReconciliationCalls, 1)
const reconciledReplay = await reconciliationPort.analyze(request)
assert.equal(
  reconciledReplay.evidenceDigestSha256,
  result.evidenceDigestSha256,
)
assert.equal(transcriptRereads, 1)
assert.equal(orchestraVisualRereads, 1)
assert.equal(headReconciliationCalls, 1)
let blockedHeadCalls = 0
const missingVisualReconciliationPort =
  createCanonicalSourceLedOrchestraContentAnalysisReconciliationPort({
    transcriptReadPort: {
      schemaVersion: CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_READ_PORT_VERSION,
      async readCompleted() { return transcriptResult },
    },
    visualIntelligenceReadPort: {
      schemaVersion: 'canonical-source-visual-intelligence-orchestra-read-port-v1',
      async readCompletedSourceVideoUnderstanding() { return null },
    },
    reasoner: {
      async reason(input) {
        blockedHeadCalls += 1
        return reasoner.reason(input)
      },
    },
    authorityRepository: createCanonicalSourceCleanupAuthorityRepository({
      objectPort: repositoryObjectPort,
      prefix: 'private/test/source-orchestra-missing-result',
    }),
  })
await assert.rejects(
  () => missingVisualReconciliationPort.analyze(request),
  /source_visual_intelligence_orchestra_result_1_not_ready/u,
)
assert.equal(blockedHeadCalls, 0)
const unboundVisualReconciliationPort =
  createCanonicalSourceLedOrchestraContentAnalysisReconciliationPort({
    transcriptReadPort: {
      schemaVersion: CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_READ_PORT_VERSION,
      async readCompleted() { return transcriptResult },
    },
    visualIntelligenceReadPort: {
      schemaVersion: 'canonical-source-visual-intelligence-orchestra-read-port-v1',
      async readCompletedSourceVideoUnderstanding() { return directVisual },
    },
    reasoner: {
      async reason(input) {
        blockedHeadCalls += 1
        return reasoner.reason(input)
      },
    },
    authorityRepository: createCanonicalSourceCleanupAuthorityRepository({
      objectPort: repositoryObjectPort,
      prefix: 'private/test/source-orchestra-unbound-result',
    }),
  })
await assert.rejects(
  () => unboundVisualReconciliationPort.analyze(request),
  /source_orchestra_visual_evidence_scope_mismatch/u,
)
assert.equal(blockedHeadCalls, 0)
const cleanupBinding = createCanonicalSourceCleanupVisualIntelligenceBinding({
  evidence: result,
  expectedScope: {
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editSessionId: request.editSessionId,
    planningDirectionDigestSha256: request.planningDirectionDigestSha256,
    userInstructionDigestSha256: request.userInstructionDigestSha256,
  },
})
assertCanonicalSourceCleanupBindingMatchesEvidence({
  binding: cleanupBinding,
  evidence: result,
})
assert.equal(cleanupBinding.totals.originalSourceFrames, 480)
assert.equal(cleanupBinding.totals.selectedSourceFrames, 300)
assert.equal(cleanupBinding.totals.selectedMasterTimelineFrames, 375)
assert.equal(cleanupBinding.totals.selectedRangeCount, 1)
assert.equal(cleanupBinding.totals.removedRangeCount, 2)
assert.equal(cleanupBinding.totals.embeddedInstructionCount, 1)
assert.deepEqual(
  cleanupBinding.sources[0]!.decisionPartition.map((decision) => ({
    id: decision.decisionId,
    action: decision.action,
    source: [decision.sourceStartFrame, decision.sourceEndFrameExclusive],
    timeline: [
      decision.timelineStartFrame,
      decision.timelineEndFrameExclusive,
    ],
  })),
  [{
    id: 'remove-first-take',
    action: 'remove',
    source: [0, 120],
    timeline: [null, null],
  }, {
    id: 'remove-editor-remark',
    action: 'remove',
    source: [120, 180],
    timeline: [null, null],
  }, {
    id: 'keep-better-take',
    action: 'keep',
    source: [180, 480],
    timeline: [0, 375],
  }],
)
assert.equal(
  cleanupBinding.authority.mediaContainedInstructionsTreatedAsUntrustedEvidence,
  true,
)
assert.equal(cleanupBinding.authority.callerTimestampsAcceptedAsCutAuthority,
  false)
assert.equal(cleanupBinding.permissions.timelineMutated, false)
assert.equal(cleanupBinding.permissions.customerCreditMutated, false)

const persistedCleanupAuthority =
  await cleanupAuthorityRepository.readForPlanning(cleanupAuthorityScope)
assert.equal(persistedCleanupAuthority.status, 'ready')
const persistedCleanupBinding =
  assertCanonicalSourceCleanupBindingMatchesEvidence({
    binding: persistedCleanupAuthority.authority.binding,
    evidence: persistedCleanupAuthority.authority.evidence,
  })
assert.equal(
  persistedCleanupBinding.bindingDigestSha256,
  cleanupBinding.bindingDigestSha256,
)
await cleanupAuthorityRepository.persist({
  scope: cleanupAuthorityScope,
  evidence: result,
})
assert.equal(repositoryCreateAttempts, 2)
const rereadCleanupAuthority =
  await cleanupAuthorityRepository.readForPlanning(cleanupAuthorityScope)
assert.equal(rereadCleanupAuthority.status, 'ready')
assert.deepEqual(
  rereadCleanupAuthority.repositoryRecordRef,
  persistedCleanupAuthority.repositoryRecordRef,
)
const staleInstructionRead = await cleanupAuthorityRepository.readForPlanning({
  ...cleanupAuthorityScope,
  userInstructionDigestSha256: sha('changed-user-instructions'),
})
assert.equal(staleInstructionRead.status, 'not_found')
const stalePlanningDirectionRead =
  await cleanupAuthorityRepository.readForPlanning({
    ...cleanupAuthorityScope,
    planningDirectionDigestSha256: sha('changed-planning-direction'),
  })
assert.equal(stalePlanningDirectionRead.status, 'not_found')
const substitutedSourceRead = await cleanupAuthorityRepository.readForPlanning({
  ...cleanupAuthorityScope,
  sources: cleanupAuthorityScope.sources.map((source) => ({
    ...source,
    checksumSha256: sha('substituted-source'),
  })),
})
assert.equal(substitutedSourceRead.status, 'not_found')
const [repositoryObjectPath, immutableRepositoryBody] =
  [...repositoryObjects.entries()][0]!
const tamperedRepositoryRecord = JSON.parse(
  immutableRepositoryBody.toString('utf8'),
) as { authority: { planPublished: boolean } }
tamperedRepositoryRecord.authority.planPublished = true
repositoryObjects.set(
  repositoryObjectPath,
  Buffer.from(JSON.stringify(tamperedRepositoryRecord), 'utf8'),
)
await assert.rejects(
  () => cleanupAuthorityRepository.readForPlanning(cleanupAuthorityScope),
  /failed exact immutable reread/u,
)
repositoryObjects.set(repositoryObjectPath, immutableRepositoryBody)

const compiledCleanup = compileCanonicalSourceLedPlan({
  plannerInput,
  sourceMediaAssets,
  confirmedCaptionMarkers: [],
  sourceCleanupAuthority: rereadCleanupAuthority.authority,
})
assert.equal(
  compiledCleanup.evidence.sourceRangePolicy,
  'head_intelligence_verified_visual_intelligence_cleanup',
)
assert.deepEqual(
  compiledCleanup.evidence.sourceAnalysisEvidenceRef,
  cleanupBinding.sourceAnalysisEvidenceRef,
)
assert.equal(
  compiledCleanup.evidence.sourceCleanupBindingDigestSha256,
  cleanupBinding.bindingDigestSha256,
)
assert.equal(compiledCleanup.evidence.totalFrames, 375)
assert.deepEqual(
  compiledCleanup.plan.sourceCleanupPlan?.decisions.map((decision) => {
    const selectedRange = (decision as unknown as {
      selectedRange: { startFrame: number; endFrame: number }
    }).selectedRange
    return {
      decisionId: decision.id,
      action: decision.decision,
      sourceRange: [
        decision.sourceRange.startFrame,
        decision.sourceRange.endFrame,
      ],
      selectedRange: [selectedRange.startFrame, selectedRange.endFrame],
    }
  }),
  [{
    decisionId: 'keep-better-take',
    action: 'tighten',
    sourceRange: [0, 600],
    selectedRange: [225, 600],
  }],
)
assert.deepEqual(
  compiledCleanup.plan.sourceCleanupPlan?.cutRanges.map((decision) => [
    decision.id,
    decision.sourceRange.startFrame,
    decision.sourceRange.endFrame,
  ]),
  [
    ['remove-first-take', 0, 150],
    ['remove-editor-remark', 150, 225],
  ],
)
assert.deepEqual(
  compiledCleanup.plan.masterTimingPlan?.sourceTimingItems.map((item) => ({
    decisionId: item.trimDecisionItemId,
    sourceRange: [item.sourceRange.startFrame, item.sourceRange.endFrame],
    selectedRange: [
      item.selectedRange.startFrame,
      item.selectedRange.endFrame,
    ],
  })),
  [{
    decisionId: 'keep-better-take',
    sourceRange: [0, 600],
    selectedRange: [225, 600],
  }],
)
assert.deepEqual(
  compiledCleanup.plan.masterTimingPlan?.finalTimelineSegments.map(
    (segment) => [segment.finalRange.startFrame, segment.finalRange.endFrame],
  ),
  [[0, 375]],
)
const compiledCanonicalPlan =
  compiledCleanup.canonicalDraft.publication?.canonicalPlan ??
  compiledCleanup.professionalLongFormPublication?.canonicalPlan
assert.ok(compiledCanonicalPlan)
assert.deepEqual(
  compiledCanonicalPlan.components.sourceCleanupPlan.decisions.map(
    (decision) => ({
      decisionId: decision.decisionId,
      action: decision.action,
      range: [decision.startFrame, decision.endFrameExclusive],
    }),
  ),
  [{
    decisionId: 'keep-better-take',
    action: 'tighten',
    range: [225, 600],
  }],
)
const compiledIntent = compiledCanonicalPlan.components.compiledIntent
const compiledAuthorityBinding = compiledIntent
  .canonicalSourceCleanupAuthority as Record<string, unknown>
assert.equal(
  compiledAuthorityBinding.schemaVersion,
  'canonical-source-cleanup-plan-authority-binding-v2',
)
assert.deepEqual(
  compiledAuthorityBinding.repositoryRecordRef,
  rereadCleanupAuthority.repositoryRecordRef,
)
assert.equal(
  compiledAuthorityBinding.planningDirectionDigestSha256,
  request.planningDirectionDigestSha256,
)
assert.equal(
  (compiledIntent.compilerNotes as string[]).some((note) =>
    note.includes(cleanupBinding.bindingDigestSha256)),
  true,
)
await revalidateCanonicalSourceCleanupPlanAuthority({
  readPort: cleanupAuthorityRepository,
  ownerUserId: cleanupAuthorityScope.ownerUserId,
  workspaceId: cleanupAuthorityScope.workspaceId,
  projectId: cleanupAuthorityScope.projectId,
  editSessionId: cleanupAuthorityScope.editSessionId,
  sourceSequence: compiledCanonicalPlan.components.sourceSequence,
  compiledIntent,
})
const stalePlanningCompiledIntent = structuredClone(compiledIntent) as
  Record<string, unknown>
;(stalePlanningCompiledIntent.canonicalSourceCleanupAuthority as
  Record<string, unknown>).planningDirectionDigestSha256 =
    sha('approval-time-stale-planning-direction')
await assert.rejects(
  () => revalidateCanonicalSourceCleanupPlanAuthority({
    readPort: cleanupAuthorityRepository,
    ownerUserId: cleanupAuthorityScope.ownerUserId,
    workspaceId: cleanupAuthorityScope.workspaceId,
    projectId: cleanupAuthorityScope.projectId,
    editSessionId: cleanupAuthorityScope.editSessionId,
    sourceSequence: compiledCanonicalPlan.components.sourceSequence,
    compiledIntent: stalePlanningCompiledIntent,
  }),
  /failed exact immutable reread/u,
)
await assert.rejects(
  () => revalidateCanonicalSourceCleanupPlanAuthority({
    ownerUserId: cleanupAuthorityScope.ownerUserId,
    workspaceId: cleanupAuthorityScope.workspaceId,
    projectId: cleanupAuthorityScope.projectId,
    editSessionId: cleanupAuthorityScope.editSessionId,
    sourceSequence: compiledCanonicalPlan.components.sourceSequence,
    compiledIntent,
  }),
  /repository is unavailable/u,
)
const colorTrimPayloads = compiledCanonicalPlan.workItems
  .filter((item) => item.executionInput.operation ===
    'process_approved_source_professional_color_delivery')
  .map((item) => item.executionInput.structuredPayload as {
    trimStartFrame: number
    trimEndFrameExclusive: number
  })
assert.ok(colorTrimPayloads.length > 0)
assert.equal(colorTrimPayloads[0]!.trimStartFrame, 225)
assert.equal(
  colorTrimPayloads[colorTrimPayloads.length - 1]!.trimEndFrameExclusive,
  600,
)
colorTrimPayloads.slice(1).forEach((payload, index) => {
  assert.equal(
    payload.trimStartFrame,
    colorTrimPayloads[index]!.trimEndFrameExclusive,
  )
})
assert.throws(() => compileCanonicalSourceLedPlan({
  plannerInput,
  sourceMediaAssets,
  confirmedCaptionMarkers: [],
  sourceCleanupAuthority: {
    binding: cleanupBinding,
    evidence: result,
    expectedScope: {
      workspaceId: request.workspaceId,
      projectId: request.projectId,
      editSessionId: 'stale-edit-session',
      planningDirectionDigestSha256: request.planningDirectionDigestSha256,
      userInstructionDigestSha256: request.userInstructionDigestSha256,
    },
  },
}), /cleanup authority is stale/u)
assert.throws(() => compileCanonicalSourceLedPlan({
  plannerInput,
  sourceMediaAssets: [{
    ...sourceMediaAssets[0]!,
    checksumSha256: sha('substituted-source'),
  }],
  confirmedCaptionMarkers: [],
  sourceCleanupAuthority: {
    binding: cleanupBinding,
    evidence: result,
    expectedScope: {
      workspaceId: request.workspaceId,
      projectId: request.projectId,
      editSessionId: request.editSessionId,
      planningDirectionDigestSha256: request.planningDirectionDigestSha256,
      userInstructionDigestSha256: request.userInstructionDigestSha256,
    },
  },
}), /lost exact source identity/u)

const multiRangeSelection = {
  sources: [{
    sourceSequenceItemId: 'source-item-1',
    mediaAssetId: 'media-asset-1',
    uploadedOrder: 1,
    selectedRanges: [{
      rangeId: 'keep-first-take-for-context',
      startFrame: 0,
      endFrameExclusive: 120,
      role: 'opening',
      reason: 'Keep the opening context for this multi-range rejection case.',
      confidenceBasisPoints: 9_100,
      phraseBoundaryAligned: true,
      preservesSourceMeaning: true,
      userReviewRequired: false,
      evidenceIds: ['transcript-first-take', 'visual-window-1'],
      keepReasonCodes: ['source_context_required'],
      removedContextCodes: [],
      decisionBasis: 'content_understanding',
      instructionIds: [],
      timeOnlyDecision: false,
    }, {
      rangeId: 'keep-better-take-after-gap',
      startFrame: 180,
      endFrameExclusive: 480,
      role: 'main_story',
      reason: 'Keep the complete explanation after the removed remark.',
      confidenceBasisPoints: 9_400,
      phraseBoundaryAligned: true,
      preservesSourceMeaning: true,
      userReviewRequired: false,
      evidenceIds: ['transcript-better-take', 'visual-window-2'],
      keepReasonCodes: ['clear_explanation', 'key_story_beat'],
      removedContextCodes: [],
      decisionBasis: 'content_understanding',
      instructionIds: [],
      timeOnlyDecision: false,
    }],
    removedRanges: [{
      rangeId: 'remove-middle-remark',
      startFrame: 120,
      endFrameExclusive: 180,
      reason: 'Remove the non-program middle remark.',
      confidenceBasisPoints: 9_200,
      phraseBoundaryAligned: true,
      preservesSourceMeaning: true,
      userReviewRequired: false,
      evidenceIds: ['transcript-delete-instruction', 'visual-window-1'],
      reasonCodes: ['filler_words'],
      decisionBasis: 'content_understanding',
      instructionIds: [],
      timeOnlyDecision: false,
    }],
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
const multiRangeEvidence = createCanonicalSourceLedContentAnalysisEvidence({
  schemaVersion: 'canonical-source-led-content-analysis-evidence-v5',
  source: 'server_private_source_understanding_pipeline',
  identity: {
    ...result.identity,
    analysisRunId: 'analysis-multi-range-rejection',
  },
  sources: [{
    ...result.sources[0]!,
    ...multiRangeSelection.sources[0],
  }],
  reasoning: {
    ...result.reasoning,
    attemptDigestSha256: sha('multi-range-head-reasoning-attempt'),
    structuredResultDigestSha256:
      digestCanonicalSourceLedStructuredSelection(multiRangeSelection),
  },
  summary: {
    selectedSourceCount: 1,
    selectedRangeCount: 2,
    selectedTotalFrames: 420,
    originalTotalFrames: 480,
    originalTotalTimelineFrames: 600,
    selectedTotalTimelineFrames: 525,
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
  boundaries: result.boundaries,
})
const multiRangeBinding = createCanonicalSourceCleanupVisualIntelligenceBinding({
  evidence: multiRangeEvidence,
  expectedScope: {
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editSessionId: request.editSessionId,
    planningDirectionDigestSha256: request.planningDirectionDigestSha256,
    userInstructionDigestSha256: request.userInstructionDigestSha256,
  },
})
assert.throws(() => compileCanonicalSourceLedPlan({
  plannerInput,
  sourceMediaAssets,
  confirmedCaptionMarkers: [],
  sourceCleanupAuthority: {
    binding: multiRangeBinding,
    evidence: multiRangeEvidence,
    expectedScope: {
      workspaceId: request.workspaceId,
      projectId: request.projectId,
      editSessionId: request.editSessionId,
      planningDirectionDigestSha256: request.planningDirectionDigestSha256,
      userInstructionDigestSha256: request.userInstructionDigestSha256,
    },
  },
}), /exactly one retained range.*multi-range execution remains fail-closed/u)
await assert.rejects(async () => createCanonicalSourceCleanupVisualIntelligenceBinding({
  evidence: result,
  expectedScope: {
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editSessionId: 'different-edit-session',
    planningDirectionDigestSha256: request.planningDirectionDigestSha256,
    userInstructionDigestSha256: request.userInstructionDigestSha256,
  },
}), /Fresh source cleanup requires exact complete-video/u)
await assert.rejects(async () => verifyCanonicalSourceCleanupVisualIntelligenceBinding({
  ...cleanupBinding,
  totals: {
    ...cleanupBinding.totals,
    selectedMasterTimelineFrames:
      cleanupBinding.totals.selectedMasterTimelineFrames + 1,
  },
}), /binding digest is invalid/u)
const acceptedVisual = canonicalSourceLedVisualIntelligenceEvidenceSchema.parse(
  result.sources[0]!.visual,
)
assert.equal(acceptedVisual.evidenceMode,
  'visual_intelligence_gemini_pro_high_v1')
assert.equal(result.sources[0]!.embeddedEditInstructions[0]!.instructionType,
  'delete_previous_part')
assert.equal(result.sources[0]!.selectedRanges[0]!.startFrame, 180)
assert.equal(result.summary.timeOnlyCutDecisionCount, 0)

await assert.rejects(
  async () => reconciliationPort.analyze({
    ...request,
    sources: [{
      ...request.sources[0]!,
      managedApiAuthority: {
        ...request.sources[0]!.managedApiAuthority!,
        sourceTimeBaseNumerator: undefined,
      },
    }],
  }),
  /visual_intelligence_source_1_invalid/u,
)
await assert.rejects(
  async () => reconciliationPort.analyze({
    ...request,
    planningDirection:
      'A changed direction cannot reuse the authenticated text digest.',
  }),
  /visual_intelligence_source_request_invalid/u,
)

console.log(JSON.stringify({
  status: 'source_led_visual_intelligence_content_analysis_smoke_passed',
  route: reconciliationPort.route,
  evidenceVersion: result.schemaVersion,
  visualEvidenceMode: acceptedVisual.evidenceMode,
  fullSourceFrames: result.summary.originalTotalFrames,
  selectedFrames: result.summary.selectedTotalFrames,
  selectedMasterTimelineFrames:
    cleanupBinding.totals.selectedMasterTimelineFrames,
  compiledMasterTimelineFrames: compiledCleanup.evidence.totalFrames,
  compiledSelectedSourceRange: [225, 600],
  exactRenderTrimPayloadsVerified: true,
  staleScopeAndSourceSubstitutionRejected: true,
  unsupportedMultiRangeExecutionRejected: true,
  durableAuthorityCreateOnlyRereadVerified: true,
  tamperedDurableAuthorityRejected: true,
  approvalTimeAuthorityRereadVerified: true,
  staleInstructionAndSourceRepositoryReadsRejected: true,
  stalePlanningDirectionRepositoryReadRejected: true,
  headOrchestraReconciliationRereadVerified:
    transcriptRereads === 1
    && orchestraVisualRereads === 1
    && headReconciliationCalls === 1,
  directVisualLifecycleCallsDuringReconciliation: 0,
  directionTextAndChatAuthorityDigestsSeparated: true,
  embeddedInstructionDetected: true,
  embeddedInstructionTreatedAsUntrustedEvidence:
    cleanupBinding.authority
      .mediaContainedInstructionsTreatedAsUntrustedEvidence,
  browserSelectedRangesAccepted:
    cleanupBinding.authority.browserSelectedRangesAccepted,
  timeOnlyCutDecisionCount: result.summary.timeOnlyCutDecisionCount,
  qwenVisualRuntimeUsed: false,
  directSourceAnalysisFactoryPresent: false,
}, null, 2))

function digest(value: unknown): string {
  return sha(stableStringify(value))
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}
