import { braveLiveApiConfig } from './brave-live-api-policy'
import type { BraveLiveApiCallSummary, BraveLiveWebResult } from './brave-live-api-types'

export interface BraveLiveApiClientResult {
  summary: BraveLiveApiCallSummary
  results: BraveLiveWebResult[]
  warnings: string[]
  blockers: string[]
}

export async function runBraveLiveApiQuery(input: { apiKey: string }): Promise<BraveLiveApiClientResult> {
  const url = new URL(braveLiveApiConfig.endpoint)
  url.searchParams.set('q', braveLiveApiConfig.query)
  url.searchParams.set('count', String(braveLiveApiConfig.maxResults))
  url.searchParams.set('search_lang', 'en')
  url.searchParams.set('country', 'us')
  url.searchParams.set('safesearch', 'moderate')

  const baseSummary: BraveLiveApiCallSummary = {
    attempted: true,
    completed: false,
    endpoint: braveLiveApiConfig.endpoint,
    method: 'GET',
    resultCount: 0,
    callCount: 1,
    requestHeadersStored: false,
    secretValuePrinted: false,
    rawResponseStored: false,
    snippetsStored: false,
    disallowedEndpointUsed: false,
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Subscription-Token': input.apiKey,
      },
      signal: AbortSignal.timeout(braveLiveApiConfig.timeoutMs),
    })
    if (!response.ok) {
      return {
        summary: {
          ...baseSummary,
          statusCode: response.status,
          errorClass: `http_${response.status}`,
          errorMessage: `Brave Search API returned HTTP ${response.status}.`,
        },
        results: [],
        warnings: [],
        blockers: [`Brave Search API returned HTTP ${response.status}.`],
      }
    }
    const payload = await response.json() as { web?: { results?: BraveLiveWebResult[] } }
    const results = Array.isArray(payload.web?.results) ? payload.web.results.slice(0, braveLiveApiConfig.maxResults) : []
    return {
      summary: {
        ...baseSummary,
        completed: true,
        statusCode: response.status,
        resultCount: results.length,
      },
      results,
      warnings: ['Brave Search API response was parsed in memory only; raw JSON and snippets are not persisted.'],
      blockers: results.length ? [] : ['Brave Search API returned no web results for the controlled query.'],
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      summary: {
        ...baseSummary,
        errorClass: error instanceof Error ? error.name : 'unknown_error',
        errorMessage: message,
      },
      results: [],
      warnings: [],
      blockers: [`Brave Search API request failed: ${message}`],
    }
  }
}
