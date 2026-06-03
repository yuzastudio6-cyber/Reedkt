import { braveSearchFixtureConfig } from './brave-search-fixture-policy'
import type { BraveShapedFixtureResponse } from './brave-search-fixture-types'

export const BRAVE_FIXTURE_RETRIEVED_AT = '2026-06-03T00:00:00.000Z'

export function buildBraveShapedFixtureResponse(): BraveShapedFixtureResponse {
  return {
    type: 'search',
    query: {
      original: braveSearchFixtureConfig.query,
      showStrictWarning: false,
    },
    web: {
      type: 'search',
      results: [
        result(1, 'ReeditPro planning tools overview', 'https://docs.example.test/reeditpro/planning-tools', 'Generated Brave fixture result describing ReeditPro planning tool contracts.', 'documentation'),
        result(2, 'Open-source video editing planning stack', 'https://source.example.test/video/editing-planning-stack', 'Generated fixture source for open-source video editing planning architecture.', 'source'),
        result(3, 'AI video planning provider boundary', 'https://planning.example.test/reeditpro/provider-boundary', 'Generated fixture result about keeping providers disabled until approval.', 'planning'),
        result(4, 'ReeditPro search capture source policy', 'https://docs.example.test/reeditpro/search-capture-source-policy', 'Generated fixture policy result for source attribution and private artifacts.', 'documentation'),
        result(5, 'Tool routing and normalizer notes', 'https://example.invalid/reeditpro/tool-routing-normalizer', 'Generated fixture note for normalizing provider results into source records.', 'tooling'),
        result(6, 'Video editing evidence manifest fixture', 'https://source.example.test/reeditpro/evidence-manifest-fixture', 'Generated fixture result about private evidence manifests and QA.', 'source'),
      ],
    },
    provider: 'brave_search',
    providerMode: 'fixture',
    generatedFixture: true,
    liveProviderCallUsed: false,
    rawProviderResponseStored: false,
  }
}

function result(rank: number, title: string, url: string, description: string, category: 'documentation' | 'source' | 'planning' | 'tooling') {
  return {
    title,
    url,
    description,
    age: rank <= 2 ? '1 week ago' : '1 month ago',
    profile: {
      name: new URL(url).hostname,
      url,
      longName: `${new URL(url).hostname} generated fixture profile`,
    },
    familyFriendly: true as const,
    type: 'search_result' as const,
    category,
    rank,
  }
}
