import type { BraveSearchCommandPlan } from './brave-search-fallback-types'

export function buildBraveSearchCommandPlan(): BraveSearchCommandPlan[] {
  return [
    {
      commandId: 'phase49j-static-report',
      description: 'Build the static Phase 49J Brave Search fallback policy report.',
      allowedInPhase49J: true,
      mutatesState: false,
      command: 'npm run activation:brave-search-fallback-policy:report',
    },
    {
      commandId: 'phase49j-provider-summary',
      description: 'Print the SearXNG default and Brave optional fallback policy summary.',
      allowedInPhase49J: true,
      mutatesState: false,
      command: 'npm run activation:brave-search-provider:summary',
    },
    blocked('brave-live-api-call', 'Phase 49J must not call Brave Search API.'),
    blocked('brave-api-key-secret-setup', 'Phase 49J must not create, set, read, print, or require a Brave API key.'),
    blocked('live-search', 'Phase 49J must not run live search through SearXNG, Brave, or any other provider.'),
    blocked('browser-capture', 'Phase 49J must not launch Playwright or capture screenshots.'),
    blocked('readability-extraction', 'Phase 49J must not run Readability extraction.'),
    blocked('docker-gcp-mutation', 'Phase 49J must not build Docker images, deploy Cloud Run, or mutate GCP.'),
    blocked('production-beta-unlock', 'Production, external beta, paid production, and broad media remain blocked.'),
  ]
}

function blocked(commandId: string, blockedReason: string): BraveSearchCommandPlan {
  return {
    commandId,
    description: blockedReason,
    allowedInPhase49J: false,
    mutatesState: false,
    command: null,
    blockedReason,
  }
}
