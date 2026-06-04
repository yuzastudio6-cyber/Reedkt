import type { GeneratedGeoJsonFixture, GeoJsonFeatureCollection, TurfCalculationResult } from '../maplibre-turf-fixture'
import type { DeckGlLayerManifest, DeckGlOverlayData, DeckGlRenderMetadata, SharpDeckGlScreenshotProcessing } from '../deckgl-local-overlay-fixture'
import type { Cesium3DPlanningData, CesiumLocalSceneConfig, CesiumRenderMetadata, SharpCesiumScreenshotProcessing } from '../cesiumjs-local-3d-fixture'
import type { MapLibreLocalStyle, MapLibreLocalStyleValidation, NetworkRequestRecord } from '../maplibre-local-render-fixture'

export type WebSearchMapPlanningStatus = 'planned' | 'completed' | 'blocked'
export type WebSearchMapPlanningMode = 'web_search_map_planning_private_e2e'
export type Phase50GReadiness = 'ready_for_map_geospatial_internal_readiness_gate' | 'blocked'

export type WebSearchMapPlanningQaGateId =
  | 'web_search_evidence'
  | 'map_stack_evidence'
  | 'planning_source_integrity'
  | 'location_candidate_integrity'
  | 'turf_planning_calculations'
  | 'maplibre_planning_render'
  | 'deckgl_planning_overlay'
  | 'cesiumjs_3d_planning'
  | 'capture_artifacts'
  | 'artifact_privacy'
  | 'blocked_features'

export interface WebSearchMapPlanningConfig {
  phase: '50F'
  mode: WebSearchMapPlanningMode
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  canonicalPhase49PRunId: 'phase49p-20260603T21361'
  canonicalPhase50ERunId: 'phase50e-20260604T130326'
  generatedAssetsBucket: string
  qaBucket: string
  reportObjectPrefix: 'activation-map-geospatial/phase50f'
  viewport: { width: 1280; height: 720; deviceScaleFactor: 1 }
  previewMaxWidth: 960
  thumbnailWidth: 320
  maxLocationCandidates: 6
  maxMapCaptures: 2
}

export interface WebSearchMapPlanningSafetyFlags {
  webSearchEvidenceAllowed: true
  liveSearchAllowed: false
  generatedPlanningSourcesAllowed: true
  locationCandidatesGeneratedOnly: true
  liveGeocodingAllowed: false
  liveRoutingAllowed: false
  tileDownloadAllowed: false
  liveTileProviderAllowed: false
  publicOsmTileAllowed: false
  paidMapProviderAllowed: false
  publicSearxngAllowed: false
  broadCrawlingAllowed: false
  arbitraryUrlCaptureAllowed: false
  mapLibreRenderAllowed: true
  mapLibreRenderScope: 'local_offline_fixture_only'
  deckGlOverlayAllowed: true
  deckGlOverlayScope: 'local_offline_fixture_only'
  cesiumJsRenderAllowed: true
  cesiumJsRenderScope: 'local_offline_fixture_only'
  cesiumIonAllowed: false
  liveTerrainAllowed: false
  liveImageryAllowed: false
  threeDTilesAllowed: false
  d3RuntimeAllowed: false
  threeJsRuntimeAllowed: false
  playwrightCaptureAllowed: true
  sharpProcessingAllowed: true
  publicArtifactAllowed: false
  signedUrlSourceOfTruthAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadMediaAllowed: false
}

export interface WebSearchMapEvidencePhase {
  phase: string
  status: 'completed' | 'approval_review_complete'
  runId?: string
  summary: string
  artifactUris: string[]
  blockers: string[]
  warnings: string[]
}

export interface WebSearchMapEvidenceChain {
  generatedAt: string
  phases: WebSearchMapEvidencePhase[]
  evidenceStatus: 'ready' | 'blocked'
  blockers: string[]
  warnings: string[]
}

export interface PlanningSourceRecord {
  sourceId: string
  sourcePhase: '49P'
  title: string
  url: string
  domain: string
  sourceType: 'generated_planning_source'
  planningTopic: 'map_geospatial_planning'
  sourceSummary: string
  attributionRequired: true
  generatedFixture: true
  liveSearchUsed: false
  publicSearxngUsed: false
  paidProviderUsed: false
  captureAllowed: false
  extractionAllowed: false
}

export interface LocationCandidate {
  candidateId: string
  sourceId: string
  name: string
  role: 'planning_anchor' | 'candidate_location' | 'route_node' | 'context_area'
  coordinates: [number, number]
  confidence: number
  generatedFixture: true
  realWorldVerified: false
  userLocationUsed: false
  liveGeocodingUsed: false
  liveRoutingUsed: false
  evidenceSummary: string
}

export interface WebSearchMapPlanningGeoJson {
  generatedFixture: true
  realWorldVerified: false
  userLocationUsed: false
  liveGeocodingUsed: false
  liveRoutingUsed: false
  points: GeoJsonFeatureCollection
  routes: GeoJsonFeatureCollection
  polygons: GeoJsonFeatureCollection
  combined: GeoJsonFeatureCollection
  fixture: GeneratedGeoJsonFixture
}

export interface WebSearchMap2DRenderResult {
  style: MapLibreLocalStyle
  styleValidation: MapLibreLocalStyleValidation
  overlayData: DeckGlOverlayData
  layerManifest: DeckGlLayerManifest
  renderMetadata?: DeckGlRenderMetadata
  networkRequestsObserved: NetworkRequestRecord[]
  externalNetworkRequestsObserved: NetworkRequestRecord[]
  sharpProcessing?: SharpDeckGlScreenshotProcessing
}

export interface WebSearchMap3DRenderResult {
  planningData: Cesium3DPlanningData
  sceneConfig: CesiumLocalSceneConfig
  renderMetadata?: CesiumRenderMetadata
  networkRequestsObserved: NetworkRequestRecord[]
  externalNetworkRequestsObserved: NetworkRequestRecord[]
  sharpProcessing?: SharpCesiumScreenshotProcessing
}

export interface WebSearchMapPlanningArtifact {
  id: string
  kind: 'private_json' | 'private_geojson' | 'private_html' | 'private_png'
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface WebSearchMapPlanningManifest {
  runId: string
  phase: '50F'
  mode: WebSearchMapPlanningMode
  webSearchEvidenceRunId: WebSearchMapPlanningConfig['canonicalPhase49PRunId']
  mapEvidenceRunId: WebSearchMapPlanningConfig['canonicalPhase50ERunId']
  generatedFixture: true
  liveSearchUsed: false
  liveGeocodingUsed: false
  liveRoutingUsed: false
  liveTilesUsed: false
  paidMapProviderUsed: false
  publicSearxngUsed: false
  publicArtifactAccess: false
  planningSources: PlanningSourceRecord[]
  locationCandidates: LocationCandidate[]
  turfSummary: TurfCalculationResult['summary']
  map2D?: {
    screenshotPath?: string
    dimensions?: { width: number; height: number }
    externalNetworkRequestsObserved: number
  }
  map3D?: {
    screenshotPath?: string
    dimensions?: { width: number; height: number }
    externalNetworkRequestsObserved: number
  }
  artifacts: WebSearchMapPlanningArtifact[]
  warnings: string[]
  blockers: string[]
}

export interface WebSearchMapPlanningQaGate {
  gateId: WebSearchMapPlanningQaGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface WebSearchMapPlanningQaSummary {
  status: 'passed' | 'blocked'
  gates: WebSearchMapPlanningQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface WebSearchMapPlanningExecutionReport {
  ok: boolean
  phase: '50F'
  runId: string
  projectId: 'reeditpro'
  mode: WebSearchMapPlanningMode
  evidenceChain: WebSearchMapEvidenceChain
  planningSources: PlanningSourceRecord[]
  locationCandidates: LocationCandidate[]
  geojson: WebSearchMapPlanningGeoJson
  turfCalculations: TurfCalculationResult
  map2D: WebSearchMap2DRenderResult
  map3D: WebSearchMap3DRenderResult
  manifest?: WebSearchMapPlanningManifest
  artifacts: WebSearchMapPlanningArtifact[]
  qa: WebSearchMapPlanningQaSummary
  phase50GReadiness: Phase50GReadiness
  safety: WebSearchMapPlanningSafetyFlags & {
    liveSearchExecuted: false
    liveGeocodingRequestMade: false
    liveRoutingRequestMade: false
    liveTileRequestMade: false
    publicOsmTileRequestMade: false
    paidMapProviderCalled: false
    publicSearxngUsed: false
    publicAccessEnabled: false
  }
  blockers: string[]
  warnings: string[]
}

export interface WebSearchMapPlanningReport {
  reportId: 'activation-phase-50f-web-search-map-planning-e2e'
  createdAt: string
  phase: '50F'
  status: WebSearchMapPlanningStatus
  config: WebSearchMapPlanningConfig
  executionReport?: WebSearchMapPlanningExecutionReport
  evidenceChain: WebSearchMapEvidenceChain
  qa: WebSearchMapPlanningQaSummary
  safetyFlags: WebSearchMapPlanningSafetyFlags
  phase50GReadiness: Phase50GReadiness
  blockers: string[]
  warnings: string[]
}
