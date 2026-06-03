import { braveLiveApiConfig, braveLiveArtifactPrefix, braveLiveSafetyFlags } from './brave-live-api-policy'
import type { BraveLiveQueryPlan } from './brave-live-api-types'

export function buildBraveLiveQueryPlan(runId: string): BraveLiveQueryPlan {
  const prefix = braveLiveArtifactPrefix(runId)
  return {
    planId: 'phase49l-brave-live-api-validation-plan',
    phase49LRunId: runId,
    provider: 'brave_search',
    providerMode: 'live_controlled_validation',
    endpoint: braveLiveApiConfig.endpoint,
    query: braveLiveApiConfig.query,
    params: {
      count: 5,
      search_lang: 'en',
      country: 'us',
      safesearch: 'moderate',
    },
    maxResults: 5,
    maxQueriesPerRun: 1,
    rawPromptExecution: false,
    approvedPlanSnapshot: true,
    rawBraveResponseStorageAllowed: false,
    braveSnippetStorageAllowed: false,
    browserCaptureAllowed: false,
    readabilityExtractionAllowed: false,
    outputPrefixes: {
      generatedAssets: `gs://${braveLiveApiConfig.generatedAssetsBucket}/${prefix}`,
      qaArtifacts: `gs://${braveLiveApiConfig.qaBucket}/${prefix}`,
    },
    safety: braveLiveSafetyFlags,
  }
}
