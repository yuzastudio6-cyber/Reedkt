import { normalizeProviderUrl } from './brave-result-normalizer'
import type { FixtureSearxngSourceRecord, NormalizedBraveSourceRecord, SearchResultDedupeFixture } from './brave-search-fixture-types'

export function buildSearchResultDedupeFixture(braveSources: NormalizedBraveSourceRecord[]): SearchResultDedupeFixture {
  const searxngSources: FixtureSearxngSourceRecord[] = [
    searxng('src_searxng_fixture_01', 'ReeditPro planning tools overview', 'https://docs.example.test/reeditpro/planning-tools', 1),
    searxng('src_searxng_fixture_02', 'Open-source video editing planning stack', 'https://source.example.test/video/editing-planning-stack', 2),
    searxng('src_searxng_fixture_03', 'Independent planning note', 'https://docs.example.test/reeditpro/independent-planning-note', 3),
  ]
  const byUrl = new Map<string, Array<FixtureSearxngSourceRecord | NormalizedBraveSourceRecord>>()
  for (const source of [...searxngSources, ...braveSources]) {
    const normalizedUrl = normalizeProviderUrl(source.url)
    byUrl.set(normalizedUrl, [...(byUrl.get(normalizedUrl) ?? []), source])
  }
  const duplicateGroups = Array.from(byUrl.entries())
    .filter(([, sources]) => sources.length > 1)
    .map(([normalizedUrl, sources]) => ({
      normalizedUrl,
      sourceIds: sources.map((source) => source.sourceId),
      providers: Array.from(new Set(sources.map((source) => source.provider))) as Array<'searxng' | 'brave_search'>,
    }))
  const mergedSources = Array.from(byUrl.values()).map((sources) => sources[0])
  const promotedSources = mergedSources.slice(0, 5)
  const overlappingUrls = duplicateGroups.length
  const uniqueDomains = new Set(mergedSources.map((source) => source.domain)).size
  return {
    searxngSources,
    braveSources,
    mergedSources,
    duplicateGroups,
    providerAgreementScore: Math.min(100, overlappingUrls * 25),
    sourceDiversityScore: Math.min(100, uniqueDomains * 20),
    promotedSources,
    providerContributionSummary: {
      searxngUnique: searxngSources.length - overlappingUrls,
      braveUnique: braveSources.length - overlappingUrls,
      overlappingUrls,
    },
    fixtureOnly: true,
  }
}

function searxng(sourceId: string, title: string, url: string, rank: number): FixtureSearxngSourceRecord {
  const parsed = new URL(url)
  return {
    sourceId,
    provider: 'searxng',
    title,
    url,
    domain: parsed.hostname,
    rank,
    generatedFixture: true,
  }
}
