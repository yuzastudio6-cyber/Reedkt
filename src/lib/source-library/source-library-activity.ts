import type {
  SourceAssetOperation,
  SourceLibraryAsset,
  WorkflowActivityEvent,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'

type CreateSourceLibraryActivityEventInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  operation: SourceAssetOperation
  asset?: SourceLibraryAsset
  progressPercent?: number
}

const operationCopy: Record<SourceAssetOperation['type'], { title: string; message: string; type: WorkflowActivityEvent['type'] }> = {
  accept_ai_suggestion: {
    title: 'Asset suggestion accepted',
    message: 'The AI-suggested asset role was confirmed.',
    type: 'source_asset_suggestion_accepted',
  },
  update_role: {
    title: 'Asset role updated',
    message: 'The asset role was updated for future planning.',
    type: 'source_asset_role_updated',
  },
  update_priority: {
    title: 'Asset priority updated',
    message: 'The asset priority was updated.',
    type: 'source_asset_role_updated',
  },
  update_notes: {
    title: 'Asset notes updated',
    message: 'The asset notes were updated for future planning.',
    type: 'source_asset_role_updated',
  },
  add_tag: {
    title: 'Asset tag added',
    message: 'The asset tags were updated for future planning.',
    type: 'source_asset_role_updated',
  },
  remove_tag: {
    title: 'Asset tag removed',
    message: 'The asset tags were updated for future planning.',
    type: 'source_asset_role_updated',
  },
  mark_do_not_use: {
    title: 'Asset marked do-not-use',
    message: 'This asset will be avoided in future planning.',
    type: 'source_asset_marked_do_not_use',
  },
  reset_asset: {
    title: 'Asset reset',
    message: 'The asset was reset to the AI suggestion.',
    type: 'source_library_reset',
  },
  reset_all: {
    title: 'Source Library reset',
    message: 'All assets were reset to AI suggestions.',
    type: 'source_library_reset',
  },
  confirm_library: {
    title: 'Source Library confirmed',
    message: 'The Source Library is ready for creative planning.',
    type: 'source_library_confirmed',
  },
}

export function createSourceLibraryActivityEvent(input: CreateSourceLibraryActivityEventInput): WorkflowActivityEvent {
  const copy = operationCopy[input.operation.type]

  return {
    id: `${input.operation.id}-activity`,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    type: copy.type,
    severity: input.operation.type === 'mark_do_not_use' ? 'warning' : 'success',
    title: copy.title,
    message: copy.message,
    status: 'clean_assembly_ready',
    relatedMediaAssetId: input.asset?.mediaAssetId,
    progressPercent: input.progressPercent,
    metadata: {
      sourceLibraryId: input.operation.sourceLibraryId,
      sourceLibraryAssetId: input.operation.sourceLibraryAssetId,
      sourceAssetOperationId: input.operation.id,
      sourceAssetOperationType: input.operation.type,
    },
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}
