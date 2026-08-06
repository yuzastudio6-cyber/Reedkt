import { createHash } from 'node:crypto'
import type {
  EditReferenceStudyChatProviderIdentity,
  EditReferenceStudyChatProviderTransportObservation,
} from './edit-reference-study-chat-provider-transport-contract'
import type { EditReferenceStudyChatReasoningRequest } from './edit-reference-study-chat-reasoning-contract'

export const EDIT_REFERENCE_STUDY_CHAT_INTERNAL_COST_AUTHORITY_VERSION =
  'edit-reference-study-chat-internal-cost-authority-v1' as const

export const EDIT_REFERENCE_STUDY_CHAT_INTERNAL_COST_AUTHORITY_STATES = [
  'approved_private',
  'reserved',
  'metered_provisional',
  'released_not_incurred',
  'cost_unverified',
] as const

export type EditReferenceStudyChatInternalCostAuthorityState =
  typeof EDIT_REFERENCE_STUDY_CHAT_INTERNAL_COST_AUTHORITY_STATES[number]

export interface EditReferenceStudyChatTokenEstimateRange {
  readonly low: number
  readonly expected: number
  readonly high: number
}

export interface EditReferenceStudyChatImmutableRateCardSnapshot {
  readonly id: string
  readonly version: string
  readonly currency: 'USD'
  readonly effectiveAt: string
  readonly fixedRequestMicros: string
  readonly inputTokenMicrosPerMillion: string
  readonly outputTokenMicrosPerMillion: string
  readonly roundingMode: 'ceil_each_line_item_to_integer_micros'
  readonly source: 'backend_private_controlled_snapshot'
  readonly immutable: true
  readonly digestSha256: string
}

export interface EditReferenceStudyChatProviderUsageMeasurement {
  readonly providerUsageRecordId: string
  readonly inputTokens: number
  readonly outputTokens: number
  readonly totalTokens: number
  readonly billableRequestCount: 1
  readonly evidenceSource: 'provider_reported'
  readonly rawProviderUsagePersisted: false
}

export interface EditReferenceStudyChatPersistedUsageMeasurement {
  readonly providerUsageRecordIdDigestSha256: string
  readonly inputTokens: number
  readonly outputTokens: number
  readonly totalTokens: number
  readonly billableRequestCount: 1
  readonly evidenceSource: 'provider_reported'
  readonly rawProviderUsagePersisted: false
}

/**
 * Backend-private composite cost authority for one Study Chat attempt. The
 * record freezes the estimate, immutable rate card, budget, reserved usage
 * identities, and provisional actual internal cost in integer USD micros.
 * It is not a customer quote, credit reservation, wallet record, or service
 * fee calculation.
 */
export interface EditReferenceStudyChatInternalCostAuthorityRecord {
  readonly schemaVersion: typeof EDIT_REFERENCE_STUDY_CHAT_INTERNAL_COST_AUTHORITY_VERSION
  readonly id: string
  readonly workspaceId: string
  readonly actorUserId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  revision: number
  state: EditReferenceStudyChatInternalCostAuthorityState
  readonly studyRevisionAtApproval: number
  readonly approvedUsageEstimateId: string
  readonly internalCostBudgetId: string
  readonly immutableRateCardSnapshotId: string
  readonly providerRoute: string
  readonly providerModelId: string
  readonly providerModelRevision: string
  readonly providerModelAggregateSha256: string
  readonly tokenEstimate: {
    readonly input: EditReferenceStudyChatTokenEstimateRange
    readonly output: EditReferenceStudyChatTokenEstimateRange
  }
  readonly lowInternalCostMicros: string
  readonly expectedInternalCostMicros: string
  readonly highInternalCostMicros: string
  readonly maximumAuthorizedInternalCostMicros: string
  readonly rateCardSnapshot: EditReferenceStudyChatImmutableRateCardSnapshot
  readonly approvalAuthority: 'backend_private_controlled'
  readonly registrationIdempotencyKeyHashSha256: string
  readonly publicUserApprovalVerified: false
  readonly externalProviderExecutionAllowed: false
  readonly privateControlledExecutionOnly: true
  boundRequestDigestSha256?: string
  reasoningAttemptId?: string
  reservationIdempotencyKeyHashSha256?: string
  reservedInternalCostMicros: string
  meteredInternalCostMicros: string | null
  releasedInternalCostMicros: string
  usageEventIds: string[]
  internalCostRecordIds: string[]
  reasoningProviderRequestId?: string
  providerObservationIdDigestSha256?: string
  providerObservationDigestSha256?: string
  usageMeasurement?: EditReferenceStudyChatPersistedUsageMeasurement
  costEvidenceSource: 'not_incurred' | 'provider_reported' | 'unverified'
  customerPriceCalculated: false
  customerCreditsMutated: false
  serviceFeeIncluded: false
  invoiceReconciled: false
  readonly createdAt: string
  updatedAt: string
  readonly validUntil: string
  reservedAt?: string
  settledAt?: string
  readonly privateInternalOnly: true
}

export interface RegisterEditReferenceStudyChatInternalCostAuthorityInput {
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly expectedStudyRevision: number
  readonly providerIdentity: EditReferenceStudyChatProviderIdentity
  readonly rateCardVersion: string
  readonly fixedRequestMicros: string
  readonly inputTokenMicrosPerMillion: string
  readonly outputTokenMicrosPerMillion: string
  readonly inputTokenEstimate: EditReferenceStudyChatTokenEstimateRange
  readonly outputTokenEstimate: EditReferenceStudyChatTokenEstimateRange
  readonly maximumAuthorizedInternalCostMicros: string
  readonly validUntil: string
  readonly approvalAuthority: 'backend_private_controlled'
  readonly publicUserApprovalVerified: false
  readonly externalProviderExecutionAllowed: false
}

export interface AuthorizeEditReferenceStudyChatInternalCostInput {
  readonly request: EditReferenceStudyChatReasoningRequest
  readonly providerIdentity: EditReferenceStudyChatProviderIdentity
}

export interface BindEditReferenceStudyChatInternalCostProviderRequestInput {
  readonly request: EditReferenceStudyChatReasoningRequest
  readonly providerIdentity: EditReferenceStudyChatProviderIdentity
  readonly reasoningProviderRequestId: string
}

export interface SettleEditReferenceStudyChatInternalCostInput {
  readonly request: EditReferenceStudyChatReasoningRequest
  readonly providerIdentity: EditReferenceStudyChatProviderIdentity
  readonly reasoningProviderRequestId: string
  readonly providerObservation: EditReferenceStudyChatProviderTransportObservation
  readonly providerCallMade: boolean
  readonly usageMeasurement: EditReferenceStudyChatProviderUsageMeasurement | null
}

export interface EditReferenceStudyChatInternalCostAuthorizationData {
  readonly authorityRecord: EditReferenceStudyChatInternalCostAuthorityRecord
  readonly usageEventIds: readonly string[]
  readonly internalCostRecordIds: readonly string[]
  readonly authorizationDigestSha256: string
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
}

export interface EditReferenceStudyChatInternalCostProviderBindingData {
  readonly authorityRecord: EditReferenceStudyChatInternalCostAuthorityRecord
  readonly disposition: 'bound' | 'idempotent_replay'
  readonly providerCallAuthorized: false
  readonly internalCostSettled: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
}

export interface EditReferenceStudyChatInternalCostSettlementData {
  readonly authorityRecord: EditReferenceStudyChatInternalCostAuthorityRecord
  readonly disposition: 'metered_provisional' | 'released_not_incurred' | 'cost_unverified'
  readonly meteredInternalCostMicros: string | null
  readonly usageEventIds: readonly string[]
  readonly internalCostRecordIds: readonly string[]
  readonly invoiceReconciled: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
}

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const MONEY_MICROS_PATTERN = /^(?:0|[1-9][0-9]{0,15})$/

export function calculateEditReferenceStudyChatInternalCostMicros(input: {
  readonly rateCard: Pick<
    EditReferenceStudyChatImmutableRateCardSnapshot,
    'fixedRequestMicros' | 'inputTokenMicrosPerMillion' | 'outputTokenMicrosPerMillion'
  >
  readonly inputTokens: number
  readonly outputTokens: number
  readonly billableRequestCount?: number
}): string {
  assertTokenCount(input.inputTokens)
  assertTokenCount(input.outputTokens)
  const billableRequestCount = input.billableRequestCount ?? 1
  if (!Number.isSafeInteger(billableRequestCount) || billableRequestCount < 0 || billableRequestCount > 10) {
    throw new Error('Study Chat billable request count is invalid.')
  }
  const fixed = parseMoneyMicros(input.rateCard.fixedRequestMicros) * BigInt(billableRequestCount)
  const inputCost = ceilRatio(
    BigInt(input.inputTokens) * parseMoneyMicros(input.rateCard.inputTokenMicrosPerMillion),
    1_000_000n,
  )
  const outputCost = ceilRatio(
    BigInt(input.outputTokens) * parseMoneyMicros(input.rateCard.outputTokenMicrosPerMillion),
    1_000_000n,
  )
  const total = fixed + inputCost + outputCost
  if (total > 9_999_999_999_999_999n) throw new Error('Study Chat internal cost exceeds the supported range.')
  return total.toString()
}

export function hashEditReferenceStudyChatRateCardSnapshot(
  snapshot: Omit<EditReferenceStudyChatImmutableRateCardSnapshot, 'digestSha256'>,
): string {
  return sha256(JSON.stringify({
    id: snapshot.id,
    version: snapshot.version,
    currency: snapshot.currency,
    effectiveAt: snapshot.effectiveAt,
    fixedRequestMicros: snapshot.fixedRequestMicros,
    inputTokenMicrosPerMillion: snapshot.inputTokenMicrosPerMillion,
    outputTokenMicrosPerMillion: snapshot.outputTokenMicrosPerMillion,
    roundingMode: snapshot.roundingMode,
    source: snapshot.source,
    immutable: snapshot.immutable,
  }))
}

export function hashEditReferenceStudyChatInternalCostAuthorization(
  record: EditReferenceStudyChatInternalCostAuthorityRecord,
): string {
  return sha256(JSON.stringify({
    authorityRecordId: record.id,
    approvedUsageEstimateId: record.approvedUsageEstimateId,
    internalCostBudgetId: record.internalCostBudgetId,
    immutableRateCardSnapshotId: record.immutableRateCardSnapshotId,
    maximumAuthorizedInternalCostMicros: record.maximumAuthorizedInternalCostMicros,
    boundRequestDigestSha256: record.boundRequestDigestSha256,
    reasoningAttemptId: record.reasoningAttemptId,
    usageEventIds: record.usageEventIds,
    internalCostRecordIds: record.internalCostRecordIds,
    rateCardDigestSha256: record.rateCardSnapshot.digestSha256,
  }))
}

export function validateRegisterEditReferenceStudyChatInternalCostAuthorityInput(
  input: RegisterEditReferenceStudyChatInternalCostAuthorityInput,
): void {
  for (const value of [
    input.workspaceId,
    input.editReferenceId,
    input.studySessionId,
    input.providerIdentity.providerRoute,
    input.providerIdentity.providerModelId,
    input.providerIdentity.providerModelRevision,
    input.rateCardVersion,
  ]) if (!ID_PATTERN.test(value)) throw new Error('Study Chat internal-cost identity is invalid.')
  if (!SHA256_PATTERN.test(input.providerIdentity.providerModelAggregateSha256)) {
    throw new Error('Study Chat internal-cost provider digest is invalid.')
  }
  if (!Number.isSafeInteger(input.expectedStudyRevision) || input.expectedStudyRevision < 1) {
    throw new Error('Study Chat internal-cost study revision is invalid.')
  }
  validateTokenRange(input.inputTokenEstimate)
  validateTokenRange(input.outputTokenEstimate)
  for (const value of [
    input.fixedRequestMicros,
    input.inputTokenMicrosPerMillion,
    input.outputTokenMicrosPerMillion,
    input.maximumAuthorizedInternalCostMicros,
  ]) parseMoneyMicros(value)
  if (BigInt(input.maximumAuthorizedInternalCostMicros) <= 0n) {
    throw new Error('Study Chat internal-cost ceiling must be positive.')
  }
  if (!isIso(input.validUntil) || input.approvalAuthority !== 'backend_private_controlled') {
    throw new Error('Study Chat internal-cost private approval is invalid.')
  }
  if (input.publicUserApprovalVerified !== false || input.externalProviderExecutionAllowed !== false) {
    throw new Error('Study Chat internal-cost registration exceeds the private boundary.')
  }
}

export function validateEditReferenceStudyChatProviderUsageMeasurement(
  value: EditReferenceStudyChatProviderUsageMeasurement,
): void {
  if (!ID_PATTERN.test(value.providerUsageRecordId)) throw new Error('Provider usage identity is invalid.')
  assertTokenCount(value.inputTokens)
  assertTokenCount(value.outputTokens)
  assertTokenCount(value.totalTokens)
  if (
    value.totalTokens !== value.inputTokens + value.outputTokens
    || value.billableRequestCount !== 1
    || value.evidenceSource !== 'provider_reported'
    || value.rawProviderUsagePersisted !== false
  ) throw new Error('Provider usage measurement is invalid.')
}

export function validateBindEditReferenceStudyChatInternalCostProviderRequestInput(
  input: BindEditReferenceStudyChatInternalCostProviderRequestInput,
): void {
  if (!ID_PATTERN.test(input.reasoningProviderRequestId)) {
    throw new Error('Study Chat internal-cost provider-request binding identity is invalid.')
  }
  for (const value of [
    input.providerIdentity.providerRoute,
    input.providerIdentity.providerModelId,
    input.providerIdentity.providerModelRevision,
  ]) if (!ID_PATTERN.test(value)) throw new Error('Study Chat internal-cost provider binding is invalid.')
  if (!SHA256_PATTERN.test(input.providerIdentity.providerModelAggregateSha256)) {
    throw new Error('Study Chat internal-cost provider binding digest is invalid.')
  }
}

export function validateEditReferenceStudyChatInternalCostAuthorityRecord(
  record: EditReferenceStudyChatInternalCostAuthorityRecord,
): void {
  if (
    record.schemaVersion !== EDIT_REFERENCE_STUDY_CHAT_INTERNAL_COST_AUTHORITY_VERSION
    || !ID_PATTERN.test(record.id)
    || !ID_PATTERN.test(record.workspaceId)
    || !ID_PATTERN.test(record.actorUserId)
    || !ID_PATTERN.test(record.editReferenceId)
    || !ID_PATTERN.test(record.studySessionId)
    || !Number.isSafeInteger(record.revision)
    || record.revision < 1
    || !EDIT_REFERENCE_STUDY_CHAT_INTERNAL_COST_AUTHORITY_STATES.includes(record.state)
    || !Number.isSafeInteger(record.studyRevisionAtApproval)
    || record.studyRevisionAtApproval < 1
  ) throw new Error('Study Chat internal-cost authority identity is invalid.')
  for (const value of [
    record.approvedUsageEstimateId,
    record.internalCostBudgetId,
    record.immutableRateCardSnapshotId,
    record.providerRoute,
    record.providerModelId,
    record.providerModelRevision,
  ]) if (!ID_PATTERN.test(value)) throw new Error('Study Chat internal-cost authority link is invalid.')
  if (!SHA256_PATTERN.test(record.providerModelAggregateSha256)) {
    throw new Error('Study Chat internal-cost provider digest is invalid.')
  }
  validateTokenRange(record.tokenEstimate.input)
  validateTokenRange(record.tokenEstimate.output)
  for (const value of [
    record.lowInternalCostMicros,
    record.expectedInternalCostMicros,
    record.highInternalCostMicros,
    record.maximumAuthorizedInternalCostMicros,
    record.reservedInternalCostMicros,
    record.releasedInternalCostMicros,
  ]) parseMoneyMicros(value)
  if (record.meteredInternalCostMicros !== null) parseMoneyMicros(record.meteredInternalCostMicros)
  validateRateCardSnapshot(record.rateCardSnapshot)
  const low = calculateEditReferenceStudyChatInternalCostMicros({
    rateCard: record.rateCardSnapshot,
    inputTokens: record.tokenEstimate.input.low,
    outputTokens: record.tokenEstimate.output.low,
  })
  const expected = calculateEditReferenceStudyChatInternalCostMicros({
    rateCard: record.rateCardSnapshot,
    inputTokens: record.tokenEstimate.input.expected,
    outputTokens: record.tokenEstimate.output.expected,
  })
  const high = calculateEditReferenceStudyChatInternalCostMicros({
    rateCard: record.rateCardSnapshot,
    inputTokens: record.tokenEstimate.input.high,
    outputTokens: record.tokenEstimate.output.high,
  })
  if (
    record.rateCardSnapshot.id !== record.immutableRateCardSnapshotId
    || record.lowInternalCostMicros !== low
    || record.expectedInternalCostMicros !== expected
    || record.highInternalCostMicros !== high
    || BigInt(record.maximumAuthorizedInternalCostMicros) < BigInt(high)
    || record.approvalAuthority !== 'backend_private_controlled'
    || !SHA256_PATTERN.test(record.registrationIdempotencyKeyHashSha256)
    || record.publicUserApprovalVerified !== false
    || record.externalProviderExecutionAllowed !== false
    || record.privateControlledExecutionOnly !== true
    || record.customerPriceCalculated !== false
    || record.customerCreditsMutated !== false
    || record.serviceFeeIncluded !== false
    || record.invoiceReconciled !== false
    || record.privateInternalOnly !== true
    || !isIso(record.createdAt)
    || !isIso(record.updatedAt)
    || !isIso(record.validUntil)
  ) throw new Error('Study Chat internal-cost authority invariant is invalid.')
  assertUniqueIds(record.usageEventIds)
  assertUniqueIds(record.internalCostRecordIds)
  validateState(record)
}

function validateRateCardSnapshot(snapshot: EditReferenceStudyChatImmutableRateCardSnapshot): void {
  for (const value of [snapshot.id, snapshot.version]) {
    if (!ID_PATTERN.test(value)) throw new Error('Study Chat rate-card identity is invalid.')
  }
  for (const value of [
    snapshot.fixedRequestMicros,
    snapshot.inputTokenMicrosPerMillion,
    snapshot.outputTokenMicrosPerMillion,
  ]) parseMoneyMicros(value)
  const payload: Omit<EditReferenceStudyChatImmutableRateCardSnapshot, 'digestSha256'> = {
    id: snapshot.id,
    version: snapshot.version,
    currency: snapshot.currency,
    effectiveAt: snapshot.effectiveAt,
    fixedRequestMicros: snapshot.fixedRequestMicros,
    inputTokenMicrosPerMillion: snapshot.inputTokenMicrosPerMillion,
    outputTokenMicrosPerMillion: snapshot.outputTokenMicrosPerMillion,
    roundingMode: snapshot.roundingMode,
    source: snapshot.source,
    immutable: snapshot.immutable,
  }
  if (
    snapshot.currency !== 'USD'
    || !isIso(snapshot.effectiveAt)
    || snapshot.roundingMode !== 'ceil_each_line_item_to_integer_micros'
    || snapshot.source !== 'backend_private_controlled_snapshot'
    || snapshot.immutable !== true
    || snapshot.digestSha256 !== hashEditReferenceStudyChatRateCardSnapshot(payload)
  ) throw new Error('Study Chat immutable rate-card snapshot is invalid.')
}

function validateState(record: EditReferenceStudyChatInternalCostAuthorityRecord): void {
  const bindingFieldCount = [
    record.boundRequestDigestSha256,
    record.reasoningAttemptId,
    record.reservationIdempotencyKeyHashSha256,
  ].filter((value) => value !== undefined).length
  if (bindingFieldCount !== 0 && bindingFieldCount !== 3) {
    throw new Error('Study Chat cost authority contains a partial attempt binding.')
  }
  const bound = Boolean(
    record.boundRequestDigestSha256
    && record.reasoningAttemptId
    && record.reservationIdempotencyKeyHashSha256,
  )
  if (record.boundRequestDigestSha256 && !SHA256_PATTERN.test(record.boundRequestDigestSha256)) {
    throw new Error('Study Chat cost request digest is invalid.')
  }
  if (record.reservationIdempotencyKeyHashSha256 && !SHA256_PATTERN.test(record.reservationIdempotencyKeyHashSha256)) {
    throw new Error('Study Chat cost reservation digest is invalid.')
  }
  if (record.state === 'approved_private') {
    if (
      bound
      || record.reasoningProviderRequestId !== undefined
      || record.providerObservationIdDigestSha256 !== undefined
      || record.providerObservationDigestSha256 !== undefined
      || record.usageMeasurement !== undefined
      || record.usageEventIds.length
      || record.internalCostRecordIds.length
      || record.reservedInternalCostMicros !== '0'
      || record.meteredInternalCostMicros !== null
      || record.releasedInternalCostMicros !== '0'
      || record.costEvidenceSource !== 'not_incurred'
      || record.reservedAt
      || record.settledAt
    ) throw new Error('Approved private Study Chat cost authority contains execution state.')
    return
  }
  if (
    !bound
    || !ID_PATTERN.test(record.reasoningAttemptId as string)
    || record.usageEventIds.length !== 1
    || record.internalCostRecordIds.length !== 1
    || record.reservedInternalCostMicros !== record.maximumAuthorizedInternalCostMicros
    || !isIso(record.reservedAt as string)
  ) throw new Error('Reserved Study Chat cost authority is incomplete.')
  if (record.state === 'reserved') {
    if (
      (record.reasoningProviderRequestId !== undefined
        && !ID_PATTERN.test(record.reasoningProviderRequestId))
      || record.providerObservationIdDigestSha256
      || record.providerObservationDigestSha256
      || record.usageMeasurement
      || record.meteredInternalCostMicros !== null
      || record.releasedInternalCostMicros !== '0'
      || record.costEvidenceSource !== 'not_incurred'
      || record.settledAt
    ) throw new Error('Reserved Study Chat cost authority contains settlement state.')
    return
  }
  if (
    !ID_PATTERN.test(record.reasoningProviderRequestId as string)
    || !SHA256_PATTERN.test(record.providerObservationIdDigestSha256 as string)
    || !SHA256_PATTERN.test(record.providerObservationDigestSha256 as string)
    || !isIso(record.settledAt as string)
  ) throw new Error('Settled Study Chat cost authority lacks provider observation lineage.')
  if (record.state === 'metered_provisional') {
    if (!record.usageMeasurement) throw new Error('Metered Study Chat cost authority lacks usage.')
    validatePersistedUsage(record.usageMeasurement)
    const calculated = calculateEditReferenceStudyChatInternalCostMicros({
      rateCard: record.rateCardSnapshot,
      inputTokens: record.usageMeasurement.inputTokens,
      outputTokens: record.usageMeasurement.outputTokens,
      billableRequestCount: record.usageMeasurement.billableRequestCount,
    })
    if (
      record.meteredInternalCostMicros !== calculated
      || BigInt(calculated) <= 0n
      || BigInt(calculated) > BigInt(record.maximumAuthorizedInternalCostMicros)
      || record.releasedInternalCostMicros
        !== (BigInt(record.maximumAuthorizedInternalCostMicros) - BigInt(calculated)).toString()
      || record.costEvidenceSource !== 'provider_reported'
    ) throw new Error('Metered Study Chat cost authority math is invalid.')
    return
  }
  if (record.state === 'released_not_incurred') {
    if (
      record.usageMeasurement
      || record.meteredInternalCostMicros !== '0'
      || record.releasedInternalCostMicros !== record.maximumAuthorizedInternalCostMicros
      || record.costEvidenceSource !== 'not_incurred'
    ) throw new Error('Released Study Chat cost authority is invalid.')
    return
  }
  if (
    record.state !== 'cost_unverified'
    || record.meteredInternalCostMicros !== null
    || record.releasedInternalCostMicros !== '0'
    || record.costEvidenceSource !== 'unverified'
  ) throw new Error('Unverified Study Chat cost authority is invalid.')
  if (record.usageMeasurement) validatePersistedUsage(record.usageMeasurement)
}

function validatePersistedUsage(value: EditReferenceStudyChatPersistedUsageMeasurement): void {
  if (!SHA256_PATTERN.test(value.providerUsageRecordIdDigestSha256)) {
    throw new Error('Persisted provider usage digest is invalid.')
  }
  assertTokenCount(value.inputTokens)
  assertTokenCount(value.outputTokens)
  assertTokenCount(value.totalTokens)
  if (
    value.totalTokens !== value.inputTokens + value.outputTokens
    || value.billableRequestCount !== 1
    || value.evidenceSource !== 'provider_reported'
    || value.rawProviderUsagePersisted !== false
  ) throw new Error('Persisted provider usage measurement is invalid.')
}

function validateTokenRange(value: EditReferenceStudyChatTokenEstimateRange): void {
  assertTokenCount(value.low)
  assertTokenCount(value.expected)
  assertTokenCount(value.high)
  if (value.low > value.expected || value.expected > value.high) {
    throw new Error('Study Chat token estimate range is invalid.')
  }
}

function assertTokenCount(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > 10_000_000) {
    throw new Error('Study Chat token count is invalid.')
  }
}

function assertUniqueIds(values: readonly string[]): void {
  if (
    values.length > 64
    || new Set(values).size !== values.length
    || values.some((value) => !ID_PATTERN.test(value))
  ) throw new Error('Study Chat cost record identities are invalid.')
}

function parseMoneyMicros(value: string): bigint {
  if (!MONEY_MICROS_PATTERN.test(value)) throw new Error('Study Chat internal cost micros are invalid.')
  return BigInt(value)
}

function ceilRatio(numerator: bigint, denominator: bigint): bigint {
  return numerator === 0n ? 0n : (numerator + denominator - 1n) / denominator
}

function isIso(value: string): boolean {
  return typeof value === 'string'
    && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString() === value
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
