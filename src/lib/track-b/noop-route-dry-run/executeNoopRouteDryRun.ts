import type {
  NoopRouteExecutionReport,
  NoopRouteSecretGuardReport,
  NoopRouteValidationResult,
} from './noopRouteDryRunTypes'

export function executeNoopRouteDryRun(input: {
  candidateId: string
  planSnapshotValidation: NoopRouteValidationResult
  artifactScopeValidation: NoopRouteValidationResult
  secretPayloadGuard: NoopRouteSecretGuardReport
  runId: string
}): NoopRouteExecutionReport {
  const blockedReasons = [
    ...input.planSnapshotValidation.blockedReasons,
    ...input.artifactScopeValidation.blockedReasons,
    ...input.secretPayloadGuard.blockedReasons,
  ]
  const uniqueBlockedReasons = [...new Set(blockedReasons)]
  const passed = uniqueBlockedReasons.length === 0

  return {
    status: passed ? 'passed' : 'blocked',
    passed,
    blockedReasons: uniqueBlockedReasons,
    warnings: passed ? ['noop_handshake_id_is_ephemeral_and_not_a_persistent_identity'] : [],
    noopRouteDryRunStatus: passed ? 'passed' : 'blocked',
    candidateId: input.candidateId,
    ephemeralHandshakeId: passed ? `${input.runId}-ephemeral-noop-handshake` : null,
    persistentIdCreated: false,
    executionPerformed: false,
    routeExecutionPerformed: false,
    workerExecutionPerformed: false,
    toolExecutionPerformed: false,
    sidecarProcessStarted: false,
    providerCallsPerformed: false,
    mediaAccessPerformed: false,
    secretPayloadAccessPerformed: false,
  }
}
