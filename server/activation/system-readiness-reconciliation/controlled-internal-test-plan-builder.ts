import type { ControlledInternalTestLane, WorkstreamReadinessRecord } from './system-readiness-reconciliation-types'

export function buildControlledInternalTestPlan(readiness: WorkstreamReadinessRecord[]): ControlledInternalTestLane[] {
  const byWorkstream = new Map(readiness.map((item) => [item.workstream, item]))
  return [
    lane('visual_video_private_review_planning', 'TRACK_A_RENDER_EXPORT', byWorkstream, ['existing approved private media/evidence only'], ['future approved plan snapshots', 'private review artifacts'], 'Track A / Worker Runtime', 'Track A controlled internal private review go/no-go'),
    lane('web_search_planning', 'PROVIDER_GATEWAY_MODELS', byWorkstream, ['controlled queries/allowlisted capture policy evidence only'], ['source/capture/extraction planning manifests'], 'web search owner + Worker Runtime', 'Web search controlled internal test packet'),
    lane('map_geospatial_planning', 'MAP_GEOSPATIAL', byWorkstream, ['generated/local map evidence only'], ['map scene manifests; screenshots remain QA artifacts'], 'map stack + Worker Runtime', 'Map/geospatial controlled internal test packet'),
    lane('ai_tools_graphics_handoff', 'AI_TOOLS_CREATIVE_GRAPHICS', byWorkstream, ['Phase 52B placeholder records'], ['AI Tools manifest handoff'], 'AI Tools chat', 'Prompt GD-0 — AI Tools / Graphic Design Stack Repo Audit'),
    lane('track_b_audio_media_handoff', 'TRACK_B_MEDIA_PROCESSING', byWorkstream, ['Track B readiness placeholders'], ['Track B runtime blocker packet'], 'Track B', 'Track B runtime manifest and blocker reconciliation'),
    lane('supabase_milestone_verification', 'SUPABASE_RLS_STORAGE_DATABASE', byWorkstream, ['Phase 51D milestone sync contract'], ['one Phase 52F milestone record'], 'Supabase milestone sync path', 'Phase 52G Supabase milestone verification'),
    lane('worker_runtime_future_execution', 'WORKER_RUNTIME_JOBS', byWorkstream, ['candidate approved-plan snapshots validated but not executable'], ['future worker execution contract'], 'Worker Runtime/jobs owner', 'Worker Runtime approved snapshot execution contract review'),
  ]
}

function lane(
  laneId: string,
  ownerWorkstream: ControlledInternalTestLane['ownerWorkstream'],
  readinessByWorkstream: Map<string, WorkstreamReadinessRecord>,
  requiredEvidence: string[],
  allowedScope: string[],
  ownerNote: string,
  requiredNextPrompt: string,
): ControlledInternalTestLane {
  const readiness = readinessByWorkstream.get(ownerWorkstream)
  return {
    laneId,
    ownerWorkstream,
    readiness: readiness?.status ?? 'owner_follow_up_required',
    allowedScope,
    blockedScope: ['execution in Phase 52F', 'production', 'external beta', 'public artifacts', 'signed URLs as source of truth'],
    requiredEvidence,
    requiredNextPrompt,
    safetyConstraints: ['candidate plans only', 'rawPromptExecution=false', 'workerExecutionAllowed=false', 'private gs:// artifacts only', ownerNote],
    supabaseMilestoneRefs: ['52E:phase52e-20260605T175613'],
    executableInPhase52F: false,
  }
}
