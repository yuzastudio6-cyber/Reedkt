import type { GeneratedGeoJsonFixture, MapLibreStyleManifest, MapLibreTurfFixtureArtifact, MapLibreTurfFixtureQaGate, MapLibreTurfFixtureQaSummary, TurfCalculationResult } from './maplibre-turf-fixture-types'

export function buildMapLibreTurfFixtureQaSummary(input: {
  phase50aApproved: boolean
  fixture?: GeneratedGeoJsonFixture
  turfCalculations?: TurfCalculationResult
  mapLibreManifest?: MapLibreStyleManifest
  artifacts?: MapLibreTurfFixtureArtifact[]
  preflightBlockers?: string[]
  publicAccessBlocked?: boolean
}): MapLibreTurfFixtureQaSummary {
  const preflightBlockers = input.preflightBlockers ?? []
  const fixture = input.fixture
  const turf = input.turfCalculations
  const manifest = input.mapLibreManifest
  const artifacts = input.artifacts ?? []
  const generatedGeoJsonIntegrity = !!fixture
    && fixture.generatedFixture
    && fixture.userLocationUsed === false
    && fixture.realWorldVerified === false
    && fixture.points.features.length >= 5
    && fixture.points.features.length <= 8
    && fixture.routes.features.length >= 1
    && fixture.routes.features.length <= 2
    && fixture.polygons.features.length >= 1
    && fixture.polygons.features.length <= 2
    && fixture.combined.features.every((feature) => feature.properties.source === 'generated_fixture' && feature.properties.captureAllowed === false && feature.properties.realWorldVerified === false)
  const turfCalculationsPassed = !!turf
    && turf.summary.coordinateValidationPassed
    && turf.summary.blockers.length === 0
    && ['bbox', 'centroid', 'distance', 'route_length', 'buffer', 'area', 'boolean_point_in_polygon', 'nearest_point', 'feature_count'].every((name) => turf.records.some((record) => record.calculation === name))
  const mapLibreManifestPassed = !!manifest
    && manifest.mapLibreBrowserRuntimeUsed === false
    && manifest.renderingDeferredToPhase50C
    && manifest.validation.blockers.length === 0
    && manifest.validation.noRemoteSpriteGlyphTileUrls
    && manifest.validation.noPaidProviderUrls
    && manifest.validation.layerReferencesValid
  const artifactPrivacyPassed = artifacts.length === 0
    ? true
    : artifacts.every((artifact) => artifact.gcsUri.startsWith('gs://reeditpro-staging-reeditpro-') && !artifact.gcsUri.includes('http') && artifact.kind.startsWith('private_'))
      && input.publicAccessBlocked !== false
  const blockedFeatures = preflightBlockers.length === 0
    && (!manifest || (manifest.mapLibreBrowserRuntimeUsed === false && manifest.renderingDeferredToPhase50C && manifest.validation.noRemoteSpriteGlyphTileUrls && manifest.validation.noPaidProviderUrls))

  const gates: MapLibreTurfFixtureQaGate[] = [
    gate('phase50a_evidence', input.phase50aApproved, 'Phase 50A map/geospatial approval evidence is present and planning-approved.'),
    gate('generated_geojson_integrity', generatedGeoJsonIntegrity, 'Generated FeatureCollections are deterministic, bounded, synthetic, and marked as generated fixtures.'),
    gate('turf_calculations', turfCalculationsPassed, 'Turf bbox, centroid, distance, route length, buffer, area, point-in-polygon, nearest-point, and count checks pass.'),
    gate('maplibre_manifest', mapLibreManifestPassed, 'MapLibre-compatible sources/layers/camera manifest is valid and contains no remote tile or paid-provider URLs.'),
    gate('artifact_privacy', artifactPrivacyPassed, 'Artifacts are private GCS JSON/GeoJSON outputs with no public or signed URL source of truth.'),
    gate('blocked_features', blockedFeatures, 'Map rendering, tile download, live tiles, geocoding, routing, paid providers, production, beta, and broad media remain blocked.'),
  ]
  const blockers = [
    ...preflightBlockers,
    ...(input.phase50aApproved ? [] : ['Phase 50A approval evidence is not ready.']),
    ...(generatedGeoJsonIntegrity ? [] : ['Generated GeoJSON integrity failed.']),
    ...(turfCalculationsPassed ? [] : ['Turf calculation QA failed.']),
    ...(mapLibreManifestPassed ? [] : ['MapLibre manifest QA failed.']),
    ...(artifactPrivacyPassed ? [] : ['Artifact privacy QA failed.']),
    ...(blockedFeatures ? [] : ['One or more blocked Phase 50B features is enabled.']),
  ]
  const warnings = Array.from(new Set([
    ...(turf?.summary.warnings ?? []),
    ...(manifest?.validation.warnings ?? []),
    'Phase 50B does not render a map or request live tiles.',
  ]))
  return {
    status: gates.every((entry) => entry.passed) && blockers.length === 0 ? 'passed' : 'blocked',
    gates,
    blockers: Array.from(new Set(blockers)),
    warnings,
  }
}

function gate(gateId: MapLibreTurfFixtureQaGate['gateId'], passed: boolean, summary: string): MapLibreTurfFixtureQaGate {
  return { gateId, passed, severity: 'mandatory', summary }
}
