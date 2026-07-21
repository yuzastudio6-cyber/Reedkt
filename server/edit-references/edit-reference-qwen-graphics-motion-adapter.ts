import { createHash, randomUUID } from 'node:crypto'
import { constants as fsConstants } from 'node:fs'
import { lstat, open, realpath } from 'node:fs/promises'
import path from 'node:path'
import type { PreferenceTechnicalMotionSignalEvidence } from '../../src/types/edit-reference'
import type {
  QwenGraphicsMotionObservation,
  QwenTechnicalMotionContext,
  QwenVisualUnderstandingProvider,
  QwenVisualUnderstandingResult,
} from '../services/qwen-visual-understanding-provider'
import {
  EDIT_REFERENCE_GRAPHICS_MOTION_STUDY_RESULT_VERSION,
  assertEditReferenceGraphicsMotionStudyRequest,
  assertEditReferenceGraphicsMotionStudyResult,
  computeEditReferenceGraphicsMotionStudyRequestDigest,
  createBlockedEditReferenceGraphicsMotionStudyResult,
  type EditReferenceAnalyzedGraphicsMotionStudyResult,
  type EditReferenceGraphicsMotionFinding,
  type EditReferenceGraphicsMotionFrameEvidence,
  type EditReferenceGraphicsMotionStudyAdapter,
  type EditReferenceGraphicsMotionStudyBlockerCode,
  type EditReferenceGraphicsMotionStudyRequest,
  type EditReferenceGraphicsMotionStudyResult,
} from './edit-reference-graphics-motion-study-contract'

export const EDIT_REFERENCE_QWEN_GRAPHICS_MOTION_ADAPTER_ID =
  'edit_reference_qwen_graphics_motion_adapter' as const
export const EDIT_REFERENCE_QWEN_GRAPHICS_MOTION_ADAPTER_VERSION = 'v1' as const

export interface EditReferenceResolvedGraphicsMotionFrame {
  readonly privateFrameArtifactId: string
  readonly localFilePath: string
}

export interface EditReferenceGraphicsMotionUsageAuthorization {
  readonly usageEventIds: readonly string[]
  readonly internalCostRecordIds: readonly string[]
}

export interface EditReferenceGraphicsMotionUsageReceipt
  extends EditReferenceGraphicsMotionUsageAuthorization {
  readonly meteredInternalCostMicros: string
}

export interface EditReferenceGraphicsMotionProductionUsageAuthority {
  authorize(
    request: EditReferenceGraphicsMotionStudyRequest,
  ): Promise<EditReferenceGraphicsMotionUsageAuthorization>
  reconcile(input: {
    readonly request: EditReferenceGraphicsMotionStudyRequest
    readonly providerResult: QwenVisualUnderstandingResult
    readonly authorization: EditReferenceGraphicsMotionUsageAuthorization
  }): Promise<EditReferenceGraphicsMotionUsageReceipt>
}

export interface EditReferenceQwenGraphicsMotionAdapterOptions {
  readonly provider: QwenVisualUnderstandingProvider
  readonly privateFrameRoot: string
  readonly technicalMotionEvidence: PreferenceTechnicalMotionSignalEvidence
  readonly resolvePrivateFrame: (
    sample: EditReferenceGraphicsMotionFrameEvidence,
  ) => Promise<EditReferenceResolvedGraphicsMotionFrame>
  readonly cleanupPrivateFrames: (
    frames: readonly EditReferenceResolvedGraphicsMotionFrame[],
  ) => Promise<void>
  readonly productionUsageAuthority?: EditReferenceGraphicsMotionProductionUsageAuthority
  readonly now?: () => string
  readonly createExecutionId?: () => string
}

interface PendingBlockedResult {
  readonly kind: 'blocked'
  readonly blockerCode: EditReferenceGraphicsMotionStudyBlockerCode
  readonly blockerMessage: string
  readonly retryAvailable: boolean
  readonly retryReason?: string
  readonly execution?: {
    readonly boundedPrivateFramesRead?: boolean
    readonly technicalMotionResultRead?: boolean
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
  readonly usageReceipt: EditReferenceGraphicsMotionUsageReceipt
}

type PendingAdapterResult = PendingBlockedResult | PendingAnalyzedResult

const VISIBLE_TEXT_CATEGORIES = new Set([
  'titles', 'cards', 'lower_thirds', 'ui_demonstration_patterns',
])
const TIMING_CATEGORIES = new Set([
  'motion_intensity', 'entry_exit_behavior', 'transition_motion',
])
const DIRECT_COPY_LANGUAGE = /\b(?:copy|replicate|recreate|verbatim|same exact|match exactly|retain exact|preserve exact)\b/i
const EXACT_MOTION_OR_LAYOUT_DATA = /(?:\b\d+(?:\.\d+)?\s*(?:px|frames?|milliseconds?|ms|seconds?|s|%)\b)|cubic-bezier\s*\(|matrix\s*\(|translate(?:3d|x|y)?\s*\(|rotate(?:3d|x|y)?\s*\(/i
const MONEY_MICROS = /^(?:0|[1-9][0-9]{0,15})$/

export function createEditReferenceQwenGraphicsMotionAdapter(
  options: EditReferenceQwenGraphicsMotionAdapterOptions,
): EditReferenceGraphicsMotionStudyAdapter {
  return {
    adapterId: EDIT_REFERENCE_QWEN_GRAPHICS_MOTION_ADAPTER_ID,
    adapterVersion: EDIT_REFERENCE_QWEN_GRAPHICS_MOTION_ADAPTER_VERSION,
    async analyze(request): Promise<EditReferenceGraphicsMotionStudyResult> {
      assertEditReferenceGraphicsMotionStudyRequest(request)
      const startedAt = now(options)
      const executionId = options.createExecutionId?.()
        ?? `edit-reference-graphics-motion-${randomUUID()}`
      const resolvedFrames: EditReferenceResolvedGraphicsMotionFrame[] = []
      let boundedPrivateFramesRead = false
      let technicalMotionResultRead = false
      let providerResult: QwenVisualUnderstandingResult | undefined
      let authorization: EditReferenceGraphicsMotionUsageAuthorization | undefined
      let usageReceipt: EditReferenceGraphicsMotionUsageReceipt | undefined
      let pendingResult: PendingAdapterResult | undefined

      try {
        await resolveExactPrivateFrames(options, request, resolvedFrames)
        assertExactTechnicalMotionEvidence(request, options.technicalMotionEvidence)
        technicalMotionResultRead = true

        if (request.executionScope !== 'production') {
          pendingResult = {
            kind: 'blocked',
            blockerCode: 'cost_authority_unavailable',
            blockerMessage: 'The private semantic Graphics/Motion model cannot run under an unmetered controlled-test scope.',
            retryAvailable: true,
            retryReason: 'Retry through an approved production estimate, internal-cost budget, immutable rate-card snapshot, and usage recorder.',
          }
        } else if (!options.productionUsageAuthority) {
          pendingResult = {
            kind: 'blocked',
            blockerCode: 'cost_authority_unavailable',
            blockerMessage: 'Canonical internal-cost authority is unavailable, so no private Graphics/Motion provider call was made.',
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
              blockerMessage: 'Canonical internal-cost authority did not authorize this exact Graphics/Motion request.',
              retryAvailable: true,
              retryReason: 'Refresh the exact estimate, budget, and immutable rate-card authority before retrying.',
            }
          }

          if (authorization) {
            boundedPrivateFramesRead = true
            await verifyExactFrameBytes(request, resolvedFrames)
            providerResult = await options.provider.analyze({
              workspaceId: request.workspaceId,
              projectId: request.editReferenceId,
              editSessionId: request.studySessionId,
              mediaAssetId: request.privateMediaArtifactId,
              analysisRole: 'reference_style_analysis',
              editReferenceStudyProfile: 'graphics_motion',
              technicalMotionContext: toQwenTechnicalMotionContext(
                options.technicalMotionEvidence,
                request.technicalMotionResultDigestSha256,
              ),
              frameArtifacts: request.frameSamples.map((sample) => ({
                artifactId: sample.privateFrameArtifactId,
                localFilePath: requireResolvedFrame(resolvedFrames, sample.privateFrameArtifactId).localFilePath,
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
                blockerMessage: 'The private Graphics/Motion attempt completed, but canonical internal-cost usage could not be reconciled.',
                retryAvailable: false,
                execution: blockedExecution(providerResult, boundedPrivateFramesRead, technicalMotionResultRead),
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
                    retryReason: 'Retry after the reviewed private Graphics/Motion runtime or strict response contract is restored.',
                    execution: blockedExecution(providerResult, boundedPrivateFramesRead, technicalMotionResultRead),
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
          retryReason: 'Restore the exact private-frame, technical-motion, and reviewed model authority, then retry.',
          execution: blockedExecution(providerResult, boundedPrivateFramesRead, technicalMotionResultRead),
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
        return createBlockedEditReferenceGraphicsMotionStudyResult({
          request,
          blockerCode: 'ephemeral_cleanup_failed',
          blockerMessage: 'Ephemeral Graphics/Motion frames could not be proven deleted after the bounded attempt.',
          retryAvailable: false,
          execution: {
            ...blockedExecution(providerResult, boundedPrivateFramesRead, technicalMotionResultRead),
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
        return createBlockedEditReferenceGraphicsMotionStudyResult({
          request,
          blockerCode: 'adapter_unavailable',
          blockerMessage: 'The bounded Graphics/Motion adapter ended without a structured result.',
          retryAvailable: true,
          retryReason: 'Retry after restoring the reviewed adapter state machine.',
          execution: { technicalMotionResultRead, temporaryFramesCleaned: true },
        })
      }
      if (pendingResult.kind === 'blocked') {
        return createBlockedEditReferenceGraphicsMotionStudyResult({
          request,
          blockerCode: pendingResult.blockerCode,
          blockerMessage: pendingResult.blockerMessage,
          retryAvailable: pendingResult.retryAvailable,
          retryReason: pendingResult.retryReason,
          execution: { ...pendingResult.execution, technicalMotionResultRead, temporaryFramesCleaned: true },
          usage: pendingResult.usage,
        })
      }

      try {
        return buildAnalyzedResult({
          request,
          providerResult: pendingResult.providerResult,
          usageReceipt: pendingResult.usageReceipt,
          executionId,
          startedAt,
          completedAt: now(options),
        })
      } catch (error) {
        return createBlockedEditReferenceGraphicsMotionStudyResult({
          request,
          blockerCode: classifyAdapterError(error),
          blockerMessage: safeAdapterError(error),
          retryAvailable: false,
          execution: {
            ...blockedExecution(pendingResult.providerResult, boundedPrivateFramesRead, technicalMotionResultRead),
            temporaryFramesCleaned: true,
          },
          usage: meteredUsage(pendingResult.usageReceipt),
        })
      }
    },
  }
}

function buildAnalyzedResult(input: {
  readonly request: EditReferenceGraphicsMotionStudyRequest
  readonly providerResult: QwenVisualUnderstandingResult
  readonly usageReceipt: EditReferenceGraphicsMotionUsageReceipt
  readonly executionId: string
  readonly startedAt: string
  readonly completedAt: string
}): EditReferenceAnalyzedGraphicsMotionStudyResult {
  const { request, providerResult } = input
  const provenance = providerResult.runtimeProvenance
  const observations = providerResult.graphicsMotionObservations ?? []
  if (!provenance || provenance.runtimeSource !== 'verified_live') {
    throw new AdapterError('model_routing_unavailable', 'The Graphics/Motion result lacks reviewed runtime provenance.')
  }
  if (!providerResult.graphicsMotionTransferSafety || observations.length < 1) {
    throw new AdapterError('runtime_response_invalid', 'The Graphics/Motion result omitted strict observations or no-copy safety.')
  }
  if (!providerResult.execution.providerCallMade || !providerResult.execution.modelCallMade) {
    throw new AdapterError('runtime_response_invalid', 'The Graphics/Motion result cannot prove provider and model execution.')
  }
  return buildEditReferenceAnalyzedGraphicsMotionStudyResult({
    request,
    observations,
    runtimeSource: 'verified_live',
    providerCallMade: true,
    modelCallMade: true,
    workerJobCreated: providerResult.execution.workerJobCreated,
    analyzer: {
      adapterId: EDIT_REFERENCE_QWEN_GRAPHICS_MOTION_ADAPTER_ID,
      adapterVersion: EDIT_REFERENCE_QWEN_GRAPHICS_MOTION_ADAPTER_VERSION,
      providerId: provenance.providerId,
      modelId: normalizeModelId(provenance.modelId),
      modelRevision: normalizeContractId(provenance.modelRevision),
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

export interface BuildEditReferenceAnalyzedGraphicsMotionStudyResultInput {
  readonly request: EditReferenceGraphicsMotionStudyRequest
  readonly observations: readonly QwenGraphicsMotionObservation[]
  readonly runtimeSource: 'verified_local' | 'verified_live'
  readonly providerCallMade: boolean
  readonly modelCallMade: true
  readonly workerJobCreated: boolean
  readonly analyzer: EditReferenceAnalyzedGraphicsMotionStudyResult['analyzer']
  readonly provenance: EditReferenceAnalyzedGraphicsMotionStudyResult['provenance']
  readonly usage: EditReferenceAnalyzedGraphicsMotionStudyResult['usage']
}

export function buildEditReferenceAnalyzedGraphicsMotionStudyResult(
  input: BuildEditReferenceAnalyzedGraphicsMotionStudyResultInput,
): EditReferenceAnalyzedGraphicsMotionStudyResult {
  const { request, observations } = input
  if (observations.some((observation) => (
    DIRECT_COPY_LANGUAGE.test(observation.summary)
    || EXACT_MOTION_OR_LAYOUT_DATA.test(observation.summary)
  ))) {
    throw new AdapterError('copy_safety_violation', 'The Graphics/Motion result retained copy-oriented or exact motion/layout data.')
  }
  assertObservationSafety(request, observations)
  const authorizedObservations = observations.filter((observation) => (
    (!observation.visibleTextRelated || request.verifiedVisibleTextEvidenceAvailable)
    && (!observation.timingRelated || request.verifiedVisualCueTimingAvailable)
  ))
  if (authorizedObservations.length < 1) {
    throw new AdapterError('runtime_response_invalid', 'The Graphics/Motion result had no observation supported by the exact evidence manifest.')
  }
  const findings = authorizedObservations.map((observation, index) => mapObservation(request, observation, index))
  const averageConfidence = findings.reduce((sum, finding) => sum + finding.confidence, 0) / findings.length
  const result: EditReferenceAnalyzedGraphicsMotionStudyResult = {
    schemaVersion: EDIT_REFERENCE_GRAPHICS_MOTION_STUDY_RESULT_VERSION,
    requestDigestSha256: computeEditReferenceGraphicsMotionStudyRequestDigest(request),
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
    technicalMotionResultDigestSha256: request.technicalMotionResultDigestSha256,
    consumedFrameEvidenceIds: request.frameSamples.map((sample) => sample.frameEvidenceId),
    evidence: copyEvidence(request),
    technicalMotionAuthority: {
      ...request.technicalMotionAuthority,
      toolIds: [...request.technicalMotionAuthority.toolIds],
    },
    findings,
    coverage: {
      evidenceItemCount: allEvidenceIds(request).length,
      frameCount: request.frameSamples.length,
      representativeFrameCount: request.frameSamples.filter((sample) => sample.role === 'representative').length,
      motionKeyframeCount: request.frameSamples.filter((sample) => sample.role === 'motion_keyframe').length,
      technicalSampleCount: request.technicalMotionAuthority.sampleCount,
      sourceDurationSeconds: request.sourceDurationSeconds,
      analysisWindowStartSeconds: request.analysisWindowStartSeconds,
      analysisWindowEndSeconds: request.analysisWindowEndSeconds,
      analyzedDurationSeconds: request.analysisWindowEndSeconds - request.analysisWindowStartSeconds,
      evidenceMode: 'frames_and_technical_motion',
      visibleTextEvidenceAvailable: request.verifiedVisibleTextEvidenceAvailable,
      visualCueTimingAvailable: request.verifiedVisualCueTimingAvailable,
      partial: request.technicalMotionAuthority.coverage === 'partial',
      missingEvidenceKinds: request.technicalMotionAuthority.coverage === 'partial'
        ? ['technical_signal_partial_coverage']
        : [],
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
      technicalMotionResultRead: true,
      semanticGraphicsMotionModelExecuted: true,
      rawFullMediaRead: false,
      rawDifferenceFrameRead: false,
      externalUrlFetched: false,
      providerCallMade: input.providerCallMade,
      modelCallMade: input.modelCallMade,
      workerJobCreated: input.workerJobCreated,
      temporaryFramesCleaned: true,
      remoteMutationMade: false,
    },
    analyzer: { ...input.analyzer },
    provenance: { ...input.provenance },
    usage: {
      ...input.usage,
      usageEventIds: [...input.usage.usageEventIds],
      internalCostRecordIds: [...input.usage.internalCostRecordIds],
    },
    privacy: {
      rawFullMediaPersisted: false,
      rawFramesPersisted: false,
      rawDifferenceFramesPersisted: false,
      rawProviderPayloadPersisted: false,
      signedUrlPersisted: false,
      hiddenChainOfThoughtPersisted: false,
      temporaryFramesCleaned: true,
    },
    copySafety: {
      exactGraphicAssetTransferInstructionCreated: false,
      exactReferenceTextOrIconTransferInstructionCreated: false,
      exactLayoutOrSpacingTransferInstructionCreated: false,
      exactAnimationKeyframeOrCurveTransferInstructionCreated: false,
      exactTransitionPathOrTimingTransferInstructionCreated: false,
      exactBrandOrUiIdentityTransferInstructionCreated: false,
      referenceDerivedGraphicsOrMotionGenerationInstructionCreated: false,
      sourceGraphicOrUiAssetCopied: false,
    },
    motionSafety: {
      technicalMotionTreatedAsSemanticIntent: false,
      targetConfirmedOutputFrameRequired: true,
      targetFrameLayoutAndSafeZonesRequired: true,
      targetCaptionCollisionQaRequired: true,
      targetSpeakerSubjectAndHeroSafePlacementQaRequired: true,
      targetVisibleTextReadabilityQaRequired: request.verifiedVisibleTextEvidenceAvailable,
      targetBrandOrUiIdentityReviewRequired: request.sourceBrandOrUiIdentityPresent,
      targetFinalRenderMotionQaRequired: true,
      cameraOrSubjectMotionClaimedWithoutSemanticEvidence: false,
      cutOrTransitionClassifiedFromTechnicalDifferences: false,
      randomDecorativeMotionInstructionCreated: false,
    },
    transferBoundary: {
      findingsMayBecomeTargetInstructionsWithoutApplication: false,
      targetEvidenceRequired: true,
      targetMediaGraphicsMotionAnalysisRequired: true,
      targetMeaningAndContentHierarchyReviewRequired: true,
      targetVisualCueAndTimingReviewRequired: true,
      confirmedOutputFrameAndLayoutRequired: true,
      masterTimingPlanRequired: true,
      frameLayoutPlanRequired: true,
      renderStrategyPlanRequired: true,
      timingValidationRequired: true,
      userApprovalRequired: true,
      ownedTargetBrandAssetsRequireSeparateTargetAssetApproval: true,
      exactReferenceGraphicsLayoutOrMotionTransferAllowed: false,
      remotionOrDeterministicRenderExecutionCreated: false,
      generatedAssetOrProviderPromptCreated: false,
    },
  }
  assertEditReferenceGraphicsMotionStudyResult(request, result)
  return result
}

function assertObservationSafety(
  request: EditReferenceGraphicsMotionStudyRequest,
  observations: readonly QwenGraphicsMotionObservation[],
): void {
  for (const observation of observations) {
    const visibleTextRelated = VISIBLE_TEXT_CATEGORIES.has(observation.category)
    const timingRelated = TIMING_CATEGORIES.has(observation.category)
    if (observation.visibleTextRelated !== visibleTextRelated || observation.timingRelated !== timingRelated) {
      throw new AdapterError('runtime_response_invalid', 'Graphics/Motion observation safety metadata did not match its category.')
    }
    if (observation.brandOrUiIdentityRelated && (
      !request.sourceBrandOrUiIdentityPresent
      || request.evidence.rightsAndBrandEvidenceIds.length < 1
      || observation.transferability !== 'non_transferable'
      || !observation.requiresUserReview
    )) {
      throw new AdapterError('rights_brand_or_ui_evidence_required', 'Brand/UI observations require exact rights authority and non-transferable review.')
    }
  }
}

function mapObservation(
  request: EditReferenceGraphicsMotionStudyRequest,
  observation: QwenGraphicsMotionObservation,
  index: number,
): EditReferenceGraphicsMotionFinding {
  const frames = observation.frameIds.map((frameId) => requireRequestFrame(request, frameId))
  const frameEvidenceIds = frames.map((frame) => frame.frameEvidenceId)
  const evidenceIds = uniqueStrings([
    ...request.evidence.mediaStructureEvidenceIds,
    ...request.evidence.technicalMotionSignalEvidenceIds,
    ...request.evidence.sceneBoundaryEvidenceIds,
    ...request.evidence.studyChatGoalEvidenceIds,
    ...frameEvidenceIds,
    ...(observation.visibleTextRelated ? request.evidence.visibleTextEvidenceIds : []),
    ...(observation.timingRelated ? request.evidence.visualCueTimingEvidenceIds : []),
    ...(observation.brandOrUiIdentityRelated ? request.evidence.rightsAndBrandEvidenceIds : []),
  ])
  const minimumTime = Math.min(...frames.map((frame) => frame.sourceTimeSeconds))
  const maximumTime = Math.max(...frames.map((frame) => frame.sourceTimeSeconds))
  const startSeconds = Math.max(request.analysisWindowStartSeconds, minimumTime - 0.25)
  const endSeconds = Math.min(
    request.analysisWindowEndSeconds,
    Math.max(maximumTime + 0.25, startSeconds + 0.001),
  )
  return {
    findingId: `graphics-motion-finding-${index + 1}`,
    category: observation.category,
    summary: observation.summary,
    evidenceIds,
    frameEvidenceIds,
    sourceRanges: [{
      rangeId: `graphics-motion-range-${index + 1}`,
      startSeconds,
      endSeconds,
      evidenceIds,
      frameEvidenceIds,
      sourceEvidenceOnly: true,
      targetLayoutOrMotionInstructionCreated: false,
      sourceGraphicAssetCopied: false,
      executableGraphicsMotionOperationCreated: false,
    }],
    confidence: observation.confidence,
    transferability: observation.transferability,
    targetAdaptationRequired: true,
    requiresUserReview: observation.requiresUserReview || observation.visibleTextRelated || observation.timingRelated || observation.brandOrUiIdentityRelated,
    visibleTextRelated: observation.visibleTextRelated,
    brandOrUiIdentityRelated: observation.brandOrUiIdentityRelated,
    timingRelated: observation.timingRelated,
    observedGraphicsMotionCharacterOnly: true,
    generalizedTargetAdaptablePrincipleOnly: true,
    technicalMotionContextOnly: true,
    exactGraphicAssetsRetained: false,
    exactReferenceTextOrIconIdentityRetained: false,
    exactLayoutOrSpacingValuesRetained: false,
    exactAnimationKeyframesOrCurvesRetained: false,
    exactTransitionPathOrTimingRetained: false,
    exactBrandOrUiIdentityRetained: false,
    sourceGraphicOrUiAssetCopied: false,
    executableTargetGraphicsMotionOperationCreated: false,
  }
}

export function hashEditReferenceTechnicalMotionEvidence(
  evidence: PreferenceTechnicalMotionSignalEvidence,
): string {
  if (evidence.status !== 'verified_local_bounded' || !evidence.technicalFrameDifferenceAnalysisRan) {
    throw new Error('Verified bounded technical motion evidence is required.')
  }
  return createHash('sha256').update(JSON.stringify(normalizedTechnicalMotionEvidence(evidence))).digest('hex')
}

export function hashEditReferenceGraphicsMotionFrameManifest(
  frames: readonly EditReferenceGraphicsMotionFrameEvidence[],
): string {
  return createHash('sha256').update(JSON.stringify([...frames]
    .sort((left, right) => left.frameEvidenceId.localeCompare(right.frameEvidenceId)))).digest('hex')
}

export function hashEditReferenceGraphicsMotionEvidenceManifest(
  request: Pick<EditReferenceGraphicsMotionStudyRequest, 'evidence'>,
): string {
  const normalized = Object.fromEntries(Object.entries(request.evidence)
    .map(([key, values]) => [key, [...values].sort()]))
  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex')
}

export function assertExactTechnicalMotionEvidence(
  request: EditReferenceGraphicsMotionStudyRequest,
  evidence: PreferenceTechnicalMotionSignalEvidence,
): void {
  const digest = hashEditReferenceTechnicalMotionEvidence(evidence)
  if (
    digest !== request.technicalMotionResultDigestSha256
    || digest !== request.technicalMotionAuthority.resultDigestSha256
    || evidence.schemaVersion !== request.technicalMotionAuthority.schemaVersion
    || evidence.status !== request.technicalMotionAuthority.status
    || evidence.coverage !== request.technicalMotionAuthority.coverage
    || evidence.sampleCount !== request.technicalMotionAuthority.sampleCount
    || evidence.scannedDurationSeconds !== request.technicalMotionAuthority.scannedDurationSeconds
    || evidence.activityThreshold8Bit !== request.technicalMotionAuthority.activityThreshold8Bit
    || evidence.highActivityThreshold8Bit !== request.technicalMotionAuthority.highActivityThreshold8Bit
    || evidence.activeSampleRatio !== request.technicalMotionAuthority.activeSampleRatio
    || evidence.highActivitySampleRatio !== request.technicalMotionAuthority.highActivitySampleRatio
    || evidence.peakSamples.length !== request.technicalMotionAuthority.peakSampleCount
  ) throw new AdapterError('technical_motion_authority_unverified', 'The technical-motion evidence did not match the exact request authority.')
}

function toQwenTechnicalMotionContext(
  evidence: PreferenceTechnicalMotionSignalEvidence,
  resultDigestSha256: string,
): QwenTechnicalMotionContext {
  return {
    schemaVersion: 'edit-reference-technical-motion-context-v1',
    resultDigestSha256,
    coverage: evidence.coverage as 'full' | 'partial',
    sampleCount: evidence.sampleCount,
    scannedDurationSeconds: evidence.scannedDurationSeconds,
    activityThreshold8Bit: evidence.activityThreshold8Bit,
    highActivityThreshold8Bit: evidence.highActivityThreshold8Bit,
    activeSampleRatio: evidence.activeSampleRatio,
    highActivitySampleRatio: evidence.highActivitySampleRatio,
    peakSampleCount: evidence.peakSamples.length,
    technicalFrameDifferenceAnalysisRan: true,
    semanticMotionAnalysisRan: false,
    cameraMotionInferenceRan: false,
    objectTrackingRan: false,
    transitionClassificationRan: false,
    graphicsEntryExitAnalysisRan: false,
    opticalFlowAnalysisRan: false,
    rawFramePixelsPersisted: false,
    rawDifferenceFramesPersisted: false,
    rawHistogramPersisted: false,
    rawProcessOutputPersisted: false,
  }
}

function normalizedTechnicalMotionEvidence(
  evidence: PreferenceTechnicalMotionSignalEvidence,
): Record<string, unknown> {
  return Object.fromEntries(Object.entries({
    ...evidence,
    sampleTimesSeconds: [...evidence.sampleTimesSeconds],
    peakSamples: [...evidence.peakSamples].map((peak) => ({ ...peak })),
  }).filter(([, value]) => value !== undefined))
}

async function resolveExactPrivateFrames(
  options: EditReferenceQwenGraphicsMotionAdapterOptions,
  request: EditReferenceGraphicsMotionStudyRequest,
  resolvedFrames: EditReferenceResolvedGraphicsMotionFrame[],
): Promise<void> {
  const rootStat = await lstat(options.privateFrameRoot)
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
    throw new AdapterError('privacy_policy_denied', 'The approved private frame root is invalid.')
  }
  const root = await realpath(options.privateFrameRoot)
  for (const sample of request.frameSamples) {
    const resolved = await options.resolvePrivateFrame(sample)
    if (resolved.privateFrameArtifactId !== sample.privateFrameArtifactId) {
      throw new AdapterError('frame_authority_unverified', 'Resolved private frame identity does not match the request.')
    }
    const configuredPath = path.resolve(resolved.localFilePath)
    const fileStat = await lstat(configuredPath)
    if (!fileStat.isFile() || fileStat.isSymbolicLink()) {
      throw new AdapterError('privacy_policy_denied', 'Resolved private frame is not a regular no-symlink file.')
    }
    const resolvedPath = await realpath(configuredPath)
    const relative = path.relative(root, resolvedPath)
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new AdapterError('privacy_policy_denied', 'Resolved private frame is outside the approved ephemeral root.')
    }
    resolvedFrames.push({ privateFrameArtifactId: sample.privateFrameArtifactId, localFilePath: resolvedPath })
  }
}

async function verifyExactFrameBytes(
  request: EditReferenceGraphicsMotionStudyRequest,
  frames: readonly EditReferenceResolvedGraphicsMotionFrame[],
): Promise<void> {
  for (const sample of request.frameSamples) {
    const frame = requireResolvedFrame(frames, sample.privateFrameArtifactId)
    const handle = await open(frame.localFilePath, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW)
    try {
      const stat = await handle.stat()
      if (!stat.isFile() || stat.size < 1 || stat.size > 2 * 1024 * 1024) {
        throw new AdapterError('frame_authority_unverified', 'A private Graphics/Motion frame is empty or exceeds 2 MiB.')
      }
      const bytes = await handle.readFile()
      if (createHash('sha256').update(bytes).digest('hex') !== sample.frameChecksumSha256) {
        throw new AdapterError('frame_authority_unverified', 'A private Graphics/Motion frame failed checksum verification.')
      }
      const dimensions = readJpegDimensions(bytes)
      if (dimensions.width !== sample.width || dimensions.height !== sample.height) {
        throw new AdapterError('frame_authority_unverified', 'A private Graphics/Motion frame failed exact dimension verification.')
      }
    } finally {
      await handle.close()
    }
  }
}

function readJpegDimensions(bytes: Buffer): { width: number; height: number } {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new AdapterError('frame_authority_unverified', 'A private Graphics/Motion frame is not a valid JPEG.')
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
  throw new AdapterError('frame_authority_unverified', 'A private Graphics/Motion JPEG lacks exact dimensions.')
}

async function privateFramesAreAbsent(
  frames: readonly EditReferenceResolvedGraphicsMotionFrame[],
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
  frames: readonly EditReferenceResolvedGraphicsMotionFrame[],
  artifactId: string,
): EditReferenceResolvedGraphicsMotionFrame {
  const frame = frames.find((candidate) => candidate.privateFrameArtifactId === artifactId)
  if (!frame) throw new AdapterError('frame_authority_unverified', 'A private Graphics/Motion frame could not be resolved.')
  return frame
}

function requireRequestFrame(
  request: EditReferenceGraphicsMotionStudyRequest,
  privateFrameArtifactId: string,
): EditReferenceGraphicsMotionFrameEvidence {
  const frame = request.frameSamples.find((candidate) => candidate.privateFrameArtifactId === privateFrameArtifactId)
  if (!frame) throw new AdapterError('runtime_response_invalid', 'Graphics/Motion output cited an unknown private frame.')
  return frame
}

function blockedExecution(
  result: QwenVisualUnderstandingResult | undefined,
  boundedPrivateFramesRead: boolean,
  technicalMotionResultRead: boolean,
): NonNullable<PendingBlockedResult['execution']> {
  return {
    boundedPrivateFramesRead,
    technicalMotionResultRead,
    providerCallMade: result?.execution.providerCallMade ?? false,
    modelCallMade: result?.execution.modelCallMade ?? false,
    workerJobCreated: result?.execution.workerJobCreated ?? false,
  }
}

function meteredUsage(
  receipt: EditReferenceGraphicsMotionUsageReceipt,
): NonNullable<PendingBlockedResult['usage']> {
  return {
    internalCostStatus: 'metered',
    meteredInternalCostMicros: receipt.meteredInternalCostMicros,
    usageEventIds: receipt.usageEventIds,
    internalCostRecordIds: receipt.internalCostRecordIds,
  }
}

function assertUsageAuthorization(value: EditReferenceGraphicsMotionUsageAuthorization): void {
  assertIdList(value.usageEventIds, 'Graphics/Motion usage authorization IDs are invalid.')
  assertIdList(value.internalCostRecordIds, 'Graphics/Motion internal-cost authorization IDs are invalid.')
}

function assertUsageReceipt(
  request: EditReferenceGraphicsMotionStudyRequest,
  authorization: EditReferenceGraphicsMotionUsageAuthorization,
  receipt: EditReferenceGraphicsMotionUsageReceipt,
  completed: boolean,
): void {
  assertUsageAuthorization(receipt)
  if (!MONEY_MICROS.test(receipt.meteredInternalCostMicros)) throw new Error('Graphics/Motion metered cost is invalid.')
  if (!sameStrings(receipt.usageEventIds, authorization.usageEventIds)
    || !sameStrings(receipt.internalCostRecordIds, authorization.internalCostRecordIds)) {
    throw new Error('Graphics/Motion cost receipt does not match its authorization.')
  }
  if (BigInt(receipt.meteredInternalCostMicros) > BigInt(request.maximumAuthorizedInternalCostMicros as string)) {
    throw new Error('Graphics/Motion metered cost exceeded its authorization.')
  }
  if (completed && receipt.meteredInternalCostMicros === '0') {
    throw new Error('Completed private Graphics/Motion execution cannot claim zero internal cost.')
  }
}

function assertIdList(values: readonly string[], message: string): void {
  if (!Array.isArray(values) || values.length < 1 || values.length > 64
    || new Set(values).size !== values.length
    || values.some((value) => !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value))) throw new Error(message)
}

function mapProviderBlocker(blockers: readonly string[]): EditReferenceGraphicsMotionStudyBlockerCode {
  if (blockers.some((blocker) => blocker.includes('motion_context'))) return 'technical_motion_authority_unverified'
  if (blockers.some((blocker) => blocker.includes('frame'))) return 'frame_authority_unverified'
  if (blockers.some((blocker) => blocker.includes('model_policy'))) return 'model_routing_unavailable'
  if (blockers.some((blocker) => blocker.includes('unsafe'))) return 'privacy_policy_denied'
  return 'runtime_response_invalid'
}

function safeProviderBlockerMessage(result: QwenVisualUnderstandingResult): string {
  const code = result.blockers[0] ?? 'private_graphics_motion_runtime_blocked'
  return `The private Graphics/Motion runtime blocked this attempt (${normalizeContractId(code)}).`
}

function classifyAdapterError(error: unknown): EditReferenceGraphicsMotionStudyBlockerCode {
  return error instanceof AdapterError ? error.code : 'runtime_response_invalid'
}

function safeAdapterError(error: unknown): string {
  if (error instanceof AdapterError) return error.message
  return 'The bounded Graphics/Motion adapter rejected an invalid private input or runtime response.'
}

function copyEvidence(request: EditReferenceGraphicsMotionStudyRequest): EditReferenceGraphicsMotionStudyRequest['evidence'] {
  return Object.fromEntries(Object.entries(request.evidence)
    .map(([key, values]) => [key, [...values]])) as unknown as EditReferenceGraphicsMotionStudyRequest['evidence']
}

function allEvidenceIds(request: EditReferenceGraphicsMotionStudyRequest): string[] {
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

function now(options: EditReferenceQwenGraphicsMotionAdapterOptions): string {
  return options.now?.() ?? new Date().toISOString()
}

class AdapterError extends Error {
  readonly code: EditReferenceGraphicsMotionStudyBlockerCode

  constructor(code: EditReferenceGraphicsMotionStudyBlockerCode, message: string) {
    super(message)
    this.name = 'EditReferenceGraphicsMotionAdapterError'
    this.code = code
  }
}
