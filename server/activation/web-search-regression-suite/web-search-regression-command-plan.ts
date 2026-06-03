import type { WebSearchRegressionCommandPlan } from './web-search-regression-types'

export function buildWebSearchRegressionCommandPlan(): WebSearchRegressionCommandPlan[] {
  return [
    {
      commandId: 'phase49o_static_report',
      description: 'Build the static Phase 49O regression/failure-mode report.',
      allowedInPhase49O: true,
      requiresConfirmation: false,
      mutatesState: false,
      command: 'npm run activation:web-search-regression-suite:report',
    },
    {
      commandId: 'phase49o_iam_plan',
      description: 'Print report-only prefix-scoped IAM plan.',
      allowedInPhase49O: true,
      requiresConfirmation: false,
      mutatesState: false,
      command: 'npm run activation:web-search-regression-suite:iam-plan',
    },
    {
      commandId: 'phase49o_execute_regression_suite',
      description: 'Run deterministic regression scenarios, verify Phase 49N evidence, and upload private JSON artifacts.',
      allowedInPhase49O: true,
      requiresConfirmation: true,
      mutatesState: true,
      command: 'GCP_PROJECT_ID=reeditpro GCP_REGION=us-central1 REEDITPRO_ENV=staging REEDITPRO_CONFIRM_WEB_SEARCH_REGRESSION_FAILURE_SUITE=true npm run activation:web-search-regression-suite -- --execute',
    },
    {
      commandId: 'phase49o_live_provider_probe',
      description: 'Run live search, Brave API, public SearXNG, browser capture, Sharp, or Readability work.',
      allowedInPhase49O: false,
      requiresConfirmation: false,
      mutatesState: true,
      command: null,
      blockedReason: 'Phase 49O is deterministic regression/failure-mode validation only.',
    },
  ]
}
