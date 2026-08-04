import { createHash } from 'node:crypto'
import type {
  EditReferenceStudyChatReasoningAttemptInternalCostStatus,
} from './edit-reference-study-chat-reasoning-attempt-contract'
import type {
  EditReferenceStudyChatReasoningResult,
} from './edit-reference-study-chat-reasoning-contract'

export const EDIT_REFERENCE_STUDY_CHAT_PROVIDER_REQUEST_VERSION =
  'edit-reference-study-chat-provider-request-v1' as const

export const EDIT_REFERENCE_STUDY_CHAT_PROVIDER_REQUEST_STATES = [
  'not_submitted',
  'submission_unknown',
  'submitted',
  'completed',
  'failed',
  'operator_review_required',
] as const

export type EditReferenceStudyChatProviderRequestState =
  typeof EDIT_REFERENCE_STUDY_CHAT_PROVIDER_REQUEST_STATES[number]

export const EDIT_REFERENCE_STUDY_CHAT_PROVIDER_OBSERVATION_STATUSES = [
  'pending',
  'answered',
  'failed',
  'not_found',
  'unknown',
] as const

export type EditReferenceStudyChatProviderObservationStatus =
  typeof EDIT_REFERENCE_STUDY_CHAT_PROVIDER_OBSERVATION_STATUSES[number]

export interface EditReferenceStudyChatProviderRequestRecord {
  schemaVersion: typeof EDIT_REFERENCE_STUDY_CHAT_PROVIDER_REQUEST_VERSION
  id: string
  workspaceId: string
  actorUserId: string
  editReferenceId: string
  studySessionId: string
  reasoningAttemptId: string
  revision: number
  state: EditReferenceStudyChatProviderRequestState
  reasoningRequestDigestSha256: string
  executionCommandDigestSha256: string
  providerRoute: string
  providerModelId: string
  providerModelRevision: string
  providerModelAggregateSha256: string
  providerLookupMode: 'provider_request_id_or_idempotency_key'
  reservationIdempotencyKeyHashSha256: string
  submissionIdempotencyKeyHashSha256: string
  submissionAuthorizationIdempotencyKeyHashSha256?: string
  providerRequestId?: string
  providerRequestIdDigestSha256?: string
  providerCallMayHaveOccurred: boolean
  resubmissionAllowed: false
  operatorReviewRequired: boolean
  reconciliationCount: number
  lastObservationIdDigestSha256?: string
  lastObservationDigestSha256?: string
  resultDigestSha256?: string
  internalCostStatus: EditReferenceStudyChatReasoningAttemptInternalCostStatus
  meteredInternalCostMicros: string | null
  usageEventIds: string[]
  internalCostRecordIds: string[]
  customerPriceCalculated: false
  customerCreditsMutated: false
  serviceFeeIncluded: false
  createdAt: string
  updatedAt: string
  submissionAuthorizedAt?: string
  submittedAt?: string
  lastReconciledAt?: string
  terminalAt?: string
  privateInternalOnly: true
}

export interface ReserveEditReferenceStudyChatProviderRequestInput {
  readonly workspaceId: string
  readonly expectedAttemptRevision: number
  readonly providerRoute: string
  readonly providerModelId: string
  readonly providerModelRevision: string
  readonly providerModelAggregateSha256: string
  readonly providerLookupMode: 'provider_request_id_or_idempotency_key'
  readonly providerSubmissionIdempotencyKey: string
}

export interface AuthorizeEditReferenceStudyChatProviderSubmissionInput {
  readonly workspaceId: string
  readonly expectedProviderRequestRevision: number
}

export interface ReconcileEditReferenceStudyChatProviderRequestInput {
  readonly workspaceId: string
  readonly expectedProviderRequestRevision: number
  readonly observationId: string
  readonly observationStatus: EditReferenceStudyChatProviderObservationStatus
  readonly providerRequestId: string | null
  readonly result: EditReferenceStudyChatReasoningResult | null
}

export interface EditReferenceStudyChatProviderRequestReservationData {
  readonly providerRequest: EditReferenceStudyChatProviderRequestRecord
  readonly disposition: 'created' | 'idempotent_replay' | 'attempt_deduplicated'
}

export interface EditReferenceStudyChatProviderSubmissionAuthorizationData {
  readonly providerRequest: EditReferenceStudyChatProviderRequestRecord
  readonly disposition: 'authorized_once' | 'idempotent_replay_blocked' | 'already_consumed_blocked'
  readonly submissionAuthorized: boolean
}

export interface EditReferenceStudyChatProviderReconciliationData {
  readonly providerRequest: EditReferenceStudyChatProviderRequestRecord
  readonly reconciliationDisposition:
    | 'pending_recorded'
    | 'terminal_settled'
    | 'operator_review_required'
    | 'terminal_replay'
  readonly reasoningAttemptTerminal: boolean
  readonly providerResubmissionAllowed: false
}

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/

export function validateReserveEditReferenceStudyChatProviderRequestInput(
  input: ReserveEditReferenceStudyChatProviderRequestInput,
): void {
  if (
    !ID_PATTERN.test(input.workspaceId)
    || !Number.isSafeInteger(input.expectedAttemptRevision)
    || input.expectedAttemptRevision < 1
    || !ID_PATTERN.test(input.providerRoute)
    || !ID_PATTERN.test(input.providerModelId)
    || !ID_PATTERN.test(input.providerModelRevision)
    || !SHA256_PATTERN.test(input.providerModelAggregateSha256)
    || input.providerLookupMode !== 'provider_request_id_or_idempotency_key'
    || typeof input.providerSubmissionIdempotencyKey !== 'string'
    || input.providerSubmissionIdempotencyKey.trim().length < 1
    || input.providerSubmissionIdempotencyKey.length > 200
  ) throw new Error('The private Study Chat provider-request reservation is invalid.')
}

export function validateAuthorizeEditReferenceStudyChatProviderSubmissionInput(
  input: AuthorizeEditReferenceStudyChatProviderSubmissionInput,
): void {
  if (
    !ID_PATTERN.test(input.workspaceId)
    || !Number.isSafeInteger(input.expectedProviderRequestRevision)
    || input.expectedProviderRequestRevision < 1
  ) throw new Error('The private Study Chat provider submission authorization is invalid.')
}

export function validateReconcileEditReferenceStudyChatProviderRequestInput(
  input: ReconcileEditReferenceStudyChatProviderRequestInput,
): void {
  if (
    !ID_PATTERN.test(input.workspaceId)
    || !Number.isSafeInteger(input.expectedProviderRequestRevision)
    || input.expectedProviderRequestRevision < 1
    || !ID_PATTERN.test(input.observationId)
    || !EDIT_REFERENCE_STUDY_CHAT_PROVIDER_OBSERVATION_STATUSES.includes(input.observationStatus)
    || (input.providerRequestId !== null && !ID_PATTERN.test(input.providerRequestId))
  ) throw new Error('The private Study Chat provider reconciliation observation is invalid.')

  if (input.observationStatus === 'pending') {
    if (!input.providerRequestId || input.result !== null) {
      throw new Error('A pending provider observation requires one provider request ID and no result.')
    }
    return
  }
  if (input.observationStatus === 'answered') {
    if (!input.providerRequestId || input.result?.status !== 'answered') {
      throw new Error('An answered provider observation requires one provider request ID and answered result.')
    }
    return
  }
  if (input.observationStatus === 'failed') {
    if (!input.providerRequestId || input.result?.status !== 'blocked' || !input.result.providerCallMade) {
      throw new Error('A failed provider observation requires one provider request ID and charged-or-attempted blocked result.')
    }
    return
  }
  if (input.result !== null) {
    throw new Error('Unknown or missing provider truth cannot include a reasoning result.')
  }
}

export function hashEditReferenceStudyChatProviderObservation(
  input: ReconcileEditReferenceStudyChatProviderRequestInput,
): string {
  validateReconcileEditReferenceStudyChatProviderRequestInput(input)
  return createHash('sha256').update(JSON.stringify({
    workspaceId: input.workspaceId,
    observationIdDigestSha256: sha256(input.observationId),
    observationStatus: input.observationStatus,
    providerRequestId: input.providerRequestId,
    result: input.result,
  })).digest('hex')
}

export function hashEditReferenceStudyChatProviderSubmissionKey(value: string): string {
  const normalized = value?.trim()
  if (!normalized || normalized.length > 200) {
    throw new Error('The private Study Chat provider submission authority is invalid.')
  }
  return sha256(normalized)
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
