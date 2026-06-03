import type {
  BraveLiveBudgetGuardResult,
  BraveLiveSecretResolution,
  BraveLiveSourceManifest,
  NormalizedBraveLiveSourceRecord,
} from './brave-live-api-types'

export function buildBraveLiveSourceManifest(input: {
  runId: string
  sources: NormalizedBraveLiveSourceRecord[]
  budget: BraveLiveBudgetGuardResult
  secret: Omit<BraveLiveSecretResolution, 'secretValue'>
  actualCallCount: 0 | 1
  warnings: string[]
  blockers: string[]
}): BraveLiveSourceManifest {
  return {
    runId: input.runId,
    provider: 'brave_search',
    generatedFixture: false,
    liveProviderCallUsed: true,
    rawProviderResponseStored: false,
    snippetStored: false,
    storageRightsApproved: false,
    normalizedSourceCount: input.sources.length,
    sourceRecords: input.sources,
    budget: {
      estimatedCallCount: input.budget.estimatedCallCount,
      actualCallCount: input.actualCallCount,
      maxQueriesPerRun: 1,
      maxResults: 5,
    },
    secret: {
      configured: input.secret.configured,
      source: input.secret.source,
      secretName: 'BRAVE_SEARCH_API_KEY',
      secretVersion: 'latest',
      secretValuePrinted: false,
      secretValueStored: false,
      frontendExposure: false,
    },
    warnings: input.warnings,
    blockers: input.blockers,
  }
}
