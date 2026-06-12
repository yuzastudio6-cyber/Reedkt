export type WorkerRuntimeLocalFixturePlanDecision =
  | 'worker_runtime_local_fixture_plan_ready'
  | 'worker_runtime_local_fixture_plan_ready_with_warnings'
  | 'worker_runtime_local_fixture_plan_blocked_missing_hardened_fixtures'
  | 'worker_runtime_local_fixture_plan_blocked_missing_manifest_checksums'
  | 'worker_runtime_local_fixture_plan_blocked_source_ref_policy_gap'
  | 'worker_runtime_local_fixture_plan_blocked_supabase_owner_handoff'
  | 'worker_runtime_local_fixture_plan_blocked_source_of_truth_conflict'

export type WorkerRuntimeLocalFixturePlanReports = {
  decision: Record<string, unknown>
  sourceAudit: Record<string, unknown>
  scope: Record<string, unknown>
  inputMatrix: Record<string, unknown>
  validationMatrix: Record<string, unknown>
  executionBlockerPlan: Record<string, unknown>
  validFixturePlan: Record<string, unknown>
  invalidFixturePlan: Record<string, unknown>
  manifestChecksumPlan: Record<string, unknown>
  payloadResultPlan: Record<string, unknown>
  queueJobSidecarPlan: Record<string, unknown>
  claimLeaseIdempotencyPlan: Record<string, unknown>
  retryCleanupPlan: Record<string, unknown>
  artifactSourceRefPlan: Record<string, unknown>
  observabilityCostPlan: Record<string, unknown>
  billingCreditPlan: Record<string, unknown>
  supabaseOwnerHandoffPlan: Record<string, unknown>
  cloudrunDockerOwnerHandoffPlan: Record<string, unknown>
  toolProviderRouteOwnerHandoffPlan: Record<string, unknown>
  noExecutionPolicy: Record<string, unknown>
  summary: Record<string, unknown>
}
