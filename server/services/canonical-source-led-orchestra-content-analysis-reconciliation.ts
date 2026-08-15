import type { OrchestraEvidenceRef } from '../../src/types/orchestra-skill-capability'
import type { VisualIntelligenceEvidenceRef } from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import {
  orchestraDigest,
  orchestraEvidenceRef,
} from '../orchestra/orchestra-skill-capability-contract'
import {
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
  assertCanonicalSourceCleanupBindingMatchesEvidence,
} from './canonical-source-cleanup-visual-intelligence-binding'
import type {
  CanonicalSourceCleanupAuthorityRepository,
  CanonicalSourceCleanupAuthorityScope,
} from './canonical-source-cleanup-authority-repository'
import type {
  CanonicalSourceVisualIntelligenceOrchestraBindingScope,
  CanonicalSourceVisualIntelligenceOrchestraReadPort,
} from './canonical-source-visual-intelligence-orchestra-result-bridge'
import {
  CANONICAL_SOURCE_VISUAL_INTELLIGENCE_ORCHESTRA_READ_PORT_VERSION,
} from './canonical-source-visual-intelligence-orchestra-result-bridge'
import {
  canonicalSourceLedProfessionalContentAnalysisSourceIdentity,
  createCanonicalSourceLedProfessionalContentAnalysisRequestIdentity,
  stripCanonicalSourceLedContentAnalysisSelections,
  verifyCanonicalVisualIntelligenceSourceTranscriptResult,
  type CanonicalVisualIntelligenceSourceTranscriptResult,
} from './canonical-source-visual-intelligence-analysis-contract'

export const CANONICAL_SOURCE_LED_ORCHESTRA_RECONCILIATION_VERSION =
  'canonical-source-led-orchestra-content-analysis-reconciliation-v1' as const
export const CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_READ_PORT_VERSION =
  'canonical-source-transcript-orchestra-read-port-v1' as const

export interface CanonicalSourceTranscriptOrchestraReadScope {
  readonly ownerUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly analysisRunId: string
  readonly sourceSequenceItemId: string
  readonly mediaAssetId: string
  readonly uploadedOrder: number
  readonly checksumSha256: string
  readonly byteLength: number
  readonly durationFrames: number
  readonly sourceFrameAuthority: ReturnType<
    typeof createCanonicalSourceLedSourceFrameAuthority
  >
  readonly finalizedMediaAuthorityRef: VisualIntelligenceEvidenceRef
  readonly sourceProbeAuthorityRef: VisualIntelligenceEvidenceRef
}

/**
 * Read-only Head/Orchestra boundary. The reconciler cannot start a transcript
 * worker; it can consume only a completed, immutable, exact-source reread.
 */
export interface CanonicalSourceTranscriptOrchestraReadPort {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_READ_PORT_VERSION
  readCompleted(
    scope: CanonicalSourceTranscriptOrchestraReadScope,
  ): Promise<CanonicalVisualIntelligenceSourceTranscriptResult | null>
}

export interface CanonicalSourceLedOrchestraReconciliationPort
  extends CanonicalSourceLedProfessionalContentAnalysisPort {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_LED_ORCHESTRA_RECONCILIATION_VERSION
  readonly completedTranscriptRereadRequired: true
  readonly completedVisualIntelligenceRereadRequired: true
  readonly visualIntelligenceResultMustReturnThroughOrchestra: true
  readonly headDirectProviderDispatchAllowed: false
  readonly headDirectGpuDispatchAllowed: false
}

/**
 * Reconciles completed specialist evidence into one Head Intelligence cleanup
 * decision. It intentionally has no provider, GPU, queue, lease, or worker
 * dispatch port. Those executions must already have completed through
 * Orchestra and their canonical stores before this function can succeed.
 */
export function createCanonicalSourceLedOrchestraContentAnalysisReconciliationPort(
  input: {
    readonly transcriptReadPort: CanonicalSourceTranscriptOrchestraReadPort
    readonly visualIntelligenceReadPort:
      CanonicalSourceVisualIntelligenceOrchestraReadPort
    readonly reasoner: CanonicalSourceLedProfessionalContentAnalysisReasoner
    readonly authorityRepository:
      CanonicalSourceCleanupAuthorityRepository
  },
): CanonicalSourceLedOrchestraReconciliationPort {
  if (
    input.transcriptReadPort?.schemaVersion !==
      CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_READ_PORT_VERSION
    || typeof input.transcriptReadPort.readCompleted !== 'function'
    || input.visualIntelligenceReadPort?.schemaVersion !==
      CANONICAL_SOURCE_VISUAL_INTELLIGENCE_ORCHESTRA_READ_PORT_VERSION
    || typeof input.visualIntelligenceReadPort
      ?.readCompletedSourceVideoUnderstanding !== 'function'
    || typeof input.reasoner?.reason !== 'function'
    || typeof input.authorityRepository?.persist !== 'function'
    || typeof input.authorityRepository?.readForPlanning !== 'function'
  ) throw notReady('source_orchestra_reconciliation_dependencies_invalid')

  const inFlight = new Map<
    string,
    Promise<CanonicalSourceLedContentAnalysisEvidence>
  >()
  return Object.freeze({
    schemaVersion: CANONICAL_SOURCE_LED_ORCHESTRA_RECONCILIATION_VERSION,
    route: 'visual_intelligence_gemini_pro_high_v1' as const,
    completedTranscriptRereadRequired: true as const,
    completedVisualIntelligenceRereadRequired: true as const,
    visualIntelligenceResultMustReturnThroughOrchestra: true as const,
    headDirectProviderDispatchAllowed: false as const,
    headDirectGpuDispatchAllowed: false as const,
    analyze(
      untrustedRequest: CanonicalSourceLedProfessionalContentAnalysisInput,
    ) {
      const identity =
        createCanonicalSourceLedProfessionalContentAnalysisRequestIdentity(
          untrustedRequest,
        )
      if (
        identity.request.planningDirectionDigestSha256 ===
          identity.request.userInstructionDigestSha256
      ) throw invalid('source_planning_and_saved_chat_authority_conflated')
      const current = inFlight.get(identity.requestDigest)
      if (current) return current
      const promise = reconcileExactRequest({ ...input, ...identity })
      inFlight.set(identity.requestDigest, promise)
      const clear = () => {
        if (inFlight.get(identity.requestDigest) === promise) {
          inFlight.delete(identity.requestDigest)
        }
      }
      void promise.then(clear, clear)
      return promise
    },
  })
}

export function createCanonicalSourceVisualIntelligenceOrchestraReconciliationScope(
  input: {
    readonly request: CanonicalSourceLedProfessionalContentAnalysisInput
    readonly analysisRunId: string
    readonly source: CanonicalSourceLedProfessionalContentAnalysisSource
    readonly transcriptResult:
      CanonicalVisualIntelligenceSourceTranscriptResult
  },
): CanonicalSourceVisualIntelligenceOrchestraBindingScope {
  const sourceIndex = input.request.sources.findIndex((source) =>
    stableStringify(
      canonicalSourceLedProfessionalContentAnalysisSourceIdentity(source),
    ) === stableStringify(
      canonicalSourceLedProfessionalContentAnalysisSourceIdentity(input.source),
    ))
  if (sourceIndex < 0) throw invalid('source_reconciliation_scope_not_in_request')
  const source = input.request.sources[sourceIndex]!
  const transcriptResult =
    verifyCanonicalVisualIntelligenceSourceTranscriptResult(
      source,
      input.transcriptResult,
    )
  const authority = source.managedApiAuthority!
  const sourceFrameAuthority = createCanonicalSourceLedSourceFrameAuthority({
    fpsNumerator: authority.fpsNumerator,
    fpsDenominator: authority.fpsDenominator,
    frameCount: authority.frameCount,
    timeBaseNumerator: authority.sourceTimeBaseNumerator!,
    timeBaseDenominator: authority.sourceTimeBaseDenominator!,
  })
  const contextDigest = orchestraDigest({
    planningDirectionDigestSha256:
      input.request.planningDirectionDigestSha256,
    userInstructionDigestSha256:
      input.request.userInstructionDigestSha256,
  })
  return Object.freeze({
    ownerUserId: authority.ownerUserId,
    workspaceId: input.request.workspaceId,
    projectId: input.request.projectId,
    editSessionId: input.request.editSessionId,
    analysisRunId: input.analysisRunId,
    sourceSequenceItemId: source.sourceSequenceItemId,
    mediaAssetId: source.mediaAssetId,
    uploadedOrder: source.uploadedOrder,
    checksumSha256: source.checksumSha256,
    byteLength: source.byteLength,
    durationFrames: source.durationFrames,
    sourceFrameAuthority,
    sourceArtifactRef: cloneRef(authority.finalizedMediaAuthorityRef),
    sourceProbeAuthorityRef: cloneRef(authority.sourceProbeAuthorityRef),
    transcriptAuthorityRef: cloneRef(
      transcriptResult.transcriptAuthorityRef,
    ),
    transcriptDigestSha256:
      transcriptResult.transcript.transcriptDigestSha256,
    planningDirectionDigestSha256:
      input.request.planningDirectionDigestSha256,
    userInstructionDigestSha256:
      input.request.userInstructionDigestSha256,
    planningContextAuthorityRef: orchestraEvidenceRef(
      `source-analysis-context-${contextDigest.slice(7, 39)}`,
      contextDigest,
    ),
  })
}

async function reconcileExactRequest(input: {
  readonly request: CanonicalSourceLedProfessionalContentAnalysisInput
  readonly requestDigest: string
  readonly analysisRunId: string
  readonly transcriptReadPort: CanonicalSourceTranscriptOrchestraReadPort
  readonly visualIntelligenceReadPort:
    CanonicalSourceVisualIntelligenceOrchestraReadPort
  readonly reasoner: CanonicalSourceLedProfessionalContentAnalysisReasoner
  readonly authorityRepository: CanonicalSourceCleanupAuthorityRepository
}): Promise<CanonicalSourceLedContentAnalysisEvidence> {
  const repositoryScope = cleanupAuthorityScope(input.request)
  const existing = await input.authorityRepository.readForPlanning(
    repositoryScope,
  )
  if (existing.status === 'ready') {
    return assertPersistedEvidence({
      persisted: existing,
      request: input.request,
      analysisRunId: input.analysisRunId,
    })
  }

  const transcripts = await Promise.all(input.request.sources.map(
    async (source, index) => {
      const scope = transcriptScope({
        request: input.request,
        analysisRunId: input.analysisRunId,
        source,
      })
      const result = await input.transcriptReadPort.readCompleted(scope)
      if (!result) throw notReady(
        `source_transcript_orchestra_result_${index + 1}_not_ready`,
      )
      return verifyCanonicalVisualIntelligenceSourceTranscriptResult(
        source,
        result,
      )
    },
  ))
  const visual = await Promise.all(input.request.sources.map(
    async (source, index) => {
      const scope =
        createCanonicalSourceVisualIntelligenceOrchestraReconciliationScope({
          request: input.request,
          analysisRunId: input.analysisRunId,
          source,
          transcriptResult: transcripts[index]!,
        })
      const result = await input.visualIntelligenceReadPort
        .readCompletedSourceVideoUnderstanding(scope)
      if (!result) throw notReady(
        `source_visual_intelligence_orchestra_result_${index + 1}_not_ready`,
      )
      return verifyOrchestraVisualEvidence(result, scope)
    },
  ))
  const specialistSources = input.request.sources.map((source, index) => {
    const authority = source.managedApiAuthority!
    return {
      sourceSequenceItemId: source.sourceSequenceItemId,
      mediaAssetId: source.mediaAssetId,
      uploadedOrder: source.uploadedOrder,
      checksumSha256: source.checksumSha256,
      byteLength: source.byteLength,
      durationFrames: source.durationFrames,
      sourceFrameAuthority: createCanonicalSourceLedSourceFrameAuthority({
        fpsNumerator: authority.fpsNumerator,
        fpsDenominator: authority.fpsDenominator,
        frameCount: authority.frameCount,
        timeBaseNumerator: authority.sourceTimeBaseNumerator!,
        timeBaseDenominator: authority.sourceTimeBaseDenominator!,
      }),
      transcript: transcripts[index]!.transcript,
      visual: visual[index]!,
    } satisfies CanonicalSourceLedContentAnalysisSourceInput
  })
  const reasoned = await input.reasoner.reason({
    workspaceId: input.request.workspaceId,
    projectId: input.request.projectId,
    editSessionId: input.request.editSessionId,
    analysisRunId: input.analysisRunId,
    planningDirection: input.request.planningDirection,
    planningDirectionDigestSha256:
      input.request.planningDirectionDigestSha256,
    userInstructionDigestSha256:
      input.request.userInstructionDigestSha256,
    fps: 30,
    sources: specialistSources,
  })
  if (reasoned.status !== 'completed' || !reasoned.evidence) {
    throw notReady('head_intelligence_source_cleanup_result_not_ready')
  }
  const evidence = verifyCanonicalSourceLedContentAnalysisEvidence(
    reasoned.evidence,
  )
  if (
    evidence.schemaVersion !==
      'canonical-source-led-content-analysis-evidence-v5'
    || evidence.identity.analysisRunId !== input.analysisRunId
    || evidence.identity.userInstructionDigestSha256 !==
      input.request.userInstructionDigestSha256
    || evidence.sources.length !== specialistSources.length
    || evidence.sources.some((source, index) =>
      stableStringify(stripCanonicalSourceLedContentAnalysisSelections(source))
        !== stableStringify(specialistSources[index]))
    || evidence.sources.some((source) =>
      !('evidenceMode' in source.visual)
      || source.visual.evidenceMode !==
        'visual_intelligence_gemini_pro_high_v1'
      || !source.visual.orchestraLineage)
  ) throw invalid('head_source_cleanup_evidence_scope_mismatch')

  const persisted = await input.authorityRepository.persist({
    scope: repositoryScope,
    evidence,
  })
  return assertPersistedEvidence({
    persisted,
    request: input.request,
    analysisRunId: input.analysisRunId,
  })
}

function transcriptScope(input: {
  readonly request: CanonicalSourceLedProfessionalContentAnalysisInput
  readonly analysisRunId: string
  readonly source: CanonicalSourceLedProfessionalContentAnalysisSource
}): CanonicalSourceTranscriptOrchestraReadScope {
  const authority = input.source.managedApiAuthority!
  return Object.freeze({
    ownerUserId: authority.ownerUserId,
    workspaceId: input.request.workspaceId,
    projectId: input.request.projectId,
    editSessionId: input.request.editSessionId,
    analysisRunId: input.analysisRunId,
    sourceSequenceItemId: input.source.sourceSequenceItemId,
    mediaAssetId: input.source.mediaAssetId,
    uploadedOrder: input.source.uploadedOrder,
    checksumSha256: input.source.checksumSha256,
    byteLength: input.source.byteLength,
    durationFrames: input.source.durationFrames,
    sourceFrameAuthority: createCanonicalSourceLedSourceFrameAuthority({
      fpsNumerator: authority.fpsNumerator,
      fpsDenominator: authority.fpsDenominator,
      frameCount: authority.frameCount,
      timeBaseNumerator: authority.sourceTimeBaseNumerator!,
      timeBaseDenominator: authority.sourceTimeBaseDenominator!,
    }),
    finalizedMediaAuthorityRef: cloneRef(
      authority.finalizedMediaAuthorityRef,
    ),
    sourceProbeAuthorityRef: cloneRef(authority.sourceProbeAuthorityRef),
  })
}

function verifyOrchestraVisualEvidence(
  untrusted: unknown,
  scope: CanonicalSourceVisualIntelligenceOrchestraBindingScope,
): CanonicalSourceLedContentAnalysisSourceInput['visual'] {
  let visual: ReturnType<
    typeof canonicalSourceLedVisualIntelligenceEvidenceSchema.parse
  >
  try {
    visual = canonicalSourceLedVisualIntelligenceEvidenceSchema.parse(
      untrusted,
    )
  } catch {
    throw invalid('source_orchestra_visual_evidence_invalid')
  }
  const lineage = visual.orchestraLineage
  const observations = visual.observations
  if (
    !lineage
    || !sameRef(visual.requestRef, lineage.compiledRequestRef)
    || lineage.callRef.id !== lineage.compiledRequestRef.id
    || visual.lifecycleInvocationDisposition !== 'completed'
    || !visual.providerCallMadeDuringInvocation
    || !visual.costSettledDuringInvocation
    || visual.coverage.coveredStartFrame !== 0
    || visual.coverage.coveredEndFrameExclusive !== scope.durationFrames
    || visual.coverage.windowCount !== observations.length
    || visual.coverage.gapCount !== 0
    || !visual.coverage.completeSourceRangeRequested
    || !visual.coverage.completeRequestedRangeSemanticCoverage
    || !visual.coverage.orderedGaplessObservationPartition
    || !visual.coverage.deterministicGpuEvidenceUsed
    || visual.coverage.everyTimelineFrameInspected
    || visual.coverage.completeTimePixelInspectionClaimAllowed
    || visual.coverage.providerAudioUnderstandingClaimAllowed
    || !visual.coverage
      .completeAudioTranscriptSuppliedToHeadReasonerSeparately
    || observations.some((observation, index) =>
      observation.windowIndex !== index + 1
      || observation.startFrame !==
        (index === 0 ? 0 : observations[index - 1]!.endFrameExclusive))
    || observations.at(-1)?.endFrameExclusive !== scope.durationFrames
  ) throw invalid('source_orchestra_visual_evidence_scope_mismatch')
  return visual
}

function cleanupAuthorityScope(
  request: CanonicalSourceLedProfessionalContentAnalysisInput,
): CanonicalSourceCleanupAuthorityScope {
  return {
    ownerUserId: request.sources[0]!.managedApiAuthority!.ownerUserId,
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
}

function assertPersistedEvidence(input: {
  readonly persisted: Awaited<
    ReturnType<CanonicalSourceCleanupAuthorityRepository['persist']>
  >
  readonly request: CanonicalSourceLedProfessionalContentAnalysisInput
  readonly analysisRunId: string
}): CanonicalSourceLedContentAnalysisEvidence {
  const evidence = verifyCanonicalSourceLedContentAnalysisEvidence(
    input.persisted.authority.evidence,
  )
  const binding = assertCanonicalSourceCleanupBindingMatchesEvidence({
    binding: input.persisted.authority.binding,
    evidence,
  })
  if (
    evidence.identity.analysisRunId !== input.analysisRunId
    || binding.scope.planningDirectionDigestSha256 !==
      input.request.planningDirectionDigestSha256
    || binding.scope.userInstructionDigestSha256 !==
      input.request.userInstructionDigestSha256
    || !input.persisted.repositoryRecordRef.contentHash.startsWith('sha256:')
    || evidence.sources.some((source) =>
      !('evidenceMode' in source.visual)
      || source.visual.evidenceMode !==
        'visual_intelligence_gemini_pro_high_v1'
      || !source.visual.orchestraLineage)
  ) throw invalid('source_cleanup_persisted_reconciliation_mismatch')
  return evidence
}

function cloneRef<T extends VisualIntelligenceEvidenceRef>(ref: T): T {
  return { ...ref }
}

function sameRef(
  left: OrchestraEvidenceRef | VisualIntelligenceEvidenceRef,
  right: OrchestraEvidenceRef | VisualIntelligenceEvidenceRef,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
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

function invalid(blockerCode: string): ApiError {
  return new ApiError(
    'VALIDATION_FAILED',
    `Canonical source Head/Orchestra reconciliation failed: ${blockerCode}.`,
    409,
    { blockerCode },
  )
}

function notReady(blockerCode: string): ApiError {
  return new ApiError(
    'JOB_DEPENDENCY_NOT_READY',
    `Canonical source Head/Orchestra dependency is not ready: ${blockerCode}.`,
    409,
    { blockerCode },
  )
}
