import { hybridSearchConfig } from './hybrid-search-consensus-policy'
import type { ControlledLiveSearchQueryResponse } from '../controlled-live-search-capture-e2e'

export async function runHybridPrivateSearxngQuery(input: {
  serviceUrl: string
  identityToken?: string
}): Promise<{
  responses: ControlledLiveSearchQueryResponse[]
  warnings: string[]
  blockers: string[]
}> {
  const warnings: string[] = []
  const blockers: string[] = []
  const responses: ControlledLiveSearchQueryResponse[] = []
  const serviceUrl = input.serviceUrl.replace(/\/+$/, '')
  if (!serviceUrl.startsWith('https://') && !serviceUrl.startsWith('http://127.0.0.1:')) {
    return { responses, warnings, blockers: ['Private SearXNG service URL must be an authenticated Cloud Run HTTPS URL or local Cloud Run proxy URL.'] }
  }
  const url = new URL('/search', serviceUrl)
  url.searchParams.set('q', hybridSearchConfig.query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('language', 'en')
  url.searchParams.set('safesearch', '1')
  url.searchParams.set('categories', 'general')
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (input.identityToken) headers.Authorization = `Bearer ${input.identityToken}`
  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(20_000) })
    if (!response.ok) {
      blockers.push(`Private SearXNG query failed with HTTP ${response.status}.`)
      return { responses, warnings, blockers }
    }
    const body = await response.json() as Omit<ControlledLiveSearchQueryResponse, 'query' | 'queriedAt'>
    const resultCount = Array.isArray(body.results) ? body.results.length : 0
    const results = Array.isArray(body.results) ? body.results.slice(0, hybridSearchConfig.maxSearxngResults) : []
    if (resultCount > hybridSearchConfig.maxSearxngResults) {
      warnings.push(`Private SearXNG returned more than ${hybridSearchConfig.maxSearxngResults} results; Phase 49M retained the first ${hybridSearchConfig.maxSearxngResults}.`)
    }
    responses.push({
      ...body,
      query: hybridSearchConfig.query,
      results,
      queriedAt: new Date().toISOString(),
    })
  } catch (error) {
    blockers.push(`Private SearXNG query failed: ${error instanceof Error ? error.message : String(error)}`)
  }
  if (responses.length === 0) blockers.push('No private SearXNG query response was available for Phase 49M.')
  return { responses, warnings, blockers }
}
