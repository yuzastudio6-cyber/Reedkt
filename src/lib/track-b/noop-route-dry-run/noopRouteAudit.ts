import type {
  NoopRouteArtifactScope,
  NoopRouteExecutionReport,
  NoopRoutePlanSnapshot,
  NoopRouteSecretGuardReport,
  NoopRouteValidationResult,
} from './noopRouteDryRunTypes'

export function buildNoopRouteAuditReport(input: {
  runId: string
  planSnapshot: NoopRoutePlanSnapshot
  artifactScope: NoopRouteArtifactScope
  planSnapshotValidation: NoopRouteValidationResult
  artifactScopeValidation: NoopRouteValidationResult
  secretPayloadGuard: NoopRouteSecretGuardReport
  executionReport: NoopRouteExecutionReport
}) {
  return {
    phase: '44M',
    runId: input.runId,
    status: input.executionReport.status,
    candidateId: input.planSnapshot.candidateId,
    planSnapshotId: input.planSnapshot.planSnapshotId,
    inputArtifactScopeId: input.artifactScope.inputArtifactScopeId,
    outputArtifactScopeId: input.artifactScope.outputArtifactScopeId,
    planSnapshotValidation: input.planSnapshotValidation.status,
    artifactScopeValidation: input.artifactScopeValidation.status,
    secretPayloadGuard: input.secretPayloadGuard.status,
    noopExecution: input.executionReport.status,
    noPersistentIdentity: true,
    noSecretPayloadAccess: input.executionReport.secretPayloadAccessPerformed === false,
    noWorkerExecution: input.executionReport.workerExecutionPerformed === false,
    noToolExecution: input.executionReport.toolExecutionPerformed === false,
    noSidecarProcess: input.executionReport.sidecarProcessStarted === false,
    noMediaAccess: input.executionReport.mediaAccessPerformed === false,
    noProviderCalls: input.executionReport.providerCallsPerformed === false,
    auditConclusion: input.executionReport.status === 'passed'
      ? 'noop_route_dry_run_passed_restricted_scope'
      : 'noop_route_dry_run_blocked_fail_closed',
  }
}
