export const EDIT_REFERENCE_LONG_FORM_STUDY_USAGE_VERSION =
  'edit-reference-long-form-study-usage-v1' as const

export type EditReferenceLongFormStudyUsageMode =
  | 'backend_local_unmetered'
  | 'controlled_test_unmetered'
  | 'production_metered'

export type EditReferenceLongFormStudyCostEvidenceSource =
  | 'unmetered_observation'
  | 'infrastructure_metered'
  | 'provider_reported'
  | 'composite_metered'

export interface EditReferenceLongFormStudyUsageEvidence {
  readonly schemaVersion: typeof EDIT_REFERENCE_LONG_FORM_STUDY_USAGE_VERSION
  readonly mode: EditReferenceLongFormStudyUsageMode
  readonly costEvidenceSource: EditReferenceLongFormStudyCostEvidenceSource
  readonly observedWallClockMs: number
  readonly inputMediaSeconds: number
  readonly outputBytes: number
  readonly approvedUsageEstimateId: string | null
  readonly internalCostBudgetId: string | null
  readonly maximumAuthorizedInternalCostMicros: string | null
  readonly rateCardSnapshotId: string | null
  readonly meteredProviderCostMicros: string | null
  readonly meteredInfrastructureCostMicros: string | null
  readonly meteredInternalCostMicros: string | null
  readonly usageEventIds: readonly string[]
  readonly internalCostRecordIds: readonly string[]
  readonly productionCostAuthoritySatisfied: boolean
  readonly actualInternalCostFinal: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
}

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const MONEY_MICROS_PATTERN = /^(?:0|[1-9][0-9]{0,23})$/
const MAX_WALL_CLOCK_MS = 7 * 24 * 60 * 60 * 1_000
const MAX_INPUT_MEDIA_SECONDS = 30 * 24 * 60 * 60

export function createUnmeteredEditReferenceLongFormStudyUsage(input: {
  readonly mode: Exclude<EditReferenceLongFormStudyUsageMode, 'production_metered'>
  readonly observedWallClockMs: number
  readonly inputMediaSeconds: number
  readonly outputBytes: number
}): EditReferenceLongFormStudyUsageEvidence {
  const usage: EditReferenceLongFormStudyUsageEvidence = {
    schemaVersion: EDIT_REFERENCE_LONG_FORM_STUDY_USAGE_VERSION,
    mode: input.mode,
    costEvidenceSource: 'unmetered_observation',
    observedWallClockMs: input.observedWallClockMs,
    inputMediaSeconds: rounded(input.inputMediaSeconds),
    outputBytes: input.outputBytes,
    approvedUsageEstimateId: null,
    internalCostBudgetId: null,
    maximumAuthorizedInternalCostMicros: null,
    rateCardSnapshotId: null,
    meteredProviderCostMicros: null,
    meteredInfrastructureCostMicros: null,
    meteredInternalCostMicros: null,
    usageEventIds: [],
    internalCostRecordIds: [],
    productionCostAuthoritySatisfied: false,
    actualInternalCostFinal: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
  validateEditReferenceLongFormStudyUsage(usage)
  return usage
}

export function validateEditReferenceLongFormStudyUsage(
  value: unknown,
): asserts value is EditReferenceLongFormStudyUsageEvidence {
  if (!isRecord(value)) throw new Error('Long-form study usage must be an object.')
  assertExactKeys(value, [
    'schemaVersion',
    'mode',
    'costEvidenceSource',
    'observedWallClockMs',
    'inputMediaSeconds',
    'outputBytes',
    'approvedUsageEstimateId',
    'internalCostBudgetId',
    'maximumAuthorizedInternalCostMicros',
    'rateCardSnapshotId',
    'meteredProviderCostMicros',
    'meteredInfrastructureCostMicros',
    'meteredInternalCostMicros',
    'usageEventIds',
    'internalCostRecordIds',
    'productionCostAuthoritySatisfied',
    'actualInternalCostFinal',
    'customerPriceCalculated',
    'customerCreditsMutated',
    'serviceFeeIncluded',
  ])
  if (value.schemaVersion !== EDIT_REFERENCE_LONG_FORM_STUDY_USAGE_VERSION) {
    throw new Error('Long-form study usage version is invalid.')
  }
  if (!['backend_local_unmetered', 'controlled_test_unmetered', 'production_metered'].includes(String(value.mode))) {
    throw new Error('Long-form study usage mode is invalid.')
  }
  if (
    !Number.isSafeInteger(value.observedWallClockMs)
    || (value.observedWallClockMs as number) < 1
    || (value.observedWallClockMs as number) > MAX_WALL_CLOCK_MS
    || typeof value.inputMediaSeconds !== 'number'
    || !Number.isFinite(value.inputMediaSeconds)
    || value.inputMediaSeconds <= 0
    || value.inputMediaSeconds > MAX_INPUT_MEDIA_SECONDS
    || !Number.isSafeInteger(value.outputBytes)
    || (value.outputBytes as number) < 0
  ) throw new Error('Long-form study usage quantities are invalid.')
  assertIdArray(value.usageEventIds, 'Long-form study usage-event ids are invalid.')
  assertIdArray(value.internalCostRecordIds, 'Long-form study internal-cost record ids are invalid.')
  if (
    value.actualInternalCostFinal !== false
    || value.customerPriceCalculated !== false
    || value.customerCreditsMutated !== false
    || value.serviceFeeIncluded !== false
  ) throw new Error('Long-form study usage crossed a protected pricing or settlement boundary.')

  if (value.mode !== 'production_metered') {
    if (
      value.costEvidenceSource !== 'unmetered_observation'
      || value.approvedUsageEstimateId !== null
      || value.internalCostBudgetId !== null
      || value.maximumAuthorizedInternalCostMicros !== null
      || value.rateCardSnapshotId !== null
      || value.meteredProviderCostMicros !== null
      || value.meteredInfrastructureCostMicros !== null
      || value.meteredInternalCostMicros !== null
      || (value.usageEventIds as unknown[]).length !== 0
      || (value.internalCostRecordIds as unknown[]).length !== 0
      || value.productionCostAuthoritySatisfied !== false
    ) throw new Error('Unmetered long-form study usage cannot claim production cost authority.')
    return
  }

  assertId(value.approvedUsageEstimateId, 'Production long-form study requires an approved usage estimate.')
  assertId(value.internalCostBudgetId, 'Production long-form study requires an internal cost budget.')
  assertId(value.rateCardSnapshotId, 'Production long-form study requires an immutable rate-card snapshot.')
  assertPositiveMoney(value.maximumAuthorizedInternalCostMicros, 'Production long-form study maximum cost is invalid.')
  assertMoney(value.meteredProviderCostMicros, 'Production long-form provider cost is invalid.')
  assertMoney(value.meteredInfrastructureCostMicros, 'Production long-form infrastructure cost is invalid.')
  assertMoney(value.meteredInternalCostMicros, 'Production long-form total internal cost is invalid.')
  const provider = BigInt(value.meteredProviderCostMicros as string)
  const infrastructure = BigInt(value.meteredInfrastructureCostMicros as string)
  const total = BigInt(value.meteredInternalCostMicros as string)
  if (
    total !== provider + infrastructure
    || total > BigInt(value.maximumAuthorizedInternalCostMicros as string)
    || (value.usageEventIds as unknown[]).length < 1
    || (value.internalCostRecordIds as unknown[]).length < 1
    || value.productionCostAuthoritySatisfied !== true
  ) throw new Error('Production long-form study usage lacks complete bounded cost evidence.')
  const expectedEvidence = provider > 0n && infrastructure > 0n
    ? 'composite_metered'
    : provider > 0n
      ? 'provider_reported'
      : 'infrastructure_metered'
  if (value.costEvidenceSource !== expectedEvidence) {
    throw new Error('Production long-form cost evidence source does not match its metered components.')
  }
}

function assertId(value: unknown, message: string): asserts value is string {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) throw new Error(message)
}

function assertIdArray(value: unknown, message: string): asserts value is string[] {
  if (
    !Array.isArray(value)
    || value.length > 128
    || new Set(value).size !== value.length
    || value.some((item) => typeof item !== 'string' || !ID_PATTERN.test(item))
  ) throw new Error(message)
}

function assertMoney(value: unknown, message: string): asserts value is string {
  if (typeof value !== 'string' || !MONEY_MICROS_PATTERN.test(value)) throw new Error(message)
}

function assertPositiveMoney(value: unknown, message: string): asserts value is string {
  assertMoney(value, message)
  if (BigInt(value) <= 0n) throw new Error(message)
}

function assertExactKeys(value: Record<string, unknown>, expected: readonly string[]): void {
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new Error('Long-form study usage contains unknown or missing fields.')
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function rounded(value: number): number {
  return Number(value.toFixed(3))
}
