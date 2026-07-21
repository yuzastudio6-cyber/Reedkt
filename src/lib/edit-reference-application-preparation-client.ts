import { callReeditProApi } from '../backend/api/frontend-api-client'
import type {
  EditReferenceApplicationPreparationIntent,
  EditReferenceApplicationPreparationReceipt,
} from '../types/edit-reference-production-application-preparation-api'
import {
  EDIT_REFERENCE_APPLICATION_PREPARATION_RECEIPT_VERSION,
} from '../types/edit-reference-production-application-preparation-api'
import {
  EDIT_REFERENCE_PRODUCTION_PREPARED_APPLICATION_AUTHORITY_VERSION,
} from '../types/edit-reference-production-exact-edit-apply-api'
import type { ProjectPersistenceScope } from './project-persistence-scope'

export type EditReferenceApplicationPreparationResult =
  | {
      readonly ok: true
      readonly receipt: EditReferenceApplicationPreparationReceipt
      readonly warnings: readonly string[]
    }
  | {
      readonly ok: false
      readonly message: string
      readonly retryable: boolean
      readonly warnings: readonly string[]
    }

export async function prepareCanonicalEditReferenceApplication(input: {
  readonly scope: ProjectPersistenceScope
  readonly projectId: string
  readonly editSessionId: string
  readonly intent: EditReferenceApplicationPreparationIntent
  readonly idempotencyKey: string
}): Promise<EditReferenceApplicationPreparationResult> {
  if (
    input.intent.workspaceId !== input.scope.workspaceId
    || !safeIdentifier(input.projectId)
    || !safeIdentifier(input.editSessionId)
    || !safeIdempotencyKey(input.idempotencyKey)
  ) {
    return failure(
      'The Edit Reference preparation no longer matches this exact edit. Refresh before retrying.',
      false,
    )
  }

  const invoke = () => callReeditProApi<
    EditReferenceApplicationPreparationIntent,
    { receipt: unknown }
  >(
    'planning.exactEditPreferences.prepareReferenceApplication',
    input.intent,
    {
      params: {
        projectId: input.projectId,
        editSessionId: input.editSessionId,
      },
      context: {
        workspaceId: input.scope.workspaceId,
        projectId: input.projectId,
        userId: input.scope.backendUserId ?? input.scope.userId,
      },
      idempotencyKey: input.idempotencyKey,
    },
  )

  let response = await invoke()
  // This is the only automatic mutation replay in this client. It repeats the
  // byte-identical request under the same durable key so a committed response
  // loss can be recovered without creating another application.
  if (!response.ok && isRetryableResponse(response)) response = await invoke()
  if (!response.ok) {
    return failure(
      response.error?.message
        ?? 'The Edit Reference could not be prepared. Your selection is preserved for retry.',
      isRetryableResponse(response),
      response.warnings,
    )
  }
  if (!isReceipt(response.data?.receipt, input)) {
    return failure(
      'The preparation response could not be verified. Keep the selection and retry with the same Apply action.',
      true,
      response.warnings,
    )
  }
  return {
    ok: true,
    receipt: structuredClone(response.data.receipt),
    warnings: response.warnings,
  }
}

function isRetryableResponse(response: {
  readonly ok: boolean
  readonly statusCode: number
  readonly error?: { readonly code: string }
}): boolean {
  return response.error?.code === 'http_transport_failed'
    || response.statusCode === 408
    || response.statusCode === 429
    || response.statusCode >= 500
}

function isReceipt(
  value: unknown,
  input: Parameters<typeof prepareCanonicalEditReferenceApplication>[0],
): value is EditReferenceApplicationPreparationReceipt {
  if (!value || typeof value !== 'object') return false
  const receipt = value as Partial<EditReferenceApplicationPreparationReceipt>
  const authority = receipt.applicationAuthority
  return receipt.schemaVersion === EDIT_REFERENCE_APPLICATION_PREPARATION_RECEIPT_VERSION
    && receipt.sourceAuthority === 'canonical_preference_application_preparation'
    && (receipt.runtimeSource === 'verified_live' || receipt.runtimeSource === 'controlled_local')
    && isSha256(receipt.preparationRequestDigestSha256)
    && isSha256(receipt.receiptDigestSha256)
    && safeIdentifier(receipt.transactionId)
    && typeof receipt.editReferenceName === 'string'
    && receipt.editReferenceName.trim().length > 0
    && receipt.editReferenceName.length <= 240
    && typeof receipt.replayed === 'boolean'
    && Number.isFinite(Date.parse(receipt.preparedAt ?? ''))
    && receipt.authenticatedScopeReboundServerSide === true
    && receipt.canonicalReferenceDnaQaAndTargetStudyReRead === true
    && receipt.applicationConnectedToEdit === false
    && receipt.planOrEstimateInvalidated === false
    && receipt.approvedSnapshotMutated === false
    && receipt.customerPriceCalculated === false
    && receipt.customerCreditsMutated === false
    && receipt.serviceFeeIncluded === false
    && receipt.providerOrWorkerExecutionStarted === false
    && Boolean(authority)
    && authority?.schemaVersion === EDIT_REFERENCE_PRODUCTION_PREPARED_APPLICATION_AUTHORITY_VERSION
    && authority.sourceAuthority === 'canonical_preference_application_repository'
    && authority.runtimeSource === 'verified_live'
    && safeIdentifier(authority.authorityReadReceiptId)
    && authority?.workspaceId === input.intent.workspaceId
    && authority.projectId === input.projectId
    && authority.editSessionId === input.editSessionId
    && authority.editReferenceId === input.intent.editReferenceId
    && authority.studySessionId === input.intent.studySessionId
    && authority.dnaVersionId === input.intent.dnaVersionId
    && safeIdentifier(authority.dnaQaResultId)
    && safeIdentifier(authority.applicationId)
    && Number.isInteger(authority.applicationVersionNumber)
    && authority.applicationVersionNumber >= 1
    && authority.targetUnderstandingPackageDigestSha256
      === input.intent.targetUnderstandingPackageDigestSha256
    && authority.expectedReferenceRevision === input.intent.expectedReferenceRevision
    && authority.status === 'prepared'
    && authority.connectionState === 'not_connected'
    && isSha256(authority.applicationContentDigestSha256)
    && isSha256(authority.applicationContextHashSha256)
}

function failure(
  message: string,
  retryable: boolean,
  warnings: readonly string[] = [],
): EditReferenceApplicationPreparationResult {
  return { ok: false, message, retryable, warnings }
}

function safeIdentifier(value: unknown): value is string {
  return typeof value === 'string'
    && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/.test(value)
}

function safeIdempotencyKey(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 8 && value.length <= 200
}

function isSha256(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
}
