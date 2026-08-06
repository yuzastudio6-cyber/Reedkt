import { createHash, randomUUID } from 'node:crypto'
import { createDoNotCopyPreferenceRules } from '../../src/backend/preference-dna/preference-dna-transferability-service'
import type { PreferenceDNALayerId } from '../../src/types/preference-dna-builder'
import { detectEditReferenceCopyRisks } from './edit-reference-copy-safety'
import {
  EDIT_REFERENCE_PREFERENCE_DNA_REASONING_RESULT_VERSION,
  createBlockedEditReferencePreferenceDnaReasoningResult,
  hashEditReferencePreferenceDnaReasoningRequest,
  validateEditReferencePreferenceDnaReasoningRequest,
  validateEditReferencePreferenceDnaReasoningResult,
  type EditReferencePreferenceDnaReasoningBlockerCode,
  type EditReferencePreferenceDnaReasoningCandidate,
  type EditReferencePreferenceDnaReasoningLayer,
  type EditReferencePreferenceDnaReasoningRequest,
  type EditReferencePreferenceDnaReasoningResult,
  type EditReferenceValidatedPreferenceDnaReasoningResult,
} from './edit-reference-preference-dna-reasoning-contract'
import {
  qwenPreferenceDnaStructuredContextSchema,
  type QwenPreferenceDnaProviderResult,
  type QwenPreferenceDnaReasoningProvider,
  type QwenPreferenceDnaStructuredContext,
} from '../services/qwen-preference-dna-reasoning-provider'
import {
  getEditReferenceReasoningRouteDisplayName,
  getEditReferenceReasoningRouteRetryReason,
  validateEditReferenceReasoningRouteAuthorization,
  type EditReferenceReasoningRouteAuthorization,
  type EditReferenceReasoningRouteId,
} from './edit-reference-reasoning-route-authorization'

export const EDIT_REFERENCE_QWEN_PREFERENCE_DNA_ADAPTER_ID =
  'edit_reference_qwen_preference_dna_adapter' as const
export const EDIT_REFERENCE_QWEN_PREFERENCE_DNA_ADAPTER_VERSION = 'v1' as const
export const EDIT_REFERENCE_ROUTED_PREFERENCE_DNA_ADAPTER_ID =
  'edit_reference_routed_preference_dna_adapter' as const
export const EDIT_REFERENCE_ROUTED_PREFERENCE_DNA_ADAPTER_VERSION = 'v1' as const

export interface EditReferencePreferenceDnaUsageAuthorization {
  readonly usageEventIds: readonly string[]
  readonly internalCostRecordIds: readonly string[]
}

export interface EditReferencePreferenceDnaUsageReceipt
  extends EditReferencePreferenceDnaUsageAuthorization {
  readonly meteredInternalCostMicros: string
}

export interface EditReferencePreferenceDnaProductionUsageAuthority {
  authorize(
    request: EditReferencePreferenceDnaReasoningRequest,
  ): Promise<EditReferencePreferenceDnaUsageAuthorization>
  reconcile(input: {
    readonly request: EditReferencePreferenceDnaReasoningRequest
    readonly providerResult: QwenPreferenceDnaProviderResult
    readonly authorization: EditReferencePreferenceDnaUsageAuthorization
  }): Promise<EditReferencePreferenceDnaUsageReceipt>
}

export interface EditReferenceQwenPreferenceDnaAdapterOptions {
  readonly provider: QwenPreferenceDnaReasoningProvider
  readonly structuredContext: QwenPreferenceDnaStructuredContext
  readonly requiredLayerIds: readonly PreferenceDNALayerId[]
  readonly reasoningRouteAuthorization?: EditReferenceReasoningRouteAuthorization
  readonly productionUsageAuthority?: EditReferencePreferenceDnaProductionUsageAuthority
  readonly now?: () => string
  readonly createExecutionId?: () => string
}

export interface EditReferenceRoutedPreferenceDnaAdapterOptions
  extends EditReferenceQwenPreferenceDnaAdapterOptions {
  readonly expectedReasoningRouteId: EditReferenceReasoningRouteId
  readonly adapterId?: string
  readonly adapterVersion?: string
}

export interface EditReferencePreferenceDnaReasoningAdapter {
  readonly adapterId: string
  readonly adapterVersion: string
  synthesize(request: EditReferencePreferenceDnaReasoningRequest): Promise<EditReferencePreferenceDnaReasoningResult>
}

interface PendingUsage {
  readonly internalCostStatus: 'metered' | 'unverified'
  readonly meteredInternalCostMicros: string | null
  readonly usageEventIds: readonly string[]
  readonly internalCostRecordIds: readonly string[]
}

const MONEY_MICROS = /^(?:0|[1-9][0-9]{0,15})$/

export function hashEditReferencePreferenceDnaStructuredContext(
  context: QwenPreferenceDnaStructuredContext,
): string {
  const parsed = qwenPreferenceDnaStructuredContextSchema.parse(context)
  return createHash('sha256').update(JSON.stringify(parsed)).digest('hex')
}

export function createEditReferenceQwenPreferenceDnaAdapter(
  options: EditReferenceQwenPreferenceDnaAdapterOptions,
): EditReferencePreferenceDnaReasoningAdapter {
  return createEditReferenceRoutedPreferenceDnaAdapter({
    ...options,
    expectedReasoningRouteId: 'qwen_3_7_fallback',
    adapterId: EDIT_REFERENCE_QWEN_PREFERENCE_DNA_ADAPTER_ID,
    adapterVersion: EDIT_REFERENCE_QWEN_PREFERENCE_DNA_ADAPTER_VERSION,
  })
}

export function createEditReferenceRoutedPreferenceDnaAdapter(
  options: EditReferenceRoutedPreferenceDnaAdapterOptions,
): EditReferencePreferenceDnaReasoningAdapter {
  const adapterId = options.adapterId ?? EDIT_REFERENCE_ROUTED_PREFERENCE_DNA_ADAPTER_ID
  const adapterVersion = options.adapterVersion ?? EDIT_REFERENCE_ROUTED_PREFERENCE_DNA_ADAPTER_VERSION
  const context = qwenPreferenceDnaStructuredContextSchema.parse(options.structuredContext)
  const requiredLayerIds = [...new Set(options.requiredLayerIds)]
  const knownLayerIds = new Set(context.layerCatalog.map((layer) => layer.layerId))
  if (!requiredLayerIds.length || requiredLayerIds.some((layerId) => !knownLayerIds.has(layerId))) {
    throw new Error('Preference DNA reasoning adapter required layers are invalid.')
  }
  return {
    adapterId,
    adapterVersion,
    async synthesize(request) {
      validateEditReferencePreferenceDnaReasoningRequest(request)
      if (request.structuredContextDigestSha256 !== hashEditReferencePreferenceDnaStructuredContext(context)) {
        return blocked(request, 'context_authority_unverified', 'The exact bounded Preference DNA evidence context could not be verified.', true, 'Reload the current study evidence and retry.')
      }
      if (request.inputEvidenceDigestSha256 !== context.inputEvidenceDigestSha256) {
        return blocked(request, 'context_authority_unverified', 'The Preference DNA evidence digest does not match the bounded context.', true, 'Reload the current study evidence and retry.')
      }

      let authorization: EditReferencePreferenceDnaUsageAuthorization | undefined
      if (request.executionScope === 'production') {
        const routeAuthorization = validateEditReferenceReasoningRouteAuthorization({
          authorization: options.reasoningRouteAuthorization,
          expectedLane: 'preference_dna',
          expectedRouteId: options.expectedReasoningRouteId,
          requestDigestSha256: hashEditReferencePreferenceDnaReasoningRequest(request),
          costAuthority: request,
        })
        if (!routeAuthorization.ok) {
          return blocked(
            request,
            'model_routing_unavailable',
            `${getEditReferenceReasoningRouteDisplayName(options.expectedReasoningRouteId)} Preference DNA reasoning lacks exact shared-route authority.`,
            true,
            getEditReferenceReasoningRouteRetryReason(options.expectedReasoningRouteId),
          )
        }
        if (!options.productionUsageAuthority) {
          return blocked(request, 'cost_authority_unavailable', 'Production Preference DNA reasoning requires approved internal-cost authority.', true, 'Approve an exact internal-cost estimate and budget before retrying.')
        }
        try {
          authorization = await options.productionUsageAuthority.authorize(request)
          assertUsageAuthorization(authorization)
        } catch {
          return blocked(request, 'cost_authority_unavailable', 'The exact internal-cost reservation could not be verified.', true, 'Review the estimate and budget authority before retrying.')
        }
      }

      const startedAt = currentTime(options)
      const executionId = options.createExecutionId?.() ?? `preference-dna-reasoning-${randomUUID()}`
      let providerResult: QwenPreferenceDnaProviderResult
      try {
        providerResult = await options.provider.synthesize(context)
      } catch {
        return blockedAfterProvider(request, 'reasoning_unavailable', 'The bounded Preference DNA reasoning provider did not complete.', true, 'Retry through the reviewed provider route.', undefined, authorization)
      }

      let receipt: EditReferencePreferenceDnaUsageReceipt | undefined
      if (request.executionScope === 'production') {
        try {
          receipt = await options.productionUsageAuthority?.reconcile({ request, providerResult, authorization: authorization as EditReferencePreferenceDnaUsageAuthorization })
          assertUsageReceipt(request, authorization as EditReferencePreferenceDnaUsageAuthorization, receipt as EditReferencePreferenceDnaUsageReceipt, providerResult.status === 'completed')
        } catch {
          return blocked(request, 'internal_cost_usage_unverified', 'The provider attempt finished without verified internal-cost usage.', true, 'Reconcile provider usage before retrying or accepting a candidate.', providerResult, {
            internalCostStatus: 'unverified',
            meteredInternalCostMicros: null,
            usageEventIds: authorization?.usageEventIds ?? [],
            internalCostRecordIds: authorization?.internalCostRecordIds ?? [],
          })
        }
      }

      if (providerResult.status !== 'completed' || !providerResult.response || !providerResult.runtimeProvenance) {
        return blocked(
          request,
          mapProviderBlocker(providerResult.blockers),
          safeProviderBlockerMessage(providerResult),
          true,
          'Retry after the reviewed model route and bounded evidence are available.',
          providerResult,
          receipt ? meteredUsage(receipt) : undefined,
        )
      }
      const expectedRuntime = request.executionScope === 'production' ? 'verified_live' : 'verified_controlled'
      if (
        providerResult.runtimeProvenance.runtimeSource !== expectedRuntime
        || !providerResult.execution.structuredEvidenceRead
        || !providerResult.execution.providerCallMade
        || !providerResult.execution.modelCallMade
        || (
          request.executionScope === 'production'
          && providerResult.runtimeProvenance.modelId
            !== options.reasoningRouteAuthorization?.exactProviderModelId
        )
      ) return blocked(request, 'runtime_response_invalid', 'Preference DNA reasoning lacks exact runtime provenance.', true, 'Retry through the reviewed bounded provider adapter.', providerResult, receipt ? meteredUsage(receipt) : undefined)

      let candidate: EditReferencePreferenceDnaReasoningCandidate
      try {
        candidate = buildValidatedCandidate(context, providerResult.response, requiredLayerIds)
      } catch (error) {
        const code = mapCandidateError(error)
        return blocked(
          request,
          code,
          candidateErrorMessage(code),
          true,
          'Correct or add evidence, then request a new candidate. Deterministic DNA remains unchanged.',
          providerResult,
          receipt ? meteredUsage(receipt) : undefined,
        )
      }

      const completedAt = currentTime(options)
      const provenance = providerResult.runtimeProvenance
      const result: EditReferenceValidatedPreferenceDnaReasoningResult = {
        schemaVersion: EDIT_REFERENCE_PREFERENCE_DNA_REASONING_RESULT_VERSION,
        requestDigestSha256: hashEditReferencePreferenceDnaReasoningRequest(request),
        status: 'validated_candidate',
        runtimeSource: expectedRuntime,
        workspaceId: request.workspaceId,
        actorUserId: request.actorUserId,
        editReferenceId: request.editReferenceId,
        studySessionId: request.studySessionId,
        studyRevision: request.expectedStudyRevision,
        inputEvidenceDigestSha256: request.inputEvidenceDigestSha256,
        candidate,
        validation: {
          strictSchemaValidated: true,
          exactEvidenceLinksValidated: true,
          goalLayerCoverageValidated: true,
          confidenceValidated: true,
          transferabilityValidated: true,
          copySafetyValidated: true,
          deterministicSafetyRulesInjected: true,
          missingEvidenceReviewed: candidate.missingEvidenceKinds.length === 0 || candidate.requiresUserReview,
          contradictionsReviewed: candidate.contradictions.length === 0 || candidate.requiresUserReview,
          nonTransferableDetailsReviewed: candidate.nonTransferableDetails.length === 0 || candidate.requiresUserReview,
          unsafeAssetAssumptionsRejected: true,
        },
        model: {
          adapterId,
          adapterVersion,
          providerId: provenance.providerId,
          modelId: provenance.modelId,
          modelRevision: provenance.modelRevision,
          modelAggregateSha256: provenance.modelAggregateSha256,
          modelRoutingPolicyVersion: request.executionScope === 'production'
            ? (options.reasoningRouteAuthorization as EditReferenceReasoningRouteAuthorization).canonicalRouteContractVersion
            : provenance.modelRoutingPolicyVersion,
          reasoningInstructionDigestSha256: provenance.reasoningInstructionDigestSha256,
        },
        provenance: { executionId, startedAt, completedAt },
        usage: request.executionScope === 'controlled_test'
          ? {
              mode: 'controlled_not_incurred',
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
            }
          : {
              mode: 'production_metered',
              approvedUsageEstimateId: request.approvedUsageEstimateId as string,
              internalCostBudgetId: request.internalCostBudgetId as string,
              immutableRateCardSnapshotId: request.immutableRateCardSnapshotId as string,
              maximumAuthorizedInternalCostMicros: request.maximumAuthorizedInternalCostMicros as string,
              meteredInternalCostMicros: (receipt as EditReferencePreferenceDnaUsageReceipt).meteredInternalCostMicros,
              usageEventIds: [...(receipt as EditReferencePreferenceDnaUsageReceipt).usageEventIds],
              internalCostRecordIds: [...(receipt as EditReferencePreferenceDnaUsageReceipt).internalCostRecordIds],
              customerPriceCalculated: false,
              customerCreditsMutated: false,
              serviceFeeIncluded: false,
            },
        execution: {
          structuredEvidenceRead: true,
          providerCallMade: true,
          modelCallMade: true,
          workerJobCreated: false,
          remoteMutationMade: false,
          evidenceMutationMade: false,
          dnaVersionPersisted: false,
          deterministicDnaReplaced: false,
          qaBypassed: false,
          approvalMutationMade: false,
          targetOperationCreated: false,
        },
        privacy: {
          rawMediaRead: false,
          rawFramesRead: false,
          rawTranscriptRead: false,
          projectChatHistoryRead: false,
          externalUrlFetched: false,
          rawProviderPayloadPersisted: false,
          hiddenChainOfThoughtPersisted: false,
          signedUrlPersisted: false,
        },
        authority: {
          candidateOnly: true,
          deterministicDnaRemainsAuthoritative: true,
          deterministicQaRequired: true,
          exactVersionApprovalRequired: true,
          targetSpecificApplicationRequired: true,
          userApprovalStillRequired: true,
        },
      }
      try {
        validateEditReferencePreferenceDnaReasoningResult(request, result)
        return result
      } catch (error) {
        const copySafetyFailure = /copy safety|copy-safety/i.test(error instanceof Error ? error.message : String(error))
        return blocked(
          request,
          copySafetyFailure ? 'copy_safety_violation' : 'runtime_response_invalid',
          copySafetyFailure
            ? 'The candidate failed deterministic copy-safety validation.'
            : 'The candidate failed its exact deterministic result contract.',
          true,
          'Correct the bounded evidence or provider response, then request a new candidate.',
          providerResult,
          receipt ? meteredUsage(receipt) : undefined,
        )
      }
    },
  }
}

function buildValidatedCandidate(
  context: QwenPreferenceDnaStructuredContext,
  response: NonNullable<QwenPreferenceDnaProviderResult['response']>,
  requiredLayerIds: readonly PreferenceDNALayerId[],
): EditReferencePreferenceDnaReasoningCandidate {
  const evidenceIds = new Set(context.evidenceItems.map((item) => item.evidenceId))
  const safetyEvidenceIds = context.evidenceItems
    .filter((item) => item.category === 'copy_safety')
    .map((item) => item.evidenceId)
  if (!safetyEvidenceIds.length) throw new CandidateValidationError('copy_safety_violation')
  const responseLayerIds = new Set(response.layers.map((layer) => layer.layerId))
  if (new Set(response.layers.map((layer) => layer.layerId)).size !== response.layers.length) {
    throw new CandidateValidationError('runtime_response_invalid')
  }
  if (requiredLayerIds.some((layerId) => layerId !== 'do_not_copy_rules' && !responseLayerIds.has(layerId))) {
    throw new CandidateValidationError('goal_layer_coverage_missing')
  }
  const linkedIds = [
    ...response.layers.flatMap((layer) => [
      ...layer.evidenceIds,
      ...layer.rules.flatMap((rule) => rule.evidenceIds),
    ]),
    ...response.contradictions.flatMap((issue) => issue.evidenceIds),
    ...response.nonTransferableDetails.flatMap((issue) => issue.evidenceIds),
  ]
  if (linkedIds.some((id) => !evidenceIds.has(id))) throw new CandidateValidationError('evidence_link_invalid')
  const unsafeTransferRules = response.layers.flatMap((layer) => layer.rules)
    .filter((rule) => ['must_follow', 'avoid'].includes(rule.kind))
  if (
    unsafeTransferRules.some((rule) => rule.kind === 'must_follow' && rule.transferability !== 'transferable')
    || detectEditReferenceCopyRisks([
      ...unsafeTransferRules.map((rule) => rule.statement),
      ...response.transferabilityRules,
      ...response.targetAdaptationRules,
    ]).length > 0
  ) throw new CandidateValidationError('copy_safety_violation')

  const layers: EditReferencePreferenceDnaReasoningLayer[] = response.layers
    .filter((layer) => layer.layerId !== 'do_not_copy_rules')
    .map((layer) => ({
      ...layer,
      evidenceIds: [...layer.evidenceIds],
      rules: layer.rules.map((rule) => ({ ...rule, evidenceIds: [...rule.evidenceIds], targetConditions: [...rule.targetConditions], deterministicSafetyRule: false })),
    }))
  const deterministicRules = createDoNotCopyPreferenceRules()
  layers.push({
    layerId: 'do_not_copy_rules',
    title: 'Do-not-copy Rules',
    summary: 'Deterministic safety rules prevent exact reference assets, identity, sequence, timing, and layouts from becoming reusable instructions.',
    evidenceIds: [...safetyEvidenceIds],
    confidence: 1,
    transferability: 'do_not_copy',
    rules: deterministicRules.map((statement) => ({
      ruleId: `preference-dna-safety-${sha256(statement).slice(0, 32)}`,
      kind: 'do_not_copy',
      statement,
      evidenceIds: [...safetyEvidenceIds],
      confidence: 1,
      transferability: 'do_not_copy',
      targetConditions: ['Always enforce this boundary before a candidate can become a persisted DNA version.'],
      deterministicSafetyRule: true,
    })),
    reviewRequired: false,
  })
  const candidate: EditReferencePreferenceDnaReasoningCandidate = {
    layers,
    contradictions: response.contradictions.map((issue) => ({ ...issue, evidenceIds: [...issue.evidenceIds] })),
    nonTransferableDetails: response.nonTransferableDetails.map((issue) => ({ ...issue, evidenceIds: [...issue.evidenceIds] })),
    transferabilityRules: [...response.transferabilityRules],
    targetAdaptationRules: [...response.targetAdaptationRules],
    doNotCopyRules: [...new Set([...deterministicRules, ...response.providerDoNotCopyRules])],
    missingEvidenceKinds: [...response.missingEvidenceKinds],
    limitations: [...response.limitations],
    overallConfidence: response.overallConfidence,
    requiresUserReview: response.requiresUserReview
      || response.contradictions.length > 0
      || response.nonTransferableDetails.length > 0
      || response.missingEvidenceKinds.length > 0,
    adaptedNotCopied: true,
  }
  return candidate
}

function blockedAfterProvider(
  request: EditReferencePreferenceDnaReasoningRequest,
  blockerCode: EditReferencePreferenceDnaReasoningBlockerCode,
  blockerMessage: string,
  retryAvailable: boolean,
  retryReason: string,
  providerResult?: QwenPreferenceDnaProviderResult,
  authorization?: EditReferencePreferenceDnaUsageAuthorization,
): EditReferencePreferenceDnaReasoningResult {
  if (request.executionScope === 'production' && authorization && (providerResult?.execution.providerCallMade ?? true)) {
    return blocked(request, 'internal_cost_usage_unverified', 'The provider attempt ended without reconciled internal-cost usage.', true, 'Reconcile the reserved provider usage before retrying.', providerResult, {
      internalCostStatus: 'unverified',
      meteredInternalCostMicros: null,
      usageEventIds: authorization.usageEventIds,
      internalCostRecordIds: authorization.internalCostRecordIds,
    })
  }
  return blocked(request, blockerCode, blockerMessage, retryAvailable, retryReason, providerResult)
}

function blocked(
  request: EditReferencePreferenceDnaReasoningRequest,
  blockerCode: EditReferencePreferenceDnaReasoningBlockerCode,
  blockerMessage: string,
  retryAvailable: boolean,
  retryReason?: string,
  providerResult?: QwenPreferenceDnaProviderResult,
  usage?: PendingUsage,
): EditReferencePreferenceDnaReasoningResult {
  return createBlockedEditReferencePreferenceDnaReasoningResult({
    request,
    blockerCode,
    blockerMessage,
    retryAvailable,
    retryReason,
    providerCallMade: providerResult?.execution.providerCallMade,
    modelCallMade: providerResult?.execution.modelCallMade,
    usage,
  })
}

function assertUsageAuthorization(value: EditReferencePreferenceDnaUsageAuthorization): void {
  assertIds(value.usageEventIds)
  assertIds(value.internalCostRecordIds)
}

function assertUsageReceipt(
  request: EditReferencePreferenceDnaReasoningRequest,
  authorization: EditReferencePreferenceDnaUsageAuthorization,
  receipt: EditReferencePreferenceDnaUsageReceipt,
  completed: boolean,
): void {
  assertUsageAuthorization(receipt)
  if (!MONEY_MICROS.test(receipt.meteredInternalCostMicros)) throw new Error('invalid_metered_internal_cost')
  if (BigInt(receipt.meteredInternalCostMicros) > BigInt(request.maximumAuthorizedInternalCostMicros as string)) throw new Error('metered_internal_cost_exceeds_authority')
  if (
    JSON.stringify(receipt.usageEventIds) !== JSON.stringify(authorization.usageEventIds)
    || JSON.stringify(receipt.internalCostRecordIds) !== JSON.stringify(authorization.internalCostRecordIds)
  ) throw new Error('usage_receipt_identity_mismatch')
  if (completed && BigInt(receipt.meteredInternalCostMicros) <= 0n) throw new Error('completed_attempt_requires_positive_cost')
}

function assertIds(values: readonly string[]): void {
  if (!values.length || values.length > 64 || new Set(values).size !== values.length || values.some((value) => !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value))) {
    throw new Error('invalid_usage_record_ids')
  }
}

function mapProviderBlocker(blockers: readonly string[]): EditReferencePreferenceDnaReasoningBlockerCode {
  const value = blockers.join(' ')
  if (/config|model_provenance|secret|base_url/i.test(value)) return 'model_routing_unavailable'
  if (/schema|response|context/i.test(value)) return 'runtime_response_invalid'
  return 'reasoning_unavailable'
}

function safeProviderBlockerMessage(result: QwenPreferenceDnaProviderResult): string {
  if (result.blockers.some((blocker) => /schema|response|context/i.test(blocker))) return 'The Preference DNA provider response failed its strict evidence or response contract.'
  if (result.blockers.some((blocker) => /config|model|secret|base_url/i.test(blocker))) return 'The reviewed Preference DNA model route or pinned provenance is unavailable.'
  return 'The bounded Preference DNA reasoning attempt did not complete.'
}

function mapCandidateError(error: unknown): EditReferencePreferenceDnaReasoningBlockerCode {
  return error instanceof CandidateValidationError ? error.code : 'runtime_response_invalid'
}

function candidateErrorMessage(code: EditReferencePreferenceDnaReasoningBlockerCode): string {
  if (code === 'copy_safety_violation') return 'The candidate contained unsafe exact-copy or transfer instructions.'
  if (code === 'evidence_link_invalid') return 'The candidate cited evidence outside the exact bounded study.'
  if (code === 'goal_layer_coverage_missing') return 'The candidate omitted a layer required by the current study goals.'
  if (code === 'transferability_invalid') return 'The candidate mixed transferable and reference-specific instructions.'
  return 'The candidate failed its strict deterministic response contract.'
}

function meteredUsage(receipt: EditReferencePreferenceDnaUsageReceipt): PendingUsage {
  return {
    internalCostStatus: 'metered',
    meteredInternalCostMicros: receipt.meteredInternalCostMicros,
    usageEventIds: [...receipt.usageEventIds],
    internalCostRecordIds: [...receipt.internalCostRecordIds],
  }
}

function currentTime(options: EditReferenceQwenPreferenceDnaAdapterOptions): string {
  return options.now?.() ?? new Date().toISOString()
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

class CandidateValidationError extends Error {
  readonly code: EditReferencePreferenceDnaReasoningBlockerCode

  constructor(code: EditReferencePreferenceDnaReasoningBlockerCode) {
    super(code)
    this.code = code
  }
}
