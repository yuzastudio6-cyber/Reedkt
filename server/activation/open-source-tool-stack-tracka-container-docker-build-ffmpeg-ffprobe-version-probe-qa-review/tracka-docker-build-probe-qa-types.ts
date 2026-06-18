export type TrackaDockerBuildProbeQaDecision =
  | 'tracka_container_docker_build_ffmpeg_ffprobe_version_probe_qa_passed_ready_for_open_source_tool_stack_batch1_rollup'
  | 'tracka_container_docker_build_ffmpeg_ffprobe_version_probe_qa_passed_media_processing_still_blocked_ready_for_batch1_rollup'
  | 'blocked_pending_docker_build_evidence_review'
  | 'blocked_pending_ffmpeg_version_evidence_review'
  | 'blocked_pending_ffprobe_version_evidence_review'
  | 'blocked_pending_generated_artifact_cleanup_review'
  | 'blocked_pending_artifact_safety_review'
  | 'blocked_pending_package_dockerfile_integrity_review'
  | 'rejected_due_runtime_safety_risk'

export type QaStatus = 'accepted' | 'blocked' | 'rejected'

export type QaReview = {
  schema: string
  generatedAt: string
  status: QaStatus
  accepted: boolean
  warnings: string[]
  blockers: string[]
  followUp: string
}

export type TrackaDockerBuildProbeQaReports = {
  sourceOfTruthAudit: Record<string, unknown>
  evidenceRevalidationReport: Record<string, unknown>
  dockerBuildQa: Record<string, unknown>
  ffmpegVersionQa: Record<string, unknown>
  ffprobeVersionQa: Record<string, unknown>
  generatedArtifactCleanupQa: Record<string, unknown>
  mediaRenderBlockedScopeQa: Record<string, unknown>
  centralOpenSourceStatusUpdate: Record<string, unknown>
  decision: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
