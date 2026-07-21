import type {
  EditReferenceStudyChatReasoningBlockerCode,
  EditReferenceStudyChatReasoningRequest,
  EditReferenceStudyChatReasoningResult,
} from './edit-reference-study-chat-reasoning-contract'
import type {
  EditReferenceDNAQAStatus,
  EditReferenceDNAStatus,
  EditReferenceStatus,
  EditReferenceStudyLifecycleStatus,
  PreferenceEvidenceStatus,
} from '../../src/types/edit-reference'

export const EDIT_REFERENCE_STUDY_CHAT_REASONING_ATTEMPT_VERSION =
  'edit-reference-study-chat-reasoning-attempt-v1' as const

export const EDIT_REFERENCE_STUDY_CHAT_REASONING_ATTEMPT_STATES = [
  'reserved',
  'running',
  'completed',
  'failed',
  'cost_unverified',
  'cancelled',
] as const

export type EditReferenceStudyChatReasoningAttemptState =
  typeof EDIT_REFERENCE_STUDY_CHAT_REASONING_ATTEMPT_STATES[number]

export type EditReferenceStudyChatReasoningProviderExecutionState =
  | 'not_started'
  | 'execution_authorized_once'
  | 'not_called'
  | 'called_no_cost'
  | 'called_metered'
  | 'called_cost_unverified'

export type EditReferenceStudyChatReasoningAttemptInternalCostStatus =
  | 'not_incurred'
  | 'authorized_not_incurred'
  | 'metered'
  | 'unverified'

export type EditReferenceStudyChatReasoningAttemptTerminalReason =
  | EditReferenceStudyChatReasoningBlockerCode
  | 'study_revision_advanced'
  | 'cancelled_before_execution'

export interface EditReferenceStudyChatContextStateSnapshot {
  referenceStatus: EditReferenceStatus
  studyStatus: EditReferenceStudyLifecycleStatus
  evidenceStatus: PreferenceEvidenceStatus
  dnaStatus: EditReferenceDNAStatus
  qaStatus: EditReferenceDNAQAStatus
}

/**
 * Private control-plane record. It deliberately stores the bounded request and
 * sanitized result, never the provider payload, hidden reasoning, raw media,
 * transcript bytes, signed URLs, customer price, or customer-credit mutation.
 */
export interface EditReferenceStudyChatReasoningAttemptRecord {
  schemaVersion: typeof EDIT_REFERENCE_STUDY_CHAT_REASONING_ATTEMPT_VERSION
  id: string
  workspaceId: string
  actorUserId: string
  editReferenceId: string
  studySessionId: string
  revision: number
  state: EditReferenceStudyChatReasoningAttemptState
  request: EditReferenceStudyChatReasoningRequest
  requestDigestSha256: string
  clientMessageDigestSha256: string
  userMessageId: string
  userMessageContentDigestSha256: string
  /**
   * Present on attempts reserved by the mounted Study Chat flow. These fields
   * let execution reconstruct the exact pre-mutation reasoning context after
   * the user's direction has already been saved durably as evidence.
   */
  savedDirectionEvidenceId?: string
  contextStateAtReservation?: EditReferenceStudyChatContextStateSnapshot
  studyRevisionAtReservation: number
  studyRevisionAfterReservation: number
  reservationIdempotencyKeyHashSha256: string
  executionCommandDigestSha256?: string
  executionIdempotencyKeyHashSha256?: string
  assistantMessageId?: string
  result?: EditReferenceStudyChatReasoningResult
  resultDigestSha256?: string
  providerExecutionState: EditReferenceStudyChatReasoningProviderExecutionState
  internalCostStatus: EditReferenceStudyChatReasoningAttemptInternalCostStatus
  meteredInternalCostMicros: string | null
  usageEventIds: string[]
  internalCostRecordIds: string[]
  customerPriceCalculated: false
  customerCreditsMutated: false
  serviceFeeIncluded: false
  terminalReason?: EditReferenceStudyChatReasoningAttemptTerminalReason
  createdAt: string
  reservedAt: string
  startedAt?: string
  settledAt?: string
  privateInternalOnly: true
}

export interface ReserveEditReferenceStudyChatReasoningAttemptInput {
  request: EditReferenceStudyChatReasoningRequest
  clientMessageId: string
  userMessage: string
  findingCorrectionEvidenceId?: string
}

export interface StartEditReferenceStudyChatReasoningAttemptInput {
  workspaceId: string
  expectedAttemptRevision: number
  executionCommandId: string
}

export interface SettleEditReferenceStudyChatReasoningAttemptInput {
  workspaceId: string
  expectedAttemptRevision: number
  result: EditReferenceStudyChatReasoningResult
}

export interface CancelEditReferenceStudyChatReasoningAttemptInput {
  workspaceId: string
  expectedAttemptRevision: number
}

export type EditReferenceStudyChatReasoningReservationDisposition =
  | 'created'
  | 'idempotent_replay'
  | 'client_message_deduplicated'

export interface EditReferenceStudyChatReasoningReservationData {
  attempt: EditReferenceStudyChatReasoningAttemptRecord
  disposition: EditReferenceStudyChatReasoningReservationDisposition
}

export type EditReferenceStudyChatReasoningExecutionDisposition =
  | 'authorized_once'
  | 'idempotent_replay_blocked'
  | 'duplicate_command_blocked'

export interface EditReferenceStudyChatReasoningExecutionData {
  attempt: EditReferenceStudyChatReasoningAttemptRecord
  disposition: EditReferenceStudyChatReasoningExecutionDisposition
  providerCallAuthorized: boolean
}
