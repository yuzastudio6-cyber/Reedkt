import type { HybridSearchCommandPlan } from './hybrid-search-consensus-types'

export function buildHybridSearchCommandPlan(): HybridSearchCommandPlan[] {
  return [
    {
      commandId: 'phase49m-static-report',
      phase: 'preflight',
      commandString: 'npm run activation:hybrid-search-consensus-e2e:report',
      requiresConfirmation: false,
      textOnlyByDefault: true,
      allowedInPhase49M: true,
      warnings: ['Static report only; no SearXNG query, Brave call, browser capture, extraction, or GCP mutation.'],
    },
    {
      commandId: 'phase49m-execute-hybrid-e2e',
      phase: 'execute',
      commandString: [
        'GCP_PROJECT_ID=reeditpro',
        'GCP_REGION=us-central1',
        'REEDITPRO_ENV=staging',
        'REEDITPRO_CONFIRM_SEARXNG_BRAVE_HYBRID_E2E=true',
        'BRAVE_SEARCH_ENABLED=true',
        'BRAVE_SEARCH_DAILY_LIMIT=1',
        'BRAVE_SEARCH_MONTHLY_BUDGET_USD=1',
        'BRAVE_SEARCH_MAX_RESULTS=5',
        'BRAVE_SEARCH_MAX_QUERIES_PER_RUN=1',
        'BRAVE_SEARCH_STORE_RAW_RESULTS=false',
        'BRAVE_SEARCH_STORE_SNIPPETS=false',
        'npm run activation:hybrid-search-consensus-e2e -- --execute',
      ].join(' '),
      requiresConfirmation: true,
      textOnlyByDefault: true,
      allowedInPhase49M: true,
      warnings: [
        'Executes exactly one private SearXNG query and one Brave Search web API call when secret, budget, and storage gates pass.',
        'Captures only allowlisted merged sources and uploads private artifacts.',
      ],
    },
    blocked('public-searxng-instance', 'Public SearXNG instances remain blocked; use only the private authenticated Cloud Run service.'),
    blocked('other-paid-provider-call', 'Tavily, Exa, Firecrawl, Browserless, Browserbase, and other paid providers remain blocked.'),
    blocked('raw-brave-response-storage', 'Raw Brave JSON, snippets, request headers, and key material must not be persisted.'),
    blocked('arbitrary-url-capture', 'Capture targets must come from merged allowlisted SearXNG/Brave results only.'),
    blocked('production-or-beta-unlock', 'Production, external beta, paid production, broad media, and final delivery remain blocked.'),
  ]
}

function blocked(commandId: string, blockedReason: string): HybridSearchCommandPlan {
  return {
    commandId,
    phase: 'validation',
    commandString: null,
    requiresConfirmation: false,
    textOnlyByDefault: true,
    allowedInPhase49M: false,
    warnings: [],
    blockedReason,
  }
}
