import { createHash } from 'node:crypto'
import { BRAVE_FIXTURE_RETRIEVED_AT } from './brave-shaped-fixture-data'
import type { BraveNormalizationResult, BraveShapedFixtureResponse, BraveShapedWebResult, NormalizedBraveSourceRecord } from './brave-search-fixture-types'

const privateIpv4Ranges = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^192\.168\./,
  /^0\.0\.0\.0$/,
]

export function normalizeBraveFixtureResults(response: BraveShapedFixtureResponse): BraveNormalizationResult {
  const sources: NormalizedBraveSourceRecord[] = []
  const warnings: string[] = []
  const blockers: string[] = []
  const rejectedUrls: Array<{ url: string; reason: string }> = []
  const seenUrls = new Set<string>()

  for (const result of response.web.results) {
    const validation = validateBraveFixtureResult(result)
    if (!validation.safe || !validation.url) {
      rejectedUrls.push({ url: result.url, reason: validation.reason })
      blockers.push(`Rejected Brave fixture result "${result.title || '(missing title)'}": ${validation.reason}`)
      continue
    }
    const normalizedUrl = normalizeUrl(validation.url)
    if (seenUrls.has(normalizedUrl)) {
      warnings.push(`Duplicate Brave fixture result ignored: ${normalizedUrl}`)
      continue
    }
    seenUrls.add(normalizedUrl)
    sources.push({
      sourceId: buildSourceId(result, normalizedUrl),
      provider: 'brave_search',
      providerMode: 'fixture',
      title: result.title.trim(),
      url: normalizedUrl,
      domain: validation.url.hostname,
      snippetStorageStatus: 'fixture_only',
      snippetPreview: `[generated fixture] ${result.description.trim()}`,
      rank: result.rank,
      category: result.category,
      retrievedAt: BRAVE_FIXTURE_RETRIEVED_AT,
      sourceType: 'generated_brave_fixture',
      attributionRequired: true,
      captureAllowed: false,
      extractionAllowed: false,
      paidProvider: true,
      liveProviderCallUsed: false,
      rawProviderResponseStored: false,
      generatedFixture: true,
    })
  }

  return { sources, warnings, blockers, rejectedUrls }
}

export function validateBraveFixtureResult(result: Pick<BraveShapedWebResult, 'title' | 'url' | 'description'>): { safe: boolean; reason: string; url?: URL } {
  if (!result.title?.trim()) return { safe: false, reason: 'missing title' }
  if (!result.url?.trim()) return { safe: false, reason: 'missing URL' }
  if (!result.description?.trim()) return { safe: false, reason: 'missing description/snippet' }
  const url = parseUrl(result.url)
  if (!url) return { safe: false, reason: 'invalid URL' }
  return isSafeBraveFixtureUrl(url)
}

export function isSafeBraveFixtureUrl(url: URL): { safe: boolean; reason: string; url: URL } {
  const protocol = url.protocol.toLowerCase()
  if (protocol === 'javascript:' || protocol === 'data:' || protocol === 'file:') return { safe: false, reason: `${protocol} URLs are blocked`, url }
  if (protocol !== 'https:') return { safe: false, reason: 'Phase 49K fixture URLs must use https', url }
  const hostname = url.hostname.toLowerCase()
  if (hostname === 'localhost' || hostname === '[::1]' || hostname === '::1') return { safe: false, reason: 'localhost/private loopback URLs are blocked', url }
  if (privateIpv4Ranges.some((pattern) => pattern.test(hostname)) || isPrivate172Range(hostname)) return { safe: false, reason: 'private IP URLs are blocked', url }
  if (hostname.endsWith('.example.test') || hostname.endsWith('.invalid') || hostname === 'example.invalid') return { safe: true, reason: 'fixture-safe domain', url }
  return { safe: false, reason: 'Phase 49K accepts only generated fixture-safe example domains', url }
}

function parseUrl(value: string): URL | undefined {
  try {
    return new URL(value)
  } catch {
    return undefined
  }
}

export function normalizeProviderUrl(value: string): string {
  const url = new URL(value)
  return normalizeUrl(url)
}

function normalizeUrl(url: URL): string {
  const normalized = new URL(url.toString())
  normalized.protocol = normalized.protocol.toLowerCase()
  normalized.hostname = normalized.hostname.toLowerCase()
  normalized.hash = ''
  const value = normalized.toString()
  return value.endsWith('/') && normalized.pathname === '/' ? value.slice(0, -1) : value
}

function buildSourceId(result: BraveShapedWebResult, normalizedUrl: string): string {
  const hash = createHash('sha256').update(`${result.title}|${normalizedUrl}`).digest('hex').slice(0, 12)
  return `src_brave_${String(result.rank).padStart(2, '0')}_${hash}`
}

function isPrivate172Range(hostname: string): boolean {
  const parts = hostname.split('.').map((part) => Number(part))
  return parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31
}
