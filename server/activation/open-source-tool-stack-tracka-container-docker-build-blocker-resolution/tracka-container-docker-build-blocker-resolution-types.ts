export type TrackaContainerDockerBuildBlockerResolutionDecision =
  | 'docker_build_blocker_resolution_passed_ready_for_build_context_generation_approval'
  | 'docker_build_blocker_resolution_passed_ready_for_build_context_generation_and_probe_execution'
  | 'docker_build_blocker_resolution_passed_ready_for_probe_slim_dockerfile_review'
  | 'docker_build_blocker_resolution_passed_ready_for_tracka_worker_image_handoff'
  | 'blocked_pending_exact_build_context_generation_command'
  | 'blocked_pending_tracka_or_worker_build_context_handoff'
  | 'blocked_pending_dockerfile_copy_policy_review'
  | 'blocked_pending_generated_artifact_policy'
  | 'blocked_pending_build_context_safety_review'
  | 'rejected_due_runtime_safety_risk'

export type TrackaContainerDockerBuildBlockerResolutionReportSet = {
  sourceOfTruthAudit: Record<string, unknown>
  dockerfileBuildContextReview: Record<string, unknown>
  buildScriptInventory: Record<string, unknown>
  buildContextGenerationPolicy: Record<string, unknown>
  dockerBuildStrategyReview: Record<string, unknown>
  futureExecutionScope: Record<string, unknown>
  decision: Record<string, unknown>
  readinessReport: Record<string, unknown>
  blockerReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
