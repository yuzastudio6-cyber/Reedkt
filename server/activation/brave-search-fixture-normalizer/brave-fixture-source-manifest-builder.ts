import { buildBraveSourceStoragePolicy } from './brave-source-storage-policy'
import type {
  BraveFixtureSourceManifest,
  NormalizedBraveSourceRecord,
  SearchProviderRouterFixtureDecision,
  SearchResultDedupeFixture,
  SearxngConfidenceFixtureScenario,
} from './brave-search-fixture-types'

export function buildBraveFixtureSourceManifest(input: {
  runId: string
  sources: NormalizedBraveSourceRecord[]
  confidenceScenarios: SearxngConfidenceFixtureScenario[]
  routerDecisions: SearchProviderRouterFixtureDecision[]
  dedupeFixture: SearchResultDedupeFixture
  normalizationWarnings: string[]
  normalizationBlockers: string[]
}): BraveFixtureSourceManifest {
  const storageRightsPolicy = buildBraveSourceStoragePolicy()
  return {
    runId: input.runId,
    provider: 'brave_search',
    generatedFixture: true,
    liveProviderCallUsed: false,
    rawProviderResponseStored: false,
    storageRightsPolicy,
    normalizedSourceCount: input.sources.length,
    sourceRecords: input.sources,
    confidenceScenarios: input.confidenceScenarios,
    routerDecisions: input.routerDecisions,
    dedupeSummary: input.dedupeFixture,
    warnings: Array.from(new Set([
      ...input.normalizationWarnings,
      ...storageRightsPolicy.warnings,
      'Brave source records are generated fixture metadata, not live Brave API results.',
      'Capture and Readability extraction remain blocked in Phase 49K.',
    ])),
    blockers: Array.from(new Set([
      ...input.normalizationBlockers,
      ...storageRightsPolicy.blockers,
    ])),
  }
}
