import type { SystemBlockerRecord, SystemHandoffPacket, WorkstreamReadinessRecord } from './system-readiness-reconciliation-types'

const prohibitedActions = ['runtime execution', 'worker execution', 'provider calls', 'public artifacts', 'signed URLs as source of truth', 'production unlock', 'external beta unlock']

export function buildSystemHandoffPackets(input: { readiness: WorkstreamReadinessRecord[]; blockers: SystemBlockerRecord[] }): SystemHandoffPacket[] {
  return input.readiness.map((item) => {
    const blockerIds = input.blockers.filter((blocker) => blocker.workstream === item.workstream || blocker.workstream === 'SYSTEM').map((blocker) => blocker.blockerId)
    return {
      packetId: handoffIdForWorkstream(item.workstream),
      workstream: item.workstream,
      currentEvidence: item.currentEvidence,
      readyScope: item.readyFor,
      blockedScope: item.blockedScope,
      candidatePlansRelevant: candidatePlansForWorkstream(item.workstream),
      requiredContracts: requiredContractsForWorkstream(item.workstream),
      recommendedNextPrompt: item.recommendedNextPrompt,
      prohibitedActions,
      supabaseRefs: ['52E:phase52e-20260605T175613', '52F:<runId>'],
      riskLevel: blockerIds.some((id) => id.includes('production') || id.includes('worker')) ? 'high' : 'medium',
    }
  })
}

export function handoffIdForWorkstream(workstream: WorkstreamReadinessRecord['workstream']): string {
  return `handoff-${workstream.toLowerCase().replace(/_/g, '-')}`
}

function candidatePlansForWorkstream(workstream: WorkstreamReadinessRecord['workstream']): string[] {
  const map: Record<WorkstreamReadinessRecord['workstream'], string[]> = {
    AI_TOOLS_CREATIVE_GRAPHICS: ['motion_graphics_lower_third'],
    MAP_GEOSPATIAL: ['route_map_overlay', 'location_context_card'],
    SOUND_MUSIC_AUDIO: ['noise_cleanup'],
    TRACK_A_RENDER_EXPORT: ['conservative_color_adjustment', 'caption_burnin_preview', 'text_behind_subject_preview', 'slow_motion_segment'],
    TRACK_B_MEDIA_PROCESSING: ['noise_cleanup', 'qwen_vlm_visual_understanding_request', 'demucs_stem_separation_request'],
    SUPABASE_RLS_STORAGE_DATABASE: ['milestone sync metadata only'],
    PROVIDER_GATEWAY_MODELS: ['web_research_planning_context'],
    WORKER_RUNTIME_JOBS: ['all candidate approved-plan snapshots once future owner approves execution'],
    COMPLIANCE_SECURITY: ['all future internal beta candidates'],
    OBSERVABILITY_AUDIT_COST: ['all future internal beta candidates'],
    FRONTEND_PRODUCT_UX: ['all candidate approved-plan snapshot UX surfaces'],
    BILLING_STRIPE_CREDITS: ['future credit reservation and estimate gates'],
  }
  return map[workstream]
}

function requiredContractsForWorkstream(workstream: WorkstreamReadinessRecord['workstream']): string[] {
  if (workstream === 'SUPABASE_RLS_STORAGE_DATABASE') return ['Phase 51D milestone sync contract', 'Phase 51B registry tables']
  if (workstream === 'WORKER_RUNTIME_JOBS') return ['approved plan snapshot execution contract', 'worker claim/lease policy']
  if (workstream === 'AI_TOOLS_CREATIVE_GRAPHICS') return ['AI Tools capability manifest', 'graphics source-of-truth manifest']
  if (workstream === 'TRACK_B_MEDIA_PROCESSING') return ['Track B runtime manifest', 'model provenance records']
  return ['owner readiness manifest', 'private artifact/source-of-truth policy']
}
