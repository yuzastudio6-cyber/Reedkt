import type { SearxngFixtureResponse, SearxngSearchFixtureConfig } from './searxng-search-fixture-types'

export interface SearxngFixtureProviderContract {
  providerId: 'searxng'
  mode: 'generated_private_fixture'
  query: SearxngSearchFixtureConfig['query']
  generatedFixtureOnly: true
  liveSearchAllowed: false
  publicSearxngInstanceAllowed: false
  paidProviderAllowed: false
  browserCaptureAllowed: false
  resultCountRange: {
    min: 5
    max: 8
  }
  response: SearxngFixtureResponse
}

export function buildSearxngFixtureProviderContract(response: SearxngFixtureResponse): SearxngFixtureProviderContract {
  return {
    providerId: 'searxng',
    mode: 'generated_private_fixture',
    query: response.query,
    generatedFixtureOnly: true,
    liveSearchAllowed: false,
    publicSearxngInstanceAllowed: false,
    paidProviderAllowed: false,
    browserCaptureAllowed: false,
    resultCountRange: {
      min: 5,
      max: 8,
    },
    response,
  }
}
