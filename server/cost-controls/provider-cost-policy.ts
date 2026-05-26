import type { ProviderCostPolicy } from './cost-control-types'

export const providerCostPolicy: ProviderCostPolicy = {
  providersBlockedByDefault: true,
  providerCallBudgetsUsd: {
    draft: 0,
    internal: 0,
    production: 0,
  },
  killSwitchEnabled: true,
  approvedProviders: [],
}

export function providerCallsAllowed(policy: ProviderCostPolicy = providerCostPolicy): false {
  void policy
  return false
}
