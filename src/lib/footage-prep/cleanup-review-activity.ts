import type {
  CleanupPlanItem,
  CleanupReviewOperation,
  WorkflowActivityEvent,
} from '../../types'
import { MOCK_CREATED_AT } from './mock-footage-prep-data'

type CreateCleanupReviewActivityEventInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  operation: CleanupReviewOperation
  cleanupPlanItem?: CleanupPlanItem
  progressPercent?: number
}

const operationMessages: Record<CleanupReviewOperation['type'], { title: string; message: string }> = {
  accept_cleanup: {
    title: 'Clean assembly accepted',
    message: 'The clean assembly is ready for creative planning.',
  },
  restore_item: {
    title: 'Section restored',
    message: 'A removed source section was restored into the clean assembly.',
  },
  mark_item_important: {
    title: 'Section marked important',
    message: 'This section will be protected during creative planning.',
  },
  mark_item_do_not_use: {
    title: 'Section marked do-not-use',
    message: 'This source section will be avoided in later planning.',
  },
  accept_item: {
    title: 'Cleanup decision accepted',
    message: 'The cleanup decision was kept.',
  },
  reset_item: {
    title: 'Cleanup decision reset',
    message: 'The cleanup decision was reset to the AI recommendation.',
  },
  reset_all: {
    title: 'Cleanup review reset',
    message: 'All cleanup review decisions were reset.',
  },
}

export function createCleanupReviewActivityEvent(input: CreateCleanupReviewActivityEventInput): WorkflowActivityEvent {
  const copy = operationMessages[input.operation.type]

  return {
    id: `${input.operation.id}-activity`,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    type: 'edit_operation_created',
    severity: input.operation.type === 'reset_all' || input.operation.type === 'reset_item' ? 'info' : 'success',
    title: copy.title,
    message: copy.message,
    status: 'clean_assembly_ready',
    relatedMediaAssetId: input.cleanupPlanItem?.mediaAssetId,
    relatedCleanAssemblyId: input.operation.cleanAssemblyId,
    progressPercent: input.progressPercent,
    metadata: {
      cleanupPlanId: input.operation.cleanupPlanId,
      cleanupPlanItemId: input.operation.cleanupPlanItemId,
      cleanupReviewOperationId: input.operation.id,
      cleanupReviewOperationType: input.operation.type,
    },
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}
