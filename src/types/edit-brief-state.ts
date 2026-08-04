import type { EditBrief } from './edit-brief'
import type {
  AssetUsageRole,
  ID,
  PriorityLevel,
} from './workflow-common'

export type EditBriefOperationType =
  | 'create_brief'
  | 'update_goal'
  | 'update_audience'
  | 'update_platforms'
  | 'update_target_duration'
  | 'update_style_keywords'
  | 'update_pacing'
  | 'update_caption_preference'
  | 'update_music_preference'
  | 'update_broll_preference'
  | 'add_must_use_asset'
  | 'remove_must_use_asset'
  | 'add_avoid_asset'
  | 'remove_avoid_asset'
  | 'add_must_include_note'
  | 'remove_must_include_note'
  | 'add_avoid_note'
  | 'remove_avoid_note'
  | 'update_brand_notes'
  | 'update_special_instructions'
  | 'update_reference_urls'
  | 'reset_brief'
  | 'mark_ready'

export type EditBriefOperationStatus =
  | 'pending'
  | 'applied'
  | 'reverted'

export interface EditBriefOperation {
  id: ID
  projectId: ID
  workspaceId?: ID
  userId?: ID
  editBriefId: ID
  type: EditBriefOperationType
  status: EditBriefOperationStatus
  createdBy: 'user' | 'ai' | 'system'
  createdAt: string
  patch?: Record<string, unknown>
  explanation?: string
}

export interface EditBriefState {
  projectId: ID
  workspaceId?: ID
  userId?: ID
  editBrief: EditBrief
  operations: EditBriefOperation[]
  updatedAt: string
}

export interface EditBriefReadinessCheck {
  ready: boolean
  warnings: string[]
  missingRecommendedFields: string[]
}

export interface EditBriefAssetOption {
  mediaAssetId: ID
  sourceLibraryAssetId?: ID
  label: string
  role: AssetUsageRole
  priority: PriorityLevel
  disabled?: boolean
  reason?: string
}
