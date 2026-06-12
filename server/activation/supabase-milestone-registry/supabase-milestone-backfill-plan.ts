import type { SupabaseMilestoneBackfillPlan } from './supabase-milestone-registry-types'

export function buildSupabaseMilestoneBackfillPlan(): SupabaseMilestoneBackfillPlan {
  return {
    status: 'planned',
    broadHistoricalBackfillAllowed: false,
    phase51BBackfillExecution: false,
    candidates: [
      candidate('45F', 'Track A visual-video readiness closure', 'phase45f-20260601T01103', 'track_a_visual_video_internal_ready'),
      candidate('49P', 'Web search/capture internal beta candidate', 'phase49p-20260603T21361', 'web_search_controlled_internal_beta_candidate_ready'),
      candidate('49N', 'Search provider readiness gate', 'phase49n-20260603T18331', 'search_provider_controlled_internal_testing_ready'),
      candidate('50F', 'Web search map planning private E2E', 'phase50f-20260604T141223', 'web_search_map_planning_e2e_ready'),
      candidate('50G', 'Map/geospatial internal readiness', 'phase50g-20260604T153331', 'map_geospatial_controlled_internal_testing_ready'),
      candidate('51A', 'Supabase data-plane audit', 'phase51a-20260604T204225', 'supabase_data_plane_audit_complete'),
      candidate('52A', 'Shared agent tool ownership architecture', 'phase52a-future', 'future_scoped_after_phase50g_or_system_reconciliation'),
    ],
    blockers: [],
    warnings: ['Phase 51B records only a backfill plan. Historical activation evidence backfill is deferred to Phase 51C.'],
  }
}

function candidate(phaseId: string, phaseName: string, canonicalRunId: string, readinessValue: string) {
  return {
    phaseId,
    phaseName,
    canonicalRunId,
    readinessValue,
    source: canonicalRunId.endsWith('-future') ? 'committed_docs' as const : 'private_gcs_evidence' as const,
    status: 'future_scoped_phase51c' as const,
  }
}
