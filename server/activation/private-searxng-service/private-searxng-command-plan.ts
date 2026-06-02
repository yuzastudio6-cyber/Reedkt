import { privateSearxngServiceConfig } from './private-searxng-service-policy'
import type { PrivateSearxngCommandPlanEntry } from './private-searxng-service-types'

export function buildPrivateSearxngCommandPlan(): PrivateSearxngCommandPlanEntry[] {
  return [
    {
      commandId: 'phase49f-execute-private-searxng-service-validation',
      description: 'Build/push/deploy the private authenticated SearXNG service and run one bounded controlled query.',
      allowedInPhase49F: true,
      requiresConfirmation: true,
      mutatesGcp: true,
      executableCommand: `GCP_PROJECT_ID=${privateSearxngServiceConfig.projectId} GCP_REGION=${privateSearxngServiceConfig.region} REEDITPRO_ENV=${privateSearxngServiceConfig.env} REEDITPRO_CONFIRM_PRIVATE_SEARXNG_SERVICE_VALIDATION=true npm run activation:private-searxng-service -- --execute`,
    },
    blocked('blocked-public-searxng-instance', 'Public SearXNG instances remain blocked; do not use searx.space or public instances.'),
    blocked('blocked-paid-search-provider', 'Brave, Tavily, Exa, Firecrawl, Browserless, and Browserbase remain disabled.'),
    blocked('blocked-browser-capture', 'Playwright browser capture is out of scope for Phase 49F.'),
    blocked('blocked-readability-extraction', 'Readability extraction is out of scope for Phase 49F.'),
    blocked('blocked-production-beta', 'Production, external beta, paid production, and broad media remain blocked.'),
  ]
}

function blocked(commandId: string, blockedReason: string): PrivateSearxngCommandPlanEntry {
  return { commandId, description: blockedReason, allowedInPhase49F: false, requiresConfirmation: false, mutatesGcp: false, blockedReason }
}
