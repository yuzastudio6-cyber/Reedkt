import { privateSearxngServiceConfig } from './private-searxng-service-policy'
import type { PrivateSearxngQueryResponse, PrivateSearxngSourceRecord } from './private-searxng-service-types'

export function normalizePrivateSearxngResults(input: { response?: PrivateSearxngQueryResponse; retrievedAt?: string }): { sources: PrivateSearxngSourceRecord[]; blockers: string[]; warnings: string[] } {
  const blockers: string[] = []
  const warnings: string[] = []
  const sources: PrivateSearxngSourceRecord[] = []
  const results = input.response?.results ?? []
  const retrievedAt = input.retrievedAt ?? new Date().toISOString()
  for (const [index, result] of results.slice(0, privateSearxngServiceConfig.maxResults).entries()) {
    if (!result.title || !result.url) {
      blockers.push(`Result ${index + 1} is missing title or URL.`)
      continue
    }
    let url: URL
    try {
      url = new URL(result.url)
    } catch {
      blockers.push(`Result ${index + 1} URL is invalid.`)
      continue
    }
    if (!['http:', 'https:'].includes(url.protocol)) {
      blockers.push(`Result ${index + 1} URL must use http or https.`)
      continue
    }
    if (isBlockedHost(url.hostname)) {
      blockers.push(`Result ${index + 1} URL points to a blocked local/private host.`)
      continue
    }
    sources.push({
      sourceId: `source-${String(index + 1).padStart(3, '0')}`,
      provider: 'searxng',
      title: result.title.trim(),
      url: url.toString(),
      domain: url.hostname,
      snippet: (result.content ?? '').trim(),
      rank: index + 1,
      category: result.category ?? 'general',
      engine: Array.isArray(result.engine) ? result.engine.join(',') : result.engine ?? result.engines?.join(','),
      retrievedAt,
      sourceType: 'private_searxng_search_result',
      attributionRequired: true,
      captureAllowed: false,
      extractionAllowed: false,
      paidProvider: false,
      privateSearxngUsed: true,
    })
  }
  if (results.length === 0) blockers.push('No SearXNG results are available to normalize.')
  if (sources.length === 0) blockers.push('No valid private SearXNG source records were normalized.')
  if (sources.length > privateSearxngServiceConfig.maxResults) blockers.push('Normalized source count exceeds Phase 49F max results.')
  return { sources, blockers, warnings }
}

function isBlockedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase()
  return lower === 'localhost'
    || lower === '127.0.0.1'
    || lower === '0.0.0.0'
    || lower.endsWith('.local')
    || lower.endsWith('.internal')
    || lower.endsWith('.private')
    || /^10\./.test(lower)
    || /^192\.168\./.test(lower)
    || /^172\.(1[6-9]|2\d|3[0-1])\./.test(lower)
}
