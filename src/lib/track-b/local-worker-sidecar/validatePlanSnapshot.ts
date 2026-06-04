import {
  LOCAL_WORKER_SIDECAR_PROTOCOL_VERSION,
  LOCAL_WORKER_SIDECAR_ROUTE_MANIFEST_VERSION,
  type LocalWorkerSidecarPlanSnapshotValidationRequest,
  type LocalWorkerSidecarPlanSnapshotValidationResponse,
} from './localWorkerSidecarTypes'

const REQUIRED_FIELDS: Array<keyof LocalWorkerSidecarPlanSnapshotValidationRequest> = [
  'planSnapshotId',
  'routeId',
  'toolId',
  'capabilityId',
  'inputArtifactScopeId',
  'outputArtifactScopeId',
  'requestedAction',
  'confirmationPhase',
  'sourcePhase',
  'routeManifestVersion',
  'auditReportPath',
]

export function validateLocalWorkerPlanSnapshot(
  request: LocalWorkerSidecarPlanSnapshotValidationRequest,
): LocalWorkerSidecarPlanSnapshotValidationResponse {
  const blockedReasons: string[] = []
  const warnings: string[] = []

  for (const field of REQUIRED_FIELDS) {
    if (request[field] === undefined || request[field] === '') blockedReasons.push(`missing_${String(field)}`)
  }
  if (request.routeManifestVersion !== LOCAL_WORKER_SIDECAR_ROUTE_MANIFEST_VERSION) blockedReasons.push('route_manifest_version_mismatch')
  if (request.rawChatText) blockedReasons.push('raw_chat_execution_blocked')
  if (request.arbitraryCommand) blockedReasons.push('arbitrary_command_blocked')
  if (request.arbitraryLocalPath) blockedReasons.push('arbitrary_path_blocked')
  if (request.arbitraryGcsPrefix) blockedReasons.push('arbitrary_gcs_prefix_blocked')
  if (request.publicUrl) blockedReasons.push('public_url_blocked')
  if (request.signedUrlAsSourceOfTruth) blockedReasons.push('signed_url_source_of_truth_blocked')
  if (request.publicOutputAllowed) blockedReasons.push('public_output_blocked')
  if (request.broadMediaAllowed) blockedReasons.push('broad_media_blocked')
  if (request.arbitraryMediaAllowed) blockedReasons.push('arbitrary_media_blocked')
  if (request.providerCallsAllowed) blockedReasons.push('provider_calls_blocked')
  if (request.toolId === 'demucs') blockedReasons.push('demucs_route_blocked')
  if (request.toolId === 'qwen3_vl' || request.toolId === 'vllm') blockedReasons.push('vlm_route_blocked')
  if (request.requestedAction === 'execute') blockedReasons.push('phase44g_execution_blocked')
  if (request.requestedAction === 'execute' && request.routeExecutionAllowed === false) blockedReasons.push('route_execution_not_allowed')
  if (request.requestedAction === 'execute' && request.runtimeExecutionAllowed === false) blockedReasons.push('runtime_execution_not_allowed')

  if ((request.maxRuntimeBounds?.maxDurationSeconds ?? 0) > 0) warnings.push('runtime_bounds_recorded_for_future_phase_only')

  return {
    type: 'plan_snapshot_validate_response',
    accepted: blockedReasons.length === 0,
    blockedReasons,
    warnings,
    normalizedPolicy: {
      noRawChatExecution: true,
      executionBlockedInPhase44G: true,
      failClosed: true,
    },
  }
}

export function validateLocalWorkerProtocolVersion(protocolVersion: string | undefined): string[] {
  return protocolVersion === LOCAL_WORKER_SIDECAR_PROTOCOL_VERSION ? [] : ['protocol_version_mismatch']
}
