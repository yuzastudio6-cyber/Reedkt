import { createHash } from 'node:crypto'
import type {
  EditReferenceAggregate,
  EditReferenceRepository,
  EditReferenceRepositoryScope,
} from '../edit-references/edit-reference-repository'
import {
  EDIT_REFERENCE_STUDY_CHAT_REASONING_REQUEST_VERSION,
  createBlockedEditReferenceStudyChatReasoningResult,
  isSafeEditReferenceStudyChatReasoningText,
  type EditReferenceStudyChatReasoningRequest,
  type EditReferenceStudyChatReasoningResult,
} from '../edit-references/edit-reference-study-chat-reasoning-contract'
import {
  createEditReferenceRoutedStudyChatAdapter,
  hashEditReferenceStudyChatStructuredContext,
  type EditReferenceStudyChatProductionUsageAuthority,
} from '../edit-references/edit-reference-qwen-study-chat-adapter'
import {
  getEditReferenceReasoningRouteRetryReason,
  resolveEditReferenceReasoningRouteAuthorizationFailClosed,
  resolveEditReferenceReasoningRouteProviderFailClosed,
  type EditReferenceReasoningRouteAuthorizationResolver,
  type EditReferenceReasoningRouteProviderResolver,
} from '../edit-references/edit-reference-reasoning-route-authorization'
import {
  QWEN_STUDY_CHAT_STRUCTURED_CONTEXT_VERSION,
  createQwenStudyChatReasoningProvider,
  qwenStudyChatStructuredContextSchema,
  type EditReferenceStudyChatReasoningProvider,
  type QwenStudyChatStructuredContext,
} from './qwen-study-chat-reasoning-provider'

export interface EditReferenceStudyChatReasoningServiceInput {
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly expectedStudyRevision: number
  readonly clientMessageId: string
  readonly userMessage: string
  readonly executionScope: 'controlled_test' | 'production'
  readonly approvedUsageEstimateId: string | null
  readonly internalCostBudgetId: string | null
  readonly immutableRateCardSnapshotId: string | null
  readonly maximumAuthorizedInternalCostMicros: string | null
}

export interface EditReferenceStudyChatReasoningService {
  readonly integrationState: 'backend_read_only_not_publicly_wired'
  respond(input: EditReferenceStudyChatReasoningServiceInput): Promise<EditReferenceStudyChatReasoningResult>
}

export interface EditReferenceStudyChatReasoningServiceOptions {
  readonly repository: EditReferenceRepository
  readonly scope: EditReferenceRepositoryScope
  readonly provider?: EditReferenceStudyChatReasoningProvider
  readonly resolveReasoningRouteAuthorization?: EditReferenceReasoningRouteAuthorizationResolver<EditReferenceStudyChatReasoningRequest>
  readonly resolveReasoningProvider?: EditReferenceReasoningRouteProviderResolver<EditReferenceStudyChatReasoningProvider>
  readonly productionUsageAuthority?: EditReferenceStudyChatProductionUsageAuthority
  readonly now?: () => string
  readonly createExecutionId?: () => string
}

export interface PreparedEditReferenceStudyChatReasoning {
  readonly request: EditReferenceStudyChatReasoningRequest
  readonly structuredContext: QwenStudyChatStructuredContext
}

const MAX_CONTEXT_CHARACTERS = 32_000
const MAX_RECENT_MESSAGES = 8
const MAX_MESSAGE_EXCERPT_CHARACTERS = 800
const MAX_EVIDENCE_ITEMS = 16
const MAX_EVIDENCE_SUMMARY_CHARACTERS = 700
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/

export function createEditReferenceStudyChatReasoningService(
  options: EditReferenceStudyChatReasoningServiceOptions,
): EditReferenceStudyChatReasoningService {
  return {
    integrationState: 'backend_read_only_not_publicly_wired',
    async respond(input): Promise<EditReferenceStudyChatReasoningResult> {
      validateEditReferenceStudyChatReasoningServiceInput(input)
      const aggregate = await options.repository.read(options.scope)
      const prepared = prepareEditReferenceStudyChatReasoning({
        aggregate,
        scope: options.scope,
        input,
      })
      const reasoningRouteAuthorization = prepared.request.executionScope === 'production'
        ? await resolveEditReferenceReasoningRouteAuthorizationFailClosed({
            resolver: options.resolveReasoningRouteAuthorization,
            request: prepared.request,
          })
        : undefined
      const provider = prepared.request.executionScope === 'production'
        ? await resolveEditReferenceReasoningRouteProviderFailClosed({
            authorization: reasoningRouteAuthorization,
            resolver: options.resolveReasoningProvider,
            qwenFallbackProvider: options.provider ?? createQwenStudyChatReasoningProvider(),
          })
        : options.provider ?? createQwenStudyChatReasoningProvider()
      if (prepared.request.executionScope === 'production' && (!reasoningRouteAuthorization || !provider)) {
        return createBlockedEditReferenceStudyChatReasoningResult({
          request: prepared.request,
          blockerCode: 'model_routing_unavailable',
          blockerMessage: 'The exact shared reasoning route or its authorized lane provider is unavailable.',
          retryAvailable: true,
          retryReason: reasoningRouteAuthorization
            ? getEditReferenceReasoningRouteRetryReason(reasoningRouteAuthorization.routeId)
            : 'Restore the exact Kimi-primary route/provider authority before retrying.',
        })
      }
      return createEditReferenceRoutedStudyChatAdapter({
        provider: provider as EditReferenceStudyChatReasoningProvider,
        structuredContext: prepared.structuredContext,
        reasoningRouteAuthorization,
        expectedReasoningRouteId: reasoningRouteAuthorization?.routeId ?? 'qwen_3_7_fallback',
        productionUsageAuthority: options.productionUsageAuthority,
        now: options.now,
        createExecutionId: options.createExecutionId,
      }).respond(prepared.request)
    },
  }
}

export function prepareEditReferenceStudyChatReasoning(input: {
  readonly aggregate: EditReferenceAggregate | null | undefined
  readonly scope: EditReferenceRepositoryScope
  readonly input: EditReferenceStudyChatReasoningServiceInput
}): PreparedEditReferenceStudyChatReasoning {
  validateEditReferenceStudyChatReasoningServiceInput(input.input)
  const { aggregate } = input
  if (!aggregate) throw new StudyChatReasoningServiceError('The private Edit Reference study does not exist.')
  if (aggregate.workspaceId !== input.scope.workspaceId || aggregate.ownerUserId !== input.scope.ownerUserId) {
    throw new StudyChatReasoningServiceError('The private Edit Reference authority does not match the requested actor and workspace.')
  }
  const reference = aggregate.references.find((record) => record.id === input.input.editReferenceId)
  const study = aggregate.studies.find((record) => record.id === input.input.studySessionId)
  if (!reference || !study || study.editReferenceId !== reference.id || reference.currentStudyId !== study.id) {
    throw new StudyChatReasoningServiceError('The requested Edit Reference study identity is invalid.')
  }
  if (reference.status === 'archived' || study.status === 'archived') {
    throw new StudyChatReasoningServiceError('Archived Edit Reference studies cannot request reasoning.')
  }
  if (study.revision !== input.input.expectedStudyRevision) {
    throw new StudyChatReasoningServiceError('The Study Chat reasoning request is stale. Reload the current study revision.')
  }

  const structuredContext = buildEditReferenceStudyChatStructuredContext({
    aggregate,
    referenceId: reference.id,
    studyId: study.id,
    userMessage: input.input.userMessage,
  })
  const request: EditReferenceStudyChatReasoningRequest = {
    schemaVersion: EDIT_REFERENCE_STUDY_CHAT_REASONING_REQUEST_VERSION,
    workspaceId: input.scope.workspaceId,
    actorUserId: input.scope.ownerUserId,
    editReferenceId: reference.id,
    studySessionId: study.id,
    expectedStudyRevision: study.revision,
    clientMessageDigestSha256: createHash('sha256').update(input.input.clientMessageId).digest('hex'),
    structuredContextDigestSha256: hashEditReferenceStudyChatStructuredContext(structuredContext),
    maxContextCharacters: MAX_CONTEXT_CHARACTERS,
    executionScope: input.input.executionScope,
    approvedUsageEstimateId: input.input.approvedUsageEstimateId,
    internalCostBudgetId: input.input.internalCostBudgetId,
    immutableRateCardSnapshotId: input.input.immutableRateCardSnapshotId,
    maximumAuthorizedInternalCostMicros: input.input.maximumAuthorizedInternalCostMicros,
    rawMediaInputAllowed: false,
    rawTranscriptInputAllowed: false,
    projectChatHistoryInputAllowed: false,
    externalUrlFetchAllowed: false,
    exactReferenceWordingTransferAllowed: false,
    exactReferenceSequenceTransferAllowed: false,
    exactReferenceTimingTransferAllowed: false,
    referenceIdentityTransferAllowed: false,
    evidenceMutationAllowed: false,
    dnaMutationAllowed: false,
    approvalMutationAllowed: false,
    targetOperationCreationAllowed: false,
    customerPriceCalculationAllowed: false,
    customerCreditMutationAllowed: false,
    serviceFeeCalculationAllowed: false,
  }
  return { request, structuredContext }
}

export function buildEditReferenceStudyChatStructuredContext(input: {
  readonly aggregate: EditReferenceAggregate
  readonly referenceId: string
  readonly studyId: string
  readonly userMessage: string
  readonly excludedMessageIds?: readonly string[]
  readonly excludedEvidenceIds?: readonly string[]
  readonly currentStateOverride?: QwenStudyChatStructuredContext['currentState']
}): QwenStudyChatStructuredContext {
  const study = input.aggregate.studies.find((record) => record.id === input.studyId)
  const reference = input.aggregate.references.find((record) => record.id === input.referenceId)
  if (!study || !reference) throw new StudyChatReasoningServiceError('The Study Chat reasoning source is incomplete.')

  const excludedMessageIds = new Set(input.excludedMessageIds ?? [])
  const studyMessages = input.aggregate.messages
    .filter((record) => record.studySessionId === study.id && !excludedMessageIds.has(record.id))
    .sort((left, right) => left.sequence - right.sequence)
  const unsafeMessages = studyMessages.filter((record) => !isSafeEditReferenceStudyChatReasoningText(record.content, 8_000))
  const safeMessages = studyMessages.filter((record) => isSafeEditReferenceStudyChatReasoningText(record.content, 8_000))
  const selectedMessages = safeMessages.slice(-MAX_RECENT_MESSAGES)

  const excludedEvidenceIds = new Set(input.excludedEvidenceIds ?? [])
  const contextEvidence = input.aggregate.evidence
    .filter((record) => !excludedEvidenceIds.has(record.id))
  const supersededEvidenceIds = new Set(contextEvidence
    .filter((record) => record.studySessionId === study.id && record.supersedesEvidenceId)
    .map((record) => record.supersedesEvidenceId as string))
  const activeEvidence = contextEvidence
    .filter((record) => record.studySessionId === study.id && !supersededEvidenceIds.has(record.id))
    .sort((left, right) => right.revision - left.revision || right.updatedAt.localeCompare(left.updatedAt) || left.id.localeCompare(right.id))
  const unsafeEvidence = activeEvidence.filter((record) => !isSafeEditReferenceStudyChatReasoningText(record.summary, MAX_EVIDENCE_SUMMARY_CHARACTERS))
  const safeEvidence = activeEvidence.filter((record) => isSafeEditReferenceStudyChatReasoningText(record.summary, MAX_EVIDENCE_SUMMARY_CHARACTERS))
  const selectedEvidence = safeEvidence.slice(0, MAX_EVIDENCE_ITEMS)

  const context: QwenStudyChatStructuredContext = {
    schemaVersion: QWEN_STUDY_CHAT_STRUCTURED_CONTEXT_VERSION,
    userMessage: input.userMessage.trim(),
    initialGoals: [...study.initialGoals],
    currentState: input.currentStateOverride ?? {
      referenceStatus: reference.status,
      studyStatus: study.status,
      evidenceStatus: study.evidenceStatus,
      dnaStatus: study.dnaStatus,
      qaStatus: study.qaStatus,
    },
    recentMessages: selectedMessages.map((message) => ({
      role: message.role,
      runtimeSource: message.runtimeSource,
      contentExcerpt: message.content.length > MAX_MESSAGE_EXCERPT_CHARACTERS
        ? message.content.slice(0, MAX_MESSAGE_EXCERPT_CHARACTERS).trimEnd()
        : message.content,
      truncated: message.content.length > MAX_MESSAGE_EXCERPT_CHARACTERS,
    })),
    evidenceItems: selectedEvidence.map((evidence) => ({
      evidenceId: evidence.id,
      category: evidence.category,
      sourceType: evidence.sourceType,
      summary: evidence.summary,
      confidence: evidence.confidence,
      transferability: evidence.transferability,
      requiresUserReview: ['requires_user_review', 'unknown', 'do_not_copy'].includes(evidence.transferability),
    })),
    omittedContext: {
      olderMessageCount: Math.max(0, safeMessages.length - selectedMessages.length),
      unsafeMessageCount: unsafeMessages.length,
      lowerPriorityEvidenceCount: Math.max(0, safeEvidence.length - selectedEvidence.length),
      unsafeEvidenceCount: unsafeEvidence.length,
    },
    boundaries: {
      userContentIsUntrustedData: true,
      onlyCurrentStudyContextAllowed: true,
      projectChatHistoryAllowed: false,
      rawMediaAllowed: false,
      rawTranscriptAllowed: false,
      externalUrlFetchAllowed: false,
      exactReferenceWordingTransferAllowed: false,
      exactReferenceSequenceTransferAllowed: false,
      exactReferenceTimingTransferAllowed: false,
      referenceIdentityTransferAllowed: false,
      evidenceMutationAllowed: false,
      dnaMutationAllowed: false,
      approvalMutationAllowed: false,
      targetOperationCreationAllowed: false,
      userApprovalRequired: true,
    },
  }
  const parsed = qwenStudyChatStructuredContextSchema.parse(context)
  if (JSON.stringify(parsed).length > MAX_CONTEXT_CHARACTERS) {
    throw new StudyChatReasoningServiceError('The bounded Study Chat reasoning context exceeds its private context limit.')
  }
  return parsed
}

export function validateEditReferenceStudyChatReasoningServiceInput(
  input: EditReferenceStudyChatReasoningServiceInput,
): void {
  if (
    !ID_PATTERN.test(input.editReferenceId)
    || !ID_PATTERN.test(input.studySessionId)
    || typeof input.clientMessageId !== 'string'
    || input.clientMessageId.trim().length < 1
    || input.clientMessageId.length > 160
    || !Number.isSafeInteger(input.expectedStudyRevision)
    || input.expectedStudyRevision < 1
    || !isSafeEditReferenceStudyChatReasoningText(input.userMessage, 8_000)
  ) throw new StudyChatReasoningServiceError('The bounded Study Chat reasoning input is invalid or unsafe.')
}

export class StudyChatReasoningServiceError extends Error {}
