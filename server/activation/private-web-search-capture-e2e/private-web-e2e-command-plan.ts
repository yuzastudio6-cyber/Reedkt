import type { PrivateWebE2ECommandPlan } from './private-web-search-capture-e2e-types'

export function buildPrivateWebE2ECommandPlan(): PrivateWebE2ECommandPlan[] {
  return [
    {
      commandId: 'phase49e-report',
      phase: 'preflight',
      commandString: 'npm run activation:private-web-search-capture-e2e:report',
      requiresConfirmation: false,
      allowedInPhase49E: true,
    },
    {
      commandId: 'phase49e-iam-plan',
      phase: 'preflight',
      commandString: 'npm run activation:private-web-search-capture-e2e:iam-plan',
      requiresConfirmation: false,
      allowedInPhase49E: true,
    },
    {
      commandId: 'phase49e-execute-controlled-private-fixture-e2e',
      phase: 'execute',
      commandString: 'GCP_PROJECT_ID=reeditpro GCP_REGION=us-central1 REEDITPRO_ENV=staging REEDITPRO_CONFIRM_PRIVATE_WEB_SEARCH_CAPTURE_E2E=true LIVE_PUBLIC_SEARCH_ALLOWED=false PUBLIC_WEB_CAPTURE_ALLOWED=false ARBITRARY_URL_CAPTURE_ALLOWED=false PAID_PROVIDERS_ALLOWED=false PUBLIC_ACCESS_ENABLED=false npm run activation:private-web-search-capture-e2e -- --execute',
      requiresConfirmation: true,
      allowedInPhase49E: true,
    },
    {
      commandId: 'blocked-live-public-search',
      phase: 'execute',
      commandString: 'BLOCKED: public SearXNG or public web search request',
      requiresConfirmation: false,
      allowedInPhase49E: false,
      blockedReason: 'Phase 49E allows only private fixture provider or validated private endpoint; live public search is blocked.',
    },
    {
      commandId: 'phase49e-validation',
      phase: 'validation',
      commandString: 'npm run smoke:activation-private-web-search-capture-e2e && npm run activation:private-web-search-capture-e2e:report && npm run lint && npm run build && npm run build:server && git diff --check',
      requiresConfirmation: false,
      allowedInPhase49E: true,
    },
  ]
}
