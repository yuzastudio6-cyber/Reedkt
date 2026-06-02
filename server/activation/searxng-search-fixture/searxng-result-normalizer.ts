import { createHash } from 'node:crypto'
import { SEARXNG_FIXTURE_RETRIEVED_AT } from './searxng-fixture-data'
import type { NormalizedSearchSourceRecord, SearxngFixtureResponse, SearxngFixtureResult } from './searxng-search-fixture-types'

export interface SearxngNormalizationResult {
  sources: NormalizedSearchSourceRecord[]
  warnings: string[]
  blockers: string[]
  rejectedUrls: Array<{ url: string; reason: string }>
}

const privateIpv4Ranges = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^192\.168\./,
  /^0\.0\.0\.0$/,
]

export function normalizeSearxngFixtureResults(response: SearxngFixtureResponse): SearxngNormalizationResult {
  const sources: NormalizedSearchSourceRecord[] = []
  const warnings: string[] = []
  const blockers: string[] = []
  const rejectedUrls: Array<{ url: string; reason: string }> = []
  const seenUrls = new Set<string>()

  for (const result of response.results) {
    const validation = validateFixtureSearchResult(result)
    if (!validation.safe || !validation.url) {
      rejectedUrls.push({ url: result.url, reason: validation.reason })
      blockers.push(`Rejected fixture result "${result.title || '(missing title)'}": ${validation.reason}`)
      continue
    }

    const normalizedUrl = normalizeUrl(validation.url)
    if (seenUrls.has(normalizedUrl)) {
      warnings.push(`Duplicate fixture result ignored: ${normalizedUrl}`)
      continue
    }
    seenUrls.add(normalizedUrl)

    sources.push({
      sourceId: buildSourceId(result, normalizedUrl),
      provider: 'searxng',
      title: result.title.trim(),
      url: normalizedUrl,
      domain: validation.url.hostname,
      snippet: result.content.trim(),
      rank: result.rank,
      category: result.category,
      retrievedAt: SEARXNG_FIXTURE_RETRIEVED_AT,
      sourceType: 'generated_search_fixture',
      attributionRequired: true,
      captureAllowed: false,
      extractionAllowed: false,
      paidProvider: false,
      generatedFixture: true,
    })
  }

  return { sources, warnings, blockers, rejectedUrls }
}

export function validateFixtureSearchResult(result: Pick<SearxngFixtureResult, 'title' | 'url' | 'content'>): { safe: boolean; reason: string; url?: URL } {
  if (!result.title?.trim()) return { safe: false, reason: 'missing title' }
  if (!result.url?.trim()) return { safe: false, reason: 'missing URL' }
  if (!result.content?.trim()) return { safe: false, reason: 'missing snippet/content' }
  const url = parseUrl(result.url)
  if (!url) return { safe: false, reason: 'invalid URL' }
  return isSafeFixtureSearchUrl(url)
}

export function isSafeFixtureSearchUrl(url: URL): { safe: boolean; reason: string; url: URL } {
  const protocol = url.protocol.toLowerCase()
  if (protocol === 'javascript:' || protocol === 'data:' || protocol === 'file:') return { safe: false, reason: `${protocol} URLs are blocked`, url }
  if (protocol !== 'https:' && protocol !== 'http:') return { safe: false, reason: 'URL protocol must be http or https', url }
  const hostname = url.hostname.toLowerCase()
  if (hostname === 'localhost' || hostname === '[::1]' || hostname === '::1') return { safe: false, reason: 'localhost/private loopback URLs are blocked', url }
  if (privateIpv4Ranges.some((pattern) => pattern.test(hostname)) || isPrivate172Range(hostname)) return { safe: false, reason: 'private IP URLs are blocked', url }
  if (hostname.endsWith('.example.test') || hostname.endsWith('.invalid') || hostname === 'example.invalid') return { safe: true, reason: 'fixture-safe domain', url }
  return { safe: false, reason: 'Phase 49B accepts only generated fixture-safe example domains', url }
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

function buildSourceId(result: SearxngFixtureResult, normalizedUrl: string): string {
  const hash = createHash('sha256').update(`${result.title}|${normalizedUrl}`).digest('hex').slice(0, 12)
  return `src_searxng_${String(result.rank).padStart(2, '0')}_${hash}`
}

function isPrivate172Range(hostname: string): boolean {
  const parts = hostname.split('.').map((part) => Number(part))
  return parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31
}
