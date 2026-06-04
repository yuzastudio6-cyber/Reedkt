import type { SupabaseBetaReadinessImpact, SupabaseDataModelGapAnalysis, SupabaseStoryTimingRlsTriage } from './supabase-data-plane-audit-types'

export function buildSupabaseBetaReadinessImpact(
  gapAnalysis: SupabaseDataModelGapAnalysis,
  storyTimingRlsTriage?: SupabaseStoryTimingRlsTriage,
): SupabaseBetaReadinessImpact {
  const p0Blockers = gapAnalysis.gaps.filter((gap) => gap.severity === 'P0').map((gap) => `${gap.gapId}: ${gap.summary}`)
  const controlledInternalBetaBlocked = p0Blockers.length > 0
  const phase51BReady =
    !gapAnalysis.gaps.some((gap) => gap.gapId === 'p0-remote-activity-unverified') &&
    storyTimingRlsTriage?.status === 'completed'
  return {
    controlledInternalBetaBlocked,
    reason: controlledInternalBetaBlocked
      ? 'Supabase data-plane evidence is not sufficient for controlled internal beta because P0 persistence/security/activity blockers remain.'
      : 'Supabase data-plane evidence is sufficient to plan the next Supabase milestone.',
    p0Blockers,
    phase51BReadiness: phase51BReady ? 'ready_for_supabase_activation_milestone_registry' : 'blocked',
    blockers: phase51BReady ? [] : ['Phase 51B milestone registry readiness requires completed remote activity audit and StoryTiming RLS triage.'],
    warnings: gapAnalysis.warnings,
  }
}
