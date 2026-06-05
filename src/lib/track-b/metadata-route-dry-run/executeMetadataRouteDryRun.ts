import type {
  MetadataRouteCostGuardReport,
  MetadataRouteExecutionReport,
  MetadataRouteResolutionReport,
  MetadataRouteSecretGuardReport,
  MetadataRouteSidecarValidationReport,
  MetadataRouteValidationResult,
} from './metadataRouteDryRunTypes'

export function executeMetadataRouteDryRun(input: {
  candidateId: string
  planSnapshotValidation: MetadataRouteValidationResult
  artifactScopeValidation: MetadataRouteValidationResult
  secretPayloadGuard: MetadataRouteSecretGuardReport
  routeResolutionReport: MetadataRouteResolutionReport
  costGuardReport: MetadataRouteCostGuardReport
  sidecarValidationReport: MetadataRouteSidecarValidationReport
}): MetadataRouteExecutionReport {
  const blockedReasons = [
    ...input.planSnapshotValidation.blockedReasons,
    ...input.artifactScopeValidation.blockedReasons,
    ...input.secretPayloadGuard.blockedReasons,
    ...input.routeResolutionReport.blockedReasons,
    ...input.costGuardReport.blockedReasons,
    ...input.sidecarValidationReport.blockedReasons,
  ]
  const uniqueBlockedReasons = [...new Set(blockedReasons)]
  const passed = uniqueBlockedReasons.length === 0
  return {
    status: passed ? 'passed' : 'blocked',
    passed,
    blockedReasons: uniqueBlockedReasons,
    warnings: passed ? ['metadata_route_dry_run_completed_without_runtime_execution'] : [],
    metadataRouteDryRunStatus: passed ? 'passed' : 'blocked',
    candidateId: input.candidateId,
    routeResolved: input.routeResolutionReport.routeResolved,
    routeEligibleForFutureDryRun: input.routeResolutionReport.routeEligibleForFutureDryRun,
    executionPerformed: false,
    routeExecutionPerformed: false,
    runtimeExecutionPerformed: false,
    workerExecutionPerformed: false,
    toolExecutionPerformed: false,
    sidecarExecutionPerformed: false,
    duckDbRuntimePerformed: false,
    polarsRuntimePerformed: false,
    providerCallsPerformed: false,
    mediaAccessPerformed: false,
    audioAccessPerformed: false,
    ocrRuntimePerformed: false,
    vlmRuntimePerformed: false,
    secretPayloadAccessPerformed: false,
  }
}
