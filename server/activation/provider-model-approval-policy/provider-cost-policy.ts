import type { ProviderCostPolicy } from './provider-model-approval-types'

export function buildProviderCostPolicy(): ProviderCostPolicy {
  return {
    policyId: 'provider1_cost_policy',
    provider1BudgetUsd: 0,
    providerCallsBlockedByDefault: true,
    liveValidationDefaults: {
      maxCallsPerPhase: 1,
      retryLimit: 0,
      timeoutMs: 60000,
      automaticFallbackAllowed: false,
      productionPaidCallsAllowed: false,
      sanitizedSummaryStorageOnly: true,
      officialPricingRecheckRequired: true,
    },
    futureControls: [
      'per-call token budget',
      'per-run token budget',
      'daily spend cap',
      'provider timeout',
      'retry limit',
      'max live calls per validation phase',
      'no automatic provider fallback without policy',
      'no production paid calls',
      'current official pricing recheck before nonzero spend cap',
      'cost estimate attached to an approved plan snapshot before any future user-affecting call',
    ],
  }
}
