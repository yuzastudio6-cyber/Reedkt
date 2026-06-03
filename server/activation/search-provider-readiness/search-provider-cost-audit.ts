import type { SearchProviderCostAudit } from './search-provider-readiness-types'

export function buildSearchProviderCostAudit(): SearchProviderCostAudit {
  return {
    braveEnabledByDefault: false,
    defaultDailyLimit: 0,
    defaultMonthlyBudgetUsd: 0,
    futureMaxResults: 5,
    futureMaxQueriesPerRun: 1,
    unboundedUsageAllowed: false,
    blockers: [],
    warnings: ['Brave has zero default budget and requires explicit future env gates before paid execution.'],
  }
}
