import type { SearchProviderRouterModePolicy } from './brave-search-fallback-types'

export function buildSearchProviderRouterPolicy(): SearchProviderRouterModePolicy[] {
  return [
    {
      mode: 'searxng_only',
      defaultMode: true,
      allowedInPhase49J: true,
      braveExecutionAllowed: false,
      summary: 'Default mode. SearXNG remains the only enabled provider path.',
      requirements: ['SEARCH_PROVIDER_MODE=searxng_only', 'BRAVE_SEARCH_ENABLED=false'],
    },
    {
      mode: 'searxng_with_brave_fallback',
      defaultMode: false,
      allowedInPhase49J: false,
      braveExecutionAllowed: false,
      summary: 'Future fallback mode. SearXNG runs first; Brave may be considered only when confidence is low and all policy gates pass.',
      requirements: ['Admin enablement', 'Backend secret', 'Budget approval', 'Storage-rights policy', 'Explicit future execution confirmation'],
    },
    {
      mode: 'hybrid_consensus',
      defaultMode: false,
      allowedInPhase49J: false,
      braveExecutionAllowed: false,
      summary: 'Future consensus mode for SearXNG plus Brave comparison/dedupe/ranking.',
      requirements: ['Phase 49L live validation', 'Consensus QA', 'Private artifacts only'],
    },
    {
      mode: 'brave_only_diagnostic',
      defaultMode: false,
      allowedInPhase49J: false,
      braveExecutionAllowed: false,
      summary: 'Future admin diagnostic mode only; never the product default.',
      requirements: ['Admin-only policy', 'Secret-backed runtime', 'Budget controls', 'No frontend exposure'],
    },
  ]
}
