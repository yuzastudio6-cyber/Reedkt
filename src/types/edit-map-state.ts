import type {
  BoundingBox,
  ID,
  TimeRange,
} from './workflow-common'
import type {
  EditDocument,
  EditElement,
  EditGroup,
  EditScope,
  EditSelection,
  EditSystem,
  EditSystemKind,
  EditVersion,
} from './edit-map'

export type EditMapStatus =
  | 'not_created'
  | 'ready'
  | 'editing'
  | 'has_local_changes'
  | 'needs_revision'
  | 'superseded'

export type EditMapOperationStatus =
  | 'pending'
  | 'applied'
  | 'reverted'

export type EditMapSelectionSource =
  | 'preview_click'
  | 'edit_map_panel'
  | 'inspector'
  | 'chat'
  | 'system'

export type EditMapLocalAction =
  | 'create_edit_map'
  | 'select_element'
  | 'select_group'
  | 'select_system'
  | 'set_system_visibility'
  | 'set_group_visibility'
  | 'set_element_visibility'
  | 'lock_group'
  | 'unlock_group'
  | 'lock_element'
  | 'unlock_element'
  | 'update_group_style'
  | 'update_element'
  | 'move_element'
  | 'replace_asset'
  | 'regenerate_element'
  | 'delete_element'
  | 'restore_element'
  | 'change_scope'
  | 'reset_edit_map'

export interface EditMapLocalOperation {
  id: ID
  projectId: ID
  workspaceId?: ID
  userId?: ID
  editDocumentId: ID
  type: EditMapLocalAction
  status: EditMapOperationStatus
  createdBy: 'user' | 'ai' | 'system'
  createdAt: string
  selectionSource?: EditMapSelectionSource
  scope?: EditScope
  targetSystemId?: ID
  targetGroupId?: ID
  targetElementId?: ID
  patch?: Record<string, unknown>
  explanation?: string
}

export interface EditMapState {
  projectId: ID
  workspaceId?: ID
  userId?: ID
  status: EditMapStatus
  editDocument: EditDocument | null
  systems: EditSystem[]
  groups: EditGroup[]
  elements: EditElement[]
  versions: EditVersion[]
  operations: EditMapLocalOperation[]
  activeSelection?: EditSelection
  defaultScope: EditScope
  previewJobId?: ID
  planningContextId?: ID
  professionalIntegrationPlanId?: ID
  qaReportId?: ID
  updatedAt: string
}

export interface EditMapSummary {
  status: EditMapStatus
  systemCount: number
  groupCount: number
  elementCount: number
  visibleSystemCount: number
  hiddenGroupCount: number
  hiddenElementCount: number
  lockedGroupCount: number
  lockedElementCount: number
  operationCount: number
  selectedLabel?: string
  nextRecommendedActions: string[]
}

export interface EditMapSelectablePreviewElement {
  id: ID
  elementId: ID
  groupId: ID
  systemId: ID
  label: string
  kind: EditSystemKind
  bounds: BoundingBox
  timeRange?: TimeRange
  visible: boolean
  locked: boolean
}
