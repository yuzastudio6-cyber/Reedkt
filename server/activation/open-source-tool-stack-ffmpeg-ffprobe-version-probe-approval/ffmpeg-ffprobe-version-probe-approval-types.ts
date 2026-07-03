export type FfmpegFfprobeVersionProbeApprovalDecision =
  | 'ffmpeg_ffprobe_version_probe_approval_passed_ready_for_tracka_container_probe_execution'
  | 'blocked_pending_tracka_source_of_truth_evidence'
  | 'blocked_pending_tracka_container_runtime_path'
  | 'blocked_pending_future_probe_command_boundary'
  | 'blocked_pending_package_docker_artifact_policy'
  | 'blocked_pending_blocked_scope_policy'
  | 'rejected_due_runtime_safety_risk'

export type FfmpegFfprobeVersionProbeApprovalReportSet = {
  sourceOfTruthAudit: Record<string, unknown>
  evidenceRevalidationReport: Record<string, unknown>
  runtimePathSelection: Record<string, unknown>
  futureProbeCommandApproval: Record<string, unknown>
  blockedScopePolicy: Record<string, unknown>
  packageDockerArtifactPolicy: Record<string, unknown>
  decision: Record<string, unknown>
  readinessReport: Record<string, unknown>
  blockerReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
