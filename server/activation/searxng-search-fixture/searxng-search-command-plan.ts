import type { SearxngSearchFixtureCommandPlan } from './searxng-search-fixture-types'

export function buildSearxngSearchFixtureCommandPlan(): SearxngSearchFixtureCommandPlan[] {
  return [
    {
      commandId: 'phase49b-static-report',
      phase: 'preflight',
      commandString: 'npm run activation:searxng-search-fixture:report',
      requiresConfirmation: false,
      textOnlyByDefault: false,
      warnings: ['Static report only; no search, browser capture, provider, or GCP mutation.'],
    },
    {
      commandId: 'phase49b-iam-plan',
      phase: 'preflight',
      commandString: 'npm run activation:searxng-search-fixture:iam-plan',
      requiresConfirmation: false,
      textOnlyByDefault: false,
      warnings: ['Report-only IAM plan. Do not apply broad bucket grants or public principals.'],
    },
    {
      commandId: 'phase49b-generated-fixture-execution',
      phase: 'execute',
      commandString: 'GCP_PROJECT_ID=reeditpro GCP_REGION=us-central1 REEDITPRO_ENV=staging REEDITPRO_CONFIRM_SEARXNG_SEARCH_FIXTURE=true npm run activation:searxng-search-fixture -- --execute',
      requiresConfirmation: true,
      textOnlyByDefault: false,
      warnings: [
        'Executes generated fixture data only.',
        'Does not call SearXNG, public search instances, paid providers, Playwright, Sharp, or Readability.',
      ],
    },
    {
      commandId: 'phase49b-post-validation',
      phase: 'validation',
      commandString: 'npm run smoke:activation-searxng-search-fixture && npm run activation:searxng-search-fixture:report && git diff --check',
      requiresConfirmation: false,
      textOnlyByDefault: false,
      warnings: ['Validation must not execute live search or browser capture.'],
    },
  ]
}
