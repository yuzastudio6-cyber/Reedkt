import { privateWebE2EArtifactPrefix, privateWebE2EConfig, privateWebE2ESafetyFlags } from './private-web-search-capture-e2e-policy'
import type { PrivateWebE2EPlanSnapshot, PrivateWebSearchProviderMode } from './private-web-search-capture-e2e-types'

export function buildPrivateWebE2EPlanSnapshot(input: {
  runId: string
  providerMode: PrivateWebSearchProviderMode
}): PrivateWebE2EPlanSnapshot {
  const prefix = privateWebE2EArtifactPrefix(input.runId)
  return {
    planId: 'phase49e-private-web-search-capture-e2e-plan',
    phase49ERunId: input.runId,
    query: privateWebE2EConfig.query,
    providerMode: input.providerMode,
    maxResults: privateWebE2EConfig.maxResults,
    allowedResultDomains: privateWebE2EConfig.allowedResultDomains,
    browserCaptureScope: 'phase_created_fixture_pages_only',
    readabilityScope: 'phase_created_fixture_html_only',
    rawPromptExecution: false,
    approvedPlanSnapshot: true,
    paidProvidersAllowed: false,
    publicWebCaptureAllowed: false,
    arbitraryUrlCaptureAllowed: false,
    livePublicSearchAllowed: false,
    outputPrefixes: {
      generatedAssets: `gs://${privateWebE2EConfig.generatedAssetsBucket}/${prefix}/`,
      qaArtifacts: `gs://${privateWebE2EConfig.qaBucket}/${prefix}/`,
    },
    safety: privateWebE2ESafetyFlags,
  }
}
