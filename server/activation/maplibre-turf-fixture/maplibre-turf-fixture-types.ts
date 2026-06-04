export type MapLibreTurfFixtureStatus = 'planned' | 'completed' | 'blocked'

export type MapLibreTurfFixtureQaGateId =
  | 'phase50a_evidence'
  | 'generated_geojson_integrity'
  | 'turf_calculations'
  | 'maplibre_manifest'
  | 'artifact_privacy'
  | 'blocked_features'

export interface GeoJsonFeature {
  type: 'Feature'
  id?: string
  properties: Record<string, unknown>
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon'
    coordinates: unknown
  }
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJsonFeature[]
}

export interface MapLibreTurfFixtureConfig {
  phase: '50B'
  mode: 'maplibre_turf_generated_local_fixture'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  coordinateFixtureMode: 'synthetic_planning_city'
  maxGeneratedPoints: 8
  maxGeneratedRoutes: 2
  maxGeneratedPolygons: 2
  generatedAssetsBucket: string
  qaBucket: string
  reportObjectPrefix: 'activation-map-geospatial/phase50b'
}

export interface MapLibreTurfFixtureSafetyFlags {
  turfCalculationsAllowed: boolean
  mapLibreManifestAllowed: boolean
  mapLibreBrowserRuntimeAllowed: false
  mapRenderingAllowed: false
  tileDownloadAllowed: false
  liveTileProviderAllowed: false
  geocodingAllowed: false
  routingAllowed: false
  paidMapProviderAllowed: false
  publicArtifactAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadMediaAllowed: false
  providerAllowed: false
  revideoAllowed: false
}

export interface GeneratedGeoJsonFixture {
  fixtureId: 'reeditpro-generated-planning-city'
  fixtureMode: 'synthetic_planning_city'
  generatedFixture: true
  realWorldVerified: false
  userLocationUsed: false
  points: GeoJsonFeatureCollection
  routes: GeoJsonFeatureCollection
  polygons: GeoJsonFeatureCollection
  combined: GeoJsonFeatureCollection
}

export interface TurfCalculationRecord {
  calculation: string
  inputSummary: string
  output: unknown
  units?: string
  expectedRange?: string
  warnings: string[]
  blockers: string[]
}

export interface TurfCalculationResult {
  generatedFixture: true
  coordinateFixtureMode: 'synthetic_planning_city'
  records: TurfCalculationRecord[]
  summary: {
    pointCount: number
    routeCount: number
    polygonCount: number
    coordinateValidationPassed: boolean
    blockers: string[]
    warnings: string[]
  }
}

export interface MapLibreStyleManifest {
  manifestId: 'phase50b-maplibre-style-manifest'
  styleVersion: 8
  generatedFixture: true
  mapLibreBrowserRuntimeUsed: false
  renderingDeferredToPhase50C: true
  sources: Record<string, { type: 'geojson'; data: GeoJsonFeatureCollection }>
  layers: Array<{
    id: string
    type: 'circle' | 'symbol' | 'line' | 'fill'
    source: string
    layout?: Record<string, unknown>
    paint?: Record<string, unknown>
  }>
  initialCamera: {
    center: [number, number]
    zoom: number
    bounds: [number, number, number, number]
  }
  attributionPolicy: string[]
  tilePolicy: string[]
  validation: {
    sourceIdsUnique: boolean
    layerIdsUnique: boolean
    layerReferencesValid: boolean
    noRemoteSpriteGlyphTileUrls: boolean
    noPaidProviderUrls: boolean
    blockers: string[]
    warnings: string[]
  }
}

export interface MapPlanningManifest {
  runId: string
  phase: '50B'
  fixtureMode: 'synthetic_planning_city'
  generatedFixture: true
  toolStack: string[]
  generatedDataSummary: Record<string, unknown>
  turfCalculationSummary: TurfCalculationResult['summary']
  mapLibreManifestSummary: Record<string, unknown>
  blockedFeatures: string[]
  privateArtifactPolicy: string
  phase50CReadiness: 'ready_for_maplibre_local_render_capture_fixture' | 'blocked'
  warnings: string[]
  blockers: string[]
}

export interface MapLibreTurfFixtureArtifact {
  id: string
  kind: 'private_json' | 'private_geojson'
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface MapLibreTurfFixtureQaGate {
  gateId: MapLibreTurfFixtureQaGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface MapLibreTurfFixtureQaSummary {
  status: 'passed' | 'blocked'
  gates: MapLibreTurfFixtureQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface MapLibreTurfFixtureExecutionReport {
  ok: boolean
  phase: '50B'
  runId: string
  projectId: 'reeditpro'
  fixture: GeneratedGeoJsonFixture
  turfCalculations: TurfCalculationResult
  mapLibreManifest: MapLibreStyleManifest
  planningManifest: MapPlanningManifest
  artifacts: MapLibreTurfFixtureArtifact[]
  qa: MapLibreTurfFixtureQaSummary
  phase50CReadiness: 'ready_for_maplibre_local_render_capture_fixture' | 'blocked'
  safety: MapLibreTurfFixtureSafetyFlags & {
    mapRendered: false
    tilesDownloaded: false
    liveTileRequestMade: false
    geocodingRequestMade: false
    routingRequestMade: false
    paidProviderCalled: false
    playwrightLaunched: false
    screenshotCaptured: false
    publicAccessEnabled: false
  }
  blockers: string[]
  warnings: string[]
}

export interface MapLibreTurfFixtureReport {
  reportId: 'activation-phase-50b-maplibre-turf-fixture'
  createdAt: string
  phase: '50B'
  status: MapLibreTurfFixtureStatus
  config: MapLibreTurfFixtureConfig
  executionReport?: MapLibreTurfFixtureExecutionReport
  qa: MapLibreTurfFixtureQaSummary
  phase50CReadiness: 'ready_for_maplibre_local_render_capture_fixture' | 'blocked'
  blockers: string[]
  warnings: string[]
  mapLibreBrowserRuntimeAllowed: false
  mapRenderingAllowed: false
  tileDownloadAllowed: false
  liveTileProviderAllowed: false
  geocodingAllowed: false
  routingAllowed: false
  paidMapProviderAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadMediaAllowed: false
}
