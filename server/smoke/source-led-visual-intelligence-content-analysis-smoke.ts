import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  VisualIntelligenceEvidence,
  VisualIntelligenceEvidenceRef,
  VisualIntelligenceRequest,
} from '../../src/types/visual-intelligence'
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
  createVisualIntelligenceCanonicalSourceLedProfessionalContentAnalysisPort,
  type CanonicalVisualIntelligenceSourceTranscriptResult,
} from '../services/canonical-source-led-visual-intelligence-content-analysis-port'
import type {
  CanonicalSourceLedContentReasoningSelection,
} from '../services/canonical-source-led-content-analysis-reasoner'
import type {
  CanonicalSourceLedProfessionalContentAnalysisInput,
  CanonicalSourceLedProfessionalContentAnalysisReasoner,
} from '../services/canonical-source-led-professional-content-analysis-port'
import {
  createVisualIntelligenceEvidenceRef,
  createVisualIntelligenceReport,
  visualIntelligenceDigest,
} from '../visual-intelligence/visual-intelligence-contract'
import type {
  VisualIntelligenceLifecycleService,
} from '../visual-intelligence/visual-intelligence-lifecycle-service'
import {
  VISUAL_INTELLIGENCE_DETERMINISTIC_EVIDENCE_VERSION,
  VISUAL_INTELLIGENCE_PROMPT_VERSION,
  VISUAL_INTELLIGENCE_RESPONSE_SCHEMA_VERSION,
} from '../visual-intelligence/visual-intelligence-profile-registry'

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
  userInstructionDigestSha256: sha(
    'Remove failed takes, honor spoken edit instructions, and preserve the complete lesson.',
  ),
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

const planningAdmission = {
  mode: 'planning_evidence' as const,
  authenticatedPrincipalRef: ref('authenticated-principal'),
  workspaceAuthorizationRef: ref('workspace-authorization'),
  finalizedSourceAuthorityRefs: [finalizedRef],
  sourceChecksumSetRef: ref('source-checksum-set'),
  analysisAllowanceRef: ref('analysis-allowance'),
  costPreflight: {
    pricingSnapshotRef: ref('pricing-snapshot'),
    accountEffectiveRateAuthorityRef: ref('account-effective-rate'),
    currency: 'USD',
    maximumAuthorizedCostMicros: 500_000,
    estimatedMinimumCostMicros: 10_000,
    estimatedMaximumCostMicros: 100_000,
    serviceFeeIncluded: false as const,
    publicListPriceUsedAsSettlementAuthority: false as const,
    preflightPassed: true as const,
  },
  retentionPolicyRef: ref('retention-policy'),
  privacyPolicyRef: ref('privacy-policy'),
  providerReleaseRef,
  globalKillSwitchOpen: false as const,
  providerKillSwitchOpen: false as const,
  reportPersistenceAllowed: true as const,
  timelineMutationAllowed: false as const,
  editingWorkerExecutionAllowed: false as const,
  generationAllowed: false as const,
  renderAllowed: false as const,
  exportAllowed: false as const,
  deliveryAllowed: false as const,
}

let visualLifecycleCalls = 0
const lifecycle: VisualIntelligenceLifecycleService = {
  async execute(untrusted) {
    visualLifecycleCalls += 1
    const visualRequest = untrusted as VisualIntelligenceRequest
    assert.equal(visualRequest.profile, 'source_edit_planning')
    assert.deepEqual(visualRequest.requiredEvidenceRefs, [
      probeRef,
      transcriptAuthorityRef,
    ])
    const probeEvidence = evidence(
      'probe-evidence',
      probeRef,
      'media_probe',
      'ffprobe',
      'Canonical probe verifies source timing and dimensions.',
    )
    const transcriptEvidence = evidence(
      'transcript-evidence',
      transcriptAuthorityRef,
      'canonical_transcript',
      'faster_whisper',
      'Complete source transcript includes the editor-directed delete remark.',
    )
    const report = createVisualIntelligenceReport({
      reportId: `vi-report-${visualRequest.requestId}`,
      requestRef: {
        id: visualRequest.requestId,
        version: 1,
        contentHash: visualRequest.requestDigestSha256,
      },
      scope: visualRequest.scope,
      operation: 'analyze_media',
      profile: 'source_edit_planning',
      sourceArtifacts: [{
        artifactId: 'media-asset-1',
        checksumSha256: sourceChecksum,
        mediaKind: 'video',
        durationFrames: 480,
      }],
      comparisonArtifacts: [],
      coverage: {
        requestedRanges: visualRequest.requestedRanges,
        analyzedRanges: visualRequest.requestedRanges,
        incompleteRanges: [],
        sceneBoundaryRefs: [ref('scene-boundaries')],
        samplingPolicies: [{
          policyId: 'complete-source-semantic-coverage',
          policyVersion: 'complete-source-semantic-coverage-v1',
          mode: 'scene_aware_complete_coverage',
          targetFramesPerSecondNumerator: 2,
          targetFramesPerSecondDenominator: 1,
          sceneAware: true,
          highDetail: true,
          requestedRange: visualRequest.requestedRanges[0]!,
          analyzedRange: visualRequest.requestedRanges[0]!,
          samplingPolicyRef: ref('sampling-policy'),
        }],
        targetedFollowupRanges: [],
        completeRequestedRangeCoverage: true,
        everyTimelineFrameInspected: false,
        completeTimePixelInspectionClaimAllowed: false,
      },
      semanticSummary: 'The source contains a failed first take, an editor-directed delete remark, and a complete better take.',
      segments: [{
        segmentId: 'visual-window-1',
        artifactId: 'media-asset-1',
        range: {
          startFrame: 0,
          endFrameExclusive: 240,
          frameRate: { numerator: 24, denominator: 1 },
        },
        sceneId: 'scene-1',
        summary: 'First take and editor-directed restart context.',
        subjectIds: ['speaker-1'],
        objectIds: [],
        actionLabels: ['first_take', 'editor_direction'],
        visibleTextEvidenceRefs: [],
        transcriptEvidenceRefs: [transcriptAuthorityRef],
        evidenceRefs: [probeRef, transcriptAuthorityRef],
        confidenceBasisPoints: 9_200,
        uncertainty: null,
        sourcePlanning: {
          sourceFunction: 'setup',
          actionIntensity: 'low',
          editUsability: 'weak',
          cameraStability: 'stable',
          continuity: 'discontinuous',
        },
      }, {
        segmentId: 'visual-window-2',
        artifactId: 'media-asset-1',
        range: {
          startFrame: 240,
          endFrameExclusive: 480,
          frameRate: { numerator: 24, denominator: 1 },
        },
        sceneId: 'scene-2',
        summary: 'Complete clear second take.',
        subjectIds: ['speaker-1'],
        objectIds: [],
        actionLabels: ['better_take', 'explanation'],
        visibleTextEvidenceRefs: [],
        transcriptEvidenceRefs: [transcriptAuthorityRef],
        evidenceRefs: [probeRef, transcriptAuthorityRef],
        confidenceBasisPoints: 9_500,
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
      evidence: [probeEvidence, transcriptEvidence],
      deterministicToolExecutions: [{
        tool: 'ffprobe',
        requirement: 'required',
        executionClass: 'l4_gpu_standard',
        releaseRef: ref('ffprobe-release'),
        executionRef: ref('ffprobe-execution'),
        substantiveCpuExecutionUsed: false,
        sourceArtifactChecksumBound: true,
      }, {
        tool: 'ffmpeg',
        requirement: 'required',
        executionClass: 'l4_gpu_standard',
        releaseRef: ref('ffmpeg-release'),
        executionRef: ref('ffmpeg-execution'),
        substantiveCpuExecutionUsed: false,
        sourceArtifactChecksumBound: true,
      }, {
        tool: 'pyscenedetect',
        requirement: 'required',
        executionClass: 'l4_gpu_standard',
        releaseRef: ref('pyscenedetect-release'),
        executionRef: ref('pyscenedetect-execution'),
        substantiveCpuExecutionUsed: false,
        sourceArtifactChecksumBound: true,
      }, {
        tool: 'opencv',
        requirement: 'required',
        executionClass: 'l4_gpu_standard',
        releaseRef: ref('opencv-release'),
        executionRef: ref('opencv-execution'),
        substantiveCpuExecutionUsed: false,
        sourceArtifactChecksumBound: true,
      }],
      expectedOutcomeRefs: [],
      disposition: 'pass',
      reinspectionRequired: false,
      usage: {
        promptTokenCount: 10_000,
        candidateTokenCount: 2_000,
        thinkingTokenCount: 3_000,
        cachedTokenCount: 0,
        totalTokenCount: 15_000,
        providerResponseId: 'gemini-response-1',
        providerModelVersion: 'gemini-3.1-pro-preview',
        estimatedCostMicros: 50_000,
        settledCostMicros: 45_000,
        costEvidenceRef: ref('settled-provider-cost'),
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
        transcriptVersion: 'faster-whisper-large-v3-authority-v1',
        ocrVersion: 'exact-ocr-authority-v1',
        cacheIdentitySha256: visualIntelligenceDigest({ cache: sourceChecksum }),
        requestDigestSha256: visualRequest.requestDigestSha256,
        admissionRef: ref('visual-intelligence-admission'),
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
    const reportRef = {
      id: report.reportId,
      version: 1,
      contentHash: report.reportDigestSha256,
    }
    return {
      lifecycleVersion: 'visual-intelligence-lifecycle-service-v1',
      status: 'completed',
      report,
      reportRef,
      providerCallMadeDuringInvocation: true,
      costSettledDuringInvocation: true,
      duplicateProviderCallAvoided: false,
      duplicateCostSettlementAvoided: false,
      directTimelineMutationPerformed: false,
    }
  },
}

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

const port = createVisualIntelligenceCanonicalSourceLedProfessionalContentAnalysisPort({
  transcriptPort: { async analyze() { return transcriptResult } },
  planningAdmissionPort: { async admit(input) {
    assert.equal(input.requestId.startsWith('vi-source-'), true)
    assert.equal(input.transcriptResult.transcriptAuthorityRef.id,
      transcriptAuthorityRef.id)
    return planningAdmission
  } },
  visualIntelligenceLifecycle: lifecycle,
  reasoner,
})
const result = await port.analyze(request)
assert.equal(result.schemaVersion, 'canonical-source-led-content-analysis-evidence-v5')
const acceptedVisual = canonicalSourceLedVisualIntelligenceEvidenceSchema.parse(
  result.sources[0]!.visual,
)
assert.equal(acceptedVisual.evidenceMode,
  'visual_intelligence_gemini_pro_high_v1')
assert.equal(result.sources[0]!.embeddedEditInstructions[0]!.instructionType,
  'delete_previous_part')
assert.equal(result.sources[0]!.selectedRanges[0]!.startFrame, 180)
assert.equal(result.summary.timeOnlyCutDecisionCount, 0)
assert.equal(visualLifecycleCalls, 1)

await assert.rejects(
  async () => port.analyze({
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

console.log(JSON.stringify({
  status: 'source_led_visual_intelligence_content_analysis_smoke_passed',
  route: port.route,
  evidenceVersion: result.schemaVersion,
  visualEvidenceMode: acceptedVisual.evidenceMode,
  fullSourceFrames: result.summary.originalTotalFrames,
  selectedFrames: result.summary.selectedTotalFrames,
  embeddedInstructionDetected: true,
  timeOnlyCutDecisionCount: result.summary.timeOnlyCutDecisionCount,
  qwenVisualRuntimeUsed: false,
  visualLifecycleCalls,
}, null, 2))

function evidence(
  evidenceId: string,
  evidenceRef: VisualIntelligenceEvidenceRef,
  authority: VisualIntelligenceEvidence['authority'],
  producingTool: VisualIntelligenceEvidence['producingTool'],
  summary: string,
): VisualIntelligenceEvidence {
  return {
    evidenceId,
    evidenceRef,
    artifactId: 'media-asset-1',
    range: null,
    authority,
    producingTool,
    toolVersion: producingTool === 'ffprobe'
      ? 'ffprobe-8.0'
      : 'faster-whisper-1.2.1',
    summary,
    privateEvidence: true,
    providerInstructionAccepted: false,
  }
}

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
