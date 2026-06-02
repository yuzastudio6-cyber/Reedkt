import type { PrivateSearxngResponse, PrivateWebSourceManifest, PrivateWebSourceRecord } from './private-web-search-capture-e2e-types'

export function normalizePrivateSearchResults(input: {
  runId: string
  response: PrivateSearxngResponse
}): { sources: PrivateWebSourceRecord[]; manifest: PrivateWebSourceManifest; blockers: string[]; warnings: string[] } {
  const blockers: string[] = []
  const warnings: string[] = []
  const sources: PrivateWebSourceRecord[] = []
  const retrievedAt = new Date().toISOString()
  for (const result of input.response.results) {
    let url: URL
    try {
      url = new URL(result.url)
    } catch {
      blockers.push(`Invalid fixture URL for result ${result.rank}.`)
      continue
    }
    if (url.hostname !== 'fixture.local') {
      blockers.push(`Result ${result.rank} must use fixture.local, got ${url.hostname}.`)
      continue
    }
    sources.push({
      sourceId: `source-${String(result.rank).padStart(3, '0')}`,
      provider: 'searxng',
      providerMode: input.response.providerMode,
      title: result.title,
      url: result.url,
      domain: 'fixture.local',
      snippet: result.content,
      rank: result.rank,
      category: result.category,
      retrievedAt,
      sourceType: 'controlled_private_fixture_page',
      attributionRequired: true,
      captureAllowed: true,
      extractionAllowed: true,
      paidProvider: false,
      generatedFixture: true,
    })
  }
  if (sources.length !== 3) blockers.push('Phase 49E must normalize exactly 3 private fixture source records.')
  const manifest: PrivateWebSourceManifest = {
    runId: input.runId,
    query: input.response.query,
    provider: 'searxng',
    providerMode: input.response.providerMode,
    sourceCount: sources.length,
    sources,
    attributionPolicy: 'Every Phase 49E source record is generated/private fixture content and must retain sourceId, title, URL, provider, and rank attribution.',
    liveSearchUsed: false,
    paidProviderUsed: false,
    publicWebCaptureUsed: false,
    warnings,
    blockers,
  }
  return { sources, manifest, blockers, warnings }
}
