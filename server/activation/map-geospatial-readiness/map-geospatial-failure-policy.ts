import type { MapGeospatialFailurePolicy } from './map-geospatial-readiness-types'

export function buildMapGeospatialFailurePolicy(): MapGeospatialFailurePolicy {
  return {
    policyId: 'phase50g-map-geospatial-fail-closed-policy',
    failClosed: true,
    entries: [
      entry('tile-provider-request', 'A live tile provider or arbitrary tile endpoint is requested.', 'reject', 'Reject until a future approved self-hosted/private tile phase clears the request.'),
      entry('public-osm-tile-use', 'A public OSM tile URL is requested for beta or production.', 'reject', 'Reject public tile hotlinking until a dedicated policy phase approves usage and attribution.'),
      entry('geocoding-routing-request', 'Live geocoding or routing is requested.', 'reject', 'Reject until self-hosted or approved provider phase clears privacy, cost, and license policy.'),
      entry('paid-map-provider', 'Mapbox, Google Maps, Cesium ion, or another paid map provider is requested.', 'reject', 'Reject paid map providers in Phase 50G.'),
      entry('external-network-request', 'A local/offline fixture observes an external network request.', 'fail_qa', 'Fail QA and block readiness.'),
      entry('arbitrary-user-location', 'Arbitrary user GPS/location input is supplied.', 'reject', 'Reject until a future privacy/location policy phase approves handling.'),
      entry('artifact-upload-failure', 'Private artifact upload fails.', 'block_readiness', 'Block readiness and do not expose local files or public fallback URLs.'),
      entry('capture-failure', 'Screenshot capture evidence is missing or failed.', 'block_readiness', 'Block readiness for capture-dependent evidence and do not create public fallbacks.'),
    ],
    blockers: [],
    warnings: ['Phase 50G failure policy is readiness-only and does not clear production or external beta execution.'],
  }
}

function entry(failureId: string, trigger: string, action: 'reject' | 'block_readiness' | 'fail_qa' | 'defer_to_future_phase', summary: string) {
  return { failureId, trigger, action, summary }
}
