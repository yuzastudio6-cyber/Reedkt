import type { MultiAgentIntentType } from '../multi-agent-dry-run'
import type { ToolCapabilityTrack } from '../tool-capability-registry-audit'
import type { AgentToolPlanOwnerRoute } from './agent-tool-plan-bridge-types'

export interface AgentToolPlanRoute {
  intentType: MultiAgentIntentType
  ownerRoute: AgentToolPlanOwnerRoute
  track: ToolCapabilityTrack | 'worker_runtime'
  ownerType: 'this_chat' | 'track_a' | 'track_b' | 'ai_tools' | 'worker_runtime'
  requiredToolIds: string[]
  requiredCapabilities: string[]
  inputArtifactScope: string[]
  outputArtifactScope: string[]
  handoffRequired: boolean
  sourceOfTruthPolicy: string[]
  ownerActionNeeded: string
}

const manifestTruth = [
  'private gs:// manifests and structured source records are the source of truth',
  'screenshots and previews are QA/review artifacts only',
  'signed URLs cannot be source of truth',
  'workers may execute only later approved snapshots with rawPromptExecution=false',
]

const routeMap: Record<MultiAgentIntentType, AgentToolPlanRoute> = {
  conservative_color_adjustment: route('conservative_color_adjustment', 'TRACK_A_RENDER_EXPORT', 'track_a_visual_video', 'track_a', ['opencolorio', 'openimageio', 'kornia'], 'Track A must validate color-processing runtime before any execution.'),
  caption_burnin_preview: route('caption_burnin_preview', 'TRACK_A_RENDER_EXPORT', 'track_a_visual_video', 'track_a', ['ffmpeg', 'libass'], 'Track A must own caption burn-in render/export validation.'),
  text_behind_subject_preview: route('text_behind_subject_preview', 'TRACK_A_RENDER_EXPORT', 'track_a_visual_video', 'track_a', ['sam2', 'birefnet'], 'Track A must own mask/compositor execution and safer-layout fallback.'),
  slow_motion_segment: route('slow_motion_segment', 'TRACK_A_RENDER_EXPORT', 'track_a_visual_video', 'track_a', ['film', 'ffprobe'], 'Track A must own frame interpolation runtime and QA.'),
  web_research_planning_context: route('web_research_planning_context', 'WEB_SEARCH_CAPTURE', 'web_search', 'this_chat', ['web_search_internal_beta_candidate', 'web_search_provider_router'], 'Web search remains internal planning evidence only until a later runtime phase.'),
  route_map_overlay: route('route_map_overlay', 'MAP_GEOSPATIAL', 'map_geospatial', 'this_chat', ['turf_geojson_calculations', 'maplibre_local_render', 'deckgl_local_overlay'], 'Map/geospatial must preserve generated/local GeoJSON, Turf/style/camera/render manifests as source of truth.'),
  location_context_card: route('location_context_card', 'MAP_GEOSPATIAL', 'map_geospatial', 'this_chat', ['web_search_map_planning_e2e', 'map_geospatial_internal_readiness'], 'Location cards must remain generated/local and avoid live geocoding/routing/tile providers.'),
  motion_graphics_lower_third: route('motion_graphics_lower_third', 'AI_TOOLS_CREATIVE_GRAPHICS', 'ai_tools', 'ai_tools', ['remotion_graphics', 'ai_tools_motion_design'], 'AI Tools owns creative graphics/motion runtime; Phase 52D emits handoff only.'),
  noise_cleanup: route('noise_cleanup', 'TRACK_B_MEDIA_PROCESSING', 'track_b', 'track_b', ['deepfilternet'], 'Track B owns audio cleanup runtime; DeepFilterNet remains implemented-but-blocked.'),
  qwen_vlm_visual_understanding_request: route('qwen_vlm_visual_understanding_request', 'TRACK_B_MEDIA_PROCESSING', 'track_b', 'track_b', ['qwen3_vl', 'vllm_runtime'], 'Track B VLM remains excluded after Phase 39C L4/vLLM CUDA OOM.'),
  demucs_stem_separation_request: route('demucs_stem_separation_request', 'TRACK_B_MEDIA_PROCESSING', 'track_b', 'track_b', ['demucs'], 'Demucs remains blocked pending model provenance and runtime QA.'),
}

export function routeForIntent(intentType: MultiAgentIntentType): AgentToolPlanRoute {
  return routeMap[intentType]
}

function route(
  intentType: MultiAgentIntentType,
  ownerRoute: AgentToolPlanOwnerRoute,
  track: AgentToolPlanRoute['track'],
  ownerType: AgentToolPlanRoute['ownerType'],
  requiredToolIds: string[],
  ownerActionNeeded: string,
): AgentToolPlanRoute {
  return {
    intentType,
    ownerRoute,
    track,
    ownerType,
    requiredToolIds,
    requiredCapabilities: requiredToolIds,
    inputArtifactScope: ['existing Phase 52C findings', 'existing Phase 52B capability registry records', 'private gs:// evidence references only'],
    outputArtifactScope: ['candidate approved-plan snapshot JSON', 'handoff packet JSON', 'Phase 52D bridge manifest JSON'],
    handoffRequired: ownerType !== 'this_chat',
    sourceOfTruthPolicy: manifestTruth,
    ownerActionNeeded,
  }
}
