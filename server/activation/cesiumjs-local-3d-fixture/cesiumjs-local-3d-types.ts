import type { GeneratedGeoJsonFixture } from '../maplibre-turf-fixture'
import type { NetworkRequestRecord, ImageArtifactMetadata } from '../maplibre-local-render-fixture'

export type CesiumJsLocal3DStatus = 'planned' | 'completed' | 'blocked'
export type CesiumJsLocal3DMode = 'cesiumjs_local_offline_3d_planning_fixture'
export type Phase50FReadiness = 'ready_for_web_search_map_planning_private_e2e' | 'blocked'

export type CesiumJsLocal3DQaGateId =
  | 'phase50d_evidence'
  | 'generated_3d_data_integrity'
  | 'cesium_local_scene'
  | 'cesium_render'
  | 'network_guard'
  | 'playwright_capture'
  | 'optional_screenshot_processing'
  | 'artifact_privacy'
  | 'blocked_features'

export interface CesiumJsLocal3DConfig {
  phase: '50E'
  mode: CesiumJsLocal3DMode
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  approvedPhase50DRunId: 'phase50d-20260604T030406'
  approvedPhase50DReportUri: string
  generatedAssetsBucket: string
  qaBucket: string
  reportObjectPrefix: 'activation-map-geospatial/phase50e'
  viewport: { width: 1280; height: 720; deviceScaleFactor: 1 }
  previewMaxWidth: 960
  thumbnailWidth: 320
  maxCesiumEntities: 20
}

export interface CesiumJsLocal3DSafetyFlags {
  cesiumJsRuntimeAllowed: true
  cesiumJsRuntimeScope: 'generated_local_offline_3d_planning_fixture_only'
  cesiumIonAllowed: false
  cesiumIonTokenAllowed: false
  liveImageryProviderAllowed: false
  liveTerrainProviderAllowed: false
  threeDTilesAllowed: false
  externalNetworkRequestsAllowed: false
  tileDownloadAllowed: false
  liveTileProviderAllowed: false
  publicOsmTileAllowed: false
  mapboxProviderAllowed: false
  googleMapsProviderAllowed: false
  geocodingAllowed: false
  routingAllowed: false
  deckGlRuntimeAllowed: false
  d3RuntimeAllowed: false
  threeJsRuntimeAllowed: false
  paidMapProviderAllowed: false
  mapRenderingAllowed: true
  playwrightCaptureAllowed: true
  sharpProcessingAllowed: true
  publicArtifactAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadMediaAllowed: false
  providerAllowed: false
  revideoAllowed: false
}

export interface Cesium3DEntityRecord {
  entityId: string
  type: 'point' | 'polyline' | 'polygon' | 'cylinder'
  name: string
  coordinates: unknown
  heightMeters?: number
  source: 'generated_fixture'
  realWorldVerified: false
  userLocationUsed: false
  geocodingUsed: false
  routingUsed: false
}

export interface Cesium3DPlanningData {
  generatedFixture: true
  realWorldVerified: false
  userLocationUsed: false
  geocodingUsed: false
  routingUsed: false
  points: Cesium3DEntityRecord[]
  routes: Cesium3DEntityRecord[]
  polygons: Cesium3DEntityRecord[]
  verticalMarkers: Cesium3DEntityRecord[]
  cameraViewpoints: Array<{
    viewpointId: string
    name: string
    destination: { lon: number; lat: number; heightMeters: number }
    orientation: { headingDegrees: number; pitchDegrees: number; rollDegrees: number }
    source: 'generated_fixture'
  }>
  entityCount: number
}

export interface CesiumLocalSceneConfig {
  sceneId: 'phase50e-cesiumjs-local-offline-scene'
  generatedFixture: true
  cesiumIonAccessToken: ''
  baseLayer: false
  terrainProvider: 'EllipsoidTerrainProvider'
  imageryProvider: 'none'
  threeDTiles: false
  geocoder: false
  liveTerrain: false
  liveImagery: false
  generatedEntitiesOnly: true
  initialCamera: Cesium3DPlanningData['cameraViewpoints'][number]
  validation: {
    noCesiumIonToken: boolean
    noLiveImagery: boolean
    noLiveTerrain: boolean
    noThreeDTiles: boolean
    noRemoteUrls: boolean
    entityCountWithinLimit: boolean
    blockers: string[]
    warnings: string[]
  }
}

export interface CesiumJsLocalFixtureData {
  source: 'phase50b_generated_fixture_code'
  approvedPhase50DRunId: CesiumJsLocal3DConfig['approvedPhase50DRunId']
  fixture: GeneratedGeoJsonFixture
  planningData: Cesium3DPlanningData
  sceneConfig: CesiumLocalSceneConfig
}

export interface CesiumJsLocalHtmlFixture {
  fixtureRoot: string
  htmlPath: string
  cesiumRootPath: string
  title: 'ReeditPro CesiumJS local 3D planning fixture'
  sha256: string
  sizeBytes: number
  localAssetCount: number
  externalAssetCount: 0
}

export interface CesiumRenderMetadata {
  pageTitle: string
  readyMarkerObserved: boolean
  cesiumVersion?: string
  playwrightVersion?: string
  viewport: CesiumJsLocal3DConfig['viewport']
  renderMetadata: {
    cesiumEntityCount: number
    pointCount: number
    routeCount: number
    polygonCount: number
    verticalMarkerCount: number
    cameraPosition: { longitudeDegrees: number; latitudeDegrees: number; heightMeters: number }
    cameraHeadingPitchRollDegrees: { heading: number; pitch: number; roll: number }
    cesiumIonTokenEmpty: true
    baseLayerDisabled: true
    ellipsoidTerrainUsed: true
  }
  screenshotPath: string
  screenshotDimensions: { width: number; height: number }
  capturedAt: string
}

export interface SharpCesiumScreenshotProcessing {
  inputPath: string
  original: ImageArtifactMetadata
  preview: ImageArtifactMetadata
  thumbnail: ImageArtifactMetadata
  processedAt: string
  sharpVersion?: string
  remoteImagesFetched: false
}

export interface CesiumJsLocal3DArtifact {
  id: string
  kind: 'private_json' | 'private_geojson' | 'private_html' | 'private_png'
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface CesiumJsLocal3DCaptureManifest {
  runId: string
  phase: '50E'
  fixtureMode: CesiumJsLocal3DMode
  generatedFixture: true
  cesiumVersion?: string
  playwrightVersion?: string
  viewport: CesiumJsLocal3DConfig['viewport']
  entitySummary: { pointCount: number; routeCount: number; polygonCount: number; verticalMarkerCount: number; cesiumEntityCount: number }
  cameraSummary: CesiumRenderMetadata['renderMetadata']['cameraPosition'] & { headingDegrees: number; pitchDegrees: number; rollDegrees: number }
  scenePolicy: CesiumLocalSceneConfig
  networkRequestsObserved: NetworkRequestRecord[]
  externalNetworkRequestsObserved: NetworkRequestRecord[]
  screenshotArtifacts: CesiumJsLocal3DArtifact[]
  optionalSharpArtifacts: CesiumJsLocal3DArtifact[]
  blockedFeatures: string[]
  warnings: string[]
  blockers: string[]
}

export interface CesiumJsLocal3DQaGate {
  gateId: CesiumJsLocal3DQaGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface CesiumJsLocal3DQaSummary {
  status: 'passed' | 'blocked'
  gates: CesiumJsLocal3DQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface CesiumJsLocal3DExecutionReport {
  ok: boolean
  phase: '50E'
  runId: string
  projectId: 'reeditpro'
  mode: CesiumJsLocal3DMode
  fixture: GeneratedGeoJsonFixture
  planningData: Cesium3DPlanningData
  sceneConfig: CesiumLocalSceneConfig
  renderMetadata?: CesiumRenderMetadata
  networkRequestsObserved: NetworkRequestRecord[]
  externalNetworkRequestsObserved: NetworkRequestRecord[]
  sharpProcessing?: SharpCesiumScreenshotProcessing
  captureManifest?: CesiumJsLocal3DCaptureManifest
  artifacts: CesiumJsLocal3DArtifact[]
  qa: CesiumJsLocal3DQaSummary
  phase50FReadiness: Phase50FReadiness
  safety: CesiumJsLocal3DSafetyFlags & {
    cesiumIonTokenUsed: false
    liveImageryRequestMade: false
    liveTerrainRequestMade: false
    threeDTilesRequestMade: false
    liveTileRequestMade: false
    geocodingRequestMade: false
    routingRequestMade: false
    paidProviderCalled: false
    deckGlRuntimeUsed: false
    d3RuntimeUsed: false
    threeJsRuntimeUsed: false
    publicAccessEnabled: false
  }
  blockers: string[]
  warnings: string[]
}

export interface CesiumJsLocal3DReport {
  reportId: 'activation-phase-50e-cesiumjs-local-3d-fixture'
  createdAt: string
  phase: '50E'
  status: CesiumJsLocal3DStatus
  config: CesiumJsLocal3DConfig
  executionReport?: CesiumJsLocal3DExecutionReport
  qa: CesiumJsLocal3DQaSummary
  phase50FReadiness: Phase50FReadiness
  blockers: string[]
  warnings: string[]
  cesiumJsRuntimeAllowed: true
  cesiumJsRuntimeScope: 'generated_local_offline_3d_planning_fixture_only'
  cesiumIonAllowed: false
  liveImageryProviderAllowed: false
  liveTerrainProviderAllowed: false
  threeDTilesAllowed: false
  tileDownloadAllowed: false
  geocodingAllowed: false
  routingAllowed: false
  paidMapProviderAllowed: false
  deckGlRuntimeAllowed: false
  d3RuntimeAllowed: false
  threeJsRuntimeAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadMediaAllowed: false
}
