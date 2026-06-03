import type { BraveLiveCommandPlan } from './brave-live-api-types'

export function buildBraveLiveCommandPlan(): BraveLiveCommandPlan[] {
  return [
    {
      commandId: 'phase49l-static-report',
      phase: 'preflight',
      commandString: 'npm run activation:brave-live-api-validation:report',
      requiresConfirmation: false,
      textOnlyByDefault: false,
      allowedInPhase49L: true,
      warnings: ['Static report only; no Brave API call, GCP mutation, browser capture, extraction, or provider call.'],
    },
    {
      commandId: 'phase49l-iam-plan',
      phase: 'preflight',
      commandString: 'npm run activation:brave-live-api-validation:iam-plan',
      requiresConfirmation: false,
      textOnlyByDefault: false,
      allowedInPhase49L: true,
      warnings: ['Report-only IAM plan. Do not apply broad grants, storage admin, project secret access, or public principals.'],
    },
    {
      commandId: 'phase49l-live-validation-execution',
      phase: 'execute',
      commandString: [
        'GCP_PROJECT_ID=reeditpro',
        'GCP_REGION=us-central1',
        'REEDITPRO_ENV=staging',
        'REEDITPRO_CONFIRM_BRAVE_LIVE_API_VALIDATION=true',
        'BRAVE_SEARCH_ENABLED=true',
        'BRAVE_SEARCH_DAILY_LIMIT=1',
        'BRAVE_SEARCH_MONTHLY_BUDGET_USD=1',
        'BRAVE_SEARCH_MAX_RESULTS=5',
        'BRAVE_SEARCH_MAX_QUERIES_PER_RUN=1',
        'BRAVE_SEARCH_STORE_RAW_RESULTS=false',
        'BRAVE_SEARCH_STORE_SNIPPETS=false',
        'npm run activation:brave-live-api-validation -- --execute',
      ].join(' '),
      requiresConfirmation: true,
      textOnlyByDefault: false,
      allowedInPhase49L: true,
      warnings: [
        'Executes exactly one bounded Brave Search web API call if Secret Manager and budget gates pass.',
        'The Brave API key is resolved by the backend-only resolver and is not printed, stored, or included in artifacts.',
      ],
    },
    blocked('other-paid-provider-call', 'Phase 49L permits only the Brave Search web endpoint; Tavily, Exa, Firecrawl, Browserless, Browserbase, and other paid providers remain blocked.'),
    blocked('browser-capture', 'Phase 49L must not launch Playwright, capture screenshots, or process screenshots.'),
    blocked('readability-extraction', 'Phase 49L must not run Readability extraction.'),
    blocked('raw-brave-response-storage', 'Raw Brave JSON and snippets must not be persisted.'),
    blocked('docker-cloud-run-mutation', 'Phase 49L must not build Docker images, deploy Cloud Run, or mutate Cloud Run.'),
    blocked('production-beta-unlock', 'Production, external beta, paid production, and broad media remain blocked.'),
  ]
}

function blocked(commandId: string, blockedReason: string): BraveLiveCommandPlan {
  return {
    commandId,
    phase: 'validation',
    commandString: null,
    requiresConfirmation: false,
    textOnlyByDefault: true,
    allowedInPhase49L: false,
    warnings: [],
    blockedReason,
  }
}
