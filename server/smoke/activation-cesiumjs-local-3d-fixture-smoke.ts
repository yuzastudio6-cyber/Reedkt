import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  buildCesiumJsLocal3DCommandPlan,
  buildCesiumJsLocal3DFixtureData,
  buildCesiumJsLocal3DIamPlan,
  buildCesiumJsLocal3DQaSummary,
  buildCesiumJsLocal3DReport,
  cesiumJsLocal3DConfig,
  cesiumJsLocal3DRequiredDocs,
  cesiumJsLocal3DRequiredScripts,
  cesiumJsLocal3DSafetyFlags,
  evaluateCesiumNetworkRequest,
  findForbiddenCesiumNetworkRequests,
} from '../activation/cesiumjs-local-3d-fixture'
import type { CesiumRenderMetadata, SharpCesiumScreenshotProcessing } from '../activation/cesiumjs-local-3d-fixture'

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8')) as {
  scripts: Record<string, string>
  dependencies: Record<string, string>
}
const fixtureData = buildCesiumJsLocal3DFixtureData()
const syntheticRenderMetadata: CesiumRenderMetadata = {
  pageTitle: 'ReeditPro CesiumJS local 3D planning fixture',
  readyMarkerObserved: true,
  cesiumVersion: packageJson.dependencies.cesium,
  playwrightVersion: packageJson.dependencies.playwright,
  viewport: cesiumJsLocal3DConfig.viewport,
  renderMetadata: {
    cesiumEntityCount: fixtureData.planningData.entityCount,
    pointCount: fixtureData.planningData.points.length,
    routeCount: fixtureData.planningData.routes.length,
    polygonCount: fixtureData.planningData.polygons.length,
    verticalMarkerCount: fixtureData.planningData.verticalMarkers.length,
    cameraPosition: { longitudeDegrees: -73.9803, latitudeDegrees: 40.7379, heightMeters: 6800 },
    cameraHeadingPitchRollDegrees: { heading: 28, pitch: -48, roll: 0 },
    cesiumIonTokenEmpty: true,
    baseLayerDisabled: true,
    ellipsoidTerrainUsed: true,
  },
  screenshotPath: '/tmp/reeditpro-phase50e-smoke.png',
  screenshotDimensions: { width: 1280, height: 720 },
  capturedAt: new Date().toISOString(),
}
const syntheticSharpProcessing: SharpCesiumScreenshotProcessing = {
  inputPath: syntheticRenderMetadata.screenshotPath,
  original: { path: syntheticRenderMetadata.screenshotPath, width: 1280, height: 720, format: 'png', sizeBytes: 1000, sha256: 'synthetic' },
  preview: { path: '/tmp/reeditpro-phase50e-preview.png', width: 960, height: 540, format: 'png', sizeBytes: 800, sha256: 'synthetic-preview' },
  thumbnail: { path: '/tmp/reeditpro-phase50e-thumbnail.png', width: 320, height: 180, format: 'png', sizeBytes: 400, sha256: 'synthetic-thumbnail' },
  processedAt: new Date().toISOString(),
  sharpVersion: packageJson.dependencies.sharp,
  remoteImagesFetched: false,
}
const qa = buildCesiumJsLocal3DQaSummary({
  phase50dEvidencePresent: true,
  fixture: fixtureData.fixture,
  planningData: fixtureData.planningData,
  sceneConfig: fixtureData.sceneConfig,
  renderMetadata: syntheticRenderMetadata,
  networkRequestsObserved: [
    evaluateCesiumNetworkRequest('http://127.0.0.1:4000/generated-cesium-3d-page.html', 'GET', 'document', 'http://127.0.0.1:4000'),
    evaluateCesiumNetworkRequest('http://127.0.0.1:4000/vendor/cesium/Cesium.js', 'GET', 'script', 'http://127.0.0.1:4000'),
    evaluateCesiumNetworkRequest('blob:http://127.0.0.1:4000/worker', 'GET', 'script', 'http://127.0.0.1:4000'),
  ],
  externalNetworkRequestsObserved: [],
  sharpProcessing: syntheticSharpProcessing,
  publicAccessBlocked: true,
})
const report = buildCesiumJsLocal3DReport()
const commandPlan = buildCesiumJsLocal3DCommandPlan()
const iamPlan = buildCesiumJsLocal3DIamPlan()

assert.equal(cesiumJsLocal3DConfig.phase, '50E')
assert.equal(cesiumJsLocal3DConfig.mode, 'cesiumjs_local_offline_3d_planning_fixture')
assert.equal(cesiumJsLocal3DConfig.approvedPhase50DRunId, 'phase50d-20260604T030406')
assert.equal(cesiumJsLocal3DSafetyFlags.cesiumJsRuntimeAllowed, true)
assert.equal(cesiumJsLocal3DSafetyFlags.cesiumJsRuntimeScope, 'generated_local_offline_3d_planning_fixture_only')
assert.equal(cesiumJsLocal3DSafetyFlags.cesiumIonAllowed, false)
assert.equal(cesiumJsLocal3DSafetyFlags.cesiumIonTokenAllowed, false)
assert.equal(cesiumJsLocal3DSafetyFlags.liveImageryProviderAllowed, false)
assert.equal(cesiumJsLocal3DSafetyFlags.liveTerrainProviderAllowed, false)
assert.equal(cesiumJsLocal3DSafetyFlags.threeDTilesAllowed, false)
assert.equal(cesiumJsLocal3DSafetyFlags.externalNetworkRequestsAllowed, false)
assert.equal(cesiumJsLocal3DSafetyFlags.tileDownloadAllowed, false)
assert.equal(cesiumJsLocal3DSafetyFlags.publicOsmTileAllowed, false)
assert.equal(cesiumJsLocal3DSafetyFlags.mapboxProviderAllowed, false)
assert.equal(cesiumJsLocal3DSafetyFlags.geocodingAllowed, false)
assert.equal(cesiumJsLocal3DSafetyFlags.routingAllowed, false)
assert.equal(cesiumJsLocal3DSafetyFlags.paidMapProviderAllowed, false)
assert.equal(cesiumJsLocal3DSafetyFlags.deckGlRuntimeAllowed, false)
assert.equal(cesiumJsLocal3DSafetyFlags.d3RuntimeAllowed, false)
assert.equal(cesiumJsLocal3DSafetyFlags.threeJsRuntimeAllowed, false)
assert.equal(cesiumJsLocal3DSafetyFlags.productionReadyAllowed, false)
assert.equal(cesiumJsLocal3DSafetyFlags.externalBetaAllowed, false)
assert.equal(cesiumJsLocal3DSafetyFlags.broadMediaAllowed, false)

assert.equal(fixtureData.source, 'phase50b_generated_fixture_code')
assert.equal(fixtureData.fixture.generatedFixture, true)
assert.equal(fixtureData.planningData.generatedFixture, true)
assert.equal(fixtureData.planningData.realWorldVerified, false)
assert.equal(fixtureData.planningData.userLocationUsed, false)
assert.equal(fixtureData.planningData.geocodingUsed, false)
assert.equal(fixtureData.planningData.routingUsed, false)
assert.equal(fixtureData.planningData.entityCount <= cesiumJsLocal3DConfig.maxCesiumEntities, true)
assert.equal(fixtureData.sceneConfig.cesiumIonAccessToken, '')
assert.equal(fixtureData.sceneConfig.baseLayer, false)
assert.equal(fixtureData.sceneConfig.terrainProvider, 'EllipsoidTerrainProvider')
assert.equal(fixtureData.sceneConfig.imageryProvider, 'none')
assert.equal(fixtureData.sceneConfig.threeDTiles, false)
assert.equal(fixtureData.sceneConfig.validation.blockers.length, 0)

const forbidden = findForbiddenCesiumNetworkRequests([
  evaluateCesiumNetworkRequest('https://api.cesium.com/v1/assets', 'GET', 'fetch', 'http://127.0.0.1:4000'),
  evaluateCesiumNetworkRequest('https://tile.openstreetmap.org/0/0/0.png', 'GET', 'image', 'http://127.0.0.1:4000'),
  evaluateCesiumNetworkRequest('https://nominatim.openstreetmap.org/search?q=test', 'GET', 'fetch', 'http://127.0.0.1:4000'),
])
assert.equal(forbidden.length, 3)

assert.equal(qa.status, 'passed')
for (const gateId of ['phase50d_evidence', 'generated_3d_data_integrity', 'cesium_local_scene', 'cesium_render', 'network_guard', 'playwright_capture', 'optional_screenshot_processing', 'artifact_privacy', 'blocked_features']) {
  assert.equal(qa.gates.some((gate) => gate.gateId === gateId && gate.passed), true, `Missing passing QA gate ${gateId}`)
}

assert.equal(report.reportId, 'activation-phase-50e-cesiumjs-local-3d-fixture')
assert.equal(report.cesiumJsRuntimeAllowed, true)
assert.equal(report.cesiumJsRuntimeScope, 'generated_local_offline_3d_planning_fixture_only')
assert.equal(report.cesiumIonAllowed, false)
assert.equal(report.liveImageryProviderAllowed, false)
assert.equal(report.liveTerrainProviderAllowed, false)
assert.equal(report.threeDTilesAllowed, false)
assert.equal(report.tileDownloadAllowed, false)
assert.equal(report.geocodingAllowed, false)
assert.equal(report.routingAllowed, false)
assert.equal(report.paidMapProviderAllowed, false)
assert.equal(report.deckGlRuntimeAllowed, false)
assert.equal(report.d3RuntimeAllowed, false)
assert.equal(report.threeJsRuntimeAllowed, false)
assert.equal(commandPlan.defaultMode, 'static_report_only')
assert.equal(commandPlan.blockedAlways.includes('Cesium ion'), true)
assert.equal(commandPlan.blockedAlways.includes('live terrain'), true)
assert.equal(commandPlan.blockedAlways.includes('3D Tiles'), true)
assert.equal(commandPlan.blockedAlways.includes('geocoding APIs'), true)
assert.equal(commandPlan.blockedAlways.includes('D3 runtime'), true)
assert.equal(commandPlan.blockedAlways.includes('Three.js runtime'), true)
assert.equal(iamPlan.defaultMutationRequired, false)
assert.equal(iamPlan.forbidden.includes('allUsers'), true)
assert.equal(iamPlan.forbidden.includes('allAuthenticatedUsers'), true)

for (const script of cesiumJsLocal3DRequiredScripts) {
  assert.equal(packageJson.scripts[script] !== undefined, true, `Missing package script ${script}`)
}
assert.equal(packageJson.dependencies.cesium !== undefined, true, 'cesium must be installed for Phase 50E.')
assert.equal(packageJson.dependencies.playwright !== undefined, true, 'playwright must be available for Phase 50E capture.')
assert.equal(packageJson.dependencies.sharp !== undefined, true, 'sharp must be available for Phase 50E screenshot processing.')
assert.equal(packageJson.dependencies['d3'] === undefined, true, 'D3 must not be installed by Phase 50E.')
assert.equal(packageJson.dependencies['three'] === undefined, true, 'Three.js must not be installed by Phase 50E.')
for (const docPath of cesiumJsLocal3DRequiredDocs) {
  assert.equal(fs.existsSync(docPath), true, `Missing doc ${docPath}`)
}

console.log('Phase 50E CesiumJS local 3D fixture smoke passed.')
