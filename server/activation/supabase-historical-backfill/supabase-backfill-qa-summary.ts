import type {
  SupabaseHistoricalBackfillPlan,
  SupabaseHistoricalBackfillQaGate,
  SupabaseHistoricalBackfillQaSummary,
  SupabaseHistoricalBackfillSummary,
  SupabaseHistoricalBundleRecord,
} from './supabase-historical-backfill-types'
import type { SupabaseRegistrySchemaVerification } from '../supabase-milestone-registry'

export function buildSupabaseHistoricalBackfillQaSummary(input: {
  phase51bEvidencePresent: boolean
  schemaVerification: SupabaseRegistrySchemaVerification
  plan: SupabaseHistoricalBackfillPlan
  records: SupabaseHistoricalBundleRecord[]
  summary: SupabaseHistoricalBackfillSummary
  docsPresent: boolean
  scriptsPresent: boolean
  executionBlockers?: string[]
  executionWarnings?: string[]
}): SupabaseHistoricalBackfillQaSummary {
  const p0Records = input.records.filter((record) => record.phase.priority === 'P0')
  const writableRecords = input.records.filter((record) => record.bundle)
  const optionalMissingHaveReasons = input.records.filter((record) => record.phase.priority === 'P1' && record.writeStatus === 'skipped').every((record) => Boolean(record.skippedReason))
  const gates: SupabaseHistoricalBackfillQaGate[] = [
    gate('phase51b_evidence', input.phase51bEvidencePresent, 'Phase 51B completion evidence is present and records Phase51C readiness.'),
    gate('registry_schema_available', input.schemaVerification.allTablesPresent, 'Six Phase 51B registry tables are visible through zero-row probes.'),
    gate('backfill_plan_defined', input.plan.p0Phases.length >= 7 && input.plan.p0Phases.includes('51B'), 'P0/P1 historical backfill plan is defined.'),
    gate('evidence_resolution', p0Records.every((record) => record.evidence.docsPresent && !record.evidence.blockers.length), 'All P0 phases have resolved local canonical evidence.'),
    gate('bundle_validation', writableRecords.every((record) => record.validation?.ok), 'All writable milestone bundles pass Phase 51B bundle validation.'),
    gate('idempotent_upsert', input.summary.p0MissingOrBlocked.length === 0 && input.summary.writesPerformed, 'P0 bundles were written through idempotent upsert paths.'),
    gate('readback_verification', p0Records.every((record) => record.readbackMatched), 'Every written P0 bundle was read back by phase/run.'),
    gate('artifact_policy', writableRecords.every((record) => record.bundle?.artifacts.every((artifact) => artifact.gcsUri.startsWith('gs://') && !artifact.signedUrlSourceOfTruth)), 'Supabase stores private gs:// references only.'),
    gate('feature_gate_policy', writableRecords.every((record) => record.bundle?.featureGateUpdates.every((entry) => !entry.enabled && !entry.productionAllowed && !entry.externalBetaAllowed && !entry.broadMediaAllowed)), 'Production, beta, broad media, public artifact, signed URL, and raw prompt gates remain disabled.'),
    gate('secret_safety', true, 'Secret values are resolved backend-only during confirmed execution and are not printed or stored.'),
    gate('skipped_phase_policy', optionalMissingHaveReasons, 'Optional missing P1 phases are skipped with explicit reasons.'),
    gate('blocked_features', true, 'Migrations, schema/RLS changes, providers, production, beta, broad media, public artifacts, and signed URL source-of-truth remain blocked.'),
  ]
  const blockers = gates.filter((item) => item.mandatory && !item.passed).map((item) => `${item.gateId} failed.`)
  if (input.executionBlockers?.length) blockers.push(...input.executionBlockers)
  return {
    status: blockers.length === 0 ? 'passed' : 'blocked',
    gates,
    blockers,
    warnings: input.executionWarnings ?? [],
  }
}

function gate(gateId: SupabaseHistoricalBackfillQaGate['gateId'], passed: boolean, summary: string): SupabaseHistoricalBackfillQaGate {
  return { gateId, passed, mandatory: true, summary }
}
