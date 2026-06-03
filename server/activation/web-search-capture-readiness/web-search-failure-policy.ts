import type { WebSearchFailurePolicy } from './web-search-capture-readiness-types'

export function buildWebSearchFailurePolicy(): WebSearchFailurePolicy {
  return {
    failClosed: true,
    noFallbackToPaidProviders: true,
    noFallbackToPublicSearxng: true,
    noFallbackToArbitraryCapture: true,
    noSignedUrlSourceOfTruth: true,
    failureModes: [
      {
        failureId: 'private_searxng_metadata_missing',
        behavior: 'block_internal_readiness',
        summary: 'If the private Cloud Run service cannot be resolved from metadata, Phase 49H blocks instead of querying or falling back.',
      },
      {
        failureId: 'public_invoker_detected',
        behavior: 'block_internal_readiness',
        summary: 'Any allUsers or allAuthenticatedUsers invoker binding blocks internal readiness.',
      },
      {
        failureId: 'phase_evidence_missing',
        behavior: 'block_internal_readiness',
        summary: 'Missing Phase 49A-49G evidence blocks the web search/capture internal readiness closure.',
      },
      {
        failureId: 'artifact_verification_missing',
        behavior: 'block_internal_readiness',
        summary: 'Missing private GCS evidence artifacts block readiness; public or signed URL fallbacks are not allowed.',
      },
      {
        failureId: 'new_runtime_needed',
        behavior: 'defer_to_future_phase',
        summary: 'Any new search, capture, extraction, Docker, or Cloud Run runtime work is deferred out of Phase 49H.',
      },
    ],
  }
}
