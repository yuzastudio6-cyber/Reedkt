import type {
  EditCueAnchor,
} from './edit-cue'
import type {
  ID,
} from './workflow-common'

export type EditCueRemapStatus =
  | 'not_needed'
  | 'pending'
  | 'mapped'
  | 'partially_mapped'
  | 'removed_source'
  | 'failed'

export type EditCueConflictResolutionType =
  | 'unresolved'
  | 'use_first'
  | 'use_second'
  | 'make_optional'
  | 'change_priority'
  | 'delete_cue'
  | 'let_ai_decide'
  | 'split_timing'
  | 'manual_adjustment'
  | 'ignored'

export type EditCueConflictStatus =
  | 'open'
  | 'resolved'
  | 'ignored'

export type EditCueConflictSeverity =
  | 'info'
  | 'warning'
  | 'blocking'

export type EditCueConflictKind =
  | 'overlapping_must_follow'
  | 'asset_marked_do_not_use'
  | 'cue_points_to_removed_footage'
  | 'timing_outside_clean_assembly'
  | 'duration_too_short'
  | 'duration_too_long'
  | 'caption_collision_risk'
  | 'face_collision_risk'
  | 'audio_conflict'
  | 'missing_asset'
  | 'ambiguous_role'
  | 'duplicate_asset_usage'
  | 'global_rule_conflict'
  | 'other'

export interface EditCueRemapResult {
  editCueId: ID
  status: EditCueRemapStatus
  originalAnchor: EditCueAnchor
  remappedAnchor?: EditCueAnchor
  sourceTimeMappingId?: ID
  message: string
}

export interface EditCueConflictRecord {
  id: ID
  projectId: ID
  workspaceId?: ID
  userId?: ID
  editCueIds: ID[]
  kind: EditCueConflictKind
  severity: EditCueConflictSeverity
  status: EditCueConflictStatus
  message: string
  suggestedResolution?: string
  resolutionType: EditCueConflictResolutionType
  resolvedBy?: 'user' | 'ai' | 'system'
  resolvedAt?: string
  createdAt: string
  updatedAt: string
}

export type EditCueConflictOperationType =
  | 'resolve_conflict'
  | 'ignore_conflict'
  | 'reset_conflict'
  | 'reset_all_conflicts'
  | 'remap_cue'
  | 'remap_all_cues'

export interface EditCueConflictOperation {
  id: ID
  projectId: ID
  workspaceId?: ID
  userId?: ID
  editCueId?: ID
  conflictId?: ID
  type: EditCueConflictOperationType
  createdBy: 'user' | 'ai' | 'system'
  createdAt: string
  patch?: Record<string, unknown>
  explanation?: string
}

export interface EditCueConflictSummary {
  totalConflicts: number
  openConflicts: number
  resolvedConflicts: number
  ignoredConflicts: number
  blockingConflicts: number
  warningConflicts: number
  infoConflicts: number
  remapPendingCount: number
  remapFailedCount: number
  removedSourceCueCount: number
}

export interface EditCueConflictState {
  projectId: ID
  workspaceId?: ID
  userId?: ID
  conflicts: EditCueConflictRecord[]
  remapResults: EditCueRemapResult[]
  operations: EditCueConflictOperation[]
  summary: EditCueConflictSummary
  updatedAt: string
}
