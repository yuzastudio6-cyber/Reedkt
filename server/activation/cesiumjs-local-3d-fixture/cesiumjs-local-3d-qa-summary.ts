import type { GeneratedGeoJsonFixture } from '../maplibre-turf-fixture'
import type { NetworkRequestRecord } from '../maplibre-local-render-fixture'
import type {
  Cesium3DPlanningData,
  CesiumJsLocal3DArtifact,
  CesiumJsLocal3DCaptureManifest,
  CesiumJsLocal3DQaGate,
  CesiumJsLocal3DQaSummary,
  CesiumLocalSceneConfig,
  CesiumRenderMetadata,
  SharpCesiumScreenshotProcessing,
} from './cesiumjs-local-3d-types'

export function buildCesiumJsLocal3DQaSummary(input: {
  phase50dEvidencePresent: boolean
  fixture?: GeneratedGeoJsonFixture
  planningData?: Cesium3DPlanningData
  sceneConfig?: CesiumLocalSceneConfig
  renderMetadata?: CesiumRenderMetadata
  networkRequestsObserved?: NetworkRequestRecord[]
  externalNetworkRequestsObserved?: NetworkRequestRecord[]
  sharpProcessing?: SharpCesiumScreenshotProcessing
  captureManifest?: CesiumJsLocal3DCaptureManifest
  artifacts?: CesiumJsLocal3DArtifact[]
  preflightBlockers?: string[]
  publicAccessBlocked?: boolean
}): CesiumJsLocal3DQaSummary {
  const planningData = input.planningData
  const sceneConfig = input.sceneConfig
  const renderMetadata = input.renderMetadata
  const externalNetworkRequestsObserved = input.externalNetworkRequestsObserved ?? []
  const artifacts = input.artifacts ?? []
  const preflightBlockers = input.preflightBlockers ?? []

  const generated3DDataIntegrity = !!input.fixture
    && !!planningData
    && input.fixture.generatedFixture
    && input.fixture.realWorldVerified === false
    && input.fixture.userLocationUsed === false
    && planningData.generatedFixture
    && planningData.realWorldVerified === false
    && planningData.userLocationUsed === false
    && planningData.geocodingUsed === false
    && planningData.routingUsed === false
    && planningData.points.length >= 5
    && planningData.routes.length >= 1
    && planningData.polygons.length >= 1
    && planningData.verticalMarkers.length >= 1
    && planningData.entityCount <= 20
  const cesiumLocalScene = !!sceneConfig
    && sceneConfig.cesiumIonAccessToken === ''
    && sceneConfig.baseLayer === false
    && sceneConfig.terrainProvider === 'EllipsoidTerrainProvider'
    && sceneConfig.imageryProvider === 'none'
    && sceneConfig.threeDTiles === false
    && sceneConfig.geocoder === false
    && sceneConfig.liveTerrain === false
    && sceneConfig.liveImagery === false
    && sceneConfig.generatedEntitiesOnly
    && sceneConfig.validation.blockers.length === 0
  const cesiumRender = !!renderMetadata
    && !!planningData
    && renderMetadata.readyMarkerObserved
    && renderMetadata.renderMetadata.cesiumEntityCount === planningData.entityCount
    && renderMetadata.renderMetadata.cesiumIonTokenEmpty
    && renderMetadata.renderMetadata.baseLayerDisabled
    && renderMetadata.renderMetadata.ellipsoidTerrainUsed
  const networkGuard = externalNetworkRequestsObserved.length === 0
  const playwrightCapture = !!renderMetadata
    && renderMetadata.screenshotDimensions.width === 1280
    && renderMetadata.screenshotDimensions.height === 720
  const optionalScreenshotProcessing = !!input.sharpProcessing
    && input.sharpProcessing.preview.width > 0
    && input.sharpProcessing.thumbnail.width > 0
    && input.sharpProcessing.remoteImagesFetched === false
  const artifactPrivacy = artifacts.length === 0
    ? true
    : artifacts.every((artifact) => artifact.gcsUri.startsWith('gs://reeditpro-staging-reeditpro-') && artifact.kind.startsWith('private_') && !artifact.gcsUri.includes('http'))
      && input.publicAccessBlocked !== false
  const blockedFeatures = preflightBlockers.length === 0
    && networkGuard
    && cesiumLocalScene
    && cesiumRender

  const gates: CesiumJsLocal3DQaGate[] = [
    gate('phase50d_evidence', input.phase50dEvidencePresent, 'Phase 50D canonical deck.gl local overlay evidence is present.'),
    gate('generated_3d_data_integrity', generated3DDataIntegrity, 'Generated 3D data is synthetic, bounded, and excludes user location, geocoding, routing, and real-world verification.'),
    gate('cesium_local_scene', cesiumLocalScene, 'Cesium scene uses only local generated entities with no ion token, live terrain, live imagery, 3D Tiles, geocoder, or remote URLs.'),
    gate('cesium_render', cesiumRender, 'CesiumJS rendered the generated local/offline 3D planning scene and reported matching entity/camera metadata.'),
    gate('network_guard', networkGuard, 'Network guard observed no external requests, Cesium ion, terrain, imagery, 3D Tiles, tiles, geocoding, or routing calls.'),
    gate('playwright_capture', playwrightCapture, 'Playwright captured a 1280x720 screenshot from the 127.0.0.1 local fixture only.'),
    gate('optional_screenshot_processing', optionalScreenshotProcessing, 'Sharp preview, thumbnail, and image metadata were created from the Phase 50E screenshot.'),
    gate('artifact_privacy', artifactPrivacy, 'Artifacts are private GCS objects with no public or signed URL source of truth.'),
    gate('blocked_features', blockedFeatures, 'Cesium ion, live terrain/imagery, 3D Tiles, live tiles, geocoding/routing, paid providers, deck.gl, D3, Three.js, production, beta, and broad media remain blocked.'),
  ]
  const blockers = [
    ...preflightBlockers,
    ...(input.phase50dEvidencePresent ? [] : ['Phase 50D canonical evidence is not present.']),
    ...(generated3DDataIntegrity ? [] : ['Generated 3D data integrity failed.']),
    ...(cesiumLocalScene ? [] : ['Cesium local scene policy failed.']),
    ...(cesiumRender ? [] : ['Cesium local/offline render QA failed.']),
    ...(networkGuard ? [] : ['Network guard observed forbidden external or provider requests.']),
    ...(playwrightCapture ? [] : ['Playwright capture QA failed.']),
    ...(optionalScreenshotProcessing ? [] : ['Optional Sharp screenshot processing QA failed.']),
    ...(artifactPrivacy ? [] : ['Artifact privacy QA failed.']),
    ...(blockedFeatures ? [] : ['Blocked Phase 50E feature policy failed.']),
  ]
  const warnings = Array.from(new Set([
    ...(sceneConfig?.validation.warnings ?? []),
    ...(input.captureManifest?.warnings ?? []),
    'Phase 50E uses only local/offline CesiumJS generated 3D planning data; ion, live terrain/imagery, 3D Tiles, geocoding/routing, and paid providers remain blocked.',
  ]))
  return {
    status: gates.every((entry) => entry.passed) && blockers.length === 0 ? 'passed' : 'blocked',
    gates,
    blockers: Array.from(new Set(blockers)),
    warnings,
  }
}

function gate(gateId: CesiumJsLocal3DQaGate['gateId'], passed: boolean, summary: string): CesiumJsLocal3DQaGate {
  return { gateId, passed, severity: 'mandatory', summary }
}
