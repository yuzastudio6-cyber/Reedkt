import type { BoundingBox, ID, ProjectScopedRecord, TimeRange } from './workflow-common'

export type EditSystemKind =
  | 'story_cuts'
  | 'captions'
  | 'text_graphics'
  | 'stroke_motion'
  | 'real_motion'
  | 'sound_sync'
  | 'voice_cleanup'
  | 'color_look'
  | 'ai_enhance'
  | 'browser_visuals'
  | 'platform_layout'
  | 'professional_integration'
  | 'b_roll'
  | 'overlays'
  | 'audio'
  | 'unknown'

export type EditScope =
  | 'single_element'
  | 'sentence'
  | 'scene'
  | 'group'
  | 'system'
  | 'whole_video'

export type EditOperationType =
  | 'set_system_visibility'
  | 'set_group_visibility'
  | 'update_group_style'
  | 'update_element'
  | 'replace_asset'
  | 'move_element'
  | 'change_scope'
  | 'regenerate_element'
  | 'lock_group'
  | 'unlock_group'
  | 'lock_element'
  | 'unlock_element'
  | 'delete_element'
  | 'restore_element'

export type EditElementSourceKind =
  | 'edit_cue'
  | 'professional_integration'
  | 'caption_plan'
  | 'cut_decision'
  | 'transition_plan'
  | 'sound_plan'
  | 'real_motion'
  | 'stroke_motion'
  | 'render_input'
  | 'manual_revision'
  | 'unknown'

export interface EditDocument extends ProjectScopedRecord {
  renderId?: ID
  previewId?: ID
  cleanAssemblyId?: ID
  editPlanId?: ID
  professionalIntegrationPlanId?: ID
  durationMs: number
  version: number
  systemIds: ID[]
  groupIds: ID[]
  elementIds: ID[]
  activeSelection?: EditSelection
  latestOperationId?: ID
}

export interface EditSystem extends ProjectScopedRecord {
  editDocumentId: ID
  kind: EditSystemKind
  name: string
  visible: boolean
  locked: boolean
  defaultGroupId?: ID
  groupIds: ID[]
  globalControls: string[]
}

export interface EditGroup extends ProjectScopedRecord {
  editDocumentId: ID
  systemId: ID
  name: string
  type: string
  visible: boolean
  locked: boolean
  stylePresetId?: ID
  elementIds: ID[]
  defaultEditScope: EditScope
  linkedByDefault: boolean
  allowInstanceOverrides: boolean
}

export interface EditElement extends ProjectScopedRecord {
  editDocumentId: ID
  systemId: ID
  groupId: ID
  label: string
  timeRange?: TimeRange
  visualBounds?: BoundingBox
  visible: boolean
  locked: boolean
  source: EditElementSource
  properties: Record<string, unknown>
  overrides?: Record<string, unknown>
  dependencyIds?: ID[]
}

export interface EditElementSource {
  kind: EditElementSourceKind
  editCueId?: ID
  professionalIntegrationPlanId?: ID
  renderInputId?: ID
  mediaAssetId?: ID
  sourceTimeMappingId?: ID
  notes?: string
}

export interface EditSelection {
  elementId?: ID
  groupId?: ID
  systemId?: ID
  activeScope: EditScope
}

export interface EditOperation extends ProjectScopedRecord {
  editDocumentId: ID
  type: EditOperationType
  scope: EditScope
  targetSystemId?: ID
  targetGroupId?: ID
  targetElementId?: ID
  patch: Record<string, unknown>
  createdBy: 'user' | 'ai' | 'system'
  sourceChatMessageId?: ID
  createsRevisionRequest: boolean
  revisionRequestId?: ID
  undoOperationId?: ID
}

export interface EditVersion extends ProjectScopedRecord {
  editDocumentId: ID
  version: number
  operationIds: ID[]
  renderId?: ID
  previewUrl?: string
  notes?: string
}
