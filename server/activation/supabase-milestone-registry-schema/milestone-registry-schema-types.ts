export type SupabaseMilestoneRegistrySchemaStatus =
  | 'passed'
  | 'blocked'
  | 'planned'
  | 'skipped'

export type SupabaseMilestoneRegistrySchemaBlocker =
  | 'milestone_registry_migration_missing'
  | 'milestone_registry_table_missing'
  | 'milestone_registry_rls_missing_or_unsafe'
  | 'milestone_registry_seed_fixture_missing'
  | 'milestone_registry_rls_test_missing'
  | 'milestone_registry_local_validation_confirmation_missing'
  | 'staging_supabase_credentials_unavailable'
  | 'staging_schema_deploy_not_confirmed'
  | 'staging_schema_deploy_not_run'
  | 'staging_schema_verification_not_run'
  | 'staging_toolchain_unavailable'
  | 'forbidden_confirmation_set'

export interface SupabaseMilestoneRegistrySchemaReports {
  plan: Record<string, unknown>
  migrationReport: Record<string, unknown>
  rlsPolicyReport: Record<string, unknown>
  localValidationReport: Record<string, unknown>
  rlsTestReport: Record<string, unknown>
  seedFixtureReport: Record<string, unknown>
  stagingPreflightReport: Record<string, unknown>
  stagingDeployReport: Record<string, unknown>
  stagingVerificationReport: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
