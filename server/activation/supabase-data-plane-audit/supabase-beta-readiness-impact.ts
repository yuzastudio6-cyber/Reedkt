import type { SupabaseBetaReadinessImpact, SupabaseDataModelGapAnalysis } from './supabase-data-plane-audit-types'

export function buildSupabaseBetaReadinessImpact(gapAnalysis: SupabaseDataModelGapAnalysis): SupabaseBetaReadinessImpact {
  const p0Blockers = gapAnalysis.gaps.filter((gap) => gap.severity === 'P0').map((gap) => `${gap.gapId}: ${gap.summary}`)
  const controlledInternalBetaBlocked = p0Blockers.length > 0
  return {
    controlledInternalBetaBlocked,
    reason: controlledInternalBetaBlocked
      ? 'Supabase data-plane evidence is not sufficient for controlled internal beta because P0 persistence/security/activity blockers remain.'
      : 'Supabase data-plane evidence is sufficient to plan Phase 51B schema/migration hardening.',
    p0Blockers,
    phase51BReadiness: controlledInternalBetaBlocked ? 'blocked' : 'ready_for_schema_migration_hardening_plan',
    blockers: p0Blockers,
    warnings: gapAnalysis.warnings,
  }
}
