export type TrackaBuildContextGenerationApprovalDecision =
  | 'build_context_generation_approval_passed_ready_for_generation_execution'
  | 'build_context_generation_approval_passed_ready_for_generation_then_docker_probe_execution'
  | 'blocked_pending_exact_build_context_generation_command'
  | 'blocked_pending_generated_artifact_cleanup_policy'
  | 'blocked_pending_tracka_owner_build_context_review'
  | 'blocked_pending_worker_build_context_review'
  | 'blocked_pending_media_render_export_safety_review'
  | 'rejected_due_runtime_safety_risk'

export type TrackaBuildContextGenerationApprovalReportSet = {
  sourceOfTruthAudit: Record<string, unknown>
  buildCommandApprovalMatrix: Record<string, unknown>
  generatedArtifactPolicy: Record<string, unknown>
  futureExecutionScope: Record<string, unknown>
  decision: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
