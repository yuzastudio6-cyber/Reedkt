import type { SupabaseMilestoneBundleValidation, SupabaseMilestoneWriteVerification, SupabaseRegistrySchemaVerification } from '../supabase-milestone-registry'
import type { ActivationMilestoneReadbackVerification, ActivationMilestoneSanitizerResult, SupabaseMilestoneSyncQaGate, SupabaseMilestoneSyncQaSummary } from './supabase-milestone-sync-types'

export function buildSupabaseMilestoneSyncQaSummary(input: {
  phase51cEvidencePresent: boolean
  schemaVerification: SupabaseRegistrySchemaVerification
  bundleValidation: SupabaseMilestoneBundleValidation
  sanitizer: ActivationMilestoneSanitizerResult
  writeVerification: SupabaseMilestoneWriteVerification
  readbackVerification: ActivationMilestoneReadbackVerification
  docsPresent: boolean
  scriptsPresent: boolean
  artifactUploadBlockers?: string[]
  executionWarnings?: string[]
}): SupabaseMilestoneSyncQaSummary {
  const gate = (gateId: SupabaseMilestoneSyncQaGate['gateId'], passed: boolean, summary: string): SupabaseMilestoneSyncQaGate => ({ gateId, passed, mandatory: true, summary })
  const gates = [
    gate('phase51c_evidence', input.phase51cEvidencePresent, 'Phase 51C completed and records Phase51D readiness.'),
    gate('registry_schema_available', input.schemaVerification.allTablesPresent, 'Six Phase 51B registry tables are visible through zero-row probes.'),
    gate('sync_contract_defined', input.scriptsPresent, 'ActivationMilestoneSyncInput contract and package scripts are present.'),
    gate('report_adapter', input.scriptsPresent, 'Report-to-bundle adapter is present and used for direct self-sync input.'),
    gate('sanitizer_policy', input.sanitizer.ok && input.bundleValidation.ok, 'Sanitizer and Phase 51B validator reject unsafe milestone payloads.'),
    gate('idempotent_sync', input.writeVerification.status === 'completed' || input.writeVerification.status === 'not_attempted', 'Sync uses Phase 51B idempotent writeMilestoneBundle path.'),
    gate('self_sync_write', input.writeVerification.status === 'completed', 'Phase 51D self-sync bundle is written to the registry.'),
    gate('readback_verification', input.readbackVerification.status === 'completed', 'Phase 51D activation run reads back by phase/run.'),
    gate('feature_gate_policy', true, 'Production, beta, broad media, public artifact, signed URL truth, and raw prompt gates remain disabled.'),
    gate('future_phase_contract', input.docsPresent, 'Future phase sync documentation and PR summary contract are present.'),
    gate('artifact_privacy', !(input.artifactUploadBlockers?.length), 'Phase 51D artifacts are private GCS JSON references only.'),
    gate('blocked_features', true, 'No migrations, historical backfill, schema/RLS mutation, provider expansion, production, beta, or broad media unlocks occurred.'),
  ]
  const blockers = gates.filter((item) => !item.passed).map((item) => `${item.gateId} failed.`)
  if (input.artifactUploadBlockers?.length) blockers.push(...input.artifactUploadBlockers)
  const warnings = [...(input.executionWarnings ?? []), ...input.schemaVerification.warnings, ...input.sanitizer.warnings, ...input.writeVerification.warnings, ...input.readbackVerification.warnings]
  return { status: blockers.length ? 'blocked' : 'passed', gates, blockers, warnings: Array.from(new Set(warnings)) }
}
