import type {
  MetadataRouteArtifactScope,
  MetadataRouteCostGuardReport,
  MetadataRouteExecutionReport,
  MetadataRoutePlanSnapshot,
  MetadataRouteResolutionReport,
  MetadataRouteSecretGuardReport,
  MetadataRouteSidecarValidationReport,
  MetadataRouteValidationResult,
} from './metadataRouteDryRunTypes'

export function buildMetadataRouteAuditReport(input: {
  runId: string
  planSnapshot: MetadataRoutePlanSnapshot
  artifactScope: MetadataRouteArtifactScope
  planSnapshotValidation: MetadataRouteValidationResult
  artifactScopeValidation: MetadataRouteValidationResult
  secretPayloadGuard: MetadataRouteSecretGuardReport
  routeResolutionReport: MetadataRouteResolutionReport
  costGuardReport: MetadataRouteCostGuardReport
  sidecarValidationReport: MetadataRouteSidecarValidationReport
  executionReport: MetadataRouteExecutionReport
}) {
  return {
    phase: '44O',
    runId: input.runId,
    status: input.executionReport.status,
    candidateId: input.planSnapshot.candidateId,
    routeId: input.planSnapshot.routeId,
    toolId: input.planSnapshot.toolId,
    capabilityId: input.planSnapshot.capabilityId,
    inputArtifactScopeId: input.artifactScope.inputArtifactScopeId,
    outputArtifactScopeId: input.artifactScope.outputArtifactScopeId,
    planSnapshotValidation: input.planSnapshotValidation.status,
    artifactScopeValidation: input.artifactScopeValidation.status,
    secretPayloadGuard: input.secretPayloadGuard.status,
    routeResolution: input.routeResolutionReport.status,
    costGuard: input.costGuardReport.status,
    sidecarValidation: input.sidecarValidationReport.status,
    dryRunExecution: input.executionReport.status,
    noSecretPayloadAccess: input.executionReport.secretPayloadAccessPerformed === false,
    noDuckDbRuntime: input.executionReport.duckDbRuntimePerformed === false,
    noWorkerExecution: input.executionReport.workerExecutionPerformed === false,
    noToolExecution: input.executionReport.toolExecutionPerformed === false,
    noSidecarProcess: input.sidecarValidationReport.sidecarProcessStarted === false,
    noMediaAccess: input.executionReport.mediaAccessPerformed === false,
    noProviderCalls: input.executionReport.providerCallsPerformed === false,
    auditConclusion: input.executionReport.status === 'passed'
      ? 'metadata_route_dry_run_passed_restricted_scope'
      : 'metadata_route_dry_run_blocked_fail_closed',
  }
}
