import { hybridSearchConfig } from './hybrid-search-consensus-policy'
import type { HybridCaptureTarget, HybridMergedSourceRecord, HybridSkippedTarget } from './hybrid-search-consensus-types'

const blockedProtocols = new Set(['javascript:', 'data:', 'file:', 'ftp:', 'chrome:', 'about:'])

export function isHybridAllowedDomain(hostname: string): boolean {
  const host = hostname.toLowerCase()
  return hybridSearchConfig.allowedDomains.some((domain) => host === domain || host.endsWith(`.${domain}`))
}

export function isSafeHybridCaptureUrl(value: string): boolean {
  try {
    const url = new URL(value)
    if (blockedProtocols.has(url.protocol)) return false
    if (url.protocol !== 'https:') return false
    if (isLocalOrPrivateHost(url.hostname)) return false
    return isHybridAllowedDomain(url.hostname)
  } catch {
    return false
  }
}

export function selectHybridCaptureTargets(input: {
  mergedSources: HybridMergedSourceRecord[]
}): {
  selected: HybridCaptureTarget[]
  skipped: HybridSkippedTarget[]
  blockers: string[]
  warnings: string[]
} {
  const selected: HybridCaptureTarget[] = []
  const skipped: HybridSkippedTarget[] = []
  const warnings: string[] = []
  const sorted = [...input.mergedSources].sort((left, right) => left.consensusRank - right.consensusRank)
  for (const source of sorted) {
    if (selected.length >= hybridSearchConfig.maxCapturePages) break
    if (!source.captureAllowed || !isSafeHybridCaptureUrl(source.canonicalUrl)) {
      skipped.push({ sourceId: source.sourceId, url: source.canonicalUrl, reason: 'Merged source is not an HTTPS allowlisted capture target.' })
      continue
    }
    selected.push({
      sourceId: source.sourceId,
      title: source.title,
      url: source.canonicalUrl,
      domain: source.domain,
      query: source.query,
      selectionReason: source.selectionReason,
    })
  }
  if (!selected.length) warnings.push('No allowlisted capture target was selected from merged hybrid sources.')
  return {
    selected,
    skipped,
    warnings,
    blockers: selected.length ? [] : ['No allowlisted merged source was available for Phase 49M capture.'],
  }
}

function isLocalOrPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local')) return true
  if (/^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true
  return false
}
