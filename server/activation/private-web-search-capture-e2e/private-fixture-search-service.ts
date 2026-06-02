import { privateWebE2EConfig } from './private-web-search-capture-e2e-policy'
import type { PrivateFixturePage, PrivateSearxngResponse, PrivateWebSearchProviderMode } from './private-web-search-capture-e2e-types'

export function buildPrivateFixtureSearchResponse(input: {
  providerMode: PrivateWebSearchProviderMode
  pages: PrivateFixturePage[]
}): PrivateSearxngResponse {
  return {
    query: privateWebE2EConfig.query,
    provider: 'searxng',
    providerMode: input.providerMode,
    generatedFixture: true,
    privateFixtureProviderUsed: input.providerMode === 'private_fixture_provider',
    liveSearchUsed: false,
    paidProviderUsed: false,
    results: input.pages.slice(0, privateWebE2EConfig.maxResults).map((page, index) => ({
      title: page.title,
      url: page.url,
      content: page.excerpt,
      engine: 'searxng',
      category: index === 0 ? 'documentation' : index === 1 ? 'source' : 'policy',
      score: 1 - index * 0.08,
      rank: index + 1,
      language: 'en',
      generatedFixture: true,
    })),
  }
}
