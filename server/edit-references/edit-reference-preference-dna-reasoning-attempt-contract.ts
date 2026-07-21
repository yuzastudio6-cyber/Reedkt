import { createHash } from 'node:crypto'
import {
  EDIT_REFERENCE_PREFERENCE_DNA_REASONING_REQUEST_VERSION,
  EDIT_REFERENCE_PREFERENCE_DNA_REASONING_RESULT_VERSION,
  hashEditReferencePreferenceDnaReasoningRequest,
  validateEditReferencePreferenceDnaReasoningRequest,
  validateEditReferencePreferenceDnaReasoningResult,
  type EditReferencePreferenceDnaReasoningBlockerCode,
  type EditReferencePreferenceDnaReasoningRequest,
  type EditReferencePreferenceDnaReasoningResult,
} from './edit-reference-preference-dna-reasoning-contract'

export const EDIT_REFERENCE_PREFERENCE_DNA_REASONING_ATTEMPT_VERSION =
  'edit-reference-preference-dna-reasoning-attempt-v1' as const

export const EDIT_REFERENCE_PREFERENCE_DNA_REASONING_ATTEMPT_STATES = [
  'reserved',
  'running',
  'completed',
  'blocked',
  'cost_unverified',
  'cancelled',
] as const

export type EditReferencePreferenceDnaReasoningAttemptState =
  typeof EDIT_REFERENCE_PREFERENCE_DNA_REASONING_ATTEMPT_STATES[number]

export type EditReferencePreferenceDnaReasoningAttemptTerminalReason =
  | EditReferencePreferenceDnaReasoningBlockerCode
  | 'study_revision_advanced'
  | 'cancelled_before_execution'

export interface EditReferencePreferenceDnaReasoningAttemptRecord {
  readonly schemaVersion: typeof EDIT_REFERENCE_PREFERENCE_DNA_REASONING_ATTEMPT_VERSION
  readonly id: string
  readonly workspaceId: string
  readonly actorUserId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  revision: number
  state: EditReferencePreferenceDnaReasoningAttemptState
  readonly request: EditReferencePreferenceDnaReasoningRequest
  readonly requestDigestSha256: string
  readonly studyRevisionAtReservation: number
  readonly reservationIdempotencyKeyHashSha256: string
  executionCommandDigestSha256?: string
  executionIdempotencyKeyHashSha256?: string
  result?: EditReferencePreferenceDnaReasoningResult
  resultDigestSha256?: string
  providerExecutionState: 'not_started' | 'execution_authorized_once' | 'not_called' | 'called_no_cost' | 'called_metered' | 'called_cost_unverified'
  internalCostStatus: 'not_incurred' | 'metered' | 'unverified'
  meteredInternalCostMicros: string | null
  usageEventIds: string[]
  internalCostRecordIds: string[]
  candidateHandoffAllowed: boolean
  deterministicFallbackEligible: boolean
  qwenAuthoredDnaVersionCreated: false
  dnaVersionPersisted: false
  qaResultPersisted: false
  deterministicDnaAuthorityReplaced: false
  customerPriceCalculated: false
  customerCreditsMutated: false
  serviceFeeIncluded: false
  terminalReason?: EditReferencePreferenceDnaReasoningAttemptTerminalReason
  readonly createdAt: string
  readonly reservedAt: string
  startedAt?: string
  settledAt?: string
  readonly privateInternalOnly: true
}

export interface ReserveEditReferencePreferenceDnaReasoningAttemptInput {
  readonly request: EditReferencePreferenceDnaReasoningRequest
}

export interface StartEditReferencePreferenceDnaReasoningAttemptInput {
  readonly workspaceId: string
  readonly expectedAttemptRevision: number
  readonly executionCommandId: string
}

export interface SettleEditReferencePreferenceDnaReasoningAttemptInput {
  readonly workspaceId: string
  readonly expectedAttemptRevision: number
  readonly result: EditReferencePreferenceDnaReasoningResult
}

export interface CancelEditReferencePreferenceDnaReasoningAttemptInput {
  readonly workspaceId: string
  readonly expectedAttemptRevision: number
}

export interface EditReferencePreferenceDnaReasoningAttemptReservationData {
  readonly attempt: EditReferencePreferenceDnaReasoningAttemptRecord
  readonly disposition: 'created' | 'idempotent_replay' | 'request_deduplicated'
}

export interface EditReferencePreferenceDnaReasoningAttemptExecutionData {
  readonly attempt: EditReferencePreferenceDnaReasoningAttemptRecord
  readonly disposition: 'authorized_once' | 'idempotent_replay_blocked' | 'duplicate_command_blocked'
  readonly providerCallAuthorized: boolean
}

export function hashEditReferencePreferenceDnaReasoningResult(
  result: EditReferencePreferenceDnaReasoningResult,
): string {
  return sha256(stableStringify(result))
}

export function validateEditReferencePreferenceDnaReasoningAttemptRecord(
  attempt: EditReferencePreferenceDnaReasoningAttemptRecord,
): void {
  if (
    attempt.schemaVersion !== EDIT_REFERENCE_PREFERENCE_DNA_REASONING_ATTEMPT_VERSION
    || !safeId(attempt.id)
    || !safeId(attempt.workspaceId)
    || !safeId(attempt.actorUserId)
    || !safeId(attempt.editReferenceId)
    || !safeId(attempt.studySessionId)
    || !Number.isSafeInteger(attempt.revision)
    || attempt.revision < 1
    || !EDIT_REFERENCE_PREFERENCE_DNA_REASONING_ATTEMPT_STATES.includes(attempt.state)
    || !isSha256(attempt.requestDigestSha256)
    || !Number.isSafeInteger(attempt.studyRevisionAtReservation)
    || attempt.studyRevisionAtReservation < 1
    || !isSha256(attempt.reservationIdempotencyKeyHashSha256)
    || !isIsoDate(attempt.createdAt)
    || attempt.reservedAt !== attempt.createdAt
    || attempt.privateInternalOnly !== true
    || attempt.qwenAuthoredDnaVersionCreated !== false
    || attempt.dnaVersionPersisted !== false
    || attempt.qaResultPersisted !== false
    || attempt.deterministicDnaAuthorityReplaced !== false
    || attempt.customerPriceCalculated !== false
    || attempt.customerCreditsMutated !== false
    || attempt.serviceFeeIncluded !== false
    || !Array.isArray(attempt.usageEventIds)
    || !Array.isArray(attempt.internalCostRecordIds)
    || !attempt.usageEventIds.every(safeId)
    || !attempt.internalCostRecordIds.every(safeId)
    || attempt.usageEventIds.length > 256
    || attempt.internalCostRecordIds.length > 256
  ) throw new Error('Preference DNA reasoning attempt contract is invalid.')

  validateEditReferencePreferenceDnaReasoningRequest(attempt.request)
  if (
    attempt.request.schemaVersion !== EDIT_REFERENCE_PREFERENCE_DNA_REASONING_REQUEST_VERSION
    || attempt.request.workspaceId !== attempt.workspaceId
    || attempt.request.actorUserId !== attempt.actorUserId
    || attempt.request.editReferenceId !== attempt.editReferenceId
    || attempt.request.studySessionId !== attempt.studySessionId
    || attempt.request.expectedStudyRevision !== attempt.studyRevisionAtReservation
    || attempt.request.executionScope !== 'controlled_test'
    || attempt.requestDigestSha256 !== hashEditReferencePreferenceDnaReasoningRequest(attempt.request)
  ) throw new Error('Preference DNA reasoning attempt request identity is invalid.')

  if (attempt.startedAt !== undefined && (!isIsoDate(attempt.startedAt) || attempt.startedAt < attempt.reservedAt)) {
    throw new Error('Preference DNA reasoning attempt start timestamp is invalid.')
  }
  if (attempt.settledAt !== undefined && (!isIsoDate(attempt.settledAt) || attempt.settledAt < (attempt.startedAt ?? attempt.reservedAt))) {
    throw new Error('Preference DNA reasoning attempt settlement timestamp is invalid.')
  }

  if (attempt.state === 'reserved') {
    if (
      attempt.revision !== 1
      || attempt.providerExecutionState !== 'not_started'
      || attempt.internalCostStatus !== 'not_incurred'
      || attempt.meteredInternalCostMicros !== null
      || attempt.executionCommandDigestSha256 !== undefined
      || attempt.executionIdempotencyKeyHashSha256 !== undefined
      || attempt.result !== undefined
      || attempt.resultDigestSha256 !== undefined
      || attempt.candidateHandoffAllowed
      || attempt.deterministicFallbackEligible
      || attempt.startedAt !== undefined
      || attempt.settledAt !== undefined
      || attempt.terminalReason !== undefined
      || attempt.usageEventIds.length
      || attempt.internalCostRecordIds.length
    ) throw new Error('Preference DNA reasoning reserved attempt state is invalid.')
    return
  }

  if (attempt.state === 'cancelled') {
    if (
      attempt.revision !== 2
      || attempt.providerExecutionState !== 'not_called'
      || attempt.internalCostStatus !== 'not_incurred'
      || attempt.meteredInternalCostMicros !== null
      || attempt.executionCommandDigestSha256 !== undefined
      || attempt.executionIdempotencyKeyHashSha256 !== undefined
      || attempt.result !== undefined
      || attempt.resultDigestSha256 !== undefined
      || attempt.candidateHandoffAllowed
      || attempt.deterministicFallbackEligible
      || attempt.startedAt !== undefined
      || !attempt.settledAt
      || attempt.terminalReason !== 'cancelled_before_execution'
      || attempt.usageEventIds.length
      || attempt.internalCostRecordIds.length
    ) throw new Error('Preference DNA reasoning cancelled attempt state is invalid.')
    return
  }

  if (
    !isSha256(attempt.executionCommandDigestSha256)
    || !isSha256(attempt.executionIdempotencyKeyHashSha256)
    || !attempt.startedAt
  ) throw new Error('Preference DNA reasoning execution authority is invalid.')

  if (attempt.state === 'running') {
    if (
      attempt.revision !== 2
      || attempt.providerExecutionState !== 'execution_authorized_once'
      || attempt.internalCostStatus !== 'not_incurred'
      || attempt.meteredInternalCostMicros !== null
      || attempt.result !== undefined
      || attempt.resultDigestSha256 !== undefined
      || attempt.candidateHandoffAllowed
      || attempt.deterministicFallbackEligible
      || attempt.settledAt !== undefined
      || attempt.terminalReason !== undefined
      || attempt.usageEventIds.length
      || attempt.internalCostRecordIds.length
    ) throw new Error('Preference DNA reasoning running attempt state is invalid.')
    return
  }

  if (
    attempt.revision !== 3
    || !attempt.settledAt
    || !attempt.result
    || attempt.result.schemaVersion !== EDIT_REFERENCE_PREFERENCE_DNA_REASONING_RESULT_VERSION
    || !isSha256(attempt.resultDigestSha256)
    || attempt.resultDigestSha256 !== hashEditReferencePreferenceDnaReasoningResult(attempt.result)
  ) throw new Error('Preference DNA reasoning terminal attempt state is invalid.')
  validateEditReferencePreferenceDnaReasoningResult(attempt.request, attempt.result)

  const cost = resultCost(attempt.result)
  if (
    attempt.providerExecutionState !== cost.providerExecutionState
    || attempt.internalCostStatus !== cost.internalCostStatus
    || attempt.meteredInternalCostMicros !== cost.meteredInternalCostMicros
    || !sameStrings(attempt.usageEventIds, cost.usageEventIds)
    || !sameStrings(attempt.internalCostRecordIds, cost.internalCostRecordIds)
  ) throw new Error('Preference DNA reasoning terminal cost evidence is invalid.')

  if (attempt.result.status === 'validated_candidate') {
    if (attempt.state === 'completed') {
      if (!attempt.candidateHandoffAllowed || attempt.deterministicFallbackEligible || attempt.terminalReason !== undefined) {
        throw new Error('Preference DNA reasoning completed candidate state is invalid.')
      }
      return
    }
    if (
      attempt.state !== 'blocked'
      || attempt.candidateHandoffAllowed
      || attempt.deterministicFallbackEligible
      || attempt.terminalReason !== 'study_revision_advanced'
    ) throw new Error('Preference DNA reasoning stale candidate state is invalid.')
    return
  }

  const fallbackEligible = ['model_routing_unavailable', 'reasoning_unavailable'].includes(attempt.result.blockerCode)
    && attempt.result.internalCostStatus !== 'unverified'
  if (
    attempt.candidateHandoffAllowed
    || attempt.deterministicFallbackEligible !== fallbackEligible
    || attempt.terminalReason !== attempt.result.blockerCode
    || (attempt.result.internalCostStatus === 'unverified' && attempt.state !== 'cost_unverified')
    || (attempt.result.internalCostStatus !== 'unverified' && attempt.state !== 'blocked')
  ) throw new Error('Preference DNA reasoning blocked result state is invalid.')
}

function resultCost(result: EditReferencePreferenceDnaReasoningResult): {
  providerExecutionState: EditReferencePreferenceDnaReasoningAttemptRecord['providerExecutionState']
  internalCostStatus: EditReferencePreferenceDnaReasoningAttemptRecord['internalCostStatus']
  meteredInternalCostMicros: string | null
  usageEventIds: readonly string[]
  internalCostRecordIds: readonly string[]
} {
  if (result.status === 'validated_candidate') {
    return {
      providerExecutionState: result.execution.providerCallMade
        ? result.usage.mode === 'production_metered' ? 'called_metered' : 'called_no_cost'
        : 'not_called',
      internalCostStatus: result.usage.mode === 'production_metered' ? 'metered' : 'not_incurred',
      meteredInternalCostMicros: result.usage.meteredInternalCostMicros,
      usageEventIds: result.usage.usageEventIds,
      internalCostRecordIds: result.usage.internalCostRecordIds,
    }
  }
  return {
    providerExecutionState: result.providerCallMade
      ? result.internalCostStatus === 'unverified' ? 'called_cost_unverified'
        : result.internalCostStatus === 'metered' ? 'called_metered' : 'called_no_cost'
      : 'not_called',
    internalCostStatus: result.internalCostStatus,
    meteredInternalCostMicros: result.meteredInternalCostMicros,
    usageEventIds: result.usageEventIds,
    internalCostRecordIds: result.internalCostRecordIds,
  }
}

function safeId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value)
}

function isSha256(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}
