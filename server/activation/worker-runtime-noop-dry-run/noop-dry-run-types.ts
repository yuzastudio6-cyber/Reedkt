export type WorkerRuntimeNoopDryRunDecision =
  | 'worker_noop_dry_run_passed_ready_for_tool_route_dry_run_approval'
  | 'blocked_pending_fixture_validation'
  | 'blocked_pending_intake_validation'
  | 'blocked_pending_artifact_scope_validation'
  | 'blocked_pending_route_metadata_resolution'
  | 'blocked_pending_observability_cost_validation'
  | 'blocked_pending_fail_closed_validation'
  | 'rejected_due_execution_safety_risk'

export type WorkerRuntimeNoopDryRunReports = {
  sourceAudit: Record<string, unknown>
  plan: Record<string, unknown>
  evidenceInventory: Record<string, unknown>
  fixtureValidationReport: Record<string, unknown>
  workerIntakeValidationReport: Record<string, unknown>
  workerLifecycleSimulationReport: Record<string, unknown>
  artifactScopeValidationReport: Record<string, unknown>
  routeMetadataResolutionReport: Record<string, unknown>
  observabilityCostFailureReport: Record<string, unknown>
  failClosedReport: Record<string, unknown>
  decision: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
