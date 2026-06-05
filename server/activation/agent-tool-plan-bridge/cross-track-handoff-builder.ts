import type { BlockedPlanRecord, CandidateApprovedPlanSnapshot, CrossTrackHandoffPacket } from './agent-tool-plan-bridge-types'

const commonProhibited = [
  'tool/model/provider execution',
  'worker execution',
  'raw prompt execution',
  'public artifact publication',
  'signed URL as source of truth',
  'production or external beta unlock',
]

export function buildCrossTrackHandoffPackets(input: {
  runId: string
  candidatePlans: CandidateApprovedPlanSnapshot[]
  blockedPlans: BlockedPlanRecord[]
}): CrossTrackHandoffPacket[] {
  return [
    packet(input, 'track_a_visual_plan_candidates_handoff', 'TRACK_A_RENDER_EXPORT', 'Track A should validate render/export capable approved snapshots before any visual-video runtime.', 'Track A visual-video follow-up'),
    packet(input, 'web_search_plan_candidates_handoff', 'WEB_SEARCH_CAPTURE', 'Web search/capture remains internal candidate planning evidence; no new search is executed by Phase 52D.', 'Web search internal planning follow-up'),
    packet(input, 'map_geospatial_plan_candidates_handoff', 'MAP_GEOSPATIAL', 'Map/geospatial consumes GeoJSON/Turf/style/camera/render manifests; no live tiles, geocoding, or routing.', 'Map/geospatial planning follow-up'),
    packet(input, 'ai_tools_graphics_handoff', 'AI_TOOLS_CREATIVE_GRAPHICS', 'AI Tools owns creative graphics and motion design runtime; lower-third request is handoff-only.', 'Prompt GD-0 / AI Tools graphics ownership follow-up'),
    packet(input, 'track_b_audio_vlm_handoff', 'TRACK_B_MEDIA_PROCESSING', 'Track B owns audio/VLM runtimes; DeepFilterNet, Qwen VLM/vLLM, and Demucs remain blocked or externally owned.', 'Track B audio/VLM readiness follow-up'),
    packet(input, 'worker_runtime_future_execution_handoff', 'WORKER_RUNTIME_JOBS', 'Worker Runtime must reject unknown scope/tool/action and execute only future approved snapshots.', 'Worker Runtime approved-snapshot execution follow-up'),
    packet(input, 'supabase_milestone_sync_handoff', 'SUPABASE_MILESTONE_SYNC', 'Supabase milestone sync stores private gs:// references and structured metadata only.', 'Phase 51D future sync contract'),
  ]
}

function packet(
  input: { runId: string; candidatePlans: CandidateApprovedPlanSnapshot[]; blockedPlans: BlockedPlanRecord[] },
  packetId: string,
  targetWorkstream: CrossTrackHandoffPacket['targetWorkstream'],
  ownerAction: string,
  nextOwner: string,
): CrossTrackHandoffPacket {
  const candidatePlans = input.candidatePlans.filter((plan) => plan.crossTrackOwner === targetWorkstream)
  const blockedPlans = input.blockedPlans.filter((plan) => plan.ownerRoute === targetWorkstream)
  const capabilities = new Set<string>()
  for (const plan of candidatePlans) for (const route of plan.selectedToolRoutes) for (const toolId of route.toolIds) capabilities.add(toolId)
  for (const plan of blockedPlans) for (const toolId of plan.requiredCapabilities) capabilities.add(toolId)
  return {
    packetId,
    targetWorkstream,
    candidatePlanIds: candidatePlans.map((plan) => plan.planId),
    blockedPlanIds: blockedPlans.map((plan) => plan.planId),
    requiredCapabilities: Array.from(capabilities).sort(),
    ownerActionNeeded: [ownerAction],
    dependencies: ['Phase 52A shared agent architecture', 'Phase 52B tool capability registry', 'Phase 52C multi-agent dry-run evidence', 'Phase 51D Supabase milestone sync'],
    evidenceRefs: [`52D:${input.runId}`, '52C:phase52c-20260605T134904'],
    prohibitedActions: commonProhibited,
    supabaseMilestoneRefs: [`52D:${input.runId}`],
    nextRecommendedPhaseOrPromptOwner: nextOwner,
  }
}
