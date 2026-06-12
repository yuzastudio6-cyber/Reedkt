export type WorkerRuntimeDryRunContractReviewDecision =
  | 'worker_runtime_dry_run_contract_review_passed_ready_for_fixture_hardening'
  | 'worker_runtime_dry_run_contract_review_passed_with_warnings_ready_for_fixture_hardening'
  | 'worker_runtime_dry_run_contract_review_blocked_missing_payload_fields'
  | 'worker_runtime_dry_run_contract_review_blocked_missing_result_schema'
  | 'worker_runtime_dry_run_contract_review_blocked_missing_fail_closed_evidence'
  | 'worker_runtime_dry_run_contract_review_blocked_missing_supabase_owner_handoff'
  | 'worker_runtime_dry_run_contract_review_blocked_source_of_truth_conflict'

export type WorkerRuntimeDryRunContractReviewReports = {
  decision: Record<string, unknown>
  noopEvidenceAcceptance: Record<string, unknown>
  fixtureContractReview: Record<string, unknown>
  payloadSchemaReview: Record<string, unknown>
  resultSchemaReview: Record<string, unknown>
  invalidFixtureFailClosedReview: Record<string, unknown>
  queueJobSidecarContractReview: Record<string, unknown>
  claimLeaseIdempotencyContractReview: Record<string, unknown>
  artifactSourceRefContractReview: Record<string, unknown>
  observabilityCostContractReview: Record<string, unknown>
  billingCreditContractReview: Record<string, unknown>
  supabasePersistenceBlockerReview: Record<string, unknown>
  cloudrunDockerBlockerReview: Record<string, unknown>
  toolProviderRouteBlockerReview: Record<string, unknown>
  workerExecutionBlockerRegister: Record<string, unknown>
  summary: Record<string, unknown>
}
