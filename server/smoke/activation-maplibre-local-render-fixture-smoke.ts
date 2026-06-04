import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  buildLocalMapFixtureData,
  buildMapLibreLocalRenderCommandPlan,
  buildMapLibreLocalRenderIamPlan,
  buildMapLibreLocalRenderQaSummary,
  buildMapLibreLocalRenderReport,
  evaluateMapLibreNetworkRequest,
  findForbiddenMapNetworkRequests,
  mapLibreLocalRenderConfig,
  mapLibreLocalRenderRequiredDocs,
  mapLibreLocalRenderRequiredScripts,
  mapLibreLocalRenderSafetyFlags,
} from '../activation/maplibre-local-render-fixture'
import type { MapLibreRenderMetadata, SharpMapScreenshotProcessing } from '../activation/maplibre-local-render-fixture'

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8')) as {
  scripts: Record<string, string>
  dependencies: Record<string, string>
}
const fixtureData = buildLocalMapFixtureData()
const syntheticRenderMetadata: MapLibreRenderMetadata = {
  pageTitle: 'ReeditPro generated map fixture',
  readyMarkerObserved: true,
  mapLibreVersion: packageJson.dependencies['maplibre-gl'],
  playwrightVersion: packageJson.dependencies.playwright,
  viewport: mapLibreLocalRenderConfig.viewport,
  renderMetadata: {
    sourceCount: Object.keys(fixtureData.style.sources).length,
    layerCount: fixtureData.style.layers.length,
    pointCount: fixtureData.fixture.points.features.length,
    routeCount: fixtureData.fixture.routes.features.length,
    polygonCount: fixtureData.fixture.polygons.features.length,
    bounds: [-73.994, 40.728, -73.966, 40.748],
    center: [-73.98, 40.738],
    labelsRenderedAsHtmlOverlay: true,
  },
  screenshotPath: '/tmp/reeditpro-phase50c-smoke.png',
  screenshotDimensions: { width: 1280, height: 720 },
  capturedAt: new Date().toISOString(),
}
const syntheticSharpProcessing: SharpMapScreenshotProcessing = {
  inputPath: syntheticRenderMetadata.screenshotPath,
  original: { path: syntheticRenderMetadata.screenshotPath, width: 1280, height: 720, format: 'png', sizeBytes: 1000, sha256: 'synthetic' },
  preview: { path: '/tmp/reeditpro-phase50c-preview.png', width: 960, height: 540, format: 'png', sizeBytes: 800, sha256: 'synthetic-preview' },
  thumbnail: { path: '/tmp/reeditpro-phase50c-thumbnail.png', width: 320, height: 180, format: 'png', sizeBytes: 400, sha256: 'synthetic-thumbnail' },
  processedAt: new Date().toISOString(),
  sharpVersion: packageJson.dependencies.sharp,
  remoteImagesFetched: false,
}
const qa = buildMapLibreLocalRenderQaSummary({
  phase50bEvidencePresent: true,
  fixture: fixtureData.fixture,
  style: fixtureData.style,
  styleValidation: fixtureData.styleValidation,
  renderMetadata: syntheticRenderMetadata,
  networkRequestsObserved: [
    evaluateMapLibreNetworkRequest('http://127.0.0.1:4000/generated-map-page.html', 'GET', 'document', 'http://127.0.0.1:4000'),
    evaluateMapLibreNetworkRequest('blob:http://127.0.0.1:4000/worker', 'GET', 'script', 'http://127.0.0.1:4000'),
  ],
  externalNetworkRequestsObserved: [],
  sharpProcessing: syntheticSharpProcessing,
  publicAccessBlocked: true,
})
const report = buildMapLibreLocalRenderReport()
const commandPlan = buildMapLibreLocalRenderCommandPlan()
const iamPlan = buildMapLibreLocalRenderIamPlan()

assert.equal(mapLibreLocalRenderConfig.phase, '50C')
assert.equal(mapLibreLocalRenderConfig.mode, 'maplibre_local_offline_render_capture_fixture')
assert.equal(mapLibreLocalRenderConfig.approvedPhase50BRunId, 'phase50b-20260604T01114')
assert.equal(mapLibreLocalRenderSafetyFlags.mapLibreBrowserRuntimeAllowed, true)
assert.equal(mapLibreLocalRenderSafetyFlags.mapRenderingAllowed, true)
assert.equal(mapLibreLocalRenderSafetyFlags.playwrightCaptureAllowed, true)
assert.equal(mapLibreLocalRenderSafetyFlags.externalNetworkRequestsAllowed, false)
assert.equal(mapLibreLocalRenderSafetyFlags.tileDownloadAllowed, false)
assert.equal(mapLibreLocalRenderSafetyFlags.liveTileProviderAllowed, false)
assert.equal(mapLibreLocalRenderSafetyFlags.publicOsmTileAllowed, false)
assert.equal(mapLibreLocalRenderSafetyFlags.geocodingAllowed, false)
assert.equal(mapLibreLocalRenderSafetyFlags.routingAllowed, false)
assert.equal(mapLibreLocalRenderSafetyFlags.paidMapProviderAllowed, false)
assert.equal(mapLibreLocalRenderSafetyFlags.deckGlRuntimeAllowed, false)
assert.equal(mapLibreLocalRenderSafetyFlags.cesiumJsRuntimeAllowed, false)
assert.equal(mapLibreLocalRenderSafetyFlags.productionReadyAllowed, false)
assert.equal(mapLibreLocalRenderSafetyFlags.externalBetaAllowed, false)
assert.equal(mapLibreLocalRenderSafetyFlags.broadMediaAllowed, false)

assert.equal(fixtureData.source, 'phase50b_generated_fixture_code')
assert.equal(fixtureData.fixture.generatedFixture, true)
assert.equal(fixtureData.fixture.realWorldVerified, false)
assert.equal(fixtureData.fixture.userLocationUsed, false)
assert.equal(fixtureData.fixture.combined.features.every((feature) => feature.properties.captureAllowed === false), true)
assert.equal(Object.keys(fixtureData.style.sources).length, 3)
assert.equal(fixtureData.style.layers.length >= 5, true)
assert.equal(fixtureData.style.layers.every((layer) => String(layer.type) !== 'symbol'), true)
assert.equal('glyphs' in fixtureData.style, false)
assert.equal('sprite' in fixtureData.style, false)
assert.equal(fixtureData.styleValidation.noRemoteTileGlyphSpriteImageUrls, true)
assert.equal(fixtureData.styleValidation.noPaidProviderUrls, true)
assert.equal(fixtureData.styleValidation.noSymbolLayers, true)
assert.equal(fixtureData.styleValidation.blockers.length, 0)

const forbidden = findForbiddenMapNetworkRequests([
  evaluateMapLibreNetworkRequest('https://tile.openstreetmap.org/0/0/0.png', 'GET', 'image', 'http://127.0.0.1:4000'),
  evaluateMapLibreNetworkRequest('https://api.mapbox.com/styles/v1/example', 'GET', 'fetch', 'http://127.0.0.1:4000'),
])
assert.equal(forbidden.length, 2)

assert.equal(qa.status, 'passed')
for (const gateId of ['phase50b_evidence', 'generated_geojson_integrity', 'local_style_integrity', 'maplibre_local_render', 'network_guard', 'playwright_capture', 'optional_screenshot_processing', 'artifact_privacy', 'blocked_features']) {
  assert.equal(qa.gates.some((gate) => gate.gateId === gateId && gate.passed), true, `Missing passing QA gate ${gateId}`)
}

assert.equal(report.reportId, 'activation-phase-50c-maplibre-local-render-fixture')
assert.equal(report.liveTileProviderAllowed, false)
assert.equal(report.tileDownloadAllowed, false)
assert.equal(report.geocodingAllowed, false)
assert.equal(report.routingAllowed, false)
assert.equal(report.paidMapProviderAllowed, false)
assert.equal(commandPlan.defaultMode, 'static_report_only')
assert.equal(commandPlan.blockedAlways.includes('live tiles'), true)
assert.equal(commandPlan.blockedAlways.includes('public OSM tiles'), true)
assert.equal(commandPlan.blockedAlways.includes('geocoding APIs'), true)
assert.equal(commandPlan.blockedAlways.includes('deck.gl runtime'), true)
assert.equal(iamPlan.defaultMutationRequired, false)
assert.equal(iamPlan.forbidden.includes('allUsers'), true)
assert.equal(iamPlan.forbidden.includes('allAuthenticatedUsers'), true)

for (const script of mapLibreLocalRenderRequiredScripts) {
  assert.equal(packageJson.scripts[script] !== undefined, true, `Missing package script ${script}`)
}
assert.equal(packageJson.dependencies['maplibre-gl'] !== undefined, true, 'maplibre-gl must be installed for Phase 50C local render proof.')
assert.equal(packageJson.dependencies['@turf/turf'] !== undefined, true, '@turf/turf must remain available from Phase 50B.')
assert.equal(packageJson.dependencies.playwright !== undefined, true, 'playwright must be available for Phase 50C capture.')
assert.equal(packageJson.dependencies.sharp !== undefined, true, 'sharp must be available for Phase 50C screenshot processing.')
for (const docPath of mapLibreLocalRenderRequiredDocs) {
  assert.equal(fs.existsSync(docPath), true, `Missing doc ${docPath}`)
}

console.log('Phase 50C MapLibre local render + capture fixture smoke passed.')
