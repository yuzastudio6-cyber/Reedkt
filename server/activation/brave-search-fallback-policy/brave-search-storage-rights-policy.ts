import type { BraveSearchStorageRightsPolicy } from './brave-search-fallback-types'

export function buildBraveSearchStorageRightsPolicy(): BraveSearchStorageRightsPolicy {
  return {
    storeRawBraveResponseDefault: false,
    storeBraveSnippetsDefault: false,
    storeNormalizedMinimalMetadataDefault: false,
    rawPersistenceRequiresStorageRights: true,
    snippetPersistenceRequiresStorageRights: true,
    capturedPageContentGovernedByPublisherTerms: true,
    blockers: [
      'Raw Brave JSON persistence remains blocked unless a future selected plan/terms review grants storage rights.',
      'Brave snippets remain blocked from persistence unless storage rights are approved.',
      'Captured page content must be governed by publisher terms and ReeditPro capture policy, not Brave API result rights.',
    ],
    warnings: [
      'Future phases may record query hashes, provider decisions, URLs, titles, and domains only after policy review confirms the planned persistence mode.',
    ],
  }
}
