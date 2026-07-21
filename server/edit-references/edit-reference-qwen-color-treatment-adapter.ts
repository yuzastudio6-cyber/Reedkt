import { createHash, randomUUID } from 'node:crypto'
import { constants as fsConstants } from 'node:fs'
import { lstat, open, realpath } from 'node:fs/promises'
import path from 'node:path'
import type { PreferenceTechnicalColorSignalEvidence } from '../../src/types/edit-reference'
import type {
  QwenColorTreatmentObservation,
  QwenTechnicalColorContext,
  QwenVisualUnderstandingProvider,
  QwenVisualUnderstandingResult,
} from '../services/qwen-visual-understanding-provider'
import {
  EDIT_REFERENCE_COLOR_TREATMENT_STUDY_RESULT_VERSION,
  assertEditReferenceColorTreatmentStudyRequest,
  assertEditReferenceColorTreatmentStudyResult,
  computeEditReferenceColorTreatmentStudyRequestDigest,
  createBlockedEditReferenceColorTreatmentStudyResult,
  type EditReferenceAnalyzedColorTreatmentStudyResult,
  type EditReferenceColorTreatmentFinding,
  type EditReferenceColorTreatmentFindingCategory,
  type EditReferenceColorTreatmentFrameEvidence,
  type EditReferenceColorTreatmentStudyAdapter,
  type EditReferenceColorTreatmentStudyBlockerCode,
  type EditReferenceColorTreatmentStudyRequest,
  type EditReferenceColorTreatmentStudyResult,
} from './edit-reference-color-treatment-study-contract'

export const EDIT_REFERENCE_QWEN_COLOR_TREATMENT_ADAPTER_ID =
  'edit_reference_qwen_color_treatment_adapter' as const
export const EDIT_REFERENCE_QWEN_COLOR_TREATMENT_ADAPTER_VERSION = 'v1' as const

export interface EditReferenceResolvedColorFrame {
  readonly privateFrameArtifactId: string
  readonly localFilePath: string
}

export interface EditReferenceColorTreatmentUsageAuthorization {
  readonly usageEventIds: readonly string[]
  readonly internalCostRecordIds: readonly string[]
}

export interface EditReferenceColorTreatmentUsageReceipt
  extends EditReferenceColorTreatmentUsageAuthorization {
  readonly meteredInternalCostMicros: string
}

export interface EditReferenceColorTreatmentProductionUsageAuthority {
  authorize(
    request: EditReferenceColorTreatmentStudyRequest,
  ): Promise<EditReferenceColorTreatmentUsageAuthorization>
  reconcile(input: {
    readonly request: EditReferenceColorTreatmentStudyRequest
    readonly providerResult: QwenVisualUnderstandingResult
    readonly authorization: EditReferenceColorTreatmentUsageAuthorization
  }): Promise<EditReferenceColorTreatmentUsageReceipt>
}

export interface EditReferenceQwenColorTreatmentAdapterOptions {
  readonly provider: QwenVisualUnderstandingProvider
  readonly privateFrameRoot: string
  readonly technicalColorEvidence: PreferenceTechnicalColorSignalEvidence
  readonly resolvePrivateFrame: (
    sample: EditReferenceColorTreatmentFrameEvidence,
  ) => Promise<EditReferenceResolvedColorFrame>
  readonly cleanupPrivateFrames: (
    frames: readonly EditReferenceResolvedColorFrame[],
  ) => Promise<void>
  readonly productionUsageAuthority?: EditReferenceColorTreatmentProductionUsageAuthority
  readonly now?: () => string
  readonly createExecutionId?: () => string
}

interface PendingBlockedResult {
  readonly kind: 'blocked'
  readonly blockerCode: EditReferenceColorTreatmentStudyBlockerCode
  readonly blockerMessage: string
  readonly retryAvailable: boolean
  readonly retryReason?: string
  readonly execution?: {
    readonly boundedPrivateFramesRead?: boolean
    readonly technicalColorResultRead?: boolean
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
  readonly usageReceipt: EditReferenceColorTreatmentUsageReceipt
}

type PendingAdapterResult = PendingBlockedResult | PendingAnalyzedResult

const ALL_CATEGORIES: readonly EditReferenceColorTreatmentFindingCategory[] = [
  'palette_relationship',
  'temperature_character',
  'white_balance_character',
  'contrast_structure',
  'saturation_vibrance',
  'luma_distribution',
  'highlight_rolloff',
  'shadow_treatment',
  'skin_tone_protection',
  'scene_consistency',
  'overall_color_character',
]
const DIRECT_COPY_LANGUAGE = /\b(?:copy|replicate|recreate|verbatim|same exact|match exactly|retain exact|preserve exact)\b/i
const EXACT_COLOR_DATA = /#[a-f0-9]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\s*\(|\b(?:lift|gamma|gain|curve|lut|cdl)\s*[:=]/i
const MONEY_MICROS = /^(?:0|[1-9][0-9]{0,15})$/

export function createEditReferenceQwenColorTreatmentAdapter(
  options: EditReferenceQwenColorTreatmentAdapterOptions,
): EditReferenceColorTreatmentStudyAdapter {
  return {
    adapterId: EDIT_REFERENCE_QWEN_COLOR_TREATMENT_ADAPTER_ID,
    adapterVersion: EDIT_REFERENCE_QWEN_COLOR_TREATMENT_ADAPTER_VERSION,
    async analyze(request): Promise<EditReferenceColorTreatmentStudyResult> {
      assertEditReferenceColorTreatmentStudyRequest(request)
      const startedAt = now(options)
      const executionId = options.createExecutionId?.()
        ?? `edit-reference-color-treatment-${randomUUID()}`
      const resolvedFrames: EditReferenceResolvedColorFrame[] = []
      let boundedPrivateFramesRead = false
      let technicalColorResultRead = false
      let providerResult: QwenVisualUnderstandingResult | undefined
      let authorization: EditReferenceColorTreatmentUsageAuthorization | undefined
      let usageReceipt: EditReferenceColorTreatmentUsageReceipt | undefined
      let pendingResult: PendingAdapterResult | undefined

      try {
        await resolveExactPrivateFrames(options, request, resolvedFrames)
        assertExactTechnicalColorEvidence(request, options.technicalColorEvidence)
        technicalColorResultRead = true

        if (request.executionScope !== 'production') {
          pendingResult = {
            kind: 'blocked',
            blockerCode: 'cost_authority_unavailable',
            blockerMessage: 'The private semantic Color Treatment model cannot run under an unmetered controlled-test scope.',
            retryAvailable: true,
            retryReason: 'Retry through an approved production estimate, internal-cost budget, immutable rate-card snapshot, and usage recorder.',
          }
        } else if (!options.productionUsageAuthority) {
          pendingResult = {
            kind: 'blocked',
            blockerCode: 'cost_authority_unavailable',
            blockerMessage: 'Canonical internal-cost authority is unavailable, so no private Color Treatment provider call was made.',
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
              blockerMessage: 'Canonical internal-cost authority did not authorize this exact Color Treatment request.',
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
              editReferenceStudyProfile: 'color_treatment',
              technicalColorContext: toQwenTechnicalColorContext(
                options.technicalColorEvidence,
                request.technicalColorResultDigestSha256,
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
                blockerMessage: 'The private Color Treatment attempt completed, but canonical internal-cost usage could not be reconciled.',
                retryAvailable: false,
                execution: blockedExecution(providerResult, boundedPrivateFramesRead, technicalColorResultRead),
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
                    retryReason: 'Retry after the reviewed private Color Treatment runtime or strict response contract is restored.',
                    execution: blockedExecution(providerResult, boundedPrivateFramesRead, technicalColorResultRead),
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
          retryReason: 'Restore the exact private-frame, technical-color, and reviewed model authority, then retry.',
          execution: blockedExecution(providerResult, boundedPrivateFramesRead, technicalColorResultRead),
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
        return createBlockedEditReferenceColorTreatmentStudyResult({
          request,
          blockerCode: 'ephemeral_cleanup_failed',
          blockerMessage: 'Ephemeral Color Treatment frames could not be proven deleted after the bounded attempt.',
          retryAvailable: false,
          execution: {
            ...blockedExecution(providerResult, boundedPrivateFramesRead, technicalColorResultRead),
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
        return createBlockedEditReferenceColorTreatmentStudyResult({
          request,
          blockerCode: 'adapter_unavailable',
          blockerMessage: 'The bounded Color Treatment adapter ended without a structured result.',
          retryAvailable: true,
          retryReason: 'Retry after restoring the reviewed adapter state machine.',
          execution: { technicalColorResultRead, temporaryFramesCleaned: true },
        })
      }
      if (pendingResult.kind === 'blocked') {
        return createBlockedEditReferenceColorTreatmentStudyResult({
          request,
          blockerCode: pendingResult.blockerCode,
          blockerMessage: pendingResult.blockerMessage,
          retryAvailable: pendingResult.retryAvailable,
          retryReason: pendingResult.retryReason,
          execution: { ...pendingResult.execution, technicalColorResultRead, temporaryFramesCleaned: true },
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
        return createBlockedEditReferenceColorTreatmentStudyResult({
          request,
          blockerCode: classifyAdapterError(error),
          blockerMessage: safeAdapterError(error),
          retryAvailable: false,
          execution: {
            ...blockedExecution(pendingResult.providerResult, boundedPrivateFramesRead, technicalColorResultRead),
            temporaryFramesCleaned: true,
          },
          usage: meteredUsage(pendingResult.usageReceipt),
        })
      }
    },
  }
}

function buildAnalyzedResult(input: {
  readonly request: EditReferenceColorTreatmentStudyRequest
  readonly providerResult: QwenVisualUnderstandingResult
  readonly usageReceipt: EditReferenceColorTreatmentUsageReceipt
  readonly executionId: string
  readonly startedAt: string
  readonly completedAt: string
}): EditReferenceAnalyzedColorTreatmentStudyResult {
  const { request, providerResult } = input
  const provenance = providerResult.runtimeProvenance
  const observations = providerResult.colorTreatmentObservations ?? []
  if (!provenance || provenance.runtimeSource !== 'verified_live') {
    throw new AdapterError('model_routing_unavailable', 'The Color Treatment result lacks reviewed runtime provenance.')
  }
  if (!providerResult.colorTransferSafety || observations.length < 1) {
    throw new AdapterError('runtime_response_invalid', 'The Color Treatment result omitted strict observations or no-copy safety.')
  }
  if (!providerResult.execution.providerCallMade || !providerResult.execution.modelCallMade) {
    throw new AdapterError('runtime_response_invalid', 'The Color Treatment result cannot prove provider and model execution.')
  }
  return buildEditReferenceAnalyzedColorTreatmentStudyResult({
    request,
    observations,
    runtimeSource: 'verified_live',
    providerCallMade: true,
    modelCallMade: true,
    workerJobCreated: providerResult.execution.workerJobCreated,
    analyzer: {
      adapterId: EDIT_REFERENCE_QWEN_COLOR_TREATMENT_ADAPTER_ID,
      adapterVersion: EDIT_REFERENCE_QWEN_COLOR_TREATMENT_ADAPTER_VERSION,
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

export interface BuildEditReferenceAnalyzedColorTreatmentStudyResultInput {
  readonly request: EditReferenceColorTreatmentStudyRequest
  readonly observations: readonly QwenColorTreatmentObservation[]
  readonly runtimeSource: 'verified_local' | 'verified_live'
  readonly providerCallMade: boolean
  readonly modelCallMade: true
  readonly workerJobCreated: boolean
  readonly analyzer: EditReferenceAnalyzedColorTreatmentStudyResult['analyzer']
  readonly provenance: EditReferenceAnalyzedColorTreatmentStudyResult['provenance']
  readonly usage: EditReferenceAnalyzedColorTreatmentStudyResult['usage']
}

export function buildEditReferenceAnalyzedColorTreatmentStudyResult(
  input: BuildEditReferenceAnalyzedColorTreatmentStudyResultInput,
): EditReferenceAnalyzedColorTreatmentStudyResult {
  const { request, observations } = input
  if (observations.some((observation) => DIRECT_COPY_LANGUAGE.test(observation.summary) || EXACT_COLOR_DATA.test(observation.summary))) {
    throw new AdapterError('copy_safety_violation', 'The Color Treatment result retained copy-oriented or exact color data.')
  }
  if (observations.some((observation) => observation.brandColorRelated)
    && (!request.sourceBrandColorContextPresent || request.evidence.rightsAndBrandEvidenceIds.length < 1)) {
    throw new AdapterError('rights_or_brand_evidence_required', 'Brand-color observations require exact rights evidence.')
  }

  const authorizedObservations = observations.filter((observation) => {
    if (observation.category !== 'skin_tone_protection') return true
    return request.sourcePeoplePresent && request.evidence.personPresenceEvidenceIds.length > 0
  })
  const requiredCategories = ALL_CATEGORIES.filter((category) => (
    category !== 'skin_tone_protection' || request.sourcePeoplePresent
  ))
  const coveredCategories = new Set(authorizedObservations.map((observation) => observation.category))
  const missingCategories = requiredCategories.filter((category) => !coveredCategories.has(category))
  if (missingCategories.length > 0) {
    throw new AdapterError(
      'runtime_response_invalid',
      `The Color Treatment result omitted required generalized categories: ${missingCategories.join(', ')}.`,
    )
  }
  const findings = authorizedObservations.map((observation, index) => mapObservation(request, observation, index))
  const averageConfidence = findings.reduce((sum, finding) => sum + finding.confidence, 0) / findings.length
  const result: EditReferenceAnalyzedColorTreatmentStudyResult = {
    schemaVersion: EDIT_REFERENCE_COLOR_TREATMENT_STUDY_RESULT_VERSION,
    requestDigestSha256: computeEditReferenceColorTreatmentStudyRequestDigest(request),
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
    technicalColorResultDigestSha256: request.technicalColorResultDigestSha256,
    consumedFrameEvidenceIds: request.frameSamples.map((sample) => sample.frameEvidenceId),
    evidence: copyEvidence(request),
    technicalColorAuthority: {
      ...request.technicalColorAuthority,
      toolIds: [...request.technicalColorAuthority.toolIds],
    },
    findings,
    coverage: {
      evidenceItemCount: allEvidenceIds(request).length,
      frameCount: request.frameSamples.length,
      representativeFrameCount: request.frameSamples.filter((sample) => sample.role === 'representative').length,
      sceneMatchFrameCount: request.frameSamples.filter((sample) => sample.role === 'scene_match').length,
      technicalSampleCount: request.technicalColorAuthority.sampleCount,
      sourceDurationSeconds: request.sourceDurationSeconds,
      analysisWindowStartSeconds: request.analysisWindowStartSeconds,
      analysisWindowEndSeconds: request.analysisWindowEndSeconds,
      analyzedDurationSeconds: request.analysisWindowEndSeconds - request.analysisWindowStartSeconds,
      evidenceMode: 'frames_and_technical_signal',
      partial: request.technicalColorAuthority.coverage === 'partial',
      missingEvidenceKinds: request.technicalColorAuthority.coverage === 'partial'
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
      technicalColorResultRead: true,
      semanticColorTreatmentModelExecuted: true,
      rawFullMediaRead: false,
      rawHistogramRead: false,
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
      rawHistogramsPersisted: false,
      rawProviderPayloadPersisted: false,
      signedUrlPersisted: false,
      hiddenChainOfThoughtPersisted: false,
      temporaryFramesCleaned: true,
    },
    copySafety: {
      exactPaletteSwatchTransferInstructionCreated: false,
      exactColorValueTransferInstructionCreated: false,
      exactCurveOrControlPointTransferInstructionCreated: false,
      exactGradeSettingTransferInstructionCreated: false,
      exactReferenceLutReconstructed: false,
      unownedReferenceLutTransferInstructionCreated: false,
      exactLookTransformTransferInstructionCreated: false,
      sourceBrandColorAssetCopied: false,
    },
    colorSafety: {
      technicalSignalTreatedAsSemanticIntent: false,
      targetColorSpaceReviewRequired: true,
      targetHdrSdrTransformReviewRequired: true,
      targetShotMatchQaRequired: true,
      targetGeneratedAssetMatchQaRequired: true,
      targetSkinToneReviewRequired: request.sourcePeoplePresent,
      targetBrandColorReviewRequired: request.sourceBrandColorContextPresent,
      finalRenderColorQaRequired: true,
      clippingOrCrushedDetailInstructionCreated: false,
    },
    transferBoundary: {
      findingsMayBecomeTargetInstructionsWithoutApplication: false,
      targetEvidenceRequired: true,
      targetMediaColorAnalysisRequired: true,
      targetInputWorkingOutputColorSpaceReviewRequired: true,
      targetSceneAndShotMatchingRequired: true,
      userApprovalRequired: true,
      ownedLutPassthroughRequiresSeparateTargetAssetApproval: true,
      exactReferenceGradeOrUnownedLutTransferAllowed: false,
    },
  }
  assertEditReferenceColorTreatmentStudyResult(request, result)
  return result
}

function mapObservation(
  request: EditReferenceColorTreatmentStudyRequest,
  observation: QwenColorTreatmentObservation,
  index: number,
): EditReferenceColorTreatmentFinding {
  const frames = observation.frameIds.map((frameId) => requireRequestFrame(request, frameId))
  const evidenceIds = uniqueStrings([
    ...request.evidence.mediaStructureEvidenceIds,
    ...request.evidence.technicalColorSignalEvidenceIds,
    ...request.evidence.visualLanguageEvidenceIds,
    ...request.evidence.studyChatGoalEvidenceIds,
    ...(observation.skinToneRelated ? request.evidence.personPresenceEvidenceIds : []),
    ...(observation.brandColorRelated ? request.evidence.rightsAndBrandEvidenceIds : []),
  ])
  const frameEvidenceIds = frames.map((frame) => frame.frameEvidenceId)
  const minimumTime = Math.min(...frames.map((frame) => frame.sourceTimeSeconds))
  const maximumTime = Math.max(...frames.map((frame) => frame.sourceTimeSeconds))
  const startSeconds = Math.max(request.analysisWindowStartSeconds, minimumTime - 0.25)
  const endSeconds = Math.min(
    request.analysisWindowEndSeconds,
    Math.max(maximumTime + 0.25, startSeconds + 0.001),
  )
  return {
    findingId: `color-treatment-finding-${index + 1}`,
    category: observation.category,
    summary: observation.summary,
    evidenceIds,
    frameEvidenceIds,
    sourceRanges: [{
      rangeId: `color-treatment-range-${index + 1}`,
      startSeconds,
      endSeconds,
      evidenceIds,
      frameEvidenceIds,
      sourceEvidenceOnly: true,
      targetGradeInstructionCreated: false,
      executableColorOperationCreated: false,
    }],
    confidence: observation.confidence,
    transferability: observation.transferability,
    targetAdaptationRequired: true,
    requiresUserReview: observation.requiresUserReview || observation.skinToneRelated || observation.brandColorRelated,
    skinToneRelated: observation.skinToneRelated,
    brandColorRelated: observation.brandColorRelated,
    hdrOrColorManagementRelated: observation.hdrOrColorManagementRelated,
    observedColorCharacterOnly: true,
    generalizedTonalPrincipleOnly: true,
    technicalSignalContextOnly: true,
    exactPaletteSwatchesRetained: false,
    exactColorValuesRetained: false,
    exactCurveOrControlPointsRetained: false,
    exactGradeSettingsRetained: false,
    exactLutIdentityOrDataRetained: false,
    exactLookTransformRetained: false,
    sourceBrandColorAssetCopied: false,
    executableTargetGradeCreated: false,
  }
}

export function hashEditReferenceTechnicalColorEvidence(
  evidence: PreferenceTechnicalColorSignalEvidence,
): string {
  if (evidence.status !== 'verified_local_bounded' || !evidence.technicalDistributionAnalysisRan) {
    throw new Error('Verified bounded technical color evidence is required.')
  }
  return createHash('sha256').update(JSON.stringify(normalizedTechnicalColorEvidence(evidence))).digest('hex')
}

export function hashEditReferenceColorTreatmentFrameManifest(
  frames: readonly EditReferenceColorTreatmentFrameEvidence[],
): string {
  return createHash('sha256').update(JSON.stringify([...frames]
    .sort((left, right) => left.frameEvidenceId.localeCompare(right.frameEvidenceId)))).digest('hex')
}

export function hashEditReferenceColorTreatmentEvidenceManifest(
  request: Pick<EditReferenceColorTreatmentStudyRequest, 'evidence'>,
): string {
  const evidence = request.evidence
  const normalized = Object.fromEntries(Object.entries(evidence)
    .map(([key, values]) => [key, [...values].sort()]))
  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex')
}

export function assertExactTechnicalColorEvidence(
  request: EditReferenceColorTreatmentStudyRequest,
  evidence: PreferenceTechnicalColorSignalEvidence,
): void {
  const digest = hashEditReferenceTechnicalColorEvidence(evidence)
  if (
    digest !== request.technicalColorResultDigestSha256
    || digest !== request.technicalColorAuthority.resultDigestSha256
    || evidence.schemaVersion !== request.technicalColorAuthority.schemaVersion
    || evidence.status !== request.technicalColorAuthority.status
    || evidence.coverage !== request.technicalColorAuthority.coverage
    || evidence.sampleCount !== request.technicalColorAuthority.sampleCount
    || evidence.scannedDurationSeconds !== request.technicalColorAuthority.scannedDurationSeconds
    || evidence.colorRangeViolationScanRan !== request.technicalColorAuthority.colorRangeViolationScanRan
  ) throw new AdapterError('technical_color_authority_unverified', 'The technical-color evidence did not match the exact request authority.')
}

function toQwenTechnicalColorContext(
  evidence: PreferenceTechnicalColorSignalEvidence,
  resultDigestSha256: string,
): QwenTechnicalColorContext {
  const normalized = normalizedTechnicalColorEvidence(evidence)
  return {
    schemaVersion: 'edit-reference-technical-color-context-v1',
    resultDigestSha256,
    coverage: evidence.coverage as 'full' | 'partial',
    sampleCount: evidence.sampleCount,
    scannedDurationSeconds: evidence.scannedDurationSeconds,
    ...copyDefined(normalized, [
      'pixelFormat', 'colorSpace', 'colorTransfer', 'colorPrimaries', 'colorRange',
      'lumaAverage8Bit', 'lumaObservedMinimum8Bit', 'lumaObservedMaximum8Bit',
      'lumaRobustRangeAverage8Bit', 'saturationAverage8Bit',
      'saturationRobustRangeAverage8Bit', 'chromaUAverage8Bit', 'chromaVAverage8Bit',
      'temporalLumaDifferenceAverage8Bit', 'temporalChromaDifferenceAverage8Bit',
      'outOfRangePixelRatioAverage',
    ]),
    hdrTransfer: evidence.hdrTransfer,
    technicalDistributionAnalysisRan: true,
    semanticColorAnalysisRan: false,
    whiteBalanceInferenceRan: false,
    temperatureInferenceRan: false,
    skinToneAnalysisRan: false,
    shotMatchAnalysisRan: false,
    lutReconstructionRan: false,
  }
}

function normalizedTechnicalColorEvidence(
  evidence: PreferenceTechnicalColorSignalEvidence,
): Record<string, unknown> {
  return Object.fromEntries(Object.entries({
    schemaVersion: evidence.schemaVersion,
    status: evidence.status,
    maxSampleCount: evidence.maxSampleCount,
    sampleCount: evidence.sampleCount,
    sampleTimesSeconds: [...evidence.sampleTimesSeconds],
    sampleIntervalSeconds: evidence.sampleIntervalSeconds,
    scannedDurationSeconds: evidence.scannedDurationSeconds,
    coverage: evidence.coverage,
    pixelFormat: evidence.pixelFormat,
    colorSpace: evidence.colorSpace,
    colorTransfer: evidence.colorTransfer,
    colorPrimaries: evidence.colorPrimaries,
    colorRange: evidence.colorRange,
    hdrTransfer: evidence.hdrTransfer,
    lumaAverage8Bit: evidence.lumaAverage8Bit,
    lumaObservedMinimum8Bit: evidence.lumaObservedMinimum8Bit,
    lumaObservedMaximum8Bit: evidence.lumaObservedMaximum8Bit,
    lumaAverageSpread8Bit: evidence.lumaAverageSpread8Bit,
    lumaLowAverage8Bit: evidence.lumaLowAverage8Bit,
    lumaHighAverage8Bit: evidence.lumaHighAverage8Bit,
    lumaRobustRangeAverage8Bit: evidence.lumaRobustRangeAverage8Bit,
    lumaRobustRangeSpread8Bit: evidence.lumaRobustRangeSpread8Bit,
    saturationAverage8Bit: evidence.saturationAverage8Bit,
    saturationAverageSpread8Bit: evidence.saturationAverageSpread8Bit,
    saturationLowAverage8Bit: evidence.saturationLowAverage8Bit,
    saturationHighAverage8Bit: evidence.saturationHighAverage8Bit,
    saturationRobustRangeAverage8Bit: evidence.saturationRobustRangeAverage8Bit,
    chromaUAverage8Bit: evidence.chromaUAverage8Bit,
    chromaUAverageSpread8Bit: evidence.chromaUAverageSpread8Bit,
    chromaVAverage8Bit: evidence.chromaVAverage8Bit,
    chromaVAverageSpread8Bit: evidence.chromaVAverageSpread8Bit,
    temporalLumaDifferenceAverage8Bit: evidence.temporalLumaDifferenceAverage8Bit,
    temporalChromaDifferenceAverage8Bit: evidence.temporalChromaDifferenceAverage8Bit,
    outOfRangePixelRatioAverage: evidence.outOfRangePixelRatioAverage,
    outOfRangePixelRatioMaximum: evidence.outOfRangePixelRatioMaximum,
    technicalDistributionAnalysisRan: evidence.technicalDistributionAnalysisRan,
    colorRangeViolationScanRan: evidence.colorRangeViolationScanRan,
    semanticColorAnalysisRan: evidence.semanticColorAnalysisRan,
    whiteBalanceInferenceRan: evidence.whiteBalanceInferenceRan,
    temperatureInferenceRan: evidence.temperatureInferenceRan,
    skinToneAnalysisRan: evidence.skinToneAnalysisRan,
    shotMatchAnalysisRan: evidence.shotMatchAnalysisRan,
    lutReconstructionRan: evidence.lutReconstructionRan,
    rawFramePixelsPersisted: evidence.rawFramePixelsPersisted,
    rawHistogramPersisted: evidence.rawHistogramPersisted,
    rawProcessOutputPersisted: evidence.rawProcessOutputPersisted,
  }).filter(([, value]) => value !== undefined))
}

async function resolveExactPrivateFrames(
  options: EditReferenceQwenColorTreatmentAdapterOptions,
  request: EditReferenceColorTreatmentStudyRequest,
  resolvedFrames: EditReferenceResolvedColorFrame[],
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
  request: EditReferenceColorTreatmentStudyRequest,
  frames: readonly EditReferenceResolvedColorFrame[],
): Promise<void> {
  for (const sample of request.frameSamples) {
    const frame = requireResolvedFrame(frames, sample.privateFrameArtifactId)
    const handle = await open(frame.localFilePath, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW)
    try {
      const stat = await handle.stat()
      if (!stat.isFile() || stat.size < 1 || stat.size > 2 * 1024 * 1024) {
        throw new AdapterError('frame_authority_unverified', 'A private Color Treatment frame is empty or exceeds 2 MiB.')
      }
      const bytes = await handle.readFile()
      const checksum = createHash('sha256').update(bytes).digest('hex')
      if (checksum !== sample.frameChecksumSha256) {
        throw new AdapterError('frame_authority_unverified', 'A private Color Treatment frame failed checksum verification.')
      }
      const dimensions = readJpegDimensions(bytes)
      if (dimensions.width !== sample.width || dimensions.height !== sample.height) {
        throw new AdapterError('frame_authority_unverified', 'A private Color Treatment frame failed exact dimension verification.')
      }
    } finally {
      await handle.close()
    }
  }
}

function readJpegDimensions(bytes: Buffer): { width: number; height: number } {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new AdapterError('frame_authority_unverified', 'A private Color Treatment frame is not a valid JPEG.')
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
  throw new AdapterError('frame_authority_unverified', 'A private Color Treatment JPEG lacks exact dimensions.')
}

async function privateFramesAreAbsent(frames: readonly EditReferenceResolvedColorFrame[]): Promise<boolean> {
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
  frames: readonly EditReferenceResolvedColorFrame[],
  artifactId: string,
): EditReferenceResolvedColorFrame {
  const frame = frames.find((candidate) => candidate.privateFrameArtifactId === artifactId)
  if (!frame) throw new AdapterError('frame_authority_unverified', 'A private Color Treatment frame could not be resolved.')
  return frame
}

function requireRequestFrame(
  request: EditReferenceColorTreatmentStudyRequest,
  privateFrameArtifactId: string,
): EditReferenceColorTreatmentFrameEvidence {
  const frame = request.frameSamples.find((candidate) => candidate.privateFrameArtifactId === privateFrameArtifactId)
  if (!frame) throw new AdapterError('runtime_response_invalid', 'Color Treatment output cited an unknown private frame.')
  return frame
}

function blockedExecution(
  result: QwenVisualUnderstandingResult | undefined,
  boundedPrivateFramesRead: boolean,
  technicalColorResultRead: boolean,
): NonNullable<PendingBlockedResult['execution']> {
  return {
    boundedPrivateFramesRead,
    technicalColorResultRead,
    providerCallMade: result?.execution.providerCallMade ?? false,
    modelCallMade: result?.execution.modelCallMade ?? false,
    workerJobCreated: result?.execution.workerJobCreated ?? false,
  }
}

function meteredUsage(
  receipt: EditReferenceColorTreatmentUsageReceipt,
): NonNullable<PendingBlockedResult['usage']> {
  return {
    internalCostStatus: 'metered',
    meteredInternalCostMicros: receipt.meteredInternalCostMicros,
    usageEventIds: receipt.usageEventIds,
    internalCostRecordIds: receipt.internalCostRecordIds,
  }
}

function assertUsageAuthorization(value: EditReferenceColorTreatmentUsageAuthorization): void {
  assertIdList(value.usageEventIds, 'Color Treatment usage authorization IDs are invalid.')
  assertIdList(value.internalCostRecordIds, 'Color Treatment internal-cost authorization IDs are invalid.')
}

function assertUsageReceipt(
  request: EditReferenceColorTreatmentStudyRequest,
  authorization: EditReferenceColorTreatmentUsageAuthorization,
  receipt: EditReferenceColorTreatmentUsageReceipt,
  completed: boolean,
): void {
  assertUsageAuthorization(receipt)
  if (!MONEY_MICROS.test(receipt.meteredInternalCostMicros)) throw new Error('Color Treatment metered cost is invalid.')
  if (!sameStrings(receipt.usageEventIds, authorization.usageEventIds)
    || !sameStrings(receipt.internalCostRecordIds, authorization.internalCostRecordIds)) {
    throw new Error('Color Treatment cost receipt does not match its authorization.')
  }
  if (BigInt(receipt.meteredInternalCostMicros) > BigInt(request.maximumAuthorizedInternalCostMicros as string)) {
    throw new Error('Color Treatment metered cost exceeded its authorization.')
  }
  if (completed && receipt.meteredInternalCostMicros === '0') {
    throw new Error('Completed private Color Treatment execution cannot claim zero internal cost.')
  }
}

function assertIdList(values: readonly string[], message: string): void {
  if (!Array.isArray(values) || values.length < 1 || values.length > 64
    || new Set(values).size !== values.length
    || values.some((value) => !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value))) throw new Error(message)
}

function mapProviderBlocker(blockers: readonly string[]): EditReferenceColorTreatmentStudyBlockerCode {
  if (blockers.some((blocker) => blocker.includes('color_context'))) return 'technical_color_authority_unverified'
  if (blockers.some((blocker) => blocker.includes('frame'))) return 'frame_authority_unverified'
  if (blockers.some((blocker) => blocker.includes('model_policy'))) return 'model_routing_unavailable'
  if (blockers.some((blocker) => blocker.includes('unsafe'))) return 'privacy_policy_denied'
  return 'runtime_response_invalid'
}

function safeProviderBlockerMessage(result: QwenVisualUnderstandingResult): string {
  const code = result.blockers[0] ?? 'private_color_runtime_blocked'
  return `The private Color Treatment runtime blocked this attempt (${normalizeContractId(code)}).`
}

function classifyAdapterError(error: unknown): EditReferenceColorTreatmentStudyBlockerCode {
  return error instanceof AdapterError ? error.code : 'runtime_response_invalid'
}

function safeAdapterError(error: unknown): string {
  if (error instanceof AdapterError) return error.message
  return 'The bounded Color Treatment adapter rejected an invalid private input or runtime response.'
}

function copyEvidence(request: EditReferenceColorTreatmentStudyRequest): EditReferenceColorTreatmentStudyRequest['evidence'] {
  return Object.fromEntries(Object.entries(request.evidence).map(([key, values]) => [key, [...values]])) as unknown as EditReferenceColorTreatmentStudyRequest['evidence']
}

function allEvidenceIds(request: EditReferenceColorTreatmentStudyRequest): string[] {
  return Object.values(request.evidence).flat()
}

function copyDefined<T extends Record<string, unknown>>(
  value: T,
  keys: readonly string[],
): Record<string, unknown> {
  return Object.fromEntries(keys.flatMap((key) => value[key] === undefined ? [] : [[key, value[key]]]))
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

function now(options: EditReferenceQwenColorTreatmentAdapterOptions): string {
  return options.now?.() ?? new Date().toISOString()
}

class AdapterError extends Error {
  readonly code: EditReferenceColorTreatmentStudyBlockerCode

  constructor(
    code: EditReferenceColorTreatmentStudyBlockerCode,
    message: string,
  ) {
    super(message)
    this.name = 'EditReferenceColorTreatmentAdapterError'
    this.code = code
  }
}
