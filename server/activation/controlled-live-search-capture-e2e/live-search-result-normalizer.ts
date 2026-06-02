import { controlledLiveSearchConfig } from './controlled-live-search-capture-policy'
import { isSafeAllowlistedCaptureUrl } from './allowlisted-capture-policy'
import type {
  ControlledLiveSearchQueryResponse,
  ControlledLiveSearchSourceRecord,
} from './controlled-live-search-capture-types'

export function normalizeControlledLiveSearchResults(input: {
  responses: ControlledLiveSearchQueryResponse[]
}): {
  sources: ControlledLiveSearchSourceRecord[]
  warnings: string[]
  blockers: string[]
} {
  const sources: ControlledLiveSearchSourceRecord[] = []
  const warnings: string[] = []
  const blockers: string[] = []
  const seenUrls = new Set<string>()
  for (const [queryIndex, response] of input.responses.entries()) {
    const results = response.results.slice(0, controlledLiveSearchConfig.maxResultsPerQuery)
    if (results.length === 0) warnings.push(`Private SearXNG query "${response.query}" returned no results.`)
    for (const [index, result] of results.entries()) {
      if (!result.title?.trim()) {
        warnings.push(`Dropped result ${index + 1} for "${response.query}" because it has no title.`)
        continue
      }
      if (!result.url?.trim()) {
        warnings.push(`Dropped result "${result.title}" for "${response.query}" because it has no URL.`)
        continue
      }
      const url = normalizeUrl(result.url)
      if (!url) {
        warnings.push(`Dropped result "${result.title}" for "${response.query}" because its URL is invalid or unsafe.`)
        continue
      }
      if (seenUrls.has(url.href)) continue
      seenUrls.add(url.href)
      const captureAllowed = isSafeAllowlistedCaptureUrl(url.href)
      sources.push({
        sourceId: makeSourceId(sources.length + 1),
        provider: 'searxng',
        query: response.query,
        queryIndex: queryIndex + 1,
        title: collapseWhitespace(result.title),
        url: url.href,
        domain: url.hostname.toLowerCase(),
        snippet: collapseWhitespace(result.content ?? ''),
        rank: index + 1,
        category: result.category ?? 'general',
        engine: Array.isArray(result.engine) ? result.engine.join(',') : result.engine ?? result.engines?.join(','),
        retrievedAt: response.queriedAt,
        sourceType: 'private_searxng_live_search_result',
        attributionRequired: true,
        captureAllowed,
        extractionAllowed: captureAllowed,
        paidProvider: false,
        privateSearxngUsed: true,
      })
    }
  }
  if (sources.length === 0) blockers.push('No normalized private SearXNG source records were produced.')
  return { sources, warnings, blockers }
}

function normalizeUrl(value: string): URL | null {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return null
    if (isBlockedHostname(url.hostname)) return null
    url.hash = ''
    return url
  } catch {
    return null
  }
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local')) return true
  if (/^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true
  return false
}

function makeSourceId(index: number): string {
  return `source-${String(index).padStart(3, '0')}`
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}
