import { createHash } from 'node:crypto'

export const EDIT_REFERENCE_STUDY_CHAT_PROVIDER_CHECKBACK_VERSION =
  'edit-reference-study-chat-provider-checkback-v1' as const

export const EDIT_REFERENCE_STUDY_CHAT_PROVIDER_CHECKBACK_STATES = [
  'scheduled',
  'leased',
  'operator_review_required',
  'terminal',
  'cancelled',
] as const

export type EditReferenceStudyChatProviderCheckbackState =
  typeof EDIT_REFERENCE_STUDY_CHAT_PROVIDER_CHECKBACK_STATES[number]

export const EDIT_REFERENCE_STUDY_CHAT_PROVIDER_CHECKBACK_REASONS = [
  'submission_unknown',
  'provider_pending',
  'lookup_unavailable',
  'operator_recovery',
] as const

export type EditReferenceStudyChatProviderCheckbackReason =
  typeof EDIT_REFERENCE_STUDY_CHAT_PROVIDER_CHECKBACK_REASONS[number]

export const EDIT_REFERENCE_STUDY_CHAT_PROVIDER_CHECKBACK_OUTCOMES = [
  'not_checked',
  'provider_pending',
  'lookup_unavailable',
  'invalid_provider_observation',
  'operator_review_required',
  'automatic_lookup_exhausted',
  'terminal_settled',
] as const

export type EditReferenceStudyChatProviderCheckbackOutcome =
  typeof EDIT_REFERENCE_STUDY_CHAT_PROVIDER_CHECKBACK_OUTCOMES[number]

export const EDIT_REFERENCE_STUDY_CHAT_PROVIDER_CHECKBACK_STOP_REASONS = [
  'operator_pause',
  'owner_cancelled_checkback',
  'security_hold',
] as const

export type EditReferenceStudyChatProviderCheckbackStopReason =
  typeof EDIT_REFERENCE_STUDY_CHAT_PROVIDER_CHECKBACK_STOP_REASONS[number]

/**
 * Private lookup-control record. It can authorize a provider status lookup,
 * never a provider submission. Provider submission keys, lease tokens,
 * credentials, payloads, URLs, customer prices, and customer-credit mutations
 * are deliberately excluded from durable storage.
 */
export interface EditReferenceStudyChatProviderCheckbackRecord {
  schemaVersion: typeof EDIT_REFERENCE_STUDY_CHAT_PROVIDER_CHECKBACK_VERSION
  id: string
  workspaceId: string
  actorUserId: string
  editReferenceId: string
  studySessionId: string
  reasoningAttemptId: string
  reasoningProviderRequestId: string
  revision: number
  state: EditReferenceStudyChatProviderCheckbackState
  scheduleReason: EditReferenceStudyChatProviderCheckbackReason
  nextCheckAt: string
  deadlineAt: string
  maxLookupAttempts: number
  lookupAttemptCount: number
  leaseGeneration: number
  activeLeaseTokenHashSha256?: string
  activeLeaseOwnerIdDigestSha256?: string
  activeLeaseClaimIdempotencyKeyHashSha256?: string
  leasedAt?: string
  leaseExpiresAt?: string
  lastLookupStartedAt?: string
  lastLookupCompletedAt?: string
  lastOutcome: EditReferenceStudyChatProviderCheckbackOutcome
  lastOutcomeProviderRequestRevision: number | null
  operatorReviewRequired: boolean
  automaticLookupStopped: boolean
  stopReason?: EditReferenceStudyChatProviderCheckbackStopReason
  stoppedAt?: string
  terminalAt?: string
  operatorRecoveryCount: number
  lastOperatorRecoveryCommandDigestSha256?: string
  lookupOnly: true
  providerSubmissionAllowed: false
  providerResubmissionAllowed: false
  providerSubmissionIdempotencyKeyPersisted: false
  providerCancellationAttempted: false
  providerCancellationConfirmed: false
  customerPriceCalculated: false
  customerCreditsMutated: false
  serviceFeeIncluded: false
  createdAt: string
  updatedAt: string
  privateInternalOnly: true
}

export interface ScheduleEditReferenceStudyChatProviderCheckbackInput {
  readonly workspaceId: string
  readonly expectedProviderRequestRevision: number
  readonly scheduleReason: Exclude<EditReferenceStudyChatProviderCheckbackReason, 'operator_recovery'>
  readonly nextCheckAt: string
  readonly deadlineAt: string
  readonly maxLookupAttempts: number
}

export interface ClaimEditReferenceStudyChatProviderCheckbackInput {
  readonly workspaceId: string
  readonly expectedCheckbackRevision: number
  readonly workerId: string
  readonly leaseDurationMs: number
}

export interface SettleEditReferenceStudyChatProviderCheckbackInput {
  readonly workspaceId: string
  readonly expectedCheckbackRevision: number
  readonly expectedProviderRequestRevision: number
  readonly leaseToken: string
  readonly outcome: Exclude<
    EditReferenceStudyChatProviderCheckbackOutcome,
    'not_checked' | 'automatic_lookup_exhausted'
  >
  readonly nextCheckAt: string | null
}

export interface StopEditReferenceStudyChatProviderCheckbackInput {
  readonly workspaceId: string
  readonly expectedCheckbackRevision: number
  readonly stopReason: EditReferenceStudyChatProviderCheckbackStopReason
}

export interface ResumeEditReferenceStudyChatProviderCheckbackInput {
  readonly workspaceId: string
  readonly expectedCheckbackRevision: number
  readonly expectedProviderRequestRevision: number
  readonly operatorRecoveryCommandId: string
  readonly nextCheckAt: string
  readonly deadlineAt: string
  readonly maxLookupAttempts: number
}

export interface EditReferenceStudyChatProviderCheckbackScheduleData {
  readonly checkback: EditReferenceStudyChatProviderCheckbackRecord
  readonly disposition: 'created' | 'idempotent_replay' | 'provider_request_deduplicated' | 'already_terminal'
}

export interface EditReferenceStudyChatProviderCheckbackClaimData {
  readonly checkback: EditReferenceStudyChatProviderCheckbackRecord
  readonly disposition:
    | 'authorized'
    | 'authorized_replay'
    | 'already_leased'
    | 'not_due'
    | 'operator_review_required'
    | 'terminal'
    | 'cancelled'
  readonly lookupAuthorized: boolean
  readonly leaseToken: string | null
}

export interface EditReferenceStudyChatProviderCheckbackSettlementData {
  readonly checkback: EditReferenceStudyChatProviderCheckbackRecord
  readonly disposition:
    | 'rescheduled'
    | 'automatic_lookup_exhausted'
    | 'operator_review_required'
    | 'terminal'
    | 'idempotent_replay'
  readonly providerSubmissionAllowed: false
  readonly providerResubmissionAllowed: false
}

export interface EditReferenceStudyChatProviderCheckbackControlData {
  readonly checkback: EditReferenceStudyChatProviderCheckbackRecord
  readonly disposition: 'stopped' | 'resumed' | 'terminal' | 'idempotent_replay'
  readonly providerCancellationAttempted: false
  readonly providerCancellationConfirmed: false
  readonly providerResubmissionAllowed: false
}

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const MIN_LEASE_MS = 1_000
const MAX_LEASE_MS = 15 * 60 * 1_000
const MAX_LOOKUP_ATTEMPTS = 32

export function validateScheduleEditReferenceStudyChatProviderCheckbackInput(
  input: ScheduleEditReferenceStudyChatProviderCheckbackInput,
): void {
  if (
    !ID_PATTERN.test(input.workspaceId)
    || !positiveRevision(input.expectedProviderRequestRevision)
    || !['submission_unknown', 'provider_pending', 'lookup_unavailable'].includes(input.scheduleReason)
    || !validWindow(input.nextCheckAt, input.deadlineAt)
    || !Number.isSafeInteger(input.maxLookupAttempts)
    || input.maxLookupAttempts < 1
    || input.maxLookupAttempts > MAX_LOOKUP_ATTEMPTS
  ) throw new Error('The private Study Chat provider checkback schedule is invalid.')
}

export function validateClaimEditReferenceStudyChatProviderCheckbackInput(
  input: ClaimEditReferenceStudyChatProviderCheckbackInput,
): void {
  if (
    !ID_PATTERN.test(input.workspaceId)
    || !positiveRevision(input.expectedCheckbackRevision)
    || !ID_PATTERN.test(input.workerId)
    || !Number.isSafeInteger(input.leaseDurationMs)
    || input.leaseDurationMs < MIN_LEASE_MS
    || input.leaseDurationMs > MAX_LEASE_MS
  ) throw new Error('The private Study Chat provider checkback lease claim is invalid.')
}

export function validateSettleEditReferenceStudyChatProviderCheckbackInput(
  input: SettleEditReferenceStudyChatProviderCheckbackInput,
): void {
  if (
    !ID_PATTERN.test(input.workspaceId)
    || !positiveRevision(input.expectedCheckbackRevision)
    || !positiveRevision(input.expectedProviderRequestRevision)
    || typeof input.leaseToken !== 'string'
    || input.leaseToken.length < 16
    || input.leaseToken.length > 200
    || ![
      'provider_pending',
      'lookup_unavailable',
      'invalid_provider_observation',
      'operator_review_required',
      'terminal_settled',
    ].includes(input.outcome)
    || (input.nextCheckAt !== null && !isIsoDate(input.nextCheckAt))
    || (['provider_pending', 'lookup_unavailable'].includes(input.outcome) !== (input.nextCheckAt !== null))
  ) throw new Error('The private Study Chat provider checkback settlement is invalid.')
}

export function validateStopEditReferenceStudyChatProviderCheckbackInput(
  input: StopEditReferenceStudyChatProviderCheckbackInput,
): void {
  if (
    !ID_PATTERN.test(input.workspaceId)
    || !positiveRevision(input.expectedCheckbackRevision)
    || !EDIT_REFERENCE_STUDY_CHAT_PROVIDER_CHECKBACK_STOP_REASONS.includes(input.stopReason)
  ) throw new Error('The private Study Chat provider checkback stop command is invalid.')
}

export function validateResumeEditReferenceStudyChatProviderCheckbackInput(
  input: ResumeEditReferenceStudyChatProviderCheckbackInput,
): void {
  if (
    !ID_PATTERN.test(input.workspaceId)
    || !positiveRevision(input.expectedCheckbackRevision)
    || !positiveRevision(input.expectedProviderRequestRevision)
    || !ID_PATTERN.test(input.operatorRecoveryCommandId)
    || !validWindow(input.nextCheckAt, input.deadlineAt)
    || !Number.isSafeInteger(input.maxLookupAttempts)
    || input.maxLookupAttempts < 1
    || input.maxLookupAttempts > MAX_LOOKUP_ATTEMPTS
  ) throw new Error('The private Study Chat provider checkback recovery command is invalid.')
}

export function deriveEditReferenceStudyChatProviderCheckbackLeaseToken(
  idempotencyKey: string,
): string {
  const normalized = idempotencyKey?.trim()
  if (!normalized || normalized.length > 200) {
    throw new Error('The private Study Chat provider checkback lease authority is invalid.')
  }
  return `er-checkback-lease-${sha256(`${EDIT_REFERENCE_STUDY_CHAT_PROVIDER_CHECKBACK_VERSION}:${normalized}`)}`
}

export function hashEditReferenceStudyChatProviderCheckbackLeaseToken(value: string): string {
  if (typeof value !== 'string' || value.length < 16 || value.length > 200) {
    throw new Error('The private Study Chat provider checkback lease token is invalid.')
  }
  return sha256(value)
}

export function isEditReferenceStudyChatProviderCheckbackSha256(value: unknown): value is string {
  return typeof value === 'string' && SHA256_PATTERN.test(value)
}

function positiveRevision(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 1
}

function validWindow(nextCheckAt: string, deadlineAt: string): boolean {
  return isIsoDate(nextCheckAt)
    && isIsoDate(deadlineAt)
    && Date.parse(nextCheckAt) <= Date.parse(deadlineAt)
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string'
    && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString() === value
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
