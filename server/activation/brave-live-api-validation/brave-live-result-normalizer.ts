import { createHash } from 'node:crypto'
import type { BraveLiveNormalizationResult, BraveLiveWebResult, NormalizedBraveLiveSourceRecord } from './brave-live-api-types'

const privateIpv4Ranges = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^192\.168\./,
  /^0\.0\.0\.0$/,
]

export function normalizeBraveLiveResults(input: { results: BraveLiveWebResult[]; retrievedAt?: string }): BraveLiveNormalizationResult {
  const sources: NormalizedBraveLiveSourceRecord[] = []
  const warnings: string[] = []
  const blockers: string[] = []
  const rejectedUrls: Array<{ url: string; reason: string }> = []
  const seenUrls = new Set<string>()
  const retrievedAt = input.retrievedAt ?? new Date().toISOString()

  input.results.forEach((result, index) => {
    const validation = validateBraveLiveResult(result)
    if (!validation.safe || !validation.url) {
      rejectedUrls.push({ url: result.url ?? '(missing URL)', reason: validation.reason })
      warnings.push(`Rejected Brave live result at rank ${index + 1}: ${validation.reason}`)
      return
    }
    const normalizedUrl = normalizeUrl(validation.url)
    if (seenUrls.has(normalizedUrl)) {
      warnings.push(`Duplicate Brave live result ignored: ${normalizedUrl}`)
      return
    }
    seenUrls.add(normalizedUrl)
    sources.push({
      sourceId: buildSourceId(result.title ?? '', normalizedUrl, index + 1),
      provider: 'brave_search',
      providerMode: 'live_controlled_validation',
      title: result.title?.trim() ?? '',
      url: normalizedUrl,
      domain: validation.url.hostname.toLowerCase(),
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
    })
  })

  if (!sources.length) blockers.push('No Brave live results could be normalized into safe source records.')
  return { sources, warnings, blockers, rejectedUrls }
}

export function validateBraveLiveResult(result: BraveLiveWebResult): { safe: boolean; reason: string; url?: URL } {
  if (!result.title?.trim()) return { safe: false, reason: 'missing title' }
  if (!result.url?.trim()) return { safe: false, reason: 'missing URL' }
  const url = parseUrl(result.url)
  if (!url) return { safe: false, reason: 'invalid URL' }
  return isSafeBraveLiveUrl(url)
}

function isSafeBraveLiveUrl(url: URL): { safe: boolean; reason: string; url: URL } {
  const protocol = url.protocol.toLowerCase()
  if (protocol === 'javascript:' || protocol === 'data:' || protocol === 'file:') return { safe: false, reason: `${protocol} URLs are blocked`, url }
  if (protocol !== 'https:') return { safe: false, reason: 'Phase 49L live Brave URLs must use https', url }
  const hostname = url.hostname.toLowerCase()
  if (hostname === 'localhost' || hostname === '[::1]' || hostname === '::1') return { safe: false, reason: 'localhost/private loopback URLs are blocked', url }
  if (privateIpv4Ranges.some((pattern) => pattern.test(hostname)) || isPrivate172Range(hostname)) return { safe: false, reason: 'private IP URLs are blocked', url }
  return { safe: true, reason: 'safe https URL', url }
}

function parseUrl(value: string): URL | undefined {
  try {
    return new URL(value)
  } catch {
    return undefined
  }
}

function normalizeUrl(url: URL): string {
  const normalized = new URL(url.toString())
  normalized.protocol = normalized.protocol.toLowerCase()
  normalized.hostname = normalized.hostname.toLowerCase()
  normalized.hash = ''
  const value = normalized.toString()
  return value.endsWith('/') && normalized.pathname === '/' ? value.slice(0, -1) : value
}

function buildSourceId(title: string, normalizedUrl: string, rank: number): string {
  const hash = createHash('sha256').update(`${title}|${normalizedUrl}`).digest('hex').slice(0, 12)
  return `src_brave_live_${String(rank).padStart(2, '0')}_${hash}`
}

function isPrivate172Range(hostname: string): boolean {
  const parts = hostname.split('.').map((part) => Number(part))
  return parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31
}
