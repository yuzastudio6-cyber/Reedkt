import type { TrackBToolFamily, TrackBToolId } from '../track-b-capability-manifests/track-b-capability-manifest-types'

export type TrackBReadinessRollupStatus =
  | 'internally_beta_ready_candidate_restricted_scope'
  | 'phase_complete_restricted_scope'
  | 'blocked_pending_training_data_provenance'
  | 'excluded_for_initial_internal_testing'
  | 'blocked'

export interface TrackBToolStatusRollupEntry {
  toolId: TrackBToolId
  family: TrackBToolFamily
  track: 'track_b'
  currentStatus: TrackBReadinessRollupStatus
  internalReady: boolean
  initialInternalTestingIncluded: boolean
  allowedScope: string[]
  blockedScope: string[]
  latestEvidencePr?: number
  latestEvidencePhase: string
  artifactPrefix?: string
  nextRequiredPhase: string
  supabaseExportEligible: boolean
}

export interface TrackBSupabaseMilestoneExportRecord {
  phaseId: string
  track: 'track_b'
  family: TrackBToolFamily | 'hybrid_compute'
  toolIds: TrackBToolId[]
  milestoneName: string
  status: string
  readinessStatus: string
  betaStatus: string
  branch: string
  prNumber?: number
  prUrl?: string
  commitSha?: string
  artifactPrefix?: string
  artifactObjectCount?: number
  allowedScope: string[]
  blockedScopes: string[]
  nextPhase: string
  createdFromReportPath: string
  exportVersion: string
}

export interface TrackBReadinessRollupReports {
  plan: Record<string, unknown>
  prEvidenceInventory: Record<string, unknown>
  toolStatusRollup: Record<string, unknown>
  phaseStatusRollup: Record<string, unknown>
  internalReadyScopeRollup: Record<string, unknown>
  blockedScopeRollup: Record<string, unknown>
  routeDryRunStatusRollup: Record<string, unknown>
  supabaseMilestoneExport: Record<string, unknown>
  supabaseMilestoneExportSchema: Record<string, unknown>
  nextPhaseRecommendation: Record<string, unknown>
  readinessRollupReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
  blockerReport: Record<string, unknown>
}
