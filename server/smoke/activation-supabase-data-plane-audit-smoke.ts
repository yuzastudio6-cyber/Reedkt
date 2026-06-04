import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  buildPlannedSupabaseRemoteActivityAudit,
  buildPlannedSupabaseSecretManagerAudit,
  buildSupabaseBetaReadinessImpact,
  buildSupabaseDataModelGapAnalysis,
  buildSupabaseDataPlaneAuditReport,
  buildSupabaseDataPlaneCommandPlan,
  buildSupabaseDataPlaneIamPlan,
  buildSupabaseDataPlaneQaSummary,
  buildSupabaseEnvSecretAudit,
  buildSupabaseMigrationAudit,
  buildSupabaseRlsPolicyAudit,
  buildSupabaseRuntimeIntegrationAudit,
  buildSupabaseStoryTimingRlsTriage,
  resolveSupabaseRepoSchema,
  supabaseDataPlaneAuditConfig,
  supabaseDataPlaneRequiredDocs,
  supabaseDataPlaneRequiredScripts,
  supabaseDataPlaneSafetyFlags,
} from '../activation/supabase-data-plane-audit'

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { scripts: Record<string, string>; dependencies: Record<string, string> }
const repoDiscovery = resolveSupabaseRepoSchema()
const envSecretAudit = buildSupabaseEnvSecretAudit()
const secretManagerAudit = buildPlannedSupabaseSecretManagerAudit()
const migrationAudit = buildSupabaseMigrationAudit(repoDiscovery.migrationFiles)
const rlsPolicyAudit = buildSupabaseRlsPolicyAudit(migrationAudit)
const storyTimingRlsTriage = buildSupabaseStoryTimingRlsTriage(migrationAudit)
const runtimeIntegrationAudit = buildSupabaseRuntimeIntegrationAudit()
const remoteActivityAudit = buildPlannedSupabaseRemoteActivityAudit()
const dataModelGapAnalysis = buildSupabaseDataModelGapAnalysis({
  migrationAudit,
  rlsPolicyAudit,
  runtimeIntegrationAudit,
  remoteActivityAudit,
})
const betaReadinessImpact = buildSupabaseBetaReadinessImpact(dataModelGapAnalysis, storyTimingRlsTriage)
const qa = buildSupabaseDataPlaneQaSummary({
  repoDiscovery,
  envSecretAudit,
  migrationAudit,
  rlsPolicyAudit,
  storyTimingRlsTriage,
  runtimeIntegrationAudit,
  remoteActivityAudit,
  dataModelGapAnalysis,
  betaReadinessImpact,
  docsPresent: true,
  scriptsPresent: true,
})
const commandPlan = buildSupabaseDataPlaneCommandPlan()
const iamPlan = buildSupabaseDataPlaneIamPlan()
const report = buildSupabaseDataPlaneAuditReport()

assert.equal(supabaseDataPlaneAuditConfig.phase, '51A')
assert.equal(supabaseDataPlaneAuditConfig.mode, 'supabase_data_plane_readonly_audit')
assert.equal(supabaseDataPlaneAuditConfig.baseBranch, 'codex/rp-activation-50g-map-geospatial-internal-readiness')
assert.equal(supabaseDataPlaneSafetyFlags.readOnlyAuditOnly, true)
assert.equal(supabaseDataPlaneSafetyFlags.migrationsAllowed, false)
assert.equal(supabaseDataPlaneSafetyFlags.sqlMutationAllowed, false)
assert.equal(supabaseDataPlaneSafetyFlags.rowWritesAllowed, false)
assert.equal(supabaseDataPlaneSafetyFlags.secretValueLoggingAllowed, false)
assert.equal(supabaseDataPlaneSafetyFlags.signedUrlCreationAllowed, false)
assert.equal(supabaseDataPlaneSafetyFlags.providerCallsAllowed, false)
assert.equal(supabaseDataPlaneSafetyFlags.mediaProcessingAllowed, false)
assert.equal(supabaseDataPlaneSafetyFlags.productionReadyAllowed, false)
assert.equal(supabaseDataPlaneSafetyFlags.externalBetaAllowed, false)

for (const script of supabaseDataPlaneRequiredScripts) {
  assert.equal(Boolean(packageJson.scripts[script]), true, `Missing package script ${script}`)
}
for (const doc of supabaseDataPlaneRequiredDocs) {
  assert.equal(fs.existsSync(doc), true, `Missing doc ${doc}`)
}

assert.equal(packageJson.dependencies['@supabase/supabase-js'] !== undefined, true)
assert.equal(repoDiscovery.blockers.length, 0)
assert.equal(repoDiscovery.migrationFiles.length > 0, true)
assert.equal(repoDiscovery.packageHasSupabaseJs, true)
assert.equal(envSecretAudit.secretValueExposureDetected, false)
assert.equal(secretManagerAudit.secretValuesPrinted, false)
assert.equal(secretManagerAudit.secretValuesStored, false)
assert.equal(migrationAudit.createdTables.length > 0, true)
assert.equal(migrationAudit.remoteMigrationExecutionRecorded, false)
assert.equal(migrationAudit.categoriesCovered.every((entry) => entry.covered), true)
assert.equal(rlsPolicyAudit.signedUrlValueStorageBlocked, true)
assert.equal(storyTimingRlsTriage.status, 'completed')
assert.equal(storyTimingRlsTriage.flaggedTableCount, 11)
assert.equal(storyTimingRlsTriage.p0BetaBlockerCount, 0)
assert.equal(storyTimingRlsTriage.falsePositiveCount, 11)
assert.equal(runtimeIntegrationAudit.serverAdminClient, 'service_role_guarded')
assert.equal(runtimeIntegrationAudit.frontendPublicClient, 'configured_by_vite_env')
assert.equal(remoteActivityAudit.status, 'not_attempted')
assert.equal(dataModelGapAnalysis.canRunLocalSql, false)
assert.equal(dataModelGapAnalysis.gaps.some((gap) => gap.category === 'activity_visibility'), true)
assert.equal(betaReadinessImpact.controlledInternalBetaBlocked, true)
assert.equal(commandPlan.defaultMode, 'static_report_only')
assert.equal(commandPlan.blockedAlways.includes('supabase start/status/db reset/db push/migration execution'), true)
assert.equal(iamPlan.defaultMutationAllowed, false)
for (const gateId of ['repo_supabase_discovery', 'env_secret_audit', 'migration_schema_audit', 'rls_security_audit', 'runtime_integration_audit', 'remote_activity_audit', 'data_model_gap_analysis', 'beta_readiness_impact', 'storytiming_rls_triage', 'artifact_privacy', 'blocked_features']) {
  assert.equal(qa.gates.some((gate) => gate.gateId === gateId), true, `Missing QA gate ${gateId}`)
}
assert.equal(report.reportId, 'activation-phase-51a-supabase-data-plane-audit')

console.log('Phase 51A Supabase data-plane audit smoke passed.')
