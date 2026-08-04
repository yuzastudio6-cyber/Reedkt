import { useCallback, useMemo, useState } from 'react'
import {
  applyCleanupReviewOperation,
  createCleanupReviewActivityEvent,
  createCleanupReviewOperation,
  createInitialCleanupReviewState,
  type CleanupReviewOperationInput,
  type MockFootagePrepResult,
} from '../lib/footage-prep'
import type {
  CleanAssembly,
  CleanAssemblySegment,
  CleanupReviewState,
  SourceTimeMapping,
  WorkflowActivityEvent,
} from '../types'

export interface UseCleanupReviewResult {
  reviewState: CleanupReviewState | null
  activityEvents: WorkflowActivityEvent[]
  updatedCleanAssembly: CleanAssembly | null
  updatedCleanAssemblySegments: CleanAssemblySegment[]
  updatedSourceTimeMappings: SourceTimeMapping[]
  accepted: boolean
  acceptCleanup: () => void
  acceptItem: (cleanupPlanItemId: string) => void
  restoreItem: (cleanupPlanItemId: string) => void
  markImportant: (cleanupPlanItemId: string) => void
  markDoNotUse: (cleanupPlanItemId: string) => void
  resetItem: (cleanupPlanItemId: string) => void
  resetAll: () => void
}

type CleanupReviewStore = {
  resultKey: string | null
  reviewState: CleanupReviewState | null
  activityEvents: WorkflowActivityEvent[]
}

export function useCleanupReview(result: MockFootagePrepResult | null): UseCleanupReviewResult {
  const [store, setStore] = useState<CleanupReviewStore>({
    resultKey: null,
    reviewState: null,
    activityEvents: [],
  })

  const resultKey = result ? `${result.cleanupPlan.id}:${result.cleanAssembly.id}` : null

  const initialReviewState = useMemo(() => {
    if (!result) return null

    return createInitialCleanupReviewState({
      projectId: result.cleanupPlan.projectId,
      workspaceId: result.cleanupPlan.workspaceId,
      userId: result.cleanupPlan.userId,
      cleanupPlan: result.cleanupPlan,
      cleanupPlanItems: result.cleanupPlanItems,
      cleanAssembly: result.cleanAssembly,
      cleanAssemblySegments: result.cleanAssemblySegments,
      sourceTimeMappings: result.sourceTimeMappings,
    })
  }, [result])

  const reviewState = store.resultKey === resultKey ? store.reviewState : initialReviewState
  const activityEvents = store.resultKey === resultKey ? store.activityEvents : []

  const rebuildInput = useMemo(() => {
    if (!result) return null

    return {
      cleanupPlan: result.cleanupPlan,
      cleanupPlanItems: result.cleanupPlanItems,
      cleanAssembly: result.cleanAssembly,
      cleanAssemblySegments: result.cleanAssemblySegments,
      sourceTimeMappings: result.sourceTimeMappings,
    }
  }, [result])

  const applyOperation = useCallback((operationInput: CleanupReviewOperationInput) => {
    if (!reviewState || !rebuildInput || !result) {
      return
    }

    const operation = createCleanupReviewOperation(reviewState, operationInput)
    const cleanupPlanItem = operation.cleanupPlanItemId
      ? result.cleanupPlanItems.find((item) => item.id === operation.cleanupPlanItemId)
      : undefined

    const nextReviewState = applyCleanupReviewOperation(reviewState, operationInput, rebuildInput)
    const nextActivityEvent = createCleanupReviewActivityEvent({
      projectId: result.cleanupPlan.projectId,
      workspaceId: result.cleanupPlan.workspaceId,
      userId: result.cleanupPlan.userId,
      operation,
      cleanupPlanItem,
      progressPercent: 100,
    })

    setStore((current) => ({
      resultKey,
      reviewState: nextReviewState,
      activityEvents: [
        ...(current.resultKey === resultKey ? current.activityEvents : []),
        nextActivityEvent,
      ],
    }))
  }, [rebuildInput, result, resultKey, reviewState])

  const acceptCleanup = useCallback(() => {
    applyOperation({ type: 'accept_cleanup' })
  }, [applyOperation])

  const acceptItem = useCallback((cleanupPlanItemId: string) => {
    applyOperation({ type: 'accept_item', cleanupPlanItemId })
  }, [applyOperation])

  const restoreItem = useCallback((cleanupPlanItemId: string) => {
    applyOperation({ type: 'restore_item', cleanupPlanItemId })
  }, [applyOperation])

  const markImportant = useCallback((cleanupPlanItemId: string) => {
    applyOperation({ type: 'mark_item_important', cleanupPlanItemId })
  }, [applyOperation])

  const markDoNotUse = useCallback((cleanupPlanItemId: string) => {
    applyOperation({ type: 'mark_item_do_not_use', cleanupPlanItemId })
  }, [applyOperation])

  const resetItem = useCallback((cleanupPlanItemId: string) => {
    applyOperation({ type: 'reset_item', cleanupPlanItemId })
  }, [applyOperation])

  const resetAll = useCallback(() => {
    applyOperation({ type: 'reset_all' })
  }, [applyOperation])

  return {
    reviewState,
    activityEvents,
    updatedCleanAssembly: reviewState?.updatedCleanAssembly ?? null,
    updatedCleanAssemblySegments: reviewState?.updatedCleanAssemblySegments ?? [],
    updatedSourceTimeMappings: reviewState?.updatedSourceTimeMappings ?? [],
    accepted: Boolean(reviewState?.accepted),
    acceptCleanup,
    acceptItem,
    restoreItem,
    markImportant,
    markDoNotUse,
    resetItem,
    resetAll,
  }
}
