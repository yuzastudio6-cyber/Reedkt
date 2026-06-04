import { runCesiumJsPlaywrightCapture, runCesiumJsSharpScreenshotProcessing, writeCesiumJsLocalHtmlFixture } from '../cesiumjs-local-3d-fixture'
import type { Cesium3DPlanningData, CesiumJsLocalFixtureData, CesiumLocalSceneConfig } from '../cesiumjs-local-3d-fixture'
import type { WebSearchMap3DRenderResult, WebSearchMapPlanningGeoJson } from './web-search-map-planning-types'

const pointHeights = [180, 260, 340, 220, 300, 160]

export async function runWebSearchCesiumPlanningScene(input: {
  geojson: WebSearchMapPlanningGeoJson
  root: string
}): Promise<WebSearchMap3DRenderResult> {
  const planningData = buildCesiumPlanningData(input.geojson)
  const sceneConfig = buildCesiumSceneConfig(planningData)
  const fixtureData: CesiumJsLocalFixtureData = {
    source: 'phase50b_generated_fixture_code',
    approvedPhase50DRunId: 'phase50d-20260604T030406',
    fixture: input.geojson.fixture,
    planningData,
    sceneConfig,
  }
  const localFixture = await writeCesiumJsLocalHtmlFixture({ fixtureData, root: input.root })
  const capture = await runCesiumJsPlaywrightCapture({ localFixture, outputRoot: input.root })
  const sharpProcessing = await runCesiumJsSharpScreenshotProcessing({
    screenshotPath: capture.renderMetadata.screenshotPath,
    outputRoot: input.root,
  })
  return {
    planningData,
    sceneConfig,
    renderMetadata: capture.renderMetadata,
    networkRequestsObserved: capture.networkRequestsObserved,
    externalNetworkRequestsObserved: capture.externalNetworkRequestsObserved,
    sharpProcessing,
  }
}

export function buildCesiumPlanningData(geojson: WebSearchMapPlanningGeoJson): Cesium3DPlanningData {
  const points = geojson.points.features.map((feature, index) => ({
    entityId: `phase50f-cesium-point-${String(index + 1).padStart(3, '0')}`,
    type: 'point' as const,
    name: String(feature.properties.name ?? feature.id),
    coordinates: [...(feature.geometry.coordinates as [number, number]), pointHeights[index] ?? 200],
    heightMeters: pointHeights[index] ?? 200,
    source: 'generated_fixture' as const,
    realWorldVerified: false as const,
    userLocationUsed: false as const,
    geocodingUsed: false as const,
    routingUsed: false as const,
  }))
  const routes = geojson.routes.features.map((feature, index) => ({
    entityId: `phase50f-cesium-route-${String(index + 1).padStart(3, '0')}`,
    type: 'polyline' as const,
    name: String(feature.properties.name ?? feature.id),
    coordinates: (feature.geometry.coordinates as [number, number][]).map(([lon, lat], coordIndex) => [lon, lat, 120 + index * 60 + coordIndex * 35]),
    source: 'generated_fixture' as const,
    realWorldVerified: false as const,
    userLocationUsed: false as const,
    geocodingUsed: false as const,
    routingUsed: false as const,
  }))
  const polygons = geojson.polygons.features.map((feature, index) => ({
    entityId: `phase50f-cesium-polygon-${String(index + 1).padStart(3, '0')}`,
    type: 'polygon' as const,
    name: String(feature.properties.name ?? feature.id),
    coordinates: ((feature.geometry.coordinates as [number, number][][])[0] ?? []).map(([lon, lat]) => [lon, lat, 20 + index * 20]),
    heightMeters: 20 + index * 20,
    source: 'generated_fixture' as const,
    realWorldVerified: false as const,
    userLocationUsed: false as const,
    geocodingUsed: false as const,
    routingUsed: false as const,
  }))
  const verticalMarkers = points.slice(0, 4).map((point, index) => ({
    entityId: `phase50f-cesium-cylinder-${String(index + 1).padStart(3, '0')}`,
    type: 'cylinder' as const,
    name: `${point.name} vertical planning marker`,
    coordinates: point.coordinates,
    heightMeters: 260 + index * 55,
    source: 'generated_fixture' as const,
    realWorldVerified: false as const,
    userLocationUsed: false as const,
    geocodingUsed: false as const,
    routingUsed: false as const,
  }))
  const cameraViewpoints = [{
    viewpointId: 'phase50f-cesium-camera-001',
    name: 'Web search + map planning oblique overview',
    destination: { lon: -73.9803, lat: 40.7379, heightMeters: 3200 },
    orientation: { headingDegrees: 28, pitchDegrees: -68, rollDegrees: 0 },
    source: 'generated_fixture' as const,
  }]
  return {
    generatedFixture: true,
    realWorldVerified: false,
    userLocationUsed: false,
    geocodingUsed: false,
    routingUsed: false,
    points,
    routes,
    polygons,
    verticalMarkers,
    cameraViewpoints,
    entityCount: points.length + routes.length + polygons.length + verticalMarkers.length,
  }
}

export function buildCesiumSceneConfig(planningData: Cesium3DPlanningData): CesiumLocalSceneConfig {
  const blockers: string[] = []
  const serialized = JSON.stringify(planningData).toLowerCase()
  const noRemoteUrls = !/https?:\/\//.test(serialized)
  const entityCountWithinLimit = planningData.entityCount <= 20
  if (!noRemoteUrls) blockers.push('Cesium planning scene data must not include remote URLs.')
  if (!entityCountWithinLimit) blockers.push('Cesium planning entity count exceeds Phase 50F limit.')
  return {
    sceneId: 'phase50e-cesiumjs-local-offline-scene',
    generatedFixture: true,
    cesiumIonAccessToken: '',
    baseLayer: false,
    terrainProvider: 'EllipsoidTerrainProvider',
    imageryProvider: 'none',
    threeDTiles: false,
    geocoder: false,
    liveTerrain: false,
    liveImagery: false,
    generatedEntitiesOnly: true,
    initialCamera: planningData.cameraViewpoints[0],
    validation: {
      noCesiumIonToken: true,
      noLiveImagery: true,
      noLiveTerrain: true,
      noThreeDTiles: true,
      noRemoteUrls,
      entityCountWithinLimit,
      blockers,
      warnings: ['CesiumJS is used only for the generated local/offline Phase 50F 3D planning view.'],
    },
  }
}
