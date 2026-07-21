import { ApiError } from '../errors/api-error'
import type { RuntimeEnv, E2ERuntimeMode } from '../config/env'
import type {
  AppendPreferenceStudyMessageRequest,
  EditReferenceMessageData,
} from '../../src/types/edit-reference'
import type {
  EditReferenceService,
  EditReferenceServiceResult,
} from './edit-reference-service'
import {
  EDIT_REFERENCE_REASONING_ROUTE_IDS,
  REEDITPRO_SHARED_REASONING_ROUTE_CONTRACT_VERSION,
} from '../edit-references/edit-reference-reasoning-route-authorization'
import {
  EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
} from '../edit-references/edit-reference-production-persistence-contract'
import {
  EDIT_REFERENCE_PRODUCTION_GATE_DEFINITIONS,
} from '../edit-references/edit-reference-production-readiness'

export const EDIT_REFERENCE_STUDY_CHAT_RUNTIME_PORT_VERSION =
  'edit-reference-study-chat-runtime-port-v2' as const

export type EditReferenceStudyChatRuntimeClass =
  | 'controlled_private_fixture'
  | 'canonical_backend_verified_runtime'

export type EditReferenceStudyChatRuntimeEvidenceClass =
  | 'controlled_contract_fixture_unreleased'
  | 'canonical_same_release_live_runtime'

export type EditReferenceStudyChatCanonicalAuthority = Pick<
  EditReferenceService,
  | 'getReference'
  | 'getStudy'
  | 'getStudyChatReasoningAttempt'
  | 'listStudyChatReasoningAttempts'
  | 'appendMessage'
  | 'prepareStudyChatReasoning'
  | 'reserveStudyChatReasoningAttempt'
  | 'startStudyChatReasoningAttempt'
  | 'reserveStudyChatProviderRequest'
  | 'authorizeStudyChatProviderSubmission'
  | 'reconcileStudyChatProviderRequest'
  | 'scheduleStudyChatProviderCheckback'
  | 'registerStudyChatProviderWorkflow'
  | 'settleStudyChatReasoningAttempt'
>

export interface EditReferenceStudyChatRuntimePortInput {
  readonly studyId: string
  readonly request: AppendPreferenceStudyMessageRequest
  readonly idempotencyKey: string
  readonly authority: EditReferenceStudyChatCanonicalAuthority
}

/**
 * One server-only mounted Study Chat execution seam. A live adapter must use
 * the supplied canonical authority; it may not create another message,
 * evidence, attempt, provider-request, checkback, workflow, or cost store.
 */
export interface EditReferenceStudyChatRuntimePort {
  readonly schemaVersion: typeof EDIT_REFERENCE_STUDY_CHAT_RUNTIME_PORT_VERSION
  readonly persistenceContractVersion: typeof EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION
  readonly authorityClass: 'canonical_edit_reference_study_chat_reasoning'
  readonly runtimeClass: EditReferenceStudyChatRuntimeClass
  readonly evidenceClass: EditReferenceStudyChatRuntimeEvidenceClass
  readonly sourceAuthority: 'canonical_edit_reference_repository'
  readonly publicRouteAvailable: true
  readonly canonicalAttemptAuthority: true
  readonly canonicalProviderLifecycleAuthority: true
  readonly canonicalInternalCostAuthority: true
  readonly reasoningRouteContractVersion: typeof REEDITPRO_SHARED_REASONING_ROUTE_CONTRACT_VERSION
  readonly reasoningRouteOrder: typeof EDIT_REFERENCE_REASONING_ROUTE_IDS
  readonly qwenVisualSpecialistSubstituted: false
  readonly providerCallOutsideRepositoryTransaction: true
  readonly savedUserDirectionSurvivesProviderFailure: true
  readonly noSecondMessageOrEvidenceStore: true
  readonly noBrowserProviderAuthority: true
  readonly canonicalRepositoryRpcVerified: boolean
  readonly durableMultiAttemptReasoningRunVerified: boolean
  readonly multiReplicaCheckbackRecoveryVerified: boolean
  readonly liveProviderDispatchVerified: boolean
  readonly liveUsageAndCostSettlementVerified: boolean
  readonly sameReleaseReadinessEvidenceVerified: boolean
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
  readonly productionAuthority: boolean
  appendMessage(
    input: EditReferenceStudyChatRuntimePortInput,
  ): Promise<EditReferenceServiceResult<EditReferenceMessageData>>
}

// V2 has no public qualification function. A later reviewed live adapter must
// be introduced in this module with same-release evidence before any instance
// can enter this set. Caller-asserted booleans cannot promote a port.
const qualifiedProductionRuntimePorts = new WeakSet<EditReferenceStudyChatRuntimePort>()

export async function appendMountedEditReferenceStudyChatMessage(input: {
  readonly env: RuntimeEnv
  readonly port?: EditReferenceStudyChatRuntimePort
  readonly authority: EditReferenceStudyChatCanonicalAuthority
  readonly studyId: string
  readonly request: AppendPreferenceStudyMessageRequest
  readonly idempotencyKey: string
}): Promise<EditReferenceServiceResult<EditReferenceMessageData>> {
  const hosted = isHostedRuntime(input.env.nodeEnv, input.env.mode)
  if (!input.port) {
    if (hosted) {
      throw runtimeUnavailable(
        'The canonical Study Chat reasoning runtime is not mounted. Your message was not submitted; retry after the service is restored.',
        'canonical_study_chat_runtime_missing',
      )
    }
    return input.authority.appendMessage(input.studyId, input.request, input.idempotencyKey)
  }
  assertPortContract(input.port, hosted)
  const result = await input.port.appendMessage({
    studyId: input.studyId,
    request: input.request,
    idempotencyKey: input.idempotencyKey,
    authority: input.authority,
  })
  assertMountedResult(result, input.studyId, input.request, hosted)
  return result
}

function assertPortContract(port: EditReferenceStudyChatRuntimePort, hosted: boolean): void {
  if (
    port.schemaVersion !== EDIT_REFERENCE_STUDY_CHAT_RUNTIME_PORT_VERSION
    || port.persistenceContractVersion !== EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION
    || port.authorityClass !== 'canonical_edit_reference_study_chat_reasoning'
    || port.sourceAuthority !== 'canonical_edit_reference_repository'
    || port.publicRouteAvailable !== true
    || port.canonicalAttemptAuthority !== true
    || port.canonicalProviderLifecycleAuthority !== true
    || port.canonicalInternalCostAuthority !== true
    || port.reasoningRouteContractVersion !== REEDITPRO_SHARED_REASONING_ROUTE_CONTRACT_VERSION
    || port.reasoningRouteOrder.length !== EDIT_REFERENCE_REASONING_ROUTE_IDS.length
    || port.reasoningRouteOrder.some((routeId, index) => routeId !== EDIT_REFERENCE_REASONING_ROUTE_IDS[index])
    || port.qwenVisualSpecialistSubstituted !== false
    || port.providerCallOutsideRepositoryTransaction !== true
    || port.savedUserDirectionSurvivesProviderFailure !== true
    || port.noSecondMessageOrEvidenceStore !== true
    || port.noBrowserProviderAuthority !== true
    || typeof port.canonicalRepositoryRpcVerified !== 'boolean'
    || typeof port.durableMultiAttemptReasoningRunVerified !== 'boolean'
    || typeof port.multiReplicaCheckbackRecoveryVerified !== 'boolean'
    || typeof port.liveProviderDispatchVerified !== 'boolean'
    || typeof port.liveUsageAndCostSettlementVerified !== 'boolean'
    || typeof port.sameReleaseReadinessEvidenceVerified !== 'boolean'
    || port.customerPriceCalculated !== false
    || port.customerCreditsMutated !== false
    || port.serviceFeeIncluded !== false
  ) throw runtimeUnavailable(
    'The mounted Study Chat runtime does not satisfy the canonical authority contract.',
    'canonical_study_chat_runtime_shape_invalid',
  )

  if (hosted && (
    port.runtimeClass !== 'canonical_backend_verified_runtime'
    || port.evidenceClass !== 'canonical_same_release_live_runtime'
    || port.productionAuthority !== true
    || !port.canonicalRepositoryRpcVerified
    || !port.durableMultiAttemptReasoningRunVerified
    || !port.multiReplicaCheckbackRecoveryVerified
    || !port.liveProviderDispatchVerified
    || !port.liveUsageAndCostSettlementVerified
    || !port.sameReleaseReadinessEvidenceVerified
    || !qualifiedProductionRuntimePorts.has(port)
  )) throw runtimeUnavailable(
    'Hosted Study Chat requires the same-release source-verified canonical backend runtime.',
    'canonical_study_chat_runtime_not_release_qualified',
  )

  if (!hosted && port.runtimeClass === 'controlled_private_fixture' && (
    port.evidenceClass !== 'controlled_contract_fixture_unreleased'
    || port.productionAuthority
    || port.canonicalRepositoryRpcVerified
    || port.durableMultiAttemptReasoningRunVerified
    || port.multiReplicaCheckbackRecoveryVerified
    || port.liveProviderDispatchVerified
    || port.liveUsageAndCostSettlementVerified
    || port.sameReleaseReadinessEvidenceVerified
    || qualifiedProductionRuntimePorts.has(port)
  )) {
    throw runtimeUnavailable(
      'A controlled Study Chat fixture cannot claim production authority.',
      'controlled_study_chat_runtime_claimed_live_authority',
    )
  }
}

export function assertEditReferenceStudyChatRuntimePortIsNotProduction(
  port: EditReferenceStudyChatRuntimePort,
): void {
  assertPortContract(port, false)
  if (
    port.productionAuthority
    || port.runtimeClass === 'canonical_backend_verified_runtime'
    || port.evidenceClass === 'canonical_same_release_live_runtime'
    || qualifiedProductionRuntimePorts.has(port)
  ) throw runtimeUnavailable(
    'The Study Chat runtime unexpectedly has production authority.',
    'study_chat_runtime_unexpectedly_production_qualified',
  )
}

function assertMountedResult(
  result: EditReferenceServiceResult<EditReferenceMessageData>,
  studyId: string,
  request: AppendPreferenceStudyMessageRequest,
  hosted: boolean,
): void {
  const data = result?.data
  const detail = data?.detail
  if (
    !detail
    || detail.study.id !== studyId
    || detail.study.workspaceId !== request.workspaceId
    || !Array.isArray(data.appendedMessageIds)
    || data.appendedMessageIds.length < 1
  ) throw runtimeUnavailable(
    'The Study Chat runtime returned an invalid canonical result.',
    'canonical_study_chat_runtime_result_invalid',
  )

  const userMessages = detail.messages.filter((message) => (
    message.studySessionId === studyId
    && message.role === 'user'
    && message.clientMessageId === request.clientMessageId
    && message.content === request.content
  ))
  if (userMessages.length !== 1 || !data.appendedMessageIds.includes(userMessages[0]!.id)) {
    throw runtimeUnavailable(
      'The Study Chat runtime did not commit the exact user message once.',
      'canonical_study_chat_user_message_commit_invalid',
    )
  }
  if (!hosted) return

  if (!Array.isArray(detail.studyChatReasoning)) {
    throw runtimeUnavailable(
      'Hosted Study Chat did not return its canonical reasoning projection.',
      'canonical_study_chat_reasoning_projection_missing',
    )
  }
  const status = detail.studyChatReasoning.find(
    (record) => record.userMessageId === userMessages[0]!.id,
  )
  if (!status) {
    throw runtimeUnavailable(
      'Hosted Study Chat did not retain its canonical reasoning status.',
      'canonical_study_chat_reasoning_status_missing',
    )
  }
  if (status.state === 'answered') {
    const assistant = status.assistantMessageId
      ? detail.messages.find((message) => message.id === status.assistantMessageId)
      : undefined
    if (!assistant || assistant.role !== 'assistant' || assistant.runtimeSource !== 'model_reasoning') {
      throw runtimeUnavailable(
        'Hosted Study Chat did not retain its source-verified reasoning answer.',
        'canonical_study_chat_reasoning_answer_invalid',
      )
    }
  }
}

function isHostedRuntime(nodeEnv: string, mode: E2ERuntimeMode): boolean {
  return nodeEnv === 'production' || mode === 'cloud_run'
}

function runtimeUnavailable(message: string, reason: string): ApiError {
  const canonicalPersistenceGate = EDIT_REFERENCE_PRODUCTION_GATE_DEFINITIONS.find(
    (candidate) => candidate.id === 'canonical_persistence',
  )
  const modelRoutingGate = EDIT_REFERENCE_PRODUCTION_GATE_DEFINITIONS.find(
    (candidate) => candidate.id === 'model_routing_and_fallback',
  )
  const internalCostGate = EDIT_REFERENCE_PRODUCTION_GATE_DEFINITIONS.find(
    (candidate) => candidate.id === 'internal_cost_authority',
  )
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 503, {
    reason,
    persistenceContractVersion: EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
    requiredGates: [
      canonicalPersistenceGate,
      modelRoutingGate,
      internalCostGate,
    ].filter(Boolean).map((gate) => ({
      id: gate?.id,
      assertions: gate?.assertions ?? [],
    })),
    callerAssertionsCanPromoteProduction: false,
    localFallbackAllowedInHostedRuntime: false,
    productionReady: false,
  })
}
