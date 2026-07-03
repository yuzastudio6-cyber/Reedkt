export type MissingOptionalInstallReviewDecision =
  | 'missing_optional_install_review_passed_ready_for_package_and_binary_approval'
  | 'missing_optional_install_review_passed_ready_for_package_only_approval'
  | 'missing_optional_install_review_passed_ready_for_system_binary_review'
  | 'blocked_pending_duckdb_package_selection'
  | 'blocked_pending_polars_package_selection'
  | 'blocked_pending_ffmpeg_binary_strategy'
  | 'blocked_pending_ffprobe_binary_strategy'
  | 'blocked_pending_package_lock_policy'
  | 'blocked_pending_container_or_worker_handoff'
  | 'rejected_due_runtime_safety_risk'

export type MissingOptionalInstallReviewReportSet = {
  sourceOfTruthAudit: Record<string, unknown>
  evidenceRevalidationReport: Record<string, unknown>
  duckdbInstallStrategy: Record<string, unknown>
  polarsInstallStrategy: Record<string, unknown>
  ffmpegFfprobeInstallStrategy: Record<string, unknown>
  packageLockDependencyPolicy: Record<string, unknown>
  systemBinaryContainerPolicy: Record<string, unknown>
  syntheticProofPlan: Record<string, unknown>
  decision: Record<string, unknown>
  readinessReport: Record<string, unknown>
  blockerReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
