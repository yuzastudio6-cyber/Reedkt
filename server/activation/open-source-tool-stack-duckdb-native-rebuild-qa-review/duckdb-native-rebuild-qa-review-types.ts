export type DuckdbNativeRebuildQaDecision =
  | 'duckdb_native_rebuild_qa_passed_ready_for_ffmpeg_ffprobe_system_binary_review'
  | 'duckdb_native_rebuild_qa_passed_ready_for_open_source_tool_stack_batch_2_planning'
  | 'blocked_pending_duckdb_rebuild_evidence_review'
  | 'blocked_pending_duckdb_import_query_evidence'
  | 'blocked_pending_package_lock_integrity_review'
  | 'blocked_pending_native_artifact_policy_review'
  | 'rejected_due_runtime_safety_risk'

export type DuckdbNativeRebuildQaReportSet = {
  sourceOfTruthAudit: Record<string, unknown>
  evidenceRevalidationReport: Record<string, unknown>
  duckdbProofQa: Record<string, unknown>
  polarsStatusQa: Record<string, unknown>
  ffmpegFfprobeMissingBinaryQa: Record<string, unknown>
  internalBetaImpactReview: Record<string, unknown>
  packageLockNativeArtifactQa: Record<string, unknown>
  decision: Record<string, unknown>
  readinessReport: Record<string, unknown>
  blockerReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
