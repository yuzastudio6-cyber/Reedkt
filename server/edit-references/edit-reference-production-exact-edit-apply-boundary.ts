import { createHash } from 'node:crypto'
import type { PreferenceApplicationRecord } from '../../src/types/edit-reference'
import {
  EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_AUTHORITY_READ_VERSION,
  EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_COMMAND_VERSION,
  EDIT_REFERENCE_PRODUCTION_PREPARED_APPLICATION_AUTHORITY_VERSION,
  type EditReferenceProductionExactEditApplyCommand,
  type EditReferenceProductionExactEditApplyAuthorityRead,
  type EditReferenceProductionExactEditApplyApiReceipt,
  type EditReferenceProductionExactEditPreferencePatch,
  type EditReferenceProductionExactEditPreferenceValues,
  type EditReferenceProductionPreparedApplicationAuthority,
} from '../../src/types/edit-reference-production-exact-edit-apply-api'
import { ApiError } from '../errors/api-error'
import {
  exactEditPreferenceFieldKeys,
  exactEditPreferenceValuesSchema,
  type ExactEditPreferenceFieldKey,
} from '../validation/exact-edit-preference-schemas'
import type {
  EditReferenceProductionApplicationLifecycleRequest,
} from './edit-reference-production-application-lifecycle'
import {
  validateEditReferenceProductionApplicationLifecycleRequest,
} from './edit-reference-production-application-lifecycle'
import {
  prepareEditReferenceProductionLifecycleRequest,
  validateEditReferenceProductionAuthenticatedHttpAuthority,
  type EditReferenceProductionAuthenticatedHttpAuthority,
} from './edit-reference-production-http-lifecycle-boundary'
import {
  validateEditReferenceProductionOutputFrameAuthority,
  type EditReferenceProductionOutputFrameAuthority,
} from './edit-reference-production-output-frame-authority'

export const EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_BOUNDARY_VERSION =
  'edit-reference-production-exact-edit-apply-boundary-v1' as const

export const EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_RPC =
  'apply_exact_edit_preferences_and_reference_v1' as const

export const EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_AUTHORITY_READ_RPC =
  'read_exact_edit_apply_authority_v1' as const

export interface EditReferenceProductionExactEditApplyAuthorityReadScope {
  readonly actorUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly selectedApplicationId: string | null
}

export type EditReferenceProductionCurrentApplicationState =
  | 'not_selected'
  | 'connected'
  | 'cleared'

/**
 * One server-side snapshot read from the future canonical exact-edit
 * preference repository. This interface is a contract only; it does not make
 * the current private/local store production-authoritative.
 */
export interface EditReferenceProductionExactEditPreferenceAuthority {
  readonly sourceAuthority:
    | 'canonical_exact_edit_preference_repository'
    | 'private_exact_edit_preference_store'
  readonly runtimeSource: 'verified_live' | 'verified_local'
  readonly authorityReadReceiptId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly recordRevision: number
  readonly preferenceRevision: number
  readonly planningInputRevision: number
  readonly preferenceFingerprintSha256: string
  readonly values: EditReferenceProductionExactEditPreferenceValues
  readonly lifecyclePhase:
    | 'planning'
    | 'approved_snapshot'
    | 'credit_reserved'
    | 'executing'
    | 'private_review'
    | 'completed_internal'
    | 'revision_handoff'
  readonly locked: boolean
  readonly currentApplicationState: EditReferenceProductionCurrentApplicationState
  readonly currentApplicationId: string | null
}

export interface EditReferenceProductionExactEditApplyRequest {
  readonly schemaVersion: typeof EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_BOUNDARY_VERSION
  readonly rpcName: typeof EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_RPC
  readonly actorUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly accessCheckReceiptId: string
  readonly exactEditPreferenceAuthorityReadReceiptId: string
  readonly expectedPreferenceRecordRevision: number
  readonly expectedPreferenceRevision: number
  readonly expectedPlanningInputRevision: number
  readonly expectedPreferenceFingerprintSha256: string
  readonly preferencePatch: EditReferenceProductionExactEditPreferencePatch
  readonly changedPreferenceFields: readonly ExactEditPreferenceFieldKey[]
  readonly referenceLifecycleRequest: EditReferenceProductionApplicationLifecycleRequest | null
  readonly referenceLifecycleExecutionPolicy: 'nested_same_transaction_never_called_separately'
  readonly planningInputRevisionIncrement: 1
  readonly sourcePreparationDisposition: 'unchanged' | 'requires_repreparation'
  readonly outputFrameDisposition: 'unchanged' | 'requires_reconfirmation'
  readonly freshPlanAndEstimateRequired: true
  readonly approvedSnapshotPreserved: true
  readonly historicalPrivatePreviewPreserved: true
  readonly idempotencyKeyHashSha256: string
  readonly requestedAt: string
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
  readonly providerOrWorkerExecutionStarted: false
  readonly requestDigestSha256: string
}

export interface EditReferenceProductionPreparedExactEditApply {
  readonly request: EditReferenceProductionExactEditApplyRequest
  readonly browserCommandDigestSha256: string
  readonly authenticatedScopeReboundServerSide: true
  readonly exactEditPreferencesReReadServerSide: true
  readonly referenceLifecycleNestedOnly: true
  readonly idempotencyKeyAcceptedInBody: false
  readonly remoteMutationMade: false
  readonly productionReady: false
}

const COMMAND_KEYS = [
  'schemaVersion',
  'workspaceId',
  'projectId',
  'editSessionId',
  'expectedPreferenceRecordRevision',
  'expectedPreferenceRevision',
  'expectedPlanningInputRevision',
  'expectedPreferenceFingerprintSha256',
  'preferencePatch',
  'editReferenceLifecycle',
] as const
const REQUEST_KEYS = [
  'schemaVersion', 'rpcName', 'actorUserId', 'workspaceId', 'projectId',
  'editSessionId', 'accessCheckReceiptId',
  'exactEditPreferenceAuthorityReadReceiptId',
  'expectedPreferenceRecordRevision', 'expectedPreferenceRevision',
  'expectedPlanningInputRevision', 'expectedPreferenceFingerprintSha256',
  'preferencePatch', 'changedPreferenceFields', 'referenceLifecycleRequest',
  'referenceLifecycleExecutionPolicy', 'planningInputRevisionIncrement',
  'sourcePreparationDisposition', 'outputFrameDisposition',
  'freshPlanAndEstimateRequired', 'approvedSnapshotPreserved',
  'historicalPrivatePreviewPreserved', 'idempotencyKeyHashSha256',
  'requestedAt', 'customerPriceCalculated', 'customerCreditsMutated',
  'serviceFeeIncluded', 'providerOrWorkerExecutionStarted',
  'requestDigestSha256',
] as const
const RECEIPT_KEYS = [
  'schemaVersion', 'sourceAuthority', 'canonicalReceiptValidatedServerSide',
  'transactionId', 'changedPreferenceFields', 'referenceMutation',
  'committedPreferenceRecordRevision', 'committedPreferenceRevision',
  'committedPlanningInputRevision', 'sourcePreparationDisposition',
  'outputFrameDisposition', 'freshPlanAndEstimateRequired',
  'approvedSnapshotPreserved', 'historicalPrivatePreviewPreserved',
  'transactionReceiptDigestSha256', 'committedAt',
  'productionReleaseReadinessEvaluatedSeparately',
  'customerPriceCalculated', 'customerCreditsMutated', 'serviceFeeIncluded',
  'providerOrWorkerExecutionStarted',
] as const
const AUTHORITY_READ_KEYS = [
  'schemaVersion', 'sourceAuthority', 'runtimeSource',
  'authorityReadReceiptId', 'workspaceId', 'projectId', 'editSessionId',
  'recordRevision', 'preferenceRevision', 'planningInputRevision',
  'preferenceFingerprintSha256', 'values', 'lifecyclePhase', 'locked',
  'currentApplicationState', 'currentApplicationId', 'outputFrameAuthority',
  'selectedApplicationAuthority', 'readAt', 'browserMutationAuthorityGranted',
  'productionReleaseReadinessEvaluatedSeparately',
] as const
const PREPARED_APPLICATION_AUTHORITY_KEYS = [
  'schemaVersion', 'sourceAuthority', 'runtimeSource',
  'authorityReadReceiptId', 'workspaceId', 'projectId', 'editSessionId',
  'editReferenceId', 'studySessionId', 'dnaVersionId', 'dnaQaResultId',
  'applicationId', 'applicationVersionNumber',
  'applicationContentDigestSha256', 'applicationContextHashSha256',
  'targetUnderstandingPackageDigestSha256', 'expectedReferenceRevision',
  'status', 'connectionState',
] as const
const AUTHORITY_READ_SCOPE_KEYS = [
  'actorUserId', 'workspaceId', 'projectId', 'editSessionId',
  'selectedApplicationId',
] as const
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const LIFECYCLE_PHASES = new Set<
  EditReferenceProductionExactEditApplyAuthorityRead['lifecyclePhase']
>([
  'planning', 'approved_snapshot', 'credit_reserved', 'executing',
  'private_review', 'completed_internal', 'revision_handoff',
])

export function validateEditReferenceProductionExactEditApplyAuthorityReadScope(
  scope: EditReferenceProductionExactEditApplyAuthorityReadScope,
): void {
  assertExactKeys(
    scope,
    AUTHORITY_READ_SCOPE_KEYS,
    'exact_edit_apply_authority_read_scope_shape_invalid',
  )
  if (
    !isSafeId(scope.actorUserId)
    || !isSafeId(scope.workspaceId)
    || !isSafeId(scope.projectId)
    || !isSafeId(scope.editSessionId)
    || (scope.selectedApplicationId !== null && !isSafeId(scope.selectedApplicationId))
  ) invalid('exact_edit_apply_authority_read_scope_invalid', 400)
}

export function validateEditReferenceProductionExactEditApplyAuthorityRead(
  authority: EditReferenceProductionExactEditApplyAuthorityRead,
): void {
  assertExactKeys(
    authority,
    AUTHORITY_READ_KEYS,
    'exact_edit_apply_authority_read_shape_invalid',
  )
  if (
    authority.schemaVersion
      !== EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_AUTHORITY_READ_VERSION
    || authority.sourceAuthority !== 'canonical_exact_edit_preference_repository'
    || authority.runtimeSource !== 'verified_live'
    || !isSafeId(authority.authorityReadReceiptId)
    || !isSafeId(authority.workspaceId)
    || !isSafeId(authority.projectId)
    || !isSafeId(authority.editSessionId)
    || !Number.isInteger(authority.recordRevision)
    || authority.recordRevision < 0
    || !Number.isInteger(authority.preferenceRevision)
    || authority.preferenceRevision < 0
    || !Number.isInteger(authority.planningInputRevision)
    || authority.planningInputRevision < 0
    || !SHA256_PATTERN.test(authority.preferenceFingerprintSha256)
    || !LIFECYCLE_PHASES.has(authority.lifecyclePhase)
    || typeof authority.locked !== 'boolean'
    || !Number.isFinite(Date.parse(authority.readAt))
    || authority.browserMutationAuthorityGranted !== false
    || authority.productionReleaseReadinessEvaluatedSeparately !== true
  ) invalid('exact_edit_apply_authority_read_integrity_invalid', 503)

  const values = exactEditPreferenceValuesSchema.safeParse(authority.values)
  if (
    !values.success
    || authority.preferenceFingerprintSha256 !== sha256(values.data)
  ) invalid('exact_edit_apply_authority_read_preferences_invalid', 503)

  const currentApplicationShapeValid = authority.currentApplicationState === 'connected'
    ? authority.currentApplicationId !== null && isSafeId(authority.currentApplicationId)
    : authority.currentApplicationId === null
  if (!currentApplicationShapeValid) {
    invalid('exact_edit_apply_authority_read_application_state_invalid', 503)
  }

  if (authority.outputFrameAuthority) {
    validateEditReferenceProductionOutputFrameAuthority(authority.outputFrameAuthority)
    if (
      authority.outputFrameAuthority.workspaceId !== authority.workspaceId
      || authority.outputFrameAuthority.projectId !== authority.projectId
      || authority.outputFrameAuthority.editSessionId !== authority.editSessionId
      || authority.outputFrameAuthority.exactEditPreferenceRecordRevision
        !== authority.recordRevision
      || authority.outputFrameAuthority.planningInputRevision
        !== authority.planningInputRevision
    ) invalid('exact_edit_apply_authority_read_frame_scope_invalid', 503)
  }

  if (authority.selectedApplicationAuthority) {
    validateEditReferenceProductionPreparedApplicationAuthority(
      authority.selectedApplicationAuthority,
    )
    const selected = authority.selectedApplicationAuthority
    if (
      selected.workspaceId !== authority.workspaceId
      || selected.projectId !== authority.projectId
      || selected.editSessionId !== authority.editSessionId
      || (
        selected.connectionState === 'connected'
        && selected.applicationId !== authority.currentApplicationId
      )
    ) invalid('exact_edit_apply_authority_read_selected_application_invalid', 503)
  }
}

export function validateEditReferenceProductionPreparedApplicationAuthority(
  authority: EditReferenceProductionPreparedApplicationAuthority,
): void {
  assertExactKeys(
    authority,
    PREPARED_APPLICATION_AUTHORITY_KEYS,
    'exact_edit_apply_prepared_application_authority_shape_invalid',
  )
  if (
    authority.schemaVersion
      !== EDIT_REFERENCE_PRODUCTION_PREPARED_APPLICATION_AUTHORITY_VERSION
    || authority.sourceAuthority !== 'canonical_preference_application_repository'
    || authority.runtimeSource !== 'verified_live'
    || !isSafeId(authority.authorityReadReceiptId)
    || !isSafeId(authority.workspaceId)
    || !isSafeId(authority.projectId)
    || !isSafeId(authority.editSessionId)
    || !isSafeId(authority.editReferenceId)
    || !isSafeId(authority.studySessionId)
    || !isSafeId(authority.dnaVersionId)
    || !isSafeId(authority.dnaQaResultId)
    || !isSafeId(authority.applicationId)
    || !Number.isInteger(authority.applicationVersionNumber)
    || authority.applicationVersionNumber < 1
    || !SHA256_PATTERN.test(authority.applicationContentDigestSha256)
    || !SHA256_PATTERN.test(authority.applicationContextHashSha256)
    || !SHA256_PATTERN.test(authority.targetUnderstandingPackageDigestSha256)
    || !Number.isInteger(authority.expectedReferenceRevision)
    || authority.expectedReferenceRevision < 1
    || authority.status !== 'prepared'
    || !['not_connected', 'connected'].includes(authority.connectionState)
  ) invalid('exact_edit_apply_prepared_application_authority_invalid', 503)
}

/**
 * Prepares, but never executes, the one future exact-edit Apply transaction.
 * Generic preference changes and the optional Edit Reference lifecycle are
 * bound to one expected planning revision and one idempotency identity.
 */
export function prepareEditReferenceProductionExactEditApply(input: {
  readonly command: EditReferenceProductionExactEditApplyCommand
  readonly authenticated: EditReferenceProductionAuthenticatedHttpAuthority
  readonly exactEditPreferenceAuthority: EditReferenceProductionExactEditPreferenceAuthority
  readonly preparedApplication: PreferenceApplicationRecord | null
  readonly outputFrameAuthority: EditReferenceProductionOutputFrameAuthority | null
  readonly idempotencyKeyHashSha256: string
  readonly serverRequestedAt: string
}): EditReferenceProductionPreparedExactEditApply {
  assertExactKeys(input.command, COMMAND_KEYS, 'exact_edit_apply_command_shape_invalid')
  validateEditReferenceProductionAuthenticatedHttpAuthority(
    input.authenticated,
    input.command,
  )
  validateServerInputs(input.idempotencyKeyHashSha256, input.serverRequestedAt)
  validateExactEditPreferenceAuthority(input.command, input.exactEditPreferenceAuthority)
  const patch = validatePreferencePatch(input.command.preferencePatch)
  const nextValues = exactEditPreferenceValuesSchema.parse({
    ...input.exactEditPreferenceAuthority.values,
    ...patch,
  }) as EditReferenceProductionExactEditPreferenceValues
  const changedPreferenceFields = exactEditPreferenceFieldKeys.filter(
    (field) => input.exactEditPreferenceAuthority.values[field] !== nextValues[field],
  )

  const referenceLifecycleRequest = prepareNestedReferenceLifecycle({
    ...input,
    changedPreferenceFields,
  })
  if (changedPreferenceFields.length === 0 && !referenceLifecycleRequest) {
    invalid('exact_edit_apply_has_no_effect', 409)
  }

  const sourcePreparationDisposition = changedPreferenceFields.includes('cleanupPreference')
    ? 'requires_repreparation' as const
    : 'unchanged' as const
  const outputFrameDisposition = changedPreferenceFields.includes('targetPlatform')
    ? 'requires_reconfirmation' as const
    : 'unchanged' as const
  const requestWithoutDigest = {
    schemaVersion: EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_BOUNDARY_VERSION,
    rpcName: EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_RPC,
    actorUserId: input.authenticated.actorUserId,
    workspaceId: input.command.workspaceId,
    projectId: input.command.projectId,
    editSessionId: input.command.editSessionId,
    accessCheckReceiptId: input.authenticated.accessCheckReceiptId,
    exactEditPreferenceAuthorityReadReceiptId:
      input.exactEditPreferenceAuthority.authorityReadReceiptId,
    expectedPreferenceRecordRevision: input.command.expectedPreferenceRecordRevision,
    expectedPreferenceRevision: input.command.expectedPreferenceRevision,
    expectedPlanningInputRevision: input.command.expectedPlanningInputRevision,
    expectedPreferenceFingerprintSha256: input.command.expectedPreferenceFingerprintSha256,
    preferencePatch: patch,
    changedPreferenceFields,
    referenceLifecycleRequest,
    referenceLifecycleExecutionPolicy:
      'nested_same_transaction_never_called_separately' as const,
    planningInputRevisionIncrement: 1 as const,
    sourcePreparationDisposition,
    outputFrameDisposition,
    freshPlanAndEstimateRequired: true as const,
    approvedSnapshotPreserved: true as const,
    historicalPrivatePreviewPreserved: true as const,
    idempotencyKeyHashSha256: input.idempotencyKeyHashSha256,
    requestedAt: input.serverRequestedAt,
    customerPriceCalculated: false as const,
    customerCreditsMutated: false as const,
    serviceFeeIncluded: false as const,
    providerOrWorkerExecutionStarted: false as const,
  }
  const request: EditReferenceProductionExactEditApplyRequest = Object.freeze({
    ...requestWithoutDigest,
    requestDigestSha256: sha256(requestWithoutDigest),
  })
  return Object.freeze({
    request,
    browserCommandDigestSha256: sha256(input.command),
    authenticatedScopeReboundServerSide: true as const,
    exactEditPreferencesReReadServerSide: true as const,
    referenceLifecycleNestedOnly: true as const,
    idempotencyKeyAcceptedInBody: false as const,
    remoteMutationMade: false as const,
    productionReady: false as const,
  })
}

export function validateEditReferenceProductionExactEditApplyRequest(
  request: EditReferenceProductionExactEditApplyRequest,
): void {
  assertExactKeys(request, REQUEST_KEYS, 'exact_edit_apply_request_shape_invalid')
  const { requestDigestSha256, ...requestWithoutDigest } = request
  if (
    request.schemaVersion !== EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_BOUNDARY_VERSION
    || request.rpcName !== EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_RPC
    || !SHA256_PATTERN.test(requestDigestSha256)
    || requestDigestSha256 !== sha256(requestWithoutDigest)
    || !isSafeId(request.actorUserId)
    || !isSafeId(request.workspaceId)
    || !isSafeId(request.projectId)
    || !isSafeId(request.editSessionId)
    || !isSafeId(request.accessCheckReceiptId)
    || !isSafeId(request.exactEditPreferenceAuthorityReadReceiptId)
    || !Number.isInteger(request.expectedPreferenceRecordRevision)
    || request.expectedPreferenceRecordRevision < 0
    || !Number.isInteger(request.expectedPreferenceRevision)
    || request.expectedPreferenceRevision < 0
    || !Number.isInteger(request.expectedPlanningInputRevision)
    || request.expectedPlanningInputRevision < 0
    || !SHA256_PATTERN.test(request.expectedPreferenceFingerprintSha256)
    || !SHA256_PATTERN.test(request.idempotencyKeyHashSha256)
    || !Number.isFinite(Date.parse(request.requestedAt))
  ) invalid('exact_edit_apply_request_integrity_invalid', 503)

  const patch = validatePreferencePatch(request.preferencePatch)
  if (
    !Array.isArray(request.changedPreferenceFields)
    || request.changedPreferenceFields.some((field) => (
      !exactEditPreferenceFieldKeys.includes(field)
      || !Object.prototype.hasOwnProperty.call(patch, field)
    ))
    || new Set(request.changedPreferenceFields).size !== request.changedPreferenceFields.length
  ) invalid('exact_edit_apply_changed_fields_invalid', 503)

  const changedFields = request.changedPreferenceFields
  if (
    request.referenceLifecycleExecutionPolicy
      !== 'nested_same_transaction_never_called_separately'
    || request.planningInputRevisionIncrement !== 1
    || request.sourcePreparationDisposition
      !== (changedFields.includes('cleanupPreference') ? 'requires_repreparation' : 'unchanged')
    || request.outputFrameDisposition
      !== (changedFields.includes('targetPlatform') ? 'requires_reconfirmation' : 'unchanged')
    || request.freshPlanAndEstimateRequired !== true
    || request.approvedSnapshotPreserved !== true
    || request.historicalPrivatePreviewPreserved !== true
    || request.customerPriceCalculated !== false
    || request.customerCreditsMutated !== false
    || request.serviceFeeIncluded !== false
    || request.providerOrWorkerExecutionStarted !== false
  ) invalid('exact_edit_apply_request_policy_invalid', 503)

  if (request.referenceLifecycleRequest) {
    validateEditReferenceProductionApplicationLifecycleRequest(
      request.referenceLifecycleRequest,
    )
    if (
      request.referenceLifecycleRequest.actorUserId !== request.actorUserId
      || request.referenceLifecycleRequest.workspaceId !== request.workspaceId
      || request.referenceLifecycleRequest.projectId !== request.projectId
      || request.referenceLifecycleRequest.editSessionId !== request.editSessionId
      || request.referenceLifecycleRequest.expectedPlanningInputRevision
        !== request.expectedPlanningInputRevision
      || request.referenceLifecycleRequest.idempotencyKeyHashSha256
        !== request.idempotencyKeyHashSha256
      || (
        request.referenceLifecycleRequest.mutation !== 'remove'
        && changesReferenceStudyContext(changedFields)
      )
    ) invalid('exact_edit_apply_nested_reference_request_invalid', 503)
  } else if (changedFields.length === 0) {
    invalid('exact_edit_apply_request_has_no_effect', 409)
  }
}

export function validateEditReferenceProductionExactEditApplyReceipt(input: {
  readonly request: EditReferenceProductionExactEditApplyRequest
  readonly receipt: EditReferenceProductionExactEditApplyApiReceipt
}): void {
  validateEditReferenceProductionExactEditApplyRequest(input.request)
  assertExactKeys(input.receipt, RECEIPT_KEYS, 'exact_edit_apply_receipt_shape_invalid')
  const {
    transactionReceiptDigestSha256: expectedDigest,
    ...receiptWithoutDigest
  } = input.receipt
  const expectedReferenceMutation = input.request.referenceLifecycleRequest?.mutation ?? null
  if (
    input.receipt.schemaVersion !== 'edit-reference-production-exact-edit-apply-receipt-v1'
    || input.receipt.sourceAuthority !== 'canonical_exact_edit_apply_rpc'
    || input.receipt.canonicalReceiptValidatedServerSide !== true
    || !isSafeId(input.receipt.transactionId)
    || !SHA256_PATTERN.test(expectedDigest)
    || expectedDigest !== sha256(receiptWithoutDigest)
    || JSON.stringify(input.receipt.changedPreferenceFields)
      !== JSON.stringify(input.request.changedPreferenceFields)
    || input.receipt.referenceMutation !== expectedReferenceMutation
    || input.receipt.committedPreferenceRecordRevision
      !== input.request.expectedPreferenceRecordRevision + 1
    || input.receipt.committedPreferenceRevision
      !== input.request.expectedPreferenceRevision
        + (input.request.changedPreferenceFields.length > 0 ? 1 : 0)
    || input.receipt.committedPlanningInputRevision
      !== input.request.expectedPlanningInputRevision + 1
    || input.receipt.sourcePreparationDisposition
      !== input.request.sourcePreparationDisposition
    || input.receipt.outputFrameDisposition !== input.request.outputFrameDisposition
    || input.receipt.freshPlanAndEstimateRequired !== true
    || input.receipt.approvedSnapshotPreserved !== true
    || input.receipt.historicalPrivatePreviewPreserved !== true
    || input.receipt.productionReleaseReadinessEvaluatedSeparately !== true
    || input.receipt.customerPriceCalculated !== false
    || input.receipt.customerCreditsMutated !== false
    || input.receipt.serviceFeeIncluded !== false
    || input.receipt.providerOrWorkerExecutionStarted !== false
    || !Number.isFinite(Date.parse(input.receipt.committedAt))
    || Date.parse(input.receipt.committedAt) < Date.parse(input.request.requestedAt)
  ) invalid('exact_edit_apply_receipt_integrity_invalid', 503)
}

function validateExactEditPreferenceAuthority(
  command: EditReferenceProductionExactEditApplyCommand,
  authority: EditReferenceProductionExactEditPreferenceAuthority,
): void {
  if (
    command.schemaVersion !== EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_COMMAND_VERSION
    || !isSafeId(command.workspaceId)
    || !isSafeId(command.projectId)
    || !isSafeId(command.editSessionId)
    || !SHA256_PATTERN.test(command.expectedPreferenceFingerprintSha256)
    || !Number.isInteger(command.expectedPreferenceRecordRevision)
    || command.expectedPreferenceRecordRevision < 0
    || !Number.isInteger(command.expectedPreferenceRevision)
    || command.expectedPreferenceRevision < 0
    || !Number.isInteger(command.expectedPlanningInputRevision)
    || command.expectedPlanningInputRevision < 0
  ) invalid('exact_edit_apply_command_identity_or_revision_invalid', 400)
  if (
    authority.sourceAuthority !== 'canonical_exact_edit_preference_repository'
    || authority.runtimeSource !== 'verified_live'
    || !isSafeId(authority.authorityReadReceiptId)
  ) invalid('exact_edit_apply_preference_authority_not_production_verified', 503)
  if (
    authority.workspaceId !== command.workspaceId
    || authority.projectId !== command.projectId
    || authority.editSessionId !== command.editSessionId
  ) invalid('exact_edit_apply_preference_authority_scope_mismatch', 403)
  if (
    authority.recordRevision !== command.expectedPreferenceRecordRevision
    || authority.preferenceRevision !== command.expectedPreferenceRevision
    || authority.planningInputRevision !== command.expectedPlanningInputRevision
  ) invalid('exact_edit_apply_preference_authority_revision_changed', 409)
  const values = exactEditPreferenceValuesSchema.safeParse(authority.values)
  if (
    !values.success
    || authority.preferenceFingerprintSha256 !== sha256(values.data)
    || authority.preferenceFingerprintSha256 !== command.expectedPreferenceFingerprintSha256
  ) invalid('exact_edit_apply_preference_authority_fingerprint_changed', 409)
  if (authority.locked || authority.lifecyclePhase !== 'planning') {
    invalid('exact_edit_apply_preferences_locked_use_chat_revision', 409)
  }
  const currentApplicationShapeValid = authority.currentApplicationState === 'connected'
    ? authority.currentApplicationId !== null && isSafeId(authority.currentApplicationId)
    : authority.currentApplicationId === null
  if (!currentApplicationShapeValid) {
    invalid('exact_edit_apply_current_application_state_invalid', 409)
  }
}

function validatePreferencePatch(
  patch: EditReferenceProductionExactEditPreferencePatch,
): EditReferenceProductionExactEditPreferencePatch {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    invalid('exact_edit_apply_preference_patch_shape_invalid', 400)
  }
  const keys = Object.keys(patch)
  if (
    keys.some((key) => !exactEditPreferenceFieldKeys.includes(key as ExactEditPreferenceFieldKey))
    || keys.some((key) => patch[key as ExactEditPreferenceFieldKey] === undefined)
  ) invalid('exact_edit_apply_preference_patch_shape_invalid', 400)
  const parsed = exactEditPreferenceValuesSchema.partial().strict().safeParse(patch)
  if (!parsed.success) invalid('exact_edit_apply_preference_patch_invalid', 400)
  return Object.freeze({ ...parsed.data })
}

function prepareNestedReferenceLifecycle(input: {
  readonly command: EditReferenceProductionExactEditApplyCommand
  readonly authenticated: EditReferenceProductionAuthenticatedHttpAuthority
  readonly exactEditPreferenceAuthority: EditReferenceProductionExactEditPreferenceAuthority
  readonly preparedApplication: PreferenceApplicationRecord | null
  readonly outputFrameAuthority: EditReferenceProductionOutputFrameAuthority | null
  readonly idempotencyKeyHashSha256: string
  readonly serverRequestedAt: string
  readonly changedPreferenceFields: readonly ExactEditPreferenceFieldKey[]
}): EditReferenceProductionApplicationLifecycleRequest | null {
  const lifecycle = input.command.editReferenceLifecycle
  if (!lifecycle) {
    if (input.preparedApplication || input.outputFrameAuthority) {
      invalid('exact_edit_apply_hidden_reference_inputs_forbidden', 400)
    }
    if (
      input.exactEditPreferenceAuthority.currentApplicationState === 'connected'
      && changesReferenceStudyContext(input.changedPreferenceFields)
    ) invalid('exact_edit_apply_connected_reference_context_change_requires_remove', 409)
    return null
  }
  if (!input.preparedApplication) {
    invalid('exact_edit_apply_reference_application_missing', 409)
  }
  if (
    lifecycle.workspaceId !== input.command.workspaceId
    || lifecycle.projectId !== input.command.projectId
    || lifecycle.editSessionId !== input.command.editSessionId
    || lifecycle.expectedPlanningInputRevision !== input.command.expectedPlanningInputRevision
  ) invalid('exact_edit_apply_reference_subcommand_scope_or_revision_mismatch', 409)

  const currentApplicationId = input.exactEditPreferenceAuthority.currentApplicationId
  if (
    (lifecycle.mutation === 'apply' && (
      input.exactEditPreferenceAuthority.currentApplicationState === 'connected'
      || lifecycle.expectedCurrentApplicationId !== null
    ))
    || ((lifecycle.mutation === 'replace' || lifecycle.mutation === 'remove') && (
      input.exactEditPreferenceAuthority.currentApplicationState !== 'connected'
      || lifecycle.expectedCurrentApplicationId !== currentApplicationId
    ))
  ) invalid('exact_edit_apply_reference_compare_and_swap_changed', 409)
  if (
    lifecycle.mutation !== 'remove'
    && changesReferenceStudyContext(input.changedPreferenceFields)
  ) invalid('exact_edit_apply_reference_study_context_changed', 409)
  if (
    lifecycle.mutation !== 'remove'
    && input.outputFrameAuthority?.exactEditPreferenceRecordRevision
      !== input.command.expectedPreferenceRecordRevision
  ) invalid('exact_edit_apply_output_frame_preference_revision_changed', 409)

  return prepareEditReferenceProductionLifecycleRequest({
    command: lifecycle,
    authenticated: input.authenticated,
    preparedApplication: input.preparedApplication,
    outputFrameAuthority: input.outputFrameAuthority,
    idempotencyKeyHashSha256: input.idempotencyKeyHashSha256,
    serverRequestedAt: input.serverRequestedAt,
  }).request
}

function changesReferenceStudyContext(
  fields: readonly ExactEditPreferenceFieldKey[],
): boolean {
  return fields.includes('editLevel') || fields.includes('targetPlatform')
}

function validateServerInputs(idempotencyKeyHashSha256: string, requestedAt: string): void {
  if (!SHA256_PATTERN.test(idempotencyKeyHashSha256)) {
    invalid('exact_edit_apply_idempotency_hash_invalid', 400)
  }
  if (!Number.isFinite(Date.parse(requestedAt))) {
    invalid('exact_edit_apply_server_time_invalid', 500)
  }
}

function assertExactKeys(
  value: object,
  expected: readonly string[],
  reason: string,
): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(reason, 400)
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    invalid(reason, 400)
  }
}

function isSafeId(value: string): boolean {
  return ID_PATTERN.test(value) && !value.includes('..')
}

function sha256(value: unknown): string {
  return createHash('sha256').update(stableJson(value)).digest('hex')
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((entry) => stableJson(entry)).join(',')}]`
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(',')}}`
  }
  const serialized = JSON.stringify(value)
  if (serialized === undefined) invalid('exact_edit_apply_non_canonical_value', 400)
  return serialized
}

function invalid(reason: string, status: number): never {
  throw new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'Current Edit Preferences could not be bound to one verified exact-edit transaction.',
    status,
    { reason, remoteMutationAttempted: false },
  )
}
