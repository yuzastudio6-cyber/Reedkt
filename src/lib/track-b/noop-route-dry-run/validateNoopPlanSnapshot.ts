import {
  TRACK_B_NOOP_ROUTE_DRY_RUN_CANDIDATE_ID,
  TRACK_B_NOOP_ROUTE_DRY_RUN_COMPAT_TOOL_ID,
  TRACK_B_NOOP_ROUTE_DRY_RUN_SYNTHETIC_TOOL_ID,
  type NoopRoutePlanSnapshot,
  type NoopRouteValidationResult,
} from './noopRouteDryRunTypes'

const REAL_TOOL_IDS = new Set([
  'deepfilternet',
  'signalsmith_stretch',
  'demucs',
  'paddleocr',
  'paddlepaddle',
  'qwen3_vl',
  'vllm',
  'opencv',
  'pyav',
  'pyscenedetect',
  'sharp_libvips',
  'duckdb',
  'polars',
])

export function validateNoopPlanSnapshot(planSnapshot: NoopRoutePlanSnapshot): NoopRouteValidationResult {
  const blockedReasons: string[] = []
  if (planSnapshot.candidateId !== TRACK_B_NOOP_ROUTE_DRY_RUN_CANDIDATE_ID) blockedReasons.push('selected_candidate_not_approved_noop')
  if (!planSnapshot.planSnapshotId) blockedReasons.push('missing_plan_snapshot_id')
  if (!planSnapshot.routeId) blockedReasons.push('missing_route_id')
  if (planSnapshot.toolId !== TRACK_B_NOOP_ROUTE_DRY_RUN_SYNTHETIC_TOOL_ID) blockedReasons.push('real_tool_id_requested')
  if (planSnapshot.toolId && REAL_TOOL_IDS.has(planSnapshot.toolId)) blockedReasons.push('real_tool_id_requested')
  if (planSnapshot.toolId === 'demucs') blockedReasons.push('demucs_route_blocked')
  if (planSnapshot.toolId === 'qwen3_vl' || planSnapshot.toolId === 'vllm') blockedReasons.push('vlm_route_blocked')
  if (planSnapshot.capabilityId !== 'no_op_handshake') blockedReasons.push('unexpected_capability_id')
  if (planSnapshot.sourcePhase !== 'phase_44l') blockedReasons.push('unexpected_source_phase')
  if (planSnapshot.confirmationPhase !== 'phase_44m_required') blockedReasons.push('phase44m_confirmation_required')
  if (planSnapshot.rawChatExecution) blockedReasons.push('raw_chat_execution_blocked')
  if (planSnapshot.publicOutputAllowed) blockedReasons.push('public_output_blocked')
  if (planSnapshot.broadMediaAllowed) blockedReasons.push('broad_media_blocked')
  if (planSnapshot.arbitraryMediaAllowed) blockedReasons.push('arbitrary_media_blocked')
  if (planSnapshot.providerCallsAllowed) blockedReasons.push('provider_calls_blocked')
  if (planSnapshot.routeExecutionAllowed) blockedReasons.push('route_execution_allowed_true_blocked')
  if (planSnapshot.runtimeExecutionAllowed) blockedReasons.push('runtime_execution_allowed_true_blocked')
  if (planSnapshot.workerExecutionAllowed) blockedReasons.push('worker_execution_blocked')
  if (planSnapshot.sidecarExecutionAllowed) blockedReasons.push('sidecar_execution_blocked')
  if (planSnapshot.toolExecutionAllowed) blockedReasons.push('tool_execution_blocked')
  if (planSnapshot.validatorCompatibility?.mappedToolId !== TRACK_B_NOOP_ROUTE_DRY_RUN_COMPAT_TOOL_ID) blockedReasons.push('missing_sidecar_validator_compatibility')
  if (planSnapshot.validatorCompatibility?.result?.accepted !== true) blockedReasons.push('sidecar_plan_snapshot_validator_rejected')

  const uniqueBlockedReasons = [...new Set(blockedReasons)]
  return {
    status: uniqueBlockedReasons.length === 0 ? 'passed' : 'blocked',
    passed: uniqueBlockedReasons.length === 0,
    blockedReasons: uniqueBlockedReasons,
    warnings: planSnapshot.noExecutionPerformed ? [] : ['phase44l_plan_recorded_future_execution_only'],
  }
}
