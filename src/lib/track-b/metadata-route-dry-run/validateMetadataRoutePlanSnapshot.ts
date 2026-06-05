import {
  TRACK_B_METADATA_ROUTE_DRY_RUN_CANDIDATE_ID,
  TRACK_B_METADATA_ROUTE_DRY_RUN_CAPABILITY_ID,
  TRACK_B_METADATA_ROUTE_DRY_RUN_MANIFEST_VERSION,
  TRACK_B_METADATA_ROUTE_DRY_RUN_ROUTE_ID,
  TRACK_B_METADATA_ROUTE_DRY_RUN_TOOL_ID,
  type MetadataRoutePlanSnapshot,
  type MetadataRouteValidationResult,
} from './metadataRouteDryRunTypes'

export function validateMetadataRoutePlanSnapshot(planSnapshot: MetadataRoutePlanSnapshot): MetadataRouteValidationResult {
  const blockedReasons: string[] = []
  if (planSnapshot.candidateId !== TRACK_B_METADATA_ROUTE_DRY_RUN_CANDIDATE_ID) blockedReasons.push('selected_candidate_not_approved_metadata_route')
  if (!planSnapshot.planSnapshotId) blockedReasons.push('missing_plan_snapshot_id')
  if (planSnapshot.routeManifestVersion !== TRACK_B_METADATA_ROUTE_DRY_RUN_MANIFEST_VERSION) blockedReasons.push('route_manifest_version_mismatch')
  if (planSnapshot.routeId !== TRACK_B_METADATA_ROUTE_DRY_RUN_ROUTE_ID) blockedReasons.push('duckdb_route_missing_or_mismatch')
  if (planSnapshot.toolId !== TRACK_B_METADATA_ROUTE_DRY_RUN_TOOL_ID) {
    if (planSnapshot.toolId === 'demucs') blockedReasons.push('demucs_route_blocked')
    else if (planSnapshot.toolId === 'qwen3_vl' || planSnapshot.toolId === 'vllm') blockedReasons.push('vlm_route_blocked')
    else blockedReasons.push('unexpected_tool_id')
  }
  if (planSnapshot.capabilityId !== TRACK_B_METADATA_ROUTE_DRY_RUN_CAPABILITY_ID && planSnapshot.capabilityId !== 'metadata_reporting') {
    blockedReasons.push('unexpected_capability_id')
  }
  if (planSnapshot.sourcePhase !== 'phase_44n') blockedReasons.push('unexpected_source_phase')
  if (planSnapshot.confirmationPhase !== 'phase_44o_required') blockedReasons.push('phase44o_confirmation_required')
  if (planSnapshot.dryRunMode !== 'metadata_only') blockedReasons.push('metadata_only_dry_run_required')
  if (planSnapshot.executeTool) blockedReasons.push('execute_tool_true_blocked')
  if (planSnapshot.rawChatExecution) blockedReasons.push('raw_chat_execution_blocked')
  if (planSnapshot.publicOutputAllowed) blockedReasons.push('public_output_blocked')
  if (planSnapshot.broadMediaAllowed) blockedReasons.push('broad_media_blocked')
  if (planSnapshot.arbitraryMediaAllowed) blockedReasons.push('arbitrary_media_blocked')
  if (planSnapshot.providerCallsAllowed) blockedReasons.push('provider_calls_blocked')
  if (planSnapshot.secretPayloadAccessAllowed) blockedReasons.push('unexpected_secret_payload_access_required')
  if (planSnapshot.routeExecutionAllowed) blockedReasons.push('route_execution_allowed_true_blocked')
  if (planSnapshot.runtimeExecutionAllowed) blockedReasons.push('runtime_execution_allowed_true_blocked')
  if (planSnapshot.workerExecutionAllowed) blockedReasons.push('worker_execution_blocked')
  if (planSnapshot.sidecarExecutionAllowed) blockedReasons.push('sidecar_execution_blocked')
  if (planSnapshot.toolExecutionAllowed) blockedReasons.push('tool_execution_blocked')
  if (planSnapshot.duckDbRuntimeExecutionAllowed) blockedReasons.push('duckdb_runtime_blocked')
  if (planSnapshot.polarsRuntimeExecutionAllowed) blockedReasons.push('polars_runtime_blocked')

  const uniqueBlockedReasons = [...new Set(blockedReasons)]
  return {
    status: uniqueBlockedReasons.length === 0 ? 'passed' : 'blocked',
    passed: uniqueBlockedReasons.length === 0,
    blockedReasons: uniqueBlockedReasons,
    warnings: planSnapshot.noExecutionPerformed ? [] : ['phase44n_plan_snapshot_recorded_no_execution'],
  }
}
