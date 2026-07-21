import { createHash } from 'node:crypto'

export const EDIT_REFERENCE_STUDY_CHAT_PROVIDER_WORKFLOW_VERSION =
  'edit-reference-study-chat-provider-workflow-v1' as const

export const EDIT_REFERENCE_STUDY_CHAT_PROVIDER_WORKFLOW_STATES = [
  'scheduled',
  'leased',
  'operator_review_required',
  'terminal',
  'cancelled',
] as const

export type EditReferenceStudyChatProviderWorkflowState =
  typeof EDIT_REFERENCE_STUDY_CHAT_PROVIDER_WORKFLOW_STATES[number]

export const EDIT_REFERENCE_STUDY_CHAT_PROVIDER_WORKFLOW_OUTCOMES = [
  'not_run',
  'heartbeat_recorded',
  'callback_wake_recorded',
  'provider_pending',
  'provider_reconciliation_unavailable',
  'invalid_provider_observation',
  'operator_review_required',
  'automatic_workflow_exhausted',
  'terminal_settled',
  'cancelled',
] as const

export type EditReferenceStudyChatProviderWorkflowOutcome =
  typeof EDIT_REFERENCE_STUDY_CHAT_PROVIDER_WORKFLOW_OUTCOMES[number]

export const EDIT_REFERENCE_STUDY_CHAT_PROVIDER_WORKFLOW_STOP_REASONS = [
  'operator_pause',
  'owner_cancelled_workflow',
  'security_hold',
] as const

export type EditReferenceStudyChatProviderWorkflowStopReason =
  typeof EDIT_REFERENCE_STUDY_CHAT_PROVIDER_WORKFLOW_STOP_REASONS[number]

export interface EditReferenceStudyChatProviderCallbackAuthenticationProof {
  readonly scheme: 'hmac_sha256_v1'
  readonly verified: true
  readonly keyIdDigestSha256: string
  readonly signingPayloadDigestSha256: string
  readonly signatureDigestSha256: string
}

export interface EditReferenceStudyChatProviderCallbackEventRecord {
  readonly providerEventIdDigestSha256: string
  readonly callbackEnvelopeDigestSha256: string
  readonly providerRequestIdDigestSha256: string | null
  readonly receivedAt: string
  readonly occurredAt: string
  readonly authentication: EditReferenceStudyChatProviderCallbackAuthenticationProof
  readonly wakeOnly: true
  readonly providerTruthSettledByCallback: false
}

/**
 * Backend-private workflow authority for one existing provider checkback. It
 * adds a heartbeat-capable worker lease and authenticated callback wake
 * signals without creating another provider request or accepting callback
 * payloads as provider truth.
 */
export interface EditReferenceStudyChatProviderWorkflowRecord {
  readonly schemaVersion: typeof EDIT_REFERENCE_STUDY_CHAT_PROVIDER_WORKFLOW_VERSION
  readonly id: string
  readonly workspaceId: string
  readonly actorUserId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly reasoningAttemptId: string
  readonly reasoningProviderRequestId: string
  readonly reasoningProviderCheckbackId: string
  readonly reasoningInternalCostAuthorityId: string
  revision: number
  state: EditReferenceStudyChatProviderWorkflowState
  nextRunAt: string
  deadlineAt: string
  maxWorkflowRuns: number
  workflowRunCount: number
  leaseGeneration: number
  activeLeaseTokenHashSha256?: string
  activeLeaseOwnerIdDigestSha256?: string
  activeLeaseClaimIdempotencyKeyHashSha256?: string
  leasedAt?: string
  leaseExpiresAt?: string
  lastHeartbeatAt?: string
  heartbeatCount: number
  lastRunStartedAt?: string
  lastRunCompletedAt?: string
  callbackWakeCount: number
  callbackEvents: EditReferenceStudyChatProviderCallbackEventRecord[]
  lastOutcome: EditReferenceStudyChatProviderWorkflowOutcome
  lastOutcomeCheckbackRevision: number | null
  operatorReviewRequired: boolean
  automaticWorkflowStopped: boolean
  stopReason?: EditReferenceStudyChatProviderWorkflowStopReason
  stoppedAt?: string
  terminalAt?: string
  operatorRecoveryCount: number
  lastOperatorRecoveryCommandDigestSha256?: string
  readonly callbackAuthenticationRequired: true
  readonly callbackWakeOnly: true
  readonly callbackCanSettleProviderTruth: false
  readonly providerLookupOnly: true
  readonly providerSubmissionAllowed: false
  readonly providerResubmissionAllowed: false
  readonly providerCancellationAttempted: false
  readonly publicRouteAvailable: false
  readonly distributedRuntimeDeployed: false
  readonly externalProviderExecutionAllowed: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
  readonly createdAt: string
  updatedAt: string
  readonly privateInternalOnly: true
}

export interface RegisterEditReferenceStudyChatProviderWorkflowInput {
  readonly workspaceId: string
  readonly expectedCheckbackRevision: number
  readonly expectedProviderRequestRevision: number
  readonly reasoningInternalCostAuthorityId: string
  readonly nextRunAt: string
  readonly deadlineAt: string
  readonly maxWorkflowRuns: number
}

export interface ClaimEditReferenceStudyChatProviderWorkflowInput {
  readonly workspaceId: string
  readonly expectedWorkflowRevision: number
  readonly workerId: string
  readonly leaseDurationMs: number
}

export interface HeartbeatEditReferenceStudyChatProviderWorkflowInput {
  readonly workspaceId: string
  readonly expectedWorkflowRevision: number
  readonly workerId: string
  readonly leaseToken: string
  readonly extendLeaseDurationMs: number
}

export interface RecordEditReferenceStudyChatProviderCallbackWakeInput {
  readonly workspaceId: string
  readonly expectedWorkflowRevision: number
  readonly expectedCheckbackRevision: number
  readonly expectedProviderRequestRevision: number
  readonly providerEventId: string
  readonly providerRequestId: string | null
  readonly callbackEnvelopeDigestSha256: string
  readonly occurredAt: string
  readonly receivedAt: string
  readonly authentication: EditReferenceStudyChatProviderCallbackAuthenticationProof
}

export interface SettleEditReferenceStudyChatProviderWorkflowInput {
  readonly workspaceId: string
  readonly expectedWorkflowRevision: number
  readonly expectedCheckbackRevision: number
  readonly workerId: string
  readonly leaseToken: string
  readonly outcome:
    | 'provider_pending'
    | 'provider_reconciliation_unavailable'
    | 'invalid_provider_observation'
    | 'operator_review_required'
    | 'terminal_settled'
  readonly nextRunAt: string | null
}

export interface StopEditReferenceStudyChatProviderWorkflowInput {
  readonly workspaceId: string
  readonly expectedWorkflowRevision: number
  readonly stopReason: EditReferenceStudyChatProviderWorkflowStopReason
}

export interface ResumeEditReferenceStudyChatProviderWorkflowInput {
  readonly workspaceId: string
  readonly expectedWorkflowRevision: number
  readonly expectedCheckbackRevision: number
  readonly expectedProviderRequestRevision: number
  readonly operatorRecoveryCommandId: string
  readonly nextRunAt: string
  readonly deadlineAt: string
  readonly maxWorkflowRuns: number
}

export interface EditReferenceStudyChatProviderWorkflowRegistrationData {
  readonly workflow: EditReferenceStudyChatProviderWorkflowRecord
  readonly disposition: 'created' | 'idempotent_replay' | 'checkback_deduplicated' | 'already_terminal'
}

export interface EditReferenceStudyChatProviderWorkflowClaimData {
  readonly workflow: EditReferenceStudyChatProviderWorkflowRecord
  readonly disposition:
    | 'authorized'
    | 'authorized_replay'
    | 'already_leased'
    | 'not_due'
    | 'operator_review_required'
    | 'terminal'
    | 'cancelled'
  readonly workflowRunAuthorized: boolean
  readonly leaseToken: string | null
}

export interface EditReferenceStudyChatProviderWorkflowHeartbeatData {
  readonly workflow: EditReferenceStudyChatProviderWorkflowRecord
  readonly disposition: 'extended' | 'idempotent_replay'
  readonly providerLookupAuthorized: false
  readonly providerSubmissionAllowed: false
}

export interface EditReferenceStudyChatProviderCallbackWakeData {
  readonly workflow: EditReferenceStudyChatProviderWorkflowRecord
  readonly disposition: 'wake_recorded' | 'idempotent_replay' | 'workflow_stopped' | 'already_terminal'
  readonly callbackAuthenticated: true
  readonly callbackWakeOnly: true
  readonly providerTruthSettledByCallback: false
}

export interface EditReferenceStudyChatProviderWorkflowSettlementData {
  readonly workflow: EditReferenceStudyChatProviderWorkflowRecord
  readonly disposition:
    | 'rescheduled'
    | 'automatic_workflow_exhausted'
    | 'operator_review_required'
    | 'terminal'
    | 'idempotent_replay'
  readonly providerSubmissionAllowed: false
  readonly providerResubmissionAllowed: false
}

export interface EditReferenceStudyChatProviderWorkflowControlData {
  readonly workflow: EditReferenceStudyChatProviderWorkflowRecord
  readonly disposition: 'stopped' | 'resumed' | 'terminal' | 'idempotent_replay'
  readonly providerCancellationAttempted: false
  readonly providerResubmissionAllowed: false
}

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const MIN_LEASE_MS = 1_000
const MAX_LEASE_MS = 15 * 60 * 1_000
const MAX_WORKFLOW_RUNS = 32

export function validateRegisterEditReferenceStudyChatProviderWorkflowInput(
  input: RegisterEditReferenceStudyChatProviderWorkflowInput,
): void {
  if (
    !ID_PATTERN.test(input.workspaceId)
    || !positiveRevision(input.expectedCheckbackRevision)
    || !positiveRevision(input.expectedProviderRequestRevision)
    || !ID_PATTERN.test(input.reasoningInternalCostAuthorityId)
    || !validWindow(input.nextRunAt, input.deadlineAt)
    || !validRunCount(input.maxWorkflowRuns)
  ) throw new Error('The private Study Chat provider workflow registration is invalid.')
}

export function validateClaimEditReferenceStudyChatProviderWorkflowInput(
  input: ClaimEditReferenceStudyChatProviderWorkflowInput,
): void {
  if (
    !ID_PATTERN.test(input.workspaceId)
    || !positiveRevision(input.expectedWorkflowRevision)
    || !ID_PATTERN.test(input.workerId)
    || !validLeaseDuration(input.leaseDurationMs)
  ) throw new Error('The private Study Chat provider workflow claim is invalid.')
}

export function validateHeartbeatEditReferenceStudyChatProviderWorkflowInput(
  input: HeartbeatEditReferenceStudyChatProviderWorkflowInput,
): void {
  if (
    !ID_PATTERN.test(input.workspaceId)
    || !positiveRevision(input.expectedWorkflowRevision)
    || !ID_PATTERN.test(input.workerId)
    || !validLeaseToken(input.leaseToken)
    || !validLeaseDuration(input.extendLeaseDurationMs)
  ) throw new Error('The private Study Chat provider workflow heartbeat is invalid.')
}

export function validateRecordEditReferenceStudyChatProviderCallbackWakeInput(
  input: RecordEditReferenceStudyChatProviderCallbackWakeInput,
): void {
  if (
    !ID_PATTERN.test(input.workspaceId)
    || !positiveRevision(input.expectedWorkflowRevision)
    || !positiveRevision(input.expectedCheckbackRevision)
    || !positiveRevision(input.expectedProviderRequestRevision)
    || !ID_PATTERN.test(input.providerEventId)
    || (input.providerRequestId !== null && !ID_PATTERN.test(input.providerRequestId))
    || !SHA256_PATTERN.test(input.callbackEnvelopeDigestSha256)
    || !isIsoDate(input.occurredAt)
    || !isIsoDate(input.receivedAt)
    || Date.parse(input.occurredAt) > Date.parse(input.receivedAt) + 60_000
  ) throw new Error('The private Study Chat provider callback wake is invalid.')
  validateEditReferenceStudyChatProviderCallbackAuthenticationProof(input.authentication)
}

export function validateSettleEditReferenceStudyChatProviderWorkflowInput(
  input: SettleEditReferenceStudyChatProviderWorkflowInput,
): void {
  const rescheduled = ['provider_pending', 'provider_reconciliation_unavailable'].includes(input.outcome)
  if (
    !ID_PATTERN.test(input.workspaceId)
    || !positiveRevision(input.expectedWorkflowRevision)
    || !positiveRevision(input.expectedCheckbackRevision)
    || !ID_PATTERN.test(input.workerId)
    || !validLeaseToken(input.leaseToken)
    || ![
      'provider_pending',
      'provider_reconciliation_unavailable',
      'invalid_provider_observation',
      'operator_review_required',
      'terminal_settled',
    ].includes(input.outcome)
    || (rescheduled !== (input.nextRunAt !== null))
    || (input.nextRunAt !== null && !isIsoDate(input.nextRunAt))
  ) throw new Error('The private Study Chat provider workflow settlement is invalid.')
}

export function validateStopEditReferenceStudyChatProviderWorkflowInput(
  input: StopEditReferenceStudyChatProviderWorkflowInput,
): void {
  if (
    !ID_PATTERN.test(input.workspaceId)
    || !positiveRevision(input.expectedWorkflowRevision)
    || !EDIT_REFERENCE_STUDY_CHAT_PROVIDER_WORKFLOW_STOP_REASONS.includes(input.stopReason)
  ) throw new Error('The private Study Chat provider workflow stop command is invalid.')
}

export function validateResumeEditReferenceStudyChatProviderWorkflowInput(
  input: ResumeEditReferenceStudyChatProviderWorkflowInput,
): void {
  if (
    !ID_PATTERN.test(input.workspaceId)
    || !positiveRevision(input.expectedWorkflowRevision)
    || !positiveRevision(input.expectedCheckbackRevision)
    || !positiveRevision(input.expectedProviderRequestRevision)
    || !ID_PATTERN.test(input.operatorRecoveryCommandId)
    || !validWindow(input.nextRunAt, input.deadlineAt)
    || !validRunCount(input.maxWorkflowRuns)
  ) throw new Error('The private Study Chat provider workflow recovery command is invalid.')
}

export function validateEditReferenceStudyChatProviderCallbackAuthenticationProof(
  proof: EditReferenceStudyChatProviderCallbackAuthenticationProof,
): void {
  if (
    proof?.scheme !== 'hmac_sha256_v1'
    || proof.verified !== true
    || !SHA256_PATTERN.test(proof.keyIdDigestSha256)
    || !SHA256_PATTERN.test(proof.signingPayloadDigestSha256)
    || !SHA256_PATTERN.test(proof.signatureDigestSha256)
  ) throw new Error('The private Study Chat provider callback authentication proof is invalid.')
}

export function validateEditReferenceStudyChatProviderWorkflowRecord(
  record: EditReferenceStudyChatProviderWorkflowRecord,
): void {
  if (
    record?.schemaVersion !== EDIT_REFERENCE_STUDY_CHAT_PROVIDER_WORKFLOW_VERSION
    || !ID_PATTERN.test(record.id)
    || !ID_PATTERN.test(record.workspaceId)
    || !ID_PATTERN.test(record.actorUserId)
    || !ID_PATTERN.test(record.editReferenceId)
    || !ID_PATTERN.test(record.studySessionId)
    || !ID_PATTERN.test(record.reasoningAttemptId)
    || !ID_PATTERN.test(record.reasoningProviderRequestId)
    || !ID_PATTERN.test(record.reasoningProviderCheckbackId)
    || !ID_PATTERN.test(record.reasoningInternalCostAuthorityId)
    || !positiveRevision(record.revision)
    || !EDIT_REFERENCE_STUDY_CHAT_PROVIDER_WORKFLOW_STATES.includes(record.state)
    || !validWindow(record.nextRunAt, record.deadlineAt)
    || !validRunCount(record.maxWorkflowRuns)
    || !Number.isSafeInteger(record.workflowRunCount)
    || record.workflowRunCount < 0
    || record.workflowRunCount > record.maxWorkflowRuns
    || !Number.isSafeInteger(record.leaseGeneration)
    || record.leaseGeneration < 0
    || record.leaseGeneration !== record.workflowRunCount
    || !Number.isSafeInteger(record.heartbeatCount)
    || record.heartbeatCount < 0
    || !Number.isSafeInteger(record.callbackWakeCount)
    || record.callbackWakeCount < 0
    || !Array.isArray(record.callbackEvents)
    || record.callbackEvents.length > 64
    || record.callbackWakeCount !== record.callbackEvents.length
    || !EDIT_REFERENCE_STUDY_CHAT_PROVIDER_WORKFLOW_OUTCOMES.includes(record.lastOutcome)
    || (record.lastOutcomeCheckbackRevision !== null && !positiveRevision(record.lastOutcomeCheckbackRevision))
    || !Number.isSafeInteger(record.operatorRecoveryCount)
    || record.operatorRecoveryCount < 0
    || (record.operatorRecoveryCount > 0) !== Boolean(record.lastOperatorRecoveryCommandDigestSha256)
    || record.callbackAuthenticationRequired !== true
    || record.callbackWakeOnly !== true
    || record.callbackCanSettleProviderTruth !== false
    || record.providerLookupOnly !== true
    || record.providerSubmissionAllowed !== false
    || record.providerResubmissionAllowed !== false
    || record.providerCancellationAttempted !== false
    || record.publicRouteAvailable !== false
    || record.distributedRuntimeDeployed !== false
    || record.externalProviderExecutionAllowed !== false
    || record.customerPriceCalculated !== false
    || record.customerCreditsMutated !== false
    || record.serviceFeeIncluded !== false
    || !isIsoDate(record.createdAt)
    || !isIsoDate(record.updatedAt)
    || Date.parse(record.updatedAt) < Date.parse(record.createdAt)
    || record.privateInternalOnly !== true
  ) throw new Error('The private Study Chat provider workflow record is invalid.')

  const callbackIds = new Set<string>()
  for (const event of record.callbackEvents) {
    validateEditReferenceStudyChatProviderCallbackAuthenticationProof(event.authentication)
    if (
      !SHA256_PATTERN.test(event.providerEventIdDigestSha256)
      || !SHA256_PATTERN.test(event.callbackEnvelopeDigestSha256)
      || (event.providerRequestIdDigestSha256 !== null
        && !SHA256_PATTERN.test(event.providerRequestIdDigestSha256))
      || !isIsoDate(event.receivedAt)
      || !isIsoDate(event.occurredAt)
      || Date.parse(event.receivedAt) < Date.parse(record.createdAt)
      || Date.parse(event.occurredAt) > Date.parse(event.receivedAt) + 60_000
      || event.wakeOnly !== true
      || event.providerTruthSettledByCallback !== false
      || callbackIds.has(event.providerEventIdDigestSha256)
    ) throw new Error('The private Study Chat provider callback event record is invalid.')
    callbackIds.add(event.providerEventIdDigestSha256)
  }

  const leased = record.state === 'leased'
  const leaseFields = [
    record.activeLeaseTokenHashSha256,
    record.activeLeaseOwnerIdDigestSha256,
    record.activeLeaseClaimIdempotencyKeyHashSha256,
    record.leasedAt,
    record.leaseExpiresAt,
  ]
  if (leased) {
    if (
      leaseFields.some((value) => value === undefined)
      || !SHA256_PATTERN.test(record.activeLeaseTokenHashSha256 as string)
      || !SHA256_PATTERN.test(record.activeLeaseOwnerIdDigestSha256 as string)
      || !SHA256_PATTERN.test(record.activeLeaseClaimIdempotencyKeyHashSha256 as string)
      || !isIsoDate(record.leasedAt)
      || !isIsoDate(record.leaseExpiresAt)
      || Date.parse(record.leaseExpiresAt as string) <= Date.parse(record.leasedAt as string)
      || !record.lastRunStartedAt
      || !isIsoDate(record.lastRunStartedAt)
      || record.operatorReviewRequired
      || record.automaticWorkflowStopped
      || record.stopReason !== undefined
      || record.stoppedAt !== undefined
      || record.terminalAt !== undefined
    ) throw new Error('The private Study Chat provider workflow lease state is invalid.')
  } else if (leaseFields.some((value) => value !== undefined)) {
    throw new Error('The private Study Chat provider workflow retained an inactive lease.')
  }
  if (
    (record.lastHeartbeatAt !== undefined && !isIsoDate(record.lastHeartbeatAt))
    || (record.lastRunStartedAt !== undefined && !isIsoDate(record.lastRunStartedAt))
    || (record.lastRunCompletedAt !== undefined && !isIsoDate(record.lastRunCompletedAt))
    || (record.stoppedAt !== undefined && !isIsoDate(record.stoppedAt))
    || (record.terminalAt !== undefined && !isIsoDate(record.terminalAt))
    || (record.lastOperatorRecoveryCommandDigestSha256 !== undefined
      && !SHA256_PATTERN.test(record.lastOperatorRecoveryCommandDigestSha256))
  ) throw new Error('The private Study Chat provider workflow timestamp or recovery state is invalid.')
  for (const timestamp of [
    record.leasedAt,
    record.leaseExpiresAt,
    record.lastHeartbeatAt,
    record.lastRunStartedAt,
    record.lastRunCompletedAt,
    record.stoppedAt,
    record.terminalAt,
  ]) {
    if (timestamp !== undefined && Date.parse(timestamp) < Date.parse(record.createdAt)) {
      throw new Error('The private Study Chat provider workflow timestamp predates its authority.')
    }
  }
  if (
    record.lastRunStartedAt !== undefined
    && record.lastRunCompletedAt !== undefined
    && Date.parse(record.lastRunCompletedAt) < Date.parse(record.lastRunStartedAt)
  ) throw new Error('The private Study Chat provider workflow run timestamps are invalid.')

  if (record.state === 'scheduled') {
    if (
      record.operatorReviewRequired
      || record.automaticWorkflowStopped
      || record.stopReason
      || record.stoppedAt
      || record.terminalAt
    ) {
      throw new Error('The private Study Chat provider workflow scheduled state is invalid.')
    }
  } else if (record.state === 'operator_review_required') {
    if (
      !record.operatorReviewRequired
      || !record.automaticWorkflowStopped
      || !record.stoppedAt
      || record.stopReason
      || record.terminalAt
      || ![
        'provider_reconciliation_unavailable',
        'invalid_provider_observation',
        'operator_review_required',
        'automatic_workflow_exhausted',
      ].includes(record.lastOutcome)
    ) {
      throw new Error('The private Study Chat provider workflow review state is invalid.')
    }
  } else if (record.state === 'terminal') {
    if (
      record.operatorReviewRequired
      || !record.automaticWorkflowStopped
      || record.stopReason
      || record.stoppedAt
      || !record.terminalAt
      || record.lastOutcome !== 'terminal_settled'
    ) throw new Error('The private Study Chat provider workflow terminal state is invalid.')
  } else if (record.state === 'cancelled') {
    if (
      !record.operatorReviewRequired
      || !record.automaticWorkflowStopped
      || !record.stopReason
      || !record.stoppedAt
      || record.terminalAt
      || record.lastOutcome !== 'cancelled'
    ) throw new Error('The private Study Chat provider workflow cancelled state is invalid.')
  }
}

export function deriveEditReferenceStudyChatProviderWorkflowLeaseToken(idempotencyKey: string): string {
  const normalized = idempotencyKey?.trim()
  if (!normalized || normalized.length > 200) {
    throw new Error('The private Study Chat provider workflow lease authority is invalid.')
  }
  return `er-provider-workflow-lease-${sha256(`${EDIT_REFERENCE_STUDY_CHAT_PROVIDER_WORKFLOW_VERSION}:${normalized}`)}`
}

export function hashEditReferenceStudyChatProviderWorkflowLeaseToken(value: string): string {
  if (!validLeaseToken(value)) {
    throw new Error('The private Study Chat provider workflow lease token is invalid.')
  }
  return sha256(value)
}

export function isEditReferenceStudyChatProviderWorkflowSha256(value: unknown): value is string {
  return typeof value === 'string' && SHA256_PATTERN.test(value)
}

function positiveRevision(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 1
}

function validRunCount(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 1 && value <= MAX_WORKFLOW_RUNS
}

function validLeaseDuration(value: number): boolean {
  return Number.isSafeInteger(value) && value >= MIN_LEASE_MS && value <= MAX_LEASE_MS
}

function validLeaseToken(value: string): boolean {
  return typeof value === 'string' && value.length >= 16 && value.length <= 200
}

function validWindow(nextRunAt: string, deadlineAt: string): boolean {
  return isIsoDate(nextRunAt)
    && isIsoDate(deadlineAt)
    && Date.parse(nextRunAt) <= Date.parse(deadlineAt)
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string'
    && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString() === value
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
