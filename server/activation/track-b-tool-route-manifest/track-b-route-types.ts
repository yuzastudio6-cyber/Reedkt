import type { TrackBToolFamily, TrackBToolId, TrackBEvidenceReference } from '../track-b-capability-manifests/track-b-capability-manifest-types'

export type TrackBRouteStatus =
  | 'route_enabled_restricted_internal'
  | 'route_disabled_blocked'
  | 'route_disabled_not_started'
  | 'route_disabled_excluded'
  | 'route_disabled_pending_integration'
  | 'route_handoff_only'

export type TrackBCostCapacityClass =
  | 'cpu_low'
  | 'cpu_medium'
  | 'cpu_heavy'
  | 'gpu_required'
  | 'blocked_unknown'
  | 'pending_estimator'

export interface TrackBRouteEntry {
  routeId: string
  toolId: TrackBToolId
  family: TrackBToolFamily | 'hybrid_compute'
  track: 'track_b'
  capabilityIds: string[]
  routeStatus: TrackBRouteStatus
  routeable: boolean
  routeableReason: string
  initialInternalTestingIncluded: boolean
  allowedConsumers: string[]
  blockedConsumers: string[]
  ownershipBoundary: string
  approvedInputArtifactTypes: string[]
  blockedInputArtifactTypes: string[]
  approvedOutputArtifactTypes: string[]
  blockedOutputArtifactTypes: string[]
  requiredPlanSnapshotFields: string[]
  requiredArtifactScopeFields: string[]
  requiredConfirmations: string[]
  runtimeAdapterStatus: string
  runtimeExecutionAllowed: boolean
  routeExecutionAllowed: boolean
  privateGcsPrefixes: string[]
  publicOutputAllowed: boolean
  providerCallsAllowed: boolean
  broadMediaAllowed: boolean
  arbitraryMediaAllowed: boolean
  productionAllowed: boolean
  externalBetaAllowed: boolean
  failureBehavior: string
  costCapacityClass: TrackBCostCapacityClass
  costEstimateSource: string
  prerequisitePhases: string[]
  evidenceRefs: TrackBEvidenceReference[]
  testCommands: string[]
  blockedReasons: string[]
  nextRequiredPhase: string
}

export interface TrackBRouteReports {
  plan: Record<string, unknown>
  routeToolRegistry: Record<string, unknown>
  routeManifest: Record<string, unknown>
  enabledInternalManifest: Record<string, unknown>
  disabledManifest: Record<string, unknown>
  planSnapshotPolicy: Record<string, unknown>
  artifactScopePolicy: Record<string, unknown>
  consumerPolicy: Record<string, unknown>
  failurePolicy: Record<string, unknown>
  costCapacitySummary: Record<string, unknown>
  testCommandManifest: Record<string, unknown>
  validationReport: Record<string, unknown>
  integrationReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
