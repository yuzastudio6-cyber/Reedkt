import {
  TOOL_COST_RATE_CARD,
  TOOL_COST_RATE_CARD_VERSION,
  TOOL_OWNER_COST_EVENT_POLICY,
} from '../../tool-cost-metering'

export interface MotionStudioExistingCostCompatibility {
  existingRateCardVersion: string
  internalToolCostOnly: true
  serviceFeeIncluded: false
  customerPricingImplemented: false
  customerCreditsConverted: false
  walletMutationAllowed: false
  settlementAllowed: false
  rateCardIsMockSafe: true
  notes: string[]
}

export function inspectMotionStudioExistingCostCompatibility(): MotionStudioExistingCostCompatibility {
  return {
    existingRateCardVersion: TOOL_COST_RATE_CARD_VERSION,
    internalToolCostOnly: TOOL_OWNER_COST_EVENT_POLICY.ownerReportsActualInternalToolCostOnly,
    serviceFeeIncluded: TOOL_COST_RATE_CARD.serviceFeeIncluded,
    customerPricingImplemented: false,
    customerCreditsConverted: false,
    walletMutationAllowed: false,
    settlementAllowed: false,
    rateCardIsMockSafe: true,
    notes: [
      'MS-001 defines provider-neutral future contracts and does not alter the existing mock-safe rate card.',
      'Provider and tool adapters emit internal usage only; commercial pricing remains a separate future layer.',
    ],
  }
}
