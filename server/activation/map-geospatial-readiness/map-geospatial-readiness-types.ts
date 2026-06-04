export type MapGeospatialReadinessStatus = 'planned' | 'completed' | 'blocked'
export type MapGeospatialReadinessMode = 'map_geospatial_internal_readiness_gate'
export type MapGeospatialReadinessDecision = 'ready_for_controlled_internal_testing' | 'blocked'
export type Phase52AReadiness = 'ready_for_shared_agent_and_tool_ownership_architecture' | 'blocked'

export type MapGeospatialReadinessQaGateId =
  | 'phase_evidence_chain'
  | 'maplibre_ready'
  | 'turf_ready'
  | 'deckgl_ready'
  | 'cesiumjs_ready'
  | 'web_search_map_e2e_ready'
  | 'provider_data_policy'
  | 'network_artifact_privacy'
  | 'ownership_boundaries'
  | 'failure_policy'
  | 'readiness_docs_consistency'
  | 'blocked_features'

export type MapGeospatialEvidencePhaseId = '49P' | '50A' | '50B' | '50C' | '50D' | '50E' | '50F'

export interface MapGeospatialReadinessConfig {
  phase: '50G'
  mode: MapGeospatialReadinessMode
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  generatedAssetsBucket: string
  qaBucket: string
  artifactPrefixBase: 'activation-map-geospatial/phase50g'
  canonicalPhase49PRunId: 'phase49p-20260603T21361'
  canonicalPhase50BRunId: 'phase50b-20260604T01114'
  canonicalPhase50CRunId: 'phase50c-20260604T020852'
  canonicalPhase50DRunId: 'phase50d-20260604T030406'
  canonicalPhase50ERunId: 'phase50e-20260604T130326'
  canonicalPhase50FRunId: 'phase50f-20260604T141223'
}

export interface MapGeospatialReadinessSafetyFlags {
  readinessAuditOnly: true
  newMapRenderingAllowed: false
  newPlaywrightCaptureAllowed: false
  liveTileProviderAllowed: false
  publicOsmTileAllowed: false
  tileDownloadAllowed: false
  liveGeocodingAllowed: false
  liveRoutingAllowed: false
  paidMapProviderAllowed: false
  mapboxPaidApiAllowed: false
  googleMapsApiAllowed: false
  cesiumIonAllowed: false
  liveTerrainAllowed: false
  liveImageryAllowed: false
  threeDTilesAllowed: false
  publicArtifactAllowed: false
  signedUrlSourceOfTruthAllowed: false
  arbitraryUserLocationAllowed: false
  d3RuntimeAllowed: false
  threeJsRuntimeAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadMediaAllowed: false
}

export interface MapGeospatialEvidencePhase {
  phase: MapGeospatialEvidencePhaseId
  status: 'completed' | 'approval_review_complete'
  runId?: string
  summary: string
  readiness: string
  artifactUris: string[]
  evidenceSource: 'canonical_gcs' | 'static_docs'
  blockers: string[]
  warnings: string[]
}

export interface MapGeospatialEvidenceChain {
  generatedAt: string
  phases: MapGeospatialEvidencePhase[]
  evidenceStatus: 'ready' | 'blocked'
  blockers: string[]
  warnings: string[]
}

export interface MapGeospatialReadinessScopeManifest {
  phase: '50G'
  runId: string
  includedFeatures: string[]
  blockedFeatures: string[]
  toolScope: {
    mapLibre: 'controlled_internal_local_offline_ready'
    turf: 'controlled_internal_generated_calculations_ready'
    deckGl: 'controlled_internal_local_offline_overlay_ready'
    cesiumJs: 'controlled_internal_local_offline_3d_ready'
    playwright: 'local_fixture_capture_evidence_only'
    sharp: 'screenshot_derivative_consumer_only_track_b_owned'
    webSearch: 'phase49p_evidence_handoff_only'
  }
  ownershipScope: MapGeospatialOwnershipAudit
  dataProviderPolicy: MapGeospatialProviderDataAudit
  artifactPolicy: MapGeospatialArtifactPrivacyAudit
  networkPolicy: {
    externalNetworkRequestsAllowed: false
    canonicalRenderPhasesExternalRequestCount: 0
    actionIfExternalRequestObserved: 'fail_readiness'
  }
  failurePolicy: MapGeospatialFailurePolicy
  readinessDecision: MapGeospatialReadinessDecision
  mapGeospatialInternalTestingReady: boolean
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadMediaAllowed: false
}

export interface MapGeospatialProviderDataAudit {
  auditId: 'phase50g-provider-data-policy-audit'
  liveTileProviderAllowed: false
  publicOsmTileAllowed: false
  tileDownloadAllowed: false
  mapboxPaidApiAllowed: false
  googleMapsApiAllowed: false
  cesiumIonAllowed: false
  liveTerrainAllowed: false
  liveImageryAllowed: false
  threeDTilesAllowed: false
  liveGeocodingAllowed: false
  liveRoutingAllowed: false
  arbitraryTileEndpointAllowed: false
  paidMapProviderAllowed: false
  publicArtifactPathAllowed: false
  osmAttributionCaveatsDocumented: boolean
  futureSelfHostedTilePathDocumented: boolean
  futureScopedCandidates: string[]
  blockers: string[]
  warnings: string[]
}

export interface MapGeospatialDependencyAudit {
  auditId: 'phase50g-map-geospatial-dependency-audit'
  expectedPresent: Array<{ packageName: string; version: string; present: boolean; ownership: 'map_geospatial' | 'web_search' | 'track_b_consumed' }>
  expectedAbsentOrInactive: Array<{ packageName: string; present: boolean; expectedState: 'absent' | 'inactive_or_future_scoped'; blockerIfPresent: boolean }>
  packageLockChangedInPhase50G: boolean
  blockers: string[]
  warnings: string[]
}

export interface MapGeospatialArtifactVerificationEntry {
  artifactId: string
  phase: MapGeospatialEvidencePhaseId
  gcsUri: string
  required: boolean
  exists: boolean
  metadataOnly: true
  publicAccessAllowed: false
  blockers: string[]
  warnings: string[]
}

export interface MapGeospatialArtifactPrivacyAudit {
  auditId: 'phase50g-artifact-privacy-audit'
  privateGcsOnly: boolean
  signedUrlsAsSourceOfTruthAllowed: false
  publicArtifactsAllowed: false
  generatedScreenshotsCommitted: false
  privateReportsCommitted: false
  canonicalEvidenceUsed: boolean
  artifactVerification: MapGeospatialArtifactVerificationEntry[]
  blockers: string[]
  warnings: string[]
}

export interface MapGeospatialOwnershipAudit {
  auditId: 'phase50g-ownership-boundary-audit'
  mapGeospatialOwns: string[]
  aiToolsOwns: string[]
  trackBOwns: string[]
  webSearchOwns: string[]
  sharpOwnershipPreserved: boolean
  d3ThreeOwnershipPreserved: boolean
  blockers: string[]
  warnings: string[]
}

export interface MapGeospatialFailurePolicyEntry {
  failureId: string
  trigger: string
  action: 'reject' | 'block_readiness' | 'fail_qa' | 'defer_to_future_phase'
  summary: string
}

export interface MapGeospatialFailurePolicy {
  policyId: 'phase50g-map-geospatial-fail-closed-policy'
  entries: MapGeospatialFailurePolicyEntry[]
  failClosed: true
  blockers: string[]
  warnings: string[]
}

export interface MapGeospatialReadinessCommandPlan {
  planId: 'phase50g-map-geospatial-readiness-command-plan'
  defaultMode: 'static_report_only'
  commands: Array<{
    commandId: string
    description: string
    command: string
    mutating: boolean
    allowedInPhase50G: boolean
  }>
  blockedAlways: string[]
}

export interface MapGeospatialReadinessIamPlan {
  phase: '50G'
  mode: 'report_only'
  defaultMutationAllowed: false
  generatedAssetsPrefix: string
  qaPrefix: string
  conditionalBindingsIfUploadBlocked: Array<{
    role: 'roles/storage.objectCreator'
    bucket: string
    conditionPrefix: string
  }>
  forbiddenBindings: string[]
  notes: string[]
}

export interface MapGeospatialReadinessQaGate {
  gateId: MapGeospatialReadinessQaGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface MapGeospatialReadinessQaSummary {
  status: 'passed' | 'blocked'
  gates: MapGeospatialReadinessQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface MapGeospatialReadinessArtifact {
  id: string
  kind: 'private_json'
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface MapGeospatialReadinessExecutionReport {
  ok: boolean
  phase: '50G'
  runId: string
  createdAt: string
  projectId: 'reeditpro'
  mode: MapGeospatialReadinessMode
  evidenceChain: MapGeospatialEvidenceChain
  scopeManifest: MapGeospatialReadinessScopeManifest
  providerDataAudit: MapGeospatialProviderDataAudit
  dependencyAudit: MapGeospatialDependencyAudit
  ownershipAudit: MapGeospatialOwnershipAudit
  artifactPrivacyAudit: MapGeospatialArtifactPrivacyAudit
  failurePolicy: MapGeospatialFailurePolicy
  qa: MapGeospatialReadinessQaSummary
  artifacts: MapGeospatialReadinessArtifact[]
  mapGeospatialInternalTestingReady: boolean
  phase52AReadiness: Phase52AReadiness
  safetyFlags: MapGeospatialReadinessSafetyFlags
  blockers: string[]
  warnings: string[]
}

export interface MapGeospatialReadinessReport {
  reportId: 'activation-phase-50g-map-geospatial-readiness'
  createdAt: string
  phase: '50G'
  status: MapGeospatialReadinessStatus
  config: MapGeospatialReadinessConfig
  executionReport?: MapGeospatialReadinessExecutionReport
  evidenceChain: MapGeospatialEvidenceChain
  scopeManifest: MapGeospatialReadinessScopeManifest
  providerDataAudit: MapGeospatialProviderDataAudit
  dependencyAudit: MapGeospatialDependencyAudit
  ownershipAudit: MapGeospatialOwnershipAudit
  artifactPrivacyAudit: MapGeospatialArtifactPrivacyAudit
  failurePolicy: MapGeospatialFailurePolicy
  qa: MapGeospatialReadinessQaSummary
  safetyFlags: MapGeospatialReadinessSafetyFlags
  mapGeospatialInternalTestingReady: boolean
  phase52AReadiness: Phase52AReadiness
  blockers: string[]
  warnings: string[]
}
