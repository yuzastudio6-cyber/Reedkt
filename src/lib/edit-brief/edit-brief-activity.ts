import type {
  EditBrief,
  EditBriefOperation,
  WorkflowActivityEvent,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'

type CreateEditBriefActivityEventInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  operation: EditBriefOperation
  editBrief: EditBrief
  progressPercent?: number
}

const operationCopy: Record<EditBriefOperation['type'], { title: string; message: string; type: WorkflowActivityEvent['type'] }> = {
  create_brief: {
    title: 'Edit Brief started',
    message: 'Creative direction can now be added before AI planning.',
    type: 'edit_brief_created',
  },
  update_goal: {
    title: 'Edit Brief goal updated',
    message: 'The main editing goal was updated.',
    type: 'edit_brief_updated',
  },
  update_audience: {
    title: 'Edit Brief audience updated',
    message: 'The target audience was updated.',
    type: 'edit_brief_updated',
  },
  update_platforms: {
    title: 'Target platforms updated',
    message: 'The Edit Brief target platforms were updated.',
    type: 'edit_brief_updated',
  },
  update_target_duration: {
    title: 'Target duration updated',
    message: 'The Edit Brief target duration was updated.',
    type: 'edit_brief_updated',
  },
  update_style_keywords: {
    title: 'Style direction updated',
    message: 'The Edit Brief style direction was updated.',
    type: 'edit_brief_updated',
  },
  update_pacing: {
    title: 'Pacing preference updated',
    message: 'The Edit Brief pacing preference was updated.',
    type: 'edit_brief_updated',
  },
  update_caption_preference: {
    title: 'Caption preference updated',
    message: 'The Edit Brief caption preference was updated.',
    type: 'edit_brief_updated',
  },
  update_music_preference: {
    title: 'Music preference updated',
    message: 'The Edit Brief music preference was updated.',
    type: 'edit_brief_updated',
  },
  update_broll_preference: {
    title: 'B-roll preference updated',
    message: 'The Edit Brief B-roll preference was updated.',
    type: 'edit_brief_updated',
  },
  add_must_use_asset: {
    title: 'Must-use asset added',
    message: 'An asset was marked as important for planning.',
    type: 'edit_brief_asset_rule_updated',
  },
  remove_must_use_asset: {
    title: 'Must-use asset removed',
    message: 'An asset was removed from the must-use list.',
    type: 'edit_brief_asset_rule_updated',
  },
  add_avoid_asset: {
    title: 'Avoid asset added',
    message: 'An asset was marked to avoid during planning.',
    type: 'edit_brief_asset_rule_updated',
  },
  remove_avoid_asset: {
    title: 'Avoid asset removed',
    message: 'An asset was removed from the avoid list.',
    type: 'edit_brief_asset_rule_updated',
  },
  add_must_include_note: {
    title: 'Must-include note added',
    message: 'A must-include note was added to the Edit Brief.',
    type: 'edit_brief_updated',
  },
  remove_must_include_note: {
    title: 'Must-include note removed',
    message: 'A must-include note was removed from the Edit Brief.',
    type: 'edit_brief_updated',
  },
  add_avoid_note: {
    title: 'Avoid note added',
    message: 'An avoid note was added to the Edit Brief.',
    type: 'edit_brief_updated',
  },
  remove_avoid_note: {
    title: 'Avoid note removed',
    message: 'An avoid note was removed from the Edit Brief.',
    type: 'edit_brief_updated',
  },
  update_brand_notes: {
    title: 'Brand notes updated',
    message: 'The Edit Brief brand notes were updated.',
    type: 'edit_brief_updated',
  },
  update_special_instructions: {
    title: 'Special instructions updated',
    message: 'The Edit Brief special instructions were updated.',
    type: 'edit_brief_updated',
  },
  update_reference_urls: {
    title: 'Reference links updated',
    message: 'The Edit Brief reference links were updated for planning context.',
    type: 'edit_brief_updated',
  },
  reset_brief: {
    title: 'Edit Brief reset',
    message: 'The Edit Brief was reset to its starting suggestions.',
    type: 'edit_brief_reset',
  },
  mark_ready: {
    title: 'Edit Brief ready',
    message: 'The Edit Brief is ready for AI planning.',
    type: 'edit_brief_ready',
  },
}

export function createEditBriefActivityEvent(input: CreateEditBriefActivityEventInput): WorkflowActivityEvent {
  const copy = operationCopy[input.operation.type]

  return {
    id: `${input.operation.id}-activity`,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    type: copy.type,
    severity: input.operation.type === 'mark_ready' ? 'success' : 'info',
    title: copy.title,
    message: copy.message,
    status: 'clean_assembly_ready',
    relatedCleanAssemblyId: input.editBrief.cleanAssemblyId,
    progressPercent: input.progressPercent,
    metadata: {
      editBriefId: input.editBrief.id,
      editBriefOperationId: input.operation.id,
      editBriefOperationType: input.operation.type,
    },
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}
