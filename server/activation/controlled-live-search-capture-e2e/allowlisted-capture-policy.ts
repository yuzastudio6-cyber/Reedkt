import { controlledLiveSearchConfig } from './controlled-live-search-capture-policy'
import type {
  ControlledLiveSearchCaptureTarget,
  ControlledLiveSearchSkippedTarget,
  ControlledLiveSearchSourceRecord,
} from './controlled-live-search-capture-types'

const blockedProtocols = new Set(['javascript:', 'data:', 'file:', 'ftp:', 'chrome:', 'about:'])

export function isAllowedCaptureDomain(hostname: string): boolean {
  const host = hostname.toLowerCase()
  return controlledLiveSearchConfig.allowedDomains.some((domain) => host === domain || host.endsWith(`.${domain}`))
}

export function isSafeAllowlistedCaptureUrl(value: string): boolean {
  try {
    const url = new URL(value)
    if (blockedProtocols.has(url.protocol)) return false
    if (url.protocol !== 'https:') return false
    if (isLocalOrPrivateHost(url.hostname)) return false
    return isAllowedCaptureDomain(url.hostname)
  } catch {
    return false
  }
}

export function selectAllowlistedCaptureTargets(input: {
  sources: ControlledLiveSearchSourceRecord[]
}): {
  selected: ControlledLiveSearchCaptureTarget[]
  skipped: ControlledLiveSearchSkippedTarget[]
  blockers: string[]
  warnings: string[]
} {
  const selected: ControlledLiveSearchCaptureTarget[] = []
  const skipped: ControlledLiveSearchSkippedTarget[] = []
  const warnings: string[] = []
  const seenDomains = new Set<string>()
  const sorted = [...input.sources].sort((left, right) => domainPriority(left.domain) - domainPriority(right.domain) || left.rank - right.rank)
  for (const source of sorted) {
    if (selected.length >= controlledLiveSearchConfig.maxCapturePages) break
    if (!source.captureAllowed || !isSafeAllowlistedCaptureUrl(source.url)) {
      skipped.push({ sourceId: source.sourceId, url: source.url, reason: 'Source URL is not an HTTPS allowlisted capture target.' })
      continue
    }
    if (seenDomains.has(source.domain) && selected.length < controlledLiveSearchConfig.maxCapturePages - 1) {
      skipped.push({ sourceId: source.sourceId, url: source.url, reason: 'A higher-priority result from this domain was already selected.' })
      continue
    }
    seenDomains.add(source.domain)
    selected.push({
      sourceId: source.sourceId,
      title: source.title,
      url: source.url,
      domain: source.domain,
      query: source.query,
      selectionReason: 'Private SearXNG result uses an HTTPS URL on a Phase 49G allowlisted documentation domain.',
    })
  }
  if (selected.length === 0) warnings.push('No allowlisted capture target was selected from the private SearXNG results.')
  return {
    selected,
    skipped,
    warnings,
    blockers: selected.length === 0 ? ['No allowlisted search result was available for Phase 49G capture.'] : [],
  }
}

function domainPriority(domain: string): number {
  const order = ['docs.searxng.org', 'playwright.dev', 'sharp.pixelplumbing.com', 'github.com', 'developer.mozilla.org']
  const index = order.findIndex((allowed) => domain === allowed || domain.endsWith(`.${allowed}`))
  return index === -1 ? 100 : index
}

function isLocalOrPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local')) return true
  if (/^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true
  return false
}
