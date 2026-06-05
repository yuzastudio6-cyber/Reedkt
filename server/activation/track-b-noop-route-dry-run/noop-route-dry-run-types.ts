import type {
  NoopRouteExecutionReport,
  NoopRouteSecretGuardReport,
} from '../../../src/lib/track-b/noop-route-dry-run'

export interface TrackBNoopRouteDryRunReports {
  plan: Record<string, unknown>
  priorEvidenceInventory: Record<string, unknown>
  secretPayloadGuard: NoopRouteSecretGuardReport
  planSnapshotValidation: Record<string, unknown>
  artifactScopeValidation: Record<string, unknown>
  executionReport: NoopRouteExecutionReport
  auditReport: Record<string, unknown>
  failureReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  blockerReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
