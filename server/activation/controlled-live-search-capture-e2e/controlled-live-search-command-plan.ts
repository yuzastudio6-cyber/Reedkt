import { controlledLiveSearchConfig } from './controlled-live-search-capture-policy'

export interface ControlledLiveSearchCommandPlanEntry {
  commandId: string
  description: string
  allowedInPhase49G: boolean
  requiresConfirmation: boolean
  mutatesGcp: boolean
  executableCommand?: string
  blockedReason?: string
}

export function buildControlledLiveSearchCommandPlan(): ControlledLiveSearchCommandPlanEntry[] {
  return [
    {
      commandId: 'phase49g-static-report',
      description: 'Build the static Phase 49G controlled private live-search/capture E2E report.',
      allowedInPhase49G: true,
      requiresConfirmation: false,
      mutatesGcp: false,
      executableCommand: 'npm run activation:controlled-live-search-capture-e2e:report',
    },
    {
      commandId: 'phase49g-iam-plan',
      description: 'Print the report-only IAM plan for Phase 49G private artifact uploads and authenticated service invocation.',
      allowedInPhase49G: true,
      requiresConfirmation: false,
      mutatesGcp: false,
      executableCommand: 'npm run activation:controlled-live-search-capture-e2e:iam-plan',
    },
    {
      commandId: 'phase49g-execute-controlled-private-live-search-capture-e2e',
      description: 'Invoke the private authenticated SearXNG service, capture at most two allowlisted results, run Sharp and Readability, and upload private artifacts.',
      allowedInPhase49G: true,
      requiresConfirmation: true,
      mutatesGcp: true,
      executableCommand: 'GCP_PROJECT_ID=reeditpro GCP_REGION=us-central1 REEDITPRO_ENV=staging REEDITPRO_CONFIRM_CONTROLLED_PRIVATE_LIVE_SEARCH_CAPTURE_E2E=true npm run activation:controlled-live-search-capture-e2e -- --execute',
    },
    {
      commandId: 'blocked-public-searxng-instance',
      description: 'Use a public SearXNG instance instead of the ReeditPro private Cloud Run service.',
      allowedInPhase49G: false,
      requiresConfirmation: false,
      mutatesGcp: false,
      blockedReason: 'Public SearXNG instances remain blocked in Phase 49G.',
    },
    {
      commandId: 'blocked-paid-search-provider',
      description: 'Call Brave, Tavily, Exa, Firecrawl, Browserless, Browserbase, or any paid provider.',
      allowedInPhase49G: false,
      requiresConfirmation: false,
      mutatesGcp: false,
      blockedReason: 'Paid providers remain disabled and are not required for internal testing.',
    },
    {
      commandId: 'blocked-arbitrary-url-capture',
      description: 'Capture user-provided or non-allowlisted URLs.',
      allowedInPhase49G: false,
      requiresConfirmation: false,
      mutatesGcp: false,
      blockedReason: `Phase 49G only captures up to ${controlledLiveSearchConfig.maxCapturePages} search-result URLs from ${controlledLiveSearchConfig.allowedDomains.join(', ')}.`,
    },
    {
      commandId: 'blocked-production-beta-unlock',
      description: 'Unlock production, external beta, paid production, or broad media.',
      allowedInPhase49G: false,
      requiresConfirmation: false,
      mutatesGcp: false,
      blockedReason: 'Phase 49G is a private internal readiness precursor only.',
    },
  ]
}
