import type {
  MetadataRouteManifestEntry,
  MetadataRouteResolutionReport,
  MetadataRouteValidationResult,
} from './metadataRouteDryRunTypes'

export function resolveMetadataRouteDryRun(input: {
  routeEntry: MetadataRouteManifestEntry | undefined
  planSnapshotValidation: MetadataRouteValidationResult
  artifactScopeValidation: MetadataRouteValidationResult
}): MetadataRouteResolutionReport {
  const blockedReasons = [
    ...input.planSnapshotValidation.blockedReasons,
    ...input.artifactScopeValidation.blockedReasons,
  ]
  if (!input.routeEntry) blockedReasons.push('duckdb_route_missing')
  if (input.routeEntry?.routeId !== 'track_b_duckdb') blockedReasons.push('duckdb_route_missing_or_mismatch')
  if (input.routeEntry?.toolId !== 'duckdb') blockedReasons.push('duckdb_route_missing_or_mismatch')
  if (input.routeEntry?.routeStatus !== 'route_enabled_restricted_internal') blockedReasons.push('duckdb_route_not_restricted_internal')
  if (input.routeEntry?.capabilityIds?.includes('internal_qa_aggregation') !== true) blockedReasons.push('duckdb_internal_qa_aggregation_capability_missing')
  if (input.routeEntry?.capabilityIds?.includes('metadata_reporting') !== true) blockedReasons.push('duckdb_metadata_reporting_capability_missing')
  if (input.routeEntry?.routeExecutionAllowed !== false) blockedReasons.push('route_execution_allowed_true_blocked')
  if (input.routeEntry?.runtimeExecutionAllowed !== false) blockedReasons.push('runtime_execution_allowed_true_blocked')
  if (input.routeEntry?.publicOutputAllowed !== false) blockedReasons.push('public_output_blocked')
  if (input.routeEntry?.providerCallsAllowed !== false) blockedReasons.push('provider_calls_blocked')
  if (input.routeEntry?.broadMediaAllowed !== false) blockedReasons.push('broad_media_blocked')
  if (input.routeEntry?.arbitraryMediaAllowed !== false) blockedReasons.push('arbitrary_media_blocked')

  const uniqueBlockedReasons = [...new Set(blockedReasons)]
  const passed = uniqueBlockedReasons.length === 0
  return {
    status: passed ? 'passed' : 'blocked',
    passed,
    blockedReasons: uniqueBlockedReasons,
    warnings: passed ? ['route_metadata_resolved_without_runtime_execution'] : [],
    routeResolved: passed,
    routeEligibleForFutureDryRun: passed,
    routeExecutionAllowed: false,
    runtimeExecutionAllowed: false,
    executionPerformed: false,
    routeExecutionPerformed: false,
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
    sidecarExecutionPerformed: false,
    duckDbRuntimePerformed: false,
  }
}
