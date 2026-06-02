import { controlledLiveSearchArtifactPrefix, controlledLiveSearchConfig } from './controlled-live-search-capture-policy'
import type { ControlledLiveSearchPlanSnapshot } from './controlled-live-search-capture-types'

export function buildControlledLiveSearchPlanSnapshot(input: { runId: string }): ControlledLiveSearchPlanSnapshot {
  const artifactPrefix = controlledLiveSearchArtifactPrefix(input.runId)
  return {
    planId: 'phase49g-controlled-live-search-capture-plan',
    phase49GRunId: input.runId,
    provider: 'private_searxng_cloud_run',
    serviceName: controlledLiveSearchConfig.serviceName,
    queries: controlledLiveSearchConfig.queries.slice(0, controlledLiveSearchConfig.maxQueries),
    maxResultsPerQuery: controlledLiveSearchConfig.maxResultsPerQuery,
    allowedDomains: [...controlledLiveSearchConfig.allowedDomains],
    maxCapturePages: controlledLiveSearchConfig.maxCapturePages,
    paidProvidersAllowed: false,
    publicSearxngInstanceAllowed: false,
    arbitraryUrlCaptureAllowed: false,
    capturePolicy: 'allowlisted_search_results_only',
    readabilityPolicy: 'allowlisted_captured_pages_only',
    outputPrefixes: {
      generatedAssets: `gs://${controlledLiveSearchConfig.generatedAssetsBucket}/${artifactPrefix}/`,
      qaArtifacts: `gs://${controlledLiveSearchConfig.qaBucket}/${artifactPrefix}/`,
    },
    rawPromptExecution: false,
    approvedPlanSnapshot: true,
  }
}
