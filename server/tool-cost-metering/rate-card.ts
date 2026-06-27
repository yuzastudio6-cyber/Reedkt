import { CREDIT_RETAIL_VALUE_CENTS, REEDITPRO_EDIT_LEVELS } from '../../src/types/credit-policy'
import type {
  CanonicalToolCostRateCard,
  ToolCostMeteringRateCardEntry,
  ToolOwnerCostEventPolicy,
  ToolRuntimeComputeLevel,
} from './types'

export const TOOL_COST_RATE_CARD_VERSION = 'rp-ratecard-01-mock-safe' as const
export const COST_MICROS_PER_CENT = 10_000 as const

export const TOOL_RUNTIME_COMPUTE_LEVELS = [
  'economy',
  'standard',
  'premium',
] as const satisfies readonly ToolRuntimeComputeLevel[]

export const TOOL_COST_RATE_CARD: CanonicalToolCostRateCard = {
  rateCardVersion: TOOL_COST_RATE_CARD_VERSION,
  creditValueCents: CREDIT_RETAIL_VALUE_CENTS,
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
    perInputTokenMicros: 2,
    perOutputTokenMicros: 8,
    perInputVideoSecondMicros: 800,
    perOutputVideoSecondMicros: 1_200,
    perInputAudioSecondMicros: 250,
    perOutputAudioSecondMicros: 350,
    perImageMicros: 3_000,
  },
  runtime: {
    perRenderSecondMicros: 500,
    perVcpuSecondMicros: 140,
    perMemoryGibSecondMicros: 40,
    perGpuSecondMicros: 1_700,
    perTempStorageGibHourMicros: 60,
    perOutputStorageGibHourMicros: 90,
    perNetworkEgressMibMicros: 45,
  },
  deterministicRenderer: {
    flatRequestMicros: 4_000,
    perOutputSecondMicros: 650,
    perMegapixelFrameMicros: 120,
  },
  humanManual: {
    supported: false,
    hourlyRateMicros: null,
    notes: [
      'Human/manual cost is intentionally not priced in RP-RATECARD-01.',
      'A future owner-approved policy must define manual review pricing before it can be billed.',
    ],
  },
  notes: [
    'Mock-safe placeholder rate card; no live provider billing, wallet mutation, reservation mutation, ledger write, render/export execution, or production persistence.',
    'Tool/runtime compute levels economy/standard/premium are separate from product Edit Levels normal/premium/ultra_premium.',
    'Tool cost events report actual internal tool/provider/runtime cost only; ReEditPro service fee is added later by credit policy settlement math.',
  ],
}

export const TOOL_COST_METERING_POLICY_NOTE =
  'Tool/runtime compute levels economy/standard/premium are not product Edit Levels normal/premium/ultra_premium.'

export const TOOL_COST_METERING_RATE_CARD: readonly ToolCostMeteringRateCardEntry[] =
  TOOL_RUNTIME_COMPUTE_LEVELS.map((computeLevel) => ({
    computeLevel,
    creditValueCents: CREDIT_RETAIL_VALUE_CENTS,
    serviceFeeIncluded: false,
    productEditLevelsAreSeparate: true,
    supportedProductEditLevels: REEDITPRO_EDIT_LEVELS,
    notes: [
      TOOL_COST_METERING_POLICY_NOTE,
      'Policy-only mock rate card; no wallet mutation, provider call, render/export charge, or production settlement.',
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
