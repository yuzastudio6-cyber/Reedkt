import type {
  CleanAssembly,
  CleanAssemblySegment,
  CleanupReviewDecision,
} from './clean-assembly'
import type { ID, SourceTimeMapping } from './workflow-common'

export type CleanupReviewOperationType =
  | 'accept_cleanup'
  | 'accept_item'
  | 'restore_item'
  | 'mark_item_important'
  | 'mark_item_do_not_use'
  | 'reset_item'
  | 'reset_all'

export type CleanupReviewOperationStatus =
  | 'pending'
  | 'applied'
  | 'reverted'

export interface CleanupReviewOperation {
  id: ID
  projectId: ID
  workspaceId?: ID
  userId?: ID
  cleanupPlanId: ID
  cleanAssemblyId: ID
  cleanupPlanItemId?: ID
  type: CleanupReviewOperationType
  status: CleanupReviewOperationStatus
  createdBy: 'user' | 'ai' | 'system'
  createdAt: string
  explanation?: string
}

export interface CleanupReviewItemState {
  cleanupPlanItemId: ID
  decision: CleanupReviewDecision
  operationIds: ID[]
  userNote?: string
}

export interface CleanupReviewState {
  projectId: ID
  workspaceId?: ID
  userId?: ID
  cleanupPlanId: ID
  originalCleanAssemblyId: ID
  currentCleanAssemblyId: ID
  accepted: boolean
  itemStates: CleanupReviewItemState[]
  operations: CleanupReviewOperation[]
  updatedCleanAssembly: CleanAssembly
  updatedCleanAssemblySegments: CleanAssemblySegment[]
  updatedSourceTimeMappings: SourceTimeMapping[]
  updatedAt: string
}
