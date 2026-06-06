import type { OwnerResponseStatus, WorkstreamId } from './cross-workstream-handoff-types'

export function classifyInitialOwnerResponseStatus(workstream: WorkstreamId): OwnerResponseStatus {
  if (workstream === 'MAP_GEOSPATIAL') return 'accepted_with_blockers'
  if (workstream === 'TRACK_A_RENDER_EXPORT') return 'accepted_with_blockers'
  if (workstream === 'TRACK_B_MEDIA_PROCESSING') return 'accepted_with_blockers'
  if (workstream === 'SUPABASE_RLS_STORAGE_DATABASE') return 'accepted_with_blockers'
  return 'pending'
}

export function ownerDecisionForStatus(workstream: WorkstreamId, status: OwnerResponseStatus): string {
  if (status === 'accepted_with_blockers' && workstream === 'MAP_GEOSPATIAL') return 'controlled_internal_planning_ready_live_provider_scope_blocked'
  if (status === 'accepted_with_blockers' && workstream === 'TRACK_A_RENDER_EXPORT') return 'internal_private_evidence_ready_execution_owner_gated'
  if (status === 'accepted_with_blockers' && workstream === 'TRACK_B_MEDIA_PROCESSING') return 'partial_track_b_ready_vlm_and_demucs_blocked'
  if (status === 'accepted_with_blockers' && workstream === 'SUPABASE_RLS_STORAGE_DATABASE') return 'milestone_sync_ready_schema_rls_migration_owner_gated'
  if (workstream === 'PROVIDER_GATEWAY_MODELS' || workstream === 'WORKER_RUNTIME_JOBS') return 'pending_owner_response_execution_blocked'
  return 'pending_owner_response'
}
