import type { NormalizedSearchSourceRecord, SearxngSearchFixtureConfig, SearxngSourceManifest } from './searxng-search-fixture-types'

export function buildSearxngSourceManifest(input: {
  query: SearxngSearchFixtureConfig['query']
  sources: NormalizedSearchSourceRecord[]
  normalizationWarnings: string[]
  normalizationBlockers: string[]
}): SearxngSourceManifest {
  return {
    query: input.query,
    provider: 'searxng',
    generatedFixture: true,
    sourceCount: input.sources.length,
    sources: input.sources,
    attributionPolicy: 'Every search summary must cite source records by sourceId, title, URL, domain, and rank. Phase 49B does not capture pages or extract article text.',
    captureStatus: 'not_captured_phase49b',
    extractionStatus: 'not_extracted_phase49b',
    paidProviderUsed: false,
    liveSearchUsed: false,
    warnings: Array.from(new Set([
      ...input.normalizationWarnings,
      'Generated fixture URLs are not contacted and are not evidence of public web content.',
      'Capture and Readability extraction remain blocked until later approved phases.',
    ])),
    blockers: Array.from(new Set(input.normalizationBlockers)),
  }
}
