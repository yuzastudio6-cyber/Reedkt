import type { ID } from '../shared'
import type {
  MotionStudioActiveModuleId,
  MotionStudioModuleCatalogVersion,
  MotionStudioStageProfileId,
} from './production'

export const MOTION_STUDIO_STORYTELLING_WORKFLOW_ID =
  'motion_studio.storytelling' as const
export const MOTION_STUDIO_STORYTELLING_WORKFLOW_BINDING_VERSION =
  'motion-studio-storytelling-workflow-binding-v1' as const
export const MOTION_STUDIO_STORYTELLING_WORKSPACE_LOCATION_VERSION =
  'motion-studio-storytelling-workspace-location-v1' as const
export const MOTION_STUDIO_STORYTELLING_LIBRARY_ROUTE =
  '/motion-studio/storytelling' as const
export const MOTION_STUDIO_STORYTELLING_WORKSPACE_ROUTE_TEMPLATE =
  '/motion-studio/storytelling/projects/:projectId/edits/:editSessionId' as const
export const MOTION_STUDIO_STORYTELLING_WORKSPACE_KIND =
  'motion_studio_storytelling_workspace' as const
export const MOTION_STUDIO_STORYTELLING_CHAT_EXPERIENCE =
  'motion_studio_storytelling_director_chat' as const

/**
 * Browser-safe proof that one exact Project + Named Edit is bound to a real
 * Motion Studio Storytelling production. An ordinary video-edit category is
 * deliberately absent: category never grants Motion Studio workflow access.
 */
export interface MotionStudioStorytellingWorkflowBinding {
  schemaVersion: typeof MOTION_STUDIO_STORYTELLING_WORKFLOW_BINDING_VERSION
  workflowId: typeof MOTION_STUDIO_STORYTELLING_WORKFLOW_ID
  productionId: ID
  projectId: ID
  editSessionId: ID
  moduleId: MotionStudioActiveModuleId
  moduleCatalogVersion: MotionStudioModuleCatalogVersion
  stageProfileId: MotionStudioStageProfileId
  bindingRecordVersion: number
  bindingDigest: string
  sourceAuthority: 'canonical_motion_studio_production'
  sourceReverified: true
  editingCategoryDeterminesWorkflow: false
}

/**
 * Exact location receipt for the dedicated Storytelling workspace. It shares
 * Project/Edit identity and backend authorities with ReEditPro while keeping
 * its Director Chat experience distinct from the ordinary Edit Chat route.
 */
export interface MotionStudioStorytellingWorkspaceLocation {
  schemaVersion: typeof MOTION_STUDIO_STORYTELLING_WORKSPACE_LOCATION_VERSION
  workspaceKind: typeof MOTION_STUDIO_STORYTELLING_WORKSPACE_KIND
  chatExperience: typeof MOTION_STUDIO_STORYTELLING_CHAT_EXPERIENCE
  workflowId: typeof MOTION_STUDIO_STORYTELLING_WORKFLOW_ID
  productionId: ID
  projectId: ID
  editSessionId: ID
  libraryRoute: typeof MOTION_STUDIO_STORYTELLING_LIBRARY_ROUTE
  workspaceRoute: string
  parentProjectRoute: string
  defaultSurface: 'director_chat'
  normalEditRouteReused: false
  queryParameterCanPromoteWorkflow: false
  workflowBinding: MotionStudioStorytellingWorkflowBinding
}

export interface MotionStudioStorytellingWorkspaceRouteIdentity {
  projectId: ID
  editSessionId: ID
}
