import type {
  MapGeospatialArtifactPrivacyAudit,
  MapGeospatialFailurePolicy,
  MapGeospatialOwnershipAudit,
  MapGeospatialProviderDataAudit,
  MapGeospatialReadinessScopeManifest,
} from './map-geospatial-readiness-types'

export function buildMapGeospatialReadinessScopeManifest(input: {
  runId: string
  ready: boolean
  providerDataAudit: MapGeospatialProviderDataAudit
  ownershipAudit: MapGeospatialOwnershipAudit
  artifactPrivacyAudit: MapGeospatialArtifactPrivacyAudit
  failurePolicy: MapGeospatialFailurePolicy
}): MapGeospatialReadinessScopeManifest {
  return {
    phase: '50G',
    runId: input.runId,
    includedFeatures: [
      'Generated/local GeoJSON planning data',
      'Turf bbox, centroid, distance, route length, buffer/radius, area, point-in-polygon, nearest-candidate, and coordinate validation evidence',
      'MapLibre local/offline render evidence',
      'deck.gl local/offline overlay evidence',
      'CesiumJS local/offline 3D planning evidence',
      'Playwright local-only capture evidence',
      'Sharp screenshot derivative consumption evidence only',
      'Phase 49P web-search evidence to planning-source handoff',
      'Private GCS artifact manifests and QA reports',
      'Network guard evidence with zero external requests in canonical render phases',
    ],
    blockedFeatures: [
      'Live map tiles',
      'Public OSM tile hotlinking',
      'Tile downloads',
      'Live geocoding APIs',
      'Live routing APIs',
      'Mapbox paid APIs',
      'Google Maps APIs',
      'Cesium ion',
      'Live terrain',
      'Live imagery',
      '3D Tiles',
      'Public artifacts',
      'Signed URLs as source of truth',
      'Arbitrary user GPS/location tracking',
      'D3 runtime',
      'Three.js runtime',
      'AI Tools creative graphics runtime',
      'Production',
      'External beta',
      'Paid production',
      'Broad media',
    ],
    toolScope: {
      mapLibre: 'controlled_internal_local_offline_ready',
      turf: 'controlled_internal_generated_calculations_ready',
      deckGl: 'controlled_internal_local_offline_overlay_ready',
      cesiumJs: 'controlled_internal_local_offline_3d_ready',
      playwright: 'local_fixture_capture_evidence_only',
      sharp: 'screenshot_derivative_consumer_only_track_b_owned',
      webSearch: 'phase49p_evidence_handoff_only',
    },
    ownershipScope: input.ownershipAudit,
    dataProviderPolicy: input.providerDataAudit,
    artifactPolicy: input.artifactPrivacyAudit,
    networkPolicy: {
      externalNetworkRequestsAllowed: false,
      canonicalRenderPhasesExternalRequestCount: 0,
      actionIfExternalRequestObserved: 'fail_readiness',
    },
    failurePolicy: input.failurePolicy,
    readinessDecision: input.ready ? 'ready_for_controlled_internal_testing' : 'blocked',
    mapGeospatialInternalTestingReady: input.ready,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadMediaAllowed: false,
  }
}
