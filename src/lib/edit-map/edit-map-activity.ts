import type {
  EditMapLocalOperation,
  EditMapState,
  WorkflowActivityEvent,
  WorkflowActivityType,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'

type EditMapActivityInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  operation?: EditMapLocalOperation | null
  state?: EditMapState | null
  type?: WorkflowActivityType
  progressPercent?: number
}

const MESSAGES: Partial<Record<WorkflowActivityType, {
  title: string
  message: string
  severity: WorkflowActivityEvent['severity']
}>> = {
  edit_map_created: {
    title: 'Edit Map created',
    message: 'The preview is now available as connected editable systems.',
    severity: 'success',
  },
  edit_map_selection_changed: {
    title: 'Edit selection changed',
    message: 'An edit element, group, or system was selected.',
    severity: 'info',
  },
  edit_map_operation_applied: {
    title: 'Edit Map updated',
    message: 'A local Edit Map operation was applied.',
    severity: 'info',
  },
  edit_map_visibility_changed: {
    title: 'Visibility updated',
    message: 'An edit system, group, or element visibility was changed.',
    severity: 'info',
  },
  edit_map_lock_changed: {
    title: 'Lock state updated',
    message: 'An edit group or element lock state was changed.',
    severity: 'info',
  },
  edit_map_element_regenerate_requested: {
    title: 'Regeneration requested',
    message: 'A local regeneration request was added for this edit element.',
    severity: 'warning',
  },
  edit_map_reset: {
    title: 'Edit Map reset',
    message: 'Local Edit Map changes were reset.',
    severity: 'info',
  },
}

function typeFromOperation(operation?: EditMapLocalOperation | null): WorkflowActivityType {
  if (!operation) return 'edit_map_created'
  if (
    operation.type === 'select_element' ||
    operation.type === 'select_group' ||
    operation.type === 'select_system'
  ) {
    return 'edit_map_selection_changed'
  }
  if (
    operation.type === 'set_system_visibility' ||
    operation.type === 'set_group_visibility' ||
    operation.type === 'set_element_visibility' ||
    operation.type === 'delete_element' ||
    operation.type === 'restore_element'
  ) {
    return 'edit_map_visibility_changed'
  }
  if (
    operation.type === 'lock_group' ||
    operation.type === 'unlock_group' ||
    operation.type === 'lock_element' ||
    operation.type === 'unlock_element'
  ) {
    return 'edit_map_lock_changed'
  }
  if (operation.type === 'regenerate_element') return 'edit_map_element_regenerate_requested'
  if (operation.type === 'reset_edit_map') return 'edit_map_reset'
  if (operation.type === 'create_edit_map') return 'edit_map_created'
  return 'edit_map_operation_applied'
}

export function createEditMapActivityEvent({
  operation,
  progressPercent,
  projectId,
  state,
  type,
  userId,
  workspaceId,
}: EditMapActivityInput): WorkflowActivityEvent {
  const eventType = type ?? typeFromOperation(operation)
  const fallback = MESSAGES[eventType] ?? MESSAGES.edit_map_operation_applied
  const sourceId = operation?.id ?? state?.editDocument?.id ?? `${projectId}-edit-document`

  return {
    id: `${sourceId}-activity-${eventType}`,
    projectId,
    workspaceId,
    userId,
    type: eventType,
    severity: operation?.status === 'pending' ? 'warning' : fallback?.severity ?? 'info',
    title: fallback?.title ?? 'Edit Map updated',
    message: operation?.explanation ?? fallback?.message ?? 'A local Edit Map operation was applied.',
    relatedEditOperationId: operation?.id,
    progressPercent,
    metadata: {
      editMapStatus: state?.status,
      editDocumentId: state?.editDocument?.id,
      targetSystemId: operation?.targetSystemId,
      targetGroupId: operation?.targetGroupId,
      targetElementId: operation?.targetElementId,
      scope: operation?.scope,
      operationStatus: operation?.status,
    },
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}
