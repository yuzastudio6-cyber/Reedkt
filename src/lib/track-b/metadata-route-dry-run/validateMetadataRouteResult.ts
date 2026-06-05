import type {
  MetadataRouteExecutionReport,
  MetadataRouteFailureFixtureResult,
  MetadataRouteValidationResult,
} from './metadataRouteDryRunTypes'

export function validateMetadataRouteResult(input: {
  executionReport: MetadataRouteExecutionReport
  failureFixtureResults: MetadataRouteFailureFixtureResult[]
}): MetadataRouteValidationResult {
  const blockedReasons: string[] = []
  if (input.executionReport.metadataRouteDryRunStatus !== 'passed') blockedReasons.push('metadata_route_dry_run_execution_failed')
  if (input.executionReport.executionPerformed) blockedReasons.push('unexpected_real_execution_performed')
  if (input.executionReport.routeExecutionPerformed) blockedReasons.push('unexpected_route_execution_performed')
  if (input.executionReport.runtimeExecutionPerformed) blockedReasons.push('unexpected_runtime_execution_performed')
  if (input.executionReport.workerExecutionPerformed) blockedReasons.push('unexpected_worker_execution_performed')
  if (input.executionReport.toolExecutionPerformed) blockedReasons.push('unexpected_tool_execution_performed')
  if (input.executionReport.sidecarExecutionPerformed) blockedReasons.push('unexpected_sidecar_execution_performed')
  if (input.executionReport.duckDbRuntimePerformed) blockedReasons.push('unexpected_duckdb_runtime_performed')
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
