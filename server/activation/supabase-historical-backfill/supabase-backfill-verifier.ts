import type { SupabaseHistoricalBackfillSummary, SupabaseHistoricalBundleRecord } from './supabase-historical-backfill-types'

export function buildSupabaseHistoricalBackfillSummary(input: { runId: string; records: SupabaseHistoricalBundleRecord[] }): SupabaseHistoricalBackfillSummary {
  const attemptedPhases = input.records.filter((record) => record.writeStatus !== 'skipped').map((record) => record.phase.phaseId)
  const writtenPhases = input.records.filter((record) => record.writeStatus === 'written').map((record) => record.phase.phaseId)
  const skippedPhases = input.records
    .filter((record) => record.writeStatus === 'skipped')
    .map((record) => ({ phaseId: record.phase.phaseId, reason: record.skippedReason ?? 'Skipped with no reason recorded.' }))
  const blockedPhases = input.records
    .filter((record) => record.writeStatus === 'blocked')
    .map((record) => ({ phaseId: record.phase.phaseId, blockers: record.blockers }))
  const p0 = input.records.filter((record) => record.phase.priority === 'P0')
  return {
    runId: input.runId,
    attemptedPhases,
    writtenPhases,
    skippedPhases,
    blockedPhases,
    p0Written: p0.filter((record) => record.writeStatus === 'written').map((record) => record.phase.phaseId),
    p0MissingOrBlocked: p0.filter((record) => record.writeStatus !== 'written').map((record) => record.phase.phaseId),
    p1Written: input.records.filter((record) => record.phase.priority === 'P1' && record.writeStatus === 'written').map((record) => record.phase.phaseId),
    writesPerformed: writtenPhases.length > 0,
    migrationsApplied: false,
    secretsPrinted: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadMediaAllowed: false,
  }
}

export function phase51DReadinessFromSummary(summary: SupabaseHistoricalBackfillSummary) {
  return summary.p0MissingOrBlocked.length === 0 ? 'ready_for_automatic_per_phase_supabase_milestone_sync' as const : 'blocked' as const
}
