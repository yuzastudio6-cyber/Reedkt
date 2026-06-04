import { buildGeneratedGeoJsonFixture } from '../maplibre-turf-fixture'
import { cesiumJsLocal3DConfig } from './cesiumjs-local-3d-policy'
import type { Cesium3DPlanningData, CesiumJsLocalFixtureData, CesiumLocalSceneConfig } from './cesiumjs-local-3d-types'

const pointHeights = [180, 260, 340, 220, 300, 160]

export function buildCesiumJsLocal3DFixtureData(): CesiumJsLocalFixtureData {
  const fixture = buildGeneratedGeoJsonFixture()
  const planningData = buildCesium3DPlanningData(fixture)
  const sceneConfig = buildCesiumLocalSceneConfig(planningData)
  return {
    source: 'phase50b_generated_fixture_code',
    approvedPhase50DRunId: cesiumJsLocal3DConfig.approvedPhase50DRunId,
    fixture,
    planningData,
    sceneConfig,
  }
}

function buildCesium3DPlanningData(fixture: ReturnType<typeof buildGeneratedGeoJsonFixture>): Cesium3DPlanningData {
  const points = fixture.points.features.map((feature, index) => ({
    entityId: `cesium-point-${String(index + 1).padStart(3, '0')}`,
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
  const routes = fixture.routes.features.map((feature, index) => ({
    entityId: `cesium-route-${String(index + 1).padStart(3, '0')}`,
    type: 'polyline' as const,
    name: String(feature.properties.name ?? feature.id),
    coordinates: (feature.geometry.coordinates as [number, number][]).map(([lon, lat], coordIndex) => [lon, lat, 120 + index * 60 + coordIndex * 35]),
    source: 'generated_fixture' as const,
    realWorldVerified: false as const,
    userLocationUsed: false as const,
    geocodingUsed: false as const,
    routingUsed: false as const,
  }))
  const polygons = fixture.polygons.features.map((feature, index) => ({
    entityId: `cesium-polygon-${String(index + 1).padStart(3, '0')}`,
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
    entityId: `cesium-cylinder-${String(index + 1).padStart(3, '0')}`,
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
  const cameraViewpoints = [
    {
      viewpointId: 'cesium-camera-001',
      name: 'Generated planning oblique overview',
      destination: { lon: -73.9803, lat: 40.7379, heightMeters: 3200 },
      orientation: { headingDegrees: 28, pitchDegrees: -68, rollDegrees: 0 },
      source: 'generated_fixture' as const,
    },
  ]
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

function buildCesiumLocalSceneConfig(planningData: Cesium3DPlanningData): CesiumLocalSceneConfig {
  const serialized = JSON.stringify(planningData).toLowerCase()
  const blockers: string[] = []
  const entityCountWithinLimit = planningData.entityCount <= cesiumJsLocal3DConfig.maxCesiumEntities
  const noRemoteUrls = !/https?:\/\//.test(serialized)
  if (!entityCountWithinLimit) blockers.push('Cesium entity count exceeds Phase 50E limit.')
  if (!noRemoteUrls) blockers.push('Cesium generated fixture data must not include remote URLs.')
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
      warnings: ['CesiumJS is used only for a generated local/offline 3D planning fixture in Phase 50E.'],
    },
  }
}
