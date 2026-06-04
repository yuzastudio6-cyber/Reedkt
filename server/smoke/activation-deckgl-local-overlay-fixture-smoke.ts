import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  buildDeckGlLocalOverlayCommandPlan,
  buildDeckGlLocalOverlayFixtureData,
  buildDeckGlLocalOverlayIamPlan,
  buildDeckGlLocalOverlayQaSummary,
  buildDeckGlLocalOverlayReport,
  deckGlLocalOverlayConfig,
  deckGlLocalOverlayRequiredDocs,
  deckGlLocalOverlayRequiredScripts,
  deckGlLocalOverlaySafetyFlags,
  evaluateDeckGlNetworkRequest,
  findForbiddenDeckGlNetworkRequests,
} from '../activation/deckgl-local-overlay-fixture'
import type { DeckGlRenderMetadata, SharpDeckGlScreenshotProcessing } from '../activation/deckgl-local-overlay-fixture'

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8')) as {
  scripts: Record<string, string>
  dependencies: Record<string, string>
}
const fixtureData = buildDeckGlLocalOverlayFixtureData()
const syntheticRenderMetadata: DeckGlRenderMetadata = {
  pageTitle: 'ReeditPro deck.gl local overlay fixture',
  readyMarkerObserved: true,
  mapLibreVersion: packageJson.dependencies['maplibre-gl'],
  deckGlVersion: packageJson.dependencies['@deck.gl/core'],
  playwrightVersion: packageJson.dependencies.playwright,
  viewport: deckGlLocalOverlayConfig.viewport,
  renderMetadata: {
    mapLibreSourceCount: Object.keys(fixtureData.style.sources).length,
    mapLibreLayerCount: fixtureData.style.layers.length,
    deckGlLayerCount: fixtureData.layerManifest.layers.length,
    pointCount: fixtureData.overlayData.points.length,
    pathCount: fixtureData.overlayData.paths.length,
    polygonCount: fixtureData.overlayData.polygons.length,
    arcCount: fixtureData.overlayData.arcs.length,
    bounds: [-73.994, 40.728, -73.966, 40.748],
    center: [-73.98, 40.738],
    labelsRenderedAsHtmlOverlay: true,
    mapboxOverlayAttached: true,
  },
  screenshotPath: '/tmp/reeditpro-phase50d-smoke.png',
  screenshotDimensions: { width: 1280, height: 720 },
  capturedAt: new Date().toISOString(),
}
const syntheticSharpProcessing: SharpDeckGlScreenshotProcessing = {
  inputPath: syntheticRenderMetadata.screenshotPath,
  original: { path: syntheticRenderMetadata.screenshotPath, width: 1280, height: 720, format: 'png', sizeBytes: 1000, sha256: 'synthetic' },
  preview: { path: '/tmp/reeditpro-phase50d-preview.png', width: 960, height: 540, format: 'png', sizeBytes: 800, sha256: 'synthetic-preview' },
  thumbnail: { path: '/tmp/reeditpro-phase50d-thumbnail.png', width: 320, height: 180, format: 'png', sizeBytes: 400, sha256: 'synthetic-thumbnail' },
  processedAt: new Date().toISOString(),
  sharpVersion: packageJson.dependencies.sharp,
  remoteImagesFetched: false,
}
const qa = buildDeckGlLocalOverlayQaSummary({
  phase50cEvidencePresent: true,
  fixture: fixtureData.fixture,
  style: fixtureData.style,
  styleValidation: fixtureData.styleValidation,
  overlayData: fixtureData.overlayData,
  layerManifest: fixtureData.layerManifest,
  renderMetadata: syntheticRenderMetadata,
  networkRequestsObserved: [
    evaluateDeckGlNetworkRequest('http://127.0.0.1:4000/generated-deckgl-map-page.html', 'GET', 'document', 'http://127.0.0.1:4000'),
    evaluateDeckGlNetworkRequest('http://127.0.0.1:4000/vendor/deck-core.min.js', 'GET', 'script', 'http://127.0.0.1:4000'),
    evaluateDeckGlNetworkRequest('blob:http://127.0.0.1:4000/worker', 'GET', 'script', 'http://127.0.0.1:4000'),
  ],
  externalNetworkRequestsObserved: [],
  sharpProcessing: syntheticSharpProcessing,
  publicAccessBlocked: true,
})
const report = buildDeckGlLocalOverlayReport()
const commandPlan = buildDeckGlLocalOverlayCommandPlan()
const iamPlan = buildDeckGlLocalOverlayIamPlan()

assert.equal(deckGlLocalOverlayConfig.phase, '50D')
assert.equal(deckGlLocalOverlayConfig.mode, 'deckgl_local_offline_overlay_fixture')
assert.equal(deckGlLocalOverlayConfig.approvedPhase50CRunId, 'phase50c-20260604T020852')
assert.equal(deckGlLocalOverlaySafetyFlags.mapLibreBrowserRuntimeAllowed, true)
assert.equal(deckGlLocalOverlaySafetyFlags.deckGlRuntimeAllowed, true)
assert.equal(deckGlLocalOverlaySafetyFlags.deckGlRuntimeScope, 'generated_local_overlay_fixture_only')
assert.equal(deckGlLocalOverlaySafetyFlags.playwrightCaptureAllowed, true)
assert.equal(deckGlLocalOverlaySafetyFlags.externalNetworkRequestsAllowed, false)
assert.equal(deckGlLocalOverlaySafetyFlags.tileDownloadAllowed, false)
assert.equal(deckGlLocalOverlaySafetyFlags.liveTileProviderAllowed, false)
assert.equal(deckGlLocalOverlaySafetyFlags.publicOsmTileAllowed, false)
assert.equal(deckGlLocalOverlaySafetyFlags.mapboxProviderAllowed, false)
assert.equal(deckGlLocalOverlaySafetyFlags.geocodingAllowed, false)
assert.equal(deckGlLocalOverlaySafetyFlags.routingAllowed, false)
assert.equal(deckGlLocalOverlaySafetyFlags.paidMapProviderAllowed, false)
assert.equal(deckGlLocalOverlaySafetyFlags.cesiumJsRuntimeAllowed, false)
assert.equal(deckGlLocalOverlaySafetyFlags.d3RuntimeAllowed, false)
assert.equal(deckGlLocalOverlaySafetyFlags.threeJsRuntimeAllowed, false)
assert.equal(deckGlLocalOverlaySafetyFlags.productionReadyAllowed, false)
assert.equal(deckGlLocalOverlaySafetyFlags.externalBetaAllowed, false)
assert.equal(deckGlLocalOverlaySafetyFlags.broadMediaAllowed, false)

assert.equal(fixtureData.source, 'phase50b_generated_fixture_code')
assert.equal(fixtureData.fixture.generatedFixture, true)
assert.equal(fixtureData.overlayData.generatedFixture, true)
assert.equal(fixtureData.overlayData.realWorldVerified, false)
assert.equal(fixtureData.overlayData.routingUsed, false)
assert.equal(fixtureData.overlayData.points.length >= 5, true)
assert.equal(fixtureData.overlayData.arcs.length >= 1, true)
assert.equal(fixtureData.layerManifest.layers.length, 4)
assert.equal(fixtureData.layerManifest.layers.some((layer) => layer.type === 'ScatterplotLayer'), true)
assert.equal(fixtureData.layerManifest.layers.some((layer) => layer.type === 'PathLayer'), true)
assert.equal(fixtureData.layerManifest.layers.some((layer) => layer.type === 'PolygonLayer'), true)
assert.equal(fixtureData.layerManifest.layers.some((layer) => layer.type === 'ArcLayer'), true)
assert.equal(fixtureData.layerManifest.heatmapLayerDeferred, true)
assert.equal(fixtureData.layerManifest.validation.blockers.length, 0)
assert.equal(fixtureData.styleValidation.noRemoteTileGlyphSpriteImageUrls, true)
assert.equal(fixtureData.styleValidation.noPaidProviderUrls, true)
assert.equal(fixtureData.styleValidation.noSymbolLayers, true)

const forbidden = findForbiddenDeckGlNetworkRequests([
  evaluateDeckGlNetworkRequest('https://tile.openstreetmap.org/0/0/0.png', 'GET', 'image', 'http://127.0.0.1:4000'),
  evaluateDeckGlNetworkRequest('https://api.mapbox.com/styles/v1/example', 'GET', 'fetch', 'http://127.0.0.1:4000'),
  evaluateDeckGlNetworkRequest('https://nominatim.openstreetmap.org/search?q=test', 'GET', 'fetch', 'http://127.0.0.1:4000'),
])
assert.equal(forbidden.length, 3)

assert.equal(qa.status, 'passed')
for (const gateId of ['phase50c_evidence', 'generated_overlay_data_integrity', 'local_style_integrity', 'deckgl_overlay_render', 'maplibre_base_render', 'network_guard', 'playwright_capture', 'optional_screenshot_processing', 'artifact_privacy', 'blocked_features']) {
  assert.equal(qa.gates.some((gate) => gate.gateId === gateId && gate.passed), true, `Missing passing QA gate ${gateId}`)
}

assert.equal(report.reportId, 'activation-phase-50d-deckgl-local-overlay-fixture')
assert.equal(report.deckGlRuntimeAllowed, true)
assert.equal(report.deckGlRuntimeScope, 'generated_local_overlay_fixture_only')
assert.equal(report.liveTileProviderAllowed, false)
assert.equal(report.tileDownloadAllowed, false)
assert.equal(report.geocodingAllowed, false)
assert.equal(report.routingAllowed, false)
assert.equal(report.paidMapProviderAllowed, false)
assert.equal(report.cesiumJsRuntimeAllowed, false)
assert.equal(report.d3RuntimeAllowed, false)
assert.equal(report.threeJsRuntimeAllowed, false)
assert.equal(commandPlan.defaultMode, 'static_report_only')
assert.equal(commandPlan.blockedAlways.includes('live tiles'), true)
assert.equal(commandPlan.blockedAlways.includes('public OSM tiles'), true)
assert.equal(commandPlan.blockedAlways.includes('geocoding APIs'), true)
assert.equal(commandPlan.blockedAlways.includes('CesiumJS runtime'), true)
assert.equal(commandPlan.blockedAlways.includes('D3 runtime'), true)
assert.equal(commandPlan.blockedAlways.includes('Three.js runtime'), true)
assert.equal(iamPlan.defaultMutationRequired, false)
assert.equal(iamPlan.forbidden.includes('allUsers'), true)
assert.equal(iamPlan.forbidden.includes('allAuthenticatedUsers'), true)

for (const script of deckGlLocalOverlayRequiredScripts) {
  assert.equal(packageJson.scripts[script] !== undefined, true, `Missing package script ${script}`)
}
assert.equal(packageJson.dependencies['maplibre-gl'] !== undefined, true, 'maplibre-gl must remain available from Phase 50C.')
assert.equal(packageJson.dependencies['@deck.gl/core'] !== undefined, true, '@deck.gl/core must be installed for Phase 50D.')
assert.equal(packageJson.dependencies['@deck.gl/layers'] !== undefined, true, '@deck.gl/layers must be installed for Phase 50D.')
assert.equal(packageJson.dependencies['@deck.gl/mapbox'] !== undefined, true, '@deck.gl/mapbox must be installed for Phase 50D MapboxOverlay integration.')
assert.equal(packageJson.dependencies.playwright !== undefined, true, 'playwright must be available for Phase 50D capture.')
assert.equal(packageJson.dependencies.sharp !== undefined, true, 'sharp must be available for Phase 50D screenshot processing.')
assert.equal(packageJson.dependencies['d3'] === undefined, true, 'D3 must not be installed by Phase 50D.')
assert.equal(packageJson.dependencies['three'] === undefined, true, 'Three.js must not be installed by Phase 50D.')
assert.equal(packageJson.dependencies['cesium'] === undefined, true, 'CesiumJS must not be installed by Phase 50D.')
for (const docPath of deckGlLocalOverlayRequiredDocs) {
  assert.equal(fs.existsSync(docPath), true, `Missing doc ${docPath}`)
}

console.log('Phase 50D deck.gl local overlay fixture smoke passed.')
