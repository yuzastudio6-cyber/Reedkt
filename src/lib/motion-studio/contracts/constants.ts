import type {
  MotionStudioArtifactKind,
  MotionStudioModuleDefinition,
  MotionStudioModuleId,
  MotionStudioStage,
  MotionStudioWorkspaceGroup,
  ProductionMode,
} from '../../../types/motion-studio'

export const MOTION_STUDIO_ROUTE_TEMPLATE =
  '/projects/:projectId/edits/:editSessionId/motion-studio' as const

export const MOTION_STUDIO_MODULE_CATALOG_VERSION = 'motion-studio-module-catalog-v1' as const
export const MOTION_STUDIO_STORYTELLING_STAGE_PROFILE_ID =
  'motion-studio-storytelling-stage-profile-v1' as const

export const MOTION_STUDIO_MODULE_CATALOG = [
  {
    id: 'storytelling',
    label: 'Storytelling',
    description: 'Turn an idea, research, script, or prepared package into a professional scene-based motion story.',
    availability: 'available',
    stageProfileId: MOTION_STUDIO_STORYTELLING_STAGE_PROFILE_ID,
    primaryActionLabel: 'Start Storytelling',
  },
  {
    id: 'logo_animation',
    label: 'Logo Animation',
    description: 'Create controlled logo reveals, loops, and brand-safe motion treatments.',
    availability: 'planned',
  },
  {
    id: 'intro_animation',
    label: 'Intro & Outro',
    description: 'Build branded openings and endings with exact timing and reusable motion.',
    availability: 'planned',
  },
] as const satisfies readonly MotionStudioModuleDefinition[]

export const MOTION_STUDIO_MODULE_IDS = MOTION_STUDIO_MODULE_CATALOG.map(({ id }) => id) as readonly MotionStudioModuleId[]
export const MOTION_STUDIO_ACTIVE_MODULE_IDS = ['storytelling'] as const

export const MOTION_STUDIO_PRODUCTION_MODES = [
  'generative_first',
  'layered_first',
  'native_graphics_first',
  'footage_first',
  'hybrid_directed',
] as const satisfies readonly ProductionMode[]

export const MOTION_STUDIO_DEFAULT_PRODUCTION_MODE = 'hybrid_directed' as const
export const MOTION_STUDIO_DEFAULT_STRATEGY_LABEL = "Director's Hybrid" as const

export const MOTION_STUDIO_STORYTELLING_STAGE_ORDER = [
  'director_brief',
  'story_understanding',
  'research',
  'story_script',
  'references',
  'motion_dna',
  'voice',
  'calibration_reel',
  'scene_board',
  'storyboard',
  'animatic',
  'scene_editor',
  'picture_lock',
  'sound_music',
  'fine_cut',
  'quality_control',
  'delivery',
] as const satisfies readonly MotionStudioStage[]

/** Compatibility alias. The only active stage profile is Storytelling v1. */
export const MOTION_STUDIO_STAGE_ORDER = MOTION_STUDIO_STORYTELLING_STAGE_ORDER

export const MOTION_STUDIO_STAGE_GROUPS: Record<MotionStudioStage, MotionStudioWorkspaceGroup> = {
  director_brief: 'plan',
  story_understanding: 'plan',
  research: 'plan',
  story_script: 'plan',
  references: 'design',
  motion_dna: 'design',
  voice: 'design',
  calibration_reel: 'design',
  scene_board: 'produce',
  storyboard: 'produce',
  animatic: 'produce',
  scene_editor: 'produce',
  picture_lock: 'produce',
  sound_music: 'review',
  fine_cut: 'review',
  quality_control: 'review',
  delivery: 'deliver',
}

export const MOTION_STUDIO_ARTIFACT_KINDS = [
  'production_brief',
  'story_bible',
  'prepared_script',
  'research_pack',
  'claim_ledger',
  'visual_coverage_plan',
  'reference_contract',
  'motion_dna',
  'motion_language',
  'narrative_function',
  'motion_strategy',
  'voice_bible',
  'music_bible',
  'cue_sheet',
  'scene_graph',
  'scene_recipe',
  'layer_plan',
  'scene_document',
  'sound_event_plan',
  'storyboard',
  'animatic',
  'fine_cut',
  'quality_report',
  'export_manifest',
] as const satisfies readonly MotionStudioArtifactKind[]

export const MOTION_STUDIO_CANONICAL_RESOURCE_STATES = [
  'first_use',
  'empty',
  'loading',
  'partial_result',
  'success',
  'review_needed',
  'blocked',
  'stale',
  'version_conflict',
  'failure',
  'permission_denied',
  'recovery',
] as const
