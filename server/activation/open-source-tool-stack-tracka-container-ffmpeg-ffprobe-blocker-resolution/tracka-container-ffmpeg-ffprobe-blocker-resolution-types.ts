export type TrackaContainerFfmpegFfprobeBlockerResolutionDecision =
  | 'exact_probe_command_blocker_resolution_passed_ready_for_tracka_container_version_probe_execution'
  | 'exact_probe_command_blocker_resolution_passed_ready_for_docker_build_then_version_probe_execution'
  | 'blocked_pending_exact_tracka_container_probe_command'
  | 'blocked_pending_docker_build_policy'
  | 'blocked_pending_docker_runtime_policy'
  | 'blocked_pending_worker_container_probe_handoff'
  | 'blocked_pending_tracka_owner_command_review'
  | 'rejected_due_runtime_safety_risk'

export type TrackaContainerFfmpegFfprobeBlockerResolutionReportSet = {
  sourceOfTruthAudit: Record<string, unknown>
  commandSourceInventory: Record<string, unknown>
  dockerContainerInvocationPolicy: Record<string, unknown>
  exactFutureProbeCommands: Record<string, unknown>
  safetyAndArtifactPolicy: Record<string, unknown>
  ownerHandoffReview: Record<string, unknown>
  decision: Record<string, unknown>
  readinessReport: Record<string, unknown>
  blockerReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
