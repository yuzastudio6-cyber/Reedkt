import { searxngSearchFixtureArtifactPrefix, searxngSearchFixtureConfig, searxngSearchFixtureSafetyFlags } from './searxng-search-fixture-policy'
import type { ApprovedSearxngSearchPlanSnapshot } from './searxng-search-fixture-types'

export function buildApprovedSearxngSearchPlanSnapshot(runId: string): ApprovedSearxngSearchPlanSnapshot {
  const prefix = searxngSearchFixtureArtifactPrefix(runId)
  return {
    planId: 'phase49b-searxng-generated-private-fixture-plan',
    phase49BRunId: runId,
    query: searxngSearchFixtureConfig.query,
    provider: 'searxng',
    mode: 'generated_private_fixture',
    maxResults: searxngSearchFixtureConfig.maxResults,
    allowedProviderIds: ['searxng'],
    disabledProviderIds: ['brave-search-api', 'tavily', 'exa', 'firecrawl', 'browserless-browserbase'],
    liveSearchAllowed: false,
    browserCaptureAllowed: false,
    paidProviderAllowed: false,
    publicArtifactAllowed: false,
    rawPromptExecution: false,
    approvedPlanSnapshot: true,
    outputPrefixes: {
      generatedAssets: `gs://${searxngSearchFixtureConfig.generatedAssetsBucket}/${prefix}/`,
      qaArtifacts: `gs://${searxngSearchFixtureConfig.qaBucket}/${prefix}/`,
    },
    safety: searxngSearchFixtureSafetyFlags,
  }
}
