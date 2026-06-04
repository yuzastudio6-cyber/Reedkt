import type { GeneratedGeoJsonFixture, GeoJsonFeatureCollection } from '../maplibre-turf-fixture'

export type MapLibreLocalRenderStatus = 'planned' | 'completed' | 'blocked'
export type MapLibreLocalRenderMode = 'maplibre_local_offline_render_capture_fixture'
export type Phase50DReadiness = 'ready_for_deckgl_overlay_fixture' | 'blocked'

export type MapLibreLocalRenderQaGateId =
  | 'phase50b_evidence'
  | 'generated_geojson_integrity'
  | 'local_style_integrity'
  | 'maplibre_local_render'
  | 'network_guard'
  | 'playwright_capture'
  | 'optional_screenshot_processing'
  | 'artifact_privacy'
  | 'blocked_features'

export interface MapLibreLocalRenderConfig {
  phase: '50C'
  mode: MapLibreLocalRenderMode
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  approvedPhase50BRunId: 'phase50b-20260604T01114'
  approvedPhase50BReportUri: string
  generatedAssetsBucket: string
  qaBucket: string
  reportObjectPrefix: 'activation-map-geospatial/phase50c'
  viewport: {
    width: 1280
    height: 720
    deviceScaleFactor: 1
  }
  previewMaxWidth: 960
  thumbnailWidth: 320
  maxGeneratedPoints: 8
  maxGeneratedRoutes: 2
  maxGeneratedPolygons: 2
}

export interface MapLibreLocalRenderSafetyFlags {
  mapLibreBrowserRuntimeAllowed: true
  mapRenderingAllowed: true
  playwrightCaptureAllowed: true
  externalNetworkRequestsAllowed: false
  tileDownloadAllowed: false
  liveTileProviderAllowed: false
  publicOsmTileAllowed: false
  mapboxProviderAllowed: false
  googleMapsProviderAllowed: false
  cesiumIonAllowed: false
  geocodingAllowed: false
  routingAllowed: false
  deckGlRuntimeAllowed: false
  cesiumJsRuntimeAllowed: false
  paidMapProviderAllowed: false
  publicArtifactAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadMediaAllowed: false
  providerAllowed: false
  revideoAllowed: false
}

export interface MapLibreLocalStyle {
  version: 8
  name: 'ReeditPro Phase 50C local offline generated map style'
  glyphs?: never
  sprite?: never
  sources: Record<string, { type: 'geojson'; data: GeoJsonFeatureCollection }>
  layers: Array<{
    id: string
    type: 'background' | 'circle' | 'line' | 'fill'
    source?: string
    paint?: Record<string, unknown>
    layout?: Record<string, unknown>
  }>
  metadata: {
    generatedFixture: true
    noRemoteTiles: true
    noGlyphs: true
    noSprites: true
    noPaidProviders: true
    renderingMode: MapLibreLocalRenderMode
  }
}

export interface MapLibreLocalStyleValidation {
  sourceIdsUnique: boolean
  layerIdsUnique: boolean
  layerReferencesValid: boolean
  noRemoteTileGlyphSpriteImageUrls: boolean
  noPaidProviderUrls: boolean
  noSymbolLayers: boolean
  blockers: string[]
  warnings: string[]
}

export interface LocalMapFixtureData {
  source: 'phase50b_generated_fixture_code'
  approvedPhase50BRunId: MapLibreLocalRenderConfig['approvedPhase50BRunId']
  fixture: GeneratedGeoJsonFixture
  style: MapLibreLocalStyle
  styleValidation: MapLibreLocalStyleValidation
}

export interface LocalMapHtmlFixture {
  fixtureRoot: string
  htmlPath: string
  stylePath: string
  mapLibreJsPath: string
  mapLibreCssPath: string
  title: 'ReeditPro generated map fixture'
  sha256: string
  sizeBytes: number
  localAssetCount: number
  externalAssetCount: 0
}

export interface NetworkRequestRecord {
  url: string
  method: string
  resourceType: string
  allowed: boolean
  blockedReason?: string
}

export interface MapLibreRenderMetadata {
  pageTitle: string
  readyMarkerObserved: boolean
  mapLibreVersion?: string
  playwrightVersion?: string
  viewport: MapLibreLocalRenderConfig['viewport']
  renderMetadata: {
    sourceCount: number
    layerCount: number
    pointCount: number
    routeCount: number
    polygonCount: number
    bounds: [number, number, number, number]
    center: [number, number]
    labelsRenderedAsHtmlOverlay: true
  }
  screenshotPath: string
  screenshotDimensions: {
    width: number
    height: number
  }
  capturedAt: string
}

export interface SharpMapScreenshotProcessing {
  inputPath: string
  original: ImageArtifactMetadata
  preview: ImageArtifactMetadata
  thumbnail: ImageArtifactMetadata
  processedAt: string
  sharpVersion?: string
  remoteImagesFetched: false
}

export interface ImageArtifactMetadata {
  path: string
  width: number
  height: number
  format?: string
  sizeBytes: number
  sha256: string
}

export interface MapLibreLocalRenderArtifact {
  id: string
  kind: 'private_json' | 'private_geojson' | 'private_html' | 'private_png'
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface MapLibreLocalCaptureManifest {
  runId: string
  phase: '50C'
  fixtureMode: MapLibreLocalRenderMode
  generatedFixture: true
  mapLibreVersion?: string
  playwrightVersion?: string
  viewport: MapLibreLocalRenderConfig['viewport']
  styleSummary: {
    sourceCount: number
    layerCount: number
    noRemoteTileGlyphSpriteImageUrls: boolean
    noPaidProviderUrls: boolean
    noSymbolLayers: boolean
  }
  sourceSummary: {
    pointCount: number
    routeCount: number
    polygonCount: number
    combinedFeatureCount: number
  }
  networkRequestsObserved: NetworkRequestRecord[]
  externalNetworkRequestsObserved: NetworkRequestRecord[]
  screenshotArtifacts: MapLibreLocalRenderArtifact[]
  optionalSharpArtifacts: MapLibreLocalRenderArtifact[]
  blockedFeatures: string[]
  warnings: string[]
  blockers: string[]
}

export interface MapLibreLocalRenderQaGate {
  gateId: MapLibreLocalRenderQaGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface MapLibreLocalRenderQaSummary {
  status: 'passed' | 'blocked'
  gates: MapLibreLocalRenderQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface MapLibreLocalRenderExecutionReport {
  ok: boolean
  phase: '50C'
  runId: string
  projectId: 'reeditpro'
  mode: MapLibreLocalRenderMode
  fixture: GeneratedGeoJsonFixture
  style: MapLibreLocalStyle
  styleValidation: MapLibreLocalStyleValidation
  renderMetadata?: MapLibreRenderMetadata
  networkRequestsObserved: NetworkRequestRecord[]
  externalNetworkRequestsObserved: NetworkRequestRecord[]
  sharpProcessing?: SharpMapScreenshotProcessing
  captureManifest?: MapLibreLocalCaptureManifest
  artifacts: MapLibreLocalRenderArtifact[]
  qa: MapLibreLocalRenderQaSummary
  phase50DReadiness: Phase50DReadiness
  safety: MapLibreLocalRenderSafetyFlags & {
    liveTileRequestMade: false
    publicOsmTileRequestMade: false
    geocodingRequestMade: false
    routingRequestMade: false
    paidProviderCalled: false
    deckGlRuntimeUsed: false
    cesiumJsRuntimeUsed: false
    publicAccessEnabled: false
  }
  blockers: string[]
  warnings: string[]
}

export interface MapLibreLocalRenderReport {
  reportId: 'activation-phase-50c-maplibre-local-render-fixture'
  createdAt: string
  phase: '50C'
  status: MapLibreLocalRenderStatus
  config: MapLibreLocalRenderConfig
  executionReport?: MapLibreLocalRenderExecutionReport
  qa: MapLibreLocalRenderQaSummary
  phase50DReadiness: Phase50DReadiness
  blockers: string[]
  warnings: string[]
  mapLibreBrowserRuntimeAllowed: true
  mapRenderingAllowed: true
  liveTileProviderAllowed: false
  tileDownloadAllowed: false
  geocodingAllowed: false
  routingAllowed: false
  paidMapProviderAllowed: false
  deckGlRuntimeAllowed: false
  cesiumJsRuntimeAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadMediaAllowed: false
}
