export type PackageInstallScriptReviewDecision =
  | 'package_install_script_review_passed_ready_for_duckdb_native_rebuild_execution'
  | 'package_install_script_review_passed_ready_for_alternate_duckdb_package_review'
  | 'package_install_script_review_passed_duckdb_deferred_ffmpeg_binary_review_next'
  | 'blocked_pending_duckdb_lifecycle_script_audit'
  | 'blocked_pending_native_binding_safety_policy'
  | 'blocked_pending_package_manager_command_review'
  | 'blocked_pending_dependency_artifact_policy'
  | 'blocked_pending_security_provenance_review'
  | 'rejected_due_runtime_safety_risk'

export type PackageInstallScriptReviewReportSet = {
  sourceOfTruthAudit: Record<string, unknown>
  evidenceRevalidationReport: Record<string, unknown>
  duckdbNativeBindingBlockerAnalysis: Record<string, unknown>
  lifecycleScriptSafetyPolicy: Record<string, unknown>
  futureDuckdbProofPlan: Record<string, unknown>
  packageArtifactPolicy: Record<string, unknown>
  ffmpegFfprobeFollowUpClassification: Record<string, unknown>
  decision: Record<string, unknown>
  readinessReport: Record<string, unknown>
  blockerReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
