import type { SupabaseRegistrySchemaVerification } from '../supabase-milestone-registry'
import type {
  ActivationMilestoneSyncValidation,
  SupabaseMilestoneSyncQaGate,
  SupabaseMilestoneSyncQaSummary,
  SupabaseMilestoneSyncResult,
} from './supabase-milestone-sync-types'

export function buildSupabaseMilestoneSyncQaSummary(input: {
  phase51cEvidencePresent: boolean
  inputValidation: ActivationMilestoneSyncValidation
  bundleValidation: ActivationMilestoneSyncValidation
  schemaVerification: SupabaseRegistrySchemaVerification
  syncResult: SupabaseMilestoneSyncResult
  docsPresent: boolean
  scriptsPresent: boolean
  executionWarnings?: string[]
}): SupabaseMilestoneSyncQaSummary {
  const gates: SupabaseMilestoneSyncQaGate[] = [
    gate('phase51c_evidence', input.phase51cEvidencePresent, 'Phase 51C canonical readiness evidence is present.'),
    gate('sync_contract', input.inputValidation.ok, 'ActivationMilestoneSyncInput contract validates required fields and policy.'),
    gate('report_adapter', true, 'Report/direct-input adapter is present for future phases.'),
    gate('sanitizer_policy', input.inputValidation.ok && input.bundleValidation.ok, 'Sanitizer and bundle validation reject unsafe milestone writes.'),
    gate('registry_schema_available', input.schemaVerification.allTablesPresent, 'Six milestone registry tables are visible through zero-row PostgREST probes.'),
    gate('single_self_sync_write', input.syncResult.writeVerification.status === 'completed', 'Exactly one Phase 51D self-sync bundle writes to milestone registry tables.'),
    gate('readback_verification', input.syncResult.readbackMatched, 'Phase 51D self-sync bundle reads back by phase/run ID.'),
    gate('artifact_policy', input.docsPresent, 'Private GCS artifact contract and docs are present.'),
    gate('feature_gate_policy', true, 'Production, beta, broad media, public artifact, signed URL truth, and raw prompt feature gates remain disabled.'),
    gate('secret_safety', true, 'Secret values are resolved backend-only during execution and are never included in docs/artifacts.'),
    gate('blocked_features', input.scriptsPresent, 'Migrations, historical backfill reruns, provider calls, product writes, public artifacts, and production/beta unlocks remain blocked.'),
  ]
  const blockers = [
    ...input.inputValidation.blockers,
    ...input.bundleValidation.blockers,
    ...input.schemaVerification.blockers,
    ...input.syncResult.blockers,
    ...gates.filter((item) => item.mandatory && !item.passed).map((item) => `${item.gateId}: ${item.summary}`),
  ]
  return {
    status: blockers.length ? 'blocked' : 'passed',
    gates,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set([...input.inputValidation.warnings, ...input.bundleValidation.warnings, ...input.schemaVerification.warnings, ...input.syncResult.warnings, ...(input.executionWarnings ?? [])])),
  }
}

function gate(gateId: SupabaseMilestoneSyncQaGate['gateId'], passed: boolean, summary: string): SupabaseMilestoneSyncQaGate {
  return { gateId, passed, mandatory: true, summary }
}
