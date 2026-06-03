import { searchProviderReadinessSafetyFlags } from './search-provider-readiness-policy'
import type { SearchProviderScopeManifest } from './search-provider-readiness-types'

export function buildSearchProviderScopeManifest(input: {
  runId: string
  searxngInternalReady: boolean
  braveOptionalFallbackReady: boolean
  hybridConsensusReady: boolean
  ready: boolean
}): SearchProviderScopeManifest {
  return {
    runId: input.runId,
    phase: '49N',
    scope: 'search_provider_controlled_internal_testing_readiness',
    defaultProvider: 'searxng',
    optionalProviders: ['brave_search'],
    disabledProviders: ['tavily', 'exa', 'firecrawl', 'browserless', 'browserbase', 'public_searxng'],
    allowedModes: ['searxng_only', 'searxng_with_brave_fallback', 'hybrid_consensus', 'brave_only_diagnostic'],
    blockedModes: ['public_searxng', 'arbitrary_url_capture', 'broad_crawling', 'paid_provider_expansion'],
    secretPolicy: 'Brave key must remain backend-only in Secret Manager or backend env; Phase 49N never reads the secret value.',
    costPolicy: 'Brave is disabled by default and requires explicit budget gates in future execution phases.',
    storagePolicy: 'Raw Brave response, snippets, headers, key material, public artifacts, and signed URL source-of-truth are blocked.',
    capturePolicy: 'Capture/extraction remain allowlisted and policy-paired only; Phase 49N runs no capture or extraction.',
    readinessDecision: input.ready ? 'ready_for_controlled_internal_testing' : 'blocked',
    searxngInternalReady: input.searxngInternalReady,
    braveOptionalFallbackReady: input.braveOptionalFallbackReady,
    hybridConsensusReady: input.hybridConsensusReady,
    safetyFlags: searchProviderReadinessSafetyFlags,
  }
}
