export type TrackaBuildContextGenerationExecutionDecision =
  | 'build_context_generation_execution_passed_ready_for_docker_build_probe_execution'
  | 'build_context_generation_execution_passed_ready_for_qa'
  | 'blocked_pending_build_server_generation'
  | 'blocked_pending_remotion_worker_generation'
  | 'blocked_pending_staging_fixture_worker_generation'
  | 'blocked_pending_staging_real_video_export_worker_generation'
  | 'blocked_pending_generated_artifact_scan'
  | 'blocked_pending_generated_artifact_cleanup'
  | 'blocked_pending_package_or_dockerfile_integrity'
  | 'rejected_due_runtime_safety_risk'

export type BuildContextTargetId =
  | 'server_runtime_bundle'
  | 'remotion_worker_bundle'
  | 'staging_fixture_worker_bundle'
  | 'staging_real_video_export_worker_bundle'

export type BuildContextTarget = {
  id: BuildContextTargetId
  directory: string
  packageScript: string
  command: string
  expectedEntry: string
  blockerDecision: TrackaBuildContextGenerationExecutionDecision
}

export type CommandRunReport = {
  schema: string
  generatedAt: string
  targetId: BuildContextTargetId
  command: string
  expectedDirectory: string
  expectedEntry: string
  run: boolean
  exactApprovedCommand: boolean
  exitCode: number | null
  status: 'passed' | 'failed' | 'not_run'
  directoryExists: boolean
  expectedEntryExists: boolean
  fileCount: number
  totalSizeBytes: number
  sha256: string | null
  stdoutPreview: string
  stderrPreview: string
  errorMessage: string | null
}

export type TrackaBuildContextGenerationExecutionReportSet = {
  sourceOfTruthAudit: Record<string, unknown>
  preExecutionValidationReport: Record<string, unknown>
  generationReports: CommandRunReport[]
  generatedArtifactScanReport: Record<string, unknown>
  buildContextGenerationManifest: Record<string, unknown>
  generatedArtifactCleanupReport: Record<string, unknown>
  packageDockerfileIntegrityReport: Record<string, unknown>
  sideEffectSafetyReport: Record<string, unknown>
  decision: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
