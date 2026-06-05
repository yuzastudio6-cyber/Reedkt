import type {
  NoopRouteExecutionReport,
  NoopRouteFailureFixtureResult,
  NoopRouteValidationResult,
} from './noopRouteDryRunTypes'

export function validateNoopRouteResult(input: {
  executionReport: NoopRouteExecutionReport
  failureFixtureResults: NoopRouteFailureFixtureResult[]
}): NoopRouteValidationResult {
  const blockedReasons: string[] = []
  if (input.executionReport.noopRouteDryRunStatus !== 'passed') blockedReasons.push('noop_route_dry_run_execution_failed')
  if (input.executionReport.executionPerformed) blockedReasons.push('unexpected_real_execution_performed')
  if (input.executionReport.workerExecutionPerformed) blockedReasons.push('unexpected_worker_execution_performed')
  if (input.executionReport.toolExecutionPerformed) blockedReasons.push('unexpected_tool_execution_performed')
  if (input.executionReport.sidecarProcessStarted) blockedReasons.push('unexpected_sidecar_process_started')
  if (input.executionReport.secretPayloadAccessPerformed) blockedReasons.push('unexpected_secret_payload_access_required')
  for (const result of input.failureFixtureResults) {
    if (!result.blocked || !result.expectedBlockedReasonObserved) blockedReasons.push(`failure_fixture_not_blocked:${result.fixtureId}`)
  }
  const uniqueBlockedReasons = [...new Set(blockedReasons)]
  return {
    status: uniqueBlockedReasons.length === 0 ? 'passed' : 'blocked',
    passed: uniqueBlockedReasons.length === 0,
    blockedReasons: uniqueBlockedReasons,
    warnings: [],
  }
}
