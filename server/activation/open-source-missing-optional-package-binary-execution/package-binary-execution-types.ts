export type MissingOptionalPackageBinaryExecutionDecision =
  | 'missing_optional_package_and_binary_execution_passed_ready_for_qa'
  | 'missing_optional_package_execution_passed_binary_missing_ready_for_system_binary_review'
  | 'missing_optional_package_install_passed_import_proof_blocked_by_ignored_scripts'
  | 'blocked_pending_duckdb_install_or_import'
  | 'blocked_pending_polars_install_or_import'
  | 'blocked_pending_package_lock_integrity'
  | 'blocked_pending_ffmpeg_binary_presence'
  | 'blocked_pending_ffprobe_binary_presence'
  | 'rejected_due_runtime_safety_risk'

export type PackageBinaryProofStatus =
  | 'passed'
  | 'not_run'
  | 'missing_system_binary'
  | 'blocked_install_failed'
  | 'blocked_import_or_proof_failed'
  | 'blocked_by_ignored_scripts'

export type PackageBinaryProofReport = {
  schema: string
  generatedAt: string
  targetId: string
  targetName: string
  status: PackageBinaryProofStatus
  passed: boolean
  commandClass: string
  command?: string
  version?: string | null
  stdoutPreview?: string
  stderrPreview?: string
  blocker?: string | null
  installAttempted: boolean
  systemBinaryInstallAttempted: false
  mediaProcessingAttempted: false
  details: Record<string, unknown>
}

export type PackageBinaryExecutionReportSet = {
  sourceOfTruthAudit: Record<string, unknown>
  preInstallBaselineReport: Record<string, unknown>
  packageInstallReport: Record<string, unknown>
  postInstallNpmCiReport: Record<string, unknown>
  duckdbProofReport: PackageBinaryProofReport
  polarsProofReport: PackageBinaryProofReport
  ffmpegVersionCheckReport: PackageBinaryProofReport
  ffprobeVersionCheckReport: PackageBinaryProofReport
  packageLockIntegrityReport: Record<string, unknown>
  sideEffectSafetyReport: Record<string, unknown>
  decision: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
