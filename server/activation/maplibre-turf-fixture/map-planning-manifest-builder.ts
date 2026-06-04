import { mapLibreTurfFixtureSafetyFlags } from './maplibre-turf-fixture-policy'
import type { GeneratedGeoJsonFixture, MapLibreStyleManifest, MapPlanningManifest, TurfCalculationResult } from './maplibre-turf-fixture-types'

export function buildMapPlanningManifest(input: {
  runId: string
  fixture: GeneratedGeoJsonFixture
  turfCalculations: TurfCalculationResult
  mapLibreManifest: MapLibreStyleManifest
}): MapPlanningManifest {
  const blockers = [
    ...input.turfCalculations.summary.blockers,
    ...input.mapLibreManifest.validation.blockers,
  ]
  const warnings = [
    ...input.turfCalculations.summary.warnings,
    ...input.mapLibreManifest.validation.warnings,
    'Phase 50B does not render MapLibre output or request tiles.',
  ]
  return {
    runId: input.runId,
    phase: '50B',
    fixtureMode: input.fixture.fixtureMode,
    generatedFixture: true,
    toolStack: ['Turf.js generated/local calculations', 'MapLibre-compatible style/source/layer manifest'],
    generatedDataSummary: {
      pointCount: input.fixture.points.features.length,
      routeCount: input.fixture.routes.features.length,
      polygonCount: input.fixture.polygons.features.length,
      combinedFeatureCount: input.fixture.combined.features.length,
      userLocationUsed: input.fixture.userLocationUsed,
      realWorldVerified: input.fixture.realWorldVerified,
    },
    turfCalculationSummary: input.turfCalculations.summary,
    mapLibreManifestSummary: {
      sourceCount: Object.keys(input.mapLibreManifest.sources).length,
      layerCount: input.mapLibreManifest.layers.length,
      renderingDeferredToPhase50C: input.mapLibreManifest.renderingDeferredToPhase50C,
      noRemoteSpriteGlyphTileUrls: input.mapLibreManifest.validation.noRemoteSpriteGlyphTileUrls,
      noPaidProviderUrls: input.mapLibreManifest.validation.noPaidProviderUrls,
    },
    blockedFeatures: Object.entries(mapLibreTurfFixtureSafetyFlags)
      .filter(([, value]) => value === false)
      .map(([key]) => key),
    privateArtifactPolicy: 'All Phase 50B outputs are private JSON/GeoJSON artifacts under activation-map-geospatial/phase50b/.',
    phase50CReadiness: blockers.length === 0 ? 'ready_for_maplibre_local_render_capture_fixture' : 'blocked',
    warnings: Array.from(new Set(warnings)),
    blockers: Array.from(new Set(blockers)),
  }
}
