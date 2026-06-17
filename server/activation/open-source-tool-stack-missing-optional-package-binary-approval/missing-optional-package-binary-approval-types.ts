export type MissingOptionalPackageBinaryApprovalDecision =
  | 'missing_optional_package_and_binary_approval_passed_ready_for_execution'
  | 'missing_optional_package_only_approval_passed_ready_for_execution'
  | 'missing_optional_system_binary_approval_passed_ready_for_execution'
  | 'blocked_pending_duckdb_package_approval'
  | 'blocked_pending_polars_package_approval'
  | 'blocked_pending_ffmpeg_binary_approval'
  | 'blocked_pending_ffprobe_binary_approval'
  | 'blocked_pending_package_lock_policy'
  | 'blocked_pending_container_worker_policy'
  | 'rejected_due_runtime_safety_risk'

export type MissingOptionalPackageBinaryApprovalReportSet = {
  sourceOfTruthAudit: Record<string, unknown>
  evidenceRevalidationReport: Record<string, unknown>
  duckdbPackageApproval: Record<string, unknown>
  polarsPackageApproval: Record<string, unknown>
  ffmpegFfprobeBinaryApproval: Record<string, unknown>
  packageLockPolicy: Record<string, unknown>
  systemBinaryWorkerContainerPolicy: Record<string, unknown>
  futureExecutionScope: Record<string, unknown>
  decision: Record<string, unknown>
  readinessReport: Record<string, unknown>
  blockerReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
