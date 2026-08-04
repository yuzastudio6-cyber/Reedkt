import { createHash } from 'node:crypto'

import type {
  VisualIntelligenceEvidenceRef,
  VisualIntelligencePlanningEvidenceAdmission,
  VisualIntelligenceReport,
} from '../../src/types/visual-intelligence'
import {
  createCanonicalQualityFirstUserTriggeredGpuPolicy,
} from '../edit-architecture/canonical-quality-first-user-triggered-gpu-policy'
import { ApiError } from '../errors/api-error'
import {
  canonicalSourceLedTranscriptEvidenceSchema,
  canonicalSourceLedVisualIntelligenceEvidenceSchema,
  createCanonicalSourceLedSourceFrameAuthority,
  verifyCanonicalSourceLedContentAnalysisEvidence,
  type CanonicalSourceLedContentAnalysisEvidence,
  type CanonicalSourceLedContentAnalysisSourceInput,
} from './canonical-source-led-content-analysis-evidence'
import type {
  CanonicalSourceLedProfessionalContentAnalysisInput,
  CanonicalSourceLedProfessionalContentAnalysisPort,
  CanonicalSourceLedProfessionalContentAnalysisReasoner,
  CanonicalSourceLedProfessionalContentAnalysisSource,
} from './canonical-source-led-professional-content-analysis-port'
import {
  createProfessionalHighVisualIntelligenceQualityPolicy,
  createVisualIntelligenceRequest,
  parseVisualIntelligenceReport,
  visualIntelligenceSourcePlanningSegmentsAreComplete,
} from '../visual-intelligence/visual-intelligence-contract'
import type {
  VisualIntelligenceExecutionOutcome,
  VisualIntelligenceLifecycleService,
} from '../visual-intelligence/visual-intelligence-lifecycle-service'
import type {
  CanonicalSourceCleanupAuthorityRepository,
} from './canonical-source-cleanup-authority-repository'

export const CANONICAL_SOURCE_LED_VISUAL_INTELLIGENCE_PORT_VERSION =
  'canonical-source-led-visual-intelligence-content-analysis-port-v1' as const

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const RAW_SHA256 = /^[a-f0-9]{64}$/u
const PREFIXED_SHA256 = /^sha256:[a-f0-9]{64}$/u

type TranscriptEvidence = CanonicalSourceLedContentAnalysisSourceInput[
  'transcript'
]

export interface CanonicalVisualIntelligenceSourceTranscriptResult {
  readonly schemaVersion:
    'canonical-visual-intelligence-source-transcript-result-v1'
  readonly transcriptAuthorityRef: VisualIntelligenceEvidenceRef
  readonly transcript: TranscriptEvidence
  readonly execution: {
    readonly executionOwner:
      'canonical_quality_first_source_transcript_router'
    readonly sourceAudioDisposition:
      | 'transcribed_on_nvidia_a100_80gb_primary'
      | 'transcribed_on_nvidia_l4_classified_fallback'
      | 'verified_no_audio_stream'
    readonly routeProfileId:
      | 'quality_a100_80gb_user_triggered_heavy_job_v1'
      | 'quality_l4_user_triggered_heavy_fallback_job_v1'
      | null
    readonly acceleratorClass: 'nvidia_a100_80gb' | 'nvidia_l4' | null
    readonly primaryAttemptOutcome:
      | 'completed'
      | 'not_started_terminal'
      | 'not_required_no_audio'
    readonly fallbackAttemptOutcome: 'not_attempted' | 'completed'
    readonly primaryAttemptTerminalFailureClass:
      | 'a100_capacity_unavailable_before_attempt_start'
      | 'a100_job_boot_failed_before_private_media_read'
      | 'a100_runtime_qualification_blocked_before_dispatch'
      | 'a100_driver_or_cuda_incompatible_before_model_load'
      | null
    readonly primaryAttemptReceiptRef: VisualIntelligenceEvidenceRef | null
    readonly completedAttemptReceiptRef: VisualIntelligenceEvidenceRef | null
    readonly completedRuntimeReleaseRef: VisualIntelligenceEvidenceRef | null
    readonly fallbackAdmissionRef: VisualIntelligenceEvidenceRef | null
    readonly attemptCostEvidenceRefs: readonly VisualIntelligenceEvidenceRef[]
    readonly routePolicyDigestSha256: string
    readonly gpuAccelerationUsed: boolean
    readonly cpuInferenceFallbackUsed: false
    readonly completeAudioTimelineProcessed: true
    readonly modelBytesPinnedBeforeExecution: boolean
    readonly runtimeDownloadPerformed: false
    readonly rawAudioPersisted: false
    readonly transcriptRereadVerified: true
    readonly customerCreditMutated: false
    readonly systemFailureChargedToCustomer: false
    readonly unapprovedOverageChargedToCustomer: false
  }
}

export interface CanonicalVisualIntelligenceSourceTranscriptPort {
  analyze(input: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly analysisRunId: string
    readonly source: CanonicalSourceLedProfessionalContentAnalysisSource
  }): Promise<CanonicalVisualIntelligenceSourceTranscriptResult>
}

export interface CanonicalSourceVisualIntelligencePlanningAdmissionPort {
  admit(input: {
    readonly requestId: string
    readonly idempotencyKey: string
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly analysisRunId: string
    readonly source: CanonicalSourceLedProfessionalContentAnalysisSource
    readonly transcriptResult:
      CanonicalVisualIntelligenceSourceTranscriptResult
  }): Promise<VisualIntelligencePlanningEvidenceAdmission>
}

/**
 * Fresh source analysis. Gemini supplies provider-neutral semantic visual
 * evidence; deterministic GPU tools and the complete transcript remain
 * separate authorities; Head Intelligence alone proposes meaning-safe cuts.
 */
export function createVisualIntelligenceCanonicalSourceLedProfessionalContentAnalysisPort(
  input: {
    readonly transcriptPort: CanonicalVisualIntelligenceSourceTranscriptPort
    readonly planningAdmissionPort:
      CanonicalSourceVisualIntelligencePlanningAdmissionPort
    readonly visualIntelligenceLifecycle: VisualIntelligenceLifecycleService
    readonly reasoner: CanonicalSourceLedProfessionalContentAnalysisReasoner
    readonly authorityRepository:
      CanonicalSourceCleanupAuthorityRepository
  },
): CanonicalSourceLedProfessionalContentAnalysisPort {
  const inFlight = new Map<
    string,
    Promise<CanonicalSourceLedContentAnalysisEvidence>
  >()
  return Object.freeze({
    route: 'visual_intelligence_gemini_pro_high_v1' as const,
    analyze(untrustedRequest: CanonicalSourceLedProfessionalContentAnalysisInput) {
      const request = verifyRequest(untrustedRequest)
      const requestDigest = rawDigest({
        schemaVersion:
          'canonical-source-led-visual-intelligence-analysis-request-v1',
        workspaceId: request.workspaceId,
        projectId: request.projectId,
        editSessionId: request.editSessionId,
        planningDirectionDigestSha256:
          request.planningDirectionDigestSha256,
        userInstructionDigestSha256: request.userInstructionDigestSha256,
        fps: request.fps,
        sources: request.sources.map(sourceIdentity),
      })
      const current = inFlight.get(requestDigest)
      if (current) return current
      const promise = analyzeExactRequest({ ...input, request, requestDigest })
      inFlight.set(requestDigest, promise)
      const clear = () => {
        if (inFlight.get(requestDigest) === promise) inFlight.delete(requestDigest)
      }
      void promise.then(clear, clear)
      return promise
    },
  })
}

async function analyzeExactRequest(input: {
  request: CanonicalSourceLedProfessionalContentAnalysisInput
  requestDigest: string
  transcriptPort: CanonicalVisualIntelligenceSourceTranscriptPort
  planningAdmissionPort: CanonicalSourceVisualIntelligencePlanningAdmissionPort
  visualIntelligenceLifecycle: VisualIntelligenceLifecycleService
  reasoner: CanonicalSourceLedProfessionalContentAnalysisReasoner
  authorityRepository: CanonicalSourceCleanupAuthorityRepository
}): Promise<CanonicalSourceLedContentAnalysisEvidence> {
  const analysisRunId = `source_analysis_${input.requestDigest}`
  const transcripts = await Promise.all(input.request.sources.map(
    async (source) => verifyTranscriptResult(
      source,
      await input.transcriptPort.analyze({
        workspaceId: input.request.workspaceId,
        projectId: input.request.projectId,
        editSessionId: input.request.editSessionId,
        analysisRunId,
        source,
      }),
    ),
  ))
  const visualEvidence = await Promise.all(input.request.sources.map(
    async (source, index) => executeVisualAnalysis({
      lifecycle: input.visualIntelligenceLifecycle,
      planningAdmissionPort: input.planningAdmissionPort,
      request: input.request,
      analysisRunId,
      source,
      transcriptResult: transcripts[index]!,
    }),
  ))
  const specialistSources: CanonicalSourceLedContentAnalysisSourceInput[] =
    input.request.sources.map((source, index) => ({
      sourceSequenceItemId: source.sourceSequenceItemId,
      mediaAssetId: source.mediaAssetId,
      uploadedOrder: source.uploadedOrder,
      checksumSha256: source.checksumSha256,
      byteLength: source.byteLength,
      durationFrames: source.durationFrames,
      sourceFrameAuthority: createCanonicalSourceLedSourceFrameAuthority({
        fpsNumerator: source.managedApiAuthority!.fpsNumerator,
        fpsDenominator: source.managedApiAuthority!.fpsDenominator,
        frameCount: source.managedApiAuthority!.frameCount,
        timeBaseNumerator:
          source.managedApiAuthority!.sourceTimeBaseNumerator!,
        timeBaseDenominator:
          source.managedApiAuthority!.sourceTimeBaseDenominator!,
      }),
      transcript: transcripts[index]!.transcript,
      visual: visualEvidence[index]!,
    }))
  const reasoned = await input.reasoner.reason({
    workspaceId: input.request.workspaceId,
    projectId: input.request.projectId,
    editSessionId: input.request.editSessionId,
    analysisRunId,
    planningDirection: input.request.planningDirection,
    planningDirectionDigestSha256:
      input.request.planningDirectionDigestSha256,
    userInstructionDigestSha256:
      input.request.userInstructionDigestSha256,
    fps: 30,
    sources: specialistSources,
  })
  if (reasoned.status !== 'completed' || !reasoned.evidence) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'Head Intelligence could not produce one meaning-safe source selection from the complete transcript and Visual Intelligence report.',
      409,
      {
        requiredGate: 'head_intelligence_visual_intelligence_selection_v1',
        blocker: reasoned.blocker ?? 'provider_failed',
        fallbackUsed: reasoned.fallbackUsed,
        reviewRequiredInstructions:
          reasoned.reviewRequiredInstructions ?? [],
      },
    )
  }
  const evidence = verifyCanonicalSourceLedContentAnalysisEvidence(
    reasoned.evidence,
  )
  if (
    evidence.schemaVersion !==
      'canonical-source-led-content-analysis-evidence-v5'
    || evidence.identity.analysisRunId !== analysisRunId
    || evidence.sources.length !== specialistSources.length
    || evidence.sources.some((source, index) =>
      rawDigest(stripSelections(source)) !==
        rawDigest(specialistSources[index]))
  ) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Head Intelligence returned evidence for a different Visual Intelligence source-analysis request.',
      409,
    )
  }
  await input.authorityRepository.persist({
    scope: {
      ownerUserId:
        input.request.sources[0]!.managedApiAuthority!.ownerUserId,
      workspaceId: input.request.workspaceId,
      projectId: input.request.projectId,
      editSessionId: input.request.editSessionId,
      userInstructionDigestSha256:
        input.request.userInstructionDigestSha256,
      sources: input.request.sources.map((source) => ({
        sourceSequenceItemId: source.sourceSequenceItemId,
        mediaAssetId: source.mediaAssetId,
        uploadedOrder: source.uploadedOrder,
        checksumSha256: source.checksumSha256,
      })),
    },
    evidence,
  })
  return evidence
}

async function executeVisualAnalysis(input: {
  lifecycle: VisualIntelligenceLifecycleService
  planningAdmissionPort: CanonicalSourceVisualIntelligencePlanningAdmissionPort
  request: CanonicalSourceLedProfessionalContentAnalysisInput
  analysisRunId: string
  source: CanonicalSourceLedProfessionalContentAnalysisSource
  transcriptResult: CanonicalVisualIntelligenceSourceTranscriptResult
}): Promise<CanonicalSourceLedContentAnalysisSourceInput['visual']> {
  const authority = input.source.managedApiAuthority!
  const identityDigest = rawDigest({
    analysisRunId: input.analysisRunId,
    sourceSequenceItemId: input.source.sourceSequenceItemId,
    checksumSha256: input.source.checksumSha256,
  })
  const requestId = `vi-source-${identityDigest}`
  const idempotencyKey = `vi-source-idem-${identityDigest}`
  const admission = await input.planningAdmissionPort.admit({
    requestId,
    idempotencyKey,
    workspaceId: input.request.workspaceId,
    projectId: input.request.projectId,
    editSessionId: input.request.editSessionId,
    analysisRunId: input.analysisRunId,
    source: input.source,
    transcriptResult: input.transcriptResult,
  })
  if (
    admission.finalizedSourceAuthorityRefs.length !== 1
    || refKey(admission.finalizedSourceAuthorityRefs[0]!) !==
      refKey(authority.finalizedMediaAuthorityRef)
  ) throw invalid('visual_intelligence_planning_admission_source_mismatch')
  const frameRate = {
    numerator: authority.fpsNumerator,
    denominator: authority.fpsDenominator,
  }
  const request = createVisualIntelligenceRequest({
    requestId,
    idempotencyKey,
    scope: {
      ownerUserId: authority.ownerUserId,
      workspaceId: input.request.workspaceId,
      projectId: input.request.projectId,
      editSessionId: input.request.editSessionId,
      approvedSnapshotId: null,
    },
    operation: 'analyze_media',
    profile: 'source_edit_planning',
    sourceArtifacts: [{
      artifactId: input.source.mediaAssetId,
      mediaKind: 'video',
      contentType: authority.contentType,
      checksumSha256: input.source.checksumSha256,
      byteLength: input.source.byteLength,
      width: authority.width,
      height: authority.height,
      durationFrames: input.source.durationFrames,
      frameRate,
      finalizedMediaAuthorityRef: authority.finalizedMediaAuthorityRef,
      immutableStorageObjectAuthorityRef:
        authority.finalizedStorageObjectAuthorityRef,
      mediaProbeEvidenceRef: authority.sourceProbeAuthorityRef,
      privateArtifact: true,
      exactGenerationRereadRequiredAtDispatch: true,
    }],
    comparisonArtifacts: [],
    requestedRanges: [{
      startFrame: 0,
      endFrameExclusive: input.source.durationFrames,
      frameRate,
    }],
    requiredEvidenceRefs: [
      authority.sourceProbeAuthorityRef,
      input.transcriptResult.transcriptAuthorityRef,
    ],
    expectedOutcomeRefs: [],
    outputFrame: null,
    protectedZones: [],
    qualityPolicy: createProfessionalHighVisualIntelligenceQualityPolicy(),
    admission,
    callerQuestion: null,
    byteFreeRequest: true,
    callerPromptAccepted: false,
    providerCredentialIncluded: false,
    publicMediaUrlIncluded: false,
    signedUrlIsSourceTruth: false,
    shellCommandIncluded: false,
    providerToolDefinitionIncluded: false,
  })
  const outcome = await input.lifecycle.execute(request)
  const report = verifyVisualIntelligenceReport({
    outcome,
    request,
    source: input.source,
  })
  const observations = report.segments.map((segment, index) => ({
    observationId: segment.segmentId,
    windowIndex: index + 1,
    startFrame: segment.range.startFrame,
    endFrameExclusive: segment.range.endFrameExclusive,
    ...segment.sourcePlanning!,
    confidenceBasisPoints: Math.max(100, segment.confidenceBasisPoints),
    evidenceRefs: segment.evidenceRefs,
    providerObservationScope:
      'complete_source_range_semantic_partition' as const,
    exactProviderSampleFramesKnown: false as const,
  }))
  const coverageWithoutDigest = {
    schemaVersion:
      'canonical-source-visual-intelligence-semantic-coverage-v4' as const,
    profileId:
      'visual_intelligence_source_edit_planning_professional_high_v1' as const,
    coveredStartFrame: 0 as const,
    coveredEndFrameExclusive: input.source.durationFrames,
    maximumWindowFrames: 240 as const,
    windowCount: observations.length,
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
  return canonicalSourceLedVisualIntelligenceEvidenceSchema.parse({
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
    requestRef: report.requestRef,
    reportRef: outcome.reportRef,
    admissionRef: report.provenance.admissionRef,
    providerReleaseRef: report.provenance.providerReleaseRef,
    costEvidenceRef: report.usage.costEvidenceRef,
    observationDigestSha256: rawDigest(observations),
    observations,
    coverage: {
      ...coverageWithoutDigest,
      coverageDigestSha256: rawDigest(coverageWithoutDigest),
    },
    lifecycleInvocationDisposition: outcome.status,
    providerCallMadeDuringInvocation:
      outcome.providerCallMadeDuringInvocation,
    costSettledDuringInvocation: outcome.costSettledDuringInvocation,
    exactImmutableReportRereadVerified: true,
    applicationDefaultCredentialsUsed: true,
    accountEffectiveBillingRateUsed:
      report.usage.billingAccountEffectiveRateUsed,
    publicListPriceUsedAsSettlementAuthority:
      report.usage.publicListPriceUsed,
    providerVisualPreprocessingExpected: true,
    completeTimePixelInspectionClaimAllowed: false,
    selfHostedQwenRuntimeUsed: false,
    managedQwenApiUsed: false,
    localQwen25VlRuntimeUsed: false,
    signedReadUrlPersisted: false,
    signedReadUrlReturned: false,
    rawModelOutputPersisted: false,
  })
}

function verifyVisualIntelligenceReport(input: {
  outcome: VisualIntelligenceExecutionOutcome
  request: ReturnType<typeof createVisualIntelligenceRequest>
  source: CanonicalSourceLedProfessionalContentAnalysisSource
}): VisualIntelligenceReport {
  const report = parseVisualIntelligenceReport(input.outcome.report)
  const expectedRequestRef = {
    id: input.request.requestId,
    version: 1,
    contentHash: input.request.requestDigestSha256,
  }
  if (
    refKey(report.requestRef) !== refKey(expectedRequestRef)
    || refKey(input.outcome.reportRef) !==
      `${report.reportId}:1:${report.reportDigestSha256}`
    || report.operation !== 'analyze_media'
    || report.profile !== 'source_edit_planning'
    || report.sourceArtifacts.length !== 1
    || report.sourceArtifacts[0]!.artifactId !== input.source.mediaAssetId
    || report.sourceArtifacts[0]!.checksumSha256 !== input.source.checksumSha256
    || report.sourceArtifacts[0]!.durationFrames !== input.source.durationFrames
    || report.comparisonArtifacts.length !== 0
    || !report.coverage.completeRequestedRangeCoverage
    || report.coverage.incompleteRanges.length !== 0
    || report.coverage.targetedFollowupRanges.length !== 0
    || report.coverage.everyTimelineFrameInspected
    || report.coverage.completeTimePixelInspectionClaimAllowed
    || !report.planningMayConsumeValidatedEvidence
    || report.blockers.length !== 0
    || report.usage.costEvidenceRef === null
    || report.usage.settledCostMicros === null
    || !report.usage.billingAccountEffectiveRateUsed
    || report.usage.publicListPriceUsed
    || report.usage.duplicateSettlementPerformed
    || !visualIntelligenceSourcePlanningSegmentsAreComplete({
      profile: report.profile,
      sourceArtifacts: report.sourceArtifacts,
      segments: report.segments,
      targetedFollowupRangeCount:
        report.coverage.targetedFollowupRanges.length,
    })
  ) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Visual Intelligence report is not exact, complete-source, immutable, and account-effective-cost bound.',
      409,
    )
  }
  return report
}

function verifyTranscriptResult(
  source: CanonicalSourceLedProfessionalContentAnalysisSource,
  raw: CanonicalVisualIntelligenceSourceTranscriptResult,
): CanonicalVisualIntelligenceSourceTranscriptResult {
  const transcript = canonicalSourceLedTranscriptEvidenceSchema.parse(
    raw.transcript,
  )
  const authority = source.managedApiAuthority!
  const execution = raw.execution
  const policy = createCanonicalQualityFirstUserTriggeredGpuPolicy()
  const primary = execution.sourceAudioDisposition ===
    'transcribed_on_nvidia_a100_80gb_primary'
  const fallback = execution.sourceAudioDisposition ===
    'transcribed_on_nvidia_l4_classified_fallback'
  const noAudio = execution.sourceAudioDisposition ===
    'verified_no_audio_stream'
  const validPrimary = primary
    && authority.hasAudio
    && execution.routeProfileId ===
      'quality_a100_80gb_user_triggered_heavy_job_v1'
    && execution.acceleratorClass === 'nvidia_a100_80gb'
    && execution.primaryAttemptOutcome === 'completed'
    && execution.fallbackAttemptOutcome === 'not_attempted'
    && execution.primaryAttemptTerminalFailureClass === null
    && execution.primaryAttemptReceiptRef !== null
    && execution.completedAttemptReceiptRef !== null
    && refKey(execution.completedAttemptReceiptRef) ===
      refKey(execution.primaryAttemptReceiptRef)
    && execution.fallbackAdmissionRef === null
    && execution.attemptCostEvidenceRefs.length === 1
    && execution.gpuAccelerationUsed
    && execution.modelBytesPinnedBeforeExecution
  const validFallback = fallback
    && authority.hasAudio
    && execution.routeProfileId ===
      'quality_l4_user_triggered_heavy_fallback_job_v1'
    && execution.acceleratorClass === 'nvidia_l4'
    && execution.primaryAttemptOutcome === 'not_started_terminal'
    && execution.fallbackAttemptOutcome === 'completed'
    && execution.primaryAttemptTerminalFailureClass !== null
    && policy.fallbackAdmission.allowedPrimaryFailureClasses.includes(
      execution.primaryAttemptTerminalFailureClass,
    )
    && execution.primaryAttemptReceiptRef !== null
    && execution.completedAttemptReceiptRef !== null
    && refKey(execution.completedAttemptReceiptRef) !==
      refKey(execution.primaryAttemptReceiptRef)
    && execution.fallbackAdmissionRef !== null
    && execution.attemptCostEvidenceRefs.length === 2
    && execution.gpuAccelerationUsed
    && execution.modelBytesPinnedBeforeExecution
  const validNoAudio = noAudio
    && !authority.hasAudio
    && execution.routeProfileId === null
    && execution.acceleratorClass === null
    && execution.primaryAttemptOutcome === 'not_required_no_audio'
    && execution.fallbackAttemptOutcome === 'not_attempted'
    && execution.primaryAttemptTerminalFailureClass === null
    && execution.primaryAttemptReceiptRef === null
    && execution.completedAttemptReceiptRef === null
    && execution.fallbackAdmissionRef === null
    && execution.attemptCostEvidenceRefs.length === 0
    && !execution.gpuAccelerationUsed
    && !execution.modelBytesPinnedBeforeExecution
    && transcript.status === 'no_speech'
    && transcript.segments.length === 0
  const transcriptCoverage = { ...transcript.coverage }
  Reflect.deleteProperty(transcriptCoverage, 'coverageDigestSha256')
  const refs = [
    execution.primaryAttemptReceiptRef,
    execution.completedAttemptReceiptRef,
    execution.fallbackAdmissionRef,
    ...execution.attemptCostEvidenceRefs,
  ].filter((value): value is VisualIntelligenceEvidenceRef => value !== null)
  if (
    raw.schemaVersion !==
      'canonical-visual-intelligence-source-transcript-result-v1'
    || !validRef(raw.transcriptAuthorityRef)
    || raw.transcriptAuthorityRef.contentHash !==
      `sha256:${transcript.transcriptDigestSha256}`
    || execution.executionOwner !==
      'canonical_quality_first_source_transcript_router'
    || (!validPrimary && !validFallback && !validNoAudio)
    || execution.routePolicyDigestSha256 !== `sha256:${policy.policyHash}`
    || refs.some((ref) => !validRef(ref))
    || new Set(execution.attemptCostEvidenceRefs.map(refKey)).size !==
      execution.attemptCostEvidenceRefs.length
    || execution.cpuInferenceFallbackUsed
    || !execution.completeAudioTimelineProcessed
    || execution.runtimeDownloadPerformed
    || execution.rawAudioPersisted
    || !execution.transcriptRereadVerified
    || execution.customerCreditMutated
    || execution.systemFailureChargedToCustomer
    || execution.unapprovedOverageChargedToCustomer
    || transcript.coverage.coveredEndFrameExclusive !== source.durationFrames
    || transcript.transcriptDigestSha256 !== rawDigest(transcript.segments)
    || transcript.coverage.coverageDigestSha256 !==
      rawDigest(transcriptCoverage)
    || (transcript.status === 'completed') !==
      (transcript.segments.length > 0)
  ) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Visual Intelligence source transcript is not complete, GPU-routed, source-bound, and reread verified.',
      409,
    )
  }
  return { ...raw, transcript }
}

function verifyRequest(
  input: CanonicalSourceLedProfessionalContentAnalysisInput,
): CanonicalSourceLedProfessionalContentAnalysisInput {
  if (
    !safeId(input.workspaceId)
    || !safeId(input.projectId)
    || !safeId(input.editSessionId)
    || input.fps !== 30
    || !RAW_SHA256.test(input.planningDirectionDigestSha256)
    || !RAW_SHA256.test(input.userInstructionDigestSha256)
    || input.planningDirection !== input.planningDirection.trim()
    || input.planningDirection.length < 1
    || input.planningDirection.length > 8_000
    || rawDigestText(input.planningDirection) !==
      input.planningDirectionDigestSha256
    || input.sources.length < 1
    || input.sources.length > 8
  ) throw invalid('visual_intelligence_source_request_invalid')
  const sourceIds = new Set<string>()
  const mediaIds = new Set<string>()
  let ownerUserId: string | undefined
  input.sources.forEach((source, index) => {
    const authority = source.managedApiAuthority
    if (
      !safeId(source.sourceSequenceItemId)
      || !safeId(source.mediaAssetId)
      || source.uploadedOrder !== index + 1
      || sourceIds.has(source.sourceSequenceItemId)
      || mediaIds.has(source.mediaAssetId)
      || source.storageProvider !== 'google_cloud_storage'
      || !RAW_SHA256.test(source.checksumSha256)
      || !Number.isSafeInteger(source.byteLength)
      || source.byteLength < 1
      || !Number.isSafeInteger(source.durationFrames)
      || source.durationFrames < 1
      || !authority
      || !safeId(authority.ownerUserId)
      || (ownerUserId !== undefined &&
        authority.ownerUserId !== ownerUserId)
      || authority.storageBucket !== source.storageBucket
      || authority.storagePath !== source.storagePath
      || authority.contentType !== 'video/mp4'
      || (authority.hasAudio !==
        (authority.audioProbe.disposition === 'verified_audio_stream'))
      || authority.frameCount !== source.durationFrames
      || !positiveInteger(authority.fpsNumerator)
      || !positiveInteger(authority.fpsDenominator)
      || !positiveInteger(authority.sourceTimeBaseNumerator)
      || !positiveInteger(authority.sourceTimeBaseDenominator)
      || !positiveInteger(authority.width)
      || !positiveInteger(authority.height)
      || !validRefSet([
        authority.finalizedMediaAuthorityRef,
        authority.finalizedStorageObjectAuthorityRef,
        authority.sourceProbeAuthorityRef,
      ])
    ) throw invalid(`visual_intelligence_source_${index + 1}_invalid`)
    sourceIds.add(source.sourceSequenceItemId)
    mediaIds.add(source.mediaAssetId)
    ownerUserId = authority.ownerUserId
  })
  return input
}

function sourceIdentity(
  source: CanonicalSourceLedProfessionalContentAnalysisSource,
): Record<string, unknown> {
  const authority = source.managedApiAuthority!
  return {
    sourceSequenceItemId: source.sourceSequenceItemId,
    mediaAssetId: source.mediaAssetId,
    uploadedOrder: source.uploadedOrder,
    checksumSha256: source.checksumSha256,
    byteLength: source.byteLength,
    durationFrames: source.durationFrames,
    storageGeneration: authority.storageGeneration,
    storageEtag: authority.storageEtag,
    width: authority.width,
    height: authority.height,
    fpsNumerator: authority.fpsNumerator,
    fpsDenominator: authority.fpsDenominator,
    frameCount: authority.frameCount,
    sourceTimeBaseNumerator: authority.sourceTimeBaseNumerator,
    sourceTimeBaseDenominator: authority.sourceTimeBaseDenominator,
    finalizedMediaAuthorityRef: authority.finalizedMediaAuthorityRef,
    finalizedStorageObjectAuthorityRef:
      authority.finalizedStorageObjectAuthorityRef,
    sourceProbeAuthorityRef: authority.sourceProbeAuthorityRef,
  }
}

function stripSelections(
  source: CanonicalSourceLedContentAnalysisEvidence['sources'][number],
): CanonicalSourceLedContentAnalysisSourceInput {
  const {
    selectedRanges: _selectedRanges,
    removedRanges: _removedRanges,
    embeddedEditInstructions: _embeddedEditInstructions,
    ...specialist
  } = source
  void _selectedRanges
  void _removedRanges
  void _embeddedEditInstructions
  return specialist
}

function validRef(ref: VisualIntelligenceEvidenceRef): boolean {
  return safeId(ref.id)
    && positiveInteger(ref.version)
    && PREFIXED_SHA256.test(ref.contentHash)
}

function validRefSet(refs: readonly VisualIntelligenceEvidenceRef[]): boolean {
  return refs.every(validRef)
    && new Set(refs.map(refKey)).size === refs.length
}

function refKey(ref: VisualIntelligenceEvidenceRef): string {
  return `${ref.id}:${ref.version}:${ref.contentHash}`
}

function safeId(value: unknown): value is string {
  return typeof value === 'string' && SAFE_ID.test(value)
}

function positiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0
}

function rawDigest(value: unknown): string {
  return rawDigestText(stableStringify(value))
}

function rawDigestText(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`
  }
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
      .map(([key, item]) =>
        `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function invalid(code: string): ApiError {
  return new ApiError(
    'VALIDATION_FAILED',
    `Canonical source Visual Intelligence validation failed: ${code}.`,
    409,
    { blockerCode: code },
  )
}
