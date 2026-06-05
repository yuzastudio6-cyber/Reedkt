import type {
  MetadataRouteCostGuardReport,
  MetadataRouteExecutionReport,
  MetadataRouteResolutionReport,
  MetadataRouteSecretGuardReport,
  MetadataRouteSidecarValidationReport,
} from '../../../src/lib/track-b/metadata-route-dry-run'

export interface TrackBMetadataRouteDryRunReports {
  plan: Record<string, unknown>
  priorEvidenceInventory: Record<string, unknown>
  secretPayloadGuard: MetadataRouteSecretGuardReport
  planSnapshotValidation: Record<string, unknown>
  artifactScopeValidation: Record<string, unknown>
  routeResolutionReport: MetadataRouteResolutionReport
  costGuardReport: MetadataRouteCostGuardReport
  sidecarValidationReport: MetadataRouteSidecarValidationReport
  executionReport: MetadataRouteExecutionReport
  auditReport: Record<string, unknown>
  failureReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  blockerReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
