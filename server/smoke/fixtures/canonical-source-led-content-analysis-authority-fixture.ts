import { createHash } from 'node:crypto'

import {
  canonicalSourceLedVisualIntelligenceEvidenceSchema,
  createCanonicalSourceLedContentAnalysisEvidence,
  createCanonicalSourceLedSourceFrameAuthority,
  digestCanonicalSourceLedStructuredSelection,
  verifyCanonicalSourceLedContentAnalysisEvidence,
} from '../../services/canonical-source-led-content-analysis-evidence'
import {
  createCanonicalSourceCleanupVisualIntelligenceBinding,
} from '../../services/canonical-source-cleanup-visual-intelligence-binding'
import type {
  CanonicalSourceLedCleanupAuthorityInput,
} from '../../services/canonical-source-led-plan-compiler'
import {
  createCanonicalCaptionApprovedSnapshotReadPort,
  createCanonicalCaptionSourceWordTimingEvidence,
  createCanonicalCaptionSourceWordTimingReadPort,
  createCanonicalCaptionTranscriptEvidenceRepository,
  createCanonicalCaptionTranscriptPlanningExpectationOwnerReadPort,
  createCanonicalCaptionTranscriptSupportServiceV2,
} from '../../services/canonical-caption-transcript-support-service'
import {
  CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_READ_PORT_VERSION,
  type CanonicalSourceTranscriptOrchestraReadScope,
} from '../../services/canonical-source-led-orchestra-content-analysis-reconciliation'
import type {
  CanonicalVisualIntelligenceSourceTranscriptResult,
} from '../../services/canonical-source-visual-intelligence-analysis-contract'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../../services/canonical-gcs-source-analysis-lifecycle-store'
import { createCanonicalQualityFirstUserTriggeredGpuPolicy } from
  '../../edit-architecture/canonical-quality-first-user-triggered-gpu-policy'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../../services/private-edit-authority-store'

/**
 * Structural smoke fixture only. It simulates already-authenticated owner
 * receipts so route and lineage code can be exercised without a provider or
 * model call. It is never professional visual, transcript, or runtime proof.
 */
export function createCanonicalSourceAnalysisAuthorityFixture(input: {
  readonly hasSpeech: boolean
  readonly workspaceId?: string
  readonly projectId?: string
  readonly editSessionId?: string
  readonly sourceSequenceItemId?: string
  readonly mediaAssetId?: string
  readonly uploadedOrder?: number
  readonly checksumSha256?: string
  readonly byteLength?: number
  readonly durationFrames?: number
  readonly planningDirectionDigestSha256?: string
  readonly userInstructionDigestSha256?: string
  readonly transcriptText?: string
}): CanonicalSourceLedCleanupAuthorityInput {
  const workspaceId = input.workspaceId ?? 'workspace-caption-owner'
  const projectId = input.projectId ?? 'project-caption-owner'
  const editSessionId = input.editSessionId ?? 'edit-caption-owner'
  const sourceSequenceItemId = input.sourceSequenceItemId ?? 'source-item-1'
  const mediaAssetId = input.mediaAssetId ?? 'media-asset-1'
  const uploadedOrder = input.uploadedOrder ?? 1
  const checksumSha256 = input.checksumSha256 ?? sha('source-bytes')
  const byteLength = input.byteLength ?? 4_096
  const durationFrames = input.durationFrames ?? 120
  const planningDirectionDigestSha256 =
    input.planningDirectionDigestSha256 ?? sha('planning-direction')
  const userInstructionDigestSha256 =
    input.userInstructionDigestSha256 ?? sha('user-instructions')
  const fixtureKey = sha(JSON.stringify({
    workspaceId,
    projectId,
    editSessionId,
    sourceSequenceItemId,
    mediaAssetId,
    uploadedOrder,
    checksumSha256,
    byteLength,
    durationFrames,
    planningDirectionDigestSha256,
    userInstructionDigestSha256,
    hasSpeech: input.hasSpeech,
  })).slice(0, 24)
  const transcriptSegmentId = `transcript-segment-${fixtureKey}`
  const visualObservationId = `visual-window-${fixtureKey}`
  const transcriptSegments = input.hasSpeech ? [{
    segmentId: transcriptSegmentId,
    startFrame: 0,
    endFrameExclusive: durationFrames,
    text: input.transcriptText ??
      'Authenticated simulated fixture speech for deterministic route wiring.',
    confidenceBasisPoints: 9_500,
    wordsVerified: true,
  }] : []
  const transcriptCoverageWithoutDigest = {
    schemaVersion:
      'canonical-source-audio-complete-timeline-coverage-v1' as const,
    coveredStartFrame: 0 as const,
    coveredEndFrameExclusive: durationFrames,
    completeAudioTimelineProcessed: true as const,
    speechSegmentsMayOmitSilence: true as const,
    embeddedInstructionDetectionRequired: true as const,
  }
  const observation = {
    observationId: visualObservationId,
    windowIndex: 1,
    startFrame: 0,
    endFrameExclusive: durationFrames,
    sourceFunction: input.hasSpeech ? 'dialogue' as const : 'idle' as const,
    actionIntensity: 'low' as const,
    editUsability: 'strong' as const,
    cameraStability: 'stable' as const,
    continuity: 'continuous' as const,
    confidenceBasisPoints: 9_400,
    evidenceRefs: [evidenceRef(`source-probe-${fixtureKey}`)],
    providerObservationScope:
      'complete_source_range_semantic_partition' as const,
    exactProviderSampleFramesKnown: false as const,
  }
  const observations = [observation]
  const visualCoverageWithoutDigest = {
    schemaVersion:
      'canonical-source-visual-intelligence-semantic-coverage-v4' as const,
    profileId:
      'visual_intelligence_source_edit_planning_professional_high_v1' as const,
    coveredStartFrame: 0 as const,
    coveredEndFrameExclusive: durationFrames,
    maximumWindowFrames: 240 as const,
    windowCount: 1,
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
    requestRef: evidenceRef(`visual-request-${fixtureKey}`),
    reportRef: evidenceRef(`visual-report-${fixtureKey}`),
    admissionRef: evidenceRef(`visual-admission-${fixtureKey}`),
    providerReleaseRef: evidenceRef(`visual-release-${fixtureKey}`),
    costEvidenceRef: evidenceRef(`visual-cost-${fixtureKey}`),
    observationDigestSha256:
      digestCanonicalSourceLedStructuredSelection(observations),
    observations,
    coverage: {
      ...visualCoverageWithoutDigest,
      coverageDigestSha256:
        digestCanonicalSourceLedStructuredSelection(
          visualCoverageWithoutDigest),
    },
    lifecycleInvocationDisposition: 'cache_replay',
    providerCallMadeDuringInvocation: false,
    costSettledDuringInvocation: false,
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
  })
  const selectedRange = {
    rangeId: `keep-source-${fixtureKey}`,
    startFrame: 0,
    endFrameExclusive: durationFrames,
    role: 'main_story' as const,
    reason: 'Preserve the complete source-backed fixture explanation.',
    confidenceBasisPoints: 9_500,
    phraseBoundaryAligned: true as const,
    preservesSourceMeaning: true as const,
    userReviewRequired: false as const,
    evidenceIds: input.hasSpeech
      ? [transcriptSegmentId, visualObservationId]
      : [visualObservationId],
    keepReasonCodes: ['clear_explanation' as const],
    removedContextCodes: [],
    decisionBasis: 'content_understanding' as const,
    instructionIds: [],
    timeOnlyDecision: false as const,
  }
  const selection = {
    sources: [{
      sourceSequenceItemId,
      mediaAssetId,
      uploadedOrder,
      selectedRanges: [selectedRange],
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
  }
  const evidence = createCanonicalSourceLedContentAnalysisEvidence({
    schemaVersion: 'canonical-source-led-content-analysis-evidence-v5',
    source: 'server_private_source_understanding_pipeline',
    identity: {
      workspaceId,
      projectId,
      editSessionId,
      analysisRunId: `analysis-fixture-${fixtureKey}`,
      userInstructionDigestSha256,
      fps: 30,
    },
    sources: [{
      sourceSequenceItemId,
      mediaAssetId,
      uploadedOrder,
      checksumSha256,
      byteLength,
      durationFrames,
      sourceFrameAuthority: createCanonicalSourceLedSourceFrameAuthority({
        fpsNumerator: 30,
        fpsDenominator: 1,
        frameCount: durationFrames,
        timeBaseNumerator: 1,
        timeBaseDenominator: 30,
      }),
      transcript: {
        status: input.hasSpeech ? 'completed' : 'no_speech',
        modelId: 'faster-whisper-large-v3',
        modelDigestSha256: sha('faster-whisper-large-v3'),
        runtimeVersion: 'faster-whisper-1.2.1',
        transcriptDigestSha256:
          digestCanonicalSourceLedStructuredSelection(transcriptSegments),
        segments: transcriptSegments,
        coverage: {
          ...transcriptCoverageWithoutDigest,
          coverageDigestSha256:
            digestCanonicalSourceLedStructuredSelection(
              transcriptCoverageWithoutDigest),
        },
        rawAudioPersisted: false,
        modelDownloadPerformed: false,
        networkAttempted: false,
      },
      visual,
      selectedRanges: [selectedRange],
      removedRanges: [],
      embeddedEditInstructions: [],
    }],
    reasoning: {
      status: 'completed',
      routeId: 'kimi_k3_primary',
      providerModel: 'kimi-k3',
      credentialSource: 'google_secret_manager_pinned_version',
      credentialVersion: 1,
      providerCallMade: true,
      modelCallMade: true,
      attemptDigestSha256: sha(`reasoning-attempt-${fixtureKey}`),
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
      selectedTotalFrames: durationFrames,
      originalTotalFrames: durationFrames,
      originalTotalTimelineFrames: durationFrames,
      selectedTotalTimelineFrames: durationFrames,
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
  const expectedScope = {
    workspaceId,
    projectId,
    editSessionId,
    planningDirectionDigestSha256,
    userInstructionDigestSha256,
  }
  return {
    evidence,
    binding: createCanonicalSourceCleanupVisualIntelligenceBinding({
      evidence,
      expectedScope,
    }),
    expectedScope,
  }
}

/**
 * Structural route fixture for the canonical transcript-owner read boundary.
 * It projects the already-simulated source-analysis transcript through the
 * real closed Caption owner contracts. It performs no ASR/model/media work and
 * must never be counted as private transcript qualification evidence.
 */
export function createCanonicalCaptionTranscriptOwnerReadFixture(input: {
  readonly ownerUserId: string
  readonly readSourceAnalysisAuthority: () =>
    CanonicalSourceLedCleanupAuthorityInput | null
}) {
  const objects = new Map<string, Buffer>()
  const repository = createCanonicalCaptionTranscriptEvidenceRepository({
    objectPort: memoryObjectPort(objects),
    prefix: 'private/smoke/source-led-caption-transcript-owner/v1',
  })
  return createCanonicalCaptionTranscriptPlanningExpectationOwnerReadPort(
    async ({ canonicalReadScope, planningExpectationRef }) => {
      const sourceAnalysisAuthority = input.readSourceAnalysisAuthority()
      if (!sourceAnalysisAuthority
        || canonicalReadScope.ownerUserId !== input.ownerUserId) return null
      const evidence = verifyCanonicalSourceLedContentAnalysisEvidence(
        sourceAnalysisAuthority.evidence,
      )
      if (evidence.identity.workspaceId !== canonicalReadScope.workspaceId
        || evidence.identity.projectId !== canonicalReadScope.projectId
        || evidence.identity.editSessionId !==
          canonicalReadScope.editSessionId
        || evidence.sources.length !== 1) return null
      const source = evidence.sources[0]!
      if (source.transcript.status !== 'completed'
        || !source.sourceFrameAuthority) return null
      const sourceScope: CanonicalSourceTranscriptOrchestraReadScope = {
        ownerUserId: input.ownerUserId,
        workspaceId: evidence.identity.workspaceId,
        projectId: evidence.identity.projectId,
        editSessionId: evidence.identity.editSessionId,
        analysisRunId: evidence.identity.analysisRunId,
        sourceSequenceItemId: source.sourceSequenceItemId,
        mediaAssetId: source.mediaAssetId,
        uploadedOrder: source.uploadedOrder,
        checksumSha256: source.checksumSha256,
        byteLength: source.byteLength,
        durationFrames: source.durationFrames,
        sourceFrameAuthority: source.sourceFrameAuthority,
        finalizedMediaAuthorityRef: evidenceRef(
          `finalized-${source.sourceSequenceItemId}`),
        sourceProbeAuthorityRef: evidenceRef(
          `probe-${source.sourceSequenceItemId}`),
      }
      const transcriptAuthorityRef = {
        id: `source-transcript-${
          source.transcript.transcriptDigestSha256.slice(0, 32)}`,
        version: 1 as const,
        contentHash:
          `sha256:${source.transcript.transcriptDigestSha256}` as const,
      }
      const transcriptResult:
      CanonicalVisualIntelligenceSourceTranscriptResult = {
        schemaVersion:
          'canonical-visual-intelligence-source-transcript-result-v1',
        transcriptAuthorityRef,
        transcript: structuredClone(source.transcript),
        execution: {
          executionOwner:
            'canonical_quality_first_source_transcript_router',
          sourceAudioDisposition:
            'transcribed_on_nvidia_a100_80gb_primary',
          routeProfileId:
            'quality_a100_80gb_user_triggered_heavy_job_v1',
          acceleratorClass: 'nvidia_a100_80gb',
          primaryAttemptOutcome: 'completed',
          fallbackAttemptOutcome: 'not_attempted',
          primaryAttemptTerminalFailureClass: null,
          primaryAttemptReceiptRef: evidenceRef(
            `transcript-attempt-${source.sourceSequenceItemId}`),
          completedAttemptReceiptRef: evidenceRef(
            `transcript-attempt-${source.sourceSequenceItemId}`),
          completedRuntimeReleaseRef: evidenceRef(
            `transcript-release-${source.sourceSequenceItemId}`),
          fallbackAdmissionRef: null,
          attemptCostEvidenceRefs: [evidenceRef(
            `transcript-cost-${source.sourceSequenceItemId}`)],
          routePolicyDigestSha256:
            `sha256:${createCanonicalQualityFirstUserTriggeredGpuPolicy()
              .policyHash}`,
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
      const timingEvidence =
        createCanonicalCaptionSourceWordTimingEvidence({
          evidenceId:
            `caption.word-timing.${source.sourceSequenceItemId}`,
          ownerUserId: sourceScope.ownerUserId,
          workspaceId: sourceScope.workspaceId,
          projectId: sourceScope.projectId,
          editSessionId: sourceScope.editSessionId,
          analysisRunId: sourceScope.analysisRunId,
          sourceSequenceItemId: sourceScope.sourceSequenceItemId,
          mediaAssetId: sourceScope.mediaAssetId,
          uploadedOrder: sourceScope.uploadedOrder,
          sourceChecksumSha256: sourceScope.checksumSha256,
          durationFrames: sourceScope.durationFrames,
          fpsNumerator: sourceScope.sourceFrameAuthority.fpsNumerator,
          fpsDenominator: sourceScope.sourceFrameAuthority.fpsDenominator,
          sourceScopeDigestSha256: sha256AuthorityValue(sourceScope),
          sourceTranscriptAuthorityRef: transcriptAuthorityRef,
          sourceTranscriptDigestSha256:
            source.transcript.transcriptDigestSha256,
          languageCode: 'en-US',
          wordTimingArtifactRef: {
            id: `word-timing-${source.sourceSequenceItemId}`,
            version: 'canonical-source-word-timing-artifact-v1',
            contentHash: sha(`word-timing-${source.sourceSequenceItemId}`),
          },
          diarizationArtifactRef: null,
          speakerDiarizationState: 'not_present',
          segments: source.transcript.segments.map((segment, segmentIndex) => {
            const startMilliseconds = sourceFrameStartToMilliseconds(
              segment.startFrame,
              sourceScope.sourceFrameAuthority.fpsNumerator,
              sourceScope.sourceFrameAuthority.fpsDenominator,
            )
            const endMillisecondsExclusive = sourceFrameEndToMilliseconds(
              segment.endFrameExclusive,
              sourceScope.sourceFrameAuthority.fpsNumerator,
              sourceScope.sourceFrameAuthority.fpsDenominator,
            )
            const tokens = segment.text.trim().split(/\s+/u)
            const durationMilliseconds =
              endMillisecondsExclusive - startMilliseconds
            return {
              sourceTranscriptSegmentId: segment.segmentId,
              order: segmentIndex + 1,
              startFrame: segment.startFrame,
              endFrameExclusive: segment.endFrameExclusive,
              startMilliseconds,
              endMillisecondsExclusive,
              text: segment.text,
              confidenceBasisPoints: segment.confidenceBasisPoints,
              words: tokens.map((text, tokenIndex) => ({
                orderInSegment: tokenIndex + 1,
                text,
                startMilliseconds: startMilliseconds + Math.floor(
                  durationMilliseconds * tokenIndex / tokens.length),
                endMillisecondsExclusive: startMilliseconds + Math.floor(
                  durationMilliseconds * (tokenIndex + 1) / tokens.length),
                confidenceBasisPoints: segment.confidenceBasisPoints,
                speakerId: null,
              })),
            }
          }),
          exactPrivateArtifactRereadVerified: true,
          exactSourceScopeVerified: true,
          exactTranscriptDigestVerified: true,
          exactWordTimestampCoverageVerified: true,
          asrNativeWordTiming: true,
          privateArtifact: true,
          browserShareable: false,
          rawAudioIncluded: false,
          rawChatIncluded: false,
          mediaBytesIncluded: false,
          pathsUrlsOrCredentialsIncluded: false,
          transcriptMutationAuthorityGranted: false,
          timingAuthorityGranted: false,
          runtimeOrDispatchAuthorityGranted: false,
          assetMutationAuthorityGranted: false,
          finalQaApprovalGranted: false,
          billingAuthorityGranted: false,
          publicDeliveryGranted: false,
          productionAuthorityGranted: false,
        })
      const service = createCanonicalCaptionTranscriptSupportServiceV2({
        approvedSnapshotReadPort:
          createCanonicalCaptionApprovedSnapshotReadPort(
            async (scope) => structuredClone(scope)),
        sourceTranscriptReadPort: {
          schemaVersion:
            CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_READ_PORT_VERSION,
          async readCompleted(requestedScope) {
            return stableAuthorityStringify(requestedScope) ===
              stableAuthorityStringify(sourceScope)
              ? structuredClone(transcriptResult) : null
          },
        },
        wordTimingReadPort: createCanonicalCaptionSourceWordTimingReadPort(
          async ({ scope, transcriptAuthorityRef: requestedRef }) =>
            stableAuthorityStringify(scope) ===
              stableAuthorityStringify(sourceScope)
            && stableAuthorityStringify(requestedRef) ===
              stableAuthorityStringify(transcriptAuthorityRef)
              ? structuredClone(timingEvidence) : null,
        ),
        repository,
        now: () => new Date('2026-08-06T12:00:00.000Z'),
      })
      return service.projectAuthenticatedTranscriptForPlanningExpectation({
        canonicalReadScope,
        sourceScopes: [sourceScope],
        planningExpectationRef,
      })
    },
  )
}

function evidenceRef(id: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${sha(id)}`,
  }
}

function sha(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function sourceFrameStartToMilliseconds(
  frame: number,
  fpsNumerator: number,
  fpsDenominator: number,
): number {
  return Math.floor(frame * 1_000 * fpsDenominator / fpsNumerator)
}

function sourceFrameEndToMilliseconds(
  frameExclusive: number,
  fpsNumerator: number,
  fpsDenominator: number,
): number {
  return Math.ceil(
    frameExclusive * 1_000 * fpsDenominator / fpsNumerator,
  )
}

function memoryObjectPort(
  objects: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly({ objectPath, body, contentSha256 }) {
      if (createHash('sha256').update(body).digest('hex') !== contentSha256) {
        throw new Error('Fixture object content digest is invalid.')
      }
      const prior = objects.get(objectPath)
      if (prior) {
        if (!prior.equals(body)) throw new Error('create-only collision')
        return 'already_exists'
      }
      objects.set(objectPath, Buffer.from(body))
      return 'created'
    },
    async readExact(objectPath) {
      const value = objects.get(objectPath)
      return value ? Buffer.from(value) : null
    },
  }
}
