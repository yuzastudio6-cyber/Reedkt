import type { ID, ISODateString } from '../shared'
import type {
  MotionStudioActiveModuleId,
  MotionStudioModuleCatalogVersion,
  MotionStudioStage,
  MotionStudioStageProfileId,
  MotionStudioStatus,
} from './production'
import type { MotionStudioStorytellingWorkspaceLocation } from './storytelling-workflow'
import type { MOTION_STUDIO_STORYTELLING_WORKFLOW_ID } from './storytelling-workflow'

/**
 * Preparatory v1 lifecycle projection retained for evidence compatibility.
 * Its legacy category/chat-route fields are not route-selection authority.
 * New mounts must consume storytelling-workflow.ts, which requires an explicit
 * canonical MotionStudioProduction binding and a dedicated workspace route.
 */

export const STORYTELLING_PROJECT_SUMMARY_VERSION =
  'motion-studio.storytelling-project-summary.v1' as const
export const STORYTELLING_LIBRARY_PAGE_VERSION =
  'motion-studio.storytelling-library-page.v1' as const
export const STORYTELLING_CREATE_REQUEST_VERSION =
  'motion-studio.storytelling-create-request.v1' as const
export const STORYTELLING_CREATE_RECEIPT_VERSION =
  'motion-studio.storytelling-create-receipt.v1' as const
export const STORYTELLING_RESOLVE_RECEIPT_VERSION =
  'motion-studio.storytelling-resolve-receipt.v1' as const
export const STORYTELLING_CHAT_BOOTSTRAP_VERSION =
  'motion-studio.storytelling-chat-bootstrap.v1' as const
export const STORYTELLING_LIBRARY_CURSOR_VERSION =
  'motion-studio.storytelling-library-cursor.v1' as const

export const STORYTELLING_LIBRARY_ROUTE = '/motion-studio/storytelling' as const
export const STORYTELLING_NAMED_EDIT_NAME = 'Storytelling' as const
/** Ordinary edit-planning context only; never Motion Studio route authority. */
export const STORYTELLING_EDIT_CATEGORY = 'storytelling' as const

export type StorytellingProjectNextActionKind =
  | 'continue_in_chat'
  | 'resume_in_chat'
  | 'review_in_chat'
  | 'resolve_issue_in_chat'
  | 'open_read_only'

export type StorytellingProjectNextActionLabel =
  | 'Continue in Chat'
  | 'Resume in Chat'
  | 'Review in Chat'
  | 'Resolve issue in Chat'
  | 'Open read-only'

export interface StorytellingProjectNextAction {
  kind: StorytellingProjectNextActionKind
  label: StorytellingProjectNextActionLabel
  chatRoute: string
}

export type StorytellingAttentionCategory =
  | 'needs_input'
  | 'review_required'
  | 'resumable'
  | 'blocked'
  | 'retry_available'
  | 'archived_read_only'

export type StorytellingAttentionCode =
  | 'story_direction_required'
  | 'plan_review_required'
  | 'private_review_required'
  | 'production_resumable'
  | 'production_blocked'
  | 'retry_available'
  | 'archived_read_only'

export interface StorytellingAttentionSummary {
  category: StorytellingAttentionCategory
  code: StorytellingAttentionCode
  label: string
}

export type StorytellingLibraryResourceState =
  | 'loading'
  | 'empty'
  | 'ready'
  | 'needs_input'
  | 'review_required'
  | 'resumable'
  | 'blocked'
  | 'retry_available'
  | 'stale'
  | 'unavailable'
  | 'access_denied'
  | 'not_found'
  | 'archived_read_only'

export interface StorytellingProjectSummary {
  schemaVersion: typeof STORYTELLING_PROJECT_SUMMARY_VERSION
  productionId: ID
  projectId: ID
  editSessionId: ID
  title: string
  status: MotionStudioStatus
  currentStage: MotionStudioStage
  lastActivityAt: ISODateString
  nextAction: StorytellingProjectNextAction
  attention?: StorytellingAttentionSummary
  moduleId: MotionStudioActiveModuleId
  moduleCatalogVersion: MotionStudioModuleCatalogVersion
  stageProfileId: MotionStudioStageProfileId
  recordVersion: number
  readOnly: boolean
}

export interface StorytellingLibraryPage {
  schemaVersion: typeof STORYTELLING_LIBRARY_PAGE_VERSION
  items: readonly StorytellingProjectSummary[]
  hasMore: boolean
  nextCursor?: string
}

export interface CreateStorytellingProjectRequest {
  schemaVersion: typeof STORYTELLING_CREATE_REQUEST_VERSION
  title: string
}

export type StorytellingUnconfirmedSetupState = {
  outputFrame: 'unconfirmed'
  targetPlatform: 'unconfirmed'
  sourceMaterial: 'not_attached_optional_during_director_intake'
  sourceCleanupPolicy: 'unconfirmed'
  editLevel: 'unconfirmed'
  voice: 'unconfirmed'
  plan: 'not_created'
  approval: 'not_requested'
  generation: 'not_started'
}

export interface StorytellingChatBootstrap {
  schemaVersion: typeof STORYTELLING_CHAT_BOOTSTRAP_VERSION
  projectId: ID
  editSessionId: ID
  productionId: ID
  projectTitle: string
  editName: typeof STORYTELLING_NAMED_EDIT_NAME
  editCategory: typeof STORYTELLING_EDIT_CATEGORY
  projectCreatedAt: ISODateString
  editCreatedAt: ISODateString
  productionCreatedAt: ISODateString
  updatedAt: ISODateString
  setup: StorytellingUnconfirmedSetupState
  moduleId: MotionStudioActiveModuleId
  moduleCatalogVersion: MotionStudioModuleCatalogVersion
  stageProfileId: MotionStudioStageProfileId
  productionRecordVersion: number
  libraryRoute: typeof STORYTELLING_LIBRARY_ROUTE
  chatRoute: string
  directorIntakeReady: true
  browserCacheAuthoritative: false
  backendSynchronizationAllowedFromBootstrap: false
  expensiveWorkStarted: false
}

export interface CreateStorytellingProjectReceipt {
  schemaVersion: typeof STORYTELLING_CREATE_RECEIPT_VERSION
  result: 'created' | 'replayed'
  summary: StorytellingProjectSummary
  bootstrap: StorytellingChatBootstrap
}

/**
 * Forward-only lifecycle projection for the owner-approved dedicated Director
 * workspace. V1 remains readable as historical contract evidence, but new
 * Storytelling create/list/resolve/bootstrap APIs must return this V2 family.
 */
export const STORYTELLING_PROJECT_SUMMARY_V2_VERSION =
  'motion-studio.storytelling-project-summary.v2' as const
export const STORYTELLING_LIBRARY_PAGE_V2_VERSION =
  'motion-studio.storytelling-library-page.v2' as const
export const STORYTELLING_DIRECTOR_BOOTSTRAP_VERSION =
  'motion-studio.storytelling-director-bootstrap.v2' as const
export const STORYTELLING_CREATE_RECEIPT_V2_VERSION =
  'motion-studio.storytelling-create-receipt.v2' as const
export const STORYTELLING_RESOLVE_RECEIPT_V2_VERSION =
  'motion-studio.storytelling-resolve-receipt.v2' as const

export type StorytellingDirectorNextActionKind =
  | 'continue_in_director'
  | 'resume_in_director'
  | 'review_in_director'
  | 'resolve_issue_in_director'
  | 'open_read_only'

export type StorytellingDirectorNextActionLabel =
  | 'Continue'
  | 'Resume'
  | 'Review'
  | 'Resolve issue'
  | 'Open read-only'

export interface StorytellingDirectorNextAction {
  kind: StorytellingDirectorNextActionKind
  label: StorytellingDirectorNextActionLabel
}

export interface StorytellingProjectSummaryV2 {
  schemaVersion: typeof STORYTELLING_PROJECT_SUMMARY_V2_VERSION
  productionId: ID
  projectId: ID
  editSessionId: ID
  title: string
  status: MotionStudioStatus
  currentStage: MotionStudioStage
  lastActivityAt: ISODateString
  nextAction: StorytellingDirectorNextAction
  attention?: StorytellingAttentionSummary
  moduleId: MotionStudioActiveModuleId
  moduleCatalogVersion: MotionStudioModuleCatalogVersion
  stageProfileId: MotionStudioStageProfileId
  recordVersion: number
  readOnly: boolean
  productWorkflow: typeof MOTION_STUDIO_STORYTELLING_WORKFLOW_ID
  workspaceLocation: MotionStudioStorytellingWorkspaceLocation
}

export interface StorytellingLibraryPageV2 {
  schemaVersion: typeof STORYTELLING_LIBRARY_PAGE_V2_VERSION
  items: readonly StorytellingProjectSummaryV2[]
  hasMore: boolean
  nextCursor?: string
}

export interface StorytellingDirectorBootstrap {
  schemaVersion: typeof STORYTELLING_DIRECTOR_BOOTSTRAP_VERSION
  projectId: ID
  editSessionId: ID
  productionId: ID
  projectTitle: string
  editName: typeof STORYTELLING_NAMED_EDIT_NAME
  editingCategory: typeof STORYTELLING_EDIT_CATEGORY
  editingCategoryDeterminesWorkflow: false
  productWorkflow: typeof MOTION_STUDIO_STORYTELLING_WORKFLOW_ID
  projectCreatedAt: ISODateString
  editCreatedAt: ISODateString
  productionCreatedAt: ISODateString
  updatedAt: ISODateString
  setup: StorytellingUnconfirmedSetupState
  moduleId: MotionStudioActiveModuleId
  moduleCatalogVersion: MotionStudioModuleCatalogVersion
  stageProfileId: MotionStudioStageProfileId
  productionRecordVersion: number
  workspaceLocation: MotionStudioStorytellingWorkspaceLocation
  directorIntakeReady: true
  browserCacheAuthoritative: false
  backendSynchronizationAllowedFromBootstrap: false
  expensiveWorkStarted: false
}

export interface CreateStorytellingProjectReceiptV2 {
  schemaVersion: typeof STORYTELLING_CREATE_RECEIPT_V2_VERSION
  result: 'created' | 'replayed'
  summary: StorytellingProjectSummaryV2
  bootstrap: StorytellingDirectorBootstrap
}

export interface ResolveStorytellingProjectReceiptV2 {
  schemaVersion: typeof STORYTELLING_RESOLVE_RECEIPT_V2_VERSION
  resolution: 'current' | 'archived_read_only'
  summary: StorytellingProjectSummaryV2
  bootstrap: StorytellingDirectorBootstrap
}

export interface ResolveStorytellingProjectReceipt {
  schemaVersion: typeof STORYTELLING_RESOLVE_RECEIPT_VERSION
  resolution: 'current' | 'archived_read_only'
  summary: StorytellingProjectSummary
  bootstrap: StorytellingChatBootstrap
}
