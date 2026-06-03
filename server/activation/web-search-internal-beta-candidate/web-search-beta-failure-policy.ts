import type { WebSearchInternalBetaFailurePolicy } from './web-search-internal-beta-types'

export function buildWebSearchBetaFailurePolicy(): WebSearchInternalBetaFailurePolicy {
  return {
    failClosed: true,
    noLiveSearchFallback: true,
    noPublicSearxngFallback: true,
    noPaidProviderExpansionFallback: true,
    noArbitraryCaptureFallback: true,
    noBrowserProviderFallback: true,
    noPublicArtifactFallback: true,
    noProductionBetaUnlock: true,
    failureModes: [
      {
        failureId: 'private_searxng_unavailable',
        behavior: 'block_internal_beta_candidate',
        summary: 'If the private SearXNG service or access control cannot be verified, controlled internal beta candidate readiness is blocked.',
      },
      {
        failureId: 'brave_secret_budget_or_storage_invalid',
        behavior: 'degrade_to_internal_searxng_only',
        summary: 'Brave remains optional; invalid Brave secret, budget, or storage policy disables Brave rather than enabling another paid fallback.',
      },
      {
        failureId: 'no_allowlisted_capture_target',
        behavior: 'block_internal_beta_candidate',
        summary: 'Capture cannot proceed from arbitrary URLs; no allowlisted target means capture is blocked.',
      },
      {
        failureId: 'browser_or_processing_failure',
        behavior: 'defer_to_future_phase',
        summary: 'Playwright, Sharp, and Readability failures must remain bounded and private with no hosted browser or extraction-provider fallback.',
      },
      {
        failureId: 'artifact_upload_or_privacy_failure',
        behavior: 'block_internal_beta_candidate',
        summary: 'Public artifact exposure, signed URL source-of-truth use, or private upload failure blocks readiness.',
      },
      {
        failureId: 'production_or_external_beta_requested',
        behavior: 'block_internal_beta_candidate',
        summary: 'Production, external beta, paid production, broad media, and final delivery remain blocked after Phase 49P.',
      },
    ],
    blockers: [],
    warnings: ['The final Phase 49P failure policy is fail-closed and permits controlled internal beta candidate scope only.'],
  }
}
