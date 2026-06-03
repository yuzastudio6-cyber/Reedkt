import type { SearchProviderStoragePolicyAudit } from './search-provider-readiness-types'

export function buildSearchProviderStoragePolicyAudit(): SearchProviderStoragePolicyAudit {
  return {
    rawBraveResponseStorageAllowed: false,
    braveSnippetStorageAllowed: false,
    requestHeaderStorageAllowed: false,
    apiKeyStorageAllowed: false,
    normalizedMetadataAllowed: true,
    blockers: [],
    warnings: ['Only minimal normalized metadata is allowed; raw Brave payloads, snippets, headers, and key material remain blocked.'],
  }
}
