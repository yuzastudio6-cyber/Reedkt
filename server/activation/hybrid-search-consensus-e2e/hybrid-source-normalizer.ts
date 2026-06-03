import { createHash } from 'node:crypto'
import { isSafeHybridCaptureUrl } from './hybrid-allowlisted-capture-policy'
import type { BraveLiveWebResult } from '../brave-live-api-validation'
import type { ControlledLiveSearchQueryResponse } from '../controlled-live-search-capture-e2e'
import type {
  HybridNormalizedBraveSource,
  HybridNormalizedSearxngSource,
} from './hybrid-search-consensus-types'

const privateIpv4Ranges = [/^10\./, /^127\./, /^169\.254\./, /^192\.168\./, /^0\.0\.0\.0$/]

export function normalizeHybridSearxngResults(input: {
  responses: ControlledLiveSearchQueryResponse[]
}): { sources: HybridNormalizedSearxngSource[]; warnings: string[]; blockers: string[] } {
  const sources: HybridNormalizedSearxngSource[] = []
  const warnings: string[] = []
  const seenUrls = new Set<string>()
  for (const response of input.responses) {
    for (const [index, result] of response.results.entries()) {
      if (!result.title?.trim()) {
        warnings.push(`Dropped SearXNG result ${index + 1} because it has no title.`)
        continue
      }
      if (!result.url?.trim()) {
        warnings.push(`Dropped SearXNG result "${result.title}" because it has no URL.`)
        continue
      }
      const url = normalizeUrl(result.url)
      if (!url) {
        warnings.push(`Dropped SearXNG result "${result.title}" because its URL is invalid or unsafe.`)
        continue
      }
      if (seenUrls.has(url.href)) continue
      seenUrls.add(url.href)
      const captureAllowed = isSafeHybridCaptureUrl(url.href)
      sources.push({
        sourceId: `src_searxng_${String(sources.length + 1).padStart(2, '0')}_${hash(url.href)}`,
        provider: 'searxng',
        query: response.query,
        queryIndex: 1,
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
        hybridProviderRole: 'default_provider',
      })
    }
  }
  return {
    sources,
    warnings,
    blockers: sources.length ? [] : ['No normalized private SearXNG source records were produced.'],
  }
}

export function normalizeHybridBraveResults(input: {
  results: BraveLiveWebResult[]
  retrievedAt?: string
}): { sources: HybridNormalizedBraveSource[]; warnings: string[]; blockers: string[]; rejectedUrls: Array<{ url: string; reason: string }> } {
  const sources: HybridNormalizedBraveSource[] = []
  const warnings: string[] = []
  const rejectedUrls: Array<{ url: string; reason: string }> = []
  const seenUrls = new Set<string>()
  const retrievedAt = input.retrievedAt ?? new Date().toISOString()
  for (const [index, result] of input.results.entries()) {
    const validation = validateBraveResult(result)
    if (!validation.safe || !validation.url) {
      rejectedUrls.push({ url: result.url ?? '(missing URL)', reason: validation.reason })
      warnings.push(`Rejected Brave result at rank ${index + 1}: ${validation.reason}`)
      continue
    }
    const normalizedUrl = normalizeUrl(validation.url.href)
    if (!normalizedUrl) {
      warnings.push(`Rejected Brave result at rank ${index + 1}: unsafe URL after normalization.`)
      continue
    }
    if (seenUrls.has(normalizedUrl.href)) continue
    seenUrls.add(normalizedUrl.href)
    sources.push({
      sourceId: `src_brave_${String(sources.length + 1).padStart(2, '0')}_${hash(normalizedUrl.href)}`,
      provider: 'brave_search',
      providerMode: 'live_controlled_validation',
      title: result.title?.trim() ?? '',
      url: normalizedUrl.href,
      domain: normalizedUrl.hostname.toLowerCase(),
      rank: index + 1,
      retrievedAt,
      sourceType: 'live_brave_web_search_result',
      attributionRequired: true,
      captureAllowed: false,
      extractionAllowed: false,
      paidProvider: true,
      liveProviderCallUsed: true,
      rawProviderResponseStored: false,
      snippetStored: false,
      hybridProviderRole: 'confidence_booster',
    })
  }
  return {
    sources,
    warnings,
    blockers: sources.length ? [] : ['No Brave live results could be normalized into safe source records.'],
    rejectedUrls,
  }
}

function validateBraveResult(result: BraveLiveWebResult): { safe: boolean; reason: string; url?: URL } {
  if (!result.title?.trim()) return { safe: false, reason: 'missing title' }
  if (!result.url?.trim()) return { safe: false, reason: 'missing URL' }
  const url = normalizeUrl(result.url)
  if (!url) return { safe: false, reason: 'invalid or unsafe URL' }
  return { safe: true, reason: 'safe https URL', url }
}

function normalizeUrl(value: string): URL | null {
  try {
    const url = new URL(value)
    const protocol = url.protocol.toLowerCase()
    if (['javascript:', 'data:', 'file:', 'ftp:', 'chrome:', 'about:'].includes(protocol)) return null
    if (protocol !== 'https:') return null
    if (isBlockedHostname(url.hostname)) return null
    url.protocol = 'https:'
    url.hostname = url.hostname.toLowerCase()
    url.hash = ''
    return url
  } catch {
    return null
  }
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (host === 'localhost' || host === '[::1]' || host === '::1' || host.endsWith('.local')) return true
  if (privateIpv4Ranges.some((pattern) => pattern.test(host)) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true
  return false
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 12)
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}
