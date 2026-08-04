import type {
  EditCueConflictOperation,
  EditCueConflictRecord,
  EditCueRemapResult,
  WorkflowActivityEvent,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'

type CreateEditCueConflictActivityEventInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  operation?: EditCueConflictOperation
  conflict?: EditCueConflictRecord
  remapResult?: EditCueRemapResult
  progressPercent?: number
}

function copyForInput(input: CreateEditCueConflictActivityEventInput): {
  type: WorkflowActivityEvent['type']
  severity: WorkflowActivityEvent['severity']
  title: string
  message: string
} {
  if (input.remapResult?.status === 'removed_source' || input.remapResult?.status === 'failed') {
    return {
      type: 'edit_cue_remap_failed',
      severity: 'warning',
      title: 'Cue needs review',
      message: 'A cue points to footage that was removed or could not be mapped.',
    }
  }

  if (input.operation?.type === 'remap_cue' || input.operation?.type === 'remap_all_cues') {
    return {
      type: 'edit_cue_remapped',
      severity: 'success',
      title: 'Edit Cue remapped',
      message: 'Cue timing was mapped to the Clean Assembly.',
    }
  }

  if (input.operation?.type === 'resolve_conflict') {
    return {
      type: 'edit_cue_conflict_resolved',
      severity: 'success',
      title: 'Cue conflict resolved',
      message: 'A cue conflict was resolved for AI planning.',
    }
  }

  if (input.operation?.type === 'ignore_conflict') {
    return {
      type: 'edit_cue_conflict_ignored',
      severity: 'info',
      title: 'Cue conflict ignored',
      message: 'A cue conflict was ignored locally.',
    }
  }

  if (input.operation?.type === 'reset_conflict' || input.operation?.type === 'reset_all_conflicts') {
    return {
      type: 'edit_cue_conflicts_reset',
      severity: 'info',
      title: 'Cue conflicts reset',
      message: 'Cue conflict resolutions were reset.',
    }
  }

  if (input.conflict) {
    return {
      type: 'edit_cue_conflict_found',
      severity: input.conflict.severity === 'blocking' ? 'warning' : 'info',
      title: 'Cue conflict found',
      message: 'A cue conflict needs review before AI planning.',
    }
  }

  return {
    type: 'edit_cue_updated',
    severity: 'info',
    title: 'Cue review updated',
    message: 'Cue remapping or conflict state was updated.',
  }
}

export function createEditCueConflictActivityEvent(input: CreateEditCueConflictActivityEventInput): WorkflowActivityEvent {
  const copy = copyForInput(input)
  const idBase = input.operation?.id ?? `${input.remapResult?.editCueId ?? input.conflict?.id ?? 'edit-cue-conflict'}-activity`

  return {
    id: `${idBase}-activity`,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    type: copy.type,
    severity: copy.severity,
    title: copy.title,
    message: copy.message,
    status: 'clean_assembly_ready',
    relatedEditCueId: input.operation?.editCueId ?? input.remapResult?.editCueId ?? input.conflict?.editCueIds[0],
    progressPercent: input.progressPercent,
    metadata: {
      editCueConflictId: input.operation?.conflictId ?? input.conflict?.id,
      editCueConflictOperationId: input.operation?.id,
      editCueConflictOperationType: input.operation?.type,
      editCueRemapStatus: input.remapResult?.status,
      editCueConflictKind: input.conflict?.kind,
    },
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}
