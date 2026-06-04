import fs from 'node:fs'
import assert from 'node:assert/strict'
import {
  buildGeneratedGeoJsonFixture,
  buildMapLibreStyleManifest,
  buildMapLibreTurfFixtureCommandPlan,
  buildMapLibreTurfFixtureIamPlan,
  buildMapLibreTurfFixtureQaSummary,
  buildMapLibreTurfFixtureReport,
  mapLibreTurfFixtureConfig,
  mapLibreTurfFixtureSafetyFlags,
  mapLibreTurfFixtureRequiredDocs,
  mapLibreTurfFixtureRequiredScripts,
  runTurfGeospatialCalculations,
} from '../activation/maplibre-turf-fixture'

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8')) as {
  scripts: Record<string, string>
  dependencies: Record<string, string>
}
const fixture = buildGeneratedGeoJsonFixture()
const turfResult = runTurfGeospatialCalculations(fixture)
const mapLibreManifest = buildMapLibreStyleManifest(fixture, turfResult)
const qa = buildMapLibreTurfFixtureQaSummary({
  phase50aApproved: true,
  fixture,
  turfCalculations: turfResult,
  mapLibreManifest,
  publicAccessBlocked: true,
})
const report = buildMapLibreTurfFixtureReport()
const commandPlan = buildMapLibreTurfFixtureCommandPlan()
const iamPlan = buildMapLibreTurfFixtureIamPlan()

assert.equal(mapLibreTurfFixtureConfig.phase, '50B')
assert.equal(mapLibreTurfFixtureConfig.mode, 'maplibre_turf_generated_local_fixture')
assert.equal(mapLibreTurfFixtureSafetyFlags.turfCalculationsAllowed, true)
assert.equal(mapLibreTurfFixtureSafetyFlags.mapLibreManifestAllowed, true)
assert.equal(mapLibreTurfFixtureSafetyFlags.mapLibreBrowserRuntimeAllowed, false)
assert.equal(mapLibreTurfFixtureSafetyFlags.mapRenderingAllowed, false)
assert.equal(mapLibreTurfFixtureSafetyFlags.tileDownloadAllowed, false)
assert.equal(mapLibreTurfFixtureSafetyFlags.liveTileProviderAllowed, false)
assert.equal(mapLibreTurfFixtureSafetyFlags.geocodingAllowed, false)
assert.equal(mapLibreTurfFixtureSafetyFlags.routingAllowed, false)
assert.equal(mapLibreTurfFixtureSafetyFlags.paidMapProviderAllowed, false)
assert.equal(mapLibreTurfFixtureSafetyFlags.publicArtifactAllowed, false)
assert.equal(mapLibreTurfFixtureSafetyFlags.productionReadyAllowed, false)
assert.equal(mapLibreTurfFixtureSafetyFlags.externalBetaAllowed, false)
assert.equal(mapLibreTurfFixtureSafetyFlags.broadMediaAllowed, false)

assert.equal(fixture.generatedFixture, true)
assert.equal(fixture.realWorldVerified, false)
assert.equal(fixture.userLocationUsed, false)
assert.equal(fixture.points.features.length, 6)
assert.equal(fixture.routes.features.length, 2)
assert.equal(fixture.polygons.features.length, 2)
assert.equal(fixture.combined.features.length, 10)
assert.equal(fixture.combined.features.every((feature) => feature.properties.source === 'generated_fixture'), true)
assert.equal(fixture.combined.features.every((feature) => feature.properties.captureAllowed === false), true)
assert.equal(fixture.combined.features.every((feature) => feature.properties.realWorldVerified === false), true)

assert.equal(turfResult.summary.coordinateValidationPassed, true)
assert.equal(turfResult.summary.blockers.length, 0)
for (const calculation of ['bbox', 'centroid', 'distance', 'route_length', 'buffer', 'area', 'boolean_point_in_polygon', 'nearest_point', 'feature_count']) {
  assert.equal(turfResult.records.some((record) => record.calculation === calculation), true, `Missing Turf calculation ${calculation}`)
}

assert.equal(mapLibreManifest.mapLibreBrowserRuntimeUsed, false)
assert.equal(mapLibreManifest.renderingDeferredToPhase50C, true)
assert.equal(mapLibreManifest.validation.noRemoteSpriteGlyphTileUrls, true)
assert.equal(mapLibreManifest.validation.noPaidProviderUrls, true)
assert.equal(mapLibreManifest.validation.layerReferencesValid, true)
assert.equal(mapLibreManifest.validation.blockers.length, 0)

assert.equal(qa.status, 'passed')
for (const gateId of ['phase50a_evidence', 'generated_geojson_integrity', 'turf_calculations', 'maplibre_manifest', 'artifact_privacy', 'blocked_features']) {
  assert.equal(qa.gates.some((gate) => gate.gateId === gateId && gate.passed), true, `Missing passing QA gate ${gateId}`)
}

assert.equal(report.reportId, 'activation-phase-50b-maplibre-turf-fixture')
assert.equal(report.mapRenderingAllowed, false)
assert.equal(report.tileDownloadAllowed, false)
assert.equal(report.geocodingAllowed, false)
assert.equal(report.routingAllowed, false)
assert.equal(report.paidMapProviderAllowed, false)
assert.equal(commandPlan.defaultMode, 'static_report_only')
assert.equal(commandPlan.blockedAlways.includes('map rendering'), true)
assert.equal(commandPlan.blockedAlways.includes('tile downloads'), true)
assert.equal(commandPlan.blockedAlways.includes('geocoding APIs'), true)
assert.equal(iamPlan.defaultMutationRequired, false)
assert.equal(iamPlan.forbidden.includes('allUsers'), true)
assert.equal(iamPlan.forbidden.includes('allAuthenticatedUsers'), true)

for (const script of mapLibreTurfFixtureRequiredScripts) {
  assert.equal(packageJson.scripts[script] !== undefined, true, `Missing package script ${script}`)
}
assert.equal(packageJson.dependencies['@turf/turf'] !== undefined, true, '@turf/turf must be installed for Phase 50B Turf proof.')
assert.equal(packageJson.dependencies['maplibre-gl'] === undefined, true, 'maplibre-gl must remain uninstalled in Phase 50B.')
for (const docPath of mapLibreTurfFixtureRequiredDocs) {
  assert.equal(fs.existsSync(docPath), true, `Missing doc ${docPath}`)
}

console.log('Phase 50B MapLibre + Turf generated fixture smoke passed.')
