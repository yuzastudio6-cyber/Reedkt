import type { ID, ProjectScopedRecord, TimeRange } from './workflow-common'

export type CleanupPlanItemAction =
  | 'remove'
  | 'tighten'
  | 'keep'
  | 'keep_best_take'
  | 'mark_important'
  | 'mark_do_not_use'
  | 'review'
  | 'preserve'

export type CleanupPlanItemReason =
  | 'silence'
  | 'false_start'
  | 'retake'
  | 'repetition'
  | 'camera_setup'
  | 'bad_audio'
  | 'bad_visual'
  | 'strong_take'
  | 'important_context'
  | 'hook_candidate'
  | 'cta_candidate'
  | 'user_instruction'
  | 'other'

export type CleanAssemblySegmentKind =
  | 'kept_source'
  | 'tightened_source'
  | 'best_take'
  | 'bridge'
  | 'placeholder'
  | 'user_restored'

export type CleanupReviewDecision =
  | 'accepted'
  | 'restored'
  | 'removed_more'
  | 'marked_important'
  | 'marked_do_not_use'
  | 'needs_review'

export interface CleanupPlan extends ProjectScopedRecord {
  footagePrepSessionId: ID
  sourceUnderstandingMapId: ID
  status: 'draft' | 'ready' | 'accepted' | 'revised' | 'failed'
  itemIds: ID[]
  summary: string
  estimatedOriginalDurationMs: number
  estimatedCleanDurationMs: number
  createdFromModel?: string
}

export interface CleanupPlanItem extends ProjectScopedRecord {
  cleanupPlanId: ID
  mediaAssetId: ID
  sourceRange: TimeRange
  action: CleanupPlanItemAction
  reason: CleanupPlanItemReason
  label?: string
  explanation: string
  confidence?: number
  userDecision?: CleanupReviewDecision
  userNote?: string
}

export interface CleanAssembly extends ProjectScopedRecord {
  footagePrepSessionId: ID
  cleanupPlanId: ID
  status: 'draft' | 'ready' | 'accepted' | 'superseded' | 'failed'
  durationMs: number
  segmentIds: ID[]
  sourceTimeMappingIds: ID[]
  transcriptSegmentIds?: ID[]
  summary: string
  version: number
}

export interface CleanAssemblySegment extends ProjectScopedRecord {
  cleanAssemblyId: ID
  mediaAssetId: ID
  kind: CleanAssemblySegmentKind
  rawSourceRange: TimeRange
  cleanAssemblyRange: TimeRange
  label?: string
  transcriptText?: string
  sourceTimeMappingId?: ID
  cleanupPlanItemIds?: ID[]
  locked?: boolean
  userRestored?: boolean
}

export interface CleanupReviewCard extends ProjectScopedRecord {
  cleanupPlanId: ID
  cleanAssemblyId?: ID
  title: string
  summary: string
  originalDurationMs: number
  cleanDurationMs?: number
  removedSilenceCount: number
  retakeGroupCount: number
  falseStartCount: number
  preservedMomentCount: number
  actions: Array<
    | 'continue_with_ai_plan'
    | 'add_edit_brief'
    | 'add_edit_cues'
    | 'review_cleanup_decisions'
  >
}
