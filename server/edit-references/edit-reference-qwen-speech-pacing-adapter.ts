import { randomUUID } from 'node:crypto'
import {
  EDIT_REFERENCE_SPEECH_PACING_STUDY_RESULT_VERSION,
  createBlockedEditReferenceSpeechPacingStudyResult,
  hashEditReferenceSpeechPacingStudyRequest,
  validateEditReferenceSpeechPacingStudyRequest,
  validateEditReferenceSpeechPacingStudyResult,
  type EditReferenceAnalyzedSpeechPacingStudyResult,
  type EditReferenceSpeechPacingFinding,
  type EditReferenceSpeechPacingStudyAdapter,
  type EditReferenceSpeechPacingStudyBlockerCode,
  type EditReferenceSpeechPacingStudyRequest,
  type EditReferenceSpeechPacingStudyResult,
} from './edit-reference-speech-pacing-study-contract'
import {
  qwenSpeechPacingStructuredContextSchema,
  type EditReferenceSpeechPacingProviderResult,
  type EditReferenceSpeechPacingReasoningProvider,
  type QwenSpeechPacingStructuredContext,
} from '../services/qwen-speech-pacing-provider'
import {
  getEditReferenceReasoningRouteDisplayName,
  getEditReferenceReasoningRouteRetryReason,
  validateEditReferenceReasoningRouteAuthorization,
  type EditReferenceReasoningRouteAuthorization,
  type EditReferenceReasoningRouteId,
} from './edit-reference-reasoning-route-authorization'

export const EDIT_REFERENCE_QWEN_SPEECH_PACING_ADAPTER_ID =
  'edit_reference_qwen_speech_pacing_adapter' as const
export const EDIT_REFERENCE_QWEN_SPEECH_PACING_ADAPTER_VERSION = 'v1' as const
export const EDIT_REFERENCE_ROUTED_SPEECH_PACING_ADAPTER_ID =
  'edit_reference_routed_speech_pacing_adapter' as const
export const EDIT_REFERENCE_ROUTED_SPEECH_PACING_ADAPTER_VERSION = 'v1' as const

export interface EditReferenceSpeechPacingUsageAuthorization {
  readonly usageEventIds: readonly string[]
  readonly internalCostRecordIds: readonly string[]
}

export interface EditReferenceSpeechPacingUsageReceipt
  extends EditReferenceSpeechPacingUsageAuthorization {
  readonly meteredInternalCostMicros: string
}

export interface EditReferenceSpeechPacingProductionUsageAuthority {
  authorize(
    request: EditReferenceSpeechPacingStudyRequest,
  ): Promise<EditReferenceSpeechPacingUsageAuthorization>
  reconcile(input: {
    readonly request: EditReferenceSpeechPacingStudyRequest
    readonly providerResult: EditReferenceSpeechPacingProviderResult
    readonly authorization: EditReferenceSpeechPacingUsageAuthorization
  }): Promise<EditReferenceSpeechPacingUsageReceipt>
}

export interface EditReferenceQwenSpeechPacingAdapterOptions {
  readonly provider: EditReferenceSpeechPacingReasoningProvider
  readonly structuredContext: QwenSpeechPacingStructuredContext
  readonly reasoningRouteAuthorization?: EditReferenceReasoningRouteAuthorization
  readonly productionUsageAuthority?: EditReferenceSpeechPacingProductionUsageAuthority
  readonly temporaryAudioCleaned: true
  readonly now?: () => string
  readonly createExecutionId?: () => string
}

export interface EditReferenceRoutedSpeechPacingAdapterOptions
  extends EditReferenceQwenSpeechPacingAdapterOptions {
  readonly expectedReasoningRouteId: EditReferenceReasoningRouteId
  readonly adapterId?: string
  readonly adapterVersion?: string
}

interface PendingBlockedResult {
  readonly kind: 'blocked'
  readonly blockerCode: EditReferenceSpeechPacingStudyBlockerCode
  readonly blockerMessage: string
  readonly retryAvailable: boolean
  readonly retryReason?: string
  readonly providerResult?: EditReferenceSpeechPacingProviderResult
  readonly usage?: {
    readonly internalCostStatus: 'metered' | 'unverified'
    readonly meteredInternalCostMicros: string | null
    readonly usageEventIds: readonly string[]
    readonly internalCostRecordIds: readonly string[]
  }
}

interface PendingAnalyzedResult {
  readonly kind: 'analyzed'
  readonly providerResult: EditReferenceSpeechPacingProviderResult
  readonly usageReceipt?: EditReferenceSpeechPacingUsageReceipt
}

type PendingAdapterResult = PendingBlockedResult | PendingAnalyzedResult

const MONEY_MICROS = /^(?:0|[1-9][0-9]{0,15})$/
const EXACT_TIMING_IN_SUMMARY = /\b\d+(?:\.\d+)?\s*(?:frames?|milliseconds?|ms|seconds?|secs?)\b/i
const QUOTED_SOURCE_LANGUAGE = /["“”][^"“”]{3,}["“”]/

export function createEditReferenceQwenSpeechPacingAdapter(
  options: EditReferenceQwenSpeechPacingAdapterOptions,
): EditReferenceSpeechPacingStudyAdapter {
  return createEditReferenceRoutedSpeechPacingAdapter({
    ...options,
    expectedReasoningRouteId: 'qwen_3_7_fallback',
    adapterId: EDIT_REFERENCE_QWEN_SPEECH_PACING_ADAPTER_ID,
    adapterVersion: EDIT_REFERENCE_QWEN_SPEECH_PACING_ADAPTER_VERSION,
  })
}

export function createEditReferenceRoutedSpeechPacingAdapter(
  options: EditReferenceRoutedSpeechPacingAdapterOptions,
): EditReferenceSpeechPacingStudyAdapter {
  const adapterId = options.adapterId ?? EDIT_REFERENCE_ROUTED_SPEECH_PACING_ADAPTER_ID
  const adapterVersion = options.adapterVersion ?? EDIT_REFERENCE_ROUTED_SPEECH_PACING_ADAPTER_VERSION
  return {
    adapterId,
    adapterVersion,
    async analyze(request): Promise<EditReferenceSpeechPacingStudyResult> {
      validateEditReferenceSpeechPacingStudyRequest(request)
      const startedAt = now(options)
      const executionId = options.createExecutionId?.()
        ?? `edit-reference-speech-pacing-${randomUUID()}`
      let privateTranscriptArtifactRead = false
      let structuredTimingEvidenceRead = false
      let providerResult: EditReferenceSpeechPacingProviderResult | undefined
      let authorization: EditReferenceSpeechPacingUsageAuthorization | undefined
      let usageReceipt: EditReferenceSpeechPacingUsageReceipt | undefined
      let verifiedRouteAuthorization: EditReferenceReasoningRouteAuthorization | undefined
      let pendingResult: PendingAdapterResult | undefined

      try {
        assertExactStructuredTranscript(request, options.structuredContext)
        privateTranscriptArtifactRead = true
        structuredTimingEvidenceRead = true
        const routeAuthorization = request.executionScope === 'production'
          ? validateEditReferenceReasoningRouteAuthorization({
              authorization: options.reasoningRouteAuthorization,
              expectedLane: 'speech_pacing',
              expectedRouteId: options.expectedReasoningRouteId,
              requestDigestSha256: hashEditReferenceSpeechPacingStudyRequest(request),
              costAuthority: request,
            })
          : undefined
        verifiedRouteAuthorization = routeAuthorization?.ok
          ? options.reasoningRouteAuthorization
          : undefined
        if (request.executionScope === 'controlled_test') {
          if (options.provider.executionMode !== 'controlled_local') {
            pendingResult = {
              kind: 'blocked',
              blockerCode: 'cost_authority_unavailable',
              blockerMessage: 'An unmetered controlled Speech/Pacing study cannot call the live reasoning provider.',
              retryAvailable: true,
              retryReason: 'Retry with a reviewed local analyzer or an approved production estimate, budget, rate card, and usage recorder.',
            }
          } else {
            providerResult = await options.provider.analyze(options.structuredContext)
            pendingResult = providerResult.status === 'completed'
              ? { kind: 'analyzed', providerResult }
              : blockedProviderResult(providerResult)
          }
        } else if (!routeAuthorization?.ok) {
          pendingResult = {
            kind: 'blocked',
            blockerCode: 'model_routing_unavailable',
            blockerMessage: `${getEditReferenceReasoningRouteDisplayName(options.expectedReasoningRouteId)} Speech/Pacing reasoning lacks exact shared-route authority.`,
            retryAvailable: true,
            retryReason: getEditReferenceReasoningRouteRetryReason(options.expectedReasoningRouteId),
          }
        } else if (options.provider.executionMode !== 'live_provider') {
          pendingResult = {
            kind: 'blocked',
            blockerCode: 'model_routing_unavailable',
            blockerMessage: 'Production Speech/Pacing requires the reviewed live reasoning route.',
            retryAvailable: true,
            retryReason: 'Restore the reviewed live reasoning route and retry under the exact approved cost authority.',
          }
        } else if (!options.productionUsageAuthority) {
          pendingResult = {
            kind: 'blocked',
            blockerCode: 'cost_authority_unavailable',
            blockerMessage: 'Canonical internal-cost authority is unavailable, so no private Speech/Pacing provider call was made.',
            retryAvailable: true,
            retryReason: 'Restore the exact estimate, budget, rate card, and attempt-level usage authority, then retry.',
          }
        } else {
          try {
            authorization = await options.productionUsageAuthority.authorize(request)
            assertUsageAuthorization(authorization)
          } catch {
            pendingResult = {
              kind: 'blocked',
              blockerCode: 'cost_authority_unavailable',
              blockerMessage: 'Canonical internal-cost authority did not authorize this exact Speech/Pacing request.',
              retryAvailable: true,
              retryReason: 'Refresh the exact estimate, budget, and immutable rate-card authority before retrying.',
            }
          }
          if (authorization) {
            providerResult = await options.provider.analyze(options.structuredContext)
            const executionStarted = providerResult.execution.providerCallMade
              || providerResult.execution.modelCallMade
              || providerResult.execution.workerJobCreated
            if (executionStarted || providerResult.status === 'completed') {
              try {
                usageReceipt = await options.productionUsageAuthority.reconcile({
                  request,
                  providerResult,
                  authorization,
                })
                assertUsageReceipt(request, authorization, usageReceipt, providerResult.status === 'completed')
              } catch {
                pendingResult = {
                  kind: 'blocked',
                  blockerCode: 'internal_cost_usage_unverified',
                  blockerMessage: 'The private Speech/Pacing attempt ran, but canonical internal-cost usage could not be reconciled.',
                  retryAvailable: false,
                  providerResult,
                  usage: {
                    internalCostStatus: 'unverified',
                    meteredInternalCostMicros: null,
                    usageEventIds: authorization.usageEventIds,
                    internalCostRecordIds: authorization.internalCostRecordIds,
                  },
                }
              }
            }
            if (!pendingResult) {
              pendingResult = providerResult.status === 'completed' && usageReceipt
                ? { kind: 'analyzed', providerResult, usageReceipt }
                : {
                    ...blockedProviderResult(providerResult),
                    ...(usageReceipt ? { usage: meteredUsage(usageReceipt) } : {}),
                  }
            }
          }
        }
      } catch (error) {
        pendingResult = {
          kind: 'blocked',
          blockerCode: classifyAdapterError(error),
          blockerMessage: safeAdapterError(error),
          retryAvailable: false,
          providerResult,
          ...(usageReceipt
            ? { usage: meteredUsage(usageReceipt) }
            : authorization && providerResult?.execution.providerCallMade
              ? {
                  usage: {
                    internalCostStatus: 'unverified' as const,
                    meteredInternalCostMicros: null,
                    usageEventIds: authorization.usageEventIds,
                    internalCostRecordIds: authorization.internalCostRecordIds,
                  },
                }
              : {}),
        }
      }

      if (!pendingResult) {
        return createBlockedEditReferenceSpeechPacingStudyResult({
          request,
          blockerCode: 'adapter_unavailable',
          blockerMessage: 'The bounded Speech/Pacing adapter ended without a structured result.',
          retryAvailable: true,
          retryReason: 'Retry after restoring the reviewed adapter state machine.',
          execution: { privateTranscriptArtifactRead, structuredTimingEvidenceRead },
        })
      }
      if (pendingResult.kind === 'blocked') {
        return createBlockedEditReferenceSpeechPacingStudyResult({
          request,
          blockerCode: pendingResult.blockerCode,
          blockerMessage: pendingResult.blockerMessage,
          retryAvailable: pendingResult.retryAvailable,
          retryReason: pendingResult.retryReason,
          execution: {
            privateTranscriptArtifactRead,
            structuredTimingEvidenceRead,
            providerCallMade: pendingResult.providerResult?.execution.providerCallMade,
            modelCallMade: pendingResult.providerResult?.execution.modelCallMade,
            workerJobCreated: pendingResult.providerResult?.execution.workerJobCreated,
          },
          usage: pendingResult.usage,
        })
      }
      try {
        return buildAnalyzedResult({
          request,
          context: options.structuredContext,
          providerResult: pendingResult.providerResult,
          usageReceipt: pendingResult.usageReceipt,
          executionId,
          startedAt,
          completedAt: now(options),
          adapterId,
          adapterVersion,
          routeAuthorization: verifiedRouteAuthorization,
        })
      } catch (error) {
        return createBlockedEditReferenceSpeechPacingStudyResult({
          request,
          blockerCode: classifyAdapterError(error),
          blockerMessage: safeAdapterError(error),
          retryAvailable: false,
          execution: {
            privateTranscriptArtifactRead,
            structuredTimingEvidenceRead,
            providerCallMade: pendingResult.providerResult.execution.providerCallMade,
            modelCallMade: pendingResult.providerResult.execution.modelCallMade,
            workerJobCreated: pendingResult.providerResult.execution.workerJobCreated,
          },
          ...(pendingResult.usageReceipt ? { usage: meteredUsage(pendingResult.usageReceipt) } : {}),
        })
      }
    },
  }
}

function buildAnalyzedResult(input: {
  readonly request: EditReferenceSpeechPacingStudyRequest
  readonly context: QwenSpeechPacingStructuredContext
  readonly providerResult: EditReferenceSpeechPacingProviderResult
  readonly usageReceipt?: EditReferenceSpeechPacingUsageReceipt
  readonly executionId: string
  readonly startedAt: string
  readonly completedAt: string
  readonly adapterId: string
  readonly adapterVersion: string
  readonly routeAuthorization?: EditReferenceReasoningRouteAuthorization
}): EditReferenceAnalyzedSpeechPacingStudyResult {
  const { request, context, providerResult } = input
  const provenance = providerResult.runtimeProvenance
  if (!provenance || providerResult.status !== 'completed' || providerResult.observations.length < 1) {
    throw new AdapterError('runtime_response_invalid', 'The Speech/Pacing result lacks reviewed reasoning provenance or observations.')
  }
  if (!providerResult.execution.privateTranscriptArtifactRead || !providerResult.execution.structuredTimingEvidenceRead) {
    throw new AdapterError('runtime_response_invalid', 'The Speech/Pacing result cannot prove private transcript and structured timing reads.')
  }
  if (request.executionScope === 'controlled_test') {
    if (
      provenance.runtimeSource !== 'verified_local'
      || provenance.providerId !== null
      || providerResult.execution.providerCallMade
      || !providerResult.execution.modelCallMade
    ) throw new AdapterError('runtime_response_invalid', 'Controlled Speech/Pacing execution provenance is invalid.')
  } else if (
    provenance.runtimeSource !== 'verified_live'
    || !provenance.providerId
    || !providerResult.execution.providerCallMade
    || !providerResult.execution.modelCallMade
    || !input.usageReceipt
    || provenance.modelId !== input.routeAuthorization?.exactProviderModelId
  ) {
    throw new AdapterError('runtime_response_invalid', 'Production Speech/Pacing execution provenance is invalid.')
  }
  assertObservationSafety(context, providerResult)
  const findings = providerResult.observations.map((observation, index): EditReferenceSpeechPacingFinding => ({
    findingId: `speech-pacing-finding-${index + 1}`,
    category: observation.category,
    summary: observation.summary,
    evidenceIds: [...observation.evidenceIds],
    sourceRanges: observation.sourceRanges.map((range) => ({
      rangeId: range.rangeId,
      startSeconds: range.startSeconds,
      endSeconds: range.endSeconds,
      timingBasis: range.timingBasis,
      evidenceIds: [...range.evidenceIds],
      sourceEvidenceOnly: true,
      executableCutBoundaryCreated: false,
      targetTimingInstructionCreated: false,
    })),
    confidence: observation.confidence,
    transferability: observation.transferability,
    timingBasis: observation.timingBasis,
    targetAdaptationRequired: true,
    requiresUserReview: observation.requiresUserReview,
    meaningPreservationRequired: observation.meaningPreservationRequired,
    claimRelated: observation.claimRelated,
    factSafetyStatus: observation.factSafetyStatus,
    exactReferenceWordingRetained: false,
    exactReferenceTimingTransferInstructionCreated: false,
    exactReferenceSentenceStructureCopyInstructionCreated: false,
    executableCutInstructionCreated: false,
    captionTextCopied: false,
    voiceIdentityOrImitationInstructionCreated: false,
  }))
  const missingEvidenceKinds = uniqueStrings([
    ...(providerResult.coverage?.missingEvidenceKinds ?? []),
    ...(request.wordTimingMode === 'not_available' ? ['word_timing'] : []),
  ])
  const windowPartial = request.analysisWindowStartSeconds > 0.001
    || request.analysisWindowEndSeconds < request.sourceDurationSeconds - 0.001
  const averageConfidence = findings.reduce((sum, finding) => sum + finding.confidence, 0) / findings.length
  const controlled = request.executionScope === 'controlled_test'
  const result: EditReferenceAnalyzedSpeechPacingStudyResult = {
    schemaVersion: EDIT_REFERENCE_SPEECH_PACING_STUDY_RESULT_VERSION,
    requestDigestSha256: hashEditReferenceSpeechPacingStudyRequest(request),
    status: 'analyzed',
    runtimeSource: provenance.runtimeSource,
    workspaceId: request.workspaceId,
    editReferenceId: request.editReferenceId,
    studySessionId: request.studySessionId,
    orchestrationId: request.orchestrationId,
    privateMediaArtifactId: request.privateMediaArtifactId,
    mediaChecksumSha256: request.mediaChecksumSha256,
    privateAudioArtifactId: request.privateAudioArtifactId,
    audioChecksumSha256: request.audioChecksumSha256,
    evidenceManifestDigestSha256: request.evidenceManifestDigestSha256,
    evidence: copyManifest(request),
    transcriptAuthority: {
      privateTranscriptArtifactId: request.privateTranscriptArtifactId,
      transcriptChecksumSha256: request.transcriptChecksumSha256,
      privateWordTimingArtifactId: request.privateWordTimingArtifactId,
      wordTimingChecksumSha256: request.wordTimingChecksumSha256,
      privateSpeakerSegmentationArtifactId: request.privateSpeakerSegmentationArtifactId,
      speakerSegmentationChecksumSha256: request.speakerSegmentationChecksumSha256,
      transcriptRuntimeSource: request.transcriptRuntimeSource,
      transcriptRuntimeId: request.transcriptRuntimeId,
      transcriptRuntimeVersion: request.transcriptRuntimeVersion,
      transcriptModelManifestId: request.transcriptModelManifestId,
      transcriptExecutionId: request.transcriptExecutionId,
      transcriptLanguage: request.transcriptLanguage,
      transcriptConfidence: request.transcriptConfidence,
      transcriptQaStatus: request.transcriptQaStatus,
      segmentTimingMode: request.segmentTimingMode,
      segmentTimingAuthorityVerified: true,
      wordTimingMode: request.wordTimingMode,
      wordTimingAuthorityVerified: request.wordTimingAuthorityVerified,
      speakerSegmentationMode: request.speakerSegmentationMode,
      speakerSegmentationAuthorityVerified: request.speakerSegmentationAuthorityVerified,
      transcriptSegmentCount: request.transcriptSegmentCount,
      alignedWordCount: request.alignedWordCount,
      speakerSegmentCount: request.speakerSegmentCount,
      mockTranscriptUsed: false,
      interpolatedWordTimingUsed: false,
      transcriptTextEmbeddedInResult: false,
    },
    findings,
    coverage: {
      evidenceItemCount: allEvidenceIds(request).length,
      sourceDurationSeconds: request.sourceDurationSeconds,
      analysisWindowStartSeconds: request.analysisWindowStartSeconds,
      analysisWindowEndSeconds: request.analysisWindowEndSeconds,
      analyzedDurationSeconds: Number((request.analysisWindowEndSeconds - request.analysisWindowStartSeconds).toFixed(3)),
      transcriptSegmentCount: request.transcriptSegmentCount,
      alignedWordCount: request.alignedWordCount,
      speakerSegmentCount: request.speakerSegmentCount,
      transcriptLanguage: request.transcriptLanguage,
      segmentTimingMode: request.segmentTimingMode,
      wordTimingMode: request.wordTimingMode,
      speakerSegmentationMode: request.speakerSegmentationMode,
      captionTimingPrecision: request.wordTimingMode === 'not_available' ? 'segment' : 'word',
      partial: windowPartial || missingEvidenceKinds.length > 0,
      missingEvidenceKinds,
    },
    summary: {
      findingCount: findings.length,
      categoryCount: new Set(findings.map((finding) => finding.category)).size,
      transferablePrincipleCount: findings.filter((finding) => finding.transferability === 'transferable_principle').length,
      contextOnlyCount: findings.filter((finding) => finding.transferability === 'context_only').length,
      nonTransferableCount: findings.filter((finding) => finding.transferability === 'non_transferable').length,
      averageConfidence,
    },
    execution: {
      privateTranscriptArtifactRead: true,
      structuredTimingEvidenceRead: true,
      semanticSpeechPacingModelExecuted: true,
      rawMediaRead: false,
      rawAudioRead: false,
      mockTranscriptUsed: false,
      interpolatedWordTimingUsed: false,
      rawTranscriptPersistedInStudyResult: false,
      externalUrlFetched: false,
      providerCallMade: providerResult.execution.providerCallMade,
      modelCallMade: true,
      workerJobCreated: providerResult.execution.workerJobCreated,
      temporaryAudioCleaned: true,
      remoteMutationMade: false,
    },
    analyzer: {
      adapterId: input.adapterId,
      adapterVersion: input.adapterVersion,
      providerId: provenance.providerId,
      modelId: provenance.modelId,
      modelRevision: provenance.modelRevision,
      modelAggregateSha256: provenance.modelAggregateSha256,
      modelRoutingPolicyVersion: request.executionScope === 'production'
        ? (input.routeAuthorization as EditReferenceReasoningRouteAuthorization).canonicalRouteContractVersion
        : provenance.modelRoutingPolicyVersion,
      analysisInstructionDigestSha256: provenance.analysisInstructionDigestSha256,
    },
    provenance: {
      executionId: input.executionId,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
    },
    usage: controlled ? {
      mode: 'controlled_test_unmetered',
      approvedUsageEstimateId: null,
      internalCostBudgetId: null,
      immutableRateCardSnapshotId: null,
      maximumAuthorizedInternalCostMicros: null,
      meteredInternalCostMicros: '0',
      usageEventIds: [],
      internalCostRecordIds: [],
      customerPriceCalculated: false,
      customerCreditsMutated: false,
      serviceFeeIncluded: false,
    } : {
      mode: 'production_metered',
      approvedUsageEstimateId: request.approvedUsageEstimateId,
      internalCostBudgetId: request.internalCostBudgetId,
      immutableRateCardSnapshotId: request.immutableRateCardSnapshotId,
      maximumAuthorizedInternalCostMicros: request.maximumAuthorizedInternalCostMicros,
      meteredInternalCostMicros: input.usageReceipt!.meteredInternalCostMicros,
      usageEventIds: [...input.usageReceipt!.usageEventIds],
      internalCostRecordIds: [...input.usageReceipt!.internalCostRecordIds],
      customerPriceCalculated: false,
      customerCreditsMutated: false,
      serviceFeeIncluded: false,
    },
    privacy: {
      rawMediaPersisted: false,
      rawAudioPersisted: false,
      rawTranscriptEmbeddedInStudyResult: false,
      transcriptTextPersistedByStudyAnalyzer: false,
      rawProviderPayloadPersisted: false,
      signedUrlPersisted: false,
      hiddenChainOfThoughtPersisted: false,
      temporaryAudioCleaned: true,
    },
    copySafety: {
      exactHookWordingRetained: false,
      exactSentenceStructureCopyInstructionCreated: false,
      exactPauseMapCopyInstructionCreated: false,
      exactCutMapCopyInstructionCreated: false,
      exactCaptionTextRetained: false,
      voiceIdentityOrImitationInstructionCreated: false,
      exactReferenceTimingTransferInstructionCreated: false,
    },
    factSafety: {
      claimEvidenceRequired: request.sourceClaimsPresent,
      claimEvidenceIds: [...request.evidence.factSafetyEvidenceIds],
      unverifiedClaimPresentedAsFact: false,
      sourceAttributionRemoved: false,
      guiltImplyingInstructionCreated: false,
    },
    transferBoundary: {
      technicalLowLevelIntervalsTreatedAsSemanticPauses: false,
      interpolatedTimingTreatedAsAligned: false,
      sourceTranscriptTreatedAsTargetScript: false,
      findingsMayBecomeTargetInstructionsWithoutApplication: false,
      sourceCutOpportunityMayExecuteWithoutTargetMeaningReview: false,
      targetEvidenceRequired: true,
      meaningPreservationReviewRequired: true,
      userApprovalRequired: true,
      exactWordingOrTimingTransferAllowed: false,
    },
  }
  validateEditReferenceSpeechPacingStudyResult(request, result)
  return result
}

function assertExactStructuredTranscript(
  request: EditReferenceSpeechPacingStudyRequest,
  context: QwenSpeechPacingStructuredContext,
): void {
  const parsed = qwenSpeechPacingStructuredContextSchema.parse(context)
  if (
    JSON.stringify(parsed).length > request.maxStructuredContextCharacters
    || parsed.evidenceManifestDigestSha256 !== request.evidenceManifestDigestSha256
    || parsed.transcriptChecksumSha256 !== request.transcriptChecksumSha256
    || parsed.wordTimingChecksumSha256 !== request.wordTimingChecksumSha256
    || parsed.speakerSegmentationChecksumSha256 !== request.speakerSegmentationChecksumSha256
    || parsed.sourceDurationSeconds !== request.sourceDurationSeconds
    || parsed.analysisWindowStartSeconds !== request.analysisWindowStartSeconds
    || parsed.analysisWindowEndSeconds !== request.analysisWindowEndSeconds
    || parsed.transcriptLanguage !== request.transcriptLanguage
    || parsed.segmentTimingMode !== request.segmentTimingMode
    || parsed.wordTimingMode !== request.wordTimingMode
    || parsed.speakerSegmentationMode !== request.speakerSegmentationMode
    || parsed.sourceClaimsPresent !== request.sourceClaimsPresent
    || parsed.transcriptSegments.length !== request.transcriptSegmentCount
    || parsed.transcriptSegments.flatMap((segment) => segment.words).length !== request.alignedWordCount
    || parsed.speakerTurns.length !== request.speakerSegmentCount
  ) throw new AdapterError('transcript_authority_unverified', 'The private transcript context does not match the exact artifact and timing authority.')
  const requestIds = allEvidenceIds(request).slice().sort()
  const contextIds = parsed.evidenceItems.map((item) => item.evidenceId).sort()
  if (JSON.stringify(requestIds) !== JSON.stringify(contextIds)) {
    throw new AdapterError('evidence_authority_unverified', 'The Speech/Pacing structured evidence does not match the exact evidence manifest.')
  }
}

function assertObservationSafety(
  context: QwenSpeechPacingStructuredContext,
  result: EditReferenceSpeechPacingProviderResult,
): void {
  const sourcePhrases = transcriptFiveTokenPhrases(context)
  for (const observation of result.observations) {
    const normalizedSummary = normalizeWords(observation.summary)
    if (
      QUOTED_SOURCE_LANGUAGE.test(observation.summary)
      || EXACT_TIMING_IN_SUMMARY.test(observation.summary)
      || sourcePhrases.some((phrase) => normalizedSummary.includes(phrase))
    ) {
      throw new AdapterError('copy_safety_violation', 'The Speech/Pacing result retained source wording or exact timing in a transferable summary.')
    }
  }
}

function transcriptFiveTokenPhrases(context: QwenSpeechPacingStructuredContext): string[] {
  const tokens = normalizeWords(context.transcriptSegments.map((segment) => segment.text).join(' ')).split(' ').filter(Boolean)
  const phrases = new Set<string>()
  for (let index = 0; index <= tokens.length - 5; index += 1) {
    phrases.add(tokens.slice(index, index + 5).join(' '))
  }
  return [...phrases]
}

function normalizeWords(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function blockedProviderResult(providerResult: EditReferenceSpeechPacingProviderResult): PendingBlockedResult {
  return {
    kind: 'blocked',
    blockerCode: mapProviderBlocker(providerResult.blockers),
    blockerMessage: 'The reviewed Speech/Pacing reasoning runtime returned a bounded blocked result.',
    retryAvailable: true,
    retryReason: 'Retry after restoring the exact transcript, timing, model-routing, privacy, and cost authority named by the provider blocker.',
    providerResult,
  }
}

function mapProviderBlocker(blockers: readonly string[]): EditReferenceSpeechPacingStudyBlockerCode {
  const joined = blockers.join(' ').toLowerCase()
  if (joined.includes('privacy') || joined.includes('secret') || joined.includes('structured_transcript_invalid')) return 'privacy_policy_denied'
  if (joined.includes('model') || joined.includes('runtime') || joined.includes('transport')) return 'model_routing_unavailable'
  if (joined.includes('transcript')) return 'transcript_authority_unverified'
  return 'runtime_response_invalid'
}

function assertUsageAuthorization(value: EditReferenceSpeechPacingUsageAuthorization): void {
  if (value.usageEventIds.length < 1 || value.internalCostRecordIds.length < 1) {
    throw new AdapterError('cost_authority_unavailable', 'Speech/Pacing production authorization requires attempt usage and internal-cost identities.')
  }
}

function assertUsageReceipt(
  request: EditReferenceSpeechPacingStudyRequest,
  authorization: EditReferenceSpeechPacingUsageAuthorization,
  receipt: EditReferenceSpeechPacingUsageReceipt,
  completed: boolean,
): void {
  if (
    !MONEY_MICROS.test(receipt.meteredInternalCostMicros)
    || (completed && BigInt(receipt.meteredInternalCostMicros) <= 0n)
    || BigInt(receipt.meteredInternalCostMicros) > BigInt(request.maximumAuthorizedInternalCostMicros!)
    || JSON.stringify(receipt.usageEventIds) !== JSON.stringify(authorization.usageEventIds)
    || JSON.stringify(receipt.internalCostRecordIds) !== JSON.stringify(authorization.internalCostRecordIds)
  ) throw new AdapterError('internal_cost_usage_unverified', 'Speech/Pacing production usage receipt is invalid.')
}

function meteredUsage(receipt: EditReferenceSpeechPacingUsageReceipt): NonNullable<PendingBlockedResult['usage']> {
  return {
    internalCostStatus: 'metered',
    meteredInternalCostMicros: receipt.meteredInternalCostMicros,
    usageEventIds: [...receipt.usageEventIds],
    internalCostRecordIds: [...receipt.internalCostRecordIds],
  }
}

function classifyAdapterError(error: unknown): EditReferenceSpeechPacingStudyBlockerCode {
  return error instanceof AdapterError ? error.code : 'runtime_response_invalid'
}

function safeAdapterError(error: unknown): string {
  return error instanceof AdapterError
    ? error.message
    : 'The bounded Speech/Pacing adapter failed closed without retaining transcript text, provider payloads, or target instructions.'
}

function copyManifest(request: EditReferenceSpeechPacingStudyRequest): EditReferenceAnalyzedSpeechPacingStudyResult['evidence'] {
  return {
    mediaStructureEvidenceIds: [...request.evidence.mediaStructureEvidenceIds],
    privateAudioEvidenceIds: [...request.evidence.privateAudioEvidenceIds],
    transcriptEvidenceIds: [...request.evidence.transcriptEvidenceIds],
    segmentTimingEvidenceIds: [...request.evidence.segmentTimingEvidenceIds],
    wordTimingEvidenceIds: [...request.evidence.wordTimingEvidenceIds],
    speakerSegmentationEvidenceIds: [...request.evidence.speakerSegmentationEvidenceIds],
    technicalLowLevelIntervalEvidenceIds: [...request.evidence.technicalLowLevelIntervalEvidenceIds],
    studyChatGoalEvidenceIds: [...request.evidence.studyChatGoalEvidenceIds],
    factSafetyEvidenceIds: [...request.evidence.factSafetyEvidenceIds],
  }
}

function allEvidenceIds(request: EditReferenceSpeechPacingStudyRequest): string[] {
  return Object.values(request.evidence).flatMap((ids) => [...ids])
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)]
}

function now(options: EditReferenceQwenSpeechPacingAdapterOptions): string {
  return options.now?.() ?? new Date().toISOString()
}

class AdapterError extends Error {
  readonly code: EditReferenceSpeechPacingStudyBlockerCode

  constructor(
    code: EditReferenceSpeechPacingStudyBlockerCode,
    message: string,
  ) {
    super(message)
    this.code = code
  }
}
