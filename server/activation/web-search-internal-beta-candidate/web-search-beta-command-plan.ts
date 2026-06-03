import type { WebSearchInternalBetaCommandPlan } from './web-search-internal-beta-types'

export function buildWebSearchInternalBetaCommandPlan(): WebSearchInternalBetaCommandPlan[] {
  return [
    {
      commandId: 'phase49p_static_report',
      description: 'Build the static Phase 49P internal beta candidate report.',
      allowedInPhase49P: true,
      requiresConfirmation: false,
      mutatesState: false,
      command: 'npm run activation:web-search-internal-beta-candidate:report',
    },
    {
      commandId: 'phase49p_execute_evidence_audit',
      description: 'Run metadata-only evidence audit and upload private Phase 49P JSON artifacts.',
      allowedInPhase49P: true,
      requiresConfirmation: true,
      mutatesState: true,
      command: 'GCP_PROJECT_ID=reeditpro GCP_REGION=us-central1 REEDITPRO_ENV=staging REEDITPRO_CONFIRM_WEB_SEARCH_INTERNAL_BETA_CANDIDATE=true npm run activation:web-search-internal-beta-candidate -- --execute',
    },
    {
      commandId: 'live_search_or_brave_call',
      description: 'Run a new SearXNG query or Brave API call.',
      allowedInPhase49P: false,
      requiresConfirmation: false,
      mutatesState: false,
      command: null,
      blockedReason: 'Phase 49P is readiness closure only and consumes existing evidence.',
    },
    {
      commandId: 'browser_capture_processing_or_extraction',
      description: 'Launch Playwright, process screenshots with Sharp, or run Readability extraction.',
      allowedInPhase49P: false,
      requiresConfirmation: false,
      mutatesState: false,
      command: null,
      blockedReason: 'No new capture, screenshot processing, or extraction is allowed in Phase 49P.',
    },
    {
      commandId: 'deployment_or_provider_expansion',
      description: 'Deploy Cloud Run, build Docker, enable public SearXNG, or enable other paid providers.',
      allowedInPhase49P: false,
      requiresConfirmation: false,
      mutatesState: false,
      command: null,
      blockedReason: 'Deployment, provider expansion, public SearXNG, production, and external beta remain blocked.',
    },
  ]
}
