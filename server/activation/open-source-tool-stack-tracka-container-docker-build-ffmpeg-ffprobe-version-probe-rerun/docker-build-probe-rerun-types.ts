export type TrackaDockerBuildProbeRerunDecision =
  | 'tracka_container_docker_build_ffmpeg_ffprobe_version_probe_rerun_passed_ready_for_qa'
  | 'tracka_container_docker_build_ffmpeg_ffprobe_version_probe_rerun_passed_media_processing_still_blocked'
  | 'blocked_pending_build_context_generation'
  | 'blocked_pending_generated_artifact_scan'
  | 'blocked_pending_generated_artifact_cleanup'
  | 'blocked_pending_docker_runtime_availability'
  | 'blocked_pending_docker_build'
  | 'blocked_pending_ffmpeg_version_probe'
  | 'blocked_pending_ffprobe_version_probe'
  | 'blocked_pending_artifact_safety_review'
  | 'rejected_due_runtime_safety_risk'

export type BuildContextTargetId =
  | 'server_runtime_bundle'
  | 'remotion_worker_bundle'
  | 'staging_fixture_worker_bundle'
  | 'staging_real_video_export_worker_bundle'

export type BuildContextTarget = {
  id: BuildContextTargetId
  directory: string
  command: string
  args: string[]
  expectedEntry: string
}

export type CommandRunStatus = 'passed' | 'failed' | 'blocked' | 'not_run'

export type CommandRunReport = {
  schema: string
  generatedAt: string
  id: string
  command: string
  run: boolean
  exactApprovedCommand: boolean
  exitCode: number | null
  status: CommandRunStatus
  stdoutPreview: string
  stderrPreview: string
  errorMessage: string | null
  timedOut: boolean
}

export type BuildContextGenerationReport = CommandRunReport & {
  targetId: BuildContextTargetId
  expectedDirectory: string
  expectedEntry: string
  directoryExists: boolean
  expectedEntryExists: boolean
  fileCount: number
  totalSizeBytes: number
  sha256: string | null
}

export type TrackaDockerBuildProbeRerunReportSet = {
  sourceOfTruthAudit: Record<string, unknown>
  preExecutionValidationReport: Record<string, unknown>
  buildContextRegenerationReport: Record<string, unknown>
  generatedArtifactScanReport: Record<string, unknown>
  dockerReadinessReport: Record<string, unknown>
  dockerBuildReport: Record<string, unknown>
  ffmpegContainerVersionProbeReport: Record<string, unknown>
  ffprobeContainerVersionProbeReport: Record<string, unknown>
  generatedOutputCleanupReport: Record<string, unknown>
  dockerImageCleanupReport: Record<string, unknown>
  sideEffectArtifactSafetyReport: Record<string, unknown>
  decision: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
