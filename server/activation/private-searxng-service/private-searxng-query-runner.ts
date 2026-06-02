import { privateSearxngServiceConfig } from './private-searxng-service-policy'
import type { PrivateSearxngQueryResponse } from './private-searxng-service-types'

export async function runPrivateSearxngControlledQuery(input: { serviceUrl: string; identityToken?: string }): Promise<{ response: PrivateSearxngQueryResponse; queriedAt: string; blockers: string[]; warnings: string[] }> {
  const blockers: string[] = []
  const warnings: string[] = []
  const queriedAt = new Date().toISOString()
  const url = new URL('/search', input.serviceUrl)
  url.searchParams.set('q', privateSearxngServiceConfig.controlledQuery)
  url.searchParams.set('format', 'json')
  url.searchParams.set('language', 'en')
  url.searchParams.set('safesearch', '1')
  url.searchParams.set('categories', 'general')
  const headers: Record<string, string> = {
    'User-Agent': 'ReeditPro-Phase49F-Private-SearXNG-Validation/1.0',
  }
  if (input.identityToken?.trim()) headers.Authorization = `Bearer ${input.identityToken.trim()}`
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) throw new Error(`Private SearXNG controlled query failed with HTTP ${response.status}.`)
  const json = await response.json() as PrivateSearxngQueryResponse
  if (!Array.isArray(json.results)) blockers.push('Private SearXNG JSON response does not contain a results array.')
  if ((json.results?.length ?? 0) === 0) blockers.push('Private SearXNG controlled query returned zero results.')
  if ((json.results?.length ?? 0) > privateSearxngServiceConfig.maxResults) warnings.push(`Private SearXNG returned ${json.results.length} results; only the first ${privateSearxngServiceConfig.maxResults} are normalized.`)
  return { response: json, queriedAt, blockers, warnings }
}
