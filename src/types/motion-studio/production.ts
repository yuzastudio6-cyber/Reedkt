import type { ID, ISODateString } from '../shared'
import type { MotionStudioOwnership, MotionStudioVersionReference } from './shared'

export type ProductionMode =
  | 'generative_first'
  | 'layered_first'
  | 'native_graphics_first'
  | 'footage_first'
  | 'hybrid_directed'

/** Parent Motion Studio creation modules. Only Storytelling is active in catalog v1. */
export type MotionStudioModuleId = 'storytelling' | 'logo_animation' | 'intro_animation'

export type MotionStudioActiveModuleId = Extract<MotionStudioModuleId, 'storytelling'>

export type MotionStudioModuleCatalogVersion = 'motion-studio-module-catalog-v1'

export type MotionStudioStageProfileId = 'motion-studio-storytelling-stage-profile-v1'

export type MotionStudioModuleAvailability = 'available' | 'planned'

export interface MotionStudioModuleDefinition {
  id: MotionStudioModuleId
  label: string
  description: string
  availability: MotionStudioModuleAvailability
  stageProfileId?: MotionStudioStageProfileId
  primaryActionLabel?: string
}

export type MotionStudioWorkspaceMode = 'guided' | 'studio'

export type MotionStudioWorkspaceGroup = 'plan' | 'design' | 'produce' | 'review' | 'deliver'

export type MotionStudioStage =
  | 'director_brief'
  | 'story_understanding'
  | 'research'
  | 'story_script'
  | 'references'
  | 'motion_dna'
  | 'voice'
  | 'calibration_reel'
  | 'scene_board'
  | 'storyboard'
  | 'animatic'
  | 'scene_editor'
  | 'picture_lock'
  | 'sound_music'
  | 'fine_cut'
  | 'quality_control'
  | 'delivery'

export type MotionStudioStatus =
  | 'draft'
  | 'planning'
  | 'awaiting_review'
  | 'approved_for_execution'
  | 'producing'
  | 'blocked'
  | 'reviewing'
  | 'delivery_ready'
  | 'completed'
  | 'archived'

export interface MotionStudioProduction extends MotionStudioOwnership {
  id: ID
  moduleId: MotionStudioActiveModuleId
  moduleCatalogVersion: MotionStudioModuleCatalogVersion
  stageProfileId: MotionStudioStageProfileId
  status: MotionStudioStatus
  currentStage: MotionStudioStage
  workspaceMode: MotionStudioWorkspaceMode
  defaultProductionMode: ProductionMode
  userFacingStrategy: "Director's Hybrid"
  currentArtifactVersionReferences: MotionStudioVersionReference[]
  recordVersion: number
  createdAt: ISODateString
  updatedAt: ISODateString
  runtimeImplemented: false
}

export interface MotionStudioStageState extends MotionStudioOwnership {
  productionId: ID
  stage: MotionStudioStage
  group: MotionStudioWorkspaceGroup
  status: 'not_started' | 'active' | 'awaiting_review' | 'approved' | 'stale' | 'blocked' | 'completed'
  currentArtifactVersionIds: ID[]
  blockingReasonIds: ID[]
  updatedAt: ISODateString
}
