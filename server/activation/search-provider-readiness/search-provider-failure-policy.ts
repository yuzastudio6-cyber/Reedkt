import type { SearchProviderFailurePolicy } from './search-provider-readiness-types'

export function buildSearchProviderFailurePolicy(): SearchProviderFailurePolicy {
  return {
    failClosed: true,
    noFallbackToPublicSearxng: true,
    noAutomaticBraveFallback: true,
    noFallbackToOtherPaidProviders: true,
    noFallbackToArbitraryCapture: true,
    noSignedUrlSourceOfTruth: true,
    failureModes: [
      {
        failureId: 'private_searxng_unavailable',
        behavior: 'block_readiness',
        summary: 'Do not fall back to public SearXNG; block readiness or use explicit future fixture/degraded mode only.',
      },
      {
        failureId: 'brave_secret_or_budget_missing',
        behavior: 'continue_searxng_only_with_warning',
        summary: 'Brave remains disabled; SearXNG default can continue only where workflow policy allows it.',
      },
      {
        failureId: 'no_allowlisted_capture_target',
        behavior: 'defer_to_future_phase',
        summary: 'Do not capture arbitrary URLs; block capture scope until allowlisted evidence exists.',
      },
      {
        failureId: 'storage_rights_block_raw_or_snippet',
        behavior: 'continue_searxng_only_with_warning',
        summary: 'Persist only allowed normalized metadata and never raw Brave payloads or snippets.',
      },
      {
        failureId: 'paid_provider_expansion_requested',
        behavior: 'block_readiness',
        summary: 'Tavily, Exa, Firecrawl, Browserless, Browserbase, and other paid providers require later explicit approval.',
      },
    ],
  }
}
