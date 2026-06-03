import type { BraveSourceStoragePolicy } from './brave-search-fixture-types'

export function buildBraveSourceStoragePolicy(): BraveSourceStoragePolicy {
  return {
    secretName: 'BRAVE_SEARCH_API_KEY',
    rawBraveResponseStorageAllowed: false,
    braveSnippetStorageAllowed: false,
    fixtureSnippetPreviewAllowed: true,
    normalizedMinimalMetadataAllowed: true,
    rawPersistenceRequiresStorageRights: true,
    snippetPersistenceRequiresStorageRights: true,
    noRealBravePayloadStored: true,
    warnings: [
      'Phase 49K stores generated Brave-shaped fixture JSON only.',
      'Future live Brave phases must separately approve raw response and snippet persistence rights.',
    ],
    blockers: [],
  }
}
