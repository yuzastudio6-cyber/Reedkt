import { searchProviderReadinessConfig } from './search-provider-readiness-policy'
import type { SearchProviderRegistryAudit } from './search-provider-readiness-types'

export function buildSearchProviderRegistryAudit(input: { searxngInternalReady?: boolean } = {}): SearchProviderRegistryAudit {
  return {
    defaultProvider: 'searxng',
    searxng: {
      defaultProvider: true,
      freeOpenSource: true,
      internalTestingAllowed: Boolean(input.searxngInternalReady),
      privateServiceRequired: true,
      serviceName: searchProviderReadinessConfig.serviceName,
    },
    braveSearch: {
      optionalFallback: true,
      paidProvider: true,
      enabledByDefault: false,
      requiresSecret: true,
      requiresBudget: true,
      rawStorageAllowed: false,
      snippetStorageAllowed: false,
    },
    disabledPaidProviders: ['tavily', 'exa', 'firecrawl', 'browserless', 'browserbase'].map((providerId) => ({
      providerId,
      enabled: false,
      futureOptional: true,
      requiredForInternalTesting: false,
    })),
    blockers: [],
    warnings: ['Provider registry audit is readiness-only; Phase 49N does not enable any provider execution path.'],
  }
}
