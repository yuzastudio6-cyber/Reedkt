import type {
  PreferenceTechnicalStudyStageId,
  PreferenceTechnicalStudyUsageEvidence,
} from '../../src/types/edit-reference'

export const EDIT_REFERENCE_TECHNICAL_STUDY_USAGE_VERSION =
  'edit-reference-technical-study-usage-v1' as const

const STAGE_ORDER: readonly PreferenceTechnicalStudyStageId[] = [
  'media_foundation',
  'technical_scene_boundary',
  'technical_source_condition_signal',
  'technical_edge_width_signal',
  'technical_caption_region_signal',
  'technical_color_signal',
  'technical_audio_loudness',
  'technical_audio_low_level',
  'technical_motion_signal',
]
const TOOL_ORDER = ['ffprobe', 'ffmpeg'] as const
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const MONEY_MICROS_PATTERN = /^(?:0|[1-9][0-9]{0,23})$/
const MAX_WALL_CLOCK_MS = 60 * 60 * 1_000
const MAX_INPUT_MEDIA_SECONDS = 24 * 60 * 60

/**
 * Records the bounded inputs required to connect Edit Reference technical
 * studies to the canonical internal-cost authority after PR #2492 lands.
 * It does not calculate a rate, customer price, credits, or service fee.
 */
export function createBackendLocalUnmeteredTechnicalStudyUsage(input: {
  startedAt: string
  completedAt: string
  wallClockMs: number
  inputMediaSeconds: number
  trackedStageIds: readonly PreferenceTechnicalStudyStageId[]
  toolIds: readonly string[]
}): PreferenceTechnicalStudyUsageEvidence {
  const usage: PreferenceTechnicalStudyUsageEvidence = {
    schemaVersion: EDIT_REFERENCE_TECHNICAL_STUDY_USAGE_VERSION,
    mode: 'backend_local_unmetered',
    measurementScope: 'aggregate_process_wall_clock',
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    wallClockMs: Math.max(0, Math.round(input.wallClockMs)),
    inputMediaSeconds: round(Math.max(0, input.inputMediaSeconds)),
    trackedStageIds: orderedUniqueStages(input.trackedStageIds),
    toolIds: orderedKnownTools(input.toolIds),
    approvedUsageEstimateId: null,
    internalCostBudgetId: null,
    maximumAuthorizedInternalCostMicros: null,
    rateCardSnapshotId: null,
    meteredInternalCostMicros: null,
    usageEventIds: [],
    internalCostRecordIds: [],
    internalComputeUsageMetered: false,
    productionCostAuthoritySatisfied: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
    providerCallMade: false,
    remoteMutationMade: false,
  }
  validateEditReferenceTechnicalStudyUsage(usage)
  return usage
}

export function validateEditReferenceTechnicalStudyUsage(
  value: unknown,
): asserts value is PreferenceTechnicalStudyUsageEvidence {
  assertNoUnsafeContent(value)
  if (!isRecord(value)) throw new Error('Edit Reference technical-study usage must be an object.')
  assertExactKeys(value, [
    'schemaVersion',
    'mode',
    'measurementScope',
    'startedAt',
    'completedAt',
    'wallClockMs',
    'inputMediaSeconds',
    'trackedStageIds',
    'toolIds',
    'approvedUsageEstimateId',
    'internalCostBudgetId',
    'maximumAuthorizedInternalCostMicros',
    'rateCardSnapshotId',
    'meteredInternalCostMicros',
    'usageEventIds',
    'internalCostRecordIds',
    'internalComputeUsageMetered',
    'productionCostAuthoritySatisfied',
    'customerPriceCalculated',
    'customerCreditsMutated',
    'serviceFeeIncluded',
    'providerCallMade',
    'remoteMutationMade',
  ])
  if (value.schemaVersion !== EDIT_REFERENCE_TECHNICAL_STUDY_USAGE_VERSION) {
    throw new Error('Edit Reference technical-study usage version is unsupported.')
  }
  if (!['backend_local_unmetered', 'production_metered'].includes(String(value.mode))) {
    throw new Error('Edit Reference technical-study usage mode is invalid.')
  }
  if (value.measurementScope !== 'aggregate_process_wall_clock') {
    throw new Error('Edit Reference technical-study measurement scope is invalid.')
  }
  if (!isIsoDate(value.startedAt) || !isIsoDate(value.completedAt)) {
    throw new Error('Edit Reference technical-study timestamps are invalid.')
  }
  if (Date.parse(value.completedAt as string) < Date.parse(value.startedAt as string)) {
    throw new Error('Edit Reference technical-study timestamp order is invalid.')
  }
  if (
    !Number.isSafeInteger(value.wallClockMs)
    || (value.wallClockMs as number) < 0
    || (value.wallClockMs as number) > MAX_WALL_CLOCK_MS
  ) {
    throw new Error('Edit Reference technical-study wall-clock measurement is invalid.')
  }
  if (
    typeof value.inputMediaSeconds !== 'number'
    || !Number.isFinite(value.inputMediaSeconds)
    || value.inputMediaSeconds < 0
    || value.inputMediaSeconds > MAX_INPUT_MEDIA_SECONDS
  ) {
    throw new Error('Edit Reference technical-study input duration is invalid.')
  }
  assertOrderedUniqueArray(value.trackedStageIds, STAGE_ORDER, 'Edit Reference technical-study stage IDs are invalid.')
  assertOrderedUniqueArray(value.toolIds, TOOL_ORDER, 'Edit Reference technical-study tool IDs are invalid.')
  assertIdArray(value.usageEventIds, 64, 'Edit Reference technical-study usage-event IDs are invalid.')
  assertIdArray(value.internalCostRecordIds, 64, 'Edit Reference technical-study cost-record IDs are invalid.')
  if (
    value.customerPriceCalculated !== false
    || value.customerCreditsMutated !== false
    || value.serviceFeeIncluded !== false
    || value.providerCallMade !== false
    || value.remoteMutationMade !== false
  ) {
    throw new Error('Edit Reference technical-study usage crossed a protected side-effect boundary.')
  }

  if (value.mode === 'backend_local_unmetered') {
    if (
      value.approvedUsageEstimateId !== null
      || value.internalCostBudgetId !== null
      || value.maximumAuthorizedInternalCostMicros !== null
      || value.rateCardSnapshotId !== null
      || value.meteredInternalCostMicros !== null
      || (value.usageEventIds as unknown[]).length !== 0
      || (value.internalCostRecordIds as unknown[]).length !== 0
      || value.internalComputeUsageMetered !== false
      || value.productionCostAuthoritySatisfied !== false
    ) {
      throw new Error('Backend-local Edit Reference study cannot claim canonical production cost authority.')
    }
    return
  }

  assertId(value.approvedUsageEstimateId, 'Production Edit Reference study requires an approved usage estimate.')
  assertId(value.internalCostBudgetId, 'Production Edit Reference study requires an internal cost budget.')
  assertId(value.rateCardSnapshotId, 'Production Edit Reference study requires an immutable rate-card snapshot.')
  assertPositiveMoneyMicros(
    value.maximumAuthorizedInternalCostMicros,
    'Production Edit Reference study requires a positive maximum authorized internal cost.',
  )
  assertMoneyMicros(value.meteredInternalCostMicros, 'Production Edit Reference metered internal cost is invalid.')
  if (
    (value.usageEventIds as unknown[]).length < 1
    || (value.internalCostRecordIds as unknown[]).length < 1
    || value.internalComputeUsageMetered !== true
    || value.productionCostAuthoritySatisfied !== true
  ) {
    throw new Error('Production Edit Reference study requires canonical usage and internal-cost evidence.')
  }
  if (
    BigInt(value.meteredInternalCostMicros as string)
    > BigInt(value.maximumAuthorizedInternalCostMicros as string)
  ) {
    throw new Error('Edit Reference technical study exceeded its maximum authorized internal cost.')
  }
}

function orderedUniqueStages(
  values: readonly PreferenceTechnicalStudyStageId[],
): PreferenceTechnicalStudyStageId[] {
  const requested = new Set(values)
  return STAGE_ORDER.filter((stage) => requested.has(stage))
}

function orderedKnownTools(values: readonly string[]): Array<'ffprobe' | 'ffmpeg'> {
  const requested = new Set(values)
  return TOOL_ORDER.filter((toolId) => requested.has(toolId))
}

function assertOrderedUniqueArray(
  value: unknown,
  allowed: readonly string[],
  message: string,
): asserts value is string[] {
  if (!Array.isArray(value) || value.length > allowed.length || new Set(value).size !== value.length) {
    throw new Error(message)
  }
  const indexes = value.map((item) => allowed.indexOf(String(item)))
  if (indexes.some((index) => index < 0) || indexes.some((index, position) => position > 0 && index <= indexes[position - 1])) {
    throw new Error(message)
  }
}

function assertIdArray(value: unknown, maximum: number, message: string): asserts value is string[] {
  if (
    !Array.isArray(value)
    || value.length > maximum
    || new Set(value).size !== value.length
    || value.some((item) => typeof item !== 'string' || !ID_PATTERN.test(item))
  ) throw new Error(message)
}

function assertId(value: unknown, message: string): asserts value is string {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) throw new Error(message)
}

function assertMoneyMicros(value: unknown, message: string): asserts value is string {
  if (typeof value !== 'string' || !MONEY_MICROS_PATTERN.test(value)) throw new Error(message)
}

function assertPositiveMoneyMicros(value: unknown, message: string): asserts value is string {
  assertMoneyMicros(value, message)
  if (BigInt(value) <= 0n) throw new Error(message)
}

function assertNoUnsafeContent(value: unknown): void {
  const serialized = JSON.stringify(value)
  if (
    /(?:https?:\/\/|file:\/\/|(?:api|access|refresh|service[_-]?role)[_-]?(?:key|token)|authorization\s*[:=]|bearer\s+[A-Za-z0-9._-]+)/i.test(serialized)
  ) {
    throw new Error('Edit Reference technical-study usage contains unsafe content.')
  }
}

function assertExactKeys(value: Record<string, unknown>, expected: readonly string[]): void {
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new Error('Edit Reference technical-study usage contains unknown or missing fields.')
  }
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function round(value: number): number {
  return Number(value.toFixed(3))
}
