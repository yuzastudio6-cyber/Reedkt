import { supabaseDataPlaneQaGateIds, supabaseDataPlaneRequiredDocs, supabaseDataPlaneRequiredScripts, supabaseDataPlaneSafetyFlags } from './supabase-data-plane-audit-policy'
import type {
  SupabaseActivityAudit,
  SupabaseBetaReadinessImpact,
  SupabaseDataModelGapAnalysis,
  SupabaseDataPlaneQaGate,
  SupabaseDataPlaneQaGateId,
  SupabaseDataPlaneQaSummary,
  SupabaseEnvSecretAudit,
  SupabaseMigrationAudit,
  SupabaseRepoSchemaDiscovery,
  SupabaseRlsPolicyAudit,
  SupabaseRuntimeIntegrationAudit,
} from './supabase-data-plane-audit-types'

export function buildSupabaseDataPlaneQaSummary(input: {
  repoDiscovery: SupabaseRepoSchemaDiscovery
  envSecretAudit: SupabaseEnvSecretAudit
  migrationAudit: SupabaseMigrationAudit
  rlsPolicyAudit: SupabaseRlsPolicyAudit
  runtimeIntegrationAudit: SupabaseRuntimeIntegrationAudit
  remoteActivityAudit: SupabaseActivityAudit
  dataModelGapAnalysis: SupabaseDataModelGapAnalysis
  betaReadinessImpact: SupabaseBetaReadinessImpact
  docsPresent: boolean
  scriptsPresent: boolean
  executionBlockers?: string[]
  executionWarnings?: string[]
}): SupabaseDataPlaneQaSummary {
  const blockedFeatures =
    !supabaseDataPlaneSafetyFlags.migrationsAllowed &&
    !supabaseDataPlaneSafetyFlags.sqlMutationAllowed &&
    !supabaseDataPlaneSafetyFlags.supabaseLifecycleAllowed &&
    !supabaseDataPlaneSafetyFlags.remoteSchemaMutationAllowed &&
    !supabaseDataPlaneSafetyFlags.rowWritesAllowed &&
    !supabaseDataPlaneSafetyFlags.secretValueLoggingAllowed &&
    !supabaseDataPlaneSafetyFlags.signedUrlCreationAllowed &&
    !supabaseDataPlaneSafetyFlags.providerCallsAllowed &&
    !supabaseDataPlaneSafetyFlags.mediaProcessingAllowed &&
    !supabaseDataPlaneSafetyFlags.dockerAllowed &&
    !supabaseDataPlaneSafetyFlags.deploymentAllowed &&
    !supabaseDataPlaneSafetyFlags.productionReadyAllowed &&
    !supabaseDataPlaneSafetyFlags.externalBetaAllowed &&
    !supabaseDataPlaneSafetyFlags.broadMediaAllowed
  const gates: SupabaseDataPlaneQaGate[] = [
    gate('repo_supabase_discovery', input.repoDiscovery.blockers.length === 0, 'Repo Supabase clients, env config, docs, and migration files were discovered.'),
    gate('env_secret_audit', input.envSecretAudit.blockers.length === 0 && !input.envSecretAudit.secretValueExposureDetected, 'Secret values are not printed; frontend service-role exposure is not detected.'),
    gate('migration_schema_audit', input.migrationAudit.blockers.length === 0, 'Migration SQL was parsed for data-plane table coverage and local/review-ready state.'),
    gate('rls_security_audit', input.rlsPolicyAudit.blockers.length === 0, 'RLS, storage policy, and signed URL audit coverage were checked from committed SQL.'),
    gate('runtime_integration_audit', input.runtimeIntegrationAudit.blockers.length === 0, 'Runtime Supabase client boundaries and table references were audited.'),
    gate('remote_activity_audit', input.remoteActivityAudit.status === 'completed', 'Remote Supabase activity was count-checked through backend credentials, or is blocked with exact reason.'),
    gate('data_model_gap_analysis', input.dataModelGapAnalysis.gaps.length > 0, 'P0/P1/P2 data-model gaps were classified for Phase 51B planning.'),
    gate('beta_readiness_impact', input.betaReadinessImpact.controlledInternalBetaBlocked && input.betaReadinessImpact.p0Blockers.length > 0, 'Internal beta impact records the remaining Supabase P0 blockers instead of unlocking beta.'),
    gate('blocked_features', blockedFeatures && input.docsPresent && input.scriptsPresent, 'Migrations, writes, providers, media processing, deployment, production, beta, and broad media remain blocked.'),
  ]
  for (const gateId of supabaseDataPlaneQaGateIds) {
    if (!gates.some((entry) => entry.gateId === gateId)) throw new Error(`Missing Phase 51A QA gate ${gateId}`)
  }
  const blockers = [
    ...gates.filter((entry) => !entry.passed && entry.gateId !== 'remote_activity_audit').map((entry) => `${entry.gateId} failed.`),
    ...input.repoDiscovery.blockers,
    ...input.envSecretAudit.blockers,
    ...input.migrationAudit.blockers,
    ...input.rlsPolicyAudit.blockers,
    ...input.runtimeIntegrationAudit.blockers,
    ...input.dataModelGapAnalysis.blockers,
    ...input.betaReadinessImpact.blockers,
    ...(input.executionBlockers ?? []),
  ]
  const warnings = [
    ...(input.remoteActivityAudit.status === 'completed' ? [] : ['remote_activity_audit blocked: remote counts were not completed.']),
    ...input.repoDiscovery.warnings,
    ...input.envSecretAudit.warnings,
    ...input.migrationAudit.warnings,
    ...input.rlsPolicyAudit.warnings,
    ...input.runtimeIntegrationAudit.warnings,
    ...input.remoteActivityAudit.blockers,
    ...input.remoteActivityAudit.warnings,
    ...input.dataModelGapAnalysis.warnings,
    ...input.betaReadinessImpact.warnings,
    ...(input.executionWarnings ?? []),
  ]
  return {
    status: blockers.length === 0 ? (input.remoteActivityAudit.status === 'completed' ? 'passed' : 'partial') : 'blocked',
    gates,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
  }
}

export function areSupabaseDataPlaneDocsPresent(existingPaths: Set<string>): boolean {
  return supabaseDataPlaneRequiredDocs.every((doc) => existingPaths.has(doc))
}

export function areSupabaseDataPlaneScriptsPresent(scripts: Record<string, string>): boolean {
  return supabaseDataPlaneRequiredScripts.every((script) => Boolean(scripts[script]))
}

function gate(gateId: SupabaseDataPlaneQaGateId, passed: boolean, summary: string): SupabaseDataPlaneQaGate {
  return { gateId, passed, severity: 'mandatory', summary }
}
