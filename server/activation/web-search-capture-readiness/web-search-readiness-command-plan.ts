import type { WebSearchReadinessCommandPlan } from './web-search-capture-readiness-types'

export function buildWebSearchReadinessCommandPlan(): WebSearchReadinessCommandPlan[] {
  return [
    {
      commandId: 'phase49h-static-report',
      description: 'Build the static Phase 49H readiness report without GCP mutation.',
      allowedInPhase49H: true,
      requiresConfirmation: false,
      mutatesState: false,
      command: 'npm run activation:web-search-capture-readiness:report',
    },
    {
      commandId: 'phase49h-iam-plan',
      description: 'Print report-only IAM guidance for private evidence verification and Phase 49H uploads.',
      allowedInPhase49H: true,
      requiresConfirmation: false,
      mutatesState: false,
      command: 'npm run activation:web-search-capture-readiness:iam-plan',
    },
    {
      commandId: 'phase49h-execute-readiness-audit',
      description: 'Verify existing private evidence and Cloud Run service metadata, then upload private JSON reports.',
      allowedInPhase49H: true,
      requiresConfirmation: true,
      mutatesState: true,
      command: 'GCP_PROJECT_ID=reeditpro GCP_REGION=us-central1 REEDITPRO_ENV=staging REEDITPRO_CONFIRM_WEB_SEARCH_CAPTURE_INTERNAL_READINESS=true npm run activation:web-search-capture-readiness -- --execute',
    },
    blocked('live-search-query', 'Phase 49H must not run a new private or public search query.'),
    blocked('browser-capture', 'Phase 49H must not launch Playwright or capture screenshots.'),
    blocked('readability-extraction', 'Phase 49H must not run Mozilla Readability extraction.'),
    blocked('paid-provider-call', 'Paid providers remain disabled and require future approval.'),
    blocked('public-searxng-instance', 'Public SearXNG instances remain blocked.'),
    blocked('docker-build-push', 'Phase 49H must not build or push Docker images.'),
    blocked('cloud-run-deploy', 'Phase 49H must not deploy or update Cloud Run services.'),
    blocked('production-beta-unlock', 'Production, external beta, paid production, and broad media remain blocked.'),
  ]
}

function blocked(commandId: string, blockedReason: string): WebSearchReadinessCommandPlan {
  return {
    commandId,
    description: blockedReason,
    allowedInPhase49H: false,
    requiresConfirmation: false,
    mutatesState: false,
    command: null,
    blockedReason,
  }
}
