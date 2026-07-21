import { createHash } from 'node:crypto'
import { ApiError } from '../errors/api-error'

export const EDIT_REFERENCE_PRODUCTION_APPLICATION_LIFECYCLE_REQUEST_VERSION =
  'edit-reference-production-application-lifecycle-request-v1' as const

export const EDIT_REFERENCE_PRODUCTION_APPLICATION_LIFECYCLE_RECEIPT_VERSION =
  'edit-reference-production-application-lifecycle-receipt-v1' as const

export const EDIT_REFERENCE_PRODUCTION_APPLICATION_LIFECYCLE_RPC =
  'mutate_edit_reference_application_lifecycle_v2' as const

export const EDIT_REFERENCE_PRODUCTION_APPLICATION_LIFECYCLE_MUTATIONS = [
  'apply',
  'replace',
  'remove',
] as const

export type EditReferenceProductionApplicationLifecycleMutation =
  typeof EDIT_REFERENCE_PRODUCTION_APPLICATION_LIFECYCLE_MUTATIONS[number]

export interface EditReferenceProductionApplicationLifecycleRequestInput {
  readonly mutation: EditReferenceProductionApplicationLifecycleMutation
  readonly actorUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly dnaVersionId: string
  readonly applicationId: string
  readonly expectedCurrentApplicationId: string | null
  readonly expectedReferenceRevision: number
  readonly expectedPlanningInputRevision: number
  readonly applicationContentDigestSha256: string
  readonly applicationContextHashSha256: string
  readonly targetUnderstandingPackageDigestSha256: string | null
  readonly outputFrameConfirmationId: string | null
  readonly idempotencyKeyHashSha256: string
  readonly requestedAt: string
}

export interface EditReferenceProductionApplicationLifecycleRequest
  extends EditReferenceProductionApplicationLifecycleRequestInput {
  readonly schemaVersion: typeof EDIT_REFERENCE_PRODUCTION_APPLICATION_LIFECYCLE_REQUEST_VERSION
  readonly rpcName: typeof EDIT_REFERENCE_PRODUCTION_APPLICATION_LIFECYCLE_RPC
  readonly requestDigestSha256: string
}

export type EditReferencePriorPlanningArtifactDisposition = 'absent' | 'invalidated'
export type EditReferenceExecutionRevocationDisposition = 'not_active' | 'revoked'

export interface EditReferenceProductionApplicationLifecycleReceiptInput {
  readonly transactionId: string
  readonly request: EditReferenceProductionApplicationLifecycleRequest
  readonly committedReferenceRevision: number
  readonly committedPlanningInputRevision: number
  readonly applicationStatusAfter: 'connected' | 'cleared'
  readonly preferenceContextStatusAfter: 'connected' | 'invalidated'
  readonly priorDraftPlanDisposition: EditReferencePriorPlanningArtifactDisposition
  readonly priorDraftEstimateDisposition: EditReferencePriorPlanningArtifactDisposition
  readonly approvalStatusAfter: 'not_approved' | 'reset_after_revision'
  readonly executionAuthorizationDisposition: EditReferenceExecutionRevocationDisposition
  readonly freshPlanAndEstimateRequired: true
  readonly approvedSnapshotPreserved: true
  readonly historicalPrivatePreviewPreserved: true
  readonly applicationPlanInvalidationReceiptId: string
  readonly auditEventIds: readonly string[]
  readonly idempotencyReceiptId: string
  readonly idempotencyResponseDigestSha256: string
  readonly committedAt: string
}

export interface EditReferenceProductionApplicationLifecycleReceipt
  extends Omit<EditReferenceProductionApplicationLifecycleReceiptInput, 'request'> {
  readonly schemaVersion: typeof EDIT_REFERENCE_PRODUCTION_APPLICATION_LIFECYCLE_RECEIPT_VERSION
  readonly sourceAuthority: 'canonical_application_lifecycle_rpc'
  readonly rpcName: typeof EDIT_REFERENCE_PRODUCTION_APPLICATION_LIFECYCLE_RPC
  readonly requestDigestSha256: string
  readonly mutation: EditReferenceProductionApplicationLifecycleMutation
  readonly actorUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly editReferenceId: string
  readonly applicationId: string
  readonly previousApplicationId: string | null
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
  readonly providerOrWorkerExecutionStarted: false
  readonly receiptDigestSha256: string
}

type ReceiptWithoutDigest = Omit<
  EditReferenceProductionApplicationLifecycleReceipt,
  'receiptDigestSha256'
>

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const REQUEST_INPUT_KEYS = [
  'mutation', 'actorUserId', 'workspaceId', 'projectId', 'editSessionId',
  'editReferenceId', 'studySessionId', 'dnaVersionId', 'applicationId',
  'expectedCurrentApplicationId', 'expectedReferenceRevision',
  'expectedPlanningInputRevision', 'applicationContentDigestSha256',
  'applicationContextHashSha256', 'targetUnderstandingPackageDigestSha256',
  'outputFrameConfirmationId', 'idempotencyKeyHashSha256', 'requestedAt',
] as const
const RECEIPT_INPUT_KEYS = [
  'transactionId', 'request', 'committedReferenceRevision',
  'committedPlanningInputRevision', 'applicationStatusAfter',
  'preferenceContextStatusAfter', 'priorDraftPlanDisposition',
  'priorDraftEstimateDisposition', 'approvalStatusAfter',
  'executionAuthorizationDisposition', 'freshPlanAndEstimateRequired',
  'approvedSnapshotPreserved', 'historicalPrivatePreviewPreserved',
  'applicationPlanInvalidationReceiptId', 'auditEventIds',
  'idempotencyReceiptId', 'idempotencyResponseDigestSha256', 'committedAt',
] as const

export function createEditReferenceProductionApplicationLifecycleRequest(
  input: EditReferenceProductionApplicationLifecycleRequestInput,
): EditReferenceProductionApplicationLifecycleRequest {
  assertExactKeys(input, REQUEST_INPUT_KEYS, 'application_lifecycle_request_input_shape_invalid')
  validateRequestInput(input)
  const requestWithoutDigest = {
    schemaVersion: EDIT_REFERENCE_PRODUCTION_APPLICATION_LIFECYCLE_REQUEST_VERSION,
    rpcName: EDIT_REFERENCE_PRODUCTION_APPLICATION_LIFECYCLE_RPC,
    ...input,
  } as const
  return {
    ...requestWithoutDigest,
    requestDigestSha256: sha256(requestWithoutDigest),
  }
}

/**
 * Creates the exact receipt shape a reviewed database transaction must return.
 *
 * This helper does not execute or authorize a mutation. The caller must use it
 * only after the canonical RPC commits all application, planning, audit, and
 * idempotency effects in one durable transaction.
 */
export function createEditReferenceProductionApplicationLifecycleReceipt(
  input: EditReferenceProductionApplicationLifecycleReceiptInput,
): EditReferenceProductionApplicationLifecycleReceipt {
  assertExactKeys(input, RECEIPT_INPUT_KEYS, 'application_lifecycle_receipt_input_shape_invalid')
  validateEditReferenceProductionApplicationLifecycleRequest(input.request)
  validateReceiptInput(input)
  const receiptWithoutDigest: ReceiptWithoutDigest = {
    schemaVersion: EDIT_REFERENCE_PRODUCTION_APPLICATION_LIFECYCLE_RECEIPT_VERSION,
    sourceAuthority: 'canonical_application_lifecycle_rpc',
    rpcName: EDIT_REFERENCE_PRODUCTION_APPLICATION_LIFECYCLE_RPC,
    transactionId: input.transactionId,
    requestDigestSha256: input.request.requestDigestSha256,
    mutation: input.request.mutation,
    actorUserId: input.request.actorUserId,
    workspaceId: input.request.workspaceId,
    projectId: input.request.projectId,
    editSessionId: input.request.editSessionId,
    editReferenceId: input.request.editReferenceId,
    applicationId: input.request.applicationId,
    previousApplicationId: input.request.expectedCurrentApplicationId,
    committedReferenceRevision: input.committedReferenceRevision,
    committedPlanningInputRevision: input.committedPlanningInputRevision,
    applicationStatusAfter: input.applicationStatusAfter,
    preferenceContextStatusAfter: input.preferenceContextStatusAfter,
    priorDraftPlanDisposition: input.priorDraftPlanDisposition,
    priorDraftEstimateDisposition: input.priorDraftEstimateDisposition,
    approvalStatusAfter: input.approvalStatusAfter,
    executionAuthorizationDisposition: input.executionAuthorizationDisposition,
    freshPlanAndEstimateRequired: true,
    approvedSnapshotPreserved: true,
    historicalPrivatePreviewPreserved: true,
    applicationPlanInvalidationReceiptId: input.applicationPlanInvalidationReceiptId,
    auditEventIds: [...input.auditEventIds],
    idempotencyReceiptId: input.idempotencyReceiptId,
    idempotencyResponseDigestSha256: input.idempotencyResponseDigestSha256,
    committedAt: input.committedAt,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
    providerOrWorkerExecutionStarted: false,
  }
  return {
    ...receiptWithoutDigest,
    receiptDigestSha256: sha256(receiptWithoutDigest),
  }
}

export function validateEditReferenceProductionApplicationLifecycleRequest(
  request: EditReferenceProductionApplicationLifecycleRequest,
): void {
  assertExactKeys(request, [
    'schemaVersion',
    'rpcName',
    ...REQUEST_INPUT_KEYS,
    'requestDigestSha256',
  ], 'application_lifecycle_request_shape_invalid')
  const { requestDigestSha256, ...requestWithoutDigest } = request
  validateRequestInput(request)
  if (
    request.schemaVersion !== EDIT_REFERENCE_PRODUCTION_APPLICATION_LIFECYCLE_REQUEST_VERSION
    || request.rpcName !== EDIT_REFERENCE_PRODUCTION_APPLICATION_LIFECYCLE_RPC
    || requestDigestSha256 !== sha256(requestWithoutDigest)
  ) invalid('application_lifecycle_request_digest_invalid')
}

export function validateEditReferenceProductionApplicationLifecycleReceipt(input: {
  readonly request: EditReferenceProductionApplicationLifecycleRequest
  readonly receipt: EditReferenceProductionApplicationLifecycleReceipt
}): void {
  validateEditReferenceProductionApplicationLifecycleRequest(input.request)
  assertExactKeys(input.receipt, [
    'schemaVersion', 'sourceAuthority', 'rpcName', 'transactionId',
    'requestDigestSha256', 'mutation', 'actorUserId', 'workspaceId', 'projectId',
    'editSessionId', 'editReferenceId', 'applicationId', 'previousApplicationId',
    'committedReferenceRevision', 'committedPlanningInputRevision',
    'applicationStatusAfter', 'preferenceContextStatusAfter',
    'priorDraftPlanDisposition', 'priorDraftEstimateDisposition',
    'approvalStatusAfter', 'executionAuthorizationDisposition',
    'freshPlanAndEstimateRequired', 'approvedSnapshotPreserved',
    'historicalPrivatePreviewPreserved', 'applicationPlanInvalidationReceiptId',
    'auditEventIds', 'idempotencyReceiptId', 'idempotencyResponseDigestSha256',
    'committedAt', 'customerPriceCalculated', 'customerCreditsMutated',
    'serviceFeeIncluded', 'providerOrWorkerExecutionStarted', 'receiptDigestSha256',
  ], 'application_lifecycle_receipt_shape_invalid')
  const {
    receiptDigestSha256: expectedReceiptDigestSha256,
    ...receiptWithoutDigest
  } = input.receipt
  const receipt = input.receipt
  if (
    receipt.schemaVersion !== EDIT_REFERENCE_PRODUCTION_APPLICATION_LIFECYCLE_RECEIPT_VERSION
    || receipt.sourceAuthority !== 'canonical_application_lifecycle_rpc'
    || receipt.rpcName !== EDIT_REFERENCE_PRODUCTION_APPLICATION_LIFECYCLE_RPC
    || expectedReceiptDigestSha256 !== sha256(receiptWithoutDigest)
  ) invalid('application_lifecycle_receipt_digest_invalid')
  if (
    receipt.requestDigestSha256 !== input.request.requestDigestSha256
    || receipt.mutation !== input.request.mutation
    || receipt.actorUserId !== input.request.actorUserId
    || receipt.workspaceId !== input.request.workspaceId
    || receipt.projectId !== input.request.projectId
    || receipt.editSessionId !== input.request.editSessionId
    || receipt.editReferenceId !== input.request.editReferenceId
    || receipt.applicationId !== input.request.applicationId
    || receipt.previousApplicationId !== input.request.expectedCurrentApplicationId
  ) invalid('application_lifecycle_receipt_request_binding_invalid')
  const commercialBoundary = receipt as unknown as Record<string, unknown>
  if (
    commercialBoundary.customerPriceCalculated !== false
    || commercialBoundary.customerCreditsMutated !== false
    || commercialBoundary.serviceFeeIncluded !== false
    || commercialBoundary.providerOrWorkerExecutionStarted !== false
  ) invalid('application_lifecycle_receipt_commercial_or_execution_boundary_opened')
  validateReceiptSemantics(input.request, receipt)
}

function validateRequestInput(input: EditReferenceProductionApplicationLifecycleRequestInput): void {
  if (!EDIT_REFERENCE_PRODUCTION_APPLICATION_LIFECYCLE_MUTATIONS.includes(input.mutation)) {
    invalid('application_lifecycle_mutation_invalid')
  }
  for (const [field, value] of Object.entries({
    actorUserId: input.actorUserId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    editReferenceId: input.editReferenceId,
    studySessionId: input.studySessionId,
    dnaVersionId: input.dnaVersionId,
    applicationId: input.applicationId,
  })) {
    if (!ID_PATTERN.test(value)) invalid(`application_lifecycle_${field}_invalid`)
  }
  if (input.expectedCurrentApplicationId !== null && !ID_PATTERN.test(input.expectedCurrentApplicationId)) {
    invalid('application_lifecycle_expected_current_application_invalid')
  }
  if (input.mutation === 'apply' && input.expectedCurrentApplicationId !== null) {
    invalid('application_lifecycle_apply_requires_no_current_application')
  }
  if (input.mutation !== 'apply' && input.expectedCurrentApplicationId === null) {
    invalid('application_lifecycle_replace_or_remove_requires_current_application')
  }
  if (input.mutation === 'replace' && input.expectedCurrentApplicationId === input.applicationId) {
    invalid('application_lifecycle_replacement_requires_new_application')
  }
  if (input.mutation === 'remove' && input.expectedCurrentApplicationId !== input.applicationId) {
    invalid('application_lifecycle_removal_must_clear_expected_application')
  }
  if (
    !Number.isInteger(input.expectedReferenceRevision)
    || input.expectedReferenceRevision < 1
    || !Number.isInteger(input.expectedPlanningInputRevision)
    || input.expectedPlanningInputRevision < 0
  ) invalid('application_lifecycle_expected_revision_invalid')
  for (const [field, value] of Object.entries({
    applicationContentDigestSha256: input.applicationContentDigestSha256,
    applicationContextHashSha256: input.applicationContextHashSha256,
    idempotencyKeyHashSha256: input.idempotencyKeyHashSha256,
  })) {
    if (!SHA256_PATTERN.test(value)) invalid(`application_lifecycle_${field}_invalid`)
  }
  if (input.mutation === 'remove') {
    if (input.targetUnderstandingPackageDigestSha256 !== null || input.outputFrameConfirmationId !== null) {
      invalid('application_lifecycle_remove_cannot_replace_target_authority')
    }
  } else {
    if (!input.targetUnderstandingPackageDigestSha256 || !SHA256_PATTERN.test(input.targetUnderstandingPackageDigestSha256)) {
      invalid('application_lifecycle_target_understanding_digest_invalid')
    }
    if (!input.outputFrameConfirmationId || !ID_PATTERN.test(input.outputFrameConfirmationId)) {
      invalid('application_lifecycle_output_frame_confirmation_invalid')
    }
  }
  if (!Number.isFinite(Date.parse(input.requestedAt))) {
    invalid('application_lifecycle_requested_at_invalid')
  }
}

function validateReceiptInput(input: EditReferenceProductionApplicationLifecycleReceiptInput): void {
  if (!ID_PATTERN.test(input.transactionId)) invalid('application_lifecycle_transaction_id_invalid')
  if (
    input.committedReferenceRevision !== input.request.expectedReferenceRevision + 1
    || input.committedPlanningInputRevision !== input.request.expectedPlanningInputRevision + 1
  ) invalid('application_lifecycle_committed_revision_invalid')
  if (!ID_PATTERN.test(input.applicationPlanInvalidationReceiptId)) {
    invalid('application_lifecycle_invalidation_receipt_id_invalid')
  }
  if (!ID_PATTERN.test(input.idempotencyReceiptId) || !SHA256_PATTERN.test(input.idempotencyResponseDigestSha256)) {
    invalid('application_lifecycle_idempotency_receipt_invalid')
  }
  if (!input.auditEventIds.length || input.auditEventIds.some((id) => !ID_PATTERN.test(id))) {
    invalid('application_lifecycle_audit_evidence_invalid')
  }
  const requestedAt = Date.parse(input.request.requestedAt)
  const committedAt = Date.parse(input.committedAt)
  if (!Number.isFinite(committedAt) || committedAt < requestedAt) {
    invalid('application_lifecycle_committed_at_invalid')
  }
  validateReceiptSemantics(input.request, input)
}

function validateReceiptSemantics(
  request: EditReferenceProductionApplicationLifecycleRequest,
  receipt: Pick<
    EditReferenceProductionApplicationLifecycleReceiptInput,
    | 'applicationStatusAfter'
    | 'preferenceContextStatusAfter'
    | 'freshPlanAndEstimateRequired'
    | 'approvedSnapshotPreserved'
    | 'historicalPrivatePreviewPreserved'
  > & Partial<Pick<
    EditReferenceProductionApplicationLifecycleReceipt,
    'customerPriceCalculated' | 'customerCreditsMutated' | 'serviceFeeIncluded' | 'providerOrWorkerExecutionStarted'
  >>,
): void {
  const applying = request.mutation === 'apply' || request.mutation === 'replace'
  if (
    receipt.applicationStatusAfter !== (applying ? 'connected' : 'cleared')
    || receipt.preferenceContextStatusAfter !== (applying ? 'connected' : 'invalidated')
    || receipt.freshPlanAndEstimateRequired !== true
    || receipt.approvedSnapshotPreserved !== true
    || receipt.historicalPrivatePreviewPreserved !== true
  ) invalid('application_lifecycle_receipt_semantics_invalid')
}

function sha256(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex')
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(',')}]`
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
    return `{${entries.join(',')}}`
  }
  const serialized = JSON.stringify(value)
  if (serialized === undefined) invalid('application_lifecycle_non_canonical_value')
  return serialized
}

function assertExactKeys(
  value: object,
  expectedKeys: readonly string[],
  reason: string,
): void {
  const actual = Object.keys(value).sort()
  const expected = [...expectedKeys].sort()
  if (JSON.stringify(actual) !== JSON.stringify(expected)) invalid(reason)
}

function invalid(reason: string): never {
  throw new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'The production Preference Application lifecycle authority is incomplete or unsafe.',
    503,
    {
      reason,
      rpcName: EDIT_REFERENCE_PRODUCTION_APPLICATION_LIFECYCLE_RPC,
      remoteMutationAttempted: false,
    },
  )
}
