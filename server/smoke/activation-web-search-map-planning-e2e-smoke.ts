import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  buildGeneratedPlanningSourceRecords,
  buildWebSearchDeckGlPlanningOverlay,
  buildWebSearchMapPlanningCommandPlan,
  buildWebSearchMapPlanningGeoJson,
  buildWebSearchMapPlanningIamPlan,
  buildWebSearchMapPlanningQaSummary,
  buildWebSearchMapPlanningReport,
  buildCesiumPlanningData,
  buildCesiumSceneConfig,
  normalizePlanningSourcesToLocationCandidates,
  resolveWebSearchMapPlanningEvidenceChain,
  runWebSearchMapPlanningTurfCalculations,
  webSearchMapPlanningConfig,
  webSearchMapPlanningRequiredDocs,
  webSearchMapPlanningRequiredScripts,
  webSearchMapPlanningSafetyFlags,
} from '../activation/web-search-map-planning-e2e'
import { buildMapLibreLocalStyle, evaluateMapLibreNetworkRequest, findForbiddenMapNetworkRequests, validateMapLibreLocalStyle } from '../activation/maplibre-local-render-fixture'
import type { CesiumRenderMetadata, SharpCesiumScreenshotProcessing } from '../activation/cesiumjs-local-3d-fixture'
import type { DeckGlRenderMetadata, SharpDeckGlScreenshotProcessing } from '../activation/deckgl-local-overlay-fixture'

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { scripts: Record<string, string>; dependencies: Record<string, string> }
const evidenceChain = resolveWebSearchMapPlanningEvidenceChain()
const sources = buildGeneratedPlanningSourceRecords()
const candidates = normalizePlanningSourcesToLocationCandidates(sources)
const geojson = buildWebSearchMapPlanningGeoJson(candidates)
const turfCalculations = runWebSearchMapPlanningTurfCalculations(geojson)
const style = buildMapLibreLocalStyle(geojson.fixture)
const styleValidation = validateMapLibreLocalStyle(style)
const overlay = buildWebSearchDeckGlPlanningOverlay(geojson)
const cesiumPlanningData = buildCesiumPlanningData(geojson)
const cesiumSceneConfig = buildCesiumSceneConfig(cesiumPlanningData)
const synthetic2DRender: DeckGlRenderMetadata = {
  pageTitle: 'ReeditPro deck.gl local overlay fixture',
  readyMarkerObserved: true,
  mapLibreVersion: packageJson.dependencies['maplibre-gl'],
  deckGlVersion: packageJson.dependencies['@deck.gl/core'],
  playwrightVersion: packageJson.dependencies.playwright,
  viewport: webSearchMapPlanningConfig.viewport,
  renderMetadata: {
    mapLibreSourceCount: 3,
    mapLibreLayerCount: 5,
    deckGlLayerCount: overlay.layerManifest.layers.length,
    pointCount: overlay.overlayData.points.length,
    pathCount: overlay.overlayData.paths.length,
    polygonCount: overlay.overlayData.polygons.length,
    arcCount: overlay.overlayData.arcs.length,
    bounds: [-73.994, 40.728, -73.966, 40.748],
    center: [-73.98, 40.738],
    labelsRenderedAsHtmlOverlay: true,
    mapboxOverlayAttached: true,
  },
  screenshotPath: '/tmp/reeditpro-phase50f-2d-smoke.png',
  screenshotDimensions: { width: 1280, height: 720 },
  capturedAt: new Date().toISOString(),
}
const synthetic3DRender: CesiumRenderMetadata = {
  pageTitle: 'ReeditPro CesiumJS local 3D planning fixture',
  readyMarkerObserved: true,
  cesiumVersion: packageJson.dependencies.cesium,
  playwrightVersion: packageJson.dependencies.playwright,
  viewport: webSearchMapPlanningConfig.viewport,
  renderMetadata: {
    cesiumEntityCount: cesiumPlanningData.entityCount,
    pointCount: cesiumPlanningData.points.length,
    routeCount: cesiumPlanningData.routes.length,
    polygonCount: cesiumPlanningData.polygons.length,
    verticalMarkerCount: cesiumPlanningData.verticalMarkers.length,
    cameraPosition: { longitudeDegrees: -73.9803, latitudeDegrees: 40.7379, heightMeters: 3200 },
    cameraHeadingPitchRollDegrees: { heading: 28, pitch: -68, roll: 0 },
    cesiumIonTokenEmpty: true,
    baseLayerDisabled: true,
    ellipsoidTerrainUsed: true,
  },
  screenshotPath: '/tmp/reeditpro-phase50f-3d-smoke.png',
  screenshotDimensions: { width: 1280, height: 720 },
  capturedAt: new Date().toISOString(),
}
const synthetic2DSharp: SharpDeckGlScreenshotProcessing = {
  inputPath: synthetic2DRender.screenshotPath,
  original: { path: synthetic2DRender.screenshotPath, width: 1280, height: 720, format: 'png', sizeBytes: 1000, sha256: 'synthetic' },
  preview: { path: '/tmp/reeditpro-phase50f-2d-preview.png', width: 960, height: 540, format: 'png', sizeBytes: 800, sha256: 'synthetic-preview' },
  thumbnail: { path: '/tmp/reeditpro-phase50f-2d-thumbnail.png', width: 320, height: 180, format: 'png', sizeBytes: 400, sha256: 'synthetic-thumbnail' },
  processedAt: new Date().toISOString(),
  sharpVersion: packageJson.dependencies.sharp,
  remoteImagesFetched: false,
}
const synthetic3DSharp: SharpCesiumScreenshotProcessing = {
  inputPath: synthetic3DRender.screenshotPath,
  original: { path: synthetic3DRender.screenshotPath, width: 1280, height: 720, format: 'png', sizeBytes: 1000, sha256: 'synthetic' },
  preview: { path: '/tmp/reeditpro-phase50f-3d-preview.png', width: 960, height: 540, format: 'png', sizeBytes: 800, sha256: 'synthetic-preview' },
  thumbnail: { path: '/tmp/reeditpro-phase50f-3d-thumbnail.png', width: 320, height: 180, format: 'png', sizeBytes: 400, sha256: 'synthetic-thumbnail' },
  processedAt: new Date().toISOString(),
  sharpVersion: packageJson.dependencies.sharp,
  remoteImagesFetched: false,
}
const qa = buildWebSearchMapPlanningQaSummary({
  evidenceChain,
  planningSources: sources,
  locationCandidates: candidates,
  geojson,
  turfCalculations,
  map2D: {
    style,
    styleValidation,
    overlayData: overlay.overlayData,
    layerManifest: overlay.layerManifest,
    renderMetadata: synthetic2DRender,
    networkRequestsObserved: [evaluateMapLibreNetworkRequest('http://127.0.0.1:4000/generated-deckgl-map-page.html', 'GET', 'document', 'http://127.0.0.1:4000')],
    externalNetworkRequestsObserved: [],
    sharpProcessing: synthetic2DSharp,
  },
  map3D: {
    planningData: cesiumPlanningData,
    sceneConfig: cesiumSceneConfig,
    renderMetadata: synthetic3DRender,
    networkRequestsObserved: [],
    externalNetworkRequestsObserved: [],
    sharpProcessing: synthetic3DSharp,
  },
  publicAccessBlocked: true,
})
const report = buildWebSearchMapPlanningReport()
const commandPlan = buildWebSearchMapPlanningCommandPlan()
const iamPlan = buildWebSearchMapPlanningIamPlan()

assert.equal(webSearchMapPlanningConfig.phase, '50F')
assert.equal(webSearchMapPlanningConfig.mode, 'web_search_map_planning_private_e2e')
assert.equal(webSearchMapPlanningConfig.canonicalPhase49PRunId, 'phase49p-20260603T21361')
assert.equal(webSearchMapPlanningConfig.canonicalPhase50ERunId, 'phase50e-20260604T130326')
assert.equal(webSearchMapPlanningSafetyFlags.liveSearchAllowed, false)
assert.equal(webSearchMapPlanningSafetyFlags.locationCandidatesGeneratedOnly, true)
assert.equal(webSearchMapPlanningSafetyFlags.liveGeocodingAllowed, false)
assert.equal(webSearchMapPlanningSafetyFlags.liveRoutingAllowed, false)
assert.equal(webSearchMapPlanningSafetyFlags.tileDownloadAllowed, false)
assert.equal(webSearchMapPlanningSafetyFlags.publicOsmTileAllowed, false)
assert.equal(webSearchMapPlanningSafetyFlags.paidMapProviderAllowed, false)
assert.equal(webSearchMapPlanningSafetyFlags.publicSearxngAllowed, false)
assert.equal(webSearchMapPlanningSafetyFlags.mapLibreRenderAllowed, true)
assert.equal(webSearchMapPlanningSafetyFlags.deckGlOverlayAllowed, true)
assert.equal(webSearchMapPlanningSafetyFlags.cesiumJsRenderAllowed, true)
assert.equal(webSearchMapPlanningSafetyFlags.cesiumIonAllowed, false)
assert.equal(webSearchMapPlanningSafetyFlags.liveTerrainAllowed, false)
assert.equal(webSearchMapPlanningSafetyFlags.liveImageryAllowed, false)
assert.equal(webSearchMapPlanningSafetyFlags.threeDTilesAllowed, false)
assert.equal(webSearchMapPlanningSafetyFlags.productionReadyAllowed, false)
assert.equal(webSearchMapPlanningSafetyFlags.externalBetaAllowed, false)
assert.equal(webSearchMapPlanningSafetyFlags.broadMediaAllowed, false)

for (const script of webSearchMapPlanningRequiredScripts) {
  assert.equal(Boolean(packageJson.scripts[script]), true, `Missing package script ${script}`)
}
for (const doc of webSearchMapPlanningRequiredDocs) {
  assert.equal(fs.existsSync(doc), true, `Missing doc ${doc}`)
}

assert.equal(evidenceChain.evidenceStatus, 'ready')
assert.equal(evidenceChain.phases.some((phase) => phase.phase === '49P'), true)
assert.equal(evidenceChain.phases.some((phase) => phase.phase === '50E'), true)
assert.equal(sources.length, 6)
assert.equal(sources.every((source) => source.generatedFixture && !source.liveSearchUsed && !source.paidProviderUsed && !source.captureAllowed), true)
assert.equal(candidates.length, 6)
assert.equal(candidates.every((candidate) => candidate.generatedFixture && !candidate.realWorldVerified && !candidate.liveGeocodingUsed && !candidate.liveRoutingUsed), true)
assert.equal(geojson.generatedFixture, true)
assert.equal(geojson.points.features.length, 6)
assert.equal(turfCalculations.summary.blockers.length, 0)
assert.equal(styleValidation.blockers.length, 0)
assert.equal(overlay.layerManifest.layers.length, 4)
assert.equal(cesiumSceneConfig.cesiumIonAccessToken, '')
assert.equal(cesiumSceneConfig.imageryProvider, 'none')
assert.equal(cesiumSceneConfig.terrainProvider, 'EllipsoidTerrainProvider')

const forbidden = findForbiddenMapNetworkRequests([
  evaluateMapLibreNetworkRequest('https://tile.openstreetmap.org/0/0/0.png', 'GET', 'image', 'http://127.0.0.1:4000'),
  evaluateMapLibreNetworkRequest('https://api.mapbox.com/styles/v1/test', 'GET', 'fetch', 'http://127.0.0.1:4000'),
])
assert.equal(forbidden.length, 2)
assert.equal(qa.status, 'passed')
for (const gateId of ['web_search_evidence', 'map_stack_evidence', 'planning_source_integrity', 'location_candidate_integrity', 'turf_planning_calculations', 'maplibre_planning_render', 'deckgl_planning_overlay', 'cesiumjs_3d_planning', 'capture_artifacts', 'artifact_privacy', 'blocked_features']) {
  assert.equal(qa.gates.some((gate) => gate.gateId === gateId && gate.passed), true, `Missing passing QA gate ${gateId}`)
}

assert.equal(report.reportId, 'activation-phase-50f-web-search-map-planning-e2e')
assert.equal(commandPlan.defaultMode, 'static_report_only')
assert.equal(commandPlan.blockedAlways.includes('live geocoding'), true)
assert.equal(commandPlan.blockedAlways.includes('public OSM tiles'), true)
assert.equal(iamPlan.defaultMutationAllowed, false)
console.log('Phase 50F web search + map planning private E2E smoke passed.')
