import type { ToolCostComputeLevel, ToolCostQualityLevel, ToolCostRiskLevel } from './types'

export const TOOL_COST_RATE_CARD_VERSION = 'tool-metering-v1-2026-06-26'

export interface ToolCostRateCard {
  version: string
  creditValueCents: 10
  billing: {
    minimumBillableMs: number
    billableRoundingMs: number
  }
  computeLevelDefaults: Record<ToolCostComputeLevel, {
    vcpuCount: number
    memoryGiB: number
    gpuCount: number
    qualityMultiplier: number
  }>
  riskBuffers: Record<ToolCostRiskLevel, {
    lowMultiplier: number
    highMultiplier: number
  }>
  infrastructure: {
    cpuMicrosPerVcpuSecond: number
    memoryMicrosPerGiBSecond: number
    gpuMicrosPerGpuSecond: Record<string, number>
    defaultGpuMicrosPerGpuSecond: number
    temporaryStorageMicrosPerGiBHour: number
    outputStorageMicrosPerGiBHour: number
    networkEgressMicrosPerMiB: number
    cloudRunRequestOverheadMicros: number
    cloudRunJobOverheadMicros: number
    computeEngineVmOverheadMicros: number
  }
  deterministicRenderer: {
    flatRequestMicros: number
    outputSecondMicros: number
    megapixelFrameMicros: number
  }
  provider: {
    defaultInputTokenMicros: number
    defaultOutputTokenMicros: number
    inputVideoSecondMicros: number
    outputVideoSecondMicros: number
    inputAudioSecondMicros: number
    outputAudioSecondMicros: number
    imageMicros: number
    renderSecondMicros: number
  }
  human: {
    hourlyMicros: number
  }
  qualityMultipliers: Record<ToolCostQualityLevel, number>
}

export const toolCostRateCard: ToolCostRateCard = {
  version: TOOL_COST_RATE_CARD_VERSION,
  creditValueCents: 10,
  billing: {
    minimumBillableMs: 60_000,
    billableRoundingMs: 1_000,
  },
  computeLevelDefaults: {
    economy: { vcpuCount: 1, memoryGiB: 1, gpuCount: 0, qualityMultiplier: 1 },
    standard: { vcpuCount: 2, memoryGiB: 2, gpuCount: 0, qualityMultiplier: 1.35 },
    premium: { vcpuCount: 4, memoryGiB: 8, gpuCount: 1, qualityMultiplier: 2.4 },
  },
  riskBuffers: {
    low: { lowMultiplier: 0.8, highMultiplier: 1.2 },
    medium: { lowMultiplier: 0.7, highMultiplier: 1.6 },
    high: { lowMultiplier: 0.6, highMultiplier: 2.25 },
  },
  infrastructure: {
    cpuMicrosPerVcpuSecond: 250,
    memoryMicrosPerGiBSecond: 35,
    gpuMicrosPerGpuSecond: {
      nvidia_l4: 900,
      nvidia_t4: 600,
      rtx_pro_6000: 3_000,
    },
    defaultGpuMicrosPerGpuSecond: 900,
    temporaryStorageMicrosPerGiBHour: 120,
    outputStorageMicrosPerGiBHour: 160,
    networkEgressMicrosPerMiB: 12,
    cloudRunRequestOverheadMicros: 8_000,
    cloudRunJobOverheadMicros: 12_000,
    computeEngineVmOverheadMicros: 24_000,
  },
  deterministicRenderer: {
    flatRequestMicros: 15_000,
    outputSecondMicros: 550,
    megapixelFrameMicros: 4,
  },
  provider: {
    defaultInputTokenMicros: 0.003,
    defaultOutputTokenMicros: 0.012,
    inputVideoSecondMicros: 900,
    outputVideoSecondMicros: 18_000,
    inputAudioSecondMicros: 120,
    outputAudioSecondMicros: 1_600,
    imageMicros: 7_500,
    renderSecondMicros: 1_200,
  },
  human: {
    hourlyMicros: 5_000_000,
  },
  qualityMultipliers: {
    draft: 0.75,
    preview: 1,
    production: 1.25,
    premium: 1.8,
  },
}

export function getRateCardSnapshot(): Record<string, unknown> {
  return {
    version: toolCostRateCard.version,
    creditValueCents: toolCostRateCard.creditValueCents,
    billing: toolCostRateCard.billing,
    computeLevelDefaults: toolCostRateCard.computeLevelDefaults,
    riskBuffers: toolCostRateCard.riskBuffers,
    infrastructure: toolCostRateCard.infrastructure,
    deterministicRenderer: toolCostRateCard.deterministicRenderer,
    provider: toolCostRateCard.provider,
    human: toolCostRateCard.human,
    qualityMultipliers: toolCostRateCard.qualityMultipliers,
    serviceFeeIncluded: false,
    note: 'Static placeholder internal rates for mock-safe metering tests; replace with owner-approved production rate cards before live billing.',
  }
}
