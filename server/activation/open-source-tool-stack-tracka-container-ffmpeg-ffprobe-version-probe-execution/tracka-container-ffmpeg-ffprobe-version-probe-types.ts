export type TrackaContainerFfmpegFfprobeVersionProbeDecision =
  | 'tracka_container_ffmpeg_ffprobe_version_probe_passed_ready_for_qa'
  | 'tracka_container_ffmpeg_ffprobe_version_probe_passed_media_processing_still_blocked'
  | 'blocked_pending_exact_probe_command_source'
  | 'blocked_pending_docker_runtime_availability'
  | 'blocked_pending_ffmpeg_version_probe'
  | 'blocked_pending_ffprobe_version_probe'
  | 'blocked_pending_artifact_safety_review'
  | 'rejected_due_runtime_safety_risk'

export type TrackaContainerFfmpegFfprobeVersionProbeReportSet = {
  sourceOfTruthAudit: Record<string, unknown>
  exactCommandSourceReview: Record<string, unknown>
  preExecutionValidationReport: Record<string, unknown>
  dockerContainerReadinessReport: Record<string, unknown>
  ffmpegVersionProbeReport: Record<string, unknown>
  ffprobeVersionProbeReport: Record<string, unknown>
  sideEffectArtifactSafetyReport: Record<string, unknown>
  decision: Record<string, unknown>
  readinessReport: Record<string, unknown>
  blockerReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
