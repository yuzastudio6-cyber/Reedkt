import type { JSONObject } from '../../src/types'
import {
  COST_MICROS_PER_CENT,
  TOOL_COST_RATE_CARD,
  TOOL_COST_RATE_CARD_VERSION,
  TOOL_RUNTIME_COMPUTE_LEVELS,
} from './rate-card'
import { validateToolCostNoSecretLikeFields } from './secret-safety'
import type {
  CalculateToolActualCostMicrosInput,
  DeterministicRendererCostInput,
  ExternalProviderCostInput,
  InfrastructureRuntimeCostInput,
  MockToolCostEvent,
  ToolCostEstimateInput,
  ToolCostEstimateRange,
  ToolCostMathErrorCode,
  ToolCostMathResult,
  ToolCostMicrosCalculation,
  ToolCostPricingSnapshot,
  ToolCostRiskLevel,
  ToolCostSourceKind,
  ToolCostEventAggregation,
  ToolRuntimeComputeLevel,
} from './types'

const BASIS_POINTS = 10_000
const LOW_ESTIMATE_BASIS_POINTS = 8_000

export interface BuildPricingSnapshotInput {
  sourceKind: ToolCostSourceKind
  provider?: string | null
  model?: string | null
  computeLevel?: ToolRuntimeComputeLevel | null
  riskLevel?: ToolCostRiskLevel | null
  pricingUnits?: JSONObject
}

export interface ClassifyToolCostRiskInput {
  expectedInternalCostCents?: number
  expectedInternalCostMicros?: number
  retryAttempt?: number
  hasProviderRoute?: boolean
}

export function normalizeBillableMilliseconds(milliseconds: number): ToolCostMathResult<number> {
  return validatePositiveInteger(milliseconds, 'billableMilliseconds', 'invalid_milliseconds')
}

export function roundBillableMilliseconds(milliseconds: number): ToolCostMathResult<number> {
  const normalized = normalizeBillableMilliseconds(milliseconds)
  if (!normalized.ok) return normalized

  const { minimumBillableMilliseconds, roundingIncrementMilliseconds } = TOOL_COST_RATE_CARD.roundingPolicy
  const rounded = Math.ceil(normalized.data / roundingIncrementMilliseconds) * roundingIncrementMilliseconds
  return okToolCost(Math.max(minimumBillableMilliseconds, rounded))
}

export function calculateExternalProviderCostMicros(
  input: ExternalProviderCostInput,
): ToolCostMathResult<ToolCostMicrosCalculation> {
  const requestCount = validateNonNegativeInteger(input.requestCount ?? 0, 'requestCount', 'invalid_count')
  if (!requestCount.ok) return requestCount
  const inputTokens = validateNonNegativeInteger(input.inputTokens ?? 0, 'inputTokens', 'invalid_count')
  if (!inputTokens.ok) return inputTokens
  const outputTokens = validateNonNegativeInteger(input.outputTokens ?? 0, 'outputTokens', 'invalid_count')
  if (!outputTokens.ok) return outputTokens
  const imageCount = validateNonNegativeInteger(input.imageCount ?? 0, 'imageCount', 'invalid_count')
  if (!imageCount.ok) return imageCount
  const inputVideoSeconds = validateNonNegativeFinite(input.inputVideoSeconds ?? 0, 'inputVideoSeconds', 'invalid_seconds')
  if (!inputVideoSeconds.ok) return inputVideoSeconds
  const outputVideoSeconds = validateNonNegativeFinite(input.outputVideoSeconds ?? 0, 'outputVideoSeconds', 'invalid_seconds')
  if (!outputVideoSeconds.ok) return outputVideoSeconds
  const inputAudioSeconds = validateNonNegativeFinite(input.inputAudioSeconds ?? 0, 'inputAudioSeconds', 'invalid_seconds')
  if (!inputAudioSeconds.ok) return inputAudioSeconds
  const outputAudioSeconds = validateNonNegativeFinite(input.outputAudioSeconds ?? 0, 'outputAudioSeconds', 'invalid_seconds')
  if (!outputAudioSeconds.ok) return outputAudioSeconds

  const rates = TOOL_COST_RATE_CARD.provider
  const breakdownMicros: JSONObject = {
    requestMicros: requestCount.data * rates.perRequestMicros,
    inputTokenMicros: inputTokens.data * rates.perInputTokenMicros,
    outputTokenMicros: outputTokens.data * rates.perOutputTokenMicros,
    inputVideoMicros: Math.ceil(inputVideoSeconds.data * rates.perInputVideoSecondMicros),
    outputVideoMicros: Math.ceil(outputVideoSeconds.data * rates.perOutputVideoSecondMicros),
    inputAudioMicros: Math.ceil(inputAudioSeconds.data * rates.perInputAudioSecondMicros),
    outputAudioMicros: Math.ceil(outputAudioSeconds.data * rates.perOutputAudioSecondMicros),
    imageMicros: imageCount.data * rates.perImageMicros,
  }
  const actualInternalCostMicros = sumNumericJsonValues(breakdownMicros)
  const pricingSnapshot = buildPricingSnapshot({
    sourceKind: 'external_provider',
    provider: input.provider ?? null,
    model: input.model ?? null,
    computeLevel: null,
    riskLevel: null,
    pricingUnits: {
      provider: input.provider ?? null,
      model: input.model ?? null,
      rates: {
        perRequestMicros: rates.perRequestMicros,
        perInputTextUnitMicros: rates.perInputTokenMicros,
        perOutputTextUnitMicros: rates.perOutputTokenMicros,
        perInputVideoSecondMicros: rates.perInputVideoSecondMicros,
        perOutputVideoSecondMicros: rates.perOutputVideoSecondMicros,
        perInputAudioSecondMicros: rates.perInputAudioSecondMicros,
        perOutputAudioSecondMicros: rates.perOutputAudioSecondMicros,
        perImageMicros: rates.perImageMicros,
      },
      units: {
        requestCount: requestCount.data,
        inputTextUnits: inputTokens.data,
        outputTextUnits: outputTokens.data,
        inputVideoSeconds: inputVideoSeconds.data,
        outputVideoSeconds: outputVideoSeconds.data,
        inputAudioSeconds: inputAudioSeconds.data,
        outputAudioSeconds: outputAudioSeconds.data,
        imageCount: imageCount.data,
      },
    },
  })
  if (!pricingSnapshot.ok) return pricingSnapshot

  return okToolCost({
    actualInternalCostMicros,
    sourceKind: 'external_provider',
    rateCardVersion: TOOL_COST_RATE_CARD_VERSION,
    provider: input.provider ?? null,
    model: input.model ?? null,
    computeLevel: null,
    pricingSnapshot: pricingSnapshot.data,
    breakdownMicros,
  })
}

export function calculateInfrastructureRuntimeCostMicros(
  input: InfrastructureRuntimeCostInput,
): ToolCostMathResult<ToolCostMicrosCalculation> {
  const computeLevel = input.computeLevel ?? 'standard'
  const computeLevelValidation = validateComputeLevel(computeLevel)
  if (!computeLevelValidation.ok) return computeLevelValidation
  const billableMilliseconds = roundBillableMilliseconds(input.wallTimeMilliseconds)
  if (!billableMilliseconds.ok) return billableMilliseconds
  const billableSeconds = billableMilliseconds.data / 1_000
  const renderSeconds = validateNonNegativeFinite(input.renderSeconds ?? billableSeconds, 'renderSeconds', 'invalid_seconds')
  if (!renderSeconds.ok) return renderSeconds
  const vcpuCount = validateNonNegativeFinite(input.vcpuCount ?? 0, 'vcpuCount', 'invalid_count')
  if (!vcpuCount.ok) return vcpuCount
  const memoryGib = validateNonNegativeFinite(input.memoryGib ?? 0, 'memoryGib', 'invalid_count')
  if (!memoryGib.ok) return memoryGib
  const gpuCount = validateNonNegativeFinite(input.gpuCount ?? 0, 'gpuCount', 'invalid_count')
  if (!gpuCount.ok) return gpuCount
  const tempStorageGibHours = validateNonNegativeFinite(input.tempStorageGibHours ?? 0, 'tempStorageGibHours', 'invalid_count')
  if (!tempStorageGibHours.ok) return tempStorageGibHours
  const outputStorageGibHours = validateNonNegativeFinite(input.outputStorageGibHours ?? 0, 'outputStorageGibHours', 'invalid_count')
  if (!outputStorageGibHours.ok) return outputStorageGibHours
  const networkEgressMib = validateNonNegativeFinite(input.networkEgressMib ?? 0, 'networkEgressMib', 'invalid_count')
  if (!networkEgressMib.ok) return networkEgressMib

  const rates = TOOL_COST_RATE_CARD.runtime
  const rawBreakdownMicros: JSONObject = {
    renderMicros: Math.ceil(renderSeconds.data * rates.perRenderSecondMicros),
    cpuMicros: Math.ceil(vcpuCount.data * billableSeconds * rates.perVcpuSecondMicros),
    memoryMicros: Math.ceil(memoryGib.data * billableSeconds * rates.perMemoryGibSecondMicros),
    gpuMicros: Math.ceil(gpuCount.data * billableSeconds * rates.perGpuSecondMicros),
    tempStorageMicros: Math.ceil(tempStorageGibHours.data * rates.perTempStorageGibHourMicros),
    outputStorageMicros: Math.ceil(outputStorageGibHours.data * rates.perOutputStorageGibHourMicros),
    networkEgressMicros: Math.ceil(networkEgressMib.data * rates.perNetworkEgressMibMicros),
  }
  const rawTotalMicros = sumNumericJsonValues(rawBreakdownMicros)
  const actualInternalCostMicros = applyBasisPoints(
    rawTotalMicros,
    TOOL_COST_RATE_CARD.computeLevelMultipliersBasisPoints[computeLevel],
  )
  const pricingSnapshot = buildPricingSnapshot({
    sourceKind: 'infrastructure_runtime',
    computeLevel,
    riskLevel: null,
    pricingUnits: {
      rates: rates as unknown as JSONObject,
      computeLevel,
      computeLevelMultiplierBasisPoints: TOOL_COST_RATE_CARD.computeLevelMultipliersBasisPoints[computeLevel],
      billableMilliseconds: billableMilliseconds.data,
      billableSeconds,
      units: {
        renderSeconds: renderSeconds.data,
        vcpuCount: vcpuCount.data,
        memoryGib: memoryGib.data,
        gpuCount: gpuCount.data,
        tempStorageGibHours: tempStorageGibHours.data,
        outputStorageGibHours: outputStorageGibHours.data,
        networkEgressMib: networkEgressMib.data,
      },
    },
  })
  if (!pricingSnapshot.ok) return pricingSnapshot

  return okToolCost({
    actualInternalCostMicros,
    sourceKind: 'infrastructure_runtime',
    rateCardVersion: TOOL_COST_RATE_CARD_VERSION,
    billableMilliseconds: billableMilliseconds.data,
    computeLevel,
    pricingSnapshot: pricingSnapshot.data,
    breakdownMicros: {
      ...rawBreakdownMicros,
      rawTotalMicros,
      computeAdjustedTotalMicros: actualInternalCostMicros,
    },
  })
}

export function calculateDeterministicRendererCostMicros(
  input: DeterministicRendererCostInput,
): ToolCostMathResult<ToolCostMicrosCalculation> {
  const computeLevel = input.computeLevel ?? 'standard'
  const computeLevelValidation = validateComputeLevel(computeLevel)
  if (!computeLevelValidation.ok) return computeLevelValidation
  const requestCount = validateNonNegativeInteger(input.requestCount ?? 1, 'requestCount', 'invalid_count')
  if (!requestCount.ok) return requestCount
  const outputSeconds = validateNonNegativeFinite(input.outputSeconds ?? 0, 'outputSeconds', 'invalid_seconds')
  if (!outputSeconds.ok) return outputSeconds
  const megapixelFrames = validateNonNegativeFinite(input.megapixelFrames ?? 0, 'megapixelFrames', 'invalid_count')
  if (!megapixelFrames.ok) return megapixelFrames

  const rates = TOOL_COST_RATE_CARD.deterministicRenderer
  const rawBreakdownMicros: JSONObject = {
    flatRequestMicros: requestCount.data * rates.flatRequestMicros,
    outputSecondMicros: Math.ceil(outputSeconds.data * rates.perOutputSecondMicros),
    megapixelFrameMicros: Math.ceil(megapixelFrames.data * rates.perMegapixelFrameMicros),
  }
  const rawTotalMicros = sumNumericJsonValues(rawBreakdownMicros)
  const actualInternalCostMicros = applyBasisPoints(
    rawTotalMicros,
    TOOL_COST_RATE_CARD.computeLevelMultipliersBasisPoints[computeLevel],
  )
  const pricingSnapshot = buildPricingSnapshot({
    sourceKind: 'deterministic_renderer',
    computeLevel,
    riskLevel: null,
    pricingUnits: {
      rates: rates as unknown as JSONObject,
      computeLevel,
      computeLevelMultiplierBasisPoints: TOOL_COST_RATE_CARD.computeLevelMultipliersBasisPoints[computeLevel],
      units: {
        requestCount: requestCount.data,
        outputSeconds: outputSeconds.data,
        megapixelFrames: megapixelFrames.data,
      },
    },
  })
  if (!pricingSnapshot.ok) return pricingSnapshot

  return okToolCost({
    actualInternalCostMicros,
    sourceKind: 'deterministic_renderer',
    rateCardVersion: TOOL_COST_RATE_CARD_VERSION,
    computeLevel,
    pricingSnapshot: pricingSnapshot.data,
    breakdownMicros: {
      ...rawBreakdownMicros,
      rawTotalMicros,
      computeAdjustedTotalMicros: actualInternalCostMicros,
    },
  })
}

export function calculateHumanCostMicros(): ToolCostMathResult<ToolCostMicrosCalculation> {
  return failToolCost(
    'unsupported_cost_source',
    'Human/manual cost is not supported by the RP-RATECARD-01 mock-safe rate card.',
    'sourceKind',
    'human_manual',
  )
}

export function calculateToolActualCostMicros(
  input: CalculateToolActualCostMicrosInput,
): ToolCostMathResult<ToolCostMicrosCalculation> {
  switch (input.sourceKind) {
    case 'external_provider':
      return calculateExternalProviderCostMicros(input.provider)
    case 'infrastructure_runtime':
      return calculateInfrastructureRuntimeCostMicros(input.runtime)
    case 'deterministic_renderer':
      return calculateDeterministicRendererCostMicros(input.deterministicRenderer)
    case 'human_manual':
      return calculateHumanCostMicros()
    case 'mock_manual_entry': {
      const cents = validateNonNegativeInteger(input.actualInternalCostCents, 'actualInternalCostCents', 'invalid_cents')
      if (!cents.ok) return cents
      const pricingSnapshot = buildPricingSnapshot({
        sourceKind: 'mock_manual_entry',
        riskLevel: input.riskLevel ?? null,
        pricingUnits: {
          actualInternalCostCents: cents.data,
          actualInternalCostMicros: cents.data * COST_MICROS_PER_CENT,
          note: 'Compatibility path for existing RP-CREDITDATA-01 cents-only mock events.',
        },
      })
      if (!pricingSnapshot.ok) return pricingSnapshot
      return okToolCost({
        actualInternalCostMicros: cents.data * COST_MICROS_PER_CENT,
        sourceKind: 'mock_manual_entry',
        rateCardVersion: TOOL_COST_RATE_CARD_VERSION,
        computeLevel: null,
        pricingSnapshot: pricingSnapshot.data,
        breakdownMicros: {
          manualMockMicros: cents.data * COST_MICROS_PER_CENT,
        },
      })
    }
  }
}

export function microsToCentsCeil(micros: number): ToolCostMathResult<number> {
  const validation = validateNonNegativeInteger(micros, 'micros', 'invalid_micros')
  if (!validation.ok) return validation
  if (micros === 0) return okToolCost(0)
  return okToolCost(Math.ceil(micros / COST_MICROS_PER_CENT))
}

export function centsToCreditsCeil(cents: number): ToolCostMathResult<number> {
  const validation = validateNonNegativeInteger(cents, 'cents', 'invalid_cents')
  if (!validation.ok) return validation
  if (cents === 0) return okToolCost(0)
  return okToolCost(Math.ceil(cents / TOOL_COST_RATE_CARD.creditValueCents))
}

export function calculateToolCostCredits(actualInternalCostCents: number): ToolCostMathResult<number> {
  return centsToCreditsCeil(actualInternalCostCents)
}

export function createToolCostCredits(actualInternalCostCents: number): number {
  return unwrapToolCostResult(calculateToolCostCredits(actualInternalCostCents))
}

export function calculateEstimateRangeFromExpectedCost(
  input: ToolCostEstimateInput,
): ToolCostMathResult<ToolCostEstimateRange> {
  const expectedMicrosValidation = validateNonNegativeInteger(
    input.expectedInternalCostMicros,
    'expectedInternalCostMicros',
    'invalid_micros',
  )
  if (!expectedMicrosValidation.ok) return expectedMicrosValidation
  const expectedCents = microsToCentsCeil(expectedMicrosValidation.data)
  if (!expectedCents.ok) return expectedCents
  const riskLevel = input.riskLevel ?? unwrapToolCostResult(classifyToolCostRisk({
    expectedInternalCostCents: expectedCents.data,
    hasProviderRoute: input.sourceKind === 'external_provider',
  }))
  const approvedReservationCredits = input.approvedReservationCredits === undefined
    ? null
    : validateNonNegativeInteger(input.approvedReservationCredits, 'approvedReservationCredits', 'invalid_credits')
  if (approvedReservationCredits && !approvedReservationCredits.ok) return approvedReservationCredits

  const lowMicros = applyBasisPoints(expectedMicrosValidation.data, LOW_ESTIMATE_BASIS_POINTS)
  const highMicros = expectedMicrosValidation.data + applyBasisPoints(
    expectedMicrosValidation.data,
    TOOL_COST_RATE_CARD.riskBuffersBasisPoints[riskLevel],
  )
  const lowCents = microsToCentsCeil(Math.min(lowMicros, expectedMicrosValidation.data))
  if (!lowCents.ok) return lowCents
  const highCents = microsToCentsCeil(Math.max(highMicros, expectedMicrosValidation.data))
  if (!highCents.ok) return highCents
  const lowCredits = centsToCreditsCeil(lowCents.data)
  if (!lowCredits.ok) return lowCredits
  const expectedCredits = centsToCreditsCeil(expectedCents.data)
  if (!expectedCredits.ok) return expectedCredits
  const highCredits = centsToCreditsCeil(highCents.data)
  if (!highCredits.ok) return highCredits
  const pricingSnapshot = buildPricingSnapshot({
    sourceKind: input.sourceKind ?? 'mock_manual_entry',
    provider: input.provider ?? null,
    model: input.model ?? null,
    computeLevel: input.computeLevel ?? null,
    riskLevel,
    pricingUnits: {
      expectedInternalCostMicros: expectedMicrosValidation.data,
      riskBufferBasisPoints: TOOL_COST_RATE_CARD.riskBuffersBasisPoints[riskLevel],
      lowEstimateBasisPoints: LOW_ESTIMATE_BASIS_POINTS,
      serviceFeeIncluded: false,
    },
  })
  if (!pricingSnapshot.ok) return pricingSnapshot

  return okToolCost({
    lowInternalCostCents: Math.min(lowCents.data, expectedCents.data),
    expectedInternalCostCents: expectedCents.data,
    highInternalCostCents: Math.max(highCents.data, expectedCents.data),
    lowCredits: Math.min(lowCredits.data, expectedCredits.data),
    expectedCredits: expectedCredits.data,
    highCredits: Math.max(highCredits.data, expectedCredits.data),
    riskLevel,
    rateCardVersion: TOOL_COST_RATE_CARD_VERSION,
    pricingSnapshot: pricingSnapshot.data,
    canRunWithinApprovedReservation: approvedReservationCredits === null
      ? null
      : highCredits.data <= approvedReservationCredits.data,
    serviceFeeIncluded: false,
  })
}

export function classifyToolCostRisk(input: ClassifyToolCostRiskInput): ToolCostMathResult<ToolCostRiskLevel> {
  let expectedCents = input.expectedInternalCostCents
  if (expectedCents === undefined && input.expectedInternalCostMicros !== undefined) {
    const cents = microsToCentsCeil(input.expectedInternalCostMicros)
    if (!cents.ok) return cents
    expectedCents = cents.data
  }
  const centsValidation = validateNonNegativeInteger(expectedCents ?? 0, 'expectedInternalCostCents', 'invalid_cents')
  if (!centsValidation.ok) return centsValidation

  if (centsValidation.data >= 2_000 || (input.retryAttempt ?? 0) >= 2) return okToolCost('high')
  if (centsValidation.data >= 500 || input.hasProviderRoute === true) return okToolCost('medium')
  return okToolCost('low')
}

export function buildPricingSnapshot(input: BuildPricingSnapshotInput): ToolCostMathResult<ToolCostPricingSnapshot> {
  const snapshot: ToolCostPricingSnapshot = {
    mockOnly: true,
    rateCardVersion: TOOL_COST_RATE_CARD_VERSION,
    creditValueCents: TOOL_COST_RATE_CARD.creditValueCents,
    serviceFeeIncluded: false,
    sourceKind: input.sourceKind,
    provider: input.provider ?? null,
    model: input.model ?? null,
    computeLevel: input.computeLevel ?? null,
    riskLevel: input.riskLevel ?? null,
    pricingUnits: input.pricingUnits ?? {},
    notes: [
      'Mock-safe pricing snapshot only; no secrets, provider headers, live billing IDs, wallet IDs, or signed URLs.',
      'ReEditPro service fee is excluded from tool-cost snapshots.',
    ],
  }
  const secretSafety = validatePricingSnapshotHasNoSecrets(snapshot)
  if (!secretSafety.ok) return secretSafety
  return okToolCost(snapshot)
}

export function validatePricingSnapshotHasNoSecrets(
  snapshot: unknown,
): ToolCostMathResult<true> {
  const safety = validateToolCostNoSecretLikeFields(snapshot)
  if (!safety.ok) {
    return failToolCost(
      'secret_like_pricing_snapshot',
      `Pricing snapshot contains secret-like fields: ${safety.secretLikePaths.join(', ')}`,
      'pricingSnapshot',
      safety.secretLikePaths,
    )
  }
  return okToolCost(true)
}

export function summarizeMockToolCostEvents(events: readonly MockToolCostEvent[]): ToolCostEventAggregation {
  const summary: ToolCostEventAggregation = {
    eventCount: 0,
    billableEventCount: 0,
    nonBillableEventCount: 0,
    actualBillableCostCents: 0,
    actualBillableCostCredits: 0,
    nonBillableCostCents: 0,
    nonBillableCredits: 0,
    billableEventIds: [],
    nonBillableEventIds: [],
    nonBillableReasons: [],
    byUsageCategory: {},
  }

  for (const event of events) {
    const category = summary.byUsageCategory[event.usageCategory] ?? {
      eventCount: 0,
      billableEventCount: 0,
      nonBillableEventCount: 0,
      actualInternalCostCents: 0,
      credits: 0,
      billableCostCents: 0,
      nonBillableCostCents: 0,
    }

    summary.eventCount += 1
    category.eventCount += 1
    category.actualInternalCostCents += event.actualInternalCostCents

    if (event.billableToUser) {
      summary.billableEventCount += 1
      summary.actualBillableCostCents += event.actualInternalCostCents
      summary.billableEventIds.push(event.id)
      category.billableEventCount += 1
      category.billableCostCents += event.actualInternalCostCents
    } else {
      summary.nonBillableEventCount += 1
      summary.nonBillableCostCents += event.actualInternalCostCents
      summary.nonBillableEventIds.push(event.id)
      if (event.nonBillableReason) summary.nonBillableReasons.push(event.nonBillableReason)
      category.nonBillableEventCount += 1
      category.nonBillableCostCents += event.actualInternalCostCents
    }

    summary.byUsageCategory[event.usageCategory] = category
  }

  summary.actualBillableCostCredits = createToolCostCredits(summary.actualBillableCostCents)
  summary.nonBillableCredits = createToolCostCredits(summary.nonBillableCostCents)

  for (const category of Object.values(summary.byUsageCategory)) {
    category.credits = createToolCostCredits(category.billableCostCents)
  }

  return summary
}

function validateComputeLevel(computeLevel: ToolRuntimeComputeLevel): ToolCostMathResult<ToolRuntimeComputeLevel> {
  if (!TOOL_RUNTIME_COMPUTE_LEVELS.includes(computeLevel)) {
    return failToolCost(
      'invalid_compute_level',
      'computeLevel must be economy, standard, or premium.',
      'computeLevel',
      computeLevel,
    )
  }
  return okToolCost(computeLevel)
}

function validatePositiveInteger(
  value: number,
  field: string,
  code: ToolCostMathErrorCode,
): ToolCostMathResult<number> {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    return failToolCost(code, `${field} must be a positive finite integer.`, field, value)
  }
  return okToolCost(value)
}

function validateNonNegativeInteger(
  value: number,
  field: string,
  code: ToolCostMathErrorCode,
): ToolCostMathResult<number> {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    return failToolCost(code, `${field} must be a non-negative finite integer.`, field, value)
  }
  return okToolCost(value)
}

function validateNonNegativeFinite(
  value: number,
  field: string,
  code: ToolCostMathErrorCode,
): ToolCostMathResult<number> {
  if (!Number.isFinite(value) || value < 0) {
    return failToolCost(code, `${field} must be a non-negative finite number.`, field, value)
  }
  return okToolCost(value)
}

function applyBasisPoints(value: number, basisPoints: number): number {
  if (value === 0) return 0
  return Math.ceil((value * basisPoints) / BASIS_POINTS)
}

function sumNumericJsonValues(values: JSONObject): number {
  return Object.values(values).reduce((sum, value) => sum + (typeof value === 'number' ? value : 0), 0)
}

function okToolCost<TData>(data: TData): ToolCostMathResult<TData> {
  return { ok: true, data }
}

function failToolCost(
  code: ToolCostMathErrorCode,
  message: string,
  field: string,
  value: unknown,
): ToolCostMathResult<never> {
  return {
    ok: false,
    error: {
      code,
      message,
      field,
      value,
    },
  }
}

function unwrapToolCostResult<TData>(result: ToolCostMathResult<TData>): TData {
  if (!result.ok) {
    throw new Error(result.error.message)
  }
  return result.data
}
