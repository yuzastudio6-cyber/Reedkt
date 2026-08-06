import { createHash, randomUUID } from 'node:crypto'
import {
  EDIT_REFERENCE_STORY_EDITORIAL_STUDY_RESULT_VERSION,
  createBlockedEditReferenceStoryEditorialStudyResult,
  hashEditReferenceStoryEditorialStudyRequest,
  validateEditReferenceStoryEditorialStudyRequest,
  validateEditReferenceStoryEditorialStudyResult,
  type EditReferenceAnalyzedStoryEditorialStudyResult,
  type EditReferenceStoryEditorialEvidenceManifest,
  type EditReferenceStoryEditorialFinding,
  type EditReferenceStoryEditorialStudyAdapter,
  type EditReferenceStoryEditorialStudyBlockerCode,
  type EditReferenceStoryEditorialStudyRequest,
  type EditReferenceStoryEditorialStudyResult,
} from './edit-reference-story-editorial-study-contract'
import {
  qwenStoryEditorialStructuredContextSchema,
  type EditReferenceStoryEditorialProviderResult,
  type EditReferenceStoryEditorialReasoningProvider,
  type QwenStoryEditorialStructuredContext,
} from '../services/qwen-story-editorial-provider'
import {
  getEditReferenceReasoningRouteDisplayName,
  getEditReferenceReasoningRouteRetryReason,
  validateEditReferenceReasoningRouteAuthorization,
  type EditReferenceReasoningRouteAuthorization,
  type EditReferenceReasoningRouteId,
} from './edit-reference-reasoning-route-authorization'

export const EDIT_REFERENCE_QWEN_STORY_EDITORIAL_ADAPTER_ID =
  'edit_reference_qwen_story_editorial_adapter' as const
export const EDIT_REFERENCE_QWEN_STORY_EDITORIAL_ADAPTER_VERSION = 'v1' as const
export const EDIT_REFERENCE_ROUTED_STORY_EDITORIAL_ADAPTER_ID =
  'edit_reference_routed_story_editorial_adapter' as const
export const EDIT_REFERENCE_ROUTED_STORY_EDITORIAL_ADAPTER_VERSION = 'v1' as const

export interface EditReferenceStoryEditorialUsageAuthorization {
  readonly usageEventIds: readonly string[]
  readonly internalCostRecordIds: readonly string[]
}

export interface EditReferenceStoryEditorialUsageReceipt
  extends EditReferenceStoryEditorialUsageAuthorization {
  readonly meteredInternalCostMicros: string
}

export interface EditReferenceStoryEditorialProductionUsageAuthority {
  authorize(
    request: EditReferenceStoryEditorialStudyRequest,
  ): Promise<EditReferenceStoryEditorialUsageAuthorization>
  reconcile(input: {
    readonly request: EditReferenceStoryEditorialStudyRequest
    readonly providerResult: EditReferenceStoryEditorialProviderResult
    readonly authorization: EditReferenceStoryEditorialUsageAuthorization
  }): Promise<EditReferenceStoryEditorialUsageReceipt>
}

export interface EditReferenceQwenStoryEditorialAdapterOptions {
  readonly provider: EditReferenceStoryEditorialReasoningProvider
  readonly structuredContext: QwenStoryEditorialStructuredContext
  readonly reasoningRouteAuthorization?: EditReferenceReasoningRouteAuthorization
  readonly productionUsageAuthority?: EditReferenceStoryEditorialProductionUsageAuthority
  readonly now?: () => string
  readonly createExecutionId?: () => string
}

export interface EditReferenceRoutedStoryEditorialAdapterOptions
  extends EditReferenceQwenStoryEditorialAdapterOptions {
  readonly expectedReasoningRouteId: EditReferenceReasoningRouteId
  readonly adapterId?: string
  readonly adapterVersion?: string
}

interface PendingBlockedResult {
  readonly kind: 'blocked'
  readonly blockerCode: EditReferenceStoryEditorialStudyBlockerCode
  readonly blockerMessage: string
  readonly retryAvailable: boolean
  readonly retryReason?: string
  readonly providerResult?: EditReferenceStoryEditorialProviderResult
  readonly usage?: {
    readonly internalCostStatus: 'metered' | 'unverified'
    readonly meteredInternalCostMicros: string | null
    readonly usageEventIds: readonly string[]
    readonly internalCostRecordIds: readonly string[]
  }
}

interface PendingAnalyzedResult {
  readonly kind: 'analyzed'
  readonly providerResult: EditReferenceStoryEditorialProviderResult
  readonly usageReceipt?: EditReferenceStoryEditorialUsageReceipt
}

type PendingAdapterResult = PendingBlockedResult | PendingAnalyzedResult

const DIRECT_COPY_LANGUAGE = /\b(?:copy|replicate|recreate|verbatim|same exact|match exactly|retain exact|preserve exact|shot[- ]for[- ]shot)\b/i
const EXACT_TIMING_OR_SEQUENCE_DATA = /(?:\b\d+(?:\.\d+)?\s*(?:frames?|milliseconds?|ms|seconds?|secs?|s)\b)|(?:\bscene\s*\d+\b)|(?:\b(?:first|second|third|fourth)\s+at\s+\d)/i
const MONEY_MICROS = /^(?:0|[1-9][0-9]{0,15})$/

export function hashEditReferenceStoryEditorialStructuredContext(
  context: QwenStoryEditorialStructuredContext,
): string {
  const parsed = qwenStoryEditorialStructuredContextSchema.parse(context)
  return createHash('sha256').update(JSON.stringify({
    schemaVersion: parsed.schemaVersion,
    audioPresence: parsed.audioPresence,
    sourceClaimsPresent: parsed.sourceClaimsPresent,
    evidenceItems: parsed.evidenceItems,
    boundaries: parsed.boundaries,
  })).digest('hex')
}

export function createEditReferenceQwenStoryEditorialAdapter(
  options: EditReferenceQwenStoryEditorialAdapterOptions,
): EditReferenceStoryEditorialStudyAdapter {
  return createEditReferenceRoutedStoryEditorialAdapter({
    ...options,
    expectedReasoningRouteId: 'qwen_3_7_fallback',
    adapterId: EDIT_REFERENCE_QWEN_STORY_EDITORIAL_ADAPTER_ID,
    adapterVersion: EDIT_REFERENCE_QWEN_STORY_EDITORIAL_ADAPTER_VERSION,
  })
}

export function createEditReferenceRoutedStoryEditorialAdapter(
  options: EditReferenceRoutedStoryEditorialAdapterOptions,
): EditReferenceStoryEditorialStudyAdapter {
  const adapterId = options.adapterId ?? EDIT_REFERENCE_ROUTED_STORY_EDITORIAL_ADAPTER_ID
  const adapterVersion = options.adapterVersion ?? EDIT_REFERENCE_ROUTED_STORY_EDITORIAL_ADAPTER_VERSION
  return {
    adapterId,
    adapterVersion,
    async analyze(request): Promise<EditReferenceStoryEditorialStudyResult> {
      validateEditReferenceStoryEditorialStudyRequest(request)
      const startedAt = now(options)
      const executionId = options.createExecutionId?.()
        ?? `edit-reference-story-editorial-${randomUUID()}`
      let structuredEvidenceRead = false
      let providerResult: EditReferenceStoryEditorialProviderResult | undefined
      let authorization: EditReferenceStoryEditorialUsageAuthorization | undefined
      let usageReceipt: EditReferenceStoryEditorialUsageReceipt | undefined
      let verifiedRouteAuthorization: EditReferenceReasoningRouteAuthorization | undefined
      let pendingResult: PendingAdapterResult | undefined

      try {
        assertExactStructuredEvidence(request, options.structuredContext)
        structuredEvidenceRead = true
        const routeAuthorization = request.executionScope === 'production'
          ? validateEditReferenceReasoningRouteAuthorization({
              authorization: options.reasoningRouteAuthorization,
              expectedLane: 'story_editorial',
              expectedRouteId: options.expectedReasoningRouteId,
              requestDigestSha256: hashEditReferenceStoryEditorialStudyRequest(request),
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
              blockerMessage: 'An unmetered controlled Story/Editorial study cannot call the live reasoning provider.',
              retryAvailable: true,
              retryReason: 'Retry with a reviewed local analyzer or an approved production estimate, budget, rate card, and usage recorder.',
            }
          } else {
            providerResult = await options.provider.analyze(options.structuredContext)
            pendingResult = providerResult.status === 'completed'
              ? { kind: 'analyzed', providerResult }
              : {
                  kind: 'blocked',
                  blockerCode: mapProviderBlocker(providerResult.blockers),
                  blockerMessage: safeProviderBlockerMessage(providerResult),
                  retryAvailable: true,
                  retryReason: 'Retry after the reviewed local Story/Editorial runtime is restored.',
                  providerResult,
                }
          }
        } else if (!routeAuthorization?.ok) {
          pendingResult = {
            kind: 'blocked',
            blockerCode: 'model_routing_unavailable',
            blockerMessage: `${getEditReferenceReasoningRouteDisplayName(options.expectedReasoningRouteId)} Story/Editorial reasoning lacks exact shared-route authority.`,
            retryAvailable: true,
            retryReason: getEditReferenceReasoningRouteRetryReason(options.expectedReasoningRouteId),
          }
        } else if (options.provider.executionMode !== 'live_provider') {
          pendingResult = {
            kind: 'blocked',
            blockerCode: 'model_routing_unavailable',
            blockerMessage: 'Production Story/Editorial study requires the reviewed live reasoning route.',
            retryAvailable: true,
            retryReason: 'Restore the reviewed live route and retry under the exact approved cost authority.',
          }
        } else if (!options.productionUsageAuthority) {
          pendingResult = {
            kind: 'blocked',
            blockerCode: 'cost_authority_unavailable',
            blockerMessage: 'Canonical internal-cost authority is unavailable, so no private Story/Editorial provider call was made.',
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
              blockerMessage: 'Canonical internal-cost authority did not authorize this exact Story/Editorial request.',
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
                  blockerMessage: 'The private Story/Editorial attempt ran, but canonical internal-cost usage could not be reconciled.',
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
                    kind: 'blocked',
                    blockerCode: mapProviderBlocker(providerResult.blockers),
                    blockerMessage: safeProviderBlockerMessage(providerResult),
                    retryAvailable: true,
                    retryReason: 'Retry after the reviewed Story/Editorial reasoning runtime and strict response contract are restored.',
                    providerResult,
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
        return createBlockedEditReferenceStoryEditorialStudyResult({
          request,
          blockerCode: 'adapter_unavailable',
          blockerMessage: 'The bounded Story/Editorial adapter ended without a structured result.',
          retryAvailable: true,
          retryReason: 'Retry after restoring the reviewed adapter state machine.',
          execution: { structuredEvidenceRead },
        })
      }
      if (pendingResult.kind === 'blocked') {
        return createBlockedEditReferenceStoryEditorialStudyResult({
          request,
          blockerCode: pendingResult.blockerCode,
          blockerMessage: pendingResult.blockerMessage,
          retryAvailable: pendingResult.retryAvailable,
          retryReason: pendingResult.retryReason,
          execution: {
            structuredEvidenceRead,
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
        return createBlockedEditReferenceStoryEditorialStudyResult({
          request,
          blockerCode: classifyAdapterError(error),
          blockerMessage: safeAdapterError(error),
          retryAvailable: false,
          execution: {
            structuredEvidenceRead,
            providerCallMade: pendingResult.providerResult.execution.providerCallMade,
            modelCallMade: pendingResult.providerResult.execution.modelCallMade,
            workerJobCreated: pendingResult.providerResult.execution.workerJobCreated,
          },
          ...(pendingResult.usageReceipt
            ? { usage: meteredUsage(pendingResult.usageReceipt) }
            : {}),
        })
      }
    },
  }
}

function buildAnalyzedResult(input: {
  readonly request: EditReferenceStoryEditorialStudyRequest
  readonly providerResult: EditReferenceStoryEditorialProviderResult
  readonly usageReceipt?: EditReferenceStoryEditorialUsageReceipt
  readonly executionId: string
  readonly startedAt: string
  readonly completedAt: string
  readonly adapterId: string
  readonly adapterVersion: string
  readonly routeAuthorization?: EditReferenceReasoningRouteAuthorization
}): EditReferenceAnalyzedStoryEditorialStudyResult {
  const { request, providerResult } = input
  const provenance = providerResult.runtimeProvenance
  if (!provenance || providerResult.status !== 'completed' || providerResult.observations.length < 1) {
    throw new AdapterError('runtime_response_invalid', 'The Story/Editorial result lacks reviewed reasoning provenance or observations.')
  }
  if (request.executionScope === 'controlled_test') {
    if (
      provenance.runtimeSource !== 'verified_local'
      || provenance.providerId !== null
      || providerResult.execution.providerCallMade
      || !providerResult.execution.modelCallMade
    ) throw new AdapterError('runtime_response_invalid', 'Controlled Story/Editorial execution provenance is invalid.')
  } else if (
    provenance.runtimeSource !== 'verified_live'
    || !provenance.providerId
    || !providerResult.execution.providerCallMade
    || !providerResult.execution.modelCallMade
    || !input.usageReceipt
    || provenance.modelId !== input.routeAuthorization?.exactProviderModelId
  ) {
    throw new AdapterError('runtime_response_invalid', 'Production Story/Editorial execution provenance is invalid.')
  }
  if (providerResult.observations.some((observation) => (
    DIRECT_COPY_LANGUAGE.test(observation.summary)
    || EXACT_TIMING_OR_SEQUENCE_DATA.test(observation.summary)
  ))) {
    throw new AdapterError('copy_safety_violation', 'The Story/Editorial result retained copy-oriented, exact timing, or exact sequence data.')
  }
  assertObservationEvidence(request, providerResult)
  const findings = providerResult.observations.map((observation, index): EditReferenceStoryEditorialFinding => ({
    findingId: `story-editorial-finding-${index + 1}`,
    category: observation.category,
    summary: observation.summary,
    evidenceIds: [...observation.evidenceIds],
    confidence: observation.confidence,
    transferability: observation.transferability,
    targetAdaptationRequired: true,
    requiresUserReview: observation.requiresUserReview,
    claimRelated: observation.claimRelated,
    factSafetyStatus: observation.factSafetyStatus,
    exactReferenceWordingRetained: false,
    exactReferenceSequenceInstructionCreated: false,
    exactReferenceTimingInstructionCreated: false,
    identityTransferInstructionCreated: false,
  }))
  const averageConfidence = findings.reduce((sum, finding) => sum + finding.confidence, 0) / findings.length
  const controlled = request.executionScope === 'controlled_test'
  const result: EditReferenceAnalyzedStoryEditorialStudyResult = {
    schemaVersion: EDIT_REFERENCE_STORY_EDITORIAL_STUDY_RESULT_VERSION,
    requestDigestSha256: hashEditReferenceStoryEditorialStudyRequest(request),
    status: 'analyzed',
    runtimeSource: provenance.runtimeSource,
    workspaceId: request.workspaceId,
    editReferenceId: request.editReferenceId,
    studySessionId: request.studySessionId,
    orchestrationId: request.orchestrationId,
    privateMediaArtifactId: request.privateMediaArtifactId,
    mediaChecksumSha256: request.mediaChecksumSha256,
    evidenceManifestDigestSha256: request.evidenceManifestDigestSha256,
    evidence: copyManifest(request.evidence),
    findings,
    coverage: {
      evidenceItemCount: allEvidenceIds(request.evidence).length,
      audioPresence: request.audioPresence,
      sourceClaimsPresent: request.sourceClaimsPresent,
      partial: providerResult.coverage?.partial ?? false,
      missingEvidenceKinds: [...(providerResult.coverage?.missingEvidenceKinds ?? [])],
    },
    summary: {
      findingCount: findings.length,
      transferablePrincipleCount: findings.filter((finding) => finding.transferability === 'transferable_principle').length,
      contextOnlyCount: findings.filter((finding) => finding.transferability === 'context_only').length,
      nonTransferableCount: findings.filter((finding) => finding.transferability === 'non_transferable').length,
      averageConfidence,
    },
    execution: {
      structuredEvidenceRead: true,
      reasoningModelExecuted: true,
      rawMediaRead: false,
      rawTranscriptPersisted: false,
      externalUrlFetched: false,
      providerCallMade: providerResult.execution.providerCallMade,
      modelCallMade: true,
      workerJobCreated: providerResult.execution.workerJobCreated,
      remoteMutationMade: false,
    },
    model: {
      adapterId: input.adapterId,
      adapterVersion: input.adapterVersion,
      providerId: provenance.providerId,
      modelId: provenance.modelId,
      modelRevision: provenance.modelRevision,
      modelAggregateSha256: provenance.modelAggregateSha256,
      modelRoutingPolicyVersion: request.executionScope === 'production'
        ? (input.routeAuthorization as EditReferenceReasoningRouteAuthorization).canonicalRouteContractVersion
        : provenance.modelRoutingPolicyVersion,
      reasoningInstructionDigestSha256: provenance.reasoningInstructionDigestSha256,
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
      rawFramesPersisted: false,
      rawTranscriptPersisted: false,
      rawProviderPayloadPersisted: false,
      signedUrlPersisted: false,
      hiddenChainOfThoughtPersisted: false,
    },
    copySafety: {
      exactHookWordingRetained: false,
      exactSceneSequenceCopyInstructionCreated: false,
      exactTimingCopyInstructionCreated: false,
      creatorIdentityTransferInstructionCreated: false,
      copyrightedAssetTransferInstructionCreated: false,
      referenceGraphicLayoutTransferInstructionCreated: false,
    },
    factSafety: {
      claimEvidenceRequired: request.sourceClaimsPresent,
      claimEvidenceIds: [...request.evidence.factSafetyEvidenceIds],
      unverifiedClaimPresentedAsFact: false,
      sourceAttributionRemoved: false,
      guiltImplyingVisualInstructionCreated: false,
    },
    transferBoundary: {
      technicalChangePointsTreatedAsSemanticScenes: false,
      findingsMayBecomeTargetInstructionsWithoutApplication: false,
      targetEvidenceRequired: true,
      userApprovalRequired: true,
      exactTimingOrSequenceTransferAllowed: false,
    },
  }
  validateEditReferenceStoryEditorialStudyResult(request, result)
  return result
}

function assertExactStructuredEvidence(
  request: EditReferenceStoryEditorialStudyRequest,
  context: QwenStoryEditorialStructuredContext,
): void {
  const parsed = qwenStoryEditorialStructuredContextSchema.parse(context)
  const digest = hashEditReferenceStoryEditorialStructuredContext(parsed)
  if (
    parsed.evidenceManifestDigestSha256 !== digest
    || request.evidenceManifestDigestSha256 !== digest
    || parsed.audioPresence !== request.audioPresence
    || parsed.sourceClaimsPresent !== request.sourceClaimsPresent
  ) throw new AdapterError('evidence_authority_unverified', 'The Story/Editorial structured-evidence digest or source authority does not match the exact request.')
  const requestIds = allEvidenceIds(request.evidence).slice().sort()
  const contextIds = parsed.evidenceItems.map((item) => item.evidenceId).sort()
  if (JSON.stringify(requestIds) !== JSON.stringify(contextIds)) {
    throw new AdapterError('evidence_authority_unverified', 'The Story/Editorial structured evidence does not match the exact evidence manifest.')
  }
}

function assertObservationEvidence(
  request: EditReferenceStoryEditorialStudyRequest,
  result: EditReferenceStoryEditorialProviderResult,
): void {
  const allowed = new Set(allEvidenceIds(request.evidence))
  const technicalOnly = new Set([
    ...request.evidence.mediaStructureEvidenceIds,
    ...request.evidence.technicalChangePointEvidenceIds,
    ...request.evidence.speechTimingEvidenceIds,
  ])
  const factSafety = new Set(request.evidence.factSafetyEvidenceIds)
  for (const observation of result.observations) {
    if (observation.evidenceIds.some((id) => !allowed.has(id))) {
      throw new AdapterError('runtime_response_invalid', 'The Story/Editorial result cited evidence outside the exact request.')
    }
    if (observation.evidenceIds.every((id) => technicalOnly.has(id))) {
      throw new AdapterError('runtime_response_invalid', 'Technical change points or timing summaries cannot establish semantic Story/Editorial findings by themselves.')
    }
    if (
      observation.claimRelated
      && (!request.sourceClaimsPresent || !observation.evidenceIds.some((id) => factSafety.has(id)))
    ) throw new AdapterError('runtime_response_invalid', 'Claim-related Story/Editorial findings require exact fact-safety evidence.')
  }
}

function assertUsageAuthorization(value: EditReferenceStoryEditorialUsageAuthorization): void {
  assertIdList(value.usageEventIds)
  assertIdList(value.internalCostRecordIds)
}

function assertUsageReceipt(
  request: EditReferenceStoryEditorialStudyRequest,
  authorization: EditReferenceStoryEditorialUsageAuthorization,
  receipt: EditReferenceStoryEditorialUsageReceipt,
  completed: boolean,
): void {
  assertUsageAuthorization(receipt)
  if (!MONEY_MICROS.test(receipt.meteredInternalCostMicros)) throw new Error('invalid_metered_internal_cost')
  if (BigInt(receipt.meteredInternalCostMicros) > BigInt(request.maximumAuthorizedInternalCostMicros as string)) {
    throw new Error('metered_internal_cost_exceeds_authority')
  }
  if (
    JSON.stringify([...receipt.usageEventIds]) !== JSON.stringify([...authorization.usageEventIds])
    || JSON.stringify([...receipt.internalCostRecordIds]) !== JSON.stringify([...authorization.internalCostRecordIds])
  ) throw new Error('usage_receipt_identity_mismatch')
  if (completed && BigInt(receipt.meteredInternalCostMicros) <= 0n) throw new Error('completed_attempt_requires_positive_cost')
}

function assertIdList(values: readonly string[]): void {
  if (
    values.length < 1
    || values.length > 64
    || new Set(values).size !== values.length
    || values.some((value) => !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value))
  ) throw new Error('invalid_usage_record_ids')
}

function mapProviderBlocker(blockers: readonly string[]): EditReferenceStoryEditorialStudyBlockerCode {
  const value = blockers.join(' ')
  if (/config|model_provenance|secret|missing_beta|base_url/i.test(value)) return 'model_routing_unavailable'
  if (/schema|response|evidence/i.test(value)) return 'runtime_response_invalid'
  return 'adapter_unavailable'
}

function safeProviderBlockerMessage(result: EditReferenceStoryEditorialProviderResult): string {
  if (result.blockers.some((blocker) => /schema|response|evidence/i.test(blocker))) {
    return 'The Story/Editorial provider response failed its strict evidence or response contract.'
  }
  if (result.blockers.some((blocker) => /config|model|secret|base_url/i.test(blocker))) {
    return 'The reviewed Story/Editorial reasoning route or pinned model provenance is unavailable.'
  }
  return 'The bounded Story/Editorial provider attempt did not complete.'
}

function classifyAdapterError(error: unknown): EditReferenceStoryEditorialStudyBlockerCode {
  return error instanceof AdapterError ? error.blockerCode : 'runtime_response_invalid'
}

function safeAdapterError(error: unknown): string {
  if (error instanceof AdapterError) return error.safeMessage
  return 'The bounded Story/Editorial adapter rejected an invalid or unsafe result.'
}

function meteredUsage(receipt: EditReferenceStoryEditorialUsageReceipt): PendingBlockedResult['usage'] {
  return {
    internalCostStatus: 'metered',
    meteredInternalCostMicros: receipt.meteredInternalCostMicros,
    usageEventIds: [...receipt.usageEventIds],
    internalCostRecordIds: [...receipt.internalCostRecordIds],
  }
}

function allEvidenceIds(manifest: EditReferenceStoryEditorialEvidenceManifest): string[] {
  return [
    ...manifest.mediaStructureEvidenceIds,
    ...manifest.technicalChangePointEvidenceIds,
    ...manifest.visualLanguageEvidenceIds,
    ...manifest.transcriptEvidenceIds,
    ...manifest.speechTimingEvidenceIds,
    ...manifest.studyChatGoalEvidenceIds,
    ...manifest.factSafetyEvidenceIds,
  ]
}

function copyManifest(manifest: EditReferenceStoryEditorialEvidenceManifest): EditReferenceStoryEditorialEvidenceManifest {
  return {
    mediaStructureEvidenceIds: [...manifest.mediaStructureEvidenceIds],
    technicalChangePointEvidenceIds: [...manifest.technicalChangePointEvidenceIds],
    visualLanguageEvidenceIds: [...manifest.visualLanguageEvidenceIds],
    transcriptEvidenceIds: [...manifest.transcriptEvidenceIds],
    speechTimingEvidenceIds: [...manifest.speechTimingEvidenceIds],
    studyChatGoalEvidenceIds: [...manifest.studyChatGoalEvidenceIds],
    factSafetyEvidenceIds: [...manifest.factSafetyEvidenceIds],
  }
}

function now(options: EditReferenceQwenStoryEditorialAdapterOptions): string {
  return options.now?.() ?? new Date().toISOString()
}

class AdapterError extends Error {
  readonly blockerCode: EditReferenceStoryEditorialStudyBlockerCode
  readonly safeMessage: string

  constructor(
    blockerCode: EditReferenceStoryEditorialStudyBlockerCode,
    safeMessage: string,
  ) {
    super(safeMessage)
    this.blockerCode = blockerCode
    this.safeMessage = safeMessage
  }
}
