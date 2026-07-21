import { createHash, randomUUID } from 'node:crypto'
import { detectEditReferenceCopyRisks } from './edit-reference-copy-safety'
import {
  EDIT_REFERENCE_STUDY_CHAT_REASONING_RESULT_VERSION,
  createBlockedEditReferenceStudyChatReasoningResult,
  hashEditReferenceStudyChatReasoningRequest,
  validateEditReferenceStudyChatReasoningRequest,
  validateEditReferenceStudyChatReasoningResult,
  type EditReferenceAnsweredStudyChatReasoningResult,
  type EditReferenceStudyChatReasoningBlockerCode,
  type EditReferenceStudyChatReasoningRequest,
  type EditReferenceStudyChatReasoningResult,
} from './edit-reference-study-chat-reasoning-contract'
import {
  qwenStudyChatStructuredContextSchema,
  type QwenStudyChatProviderResult,
  type QwenStudyChatReasoningProvider,
  type QwenStudyChatStructuredContext,
} from '../services/qwen-study-chat-reasoning-provider'
import {
  getEditReferenceReasoningRouteDisplayName,
  getEditReferenceReasoningRouteRetryReason,
  validateEditReferenceReasoningRouteAuthorization,
  type EditReferenceReasoningRouteAuthorization,
  type EditReferenceReasoningRouteId,
} from './edit-reference-reasoning-route-authorization'

export const EDIT_REFERENCE_QWEN_STUDY_CHAT_ADAPTER_ID =
  'edit_reference_qwen_study_chat_adapter' as const
export const EDIT_REFERENCE_QWEN_STUDY_CHAT_ADAPTER_VERSION = 'v1' as const
export const EDIT_REFERENCE_ROUTED_STUDY_CHAT_ADAPTER_ID =
  'edit_reference_routed_study_chat_adapter' as const
export const EDIT_REFERENCE_ROUTED_STUDY_CHAT_ADAPTER_VERSION = 'v1' as const

export interface EditReferenceStudyChatUsageAuthorization {
  readonly usageEventIds: readonly string[]
  readonly internalCostRecordIds: readonly string[]
}

export interface EditReferenceStudyChatUsageReceipt
  extends EditReferenceStudyChatUsageAuthorization {
  readonly meteredInternalCostMicros: string
}

export interface EditReferenceStudyChatProductionUsageAuthority {
  authorize(
    request: EditReferenceStudyChatReasoningRequest,
  ): Promise<EditReferenceStudyChatUsageAuthorization>
  reconcile(input: {
    readonly request: EditReferenceStudyChatReasoningRequest
    readonly providerResult: QwenStudyChatProviderResult
    readonly authorization: EditReferenceStudyChatUsageAuthorization
  }): Promise<EditReferenceStudyChatUsageReceipt>
}

export interface EditReferenceQwenStudyChatAdapterOptions {
  readonly provider: QwenStudyChatReasoningProvider
  readonly structuredContext: QwenStudyChatStructuredContext
  readonly reasoningRouteAuthorization?: EditReferenceReasoningRouteAuthorization
  readonly productionUsageAuthority?: EditReferenceStudyChatProductionUsageAuthority
  readonly now?: () => string
  readonly createExecutionId?: () => string
}

export interface EditReferenceRoutedStudyChatAdapterOptions
  extends EditReferenceQwenStudyChatAdapterOptions {
  readonly expectedReasoningRouteId: EditReferenceReasoningRouteId
  readonly adapterId?: string
  readonly adapterVersion?: string
}

export interface EditReferenceStudyChatReasoningAdapter {
  readonly adapterId: string
  readonly adapterVersion: string
  respond(request: EditReferenceStudyChatReasoningRequest): Promise<EditReferenceStudyChatReasoningResult>
}

interface PendingUsage {
  readonly internalCostStatus: 'metered' | 'unverified'
  readonly meteredInternalCostMicros: string | null
  readonly usageEventIds: readonly string[]
  readonly internalCostRecordIds: readonly string[]
}

const MONEY_MICROS = /^(?:0|[1-9][0-9]{0,15})$/
const EXACT_COPY_LANGUAGE = /\b(?:copy|replicate|recreate|verbatim|same exact|match exactly|retain exact|preserve exact|shot[- ]for[- ]shot)\b/i
const UNSAFE_OUTPUT = /https?:\/\/|file:\/\/|(?:^|[\s"'`])\/(?:Users|Volumes|home|private|tmp|var)\/|signed[_ -]?url|authorization|bearer\s+|service[_ -]?role|api[_ -]?key|private[_ -]?key|password|credential/i

export function hashEditReferenceStudyChatStructuredContext(
  context: QwenStudyChatStructuredContext,
): string {
  const parsed = qwenStudyChatStructuredContextSchema.parse(context)
  return createHash('sha256').update(JSON.stringify(parsed)).digest('hex')
}

export function createEditReferenceQwenStudyChatAdapter(
  options: EditReferenceQwenStudyChatAdapterOptions,
): EditReferenceStudyChatReasoningAdapter {
  return createEditReferenceRoutedStudyChatAdapter({
    ...options,
    expectedReasoningRouteId: 'qwen_3_7_fallback',
    adapterId: EDIT_REFERENCE_QWEN_STUDY_CHAT_ADAPTER_ID,
    adapterVersion: EDIT_REFERENCE_QWEN_STUDY_CHAT_ADAPTER_VERSION,
  })
}

export function createEditReferenceRoutedStudyChatAdapter(
  options: EditReferenceRoutedStudyChatAdapterOptions,
): EditReferenceStudyChatReasoningAdapter {
  const adapterId = options.adapterId ?? EDIT_REFERENCE_ROUTED_STUDY_CHAT_ADAPTER_ID
  const adapterVersion = options.adapterVersion ?? EDIT_REFERENCE_ROUTED_STUDY_CHAT_ADAPTER_VERSION
  return {
    adapterId,
    adapterVersion,
    async respond(request): Promise<EditReferenceStudyChatReasoningResult> {
      validateEditReferenceStudyChatReasoningRequest(request)
      const startedAt = now(options)
      const executionId = options.createExecutionId?.()
        ?? `edit-reference-study-chat-${randomUUID()}`
      let providerResult: QwenStudyChatProviderResult | undefined
      let authorization: EditReferenceStudyChatUsageAuthorization | undefined
      let receipt: EditReferenceStudyChatUsageReceipt | undefined

      try {
        const parsedContext = qwenStudyChatStructuredContextSchema.parse(options.structuredContext)
        if (
          JSON.stringify(parsedContext).length > request.maxContextCharacters
          || hashEditReferenceStudyChatStructuredContext(parsedContext) !== request.structuredContextDigestSha256
        ) return blocked(request, 'context_authority_unverified', 'The bounded Study Chat context does not match the exact request.', false)

        if (request.executionScope !== 'production') {
          return blocked(
            request,
            'cost_authority_unavailable',
            'Qwen Study Chat reasoning cannot run under an unmetered controlled-test request.',
            true,
            'Retry only through an approved production estimate, internal-cost budget, immutable rate card, and durable usage attempt.',
          )
        }
        const routeAuthorization = validateEditReferenceReasoningRouteAuthorization({
          authorization: options.reasoningRouteAuthorization,
          expectedLane: 'study_chat',
          expectedRouteId: options.expectedReasoningRouteId,
          requestDigestSha256: hashEditReferenceStudyChatReasoningRequest(request),
          costAuthority: request,
        })
        if (!routeAuthorization.ok) {
          return blocked(
            request,
            'model_routing_unavailable',
            `${getEditReferenceReasoningRouteDisplayName(options.expectedReasoningRouteId)} Study Chat reasoning lacks exact shared-route authority.`,
            true,
            getEditReferenceReasoningRouteRetryReason(options.expectedReasoningRouteId),
          )
        }
        if (!options.productionUsageAuthority) {
          return blocked(
            request,
            'cost_authority_unavailable',
            'Canonical internal-cost authority is unavailable, so no Study Chat provider call was made.',
            true,
            'Restore the exact estimate, budget, rate card, and attempt-level usage authority before retrying.',
          )
        }
        try {
          authorization = await options.productionUsageAuthority.authorize(request)
          assertUsageAuthorization(authorization)
        } catch {
          return blocked(
            request,
            'cost_authority_unavailable',
            'Canonical internal-cost authority did not authorize this exact Study Chat request.',
            true,
            'Refresh the exact approved estimate and immutable cost authority before retrying.',
          )
        }

        providerResult = await options.provider.respond(parsedContext)
        if (
          providerResult.execution.providerCallMade
          || providerResult.execution.modelCallMade
          || providerResult.status === 'completed'
        ) {
          try {
            receipt = await options.productionUsageAuthority.reconcile({
              request,
              providerResult,
              authorization,
            })
            assertUsageReceipt(request, authorization, receipt, providerResult.status === 'completed')
          } catch {
            return blocked(
              request,
              'internal_cost_usage_unverified',
              'The Study Chat reasoning attempt ran, but canonical internal-cost usage could not be reconciled.',
              false,
              undefined,
              providerResult,
              {
                internalCostStatus: 'unverified',
                meteredInternalCostMicros: null,
                usageEventIds: authorization.usageEventIds,
                internalCostRecordIds: authorization.internalCostRecordIds,
              },
            )
          }
        }

        if (providerResult.status !== 'completed' || !receipt) {
          return blocked(
            request,
            mapProviderBlocker(providerResult.blockers),
            safeProviderBlockerMessage(providerResult),
            true,
            'Retry after the reviewed Study Chat reasoning route and durable usage authority are restored.',
            providerResult,
            receipt ? meteredUsage(receipt) : undefined,
          )
        }
        return buildAnsweredResult({
          request,
          context: parsedContext,
          providerResult,
          receipt,
          executionId,
          startedAt,
          completedAt: now(options),
          adapterId,
          adapterVersion,
          routeAuthorization: options.reasoningRouteAuthorization as EditReferenceReasoningRouteAuthorization,
        })
      } catch (error) {
        const usage = receipt
          ? meteredUsage(receipt)
          : authorization && providerResult?.execution.providerCallMade
            ? {
                internalCostStatus: 'unverified' as const,
                meteredInternalCostMicros: null,
                usageEventIds: authorization.usageEventIds,
                internalCostRecordIds: authorization.internalCostRecordIds,
              }
            : undefined
        return blocked(
          request,
          error instanceof StudyChatAdapterError ? error.blockerCode : 'runtime_response_invalid',
          error instanceof StudyChatAdapterError
            ? error.safeMessage
            : 'The bounded Study Chat reasoning result failed its strict safety contract.',
          false,
          undefined,
          providerResult,
          usage,
        )
      }
    },
  }
}

function buildAnsweredResult(input: {
  readonly request: EditReferenceStudyChatReasoningRequest
  readonly context: QwenStudyChatStructuredContext
  readonly providerResult: QwenStudyChatProviderResult
  readonly receipt: EditReferenceStudyChatUsageReceipt
  readonly executionId: string
  readonly startedAt: string
  readonly completedAt: string
  readonly adapterId: string
  readonly adapterVersion: string
  readonly routeAuthorization: EditReferenceReasoningRouteAuthorization
}): EditReferenceAnsweredStudyChatReasoningResult {
  const { request, context, providerResult } = input
  const response = providerResult.response
  const provenance = providerResult.runtimeProvenance
  if (!response || !provenance || !providerResult.execution.providerCallMade || !providerResult.execution.modelCallMade) {
    throw new StudyChatAdapterError('runtime_response_invalid', 'Study Chat reasoning lacks a reviewed response or model provenance.')
  }
  if (
    provenance.runtimeSource !== 'verified_live'
    || provenance.modelId !== input.routeAuthorization.exactProviderModelId
  ) {
    throw new StudyChatAdapterError(
      'runtime_response_invalid',
      'Study Chat reasoning provenance does not match the exact authorized model route.',
    )
  }
  const outputText = [response.assistantMessage, ...response.clarificationQuestions, ...response.missingEvidenceKinds]
  if (
    outputText.some((value) => UNSAFE_OUTPUT.test(value))
    || outputText.some((value) => EXACT_COPY_LANGUAGE.test(value))
    || detectEditReferenceCopyRisks(outputText).length > 0
  ) throw new StudyChatAdapterError('copy_safety_violation', 'Study Chat reasoning returned unsafe copy, identity, path, URL, or secret-oriented content.')
  const allowedEvidenceIds = new Set(context.evidenceItems.map((item) => item.evidenceId))
  if (
    new Set(response.citedEvidenceIds).size !== response.citedEvidenceIds.length
    || response.citedEvidenceIds.some((id) => !allowedEvidenceIds.has(id))
  ) throw new StudyChatAdapterError('runtime_response_invalid', 'Study Chat reasoning cited evidence outside the exact bounded context.')

  const result: EditReferenceAnsweredStudyChatReasoningResult = {
    schemaVersion: EDIT_REFERENCE_STUDY_CHAT_REASONING_RESULT_VERSION,
    requestDigestSha256: hashEditReferenceStudyChatReasoningRequest(request),
    status: 'answered',
    runtimeSource: 'verified_live',
    workspaceId: request.workspaceId,
    actorUserId: request.actorUserId,
    editReferenceId: request.editReferenceId,
    studySessionId: request.studySessionId,
    studyRevision: request.expectedStudyRevision,
    answer: {
      responseKind: response.responseKind,
      assistantMessage: response.assistantMessage,
      clarificationQuestions: [...response.clarificationQuestions],
      citedEvidenceIds: [...response.citedEvidenceIds],
      suggestedNextStep: response.suggestedNextStep,
      missingEvidenceKinds: [...response.missingEvidenceKinds],
    },
    execution: {
      structuredContextRead: true,
      providerCallMade: true,
      modelCallMade: true,
      workerJobCreated: false,
      remoteMutationMade: false,
      evidenceMutationMade: false,
      dnaMutationMade: false,
      approvalMutationMade: false,
      targetOperationCreated: false,
    },
    model: {
      adapterId: input.adapterId,
      adapterVersion: input.adapterVersion,
      providerId: provenance.providerId,
      modelId: provenance.modelId,
      modelRevision: provenance.modelRevision,
      modelAggregateSha256: provenance.modelAggregateSha256,
      modelRoutingPolicyVersion: input.routeAuthorization.canonicalRouteContractVersion,
      reasoningInstructionDigestSha256: provenance.reasoningInstructionDigestSha256,
    },
    provenance: {
      executionId: input.executionId,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
    },
    usage: {
      mode: 'production_metered',
      approvedUsageEstimateId: request.approvedUsageEstimateId as string,
      internalCostBudgetId: request.internalCostBudgetId as string,
      immutableRateCardSnapshotId: request.immutableRateCardSnapshotId as string,
      maximumAuthorizedInternalCostMicros: request.maximumAuthorizedInternalCostMicros as string,
      meteredInternalCostMicros: input.receipt.meteredInternalCostMicros,
      usageEventIds: [...input.receipt.usageEventIds],
      internalCostRecordIds: [...input.receipt.internalCostRecordIds],
      customerPriceCalculated: false,
      customerCreditsMutated: false,
      serviceFeeIncluded: false,
    },
    privacy: {
      rawMediaRead: false,
      rawTranscriptRead: false,
      projectChatHistoryRead: false,
      externalUrlFetched: false,
      rawProviderPayloadPersisted: false,
      hiddenChainOfThoughtPersisted: false,
      signedUrlPersisted: false,
    },
    transferBoundary: {
      exactReferenceWordingRetained: false,
      exactReferenceSequenceInstructionCreated: false,
      exactReferenceTimingInstructionCreated: false,
      referenceIdentityInstructionCreated: false,
      responseMayMutateStudyState: false,
      responseMayBecomeTargetInstructionWithoutApplication: false,
      userApprovalStillRequired: true,
    },
  }
  validateEditReferenceStudyChatReasoningResult(request, result)
  return result
}

function blocked(
  request: EditReferenceStudyChatReasoningRequest,
  blockerCode: EditReferenceStudyChatReasoningBlockerCode,
  blockerMessage: string,
  retryAvailable: boolean,
  retryReason?: string,
  providerResult?: QwenStudyChatProviderResult,
  usage?: PendingUsage,
): EditReferenceStudyChatReasoningResult {
  return createBlockedEditReferenceStudyChatReasoningResult({
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

function assertUsageAuthorization(value: EditReferenceStudyChatUsageAuthorization): void {
  assertIdList(value.usageEventIds)
  assertIdList(value.internalCostRecordIds)
}

function assertUsageReceipt(
  request: EditReferenceStudyChatReasoningRequest,
  authorization: EditReferenceStudyChatUsageAuthorization,
  receipt: EditReferenceStudyChatUsageReceipt,
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
  if (completed && BigInt(receipt.meteredInternalCostMicros) <= 0n) {
    throw new Error('completed_attempt_requires_positive_cost')
  }
}

function assertIdList(values: readonly string[]): void {
  if (
    values.length < 1
    || values.length > 64
    || new Set(values).size !== values.length
    || values.some((value) => !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value))
  ) throw new Error('invalid_usage_record_ids')
}

function mapProviderBlocker(blockers: readonly string[]): EditReferenceStudyChatReasoningBlockerCode {
  const value = blockers.join(' ')
  if (/config|model_provenance|secret|missing_beta|base_url/i.test(value)) return 'model_routing_unavailable'
  if (/schema|response|context/i.test(value)) return 'runtime_response_invalid'
  return 'reasoning_unavailable'
}

function safeProviderBlockerMessage(result: QwenStudyChatProviderResult): string {
  if (result.blockers.some((blocker) => /schema|response|context/i.test(blocker))) {
    return 'The Study Chat provider response failed its strict context or response contract.'
  }
  if (result.blockers.some((blocker) => /config|model|secret|base_url/i.test(blocker))) {
    return 'The reviewed Study Chat reasoning route or pinned model provenance is unavailable.'
  }
  return 'The bounded Study Chat reasoning attempt did not complete.'
}

function meteredUsage(receipt: EditReferenceStudyChatUsageReceipt): PendingUsage {
  return {
    internalCostStatus: 'metered',
    meteredInternalCostMicros: receipt.meteredInternalCostMicros,
    usageEventIds: [...receipt.usageEventIds],
    internalCostRecordIds: [...receipt.internalCostRecordIds],
  }
}

function now(options: EditReferenceQwenStudyChatAdapterOptions): string {
  return options.now?.() ?? new Date().toISOString()
}

class StudyChatAdapterError extends Error {
  readonly blockerCode: EditReferenceStudyChatReasoningBlockerCode
  readonly safeMessage: string

  constructor(
    blockerCode: EditReferenceStudyChatReasoningBlockerCode,
    safeMessage: string,
  ) {
    super(safeMessage)
    this.blockerCode = blockerCode
    this.safeMessage = safeMessage
  }
}
