export type WorkerRuntimeNoopDryRunExecutionDecision =
  | 'worker_noop_dry_run_passed_ready_for_contract_review'
  | 'worker_noop_dry_run_passed_with_warnings_ready_for_contract_review'
  | 'worker_noop_dry_run_blocked_preflight_failed'
  | 'worker_noop_dry_run_blocked_fixture_validation_failed'
  | 'worker_noop_dry_run_blocked_policy_violation'
  | 'worker_noop_dry_run_blocked_source_of_truth_conflict'
  | 'worker_noop_dry_run_failed'

export type WorkerRuntimeNoopDryRunExecutionReports = {
  plan: Record<string, unknown>
  sourceOfTruthAudit: Record<string, unknown>
  fixtureInventory: Record<string, unknown>
  validFixtureResults: Record<string, unknown>
  invalidFixtureResults: Record<string, unknown>
  queueJobSidecarGuardrails: Record<string, unknown>
  artifactSourceRefGuardrails: Record<string, unknown>
  rawPromptRejection: Record<string, unknown>
  signedUrlPublicArtifactRejection: Record<string, unknown>
  supabaseNoWriteVerification: Record<string, unknown>
  runtimeNoExecutionVerification: Record<string, unknown>
  observabilityCostMetadata: Record<string, unknown>
  billingCreditPlaceholderMetadata: Record<string, unknown>
  failClosedEvents: Record<string, unknown>
  executionResult: Record<string, unknown>
  decision: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
  summary: Record<string, unknown>
}
