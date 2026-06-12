import type {
  ToolRouteFamilyId,
  ToolRouteFamilyMap,
  ToolStudyPrerequisite,
  ToolStudyPrerequisiteMap,
} from './tool-route-audit-types'

const PREREQUISITES: Array<{
  owner: string
  routeFamilyIds: ToolRouteFamilyId[]
  promptPath?: string
}> = [
  {
    owner: 'WEB_SEARCH_CAPTURE',
    routeFamilyIds: ['web_search_capture'],
    promptPath: 'docs/implementation-prompts/prompt-tool-study-0-web-search-capture.md',
  },
  {
    owner: 'MAP_GEOSPATIAL',
    routeFamilyIds: ['map_geospatial'],
    promptPath: 'docs/implementation-prompts/prompt-tool-study-0-map-geospatial.md',
  },
  {
    owner: 'AI_TOOLS_CREATIVE_GRAPHICS',
    routeFamilyIds: ['ai_tools_creative_graphics'],
    promptPath: 'docs/implementation-prompts/prompt-tool-study-0-ai-tools-creative-graphics.md',
  },
  {
    owner: 'TRACK_A_RENDER_EXPORT',
    routeFamilyIds: ['track_a_render_export'],
    promptPath: 'docs/implementation-prompts/prompt-tool-study-0-track-a-render-export.md',
  },
  {
    owner: 'TRACK_B_MEDIA_PROCESSING',
    routeFamilyIds: ['track_b_media_audio_model'],
    promptPath: 'docs/implementation-prompts/prompt-tool-study-0-track-b-media-processing.md',
  },
  {
    owner: 'SOUND_MUSIC_AUDIO',
    routeFamilyIds: ['sound_music_audio'],
    promptPath: 'docs/implementation-prompts/prompt-tool-study-0-sound-music-audio.md',
  },
  {
    owner: 'PROVIDER_GATEWAY_MODELS',
    routeFamilyIds: ['provider_model_planning'],
  },
  {
    owner: 'WORKER_RUNTIME_JOBS',
    routeFamilyIds: ['worker_runtime_jobs'],
  },
  {
    owner: 'SUPABASE_RLS_STORAGE_DATABASE',
    routeFamilyIds: ['supabase_metadata_storage'],
  },
]

export function buildToolStudyPrerequisiteMap(familyMap: ToolRouteFamilyMap): ToolStudyPrerequisiteMap {
  const activeBlockers = [...familyMap.activeBlockers]
  const families = new Set(familyMap.families.map((family) => family.familyId))
  const prerequisites: ToolStudyPrerequisite[] = PREREQUISITES.map((item) => {
    for (const familyId of item.routeFamilyIds) {
      if (!families.has(familyId)) activeBlockers.push(`missing_prerequisite_route_family:${familyId}`)
    }
    return {
      owner: item.owner,
      routeFamilyIds: item.routeFamilyIds,
      status: item.promptPath ? 'prompt_created_for_tool_study_0' : 'prerequisite_recorded_no_file_requested',
      promptPath: item.promptPath,
      executionAllowedBeforeToolStudy: false,
      requiredBeforeExecution: true,
    }
  })
  const missingToolStudyCount = prerequisites.filter((item) => item.status !== 'prompt_created_for_tool_study_0').length

  return {
    phase: 'TOOL_ROUTE_0',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    prerequisites,
    missingToolStudyCount,
    promptCreatedCount: prerequisites.filter((item) => item.status === 'prompt_created_for_tool_study_0').length,
    activeBlockers,
  }
}
