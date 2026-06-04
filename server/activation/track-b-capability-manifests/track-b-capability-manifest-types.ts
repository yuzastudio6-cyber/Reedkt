export type TrackBToolId =
  | 'deepfilternet'
  | 'signalsmith_stretch'
  | 'demucs'
  | 'paddleocr'
  | 'paddlepaddle'
  | 'qwen3_vl'
  | 'vllm'
  | 'opencv'
  | 'pyav'
  | 'pyscenedetect'
  | 'sharp_libvips'
  | 'duckdb'
  | 'polars'
  | 'web_capability_profiler'
  | 'desktop_capability_profiler'
  | 'local_worker_sidecar_planning'
  | 'cost_estimator'
  | 'tool_route_manifest_integration'

export type TrackBToolFamily =
  | 'audio_timing'
  | 'ocr'
  | 'vlm'
  | 'media_data'
  | 'hybrid_compute_cost_routing'

export type TrackBCapabilityStatus =
  | 'not_started'
  | 'evidence_planned'
  | 'generated_fixture_passed'
  | 'controlled_sample_passed'
  | 'phase_complete_restricted_scope'
  | 'internally_beta_ready_candidate_restricted_scope'
  | 'blocked'
  | 'excluded_for_initial_internal_testing'
  | 'pending_approval'
  | 'blocked_pending_training_data_provenance'

export type TrackBInitialTestingGroup = 'included' | 'excluded' | 'not_started'

export interface TrackBEvidenceReference {
  phase: string
  pr?: string
  report?: string
  summary: string
}

export interface TrackBCapabilityManifest {
  toolId: TrackBToolId
  displayName: string
  family: TrackBToolFamily
  status: TrackBCapabilityStatus
  initialInternalTestingGroup: TrackBInitialTestingGroup
  restrictedInternalTestingEligible: boolean
  restrictedInternalScope: string
  sourceEvidenceStatus: TrackBCapabilityStatus
  licenseEvidenceStatus: TrackBCapabilityStatus
  runtimeEvidenceStatus: TrackBCapabilityStatus
  privateArtifactPolicy: string
  runtimeLocationPolicy: string
  routeManifestPolicy: string
  ownerBoundary: string
  consumerBoundaries: string[]
  dependencyCaveats: string[]
  evidence: TrackBEvidenceReference[]
  testCommands: string[]
  blockedCapabilities: string[]
  blockedScopes: string[]
  nextPhase: string
}

export interface TrackBCapabilityReports {
  plan: Record<string, unknown>
  toolRegistry: Record<string, unknown>
  combinedManifests: Record<string, unknown>
  initialInternalTestingManifest: Record<string, unknown>
  blockedCapabilities: Record<string, unknown>
  consumerBoundaries: Record<string, unknown>
  runtimeRequirements: Record<string, unknown>
  artifactPolicy: Record<string, unknown>
  costCapacity: Record<string, unknown>
  testCommands: Record<string, unknown>
  routeHandoff: Record<string, unknown>
  readinessSummary: Record<string, unknown>
  validationReport: Record<string, unknown>
  capabilityManifestReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
  perTool: Record<TrackBToolId, TrackBCapabilityManifest>
}
