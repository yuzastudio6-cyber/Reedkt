import { hybridSearchConfig } from './hybrid-search-consensus-policy'
import { isSafeHybridCaptureUrl } from './hybrid-allowlisted-capture-policy'
import type {
  HybridConsensusReport,
  HybridDuplicateGroup,
  HybridMergedSourceRecord,
  HybridNormalizedBraveSource,
  HybridNormalizedSearxngSource,
} from './hybrid-search-consensus-types'

export function mergeDedupeAndRankHybridSources(input: {
  searxngSources: HybridNormalizedSearxngSource[]
  braveSources: HybridNormalizedBraveSource[]
}): {
  mergedSources: HybridMergedSourceRecord[]
  duplicateGroups: HybridDuplicateGroup[]
  consensusReport: HybridConsensusReport
  warnings: string[]
  blockers: string[]
} {
  const warnings: string[] = []
  const blockers: string[] = []
  const groups = new Map<string, Array<HybridNormalizedSearxngSource | HybridNormalizedBraveSource>>()
  for (const source of [...input.searxngSources, ...input.braveSources]) {
    const key = canonicalUrl(source.url)
    const current = groups.get(key) ?? []
    current.push(source)
    groups.set(key, current)
  }
  const duplicateGroups: HybridDuplicateGroup[] = []
  const mergedSources: HybridMergedSourceRecord[] = []
  for (const [url, group] of groups.entries()) {
    const providers = Array.from(new Set(group.map((source) => source.provider))).sort() as Array<'searxng' | 'brave_search'>
    if (group.length > 1 || providers.length > 1) {
      duplicateGroups.push({
        groupId: `dupe-${String(duplicateGroups.length + 1).padStart(3, '0')}`,
        canonicalUrl: url,
        providers,
        sourceIds: group.map((source) => source.sourceId),
        titleSimilarityGroup: false,
      })
    }
    const searxng = group.find((source) => source.provider === 'searxng') as HybridNormalizedSearxngSource | undefined
    const brave = group.find((source) => source.provider === 'brave_search') as HybridNormalizedBraveSource | undefined
    const primary = searxng ?? brave ?? group[0]
    const domain = primary.domain
    const providerAgreement = providers.length > 1
    const captureAllowed = isSafeHybridCaptureUrl(url)
    const consensusScore = scoreSource({ providerAgreement, domain, searxngRank: searxng?.rank, braveRank: brave?.rank })
    mergedSources.push({
      sourceId: `source-${String(mergedSources.length + 1).padStart(3, '0')}`,
      canonicalUrl: url,
      title: primary.title,
      domain,
      query: searxng?.query ?? hybridSearchConfig.query,
      providers,
      providerRanks: {
        searxng: searxng?.rank,
        brave_search: brave?.rank,
      },
      providerSourceIds: {
        searxng: searxng?.sourceId,
        brave_search: brave?.sourceId,
      },
      sourceType: 'hybrid_merged_search_result',
      attributionRequired: true,
      captureAllowed,
      extractionAllowed: captureAllowed,
      paidProviderPresent: Boolean(brave),
      searxngDefaultProvider: true,
      braveConfidenceBoosterUsed: Boolean(brave),
      consensusRank: 0,
      consensusScore,
      selectionReason: providerAgreement
        ? 'SearXNG and Brave both returned this source; ranked as provider-agreed.'
        : `${providers[0]} returned this source; ranked by allowlist quality and provider rank.`,
    })
  }
  mergedSources.sort((left, right) => right.consensusScore - left.consensusScore || bestRank(left) - bestRank(right))
  const bounded = mergedSources.slice(0, hybridSearchConfig.maxMergedSources).map((source, index) => ({
    ...source,
    consensusRank: index + 1,
  }))
  if (mergedSources.length > bounded.length) warnings.push(`Merged sources were bounded from ${mergedSources.length} to ${bounded.length}.`)
  if (!bounded.length) blockers.push('No merged hybrid source records were produced.')
  const providerAgreementScore = bounded.length ? Math.round((bounded.filter((source) => source.providers.length > 1).length / bounded.length) * 100) : 0
  const uniqueDomains = new Set(bounded.map((source) => source.domain)).size
  const sourceDiversityScore = bounded.length ? Math.round((uniqueDomains / bounded.length) * 100) : 0
  const braveContributionCount = bounded.filter((source) => source.braveConfidenceBoosterUsed).length
  const searxngContributionCount = bounded.filter((source) => source.providers.includes('searxng')).length
  const consensusReport: HybridConsensusReport = {
    query: hybridSearchConfig.query,
    searxngSourceCount: input.searxngSources.length,
    braveSourceCount: input.braveSources.length,
    mergedSourceCount: bounded.length,
    duplicateGroupCount: duplicateGroups.length,
    duplicateGroups,
    providerAgreementScore,
    sourceDiversityScore,
    braveContributionCount,
    searxngContributionCount,
    fallbackReason: braveContributionCount > 0 ? 'Brave contributed confidence/diversity signals while SearXNG remained the default provider.' : undefined,
    searxngDefaultProvider: true,
    braveOptionalFallback: true,
    rawBraveResponseStored: false,
    braveSnippetStored: false,
    warnings,
    blockers,
  }
  return { mergedSources: bounded, duplicateGroups, consensusReport, warnings, blockers }
}

function canonicalUrl(value: string): string {
  const url = new URL(value)
  url.hash = ''
  url.hostname = url.hostname.toLowerCase()
  if (url.pathname === '/' && url.search === '') return url.origin
  return url.toString()
}

function scoreSource(input: { providerAgreement: boolean; domain: string; searxngRank?: number; braveRank?: number }): number {
  const agreement = input.providerAgreement ? 45 : 0
  const domain = domainPriority(input.domain)
  const rank = Math.max(0, 35 - Math.min(input.searxngRank ?? input.braveRank ?? 10, 10) * 4)
  return agreement + domain + rank
}

function domainPriority(domain: string): number {
  const order = ['docs.searxng.org', 'playwright.dev', 'sharp.pixelplumbing.com', 'github.com', 'developer.mozilla.org']
  const index = order.findIndex((allowed) => domain === allowed || domain.endsWith(`.${allowed}`))
  return index === -1 ? 0 : 30 - index * 4
}

function bestRank(source: HybridMergedSourceRecord): number {
  return Math.min(source.providerRanks.searxng ?? 99, source.providerRanks.brave_search ?? 99)
}
