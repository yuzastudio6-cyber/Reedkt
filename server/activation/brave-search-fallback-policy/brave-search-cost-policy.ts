import type { BraveSearchCostPolicy } from './brave-search-fallback-types'

export function buildBraveSearchCostPolicy(): BraveSearchCostPolicy {
  return {
    braveSearchEnabledDefault: false,
    dailyLimitDefault: 0,
    monthlyBudgetUsdDefault: 0,
    maxResults: 5,
    maxQueriesPerRun: 1,
    timeoutMs: 8000,
    storeRawResultsDefault: false,
    unboundedRetriesAllowed: false,
    automaticPaidProviderFallbackAllowed: false,
    costRecordingRequiredInFutureQa: true,
    blockers: [
      'No Brave call is allowed when daily or monthly budget is zero.',
      'No Brave call is allowed when the backend secret is missing.',
      'No Brave call is allowed outside a future explicitly confirmed provider execution phase.',
      'No automatic fallback to any other paid provider is allowed.',
    ],
  }
}
