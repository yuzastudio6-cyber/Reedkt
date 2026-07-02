import { REEDITPRO_EDIT_LEVELS } from '../../src/types/credit-policy'
import {
  TOOL_COST_COMPUTE_LEVELS,
  type CanonicalToolCostRateCard,
  type ToolCostComputeLevel,
  type ToolCostMeteringRateCardEntry,
  type ToolCostQualityLevel,
  type ToolCostRiskLevel,
  type ToolOwnerCostEventPolicy,
} from './types'

export const TOOL_COST_RATE_CARD_VERSION = 'tool-metering-v1-2026-06-26'
export const COST_MICROS_PER_CENT = 10_000

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

export const TOOL_RUNTIME_COMPUTE_LEVELS = TOOL_COST_COMPUTE_LEVELS

export const TOOL_COST_RATE_CARD: CanonicalToolCostRateCard = {
  rateCardVersion: TOOL_COST_RATE_CARD_VERSION,
  creditValueCents: toolCostRateCard.creditValueCents,
  serviceFeeIncluded: false,
  productEditLevelsAreSeparate: true,
  supportedProductEditLevels: REEDITPRO_EDIT_LEVELS,
  computeLevels: TOOL_RUNTIME_COMPUTE_LEVELS,
  roundingPolicy: {
    minimumBillableMilliseconds: 1_000,
    roundingIncrementMilliseconds: 100,
  },
  computeLevelMultipliersBasisPoints: {
    economy: 8_000,
    standard: 10_000,
    premium: 14_000,
  },
  qualityMultipliersBasisPoints: {
    economy: 8_500,
    standard: 10_000,
    premium: 15_000,
  },
  riskBuffersBasisPoints: {
    low: 1_000,
    medium: 2_500,
    high: 5_000,
  },
  provider: {
    perRequestMicros: 6_000,
    perInputTokenMicros: toolCostRateCard.provider.defaultInputTokenMicros,
    perOutputTokenMicros: toolCostRateCard.provider.defaultOutputTokenMicros,
    perInputVideoSecondMicros: toolCostRateCard.provider.inputVideoSecondMicros,
    perOutputVideoSecondMicros: toolCostRateCard.provider.outputVideoSecondMicros,
    perInputAudioSecondMicros: toolCostRateCard.provider.inputAudioSecondMicros,
    perOutputAudioSecondMicros: toolCostRateCard.provider.outputAudioSecondMicros,
    perImageMicros: toolCostRateCard.provider.imageMicros,
  },
  runtime: {
    perRenderSecondMicros: toolCostRateCard.provider.renderSecondMicros,
    perVcpuSecondMicros: toolCostRateCard.infrastructure.cpuMicrosPerVcpuSecond,
    perMemoryGibSecondMicros: toolCostRateCard.infrastructure.memoryMicrosPerGiBSecond,
    perGpuSecondMicros: toolCostRateCard.infrastructure.defaultGpuMicrosPerGpuSecond,
    perTempStorageGibHourMicros: toolCostRateCard.infrastructure.temporaryStorageMicrosPerGiBHour,
    perOutputStorageGibHourMicros: toolCostRateCard.infrastructure.outputStorageMicrosPerGiBHour,
    perNetworkEgressMibMicros: toolCostRateCard.infrastructure.networkEgressMicrosPerMiB,
  },
  deterministicRenderer: {
    flatRequestMicros: toolCostRateCard.deterministicRenderer.flatRequestMicros,
    perOutputSecondMicros: toolCostRateCard.deterministicRenderer.outputSecondMicros,
    perMegapixelFrameMicros: toolCostRateCard.deterministicRenderer.megapixelFrameMicros,
  },
  humanManual: {
    supported: false,
    hourlyRateMicros: null,
    notes: [
      'Human/manual cost is intentionally not priced in this mock-safe rate card.',
      'A future owner-approved policy must define manual review pricing before it can be billed.',
    ],
  },
  notes: [
    'Compatibility view over the professional static v1 tool metering rate card.',
    'Tool/runtime compute levels economy/standard/premium are separate from product Edit Levels normal/premium/ultra_premium.',
    'Tool cost events report actual internal tool/provider/runtime cost only; ReEditPro service fee is added later by credit policy settlement math.',
  ],
}

export const TOOL_COST_METERING_POLICY_NOTE =
  'Tool/runtime compute levels economy/standard/premium are not product Edit Levels normal/premium/ultra_premium.'

export const TOOL_COST_METERING_RATE_CARD: readonly ToolCostMeteringRateCardEntry[] =
  TOOL_RUNTIME_COMPUTE_LEVELS.map((computeLevel) => ({
    computeLevel,
    creditValueCents: toolCostRateCard.creditValueCents,
    serviceFeeIncluded: false,
    productEditLevelsAreSeparate: true,
    supportedProductEditLevels: REEDITPRO_EDIT_LEVELS,
    notes: [
      TOOL_COST_METERING_POLICY_NOTE,
      'Policy-only compatibility rate card; no wallet mutation, provider call, render/export charge, or production settlement.',
    ],
  }))

export const TOOL_OWNER_COST_EVENT_POLICY: ToolOwnerCostEventPolicy = {
  ownerReportsActualInternalToolCostOnly: true,
  serviceFeeIncluded: false,
  reeditproServiceFeeOwner: 'reeditpro_billing_policy',
  noWalletMutation: true,
  noProviderCall: true,
  noSettlement: true,
  notes: [
    'Tool owners report actual internal tool cost only.',
    'Tool owners must never include the ReEditPro service/edit fee inside tool cost events.',
    'ReEditPro service/edit fee is calculated by the credit policy layer after billable tool cost is known.',
  ],
}
