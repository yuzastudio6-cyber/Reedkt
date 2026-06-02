import { privateSearxngServiceConfig } from './private-searxng-service-policy'
import type { PrivateSearxngSourceManifest, PrivateSearxngSourceRecord } from './private-searxng-service-types'

export function buildPrivateSearxngSourceManifest(input: { runId: string; sources: PrivateSearxngSourceRecord[]; warnings: string[]; blockers: string[] }): PrivateSearxngSourceManifest {
  return {
    runId: input.runId,
    query: privateSearxngServiceConfig.controlledQuery,
    provider: 'searxng',
    serviceMode: privateSearxngServiceConfig.serviceMode,
    sourceCount: input.sources.length,
    maxResults: 5,
    sources: input.sources,
    attributionPolicy: 'Every Phase 49F source record must retain sourceId, title, URL, domain, provider, engine when present, rank, and retrievedAt. Capture and extraction remain disabled.',
    privateSearxngUsed: true,
    publicSearxngInstanceUsed: false,
    paidProviderUsed: false,
    browserCaptureUsed: false,
    readabilityExtractionUsed: false,
    warnings: input.warnings,
    blockers: input.blockers,
  }
}
