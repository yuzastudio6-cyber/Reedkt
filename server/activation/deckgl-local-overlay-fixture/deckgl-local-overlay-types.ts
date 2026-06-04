import type { GeneratedGeoJsonFixture } from '../maplibre-turf-fixture'
import type { MapLibreLocalStyle, MapLibreLocalStyleValidation, NetworkRequestRecord, ImageArtifactMetadata } from '../maplibre-local-render-fixture'

export type DeckGlLocalOverlayStatus = 'planned' | 'completed' | 'blocked'
export type DeckGlLocalOverlayMode = 'deckgl_local_offline_overlay_fixture'
export type Phase50EReadiness = 'ready_for_cesiumjs_3d_planning_fixture' | 'blocked'

export type DeckGlLocalOverlayQaGateId =
  | 'phase50c_evidence'
  | 'generated_overlay_data_integrity'
  | 'local_style_integrity'
  | 'deckgl_overlay_render'
  | 'maplibre_base_render'
  | 'network_guard'
  | 'playwright_capture'
  | 'optional_screenshot_processing'
  | 'artifact_privacy'
  | 'blocked_features'

export interface DeckGlLocalOverlayConfig {
  phase: '50D'
  mode: DeckGlLocalOverlayMode
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  approvedPhase50CRunId: 'phase50c-20260604T020852'
  approvedPhase50CReportUri: string
  generatedAssetsBucket: string
  qaBucket: string
  reportObjectPrefix: 'activation-map-geospatial/phase50d'
  viewport: {
    width: 1280
    height: 720
    deviceScaleFactor: 1
  }
  previewMaxWidth: 960
  thumbnailWidth: 320
  maxDeckGlLayers: 4
  maxGeneratedFlows: 4
}

export interface DeckGlLocalOverlaySafetyFlags {
  mapLibreBrowserRuntimeAllowed: true
  deckGlRuntimeAllowed: true
  deckGlRuntimeScope: 'generated_local_overlay_fixture_only'
  mapRenderingAllowed: true
  playwrightCaptureAllowed: true
  sharpProcessingAllowed: true
  externalNetworkRequestsAllowed: false
  tileDownloadAllowed: false
  liveTileProviderAllowed: false
  publicOsmTileAllowed: false
  mapboxProviderAllowed: false
  googleMapsProviderAllowed: false
  cesiumIonAllowed: false
  geocodingAllowed: false
  routingAllowed: false
  paidMapProviderAllowed: false
  cesiumJsRuntimeAllowed: false
  d3RuntimeAllowed: false
  threeJsRuntimeAllowed: false
  publicArtifactAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadMediaAllowed: false
  providerAllowed: false
  revideoAllowed: false
}

export interface DeckGlFlowRecord {
  flowId: string
  sourcePointId: string
  targetPointId: string
  sourcePosition: [number, number]
  targetPosition: [number, number]
  weight: number
  source: 'generated_fixture'
  routingUsed: false
  realWorldVerified: false
}

export interface DeckGlOverlayData {
  generatedFixture: true
  realWorldVerified: false
  routingUsed: false
  captureAllowed: false
  points: Array<{
    id: string
    name: string
    position: [number, number]
    weight: number
    source: 'generated_fixture'
  }>
  paths: Array<{
    id: string
    name: string
    path: [number, number][]
    weight: number
    source: 'generated_fixture'
  }>
  polygons: Array<{
    id: string
    name: string
    polygon: [number, number][]
    weight: number
    source: 'generated_fixture'
  }>
  arcs: DeckGlFlowRecord[]
}

export interface DeckGlLayerManifest {
  manifestId: 'phase50d-deckgl-layer-manifest'
  generatedFixture: true
  deckGlRuntimeScope: 'local_offline_overlay_fixture_only'
  mapboxOverlayUsed: true
  layers: Array<{
    id: string
    type: 'ScatterplotLayer' | 'PathLayer' | 'PolygonLayer' | 'ArcLayer'
    dataSource: keyof Pick<DeckGlOverlayData, 'points' | 'paths' | 'polygons' | 'arcs'>
    generatedFixture: true
    realWorldVerified: false
  }>
  heatmapLayerDeferred: true
  validation: {
    layerIdsUnique: boolean
    layerTypesApproved: boolean
    layerCountWithinLimit: boolean
    noExternalAssets: boolean
    noD3ThreeCesiumRuntime: boolean
    blockers: string[]
    warnings: string[]
  }
}

export interface DeckGlLocalFixtureData {
  source: 'phase50b_generated_fixture_code'
  approvedPhase50CRunId: DeckGlLocalOverlayConfig['approvedPhase50CRunId']
  fixture: GeneratedGeoJsonFixture
  style: MapLibreLocalStyle
  styleValidation: MapLibreLocalStyleValidation
  overlayData: DeckGlOverlayData
  layerManifest: DeckGlLayerManifest
}

export interface DeckGlLocalHtmlFixture {
  fixtureRoot: string
  htmlPath: string
  stylePath: string
  overlayDataPath: string
  mapLibreJsPath: string
  mapLibreCssPath: string
  deckCoreJsPath: string
  deckLayersJsPath: string
  deckMapboxJsPath: string
  title: 'ReeditPro deck.gl local overlay fixture'
  sha256: string
  sizeBytes: number
  localAssetCount: number
  externalAssetCount: 0
}

export interface DeckGlRenderMetadata {
  pageTitle: string
  readyMarkerObserved: boolean
  mapLibreVersion?: string
  deckGlVersion?: string
  playwrightVersion?: string
  viewport: DeckGlLocalOverlayConfig['viewport']
  renderMetadata: {
    mapLibreSourceCount: number
    mapLibreLayerCount: number
    deckGlLayerCount: number
    pointCount: number
    pathCount: number
    polygonCount: number
    arcCount: number
    bounds: [number, number, number, number]
    center: [number, number]
    labelsRenderedAsHtmlOverlay: true
    mapboxOverlayAttached: true
  }
  screenshotPath: string
  screenshotDimensions: {
    width: number
    height: number
  }
  capturedAt: string
}

export interface SharpDeckGlScreenshotProcessing {
  inputPath: string
  original: ImageArtifactMetadata
  preview: ImageArtifactMetadata
  thumbnail: ImageArtifactMetadata
  processedAt: string
  sharpVersion?: string
  remoteImagesFetched: false
}

export interface DeckGlLocalOverlayArtifact {
  id: string
  kind: 'private_json' | 'private_geojson' | 'private_html' | 'private_png'
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface DeckGlLocalOverlayCaptureManifest {
  runId: string
  phase: '50D'
  fixtureMode: DeckGlLocalOverlayMode
  generatedFixture: true
  mapLibreVersion?: string
  deckGlVersion?: string
  playwrightVersion?: string
  viewport: DeckGlLocalOverlayConfig['viewport']
  styleSummary: {
    sourceCount: number
    layerCount: number
    noRemoteTileGlyphSpriteImageUrls: boolean
    noPaidProviderUrls: boolean
    noSymbolLayers: boolean
  }
  overlaySummary: {
    pointCount: number
    pathCount: number
    polygonCount: number
    arcCount: number
    deckGlLayerCount: number
    heatmapLayerDeferred: true
  }
  networkRequestsObserved: NetworkRequestRecord[]
  externalNetworkRequestsObserved: NetworkRequestRecord[]
  screenshotArtifacts: DeckGlLocalOverlayArtifact[]
  optionalSharpArtifacts: DeckGlLocalOverlayArtifact[]
  blockedFeatures: string[]
  warnings: string[]
  blockers: string[]
}

export interface DeckGlLocalOverlayQaGate {
  gateId: DeckGlLocalOverlayQaGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface DeckGlLocalOverlayQaSummary {
  status: 'passed' | 'blocked'
  gates: DeckGlLocalOverlayQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface DeckGlLocalOverlayExecutionReport {
  ok: boolean
  phase: '50D'
  runId: string
  projectId: 'reeditpro'
  mode: DeckGlLocalOverlayMode
  fixture: GeneratedGeoJsonFixture
  style: MapLibreLocalStyle
  styleValidation: MapLibreLocalStyleValidation
  overlayData: DeckGlOverlayData
  layerManifest: DeckGlLayerManifest
  renderMetadata?: DeckGlRenderMetadata
  networkRequestsObserved: NetworkRequestRecord[]
  externalNetworkRequestsObserved: NetworkRequestRecord[]
  sharpProcessing?: SharpDeckGlScreenshotProcessing
  captureManifest?: DeckGlLocalOverlayCaptureManifest
  artifacts: DeckGlLocalOverlayArtifact[]
  qa: DeckGlLocalOverlayQaSummary
  phase50EReadiness: Phase50EReadiness
  safety: DeckGlLocalOverlaySafetyFlags & {
    liveTileRequestMade: false
    publicOsmTileRequestMade: false
    geocodingRequestMade: false
    routingRequestMade: false
    paidProviderCalled: false
    cesiumJsRuntimeUsed: false
    d3RuntimeUsed: false
    threeJsRuntimeUsed: false
    publicAccessEnabled: false
  }
  blockers: string[]
  warnings: string[]
}

export interface DeckGlLocalOverlayReport {
  reportId: 'activation-phase-50d-deckgl-local-overlay-fixture'
  createdAt: string
  phase: '50D'
  status: DeckGlLocalOverlayStatus
  config: DeckGlLocalOverlayConfig
  executionReport?: DeckGlLocalOverlayExecutionReport
  qa: DeckGlLocalOverlayQaSummary
  phase50EReadiness: Phase50EReadiness
  blockers: string[]
  warnings: string[]
  deckGlRuntimeAllowed: true
  deckGlRuntimeScope: 'generated_local_overlay_fixture_only'
  mapLibreBrowserRuntimeAllowed: true
  mapRenderingAllowed: true
  liveTileProviderAllowed: false
  tileDownloadAllowed: false
  geocodingAllowed: false
  routingAllowed: false
  paidMapProviderAllowed: false
  cesiumJsRuntimeAllowed: false
  d3RuntimeAllowed: false
  threeJsRuntimeAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadMediaAllowed: false
}

export interface DeckGlLocalOverlayPreflight {
  allowed: boolean
  blockers: string[]
  warnings: string[]
  activeProject: string
  publicAccessBlocked: boolean
  phase50cEvidencePresent: boolean
}
