import type { EditReferenceStudyChatReasoningRequest } from './edit-reference-study-chat-reasoning-contract'
import {
  hashEditReferenceStudyChatReasoningRequest,
  validateEditReferenceStudyChatReasoningResult,
  type EditReferenceStudyChatReasoningResult,
} from './edit-reference-study-chat-reasoning-contract'
import {
  validateReconcileEditReferenceStudyChatProviderRequestInput,
  type EditReferenceStudyChatProviderObservationStatus,
} from './edit-reference-study-chat-provider-request-contract'

export const EDIT_REFERENCE_STUDY_CHAT_PROVIDER_TRANSPORT_VERSION =
  'edit-reference-study-chat-provider-transport-v2' as const

export interface EditReferenceStudyChatProviderIdentity {
  readonly providerRoute: string
  readonly providerModelId: string
  readonly providerModelRevision: string
  readonly providerModelAggregateSha256: string
}

export interface EditReferenceStudyChatProviderPreparationReceipt {
  readonly schemaVersion: typeof EDIT_REFERENCE_STUDY_CHAT_PROVIDER_TRANSPORT_VERSION
  readonly requestDigestSha256: string
  readonly structuredContextDigestSha256: string
  readonly providerRoute: string
  readonly providerModelId: string
  readonly providerModelRevision: string
  readonly providerModelAggregateSha256: string
  readonly costAuthorityVerified: true
  readonly internalCostAuthorityId: string
  readonly approvedUsageEstimateId: string
  readonly internalCostBudgetId: string
  readonly immutableRateCardSnapshotId: string
  readonly maximumAuthorizedInternalCostMicros: string
  readonly usageEventIds: readonly string[]
  readonly internalCostRecordIds: readonly string[]
  readonly costAuthorizationDigestSha256: string
  readonly publicUserApprovalVerified: false
  readonly externalProviderExecutionAllowed: false
  readonly privateControlledExecutionOnly: true
  readonly providerCallMade: false
  readonly remoteMutationMade: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
}

export interface EditReferenceStudyChatProviderTransportObservation {
  readonly observationId: string
  readonly observationStatus: EditReferenceStudyChatProviderObservationStatus
  readonly providerRequestId: string | null
  readonly result: EditReferenceStudyChatReasoningResult | null
}

export interface EditReferenceStudyChatProviderPrepareInput<TStructuredContext> {
  readonly request: EditReferenceStudyChatReasoningRequest
  readonly structuredContext: TStructuredContext
  readonly providerIdentity: EditReferenceStudyChatProviderIdentity
}

export interface EditReferenceStudyChatProviderSubmitInput<TStructuredContext>
  extends EditReferenceStudyChatProviderPrepareInput<TStructuredContext> {
  readonly providerRequestRecordId: string
  readonly providerSubmissionIdempotencyKey: string
  readonly preparationReceipt: EditReferenceStudyChatProviderPreparationReceipt
}

export interface EditReferenceStudyChatProviderLookupInput {
  readonly request: EditReferenceStudyChatReasoningRequest
  readonly providerIdentity: EditReferenceStudyChatProviderIdentity
  readonly providerRequestRecordId: string
  readonly providerRequestId: string | null
  readonly providerSubmissionIdempotencyKey: string
}

/**
 * Backend-private provider-neutral seam. A production implementation must make
 * `prepare` an idempotent canonical internal-cost check that performs no model
 * call. `submit` receives the one durable submission authority. Once that
 * authority is consumed, every later invocation must use `lookup` only.
 */
export interface EditReferenceStudyChatProviderTransport<TStructuredContext> {
  readonly integrationState: 'backend_private_injected_not_publicly_wired'
  prepare(
    input: EditReferenceStudyChatProviderPrepareInput<TStructuredContext>,
  ): Promise<EditReferenceStudyChatProviderPreparationReceipt>
  submit(
    input: EditReferenceStudyChatProviderSubmitInput<TStructuredContext>,
  ): Promise<EditReferenceStudyChatProviderTransportObservation>
  lookup(
    input: EditReferenceStudyChatProviderLookupInput,
  ): Promise<EditReferenceStudyChatProviderTransportObservation>
}

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const MONEY_MICROS_PATTERN = /^(?:0|[1-9][0-9]{0,15})$/

export function validateEditReferenceStudyChatProviderIdentity(
  identity: EditReferenceStudyChatProviderIdentity,
): void {
  if (
    !ID_PATTERN.test(identity.providerRoute)
    || !ID_PATTERN.test(identity.providerModelId)
    || !ID_PATTERN.test(identity.providerModelRevision)
    || !SHA256_PATTERN.test(identity.providerModelAggregateSha256)
  ) throw new Error('The private Study Chat provider identity is invalid.')
}

export function validateEditReferenceStudyChatProviderPreparationReceipt(input: {
  readonly receipt: EditReferenceStudyChatProviderPreparationReceipt
  readonly request: EditReferenceStudyChatReasoningRequest
  readonly providerIdentity: EditReferenceStudyChatProviderIdentity
}): void {
  validateEditReferenceStudyChatProviderIdentity(input.providerIdentity)
  const receipt = input.receipt
  if (
    receipt.schemaVersion !== EDIT_REFERENCE_STUDY_CHAT_PROVIDER_TRANSPORT_VERSION
    || receipt.requestDigestSha256 !== hashEditReferenceStudyChatReasoningRequest(input.request)
    || receipt.structuredContextDigestSha256 !== input.request.structuredContextDigestSha256
    || receipt.providerRoute !== input.providerIdentity.providerRoute
    || receipt.providerModelId !== input.providerIdentity.providerModelId
    || receipt.providerModelRevision !== input.providerIdentity.providerModelRevision
    || receipt.providerModelAggregateSha256 !== input.providerIdentity.providerModelAggregateSha256
    || receipt.costAuthorityVerified !== true
    || !ID_PATTERN.test(receipt.internalCostAuthorityId)
    || receipt.approvedUsageEstimateId !== input.request.approvedUsageEstimateId
    || receipt.internalCostBudgetId !== input.request.internalCostBudgetId
    || receipt.immutableRateCardSnapshotId !== input.request.immutableRateCardSnapshotId
    || receipt.maximumAuthorizedInternalCostMicros !== input.request.maximumAuthorizedInternalCostMicros
    || !MONEY_MICROS_PATTERN.test(receipt.maximumAuthorizedInternalCostMicros)
    || receipt.usageEventIds.length !== 1
    || receipt.internalCostRecordIds.length !== 1
    || receipt.usageEventIds.some((value) => !ID_PATTERN.test(value))
    || receipt.internalCostRecordIds.some((value) => !ID_PATTERN.test(value))
    || !SHA256_PATTERN.test(receipt.costAuthorizationDigestSha256)
    || receipt.publicUserApprovalVerified !== false
    || receipt.externalProviderExecutionAllowed !== false
    || receipt.privateControlledExecutionOnly !== true
    || receipt.providerCallMade !== false
    || receipt.remoteMutationMade !== false
    || receipt.customerPriceCalculated !== false
    || receipt.customerCreditsMutated !== false
    || receipt.serviceFeeIncluded !== false
  ) throw new Error('The private Study Chat provider preparation receipt is invalid.')
}

export function validateEditReferenceStudyChatProviderTransportObservation(input: {
  readonly observation: EditReferenceStudyChatProviderTransportObservation
  readonly request: EditReferenceStudyChatReasoningRequest
  readonly providerIdentity: EditReferenceStudyChatProviderIdentity
}): void {
  validateEditReferenceStudyChatProviderIdentity(input.providerIdentity)
  validateReconcileEditReferenceStudyChatProviderRequestInput({
    workspaceId: input.request.workspaceId,
    expectedProviderRequestRevision: 1,
    observationId: input.observation.observationId,
    observationStatus: input.observation.observationStatus,
    providerRequestId: input.observation.providerRequestId,
    result: input.observation.result,
  })
  if (!input.observation.result) return
  validateEditReferenceStudyChatReasoningResult(input.request, input.observation.result)
  if (
    input.observation.result.status === 'answered'
    && (
      input.observation.result.model.providerId !== input.providerIdentity.providerRoute
      || input.observation.result.model.modelId !== input.providerIdentity.providerModelId
      || input.observation.result.model.modelRevision !== input.providerIdentity.providerModelRevision
      || input.observation.result.model.modelAggregateSha256
        !== input.providerIdentity.providerModelAggregateSha256
    )
  ) throw new Error('The private Study Chat provider observation identity is invalid.')
}
