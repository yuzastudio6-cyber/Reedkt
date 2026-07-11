import type {
  CleanAssembly,
  CleanAssemblySegment,
  CleanupPlan,
  CleanupPlanItem,
  CleanupReviewDecision,
  CleanupReviewItemState,
  CleanupReviewOperation,
  CleanupReviewOperationType,
  CleanupReviewState,
  SourceTimeMapping,
  WorkflowID,
} from '../../types'
import { MOCK_CREATED_AT } from './mock-footage-prep-data'
import { rebuildCleanAssemblyFromReview } from './rebuild-clean-assembly-from-review'

type CreateInitialCleanupReviewStateInput = {
  projectId: WorkflowID
  workspaceId?: WorkflowID
  userId?: WorkflowID
  cleanupPlan: CleanupPlan
  cleanupPlanItems: CleanupPlanItem[]
  cleanAssembly: CleanAssembly
  cleanAssemblySegments: CleanAssemblySegment[]
  sourceTimeMappings: SourceTimeMapping[]
}

export type CleanupReviewOperationInput = {
  type: CleanupReviewOperationType
  cleanupPlanItemId?: WorkflowID
  createdBy?: 'user' | 'ai' | 'system'
  explanation?: string
}

type RebuildStateInput = {
  state: CleanupReviewState
  cleanupPlan: CleanupPlan
  cleanupPlanItems: CleanupPlanItem[]
  baseCleanAssembly: CleanAssembly
  baseCleanAssemblySegments: CleanAssemblySegment[]
  baseSourceTimeMappings: SourceTimeMapping[]
  itemStates: CleanupReviewItemState[]
  operations: CleanupReviewOperation[]
  accepted: boolean
}

function defaultReviewDecision(item: CleanupPlanItem): CleanupReviewDecision {
  if (item.userDecision) return item.userDecision
  if (item.action === 'review') return 'needs_review'
  if (item.action === 'mark_important') return 'marked_important'
  if (item.action === 'mark_do_not_use') return 'marked_do_not_use'

  return 'accepted'
}

function operationId(cleanupPlanId: WorkflowID, nextIndex: number) {
  return `${cleanupPlanId}-review-operation-${String(nextIndex).padStart(3, '0')}`
}

function nextOperationIndex(state: CleanupReviewState) {
  return state.operations.length + 1
}

function itemStateWithDecision(input: {
  itemStates: CleanupReviewItemState[]
  cleanupPlanItemId?: WorkflowID
  decision: CleanupReviewDecision
  operationId: WorkflowID
}) {
  if (!input.cleanupPlanItemId) return input.itemStates

  return input.itemStates.map((itemState) => {
    if (itemState.cleanupPlanItemId !== input.cleanupPlanItemId) {
      return itemState
    }

    return {
      ...itemState,
      decision: input.decision,
      operationIds: [...itemState.operationIds, input.operationId],
    }
  })
}

function defaultItemStates(cleanupPlanItems: CleanupPlanItem[]): CleanupReviewItemState[] {
  return cleanupPlanItems.map((item) => ({
    cleanupPlanItemId: item.id,
    decision: defaultReviewDecision(item),
    operationIds: [],
    userNote: item.userNote,
  }))
}

function rebuildState(input: RebuildStateInput): CleanupReviewState {
  const rebuilt = rebuildCleanAssemblyFromReview({
    cleanupPlan: input.cleanupPlan,
    cleanupPlanItems: input.cleanupPlanItems,
    baseCleanAssembly: input.baseCleanAssembly,
    baseCleanAssemblySegments: input.baseCleanAssemblySegments,
    baseSourceTimeMappings: input.baseSourceTimeMappings,
    itemStates: input.itemStates,
    accepted: input.accepted,
    operationCount: input.operations.length,
  })

  return {
    ...input.state,
    currentCleanAssemblyId: rebuilt.cleanAssembly.id,
    accepted: input.accepted,
    itemStates: input.itemStates,
    operations: input.operations,
    updatedCleanAssembly: rebuilt.cleanAssembly,
    updatedCleanAssemblySegments: rebuilt.cleanAssemblySegments,
    updatedSourceTimeMappings: rebuilt.sourceTimeMappings,
    updatedAt: MOCK_CREATED_AT,
  }
}

export function createInitialCleanupReviewState(input: CreateInitialCleanupReviewStateInput): CleanupReviewState {
  const itemStates = defaultItemStates(input.cleanupPlanItems)
  const rebuilt = rebuildCleanAssemblyFromReview({
    cleanupPlan: input.cleanupPlan,
    cleanupPlanItems: input.cleanupPlanItems,
    baseCleanAssembly: input.cleanAssembly,
    baseCleanAssemblySegments: input.cleanAssemblySegments,
    baseSourceTimeMappings: input.sourceTimeMappings,
    itemStates,
    accepted: false,
    operationCount: 0,
  })

  return {
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    cleanupPlanId: input.cleanupPlan.id,
    originalCleanAssemblyId: input.cleanAssembly.id,
    currentCleanAssemblyId: rebuilt.cleanAssembly.id,
    accepted: false,
    itemStates,
    operations: [],
    updatedCleanAssembly: rebuilt.cleanAssembly,
    updatedCleanAssemblySegments: rebuilt.cleanAssemblySegments,
    updatedSourceTimeMappings: rebuilt.sourceTimeMappings,
    updatedAt: MOCK_CREATED_AT,
  }
}

export function createCleanupReviewOperation(
  state: CleanupReviewState,
  operationInput: CleanupReviewOperationInput,
): CleanupReviewOperation {
  return {
    id: operationId(state.cleanupPlanId, nextOperationIndex(state)),
    projectId: state.projectId,
    workspaceId: state.workspaceId,
    userId: state.userId,
    cleanupPlanId: state.cleanupPlanId,
    cleanAssemblyId: state.currentCleanAssemblyId,
    cleanupPlanItemId: operationInput.cleanupPlanItemId,
    type: operationInput.type,
    status: 'applied',
    createdBy: operationInput.createdBy ?? 'user',
    createdAt: MOCK_CREATED_AT,
    explanation: operationInput.explanation,
  }
}

export function applyCleanupReviewOperation(
  state: CleanupReviewState,
  operationInput: CleanupReviewOperationInput,
  rebuildInput: Pick<
    CreateInitialCleanupReviewStateInput,
    'cleanupPlan' | 'cleanupPlanItems' | 'cleanAssembly' | 'cleanAssemblySegments' | 'sourceTimeMappings'
  >,
): CleanupReviewState {
  const operation = createCleanupReviewOperation(state, operationInput)
  let itemStates = state.itemStates
  let operations = [...state.operations, operation]
  let accepted = state.accepted

  if (operation.type === 'accept_cleanup') {
    accepted = true
  }

  if (operation.type === 'accept_item') {
    itemStates = itemStateWithDecision({
      itemStates,
      cleanupPlanItemId: operation.cleanupPlanItemId,
      decision: 'accepted',
      operationId: operation.id,
    })
  }

  if (operation.type === 'restore_item') {
    accepted = false
    itemStates = itemStateWithDecision({
      itemStates,
      cleanupPlanItemId: operation.cleanupPlanItemId,
      decision: 'restored',
      operationId: operation.id,
    })
  }

  if (operation.type === 'mark_item_important') {
    accepted = false
    itemStates = itemStateWithDecision({
      itemStates,
      cleanupPlanItemId: operation.cleanupPlanItemId,
      decision: 'marked_important',
      operationId: operation.id,
    })
  }

  if (operation.type === 'mark_item_do_not_use') {
    accepted = false
    itemStates = itemStateWithDecision({
      itemStates,
      cleanupPlanItemId: operation.cleanupPlanItemId,
      decision: 'marked_do_not_use',
      operationId: operation.id,
    })
  }

  if (operation.type === 'reset_item' && operation.cleanupPlanItemId) {
    accepted = false
    itemStates = itemStates.map((itemState) => {
      if (itemState.cleanupPlanItemId !== operation.cleanupPlanItemId) return itemState

      const item = rebuildInput.cleanupPlanItems.find((cleanupItem) => cleanupItem.id === operation.cleanupPlanItemId)

      return {
        ...itemState,
        decision: item ? defaultReviewDecision(item) : itemState.decision,
        operationIds: [...itemState.operationIds, operation.id],
      }
    })
  }

  if (operation.type === 'reset_all') {
    accepted = false
    itemStates = defaultItemStates(rebuildInput.cleanupPlanItems)
    operations = []
  }

  return rebuildState({
    state,
    cleanupPlan: rebuildInput.cleanupPlan,
    cleanupPlanItems: rebuildInput.cleanupPlanItems,
    baseCleanAssembly: rebuildInput.cleanAssembly,
    baseCleanAssemblySegments: rebuildInput.cleanAssemblySegments,
    baseSourceTimeMappings: rebuildInput.sourceTimeMappings,
    itemStates,
    operations,
    accepted,
  })
}

export function acceptCleanupReview(
  state: CleanupReviewState,
  rebuildInput: Parameters<typeof applyCleanupReviewOperation>[2],
) {
  return applyCleanupReviewOperation(state, { type: 'accept_cleanup' }, rebuildInput)
}

export function acceptCleanupItem(
  state: CleanupReviewState,
  cleanupPlanItemId: WorkflowID,
  rebuildInput: Parameters<typeof applyCleanupReviewOperation>[2],
) {
  return applyCleanupReviewOperation(state, { type: 'accept_item', cleanupPlanItemId }, rebuildInput)
}

export function restoreCleanupItem(
  state: CleanupReviewState,
  cleanupPlanItemId: WorkflowID,
  rebuildInput: Parameters<typeof applyCleanupReviewOperation>[2],
) {
  return applyCleanupReviewOperation(state, { type: 'restore_item', cleanupPlanItemId }, rebuildInput)
}

export function markCleanupItemImportant(
  state: CleanupReviewState,
  cleanupPlanItemId: WorkflowID,
  rebuildInput: Parameters<typeof applyCleanupReviewOperation>[2],
) {
  return applyCleanupReviewOperation(state, { type: 'mark_item_important', cleanupPlanItemId }, rebuildInput)
}

export function markCleanupItemDoNotUse(
  state: CleanupReviewState,
  cleanupPlanItemId: WorkflowID,
  rebuildInput: Parameters<typeof applyCleanupReviewOperation>[2],
) {
  return applyCleanupReviewOperation(state, { type: 'mark_item_do_not_use', cleanupPlanItemId }, rebuildInput)
}

export function resetCleanupItem(
  state: CleanupReviewState,
  cleanupPlanItemId: WorkflowID,
  rebuildInput: Parameters<typeof applyCleanupReviewOperation>[2],
) {
  return applyCleanupReviewOperation(state, { type: 'reset_item', cleanupPlanItemId }, rebuildInput)
}

export function resetCleanupReview(
  state: CleanupReviewState,
  rebuildInput: Parameters<typeof applyCleanupReviewOperation>[2],
) {
  return applyCleanupReviewOperation(state, { type: 'reset_all' }, rebuildInput)
}
