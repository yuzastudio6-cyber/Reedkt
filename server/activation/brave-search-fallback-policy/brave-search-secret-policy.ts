import type { BraveSearchSecretPolicy } from './brave-search-fallback-types'

export function buildBraveSearchSecretPolicy(): BraveSearchSecretPolicy {
  return {
    secretName: 'BRAVE_SEARCH_API_KEY',
    frontendExposureAllowed: false,
    loggingAllowed: false,
    docsValueAllowed: false,
    gitValueAllowed: false,
    serverSideOnly: true,
    secretManagerIntegration: 'future_scoped',
    missingSecretBehavior: 'provider_disabled_default_searxng_unblocked',
    blockers: [
      'No real Brave API key is added, read, printed, or required in Phase 49J.',
      'Frontend code must never receive Brave provider secrets.',
      'Future Secret Manager integration requires a separate explicit provider-runtime phase.',
    ],
  }
}
