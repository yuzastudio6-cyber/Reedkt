import type { WebSearchUiApiCommandPlan } from './web-search-ui-api-gating-types'

export function buildWebSearchUiApiCommandPlan(): WebSearchUiApiCommandPlan[] {
  return [
    {
      commandId: 'phase49i-static-report',
      description: 'Build the static Phase 49I UI/API gating report.',
      allowedInPhase49I: true,
      requiresConfirmation: false,
      mutatesState: false,
      command: 'npm run activation:web-search-ui-api-gating:report',
    },
    {
      commandId: 'phase49i-iam-plan',
      description: 'Print report-only IAM guidance for private Phase 49I artifact uploads.',
      allowedInPhase49I: true,
      requiresConfirmation: false,
      mutatesState: false,
      command: 'npm run activation:web-search-ui-api-gating:iam-plan',
    },
    {
      commandId: 'phase49i-execute-ui-api-gate',
      description: 'Verify Phase 49H evidence, route gates, validators, UX state, docs, and upload private JSON reports.',
      allowedInPhase49I: true,
      requiresConfirmation: true,
      mutatesState: true,
      command: 'GCP_PROJECT_ID=reeditpro GCP_REGION=us-central1 REEDITPRO_ENV=staging REEDITPRO_CONFIRM_WEB_SEARCH_UI_API_GATING=true npm run activation:web-search-ui-api-gating -- --execute',
    },
    blocked('live-search-query', 'Phase 49I must not issue a private or public live search query.'),
    blocked('browser-capture', 'Phase 49I must not launch Playwright or capture screenshots.'),
    blocked('sharp-processing', 'Phase 49I must not process screenshots with Sharp.'),
    blocked('readability-extraction', 'Phase 49I must not run Mozilla Readability extraction.'),
    blocked('paid-provider-call', 'Paid providers remain disabled and require future approval.'),
    blocked('public-searxng-instance', 'Public SearXNG instances remain blocked.'),
    blocked('arbitrary-url-capture', 'Arbitrary URL capture remains blocked.'),
    blocked('docker-build-push', 'Phase 49I must not build or push Docker images.'),
    blocked('cloud-run-deploy', 'Phase 49I must not deploy or update Cloud Run services.'),
    blocked('production-beta-unlock', 'Production, external beta, paid production, and broad media remain blocked.'),
  ]
}

function blocked(commandId: string, blockedReason: string): WebSearchUiApiCommandPlan {
  return {
    commandId,
    description: blockedReason,
    allowedInPhase49I: false,
    requiresConfirmation: false,
    mutatesState: false,
    command: null,
    blockedReason,
  }
}
