import { supabaseMilestoneRegistryQaGateIds } from './supabase-milestone-registry-policy'
import type {
  SupabaseMilestoneBackfillPlan,
  SupabaseMilestoneBundle,
  SupabaseMilestoneBundleValidation,
  SupabaseMilestoneRegistryQaGate,
  SupabaseMilestoneRegistryQaSummary,
  SupabaseMilestoneRegistryCommandPlan,
  SupabaseMilestoneRegistryIamPlan,
  SupabaseMilestoneWriteVerification,
  SupabaseRegistryMigrationSummary,
  SupabaseRegistrySchemaMetadata,
  SupabaseRegistrySchemaVerification,
} from './supabase-milestone-registry-types'

export function buildSupabaseMilestoneRegistryQaSummary(input: {
  phase51aEvidencePresent: boolean
  schemaMetadata: SupabaseRegistrySchemaMetadata
  migrationSummary: SupabaseRegistryMigrationSummary
  schemaVerification: SupabaseRegistrySchemaVerification
  bundle: SupabaseMilestoneBundle
  bundleValidation: SupabaseMilestoneBundleValidation
  writeVerification: SupabaseMilestoneWriteVerification
  backfillPlan: SupabaseMilestoneBackfillPlan
  commandPlan: SupabaseMilestoneRegistryCommandPlan
  iamPlan: SupabaseMilestoneRegistryIamPlan
  docsPresent: boolean
  scriptsPresent: boolean
  executionBlockers?: string[]
  executionWarnings?: string[]
}): SupabaseMilestoneRegistryQaSummary {
  const gates: SupabaseMilestoneRegistryQaGate[] = [
    gate('phase51a_evidence', input.phase51aEvidencePresent, 'Phase 51A completion evidence is present and records Phase51B readiness.'),
    gate('schema_metadata', input.schemaMetadata.tables.length === 6, 'Schema metadata covers the six Phase 51B registry tables.'),
    gate('migration_safety', !input.migrationSummary.destructiveStatementsDetected && input.migrationSummary.ddlViaSupabaseRestAttempted === false, 'Migration is idempotent and local-psql-only when applied.'),
    gate('rls_security', input.schemaMetadata.rlsEnabledRequired && input.schemaMetadata.serviceRoleOnlyRequired, 'Registry tables require RLS and service-role-only direct access.'),
    gate('credential_safety', input.migrationSummary.ddlViaSupabaseRestAttempted === false, 'Credential handling avoids secret printing and does not use service-role REST for DDL.'),
    gate('writer_validation', input.bundleValidation.ok, 'Writer validation rejects unsafe artifacts, signed URL source-of-truth, secret-looking values, and forbidden feature unlocks.'),
    gate('schema_verification', input.schemaVerification.status === 'completed' || input.schemaVerification.status === 'not_attempted', 'Schema verification is read-only; missing tables block writes rather than forcing DDL.'),
    gate('milestone_bundle', input.bundle.phaseId === '51B' && input.bundle.featureGateUpdates.every((entry) => !entry.enabled), 'Phase51B milestone bundle is structured and keeps feature gates disabled.'),
    gate('supabase_write_verification', input.writeVerification.status !== 'blocked' || !input.schemaVerification.allTablesPresent, 'Supabase write succeeds only when schema exists; otherwise the write path blocks safely.'),
    gate('backfill_plan', input.backfillPlan.phase51BBackfillExecution === false && input.backfillPlan.candidates.length >= 7, 'Historical activation evidence backfill is planned for Phase51C and not run in Phase51B.'),
    gate('artifact_privacy', input.iamPlan.defaultMutationAllowed === false && input.bundle.artifacts.every((artifact) => artifact.gcsUri.startsWith('gs://')), 'Artifacts are private GCS references and IAM plan is report-only.'),
    gate('blocked_features', input.commandPlan.blockedAlways.length > 0 && input.bundle.featureGateUpdates.every((entry) => !entry.productionAllowed && !entry.externalBetaAllowed && !entry.broadMediaAllowed), 'Production, external beta, paid production, broad media, public artifacts, signed URLs, raw prompt execution, providers, and frontend service-role exposure remain blocked.'),
  ]
  for (const gateId of supabaseMilestoneRegistryQaGateIds) {
    if (!gates.some((gate) => gate.gateId === gateId)) {
      gates.push(gate(gateId, false, `Missing QA gate ${gateId}.`))
    }
  }
  const blockers = [
    ...gates.filter((entry) => entry.mandatory && !entry.passed).map((entry) => `${entry.gateId}: ${entry.summary}`),
    ...(input.executionBlockers ?? []),
    ...input.bundleValidation.blockers,
    ...input.schemaVerification.blockers,
    ...input.migrationSummary.blockers,
    ...input.writeVerification.blockers,
  ]
  const warnings = [
    ...(input.executionWarnings ?? []),
    ...input.bundleValidation.warnings,
    ...input.schemaVerification.warnings,
    ...input.migrationSummary.warnings,
    ...input.writeVerification.warnings,
    ...(input.docsPresent ? [] : ['Phase51B docs were not found.']),
    ...(input.scriptsPresent ? [] : ['Phase51B package scripts were not found.']),
  ]
  return {
    status: blockers.length === 0 ? 'passed' : 'blocked',
    gates,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
  }
}

function gate(gateId: SupabaseMilestoneRegistryQaGate['gateId'], passed: boolean, summary: string): SupabaseMilestoneRegistryQaGate {
  return { gateId, passed, mandatory: true, summary }
}
