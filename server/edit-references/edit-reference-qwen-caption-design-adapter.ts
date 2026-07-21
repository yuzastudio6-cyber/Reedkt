import { createHash, randomUUID } from 'node:crypto'
import { constants as fsConstants } from 'node:fs'
import { lstat, open, realpath } from 'node:fs/promises'
import path from 'node:path'
import {
  hashEditReferenceCaptionOcrStudyResult,
  validateEditReferenceCaptionOcrStudyRequest,
  validateEditReferenceCaptionOcrStudyResult,
  type EditReferenceAnalyzedCaptionOcrStudyResult,
  type EditReferenceCaptionOcrStudyRequest,
} from './edit-reference-caption-ocr-study-contract'
import {
  EDIT_REFERENCE_CAPTION_DESIGN_STUDY_RESULT_VERSION,
  createBlockedEditReferenceCaptionDesignStudyResult,
  hashEditReferenceCaptionDesignStudyRequest,
  validateEditReferenceCaptionDesignStudyRequest,
  validateEditReferenceCaptionDesignStudyResult,
  type EditReferenceAnalyzedCaptionDesignStudyResult,
  type EditReferenceCaptionDesignFinding,
  type EditReferenceCaptionDesignFrameEvidence,
  type EditReferenceCaptionDesignStudyAdapter,
  type EditReferenceCaptionDesignStudyBlockerCode,
  type EditReferenceCaptionDesignStudyRequest,
  type EditReferenceCaptionDesignStudyResult,
} from './edit-reference-caption-design-study-contract'
import type {
  QwenCaptionDesignObservation,
  QwenTechnicalCaptionContext,
  QwenVisualUnderstandingProvider,
  QwenVisualUnderstandingResult,
} from '../services/qwen-visual-understanding-provider'

export const EDIT_REFERENCE_QWEN_CAPTION_DESIGN_ADAPTER_ID =
  'edit_reference_qwen_caption_design_adapter' as const
export const EDIT_REFERENCE_QWEN_CAPTION_DESIGN_ADAPTER_VERSION = 'v1' as const

export interface EditReferenceResolvedCaptionDesignFrame {
  readonly privateFrameArtifactId: string
  readonly localFilePath: string
}

export interface EditReferenceCaptionDesignUsageAuthorization {
  readonly usageEventIds: readonly string[]
  readonly internalCostRecordIds: readonly string[]
}

export interface EditReferenceCaptionDesignUsageReceipt
  extends EditReferenceCaptionDesignUsageAuthorization {
  readonly meteredInternalCostMicros: string
}

export interface EditReferenceCaptionDesignProductionUsageAuthority {
  authorize(
    request: EditReferenceCaptionDesignStudyRequest,
  ): Promise<EditReferenceCaptionDesignUsageAuthorization>
  reconcile(input: {
    readonly request: EditReferenceCaptionDesignStudyRequest
    readonly providerResult: QwenVisualUnderstandingResult
    readonly authorization: EditReferenceCaptionDesignUsageAuthorization
  }): Promise<EditReferenceCaptionDesignUsageReceipt>
}

export interface EditReferenceQwenCaptionDesignAdapterOptions {
  readonly provider: QwenVisualUnderstandingProvider
  readonly privateFrameRoot: string
  readonly captionOcrRequest: EditReferenceCaptionOcrStudyRequest
  readonly captionOcrResult: EditReferenceAnalyzedCaptionOcrStudyResult
  readonly resolvePrivateFrame: (
    sample: EditReferenceCaptionDesignFrameEvidence,
  ) => Promise<EditReferenceResolvedCaptionDesignFrame>
  readonly cleanupPrivateFrames: (
    frames: readonly EditReferenceResolvedCaptionDesignFrame[],
  ) => Promise<void>
  readonly productionUsageAuthority?: EditReferenceCaptionDesignProductionUsageAuthority
  readonly now?: () => string
  readonly createExecutionId?: () => string
}

interface PendingBlockedResult {
  readonly kind: 'blocked'
  readonly blockerCode: EditReferenceCaptionDesignStudyBlockerCode
  readonly blockerMessage: string
  readonly retryAvailable: boolean
  readonly retryReason?: string
  readonly execution?: {
    readonly boundedPrivateFramesRead?: boolean
    readonly captionOcrResultRead?: boolean
    readonly privateTranscriptTimingRead?: boolean
    readonly providerCallMade?: boolean
    readonly modelCallMade?: boolean
    readonly workerJobCreated?: boolean
  }
  readonly usage?: {
    readonly internalCostStatus: 'metered' | 'unverified'
    readonly meteredInternalCostMicros: string | null
    readonly usageEventIds: readonly string[]
    readonly internalCostRecordIds: readonly string[]
  }
}

interface PendingAnalyzedResult {
  readonly kind: 'analyzed'
  readonly providerResult: QwenVisualUnderstandingResult
  readonly usageReceipt: EditReferenceCaptionDesignUsageReceipt
}

type PendingAdapterResult = PendingBlockedResult | PendingAnalyzedResult

const DIRECT_COPY_LANGUAGE = /\b(?:copy|replicate|recreate|verbatim|same exact|match exactly|retain exact|preserve exact)\b/i
const EXACT_CAPTION_DATA = /(?:#[0-9a-f]{3,8}\b|rgba?\s*\(|hsla?\s*\(|\b\d+(?:\.\d+)?\s*(?:px|pt|frames?|milliseconds?|ms|seconds?|s|%)\b)/i
const MONEY_MICROS = /^(?:0|[1-9][0-9]{0,15})$/
const SAFE_ZONE_CATEGORIES = new Set(['safe_zone_behavior'])
const SPEECH_TIMING_CATEGORIES = new Set(['speech_alignment'])
const FONT_OR_BRAND_CATEGORIES = new Set(['font_character'])

export function createEditReferenceQwenCaptionDesignAdapter(
  options: EditReferenceQwenCaptionDesignAdapterOptions,
): EditReferenceCaptionDesignStudyAdapter {
  return {
    adapterId: EDIT_REFERENCE_QWEN_CAPTION_DESIGN_ADAPTER_ID,
    adapterVersion: EDIT_REFERENCE_QWEN_CAPTION_DESIGN_ADAPTER_VERSION,
    async analyze(request): Promise<EditReferenceCaptionDesignStudyResult> {
      validateEditReferenceCaptionDesignStudyRequest(request)
      const startedAt = now(options)
      const executionId = options.createExecutionId?.()
        ?? `edit-reference-caption-design-${randomUUID()}`
      const resolvedFrames: EditReferenceResolvedCaptionDesignFrame[] = []
      let boundedPrivateFramesRead = false
      let captionOcrResultRead = false
      let providerResult: QwenVisualUnderstandingResult | undefined
      let authorization: EditReferenceCaptionDesignUsageAuthorization | undefined
      let usageReceipt: EditReferenceCaptionDesignUsageReceipt | undefined
      let pendingResult: PendingAdapterResult | undefined

      try {
        await resolveExactPrivateFrames(options, request, resolvedFrames)
        await verifyExactFrameBytes(request, resolvedFrames)
        boundedPrivateFramesRead = true
        assertExactCaptionDesignManifestAuthority(request)
        assertExactCaptionOcrAuthority(request, options.captionOcrRequest, options.captionOcrResult)
        captionOcrResultRead = true

        if (request.evidenceMode !== 'visual_ocr') {
          pendingResult = {
            kind: 'blocked',
            blockerCode: 'transcript_timing_unavailable',
            blockerMessage: 'Caption Design adapter v1 supports visual/OCR evidence only and cannot claim transcript timing.',
            retryAvailable: true,
            retryReason: 'Use a reviewed timed-caption adapter that consumes exact segment or non-interpolated word authority.',
          }
        } else if (request.executionScope !== 'production') {
          pendingResult = {
            kind: 'blocked',
            blockerCode: 'cost_authority_unavailable',
            blockerMessage: 'The private Qwen Caption Design model cannot run under an unmetered controlled-test request.',
            retryAvailable: true,
            retryReason: 'Retry with an approved production estimate, internal-cost budget, immutable rate-card snapshot, and usage recorder.',
          }
        } else if (!options.productionUsageAuthority) {
          pendingResult = {
            kind: 'blocked',
            blockerCode: 'cost_authority_unavailable',
            blockerMessage: 'Canonical internal-cost authority is unavailable, so no private Caption Design provider call was made.',
            retryAvailable: true,
            retryReason: 'Restore the exact estimate, budget, rate-card, and attempt-level usage authority, then retry.',
          }
        } else {
          try {
            authorization = await options.productionUsageAuthority.authorize(request)
            assertUsageAuthorization(authorization)
          } catch {
            pendingResult = {
              kind: 'blocked',
              blockerCode: 'cost_authority_unavailable',
              blockerMessage: 'Canonical internal-cost authority did not authorize this exact Caption Design request.',
              retryAvailable: true,
              retryReason: 'Refresh the exact estimate, budget, and immutable rate-card authority before retrying.',
            }
          }
          if (authorization) {
            providerResult = await options.provider.analyze({
              workspaceId: request.workspaceId,
              projectId: request.editReferenceId,
              editSessionId: request.studySessionId,
              mediaAssetId: request.privateMediaArtifactId,
              analysisRole: 'reference_style_analysis',
              editReferenceStudyProfile: 'caption_design',
              technicalCaptionContext: toQwenTechnicalCaptionContext(
                request,
                options.captionOcrResult,
              ),
              frameArtifacts: request.frameSamples.map((sample) => ({
                artifactId: sample.privateFrameArtifactId,
                localFilePath: requireResolvedFrame(
                  resolvedFrames,
                  sample.privateFrameArtifactId,
                ).localFilePath,
                timeSeconds: sample.sourceTimeSeconds,
                checksum: sample.frameChecksumSha256,
              })),
            })

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
                blockerMessage: 'The private Caption Design attempt completed, but canonical internal-cost usage could not be reconciled.',
                retryAvailable: false,
                execution: blockedExecution(providerResult, boundedPrivateFramesRead, captionOcrResultRead),
                usage: {
                  internalCostStatus: 'unverified',
                  meteredInternalCostMicros: null,
                  usageEventIds: authorization.usageEventIds,
                  internalCostRecordIds: authorization.internalCostRecordIds,
                },
              }
            }

            if (usageReceipt) {
              pendingResult = providerResult.status === 'completed'
                ? { kind: 'analyzed', providerResult, usageReceipt }
                : {
                    kind: 'blocked',
                    blockerCode: mapProviderBlocker(providerResult.blockers),
                    blockerMessage: safeProviderBlockerMessage(providerResult),
                    retryAvailable: true,
                    retryReason: 'Retry after the reviewed private Caption Design runtime or strict response contract is restored.',
                    execution: blockedExecution(providerResult, boundedPrivateFramesRead, captionOcrResultRead),
                    usage: meteredUsage(usageReceipt),
                  }
            }
          }
        }
      } catch (error) {
        pendingResult = {
          kind: 'blocked',
          blockerCode: classifyAdapterError(error),
          blockerMessage: safeAdapterError(error),
          retryAvailable: true,
          retryReason: 'Restore the exact private-frame, OCR-result, and reviewed model authority, then retry.',
          execution: blockedExecution(providerResult, boundedPrivateFramesRead, captionOcrResultRead),
          usage: usageReceipt ? meteredUsage(usageReceipt) : (authorization ? {
            internalCostStatus: 'unverified',
            meteredInternalCostMicros: null,
            usageEventIds: authorization.usageEventIds,
            internalCostRecordIds: authorization.internalCostRecordIds,
          } : undefined),
        }
      }

      let cleanupSucceeded = false
      if (resolvedFrames.length > 0) {
        try {
          await options.cleanupPrivateFrames(resolvedFrames)
          cleanupSucceeded = resolvedFrames.length === request.frameSamples.length
            && await privateFramesAreAbsent(resolvedFrames)
        } catch {
          cleanupSucceeded = false
        }
      }
      if (!cleanupSucceeded) {
        return createBlockedEditReferenceCaptionDesignStudyResult({
          request,
          blockerCode: 'ephemeral_cleanup_failed',
          blockerMessage: 'Ephemeral Caption Design frames could not be proven deleted after the bounded attempt.',
          retryAvailable: false,
          retryReason: null,
          execution: {
            ...blockedExecution(providerResult, boundedPrivateFramesRead, captionOcrResultRead),
            temporaryFramesCleaned: false,
          },
          usage: usageReceipt ? meteredUsage(usageReceipt) : (authorization ? {
            internalCostStatus: 'unverified',
            meteredInternalCostMicros: null,
            usageEventIds: authorization.usageEventIds,
            internalCostRecordIds: authorization.internalCostRecordIds,
          } : undefined),
        })
      }

      if (!pendingResult) {
        return createBlockedEditReferenceCaptionDesignStudyResult({
          request,
          blockerCode: 'adapter_unavailable',
          blockerMessage: 'The bounded Caption Design adapter ended without a structured result.',
          retryAvailable: true,
          retryReason: 'Retry after restoring the reviewed adapter state machine.',
          execution: { captionOcrResultRead, temporaryFramesCleaned: true },
        })
      }
      if (pendingResult.kind === 'blocked') {
        return createBlockedEditReferenceCaptionDesignStudyResult({
          request,
          blockerCode: pendingResult.blockerCode,
          blockerMessage: pendingResult.blockerMessage,
          retryAvailable: pendingResult.retryAvailable,
          retryReason: pendingResult.retryReason ?? null,
          execution: {
            ...pendingResult.execution,
            captionOcrResultRead,
            privateTranscriptTimingRead: false,
            temporaryFramesCleaned: true,
          },
          usage: pendingResult.usage,
        })
      }

      try {
        return buildProviderAnalyzedResult({
          request,
          providerResult: pendingResult.providerResult,
          usageReceipt: pendingResult.usageReceipt,
          executionId,
          startedAt,
          completedAt: now(options),
        })
      } catch (error) {
        return createBlockedEditReferenceCaptionDesignStudyResult({
          request,
          blockerCode: classifyAdapterError(error),
          blockerMessage: safeAdapterError(error),
          retryAvailable: false,
          retryReason: null,
          execution: {
            ...blockedExecution(pendingResult.providerResult, boundedPrivateFramesRead, captionOcrResultRead),
            temporaryFramesCleaned: true,
          },
          usage: meteredUsage(pendingResult.usageReceipt),
        })
      }
    },
  }
}

function buildProviderAnalyzedResult(input: {
  readonly request: EditReferenceCaptionDesignStudyRequest
  readonly providerResult: QwenVisualUnderstandingResult
  readonly usageReceipt: EditReferenceCaptionDesignUsageReceipt
  readonly executionId: string
  readonly startedAt: string
  readonly completedAt: string
}): EditReferenceAnalyzedCaptionDesignStudyResult {
  const { request, providerResult } = input
  const provenance = providerResult.runtimeProvenance
  const observations = providerResult.captionDesignObservations ?? []
  if (!provenance || provenance.runtimeSource !== 'verified_live') {
    throw new AdapterError('model_routing_unavailable', 'The Caption Design result lacks reviewed runtime provenance.')
  }
  if (!providerResult.captionDesignTransferSafety || observations.length < 1) {
    throw new AdapterError('runtime_response_invalid', 'The Caption Design result omitted strict observations or no-copy safety.')
  }
  if (!providerResult.execution.providerCallMade || !providerResult.execution.modelCallMade) {
    throw new AdapterError('runtime_response_invalid', 'The Caption Design result cannot prove provider and model execution.')
  }
  if (observations.some((observation) => (
    DIRECT_COPY_LANGUAGE.test(observation.summary)
    || EXACT_CAPTION_DATA.test(observation.summary)
  ))) {
    throw new AdapterError('copy_safety_violation', 'The Caption Design result retained copy-oriented or exact caption data.')
  }
  assertObservationSafety(request, observations)
  return buildEditReferenceAnalyzedCaptionDesignStudyResult({
    request,
    observations,
    runtimeSource: 'verified_live',
    providerCallMade: true,
    modelCallMade: true,
    workerJobCreated: providerResult.execution.workerJobCreated,
    analyzer: {
      adapterId: EDIT_REFERENCE_QWEN_CAPTION_DESIGN_ADAPTER_ID,
      adapterVersion: EDIT_REFERENCE_QWEN_CAPTION_DESIGN_ADAPTER_VERSION,
      providerId: provenance.providerId,
      modelId: normalizeModelId(provenance.modelId),
      modelRevision: provenance.modelRevision,
      modelAggregateSha256: provenance.modelAggregateSha256,
      modelRoutingPolicyVersion: provenance.modelRoutingPolicyVersion,
      analysisInstructionDigestSha256: provenance.visualInstructionDigestSha256,
    },
    provenance: {
      executionId: input.executionId,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
    },
    usage: {
      mode: 'production_metered',
      approvedUsageEstimateId: request.approvedUsageEstimateId,
      internalCostBudgetId: request.internalCostBudgetId,
      immutableRateCardSnapshotId: request.immutableRateCardSnapshotId,
      maximumAuthorizedInternalCostMicros: request.maximumAuthorizedInternalCostMicros,
      meteredInternalCostMicros: input.usageReceipt.meteredInternalCostMicros,
      usageEventIds: [...input.usageReceipt.usageEventIds],
      internalCostRecordIds: [...input.usageReceipt.internalCostRecordIds],
      customerPriceCalculated: false,
      customerCreditsMutated: false,
      serviceFeeIncluded: false,
    },
  })
}

export interface BuildEditReferenceAnalyzedCaptionDesignStudyResultInput {
  readonly request: EditReferenceCaptionDesignStudyRequest
  readonly observations: readonly QwenCaptionDesignObservation[]
  readonly runtimeSource: 'verified_local' | 'verified_live'
  readonly providerCallMade: boolean
  readonly modelCallMade: true
  readonly workerJobCreated: boolean
  readonly analyzer: EditReferenceAnalyzedCaptionDesignStudyResult['analyzer']
  readonly provenance: EditReferenceAnalyzedCaptionDesignStudyResult['provenance']
  readonly usage: EditReferenceAnalyzedCaptionDesignStudyResult['usage']
}

/**
 * Shared strict result builder for reviewed local and reviewed live semantic
 * Caption Design runtimes. Low-level OCR geometry remains evidence only; an
 * actual semantic model call is mandatory before this builder may be used.
 */
export function buildEditReferenceAnalyzedCaptionDesignStudyResult(
  input: BuildEditReferenceAnalyzedCaptionDesignStudyResultInput,
): EditReferenceAnalyzedCaptionDesignStudyResult {
  const { request } = input
  if (!input.modelCallMade) {
    throw new AdapterError('runtime_response_invalid', 'Caption Design analyzed evidence requires an actual semantic model call.')
  }
  if (
    (input.runtimeSource === 'verified_local' && input.providerCallMade)
    || (input.runtimeSource === 'verified_live' && !input.providerCallMade)
  ) {
    throw new AdapterError('runtime_response_invalid', 'Caption Design runtime provenance does not match provider execution evidence.')
  }
  if (input.observations.some((observation) => (
    DIRECT_COPY_LANGUAGE.test(observation.summary)
    || EXACT_CAPTION_DATA.test(observation.summary)
  ))) {
    throw new AdapterError('copy_safety_violation', 'The Caption Design result retained copy-oriented or exact caption data.')
  }
  assertObservationSafety(request, input.observations)
  const authorizedObservations = input.observations.filter((observation) => (
    request.evidenceMode !== 'visual_ocr'
    || (observation.timingBasis === 'frame_sequence' && !observation.speechTimingRelated)
  ))
  if (authorizedObservations.length < 1) {
    throw new AdapterError('runtime_response_invalid', 'The Caption Design result had no observation supported by exact visual/OCR authority.')
  }
  const findings = authorizedObservations.map((observation, index) => (
    mapObservation(request, observation, index)
  ))
  const averageConfidence = findings.reduce((sum, finding) => sum + finding.confidence, 0) / findings.length
  const result: EditReferenceAnalyzedCaptionDesignStudyResult = {
    schemaVersion: EDIT_REFERENCE_CAPTION_DESIGN_STUDY_RESULT_VERSION,
    requestDigestSha256: hashEditReferenceCaptionDesignStudyRequest(request),
    status: 'analyzed',
    runtimeSource: input.runtimeSource,
    workspaceId: request.workspaceId,
    editReferenceId: request.editReferenceId,
    studySessionId: request.studySessionId,
    orchestrationId: request.orchestrationId,
    privateMediaArtifactId: request.privateMediaArtifactId,
    mediaChecksumSha256: request.mediaChecksumSha256,
    evidenceManifestDigestSha256: request.evidenceManifestDigestSha256,
    frameManifestDigestSha256: request.frameManifestDigestSha256,
    captionOcrResultDigestSha256: request.captionOcrResultDigestSha256,
    consumedFrameEvidenceIds: request.frameSamples.map((sample) => sample.frameEvidenceId),
    evidence: copyEvidence(request),
    findings,
    captionOcrAuthority: {
      runtimeSource: request.captionOcrRuntimeSource,
      adapterId: request.captionOcrAdapterId,
      adapterVersion: request.captionOcrAdapterVersion,
      executionId: request.captionOcrExecutionId,
      coverage: request.captionOcrCoverage,
      analyzedFrameCount: request.captionOcrAnalyzedFrameCount,
      regionCount: request.captionOcrRegionCount,
      exactTextPersisted: false,
      rawOutputPersisted: false,
    },
    transcriptTimingAuthority: {
      evidenceMode: request.evidenceMode,
      privateTranscriptArtifactId: request.privateTranscriptArtifactId,
      transcriptChecksumSha256: request.transcriptChecksumSha256,
      privateWordTimingArtifactId: request.privateWordTimingArtifactId,
      wordTimingChecksumSha256: request.wordTimingChecksumSha256,
      transcriptRuntimeSource: request.transcriptRuntimeSource,
      transcriptRuntimeId: request.transcriptRuntimeId,
      transcriptRuntimeVersion: request.transcriptRuntimeVersion,
      transcriptModelManifestId: request.transcriptModelManifestId,
      transcriptExecutionId: request.transcriptExecutionId,
      transcriptQaStatus: request.transcriptQaStatus,
      segmentTimingAuthorityVerified: request.segmentTimingAuthorityVerified,
      wordTimingAuthorityVerified: request.wordTimingAuthorityVerified,
      transcriptSegmentCount: request.transcriptSegmentCount,
      alignedWordCount: request.alignedWordCount,
      mockTranscriptUsed: false,
      interpolatedWordTimingUsed: false,
      transcriptTextEmbeddedInResult: false,
    },
    coverage: {
      evidenceItemCount: allEvidenceIds(request).length,
      frameCount: request.frameSamples.length,
      captionDetailFrameCount: request.frameSamples.filter((sample) => sample.role === 'caption_detail').length,
      captionOcrAnalyzedFrameCount: request.captionOcrAnalyzedFrameCount,
      captionOcrRegionCount: request.captionOcrRegionCount,
      captionOcrCoverage: request.captionOcrCoverage,
      sourceDurationSeconds: request.sourceDurationSeconds,
      analysisWindowStartSeconds: request.analysisWindowStartSeconds,
      analysisWindowEndSeconds: request.analysisWindowEndSeconds,
      analyzedDurationSeconds: request.analysisWindowEndSeconds - request.analysisWindowStartSeconds,
      evidenceMode: request.evidenceMode,
      transcriptSegmentCount: request.transcriptSegmentCount,
      alignedWordCount: request.alignedWordCount,
      timingPrecision: captionTimingPrecision(request),
      partial: request.captionOcrCoverage === 'partial'
        || missingCaptionTimingEvidence(request).length > 0,
      missingEvidenceKinds: missingCaptionTimingEvidence(request),
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
      boundedPrivateFramesRead: true,
      captionOcrResultRead: true,
      privateTranscriptTimingRead: request.evidenceMode !== 'visual_ocr',
      semanticCaptionDesignModelExecuted: true,
      ocrEngineExecutedByCaptionDesignAnalyzer: false,
      rawFullMediaRead: false,
      rawRecognizedTextRead: false,
      rawTranscriptRead: false,
      externalUrlFetched: false,
      providerCallMade: input.providerCallMade,
      modelCallMade: input.modelCallMade,
      workerJobCreated: input.workerJobCreated,
      temporaryFramesCleaned: true,
      remoteMutationMade: false,
    },
    analyzer: input.analyzer,
    provenance: input.provenance,
    usage: input.usage,
    privacy: {
      rawFullMediaPersisted: false,
      rawFramesPersisted: false,
      rawOcrOutputPersisted: false,
      recognizedCaptionTextPersisted: false,
      rawTranscriptEmbeddedInStudyResult: false,
      rawProviderPayloadPersisted: false,
      signedUrlPersisted: false,
      hiddenChainOfThoughtPersisted: false,
      temporaryFramesCleaned: true,
    },
    copySafety: {
      exactCaptionWordingRetained: false,
      exactFontIdentityTransferInstructionCreated: false,
      exactLineBreakCopyInstructionCreated: false,
      exactHighlightWordCopyInstructionCreated: false,
      exactColorValueCopyInstructionCreated: false,
      exactLayoutCopyInstructionCreated: false,
      exactAnimationCurveCopyInstructionCreated: false,
      exactTimingMapCopyInstructionCreated: false,
      copyrightedFontOrBrandAssetTransferInstructionCreated: false,
    },
    factSafety: {
      claimEvidenceRequired: request.sourceClaimsPresent,
      claimEvidenceIds: request.sourceClaimsPresent ? [...request.evidence.factSafetyEvidenceIds] : [],
      unverifiedClaimPresentedAsFact: false,
      sourceAttributionRemoved: false,
      misleadingCaptionInstructionCreated: false,
    },
    readabilitySafety: {
      speechClarityPriorityPreserved: true,
      targetSafeZoneReviewRequired: true,
      targetCollisionReviewRequired: true,
      targetAspectRatioRequired: true,
      foregroundMaskCollisionAllowed: false,
      importantVisualOcclusionAllowed: false,
    },
    transferBoundary: {
      technicalTextLikeRegionsTreatedAsConfirmedCaptions: false,
      ocrGeometryTreatedAsSemanticCaptionDesignWithoutModel: false,
      segmentTimingTreatedAsWordAlignment: false,
      exactFontIdentityInferred: false,
      findingsMayBecomeTargetInstructionsWithoutApplication: false,
      targetEvidenceRequired: true,
      targetTranscriptTimingRequiredForSpeechAlignment: true,
      targetLayoutAndSafeZoneValidationRequired: true,
      userApprovalRequired: true,
      exactWordingFontLayoutAnimationOrTimingTransferAllowed: false,
    },
  }
  validateEditReferenceCaptionDesignStudyResult(request, result)
  return result
}

function assertObservationSafety(
  request: EditReferenceCaptionDesignStudyRequest,
  observations: readonly QwenCaptionDesignObservation[],
): void {
  for (const observation of observations) {
    if (observation.safeZoneRelated !== SAFE_ZONE_CATEGORIES.has(observation.category)) {
      throw new AdapterError('runtime_response_invalid', 'Caption Design safe-zone metadata did not match its category.')
    }
    if (observation.speechTimingRelated !== SPEECH_TIMING_CATEGORIES.has(observation.category)) {
      throw new AdapterError('runtime_response_invalid', 'Caption Design speech-timing metadata did not match its category.')
    }
    if (observation.fontOrBrandRelated !== FONT_OR_BRAND_CATEGORIES.has(observation.category)) {
      throw new AdapterError('runtime_response_invalid', 'Caption Design font/brand metadata did not match its category.')
    }
    if (observation.fontOrBrandRelated && !observation.requiresUserReview) {
      throw new AdapterError('copy_safety_violation', 'Font-related Caption Design observations require explicit review.')
    }
    if (observation.claimRelated && (
      !request.sourceClaimsPresent
      || request.evidence.factSafetyEvidenceIds.length < 1
      || !observation.requiresUserReview
    )) {
      throw new AdapterError('fact_safety_evidence_required', 'Claim-related Caption Design observations require exact fact-safety evidence and review.')
    }
  }
}

function mapObservation(
  request: EditReferenceCaptionDesignStudyRequest,
  observation: QwenCaptionDesignObservation,
  index: number,
): EditReferenceCaptionDesignFinding {
  const frames = observation.frameIds.map((frameId) => requireRequestFrame(request, frameId))
  const frameEvidenceIds = frames.map((frame) => frame.frameEvidenceId)
  const evidenceIds = uniqueStrings([
    ...request.evidence.mediaStructureEvidenceIds,
    ...request.evidence.technicalCaptionRegionEvidenceIds,
    ...request.evidence.captionOcrEvidenceIds,
    ...request.evidence.visualLanguageEvidenceIds,
    ...request.evidence.studyChatGoalEvidenceIds,
    ...(observation.timingBasis === 'segment' || observation.timingBasis === 'word'
      ? request.evidence.transcriptEvidenceIds
      : []),
    ...(observation.timingBasis === 'segment' || observation.timingBasis === 'word'
      ? request.evidence.segmentTimingEvidenceIds
      : []),
    ...(observation.timingBasis === 'word'
      ? request.evidence.wordTimingEvidenceIds
      : []),
    ...frameEvidenceIds,
    ...(observation.claimRelated ? request.evidence.factSafetyEvidenceIds : []),
  ])
  const minimumTime = Math.min(...frames.map((frame) => frame.sourceTimeSeconds))
  const maximumTime = Math.max(...frames.map((frame) => frame.sourceTimeSeconds))
  const startSeconds = Math.max(request.analysisWindowStartSeconds, minimumTime - 0.25)
  const endSeconds = Math.min(
    request.analysisWindowEndSeconds,
    Math.max(maximumTime + 0.25, startSeconds + 0.001),
  )
  return {
    findingId: `caption-design-finding-${index + 1}`,
    category: observation.category,
    summary: observation.summary,
    evidenceIds,
    frameEvidenceIds,
    sourceRanges: [{
      rangeId: `caption-design-range-${index + 1}`,
      startSeconds,
      endSeconds,
      timingBasis: observation.timingBasis,
      evidenceIds,
      sourceEvidenceOnly: true,
      targetTimingInstructionCreated: false,
      executableCaptionTimingCreated: false,
    }],
    confidence: observation.confidence,
    transferability: observation.transferability,
    evidenceMode: request.evidenceMode,
    timingBasis: observation.timingBasis,
    targetAdaptationRequired: true,
    requiresUserReview: observation.requiresUserReview
      || observation.safeZoneRelated
      || observation.fontOrBrandRelated
      || observation.claimRelated,
    safeZoneRelated: observation.safeZoneRelated,
    speechTimingRelated: observation.speechTimingRelated,
    fontOrBrandRelated: observation.fontOrBrandRelated,
    claimRelated: observation.claimRelated,
    factSafetyStatus: observation.claimRelated ? 'requires_review' : 'not_applicable',
    observedDesignOnly: true,
    generalizedNonVerbatimSummary: true,
    exactReferenceCaptionWordingRetained: false,
    exactFontIdentityClaimCreated: false,
    exactLineBreakCopyInstructionCreated: false,
    exactHighlightWordCopyInstructionCreated: false,
    exactColorValueCopyInstructionCreated: false,
    exactLayoutCopyInstructionCreated: false,
    exactAnimationCurveCopyInstructionCreated: false,
    exactTimingMapCopyInstructionCreated: false,
    copyrightedFontOrBrandAssetTransferInstructionCreated: false,
    executableCaptionPlanCreated: false,
    sourceCaptionTextCopied: false,
  }
}

function captionTimingPrecision(
  request: EditReferenceCaptionDesignStudyRequest,
): EditReferenceAnalyzedCaptionDesignStudyResult['coverage']['timingPrecision'] {
  if (request.evidenceMode === 'visual_ocr_word_timing') return 'word'
  if (request.evidenceMode === 'visual_ocr_segment_timing') return 'segment'
  return 'visual_only'
}

function missingCaptionTimingEvidence(
  request: EditReferenceCaptionDesignStudyRequest,
): readonly string[] {
  if (request.evidenceMode === 'visual_ocr') return ['transcript_timing', 'word_timing']
  if (request.evidenceMode === 'visual_ocr_segment_timing') return ['word_timing']
  return []
}

export function hashEditReferenceCaptionDesignFrameManifest(
  frames: readonly EditReferenceCaptionDesignFrameEvidence[],
): string {
  return createHash('sha256').update(JSON.stringify([...frames]
    .sort((left, right) => left.frameEvidenceId.localeCompare(right.frameEvidenceId)))).digest('hex')
}

export function hashEditReferenceCaptionDesignEvidenceManifest(
  request: Pick<EditReferenceCaptionDesignStudyRequest, 'evidence'>,
): string {
  const normalized = Object.fromEntries(Object.entries(request.evidence)
    .map(([key, values]) => [key, [...values].sort()]))
  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex')
}

export function assertExactCaptionDesignManifestAuthority(
  request: EditReferenceCaptionDesignStudyRequest,
): void {
  if (
    hashEditReferenceCaptionDesignFrameManifest(request.frameSamples) !== request.frameManifestDigestSha256
    || hashEditReferenceCaptionDesignEvidenceManifest(request) !== request.evidenceManifestDigestSha256
  ) {
    throw new AdapterError('evidence_authority_unverified', 'Caption Design frame or evidence manifest did not match the exact request authority.')
  }
}

export function assertExactCaptionOcrAuthority(
  request: EditReferenceCaptionDesignStudyRequest,
  ocrRequest: EditReferenceCaptionOcrStudyRequest,
  ocrResult: EditReferenceAnalyzedCaptionOcrStudyResult,
  options: { readonly allowReviewedLocalOcrForControlledTest?: boolean } = {},
): void {
  validateEditReferenceCaptionOcrStudyRequest(ocrRequest)
  validateEditReferenceCaptionOcrStudyResult(ocrRequest, ocrResult)
  const resultDigest = hashEditReferenceCaptionOcrStudyResult(ocrRequest, ocrResult)
  const regionCount = ocrResult.observations.reduce((sum, frame) => sum + frame.textRegions.length, 0)
  const scopeAuthorityMatches = ocrRequest.executionScope === request.executionScope || (
    options.allowReviewedLocalOcrForControlledTest === true
    && request.executionScope === 'controlled_test'
    && ocrRequest.executionScope === 'reviewed_local'
    && ocrResult.runtimeSource === 'verified_local'
    && ocrResult.execution.providerCallMade === false
    && ocrResult.execution.remoteMutationMade === false
    && ocrResult.usage.mode === 'backend_local_unmetered'
    && ocrResult.usage.meteredInternalCostMicros === '0'
    && ocrResult.usage.customerPriceCalculated === false
    && ocrResult.usage.customerCreditsMutated === false
    && ocrResult.usage.serviceFeeIncluded === false
  )
  if (
    resultDigest !== request.captionOcrResultDigestSha256
    || ocrResult.workspaceId !== request.workspaceId
    || ocrResult.editReferenceId !== request.editReferenceId
    || ocrResult.studySessionId !== request.studySessionId
    || ocrResult.orchestrationId !== request.orchestrationId
    || ocrResult.privateMediaArtifactId !== request.privateMediaArtifactId
    || ocrResult.mediaChecksumSha256 !== request.mediaChecksumSha256
    || ocrResult.runtimeSource !== request.captionOcrRuntimeSource
    || ocrResult.provenance.adapterId !== request.captionOcrAdapterId
    || ocrResult.provenance.adapterVersion !== request.captionOcrAdapterVersion
    || ocrResult.provenance.executionId !== request.captionOcrExecutionId
    || (ocrResult.coverage.partial ? 'partial' : 'full') !== request.captionOcrCoverage
    || ocrResult.summary.analyzedFrameCount !== request.captionOcrAnalyzedFrameCount
    || regionCount !== request.captionOcrRegionCount
    || ocrResult.privacy.recognizedTextPersisted !== false
    || ocrResult.privacy.rawOcrOutputPersisted !== false
    || ocrResult.semanticBoundary.captionDesignInterpreted !== false
    || ocrResult.semanticBoundary.transcriptAlignmentRan !== false
    || ocrResult.semanticBoundary.speechTimingRan !== false
    || !scopeAuthorityMatches
  ) {
    throw new AdapterError('caption_ocr_authority_unverified', 'The low-level OCR result did not match the exact Caption Design request authority.')
  }
  const analyzedTimes = new Set(ocrResult.coverage.analyzedFrameTimesSeconds)
  if (request.frameSamples.some((frame) => !analyzedTimes.has(frame.sourceTimeSeconds))) {
    throw new AdapterError('caption_ocr_authority_unverified', 'Caption Design included a frame outside the exact analyzed OCR coverage.')
  }
}

export function toQwenTechnicalCaptionContext(
  request: EditReferenceCaptionDesignStudyRequest,
  ocrResult: EditReferenceAnalyzedCaptionOcrStudyResult,
): QwenTechnicalCaptionContext {
  return {
    schemaVersion: 'edit-reference-caption-design-context-v1',
    resultDigestSha256: request.captionOcrResultDigestSha256,
    coverage: request.captionOcrCoverage,
    analyzedFrameCount: request.captionOcrAnalyzedFrameCount,
    regionCount: request.captionOcrRegionCount,
    evidenceMode: request.evidenceMode,
    frames: request.frameSamples.map((sample) => {
      const observation = ocrResult.observations.find((frame) => frame.frameTimeSeconds === sample.sourceTimeSeconds)
      if (!observation) {
        throw new AdapterError('caption_ocr_authority_unverified', 'Caption Design frame lacks exact OCR geometry authority.')
      }
      return {
        frameId: sample.privateFrameArtifactId,
        frameTimeSeconds: observation.frameTimeSeconds,
        textRegions: observation.textRegions.map((region) => ({
          regionId: region.regionId,
          normalizedBounds: { ...region.normalizedBounds },
          lineCount: region.lineCount,
          estimatedCharacterCount: region.estimatedCharacterCount,
          confidence: region.confidence,
          exactTextPersisted: false,
        })),
      }
    }),
    captionOcrRuntimeExecuted: true,
    exactTextPersisted: false,
    rawOutputPersisted: false,
    semanticCaptionDesignInterpreted: false,
    transcriptAlignmentRan: false,
    speechTimingRan: false,
  }
}

async function resolveExactPrivateFrames(
  options: EditReferenceQwenCaptionDesignAdapterOptions,
  request: EditReferenceCaptionDesignStudyRequest,
  resolvedFrames: EditReferenceResolvedCaptionDesignFrame[],
): Promise<void> {
  const rootStat = await lstat(options.privateFrameRoot)
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
    throw new AdapterError('privacy_policy_denied', 'The approved private Caption Design frame root is invalid.')
  }
  const root = await realpath(options.privateFrameRoot)
  for (const sample of request.frameSamples) {
    const resolved = await options.resolvePrivateFrame(sample)
    if (resolved.privateFrameArtifactId !== sample.privateFrameArtifactId) {
      throw new AdapterError('frame_authority_unverified', 'Resolved Caption Design frame identity does not match the request.')
    }
    const configuredPath = path.resolve(resolved.localFilePath)
    const fileStat = await lstat(configuredPath)
    if (!fileStat.isFile() || fileStat.isSymbolicLink()) {
      throw new AdapterError('privacy_policy_denied', 'Resolved Caption Design frame is not a regular no-symlink file.')
    }
    const resolvedPath = await realpath(configuredPath)
    const relative = path.relative(root, resolvedPath)
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new AdapterError('privacy_policy_denied', 'Resolved Caption Design frame is outside the approved ephemeral root.')
    }
    resolvedFrames.push({ privateFrameArtifactId: sample.privateFrameArtifactId, localFilePath: resolvedPath })
  }
}

async function verifyExactFrameBytes(
  request: EditReferenceCaptionDesignStudyRequest,
  frames: readonly EditReferenceResolvedCaptionDesignFrame[],
): Promise<void> {
  for (const sample of request.frameSamples) {
    const frame = requireResolvedFrame(frames, sample.privateFrameArtifactId)
    const handle = await open(frame.localFilePath, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW)
    try {
      const stat = await handle.stat()
      if (!stat.isFile() || stat.size < 1 || stat.size > 2 * 1024 * 1024) {
        throw new AdapterError('frame_authority_unverified', 'A private Caption Design frame is empty or exceeds 2 MiB.')
      }
      const bytes = await handle.readFile()
      if (createHash('sha256').update(bytes).digest('hex') !== sample.frameChecksumSha256) {
        throw new AdapterError('frame_authority_unverified', 'A private Caption Design frame failed checksum verification.')
      }
      const dimensions = readJpegDimensions(bytes)
      if (dimensions.width !== sample.width || dimensions.height !== sample.height) {
        throw new AdapterError('frame_authority_unverified', 'A private Caption Design frame failed exact dimension verification.')
      }
    } finally {
      await handle.close()
    }
  }
}

function readJpegDimensions(bytes: Buffer): { width: number; height: number } {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new AdapterError('frame_authority_unverified', 'A private Caption Design frame is not a valid JPEG.')
  }
  const frameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf])
  let offset = 2
  while (offset + 3 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1
      continue
    }
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1
    if (offset >= bytes.length) break
    const marker = bytes[offset]
    offset += 1
    if (marker === 0xd9 || marker === 0xda) break
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue
    if (offset + 1 >= bytes.length) break
    const segmentLength = bytes.readUInt16BE(offset)
    if (segmentLength < 2 || offset + segmentLength > bytes.length) break
    if (frameMarkers.has(marker) && segmentLength >= 7) {
      const height = bytes.readUInt16BE(offset + 3)
      const width = bytes.readUInt16BE(offset + 5)
      if (width > 0 && height > 0) return { width, height }
      break
    }
    offset += segmentLength
  }
  throw new AdapterError('frame_authority_unverified', 'A private Caption Design JPEG lacks exact dimensions.')
}

async function privateFramesAreAbsent(
  frames: readonly EditReferenceResolvedCaptionDesignFrame[],
): Promise<boolean> {
  for (const frame of frames) {
    try {
      await lstat(frame.localFilePath)
      return false
    } catch (error) {
      if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') return false
    }
  }
  return true
}

function requireResolvedFrame(
  frames: readonly EditReferenceResolvedCaptionDesignFrame[],
  artifactId: string,
): EditReferenceResolvedCaptionDesignFrame {
  const frame = frames.find((candidate) => candidate.privateFrameArtifactId === artifactId)
  if (!frame) throw new AdapterError('frame_authority_unverified', 'A private Caption Design frame could not be resolved.')
  return frame
}

function requireRequestFrame(
  request: EditReferenceCaptionDesignStudyRequest,
  privateFrameArtifactId: string,
): EditReferenceCaptionDesignFrameEvidence {
  const frame = request.frameSamples.find((candidate) => candidate.privateFrameArtifactId === privateFrameArtifactId)
  if (!frame) throw new AdapterError('runtime_response_invalid', 'Caption Design output cited an unknown private frame.')
  return frame
}

function blockedExecution(
  result: QwenVisualUnderstandingResult | undefined,
  boundedPrivateFramesRead: boolean,
  captionOcrResultRead: boolean,
): NonNullable<PendingBlockedResult['execution']> {
  return {
    boundedPrivateFramesRead,
    captionOcrResultRead,
    privateTranscriptTimingRead: false,
    providerCallMade: result?.execution.providerCallMade ?? false,
    modelCallMade: result?.execution.modelCallMade ?? false,
    workerJobCreated: result?.execution.workerJobCreated ?? false,
  }
}

function meteredUsage(
  receipt: EditReferenceCaptionDesignUsageReceipt,
): NonNullable<PendingBlockedResult['usage']> {
  return {
    internalCostStatus: 'metered',
    meteredInternalCostMicros: receipt.meteredInternalCostMicros,
    usageEventIds: receipt.usageEventIds,
    internalCostRecordIds: receipt.internalCostRecordIds,
  }
}

function assertUsageAuthorization(value: EditReferenceCaptionDesignUsageAuthorization): void {
  assertIdList(value.usageEventIds, 'Caption Design usage authorization IDs are invalid.')
  assertIdList(value.internalCostRecordIds, 'Caption Design internal-cost authorization IDs are invalid.')
}

function assertUsageReceipt(
  request: EditReferenceCaptionDesignStudyRequest,
  authorization: EditReferenceCaptionDesignUsageAuthorization,
  receipt: EditReferenceCaptionDesignUsageReceipt,
  completed: boolean,
): void {
  assertUsageAuthorization(receipt)
  if (!MONEY_MICROS.test(receipt.meteredInternalCostMicros)) {
    throw new Error('Caption Design metered cost is invalid.')
  }
  if (!sameStrings(receipt.usageEventIds, authorization.usageEventIds)
    || !sameStrings(receipt.internalCostRecordIds, authorization.internalCostRecordIds)) {
    throw new Error('Caption Design cost receipt does not match its authorization.')
  }
  if (BigInt(receipt.meteredInternalCostMicros) > BigInt(request.maximumAuthorizedInternalCostMicros as string)) {
    throw new Error('Caption Design metered cost exceeded its authorization.')
  }
  if (completed && receipt.meteredInternalCostMicros === '0') {
    throw new Error('Completed private Caption Design execution cannot claim zero internal cost.')
  }
}

function assertIdList(values: readonly string[], message: string): void {
  if (!Array.isArray(values) || values.length < 1 || values.length > 64
    || new Set(values).size !== values.length
    || values.some((value) => !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value))) throw new Error(message)
}

function mapProviderBlocker(blockers: readonly string[]): EditReferenceCaptionDesignStudyBlockerCode {
  if (blockers.some((blocker) => blocker.includes('caption_context'))) return 'caption_ocr_authority_unverified'
  if (blockers.some((blocker) => blocker.includes('frame'))) return 'frame_authority_unverified'
  if (blockers.some((blocker) => blocker.includes('model_policy'))) return 'model_routing_unavailable'
  if (blockers.some((blocker) => blocker.includes('unsafe'))) return 'privacy_policy_denied'
  return 'runtime_response_invalid'
}

function safeProviderBlockerMessage(result: QwenVisualUnderstandingResult): string {
  const code = result.blockers[0] ?? 'private_caption_design_runtime_blocked'
  return `The private Caption Design runtime blocked this attempt (${normalizeContractId(code)}).`
}

function classifyAdapterError(error: unknown): EditReferenceCaptionDesignStudyBlockerCode {
  return error instanceof AdapterError ? error.code : 'runtime_response_invalid'
}

function safeAdapterError(error: unknown): string {
  if (error instanceof AdapterError) return error.message
  return 'The bounded Caption Design adapter rejected an invalid private input or runtime response.'
}

function copyEvidence(request: EditReferenceCaptionDesignStudyRequest): EditReferenceCaptionDesignStudyRequest['evidence'] {
  return Object.fromEntries(Object.entries(request.evidence)
    .map(([key, values]) => [key, [...values]])) as unknown as EditReferenceCaptionDesignStudyRequest['evidence']
}

function allEvidenceIds(request: EditReferenceCaptionDesignStudyRequest): string[] {
  return Object.values(request.evidence).flat()
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)]
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return [...left].sort().join('\u0000') === [...right].sort().join('\u0000')
}

function normalizeContractId(value: string): string {
  const normalized = value.replace(/[^A-Za-z0-9._:-]+/g, '_').slice(0, 200)
  return normalized || 'unknown'
}

function normalizeModelId(value: string): string {
  return normalizeContractId(value.replace(/\//g, ':'))
}

function now(options: EditReferenceQwenCaptionDesignAdapterOptions): string {
  return options.now?.() ?? new Date().toISOString()
}

class AdapterError extends Error {
  readonly code: EditReferenceCaptionDesignStudyBlockerCode

  constructor(
    code: EditReferenceCaptionDesignStudyBlockerCode,
    message: string,
  ) {
    super(message)
    this.code = code
    this.name = 'EditReferenceQwenCaptionDesignAdapterError'
  }
}
