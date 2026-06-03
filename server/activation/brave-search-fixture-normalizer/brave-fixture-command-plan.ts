import type { BraveFixtureCommandPlan } from './brave-search-fixture-types'

export function buildBraveFixtureCommandPlan(): BraveFixtureCommandPlan[] {
  return [
    {
      commandId: 'phase49k-static-report',
      phase: 'preflight',
      commandString: 'npm run activation:brave-search-fixture-normalizer:report',
      requiresConfirmation: false,
      textOnlyByDefault: false,
      allowedInPhase49K: true,
      warnings: ['Static report only; no Brave API, live search, browser capture, extraction, or GCP mutation.'],
    },
    {
      commandId: 'phase49k-iam-plan',
      phase: 'preflight',
      commandString: 'npm run activation:brave-search-fixture-normalizer:iam-plan',
      requiresConfirmation: false,
      textOnlyByDefault: false,
      allowedInPhase49K: true,
      warnings: ['Report-only IAM plan. Do not apply broad grants, storage admin, or public principals.'],
    },
    {
      commandId: 'phase49k-fixture-normalizer-execution',
      phase: 'execute',
      commandString: 'GCP_PROJECT_ID=reeditpro GCP_REGION=us-central1 REEDITPRO_ENV=staging REEDITPRO_CONFIRM_BRAVE_FIXTURE_NORMALIZER=true npm run activation:brave-search-fixture-normalizer -- --execute',
      requiresConfirmation: true,
      textOnlyByDefault: false,
      allowedInPhase49K: true,
      warnings: [
        'Executes generated Brave-shaped fixture normalization only.',
        'Does not call Brave API, paid providers, live search, Playwright, Sharp, or Readability.',
      ],
    },
    blocked('brave-live-api-call', 'Phase 49K must not call Brave Search API.'),
    blocked('brave-api-key-secret-setup', 'Phase 49K must not create, read, print, or require a Brave API key value.'),
    blocked('live-search', 'Phase 49K must not run live search through SearXNG, Brave, or any other provider.'),
    blocked('browser-capture', 'Phase 49K must not launch Playwright or capture screenshots.'),
    blocked('readability-extraction', 'Phase 49K must not run Readability extraction.'),
    blocked('docker-gcp-mutation', 'Phase 49K must not build Docker images, deploy Cloud Run, or mutate Cloud Run.'),
    blocked('production-beta-unlock', 'Production, external beta, paid production, and broad media remain blocked.'),
  ]
}

function blocked(commandId: string, blockedReason: string): BraveFixtureCommandPlan {
  return {
    commandId,
    phase: 'validation',
    commandString: null,
    requiresConfirmation: false,
    textOnlyByDefault: true,
    allowedInPhase49K: false,
    warnings: [],
    blockedReason,
  }
}
