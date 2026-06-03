import type { BraveSearchProviderEvidence } from './brave-search-fallback-types'

export function buildBraveSearchProviderEvidence(): BraveSearchProviderEvidence {
  return {
    providerId: 'brave_search',
    providerType: 'optional_paid_search_provider',
    role: 'fallback_confidence_booster',
    defaultEnabled: false,
    requiresSecret: true,
    secretName: 'BRAVE_SEARCH_API_KEY',
    apiAuthHeader: 'X-Subscription-Token',
    endpoint: 'https://api.search.brave.com/res/v1/web/search',
    pricingKnown: true,
    searchPlanPrice: '$5 per 1,000 requests',
    freeCreditsKnown: true,
    freeCreditsSummary: '$5 in free monthly credits',
    storageRightsRequiredForRawPersistence: true,
    providerAllowedInPhase49J: false,
    liveApiCallAllowedInPhase49J: false,
    rawResponseStorageAllowedByDefault: false,
    sourceUrls: [
      'https://brave.com/search/api/',
      'https://api-dashboard.search.brave.com/documentation/pricing',
      'https://api-dashboard.search.brave.com/documentation/resources/terms-of-service',
    ],
    notes: [
      'SearXNG remains the free/open-source default provider.',
      'Brave Search API is an optional paid fallback/confidence booster candidate only.',
      'A real API key must be stored only in backend secrets/config, never frontend code or git.',
      'Raw Brave API responses must not be persisted unless the selected plan or terms explicitly grant storage rights.',
      'Third-party webpage content rights remain governed by page publisher terms and ReeditPro capture policy, not Brave result rights.',
    ],
  }
}
