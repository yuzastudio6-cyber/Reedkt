import type {
  EditCue,
  EditCueAnchorType,
} from './edit-cue'
import type {
  AssetUsageRole,
  ID,
  PriorityLevel,
  TimeRange,
} from './workflow-common'

export type EditCueOperationType =
  | 'create_cue'
  | 'update_title'
  | 'update_anchor'
  | 'update_role'
  | 'add_asset'
  | 'remove_asset'
  | 'update_priority'
  | 'update_timing_flexibility'
  | 'update_audio_behavior'
  | 'update_visual_behavior'
  | 'update_instructions'
  | 'add_tag'
  | 'remove_tag'
  | 'mark_ready'
  | 'duplicate_cue'
  | 'delete_cue'
  | 'reset_all'

export type EditCueOperationStatus =
  | 'pending'
  | 'applied'
  | 'reverted'

export type EditCueLocalStatus =
  | 'draft'
  | 'ready'
  | 'warning'
  | 'conflict'
  | 'deleted'

export interface EditCueOperation {
  id: ID
  projectId: ID
  workspaceId?: ID
  userId?: ID
  editCueId?: ID
  type: EditCueOperationType
  status: EditCueOperationStatus
  createdBy: 'user' | 'ai' | 'system'
  createdAt: string
  patch?: Record<string, unknown>
  explanation?: string
}

export interface EditCueValidationIssue {
  id: ID
  editCueId: ID
  severity: 'info' | 'warning' | 'blocking'
  type:
    | 'missing_title'
    | 'missing_anchor'
    | 'missing_instruction'
    | 'missing_asset'
    | 'asset_marked_do_not_use'
    | 'time_range_invalid'
    | 'time_range_outside_clean_assembly'
    | 'ambiguous_role'
    | 'global_cue_without_instruction'
    | 'other'
  message: string
  suggestedFix?: string
}

export interface EditCuesState {
  projectId: ID
  workspaceId?: ID
  userId?: ID
  cleanAssemblyId?: ID
  editBriefId?: ID
  cues: EditCue[]
  operations: EditCueOperation[]
  validationIssues: EditCueValidationIssue[]
  updatedAt: string
}

export interface EditCuesSummary {
  totalCues: number
  readyCues: number
  draftCues: number
  warningCues: number
  blockingIssueCount: number
  mustFollowCues: number
  bRollCues: number
  overlayCues: number
  audioCues: number
  globalCues: number
  avoidCues: number
}

export interface EditCueAnchorOption {
  id: ID
  type: EditCueAnchorType
  label: string
  description?: string
  timeRange?: TimeRange
  transcriptText?: string
  mediaAssetId?: ID
  sceneSegmentId?: ID
}

export interface EditCueAssetOption {
  mediaAssetId: ID
  sourceLibraryAssetId?: ID
  label: string
  role: AssetUsageRole
  priority: PriorityLevel
  disabled?: boolean
  reason?: string
}
