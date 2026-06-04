export type MapGeospatialApprovalStatus = 'approval_review_complete' | 'blocked_pending_evidence' | 'blocked_all'

export type MapGeospatialToolId =
  | 'maplibre-gl-js'
  | 'turf-js'
  | 'deck-gl'
  | 'cesium-js'
  | 'openstreetmap-open-data'
  | 'pmtiles'
  | 'tileserver-gl'
  | 'martin'
  | 'nominatim'
  | 'photon'
  | 'pelias'
  | 'osrm'
  | 'valhalla'

export type MapGeospatialQaGateId =
  | 'tool_evidence'
  | 'license_review'
  | 'free_open_source_default'
  | 'ownership_boundaries'
  | 'data_provider_policy'
  | 'risk_register_complete'
  | 'future_scope_defined'
  | 'command_plan_blocked'
  | 'package_scripts_present'
  | 'blocked_features'

export type MapGeospatialRiskSeverity = 'blocker' | 'warning'

export interface MapGeospatialApprovalConfig {
  phase: '50A'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  runtimeMode: 'map_geospatial_approval_static'
  reportObjectPrefix: 'activation-map-geospatial/phase50a'
}

export interface MapGeospatialToolEvidence {
  toolId: MapGeospatialToolId
  displayName: string
  role: string
  category:
    | 'browser_map_renderer'
    | 'geospatial_calculation'
    | 'advanced_overlay_visualization'
    | 'three_d_geospatial'
    | 'open_map_data'
    | 'future_tile_infrastructure'
    | 'future_geocoding'
    | 'future_routing'
  defaultStack: boolean
  futureScoped: boolean
  requiresApiKeyByDefault: boolean
  paidProviderDependencyByDefault: boolean
  runtimeAllowedInPhase50A: false
  sourceUrls: string[]
  license: string
  licenseStatus: 'clear_for_planning' | 'review_required_before_runtime' | 'future_scope_pending_evidence'
  approvedPlanningUses: string[]
  runtimeNotes: string[]
  limitations: string[]
}

export interface MapGeospatialLicenseReview {
  toolId: MapGeospatialToolId
  licenseIdentified: boolean
  licenseName: string
  officialSourceUrl: string
  officialDocsUrl: string
  commercialUseStatus: string
  redistributionStatus: string
  selfHostingStatus: string
  requiresApiKeyByDefault: boolean
  paidProviderDependencyByDefault: boolean
  codexDecision: 'staging_planning_approved' | 'pending_evidence' | 'blocked'
  decisionReason: string
}

export interface MapGeospatialToolScope {
  owner: 'map_geospatial' | 'ai_tools' | 'track_b' | 'web_search'
  ownedCapabilities: string[]
  retainedElsewhere: string[]
  blockedInPhase50A: string[]
}

export interface MapGeospatialDataPolicy {
  freeOpenSourceOpenDataFirst: true
  privateSelfHostedGeneratedFixturesFirst: true
  paidMapProvidersAllowed: false
  publicTileHotlinkingForBetaProdAllowed: false
  osmAttributionRequired: true
  offlineStaticGeneratedBeforeLiveDependencies: true
  mapboxPaidTilesAllowed: false
  googleMapsApisAllowed: false
  cesiumIonPaidAssetsAllowed: false
  publicNominatimHeavyUseAllowed: false
  publicOsmTileProdBetaHotlinkingAllowed: false
  arbitraryTileEndpointsAllowed: false
  frontendMapProviderSecretsAllowed: false
  publicArtifactsAllowed: false
  notes: string[]
}

export interface MapGeospatialRisk {
  riskId: string
  tool: string
  severity: MapGeospatialRiskSeverity
  currentStatus: 'blocked_by_policy' | 'warning_tracked'
  mitigation: string
  evidenceRequiredToClear: string
}

export interface MapGeospatialFuturePhase {
  phaseId: '50B' | '50C' | '50D' | '50E' | '50F' | '50G'
  title: string
  scope: string[]
  allowed: boolean
  blockedInPhase50A: true
}

export interface MapGeospatialCommandPlan {
  commandId: string
  phase: MapGeospatialFuturePhase['phaseId']
  purpose: string
  textOnlyByDefault: true
  allowedInPhase50A: false
  blockedReason: string
  executableCommand: null
  commandText: string
}

export interface MapGeospatialQaGate {
  gateId: MapGeospatialQaGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface MapGeospatialQaSummary {
  status: 'passed' | 'blocked'
  gates: MapGeospatialQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface MapGeospatialApprovalReport {
  reportId: 'activation-phase-50a-map-geospatial-approval'
  createdAt: string
  phase: '50A'
  status: MapGeospatialApprovalStatus
  config: MapGeospatialApprovalConfig
  tools: MapGeospatialToolEvidence[]
  licenseReviews: MapGeospatialLicenseReview[]
  toolScopes: MapGeospatialToolScope[]
  dataPolicy: MapGeospatialDataPolicy
  risks: MapGeospatialRisk[]
  futureScope: MapGeospatialFuturePhase[]
  commandPlans: MapGeospatialCommandPlan[]
  codexDecision: 'staging_planning_approved_free_open_source_map_stack'
  recommendedPhase50BPath: string
  phase50BReadiness: 'ready_for_generated_maplibre_turf_fixture_planning_only' | 'blocked'
  qa: MapGeospatialQaSummary
  blockers: string[]
  warnings: string[]
  mapLibrePlanningAllowed: boolean
  turfPlanningAllowed: boolean
  deckGlPlanningAllowed: boolean
  cesiumJsPlanningAllowed: boolean
  mapRuntimeAllowed: false
  tileDownloadAllowed: false
  liveGeocodingAllowed: false
  liveRoutingAllowed: false
  paidMapProviderAllowed: false
  publicArtifactAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadMediaAllowed: false
  providerAllowed: false
  revideoAllowed: false
}
