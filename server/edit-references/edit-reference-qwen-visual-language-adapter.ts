import { createHash, randomUUID } from 'node:crypto'
import { constants as fsConstants } from 'node:fs'
import { lstat, open, realpath } from 'node:fs/promises'
import path from 'node:path'
import type {
  QwenVisualLanguageObservation,
  QwenVisualUnderstandingProvider,
  QwenVisualUnderstandingResult,
} from '../services/qwen-visual-understanding-provider'
import {
  QWEN_VISUAL_UNDERSTANDING_RETIREMENT,
} from '../services/qwen-visual-understanding-provider'
import {
  EDIT_REFERENCE_VISUAL_LANGUAGE_STUDY_RESULT_VERSION,
  createBlockedEditReferenceVisualLanguageStudyResult,
  hashEditReferenceVisualLanguageStudyRequest,
  validateEditReferenceVisualLanguageStudyRequest,
  validateEditReferenceVisualLanguageStudyResult,
  type EditReferenceAnalyzedVisualLanguageStudyResult,
  type EditReferenceVisualFrameEvidence,
  type EditReferenceVisualLanguageFinding,
  type EditReferenceVisualLanguageFindingCategory,
  type EditReferenceVisualLanguageStudyAdapter,
  type EditReferenceVisualLanguageStudyRequest,
  type EditReferenceVisualLanguageStudyResult,
} from './edit-reference-visual-language-study-contract'

export const EDIT_REFERENCE_QWEN_VISUAL_LANGUAGE_ADAPTER_ID =
  'edit_reference_qwen_visual_language_adapter' as const
export const EDIT_REFERENCE_QWEN_VISUAL_LANGUAGE_ADAPTER_VERSION = 'v1' as const

export interface EditReferenceResolvedPrivateFrame {
  readonly privateFrameArtifactId: string
  readonly localFilePath: string
}

export interface EditReferenceVisualLanguageUsageAuthorization {
  readonly usageEventIds: readonly string[]
  readonly internalCostRecordIds: readonly string[]
}

export interface EditReferenceVisualLanguageUsageReceipt
  extends EditReferenceVisualLanguageUsageAuthorization {
  readonly meteredInternalCostMicros: string
}

export interface EditReferenceVisualLanguageProductionUsageAuthority {
  authorize(
    request: EditReferenceVisualLanguageStudyRequest,
  ): Promise<EditReferenceVisualLanguageUsageAuthorization>
  reconcile(input: {
    readonly request: EditReferenceVisualLanguageStudyRequest
    readonly providerResult: QwenVisualUnderstandingResult
    readonly authorization: EditReferenceVisualLanguageUsageAuthorization
  }): Promise<EditReferenceVisualLanguageUsageReceipt>
}

export interface EditReferenceQwenVisualLanguageAdapterOptions {
  readonly provider: QwenVisualUnderstandingProvider
  readonly privateFrameRoot: string
  readonly resolvePrivateFrame: (
    sample: EditReferenceVisualFrameEvidence,
  ) => Promise<EditReferenceResolvedPrivateFrame>
  readonly cleanupPrivateFrames: (
    frames: readonly EditReferenceResolvedPrivateFrame[],
  ) => Promise<void>
  readonly productionUsageAuthority?: EditReferenceVisualLanguageProductionUsageAuthority
  readonly now?: () => string
  readonly createExecutionId?: () => string
}

interface PendingBlockedResult {
  readonly kind: 'blocked'
  readonly blockerCode: Parameters<typeof createBlockedEditReferenceVisualLanguageStudyResult>[0]['blockerCode']
  readonly blockerMessage: string
  readonly retryAvailable: boolean
  readonly retryReason?: string
  readonly execution?: Omit<
    NonNullable<Parameters<typeof createBlockedEditReferenceVisualLanguageStudyResult>[0]['execution']>,
    'temporaryFramesCleaned'
  >
  readonly usage?: NonNullable<Parameters<typeof createBlockedEditReferenceVisualLanguageStudyResult>[0]['usage']>
}

interface PendingAnalyzedResult {
  readonly kind: 'analyzed'
  readonly providerResult: QwenVisualUnderstandingResult
  readonly usageReceipt: EditReferenceVisualLanguageUsageReceipt
}

type PendingAdapterResult = PendingBlockedResult | PendingAnalyzedResult

const ALL_CATEGORIES: readonly EditReferenceVisualLanguageFindingCategory[] = [
  'composition_hierarchy',
  'framing_and_shot_scale',
  'subject_placement',
  'camera_behavior',
  'scene_rhythm',
  'visual_density',
  'broll_pattern',
  'transition_language',
  'caption_visible_text_and_overlay',
  'graphic_overlay_language',
  'color_contrast_and_lighting',
  'visual_storytelling',
]
const DIRECT_COPY_LANGUAGE = /\b(?:copy|replicate|recreate|verbatim|word[- ]for[- ]word|same exact|match exactly|retain exact|preserve exact)\b/i
const SHA256 = /^[a-f0-9]{64}$/
const MONEY_MICROS = /^(?:0|[1-9][0-9]{0,15})$/

export function createEditReferenceQwenVisualLanguageAdapter(
  options: EditReferenceQwenVisualLanguageAdapterOptions,
): EditReferenceVisualLanguageStudyAdapter {
  if (!QWEN_VISUAL_UNDERSTANDING_RETIREMENT.freshExecutionAllowed) {
    throw new Error(
      'edit_reference_qwen_visual_language_adapter_retired_use_visual_intelligence',
    )
  }
  return {
    adapterId: EDIT_REFERENCE_QWEN_VISUAL_LANGUAGE_ADAPTER_ID,
    adapterVersion: EDIT_REFERENCE_QWEN_VISUAL_LANGUAGE_ADAPTER_VERSION,
    async analyze(request): Promise<EditReferenceVisualLanguageStudyResult> {
      validateEditReferenceVisualLanguageStudyRequest(request)
      const startedAt = now(options)
      const executionId = options.createExecutionId?.()
        ?? `edit-reference-visual-language-${randomUUID()}`
      const resolvedFrames: EditReferenceResolvedPrivateFrame[] = []
      let boundedPrivateFramesRead = false
      let providerResult: QwenVisualUnderstandingResult | undefined
      let authorization: EditReferenceVisualLanguageUsageAuthorization | undefined
      let usageReceipt: EditReferenceVisualLanguageUsageReceipt | undefined
      let pendingResult: PendingAdapterResult | undefined

      try {
        await resolveExactPrivateFrames(options, request, resolvedFrames)

        if (request.executionScope !== 'production') {
          pendingResult = {
            kind: 'blocked',
            blockerCode: 'cost_authority_unavailable',
            blockerMessage: 'The shared Qwen visual runtime is a paid private provider path and cannot run under the unmetered controlled-test scope.',
            retryAvailable: true,
            retryReason: 'Retry through an approved production estimate, internal-cost budget, immutable rate-card snapshot, and usage recorder.',
          }
        } else if (!options.productionUsageAuthority) {
          pendingResult = {
            kind: 'blocked',
            blockerCode: 'cost_authority_unavailable',
            blockerMessage: 'The canonical internal-cost usage authority is unavailable, so no private visual provider call was made.',
            retryAvailable: true,
            retryReason: 'Restore the approved production estimate, budget, rate-card, and attempt-level usage authority, then retry.',
          }
        } else {
          try {
            authorization = await options.productionUsageAuthority.authorize(request)
            assertUsageAuthorization(authorization)
          } catch {
            pendingResult = {
              kind: 'blocked',
              blockerCode: 'cost_authority_unavailable',
              blockerMessage: 'The canonical internal-cost authority did not authorize this exact Visual Language request.',
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
                blockerMessage: 'The private visual attempt completed, but its canonical internal-cost usage could not be reconciled.',
                retryAvailable: false,
                execution: blockedExecution(providerResult, boundedPrivateFramesRead),
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
                    retryReason: 'Retry after the reviewed private visual runtime or its strict response contract is restored.',
                    execution: blockedExecution(providerResult, boundedPrivateFramesRead),
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
          retryReason: 'Restore the exact private-frame manifest and reviewed visual runtime, then retry.',
          execution: blockedExecution(providerResult, boundedPrivateFramesRead),
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
        return createBlockedEditReferenceVisualLanguageStudyResult({
          request,
          blockerCode: 'ephemeral_cleanup_failed',
          blockerMessage: 'Ephemeral visual frames could not be proven deleted after the bounded study attempt.',
          retryAvailable: false,
          execution: {
            ...blockedExecution(providerResult, boundedPrivateFramesRead),
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
        return createBlockedEditReferenceVisualLanguageStudyResult({
          request,
          blockerCode: 'adapter_unavailable',
          blockerMessage: 'The bounded Visual Language adapter ended without a structured result.',
          retryAvailable: true,
          retryReason: 'Retry after restoring the reviewed adapter state machine.',
          execution: { temporaryFramesCleaned: true },
        })
      }

      if (pendingResult.kind === 'blocked') {
        return createBlockedEditReferenceVisualLanguageStudyResult({
          request,
          blockerCode: pendingResult.blockerCode,
          blockerMessage: pendingResult.blockerMessage,
          retryAvailable: pendingResult.retryAvailable,
          retryReason: pendingResult.retryReason,
          execution: {
            ...pendingResult.execution,
            temporaryFramesCleaned: true,
          },
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
        return createBlockedEditReferenceVisualLanguageStudyResult({
          request,
          blockerCode: classifyAdapterError(error),
          blockerMessage: safeAdapterError(error),
          retryAvailable: false,
          execution: {
            ...blockedExecution(pendingResult.providerResult, boundedPrivateFramesRead),
            temporaryFramesCleaned: true,
          },
          usage: meteredUsage(pendingResult.usageReceipt),
        })
      }
    },
  }
}

function buildAnalyzedResult(input: {
  readonly request: EditReferenceVisualLanguageStudyRequest
  readonly providerResult: QwenVisualUnderstandingResult
  readonly usageReceipt: EditReferenceVisualLanguageUsageReceipt
  readonly executionId: string
  readonly startedAt: string
  readonly completedAt: string
}): EditReferenceAnalyzedVisualLanguageStudyResult {
  const { request, providerResult } = input
  const provenance = providerResult.runtimeProvenance
  if (!provenance || provenance.runtimeSource !== 'verified_live') {
    throw new AdapterError('model_routing_unavailable', 'The visual result lacks reviewed live runtime provenance.')
  }
  if (!providerResult.transferSafety) {
    throw new AdapterError('runtime_response_invalid', 'The visual result omitted the strict no-copy transfer-safety record.')
  }
  if (providerResult.visualLanguageObservations.length < 1) {
    throw new AdapterError('runtime_response_invalid', 'The visual result omitted structured Visual Language observations.')
  }
  if (!providerResult.execution.providerCallMade || !providerResult.execution.modelCallMade) {
    throw new AdapterError('runtime_response_invalid', 'The visual result cannot prove provider and model execution.')
  }
  if (providerResult.visualLanguageObservations.some((observation) => DIRECT_COPY_LANGUAGE.test(observation.summary))) {
    throw new AdapterError('copy_safety_violation', 'The visual result contained copy-oriented language and was rejected.')
  }
  if (
    providerResult.visualLanguageObservations.some((observation) => observation.identityRelated)
    && (!request.realPersonOrClaimContextPresent || request.evidence.factSafetyEvidenceIds.length < 1)
  ) {
    throw new AdapterError('fact_safety_evidence_required', 'Identity-related observations require exact fact-safety evidence.')
  }

  const missingEvidenceKinds = new Set<EditReferenceVisualLanguageFindingCategory>()
  const findings = providerResult.visualLanguageObservations.flatMap((observation, index) => {
    if (
      observation.category === 'caption_visible_text_and_overlay'
      && request.visibleTextEvidenceMode === 'not_requested'
    ) {
      missingEvidenceKinds.add('caption_visible_text_and_overlay')
      return []
    }
    return [mapObservation(request, observation, index)]
  })
  if (findings.length < 1) {
    throw new AdapterError('ocr_evidence_required', 'No authorized Visual Language finding remained after visible-text evidence enforcement.')
  }
  const coveredCategories = new Set(findings.map((finding) => finding.category))
  for (const category of ALL_CATEGORIES) {
    if (!coveredCategories.has(category)) missingEvidenceKinds.add(category)
  }
  const missing = [...missingEvidenceKinds]
  const averageConfidence = findings.reduce((sum, finding) => sum + finding.confidence, 0) / findings.length
  const result: EditReferenceAnalyzedVisualLanguageStudyResult = {
    schemaVersion: EDIT_REFERENCE_VISUAL_LANGUAGE_STUDY_RESULT_VERSION,
    requestDigestSha256: hashEditReferenceVisualLanguageStudyRequest(request),
    status: 'analyzed',
    runtimeSource: 'verified_live',
    workspaceId: request.workspaceId,
    editReferenceId: request.editReferenceId,
    studySessionId: request.studySessionId,
    orchestrationId: request.orchestrationId,
    privateMediaArtifactId: request.privateMediaArtifactId,
    mediaChecksumSha256: request.mediaChecksumSha256,
    evidenceManifestDigestSha256: request.evidenceManifestDigestSha256,
    frameManifestDigestSha256: request.frameManifestDigestSha256,
    consumedFrameEvidenceIds: request.frameSamples.map((sample) => sample.frameEvidenceId),
    evidence: copyEvidence(request),
    findings,
    coverage: {
      evidenceItemCount: request.frameSamples.length + evidenceIds(request).length,
      representativeFrameCount: request.frameSamples.filter((sample) => sample.role === 'representative').length,
      keyframeCount: request.frameSamples.filter((sample) => sample.role === 'keyframe').length,
      visibleTextEvidenceMode: request.visibleTextEvidenceMode,
      realPersonOrClaimContextPresent: request.realPersonOrClaimContextPresent,
      partial: missing.length > 0,
      missingEvidenceKinds: missing,
    },
    summary: {
      findingCount: findings.length,
      transferablePrincipleCount: findings.filter((finding) => finding.transferability === 'transferable_principle').length,
      contextOnlyCount: findings.filter((finding) => finding.transferability === 'context_only').length,
      nonTransferableCount: findings.filter((finding) => finding.transferability === 'non_transferable').length,
      averageConfidence,
    },
    execution: {
      boundedPrivateFramesRead: true,
      semanticVisualModelExecuted: true,
      fullMediaRead: false,
      rawFramesPersisted: false,
      externalUrlFetched: false,
      providerCallMade: true,
      modelCallMade: true,
      workerJobCreated: providerResult.execution.workerJobCreated,
      temporaryFramesCleaned: true,
      remoteMutationMade: false,
    },
    model: {
      adapterId: EDIT_REFERENCE_QWEN_VISUAL_LANGUAGE_ADAPTER_ID,
      adapterVersion: EDIT_REFERENCE_QWEN_VISUAL_LANGUAGE_ADAPTER_VERSION,
      providerId: provenance.providerId,
      modelId: normalizeContractId(provenance.modelId),
      modelRevision: provenance.modelRevision,
      modelAggregateSha256: provenance.modelAggregateSha256,
      modelRoutingPolicyVersion: provenance.modelRoutingPolicyVersion,
      visualInstructionDigestSha256: provenance.visualInstructionDigestSha256,
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
    privacy: {
      rawFullMediaPersisted: false,
      rawFramesPersisted: false,
      rawProviderPayloadPersisted: false,
      signedUrlPersisted: false,
      hiddenChainOfThoughtPersisted: false,
      temporaryFramesCleaned: true,
    },
    copySafety: {
      exactReferenceLayoutRetained: false,
      exactFrameCompositionCopyInstructionCreated: false,
      exactVisibleTextRetained: false,
      exactTransitionOrCameraPathCopyInstructionCreated: false,
      creatorIdentityTransferInstructionCreated: false,
      copyrightedAssetTransferInstructionCreated: false,
    },
    factSafety: {
      evidenceRequired: request.realPersonOrClaimContextPresent,
      evidenceIds: [...request.evidence.factSafetyEvidenceIds],
      unverifiedClaimPresentedAsFact: false,
      misleadingRealPersonDepictionInstructionCreated: false,
      guiltImplyingVisualInstructionCreated: false,
    },
    transferBoundary: {
      technicalChangePointsTreatedAsSemanticScenes: false,
      technicalSignalsTreatedAsCreativeMeaning: false,
      findingsMayBecomeTargetInstructionsWithoutApplication: false,
      targetEvidenceRequired: true,
      userApprovalRequired: true,
      exactLayoutOrCameraPathTransferAllowed: false,
      visualIdentityTransferAllowed: false,
      visibleTextTransferAllowed: false,
    },
  }
  validateEditReferenceVisualLanguageStudyResult(request, result)
  return result
}

function mapObservation(
  request: EditReferenceVisualLanguageStudyRequest,
  observation: QwenVisualLanguageObservation,
  index: number,
): EditReferenceVisualLanguageFinding {
  const frameMap = new Map(request.frameSamples.map((sample) => [sample.privateFrameArtifactId, sample.frameEvidenceId]))
  const frameEvidenceIds = observation.frameIds.map((frameId) => {
    const evidenceId = frameMap.get(frameId)
    if (!evidenceId) throw new AdapterError('runtime_response_invalid', 'A visual observation referenced a frame outside the exact request.')
    return evidenceId
  })
  const supportingEvidenceIds = categoryEvidenceIds(request, observation.category)
  const identityEvidenceIds = observation.identityRelated ? request.evidence.factSafetyEvidenceIds : []
  const evidence = unique([...frameEvidenceIds, ...supportingEvidenceIds, ...identityEvidenceIds])
  const caption = observation.category === 'caption_visible_text_and_overlay'
  const transferability = observation.identityRelated
    ? 'non_transferable'
    : caption
      ? 'context_only'
      : 'transferable_principle'
  const visibleTextInterpretation = caption
    ? requireAuthorizedVisibleTextMode(request.visibleTextEvidenceMode)
    : 'not_applicable'
  return {
    findingId: `visual-${String(index + 1).padStart(2, '0')}-${observation.category}`,
    category: observation.category,
    summary: observation.summary,
    evidenceIds: evidence,
    confidence: observation.confidence,
    transferability,
    targetAdaptationRequired: true,
    requiresUserReview: observation.requiresUserReview || observation.identityRelated || caption,
    identityRelated: observation.identityRelated,
    factSafetyStatus: observation.identityRelated ? 'bounded_by_evidence' : 'not_applicable',
    visibleTextInterpretation,
    exactReferenceLayoutRetained: false,
    exactFrameCompositionInstructionCreated: false,
    exactVisibleTextRetained: false,
    exactTransitionOrCameraPathInstructionCreated: false,
    identityTransferInstructionCreated: false,
    copyrightedAssetTransferInstructionCreated: false,
  }
}

function requireAuthorizedVisibleTextMode(
  value: EditReferenceVisualLanguageStudyRequest['visibleTextEvidenceMode'],
): 'geometry_only' | 'ocr_backed' {
  if (value === 'not_requested') {
    throw new AdapterError('ocr_evidence_required', 'Caption observations require approved geometry or OCR evidence.')
  }
  return value
}

function categoryEvidenceIds(
  request: EditReferenceVisualLanguageStudyRequest,
  category: EditReferenceVisualLanguageFindingCategory,
): readonly string[] {
  switch (category) {
    case 'caption_visible_text_and_overlay':
      return request.visibleTextEvidenceMode === 'ocr_backed'
        ? request.evidence.ocrEvidenceIds
        : request.evidence.captionGeometryEvidenceIds
    case 'color_contrast_and_lighting':
      return request.evidence.technicalColorEvidenceIds
    case 'camera_behavior':
    case 'scene_rhythm':
    case 'transition_language':
      return request.evidence.technicalChangePointEvidenceIds
    case 'visual_density':
      return request.evidence.technicalSourceConditionEvidenceIds
    case 'broll_pattern':
    case 'visual_storytelling':
      return [...request.evidence.mediaStructureEvidenceIds, ...request.evidence.studyChatGoalEvidenceIds]
    default:
      return request.evidence.mediaStructureEvidenceIds
  }
}

async function resolveExactPrivateFrames(
  options: EditReferenceQwenVisualLanguageAdapterOptions,
  request: EditReferenceVisualLanguageStudyRequest,
  resolved: EditReferenceResolvedPrivateFrame[],
): Promise<void> {
  const configuredRoot = path.resolve(options.privateFrameRoot)
  const rootStat = await lstat(configuredRoot)
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
    throw new AdapterError('frame_authority_unverified', 'The approved ephemeral frame root is not a regular directory.')
  }
  const root = await realpath(configuredRoot)
  for (const sample of request.frameSamples) {
    const frame = await options.resolvePrivateFrame(sample)
    if (frame.privateFrameArtifactId !== sample.privateFrameArtifactId) {
      throw new AdapterError('frame_authority_unverified', 'Resolved frame identity does not match the exact private frame manifest.')
    }
    const configuredLocalPath = path.resolve(frame.localFilePath)
    const stat = await lstat(configuredLocalPath)
    if (!stat.isFile() || stat.isSymbolicLink()) {
      throw new AdapterError('frame_authority_unverified', 'Resolved private frame is not a regular unlinked file.')
    }
    const localPath = await realpath(configuredLocalPath)
    const relative = path.relative(root, localPath)
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new AdapterError('frame_authority_unverified', 'Resolved private frame is outside the approved ephemeral root.')
    }
    if (resolved.some((candidate) => candidate.localFilePath === localPath)) {
      throw new AdapterError('frame_authority_unverified', 'Private frame paths must be unique.')
    }
    resolved.push({ privateFrameArtifactId: frame.privateFrameArtifactId, localFilePath: localPath })
  }
}

async function verifyExactFrameBytes(
  request: EditReferenceVisualLanguageStudyRequest,
  frames: readonly EditReferenceResolvedPrivateFrame[],
): Promise<void> {
  for (const sample of request.frameSamples) {
    const frame = requireResolvedFrame(frames, sample.privateFrameArtifactId)
    const handle = await open(frame.localFilePath, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW)
    try {
      const stat = await handle.stat()
      if (!stat.isFile() || stat.size < 1 || stat.size > 2 * 1024 * 1024) {
        throw new AdapterError('frame_authority_unverified', 'A private visual frame is empty or exceeds the approved 2 MiB bound.')
      }
      const bytes = await handle.readFile()
      const digest = createHash('sha256').update(bytes).digest('hex')
      if (digest !== sample.frameChecksumSha256) {
        throw new AdapterError('frame_authority_unverified', 'A private visual frame checksum does not match the exact manifest.')
      }
    } finally {
      await handle.close()
    }
  }
}

async function privateFramesAreAbsent(frames: readonly EditReferenceResolvedPrivateFrame[]): Promise<boolean> {
  for (const frame of frames) {
    try {
      await lstat(frame.localFilePath)
      return false
    } catch (error) {
      if (!isMissingFileError(error)) return false
    }
  }
  return true
}

function blockedExecution(
  providerResult: QwenVisualUnderstandingResult | undefined,
  boundedPrivateFramesRead: boolean,
): Omit<
  NonNullable<Parameters<typeof createBlockedEditReferenceVisualLanguageStudyResult>[0]['execution']>,
  'temporaryFramesCleaned'
> {
  return {
    boundedPrivateFramesRead,
    providerCallMade: providerResult?.execution.providerCallMade ?? false,
    modelCallMade: providerResult?.execution.modelCallMade ?? false,
    workerJobCreated: providerResult?.execution.workerJobCreated ?? false,
  }
}

function mapProviderBlocker(blockers: readonly string[]): Parameters<typeof createBlockedEditReferenceVisualLanguageStudyResult>[0]['blockerCode'] {
  if (blockers.some((code) => code.includes('model_policy'))) return 'model_routing_unavailable'
  if (blockers.some((code) => code.includes('unsafe'))) return 'privacy_policy_denied'
  if (blockers.some((code) => code.includes('frame'))) return 'frame_authority_unverified'
  if (blockers.some((code) => code.includes('invalid_response') || code.includes('incomplete'))) return 'runtime_response_invalid'
  return 'adapter_unavailable'
}

function classifyAdapterError(error: unknown): Parameters<typeof createBlockedEditReferenceVisualLanguageStudyResult>[0]['blockerCode'] {
  return error instanceof AdapterError ? error.blockerCode : 'adapter_unavailable'
}

function safeAdapterError(error: unknown): string {
  return error instanceof AdapterError
    ? error.message
    : 'The bounded Visual Language adapter failed without exposing private runtime details.'
}

function safeProviderBlockerMessage(result: QwenVisualUnderstandingResult): string {
  const code = result.blockers[0] ?? 'qwen_visual_runtime_blocked'
  return `The reviewed private visual runtime blocked this request (${code.slice(0, 160)}).`
}

function assertUsageAuthorization(value: EditReferenceVisualLanguageUsageAuthorization): void {
  if (value.usageEventIds.length < 1 || value.internalCostRecordIds.length < 1) {
    throw new Error('Visual Language usage authorization requires attempt-level usage and cost records.')
  }
}

function assertUsageReceipt(
  request: EditReferenceVisualLanguageStudyRequest,
  authorization: EditReferenceVisualLanguageUsageAuthorization,
  value: EditReferenceVisualLanguageUsageReceipt,
  requirePositive: boolean,
): void {
  if (!MONEY_MICROS.test(value.meteredInternalCostMicros)) {
    throw new Error('Visual Language usage receipt requires integer micro-units.')
  }
  if (requirePositive && BigInt(value.meteredInternalCostMicros) <= 0n) {
    throw new Error('Completed Visual Language usage requires positive integer micro-units.')
  }
  if (BigInt(value.meteredInternalCostMicros) > BigInt(request.maximumAuthorizedInternalCostMicros ?? '0')) {
    throw new Error('Visual Language usage receipt exceeds the approved maximum.')
  }
  if (!sameIds(value.usageEventIds, authorization.usageEventIds) || !sameIds(value.internalCostRecordIds, authorization.internalCostRecordIds)) {
    throw new Error('Visual Language usage receipt does not match the authorized attempt records.')
  }
  if ([...value.usageEventIds, ...value.internalCostRecordIds].some((id) => !id || id.length > 200)) {
    throw new Error('Visual Language usage receipt contains an invalid record identity.')
  }
}

function meteredUsage(
  value: EditReferenceVisualLanguageUsageReceipt,
): NonNullable<Parameters<typeof createBlockedEditReferenceVisualLanguageStudyResult>[0]['usage']> {
  return {
    internalCostStatus: 'metered',
    meteredInternalCostMicros: value.meteredInternalCostMicros,
    usageEventIds: value.usageEventIds,
    internalCostRecordIds: value.internalCostRecordIds,
  }
}

function requireResolvedFrame(
  frames: readonly EditReferenceResolvedPrivateFrame[],
  privateFrameArtifactId: string,
): EditReferenceResolvedPrivateFrame {
  const frame = frames.find((candidate) => candidate.privateFrameArtifactId === privateFrameArtifactId)
  if (!frame) throw new AdapterError('frame_authority_unverified', 'The exact private frame could not be resolved.')
  return frame
}

function copyEvidence(request: EditReferenceVisualLanguageStudyRequest) {
  return {
    mediaStructureEvidenceIds: [...request.evidence.mediaStructureEvidenceIds],
    technicalChangePointEvidenceIds: [...request.evidence.technicalChangePointEvidenceIds],
    technicalSourceConditionEvidenceIds: [...request.evidence.technicalSourceConditionEvidenceIds],
    technicalColorEvidenceIds: [...request.evidence.technicalColorEvidenceIds],
    captionGeometryEvidenceIds: [...request.evidence.captionGeometryEvidenceIds],
    ocrEvidenceIds: [...request.evidence.ocrEvidenceIds],
    studyChatGoalEvidenceIds: [...request.evidence.studyChatGoalEvidenceIds],
    factSafetyEvidenceIds: [...request.evidence.factSafetyEvidenceIds],
  }
}

function evidenceIds(request: EditReferenceVisualLanguageStudyRequest): string[] {
  return [
    ...request.evidence.mediaStructureEvidenceIds,
    ...request.evidence.technicalChangePointEvidenceIds,
    ...request.evidence.technicalSourceConditionEvidenceIds,
    ...request.evidence.technicalColorEvidenceIds,
    ...request.evidence.captionGeometryEvidenceIds,
    ...request.evidence.ocrEvidenceIds,
    ...request.evidence.studyChatGoalEvidenceIds,
    ...request.evidence.factSafetyEvidenceIds,
  ]
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)]
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function now(options: EditReferenceQwenVisualLanguageAdapterOptions): string {
  return options.now?.() ?? new Date().toISOString()
}

function isMissingFileError(error: unknown): boolean {
  return Boolean(
    error
    && typeof error === 'object'
    && 'code' in error
    && (error as { readonly code?: unknown }).code === 'ENOENT',
  )
}

class AdapterError extends Error {
  readonly blockerCode: Parameters<typeof createBlockedEditReferenceVisualLanguageStudyResult>[0]['blockerCode']

  constructor(
    blockerCode: Parameters<typeof createBlockedEditReferenceVisualLanguageStudyResult>[0]['blockerCode'],
    message: string,
  ) {
    super(message)
    this.name = 'EditReferenceVisualLanguageAdapterError'
    this.blockerCode = blockerCode
  }
}

export function hashEditReferenceVisualLanguageFrameManifest(
  frames: readonly EditReferenceVisualFrameEvidence[],
): string {
  return createHash('sha256').update(JSON.stringify(frames.map((frame) => ({
    role: frame.role,
    frameEvidenceId: frame.frameEvidenceId,
    privateFrameArtifactId: frame.privateFrameArtifactId,
    frameChecksumSha256: frame.frameChecksumSha256,
    sourceTimeSeconds: frame.sourceTimeSeconds,
    width: frame.width,
    height: frame.height,
    privateAccessVerified: frame.privateAccessVerified,
    ephemeral: frame.ephemeral,
    cleanupRequired: frame.cleanupRequired,
  })))).digest('hex')
}

export function hashEditReferenceVisualLanguageEvidenceManifest(
  request: Pick<EditReferenceVisualLanguageStudyRequest, 'evidence'>,
): string {
  return createHash('sha256').update(JSON.stringify({
    mediaStructureEvidenceIds: [...request.evidence.mediaStructureEvidenceIds],
    technicalChangePointEvidenceIds: [...request.evidence.technicalChangePointEvidenceIds],
    technicalSourceConditionEvidenceIds: [...request.evidence.technicalSourceConditionEvidenceIds],
    technicalColorEvidenceIds: [...request.evidence.technicalColorEvidenceIds],
    captionGeometryEvidenceIds: [...request.evidence.captionGeometryEvidenceIds],
    ocrEvidenceIds: [...request.evidence.ocrEvidenceIds],
    studyChatGoalEvidenceIds: [...request.evidence.studyChatGoalEvidenceIds],
    factSafetyEvidenceIds: [...request.evidence.factSafetyEvidenceIds],
  })).digest('hex')
}

export function isValidVisualLanguageDigest(value: string): boolean {
  return SHA256.test(value)
}

function normalizeContractId(value: string): string {
  const normalized = value.replace(/[^A-Za-z0-9._:-]+/g, ':').replace(/^:+|:+$/g, '')
  if (!normalized || normalized.length > 200) {
    throw new AdapterError('runtime_response_invalid', 'The visual runtime model identity cannot be represented safely.')
  }
  return normalized
}
