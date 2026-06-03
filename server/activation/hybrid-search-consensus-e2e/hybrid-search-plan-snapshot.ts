import { hybridSearchArtifactPrefix, hybridSearchConfig } from './hybrid-search-consensus-policy'
import type { HybridSearchPlanSnapshot } from './hybrid-search-consensus-types'

export function buildHybridSearchPlanSnapshot(runId: string): HybridSearchPlanSnapshot {
  const prefix = hybridSearchArtifactPrefix(runId)
  return {
    planId: 'phase49m-hybrid-search-consensus-plan',
    phase49MRunId: runId,
    query: hybridSearchConfig.query,
    providers: ['searxng_private_cloud_run', 'brave_search'],
    providerMode: 'hybrid_consensus',
    defaultProvider: 'searxng',
    braveRole: 'optional_paid_confidence_booster',
    maxSearxngResults: hybridSearchConfig.maxSearxngResults,
    maxBraveResults: hybridSearchConfig.maxBraveResults,
    maxMergedSources: hybridSearchConfig.maxMergedSources,
    maxCapturePages: hybridSearchConfig.maxCapturePages,
    allowedDomains: hybridSearchConfig.allowedDomains,
    storagePolicy: {
      rawBraveResponseStored: false,
      braveSnippetStored: false,
      requestHeadersStored: false,
    },
    paidProviderBudget: {
      maxBraveQueries: 1,
      maxBraveResults: hybridSearchConfig.maxBraveResults,
    },
    outputPrefixes: {
      generatedAssets: `gs://${hybridSearchConfig.generatedAssetsBucket}/${prefix}/`,
      qaArtifacts: `gs://${hybridSearchConfig.qaBucket}/${prefix}/`,
    },
    rawPromptExecution: false,
    approvedPlanSnapshot: true,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
  }
}
