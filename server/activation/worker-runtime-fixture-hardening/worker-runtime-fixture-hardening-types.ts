export type WorkerRuntimeFixtureHardeningDecision =
  | 'worker_runtime_fixture_hardening_passed_ready_for_local_fixture_plan'
  | 'worker_runtime_fixture_hardening_passed_with_warnings_ready_for_local_fixture_plan'
  | 'worker_runtime_fixture_hardening_blocked_source_of_truth_conflict'
  | 'worker_runtime_fixture_hardening_blocked_missing_contract_review'
  | 'worker_runtime_fixture_hardening_blocked_missing_fixture_contract'
  | 'worker_runtime_fixture_hardening_blocked_invalid_fixture_coverage'
  | 'worker_runtime_fixture_hardening_blocked_policy_violation'

export type WorkerRuntimeFixtureHardeningReports = {
  sourceAudit: Record<string, unknown>
  fixtureInventory: Record<string, unknown>
  validFixtureHardening: Record<string, unknown>
  invalidFixtureHardening: Record<string, unknown>
  payloadFixtureHardening: Record<string, unknown>
  resultFixtureHardening: Record<string, unknown>
  manifestChecksumProvenanceHardening: Record<string, unknown>
  queueJobSidecarFixtureHardening: Record<string, unknown>
  claimLeaseIdempotencyFixtureHardening: Record<string, unknown>
  retryCleanupFixtureHardening: Record<string, unknown>
  artifactSourceRefFixtureHardening: Record<string, unknown>
  observabilityCostFixtureHardening: Record<string, unknown>
  billingCreditFixtureHardening: Record<string, unknown>
  supabasePersistenceBlockerFixtureHardening: Record<string, unknown>
  cloudrunDockerBlockerFixtureHardening: Record<string, unknown>
  toolProviderRouteBlockerFixtureHardening: Record<string, unknown>
  noExecutionFixturePolicy: Record<string, unknown>
  decision: Record<string, unknown>
  summary: Record<string, unknown>
}

export type WorkerRuntimeFixtureHardeningArtifacts = {
  validFixtures: Record<string, unknown>
  invalidFixtures: Record<string, unknown>
  fixtureManifest: Record<string, unknown>
  fixtureChecksums: Record<string, unknown>
  fixtureSchemaVersions: Record<string, unknown>
}
