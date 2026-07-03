export type DuckdbNativeRebuildDecision =
  | 'duckdb_native_rebuild_execution_passed_ready_for_qa'
  | 'duckdb_native_rebuild_execution_passed_ffmpeg_ffprobe_still_missing'
  | 'blocked_pending_duckdb_native_rebuild'
  | 'blocked_pending_duckdb_import_or_query'
  | 'blocked_pending_package_lock_integrity'
  | 'blocked_pending_native_artifact_policy'
  | 'rejected_due_runtime_safety_risk'

export type DuckdbNativeRebuildReportSet = {
  sourceOfTruthAudit: Record<string, unknown>
  preRebuildBaselineReport: Record<string, unknown>
  nativeRebuildReport: Record<string, unknown>
  duckdbImportProofReport: Record<string, unknown>
  duckdbSyntheticQueryReport: Record<string, unknown>
  packageLockNativeArtifactIntegrityReport: Record<string, unknown>
  ffmpegFfprobeFollowUpReport: Record<string, unknown>
  sideEffectSafetyReport: Record<string, unknown>
  decision: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
