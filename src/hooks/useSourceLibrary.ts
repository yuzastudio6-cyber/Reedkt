import { useCallback, useMemo, useState } from 'react'
import type { MockFootagePrepResult } from '../lib/footage-prep'
import {
  applySourceLibraryOperation,
  createInitialSourceLibraryState,
  createSourceAssetOperation,
  createSourceLibraryActivityEvent,
  summarizeSourceLibrary,
  type SourceLibraryOperationInput,
} from '../lib/source-library'
import type {
  AssetUsageRole,
  PriorityLevel,
  SourceLibrary,
  SourceLibraryState,
  SourceLibrarySummary,
  WorkflowActivityEvent,
} from '../types'

export interface UseSourceLibraryResult {
  sourceLibraryState: SourceLibraryState | null
  sourceLibrary: SourceLibrary | null
  assets: SourceLibraryState['assets']
  summary: SourceLibrarySummary | null
  activityEvents: WorkflowActivityEvent[]
  confirmed: boolean
  acceptSuggestion: (sourceLibraryAssetId: string) => void
  updateRole: (sourceLibraryAssetId: string, role: AssetUsageRole) => void
  updatePriority: (sourceLibraryAssetId: string, priority: PriorityLevel) => void
  updateNotes: (sourceLibraryAssetId: string, notes: string) => void
  markDoNotUse: (sourceLibraryAssetId: string) => void
  resetAsset: (sourceLibraryAssetId: string) => void
  resetAll: () => void
  confirmLibrary: () => void
}

type SourceLibraryStore = {
  resultKey: string | null
  sourceLibraryState: SourceLibraryState | null
  activityEvents: WorkflowActivityEvent[]
}

export function useSourceLibrary(result: MockFootagePrepResult | null): UseSourceLibraryResult {
  const [store, setStore] = useState<SourceLibraryStore>({
    resultKey: null,
    sourceLibraryState: null,
    activityEvents: [],
  })

  const resultKey = result ? `${result.footagePrepSession.id}:${result.cleanAssembly.id}:${result.assetAnalysisReports.length}` : null
  const initialState = useMemo(() => result ? createInitialSourceLibraryState(result) : null, [result])
  const sourceLibraryState = store.resultKey === resultKey ? store.sourceLibraryState : initialState
  const activityEvents = store.resultKey === resultKey ? store.activityEvents : []
  const summary = sourceLibraryState ? summarizeSourceLibrary(sourceLibraryState) : null

  const applyOperation = useCallback((operationInput: SourceLibraryOperationInput) => {
    if (!result || !sourceLibraryState || !initialState) {
      return
    }

    const operation = createSourceAssetOperation(sourceLibraryState, operationInput)
    const asset = operation.sourceLibraryAssetId
      ? sourceLibraryState.assets.find((item) => item.id === operation.sourceLibraryAssetId)
      : undefined
    const nextState = applySourceLibraryOperation(sourceLibraryState, operationInput, initialState)
    const nextActivityEvent = createSourceLibraryActivityEvent({
      projectId: sourceLibraryState.sourceLibrary.projectId,
      workspaceId: sourceLibraryState.sourceLibrary.workspaceId,
      userId: sourceLibraryState.sourceLibrary.userId,
      operation,
      asset,
      progressPercent: 100,
    })

    setStore((current) => ({
      resultKey,
      sourceLibraryState: nextState,
      activityEvents: [
        ...(current.resultKey === resultKey ? current.activityEvents : []),
        nextActivityEvent,
      ],
    }))
  }, [initialState, result, resultKey, sourceLibraryState])

  const acceptSuggestion = useCallback((sourceLibraryAssetId: string) => {
    applyOperation({ type: 'accept_ai_suggestion', sourceLibraryAssetId })
  }, [applyOperation])

  const updateRole = useCallback((sourceLibraryAssetId: string, role: AssetUsageRole) => {
    applyOperation({ type: 'update_role', sourceLibraryAssetId, role })
  }, [applyOperation])

  const updatePriority = useCallback((sourceLibraryAssetId: string, priority: PriorityLevel) => {
    applyOperation({ type: 'update_priority', sourceLibraryAssetId, priority })
  }, [applyOperation])

  const updateNotes = useCallback((sourceLibraryAssetId: string, notes: string) => {
    applyOperation({ type: 'update_notes', sourceLibraryAssetId, notes })
  }, [applyOperation])

  const markDoNotUse = useCallback((sourceLibraryAssetId: string) => {
    applyOperation({ type: 'mark_do_not_use', sourceLibraryAssetId })
  }, [applyOperation])

  const resetAsset = useCallback((sourceLibraryAssetId: string) => {
    applyOperation({ type: 'reset_asset', sourceLibraryAssetId })
  }, [applyOperation])

  const resetAll = useCallback(() => {
    applyOperation({ type: 'reset_all' })
  }, [applyOperation])

  const confirmLibrary = useCallback(() => {
    applyOperation({ type: 'confirm_library' })
  }, [applyOperation])

  return {
    sourceLibraryState,
    sourceLibrary: sourceLibraryState?.sourceLibrary ?? null,
    assets: sourceLibraryState?.assets ?? [],
    summary,
    activityEvents,
    confirmed: sourceLibraryState?.sourceLibrary.status === 'confirmed',
    acceptSuggestion,
    updateRole,
    updatePriority,
    updateNotes,
    markDoNotUse,
    resetAsset,
    resetAll,
    confirmLibrary,
  }
}
