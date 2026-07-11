import type {
  EditCue,
  EditCueOperation,
  EditCueValidationIssue,
  WorkflowActivityEvent,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'

type CreateEditCueActivityEventInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  operation: EditCueOperation
  cue?: EditCue
  validationIssues?: EditCueValidationIssue[]
  progressPercent?: number
}

const operationCopy: Record<EditCueOperation['type'], { title: string; message: string; type: WorkflowActivityEvent['type'] }> = {
  create_cue: {
    title: 'Edit Cue created',
    message: 'A precise editing instruction was added.',
    type: 'edit_cue_created',
  },
  update_title: {
    title: 'Edit Cue title updated',
    message: 'The cue title was updated.',
    type: 'edit_cue_updated',
  },
  update_anchor: {
    title: 'Edit Cue anchor updated',
    message: 'The cue was attached to a moment, scene, transcript, asset, or global rule.',
    type: 'edit_cue_updated',
  },
  update_role: {
    title: 'Edit Cue role updated',
    message: 'The cue role was updated for AI planning.',
    type: 'edit_cue_updated',
  },
  add_asset: {
    title: 'Cue asset added',
    message: 'An asset was connected to the cue.',
    type: 'edit_cue_asset_updated',
  },
  remove_asset: {
    title: 'Cue asset removed',
    message: 'An asset was removed from the cue.',
    type: 'edit_cue_asset_updated',
  },
  update_priority: {
    title: 'Edit Cue priority updated',
    message: 'The cue priority was updated.',
    type: 'edit_cue_updated',
  },
  update_timing_flexibility: {
    title: 'Edit Cue timing updated',
    message: 'The cue timing flexibility was updated.',
    type: 'edit_cue_updated',
  },
  update_audio_behavior: {
    title: 'Edit Cue audio updated',
    message: 'The cue audio behavior was updated.',
    type: 'edit_cue_updated',
  },
  update_visual_behavior: {
    title: 'Edit Cue visual behavior updated',
    message: 'The cue visual behavior was updated.',
    type: 'edit_cue_updated',
  },
  update_instructions: {
    title: 'Cue instructions updated',
    message: 'The cue instructions were updated.',
    type: 'edit_cue_updated',
  },
  add_tag: {
    title: 'Edit Cue tag added',
    message: 'The cue tags were updated.',
    type: 'edit_cue_updated',
  },
  remove_tag: {
    title: 'Edit Cue tag removed',
    message: 'The cue tags were updated.',
    type: 'edit_cue_updated',
  },
  mark_ready: {
    title: 'Edit Cue ready',
    message: 'The cue is ready for AI planning.',
    type: 'edit_cue_ready',
  },
  duplicate_cue: {
    title: 'Edit Cue duplicated',
    message: 'A copy of the cue was created.',
    type: 'edit_cue_created',
  },
  delete_cue: {
    title: 'Edit Cue deleted',
    message: 'The cue was removed locally.',
    type: 'edit_cue_deleted',
  },
  reset_all: {
    title: 'Edit Cues reset',
    message: 'All local edit cues were cleared.',
    type: 'edit_cues_reset',
  },
}

export function createEditCueActivityEvent(input: CreateEditCueActivityEventInput): WorkflowActivityEvent {
  const blockingIssues = input.validationIssues?.filter((issue) => issue.severity === 'blocking') ?? []
  const warningIssues = input.validationIssues?.filter((issue) => issue.severity === 'warning') ?? []
  const copy = blockingIssues.length > 0 || warningIssues.length > 0
    ? {
        title: 'Edit Cue needs review',
        message: 'One or more cue details need review before this cue is ready.',
        type: 'edit_cue_validation_warning' as const,
      }
    : operationCopy[input.operation.type]

  return {
    id: `${input.operation.id}-activity`,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    type: copy.type,
    severity: blockingIssues.length > 0 ? 'warning' : input.operation.type === 'mark_ready' ? 'success' : 'info',
    title: copy.title,
    message: copy.message,
    status: 'clean_assembly_ready',
    relatedEditCueId: input.operation.editCueId ?? input.cue?.id,
    relatedCleanAssemblyId: input.cue?.cleanAssemblyId,
    progressPercent: input.progressPercent,
    metadata: {
      editCueId: input.operation.editCueId ?? input.cue?.id,
      editCueOperationId: input.operation.id,
      editCueOperationType: input.operation.type,
      validationIssueCount: input.validationIssues?.length ?? 0,
    },
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}
