import type { SearchProviderReadinessCommandPlan } from './search-provider-readiness-types'

export function buildSearchProviderReadinessCommandPlan(): SearchProviderReadinessCommandPlan[] {
  return [
    {
      commandId: 'phase49n_static_report',
      description: 'Build the static Phase 49N readiness report without GCP mutation or provider calls.',
      allowedInPhase49N: true,
      requiresConfirmation: false,
      mutatesState: false,
      command: 'npm run activation:search-provider-readiness:report',
    },
    {
      commandId: 'phase49n_execute_metadata_audit',
      description: 'Run the evidence-only readiness audit and upload private JSON artifacts.',
      allowedInPhase49N: true,
      requiresConfirmation: true,
      mutatesState: true,
      command: 'GCP_PROJECT_ID=reeditpro GCP_REGION=us-central1 REEDITPRO_ENV=staging REEDITPRO_CONFIRM_SEARCH_PROVIDER_READINESS_GATE=true npm run activation:search-provider-readiness -- --execute',
    },
    {
      commandId: 'new_live_search',
      description: 'Run a new search query.',
      allowedInPhase49N: false,
      requiresConfirmation: false,
      mutatesState: false,
      command: null,
      blockedReason: 'Phase 49N is evidence-only and must not run a new SearXNG or Brave query.',
    },
    {
      commandId: 'browser_capture_or_extraction',
      description: 'Launch Playwright, run Sharp processing, or run Readability extraction.',
      allowedInPhase49N: false,
      requiresConfirmation: false,
      mutatesState: false,
      command: null,
      blockedReason: 'Phase 49N only audits prior evidence; capture and extraction remain blocked.',
    },
    {
      commandId: 'provider_expansion',
      description: 'Enable Tavily, Exa, Firecrawl, Browserless, Browserbase, or public SearXNG fallback.',
      allowedInPhase49N: false,
      requiresConfirmation: false,
      mutatesState: false,
      command: null,
      blockedReason: 'Paid provider expansion and public SearXNG require later explicit approval.',
    },
  ]
}
