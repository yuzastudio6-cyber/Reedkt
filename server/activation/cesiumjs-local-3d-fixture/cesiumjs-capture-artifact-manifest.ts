import type { NetworkRequestRecord } from '../maplibre-local-render-fixture'
import type { CesiumJsLocal3DArtifact, CesiumJsLocal3DCaptureManifest, CesiumLocalSceneConfig, CesiumRenderMetadata } from './cesiumjs-local-3d-types'

export function buildCesiumJsLocal3DCaptureManifest(input: {
  runId: string
  sceneConfig: CesiumLocalSceneConfig
  renderMetadata: CesiumRenderMetadata
  networkRequestsObserved: NetworkRequestRecord[]
  externalNetworkRequestsObserved: NetworkRequestRecord[]
  artifacts: CesiumJsLocal3DArtifact[]
  warnings: string[]
  blockers: string[]
}): CesiumJsLocal3DCaptureManifest {
  return {
    runId: input.runId,
    phase: '50E',
    fixtureMode: 'cesiumjs_local_offline_3d_planning_fixture',
    generatedFixture: true,
    cesiumVersion: input.renderMetadata.cesiumVersion,
    playwrightVersion: input.renderMetadata.playwrightVersion,
    viewport: input.renderMetadata.viewport,
    entitySummary: {
      pointCount: input.renderMetadata.renderMetadata.pointCount,
      routeCount: input.renderMetadata.renderMetadata.routeCount,
      polygonCount: input.renderMetadata.renderMetadata.polygonCount,
      verticalMarkerCount: input.renderMetadata.renderMetadata.verticalMarkerCount,
      cesiumEntityCount: input.renderMetadata.renderMetadata.cesiumEntityCount,
    },
    cameraSummary: {
      ...input.renderMetadata.renderMetadata.cameraPosition,
      headingDegrees: input.renderMetadata.renderMetadata.cameraHeadingPitchRollDegrees.heading,
      pitchDegrees: input.renderMetadata.renderMetadata.cameraHeadingPitchRollDegrees.pitch,
      rollDegrees: input.renderMetadata.renderMetadata.cameraHeadingPitchRollDegrees.roll,
    },
    scenePolicy: input.sceneConfig,
    networkRequestsObserved: input.networkRequestsObserved,
    externalNetworkRequestsObserved: input.externalNetworkRequestsObserved,
    screenshotArtifacts: input.artifacts.filter((artifact) => artifact.id === 'cesiumjs_local_3d_screenshot'),
    optionalSharpArtifacts: input.artifacts.filter((artifact) => artifact.id.includes('cesiumjs_3d_preview') || artifact.id.includes('cesiumjs_3d_thumbnail') || artifact.id.includes('cesiumjs_3d_image_metadata')),
    blockedFeatures: [
      'Cesium ion',
      'Cesium ion token',
      'live terrain',
      'live imagery',
      '3D Tiles',
      'live tiles',
      'public OSM tiles',
      'Mapbox provider',
      'Google Maps provider',
      'geocoding/routing APIs',
      'paid map providers',
      'deck.gl runtime in Phase 50E',
      'D3 runtime',
      'Three.js runtime',
      'public artifacts',
      'signed URLs as source of truth',
      'production',
      'external beta',
      'broad media',
    ],
    warnings: input.warnings,
    blockers: input.blockers,
  }
}
