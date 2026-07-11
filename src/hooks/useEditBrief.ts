import { useCallback, useMemo, useState } from 'react'
import type { MockFootagePrepResult } from '../lib/footage-prep'
import {
  applyEditBriefOperation,
  createEditBriefActivityEvent,
  createEditBriefOperation,
  createInitialEditBriefState,
  getEditBriefReadiness,
  summarizeEditBrief,
  type BuildInitialEditBriefInput,
  type EditBriefOperationInput,
} from '../lib/edit-brief'
import type {
  CaptionPreference,
  EditBrief,
  EditBriefReadinessCheck,
  EditBriefState,
  EditBriefSummary,
  EditBriefTargetPlatform,
  MusicPreference,
  PacingPreference,
  SourceLibraryState,
  WorkflowActivityEvent,
} from '../types'

export interface UseEditBriefResult {
  editBriefState: EditBriefState | null
  editBrief: EditBrief | null
  summary: EditBriefSummary | null
  readiness: EditBriefReadinessCheck | null
  activityEvents: WorkflowActivityEvent[]
  isOpen: boolean
  hasStarted: boolean
  openBrief: () => void
  closeBrief: () => void
  updateGoal: (goal: string) => void
  updateAudience: (audience: string) => void
  updatePlatforms: (platforms: EditBriefTargetPlatform[]) => void
  updateTargetDuration: (targetDurationMs?: number) => void
  updateStyleKeywords: (styleKeywords: string[]) => void
  updatePacingPreference: (pacingPreference: PacingPreference) => void
  updateCaptionPreference: (captionPreference: CaptionPreference) => void
  updateMusicPreference: (musicPreference: MusicPreference) => void
  updateBRollPreference: (bRollPreference: string) => void
  addMustUseAsset: (mediaAssetId: string) => void
  removeMustUseAsset: (mediaAssetId: string) => void
  addAvoidAsset: (mediaAssetId: string) => void
  removeAvoidAsset: (mediaAssetId: string) => void
  addMustIncludeNote: (note: string) => void
  removeMustIncludeNote: (note: string) => void
  addAvoidNote: (note: string) => void
  removeAvoidNote: (note: string) => void
  updateBrandNotes: (brandNotes: string) => void
  updateSpecialInstructions: (specialInstructions: string) => void
  updateReferenceUrls: (referenceUrls: string[]) => void
  resetBrief: () => void
  markReady: () => void
}

type UseEditBriefOptions = {
  onStateChange?: (state: EditBriefState) => void
  readOnly?: boolean
  restoredState?: EditBriefState | null
}

type EditBriefStore = {
  resultKey: string | null
  editBriefState: EditBriefState | null
  activityEvents: WorkflowActivityEvent[]
  isOpen: boolean
}

function hasCreateOperation(state: EditBriefState) {
  return state.operations.some((operation) => operation.type === 'create_brief')
}

export function useEditBrief(
  result: MockFootagePrepResult | null,
  sourceLibraryState?: SourceLibraryState | null,
  enabled = true,
  options: UseEditBriefOptions = {},
): UseEditBriefResult {
  const [store, setStore] = useState<EditBriefStore>({
    resultKey: null,
    editBriefState: null,
    activityEvents: [],
    isOpen: false,
  })

  const resultKey = result && enabled ? `${result.footagePrepSession.id}:${result.cleanAssembly.id}` : null

  const buildInput = useMemo<BuildInitialEditBriefInput | null>(() => {
    if (!result || !enabled) return null

    return {
      projectId: result.cleanupPlan.projectId,
      workspaceId: result.cleanupPlan.workspaceId,
      userId: result.cleanupPlan.userId,
      cleanAssemblyId: result.cleanAssembly.id,
      sourceLibraryState,
      prepSummary: result.prepSummary,
    }
  }, [enabled, result, sourceLibraryState])

  const initialState = useMemo(() => {
    if (!buildInput) return null
    const restored = options.restoredState
    if (
      restored?.projectId === buildInput.projectId &&
      (!restored.workspaceId || restored.workspaceId === buildInput.workspaceId)
    ) return restored
    return createInitialEditBriefState(buildInput)
  }, [buildInput, options.restoredState])
  const editBriefState = store.resultKey === resultKey ? store.editBriefState : initialState
  const activityEvents = store.resultKey === resultKey ? store.activityEvents : []
  const isOpen = store.resultKey === resultKey ? store.isOpen : false
  const editBrief = editBriefState?.editBrief ?? null
  const summary = editBrief ? summarizeEditBrief(editBrief) : null
  const readiness = editBrief ? getEditBriefReadiness(editBrief) : null
  const hasStarted = editBriefState ? hasCreateOperation(editBriefState) : false

  const applyOperation = useCallback((operationInput: EditBriefOperationInput) => {
    if (options.readOnly || !result || !editBriefState || !buildInput || !resultKey) {
      return
    }

    const operationInputs: EditBriefOperationInput[] =
      !hasCreateOperation(editBriefState) && operationInput.type !== 'reset_brief'
        ? [{ type: 'create_brief' }, operationInput]
        : [operationInput]
    let nextState = editBriefState
    const nextActivityEvents: WorkflowActivityEvent[] = []

    operationInputs.forEach((input) => {
      const operation = createEditBriefOperation(nextState, input)
      nextState = applyEditBriefOperation(nextState, input)
      nextActivityEvents.push(createEditBriefActivityEvent({
        projectId: nextState.projectId,
        workspaceId: nextState.workspaceId,
        userId: nextState.userId,
        operation,
        editBrief: nextState.editBrief,
        progressPercent: 100,
      }))
    })

    setStore((current) => ({
      resultKey,
      editBriefState: nextState,
      activityEvents: [
        ...(current.resultKey === resultKey ? current.activityEvents : []),
        ...nextActivityEvents,
      ],
      isOpen: true,
    }))
    options.onStateChange?.(nextState)
  }, [buildInput, editBriefState, options, result, resultKey])

  const openBrief = useCallback(() => {
    if (!result || !buildInput || !initialState || !resultKey) {
      return
    }

    const state = editBriefState ?? initialState

    setStore((current) => ({
      resultKey,
      editBriefState: state,
      activityEvents: current.resultKey === resultKey ? current.activityEvents : [],
      isOpen: true,
    }))
  }, [buildInput, editBriefState, initialState, result, resultKey])

  const closeBrief = useCallback(() => {
    setStore((current) => ({
      ...current,
      isOpen: false,
    }))
  }, [])

  const updateGoal = useCallback((goal: string) => {
    applyOperation({ type: 'update_goal', goal })
  }, [applyOperation])

  const updateAudience = useCallback((audience: string) => {
    applyOperation({ type: 'update_audience', audience })
  }, [applyOperation])

  const updatePlatforms = useCallback((platforms: EditBriefTargetPlatform[]) => {
    applyOperation({ type: 'update_platforms', platforms })
  }, [applyOperation])

  const updateTargetDuration = useCallback((targetDurationMs?: number) => {
    applyOperation({ type: 'update_target_duration', targetDurationMs })
  }, [applyOperation])

  const updateStyleKeywords = useCallback((styleKeywords: string[]) => {
    applyOperation({ type: 'update_style_keywords', styleKeywords })
  }, [applyOperation])

  const updatePacingPreference = useCallback((pacingPreference: PacingPreference) => {
    applyOperation({ type: 'update_pacing', pacingPreference })
  }, [applyOperation])

  const updateCaptionPreference = useCallback((captionPreference: CaptionPreference) => {
    applyOperation({ type: 'update_caption_preference', captionPreference })
  }, [applyOperation])

  const updateMusicPreference = useCallback((musicPreference: MusicPreference) => {
    applyOperation({ type: 'update_music_preference', musicPreference })
  }, [applyOperation])

  const updateBRollPreference = useCallback((bRollPreference: string) => {
    applyOperation({ type: 'update_broll_preference', bRollPreference })
  }, [applyOperation])

  const addMustUseAsset = useCallback((mediaAssetId: string) => {
    applyOperation({ type: 'add_must_use_asset', mediaAssetId })
  }, [applyOperation])

  const removeMustUseAsset = useCallback((mediaAssetId: string) => {
    applyOperation({ type: 'remove_must_use_asset', mediaAssetId })
  }, [applyOperation])

  const addAvoidAsset = useCallback((mediaAssetId: string) => {
    applyOperation({ type: 'add_avoid_asset', mediaAssetId })
  }, [applyOperation])

  const removeAvoidAsset = useCallback((mediaAssetId: string) => {
    applyOperation({ type: 'remove_avoid_asset', mediaAssetId })
  }, [applyOperation])

  const addMustIncludeNote = useCallback((note: string) => {
    applyOperation({ type: 'add_must_include_note', note })
  }, [applyOperation])

  const removeMustIncludeNote = useCallback((note: string) => {
    applyOperation({ type: 'remove_must_include_note', note })
  }, [applyOperation])

  const addAvoidNote = useCallback((note: string) => {
    applyOperation({ type: 'add_avoid_note', note })
  }, [applyOperation])

  const removeAvoidNote = useCallback((note: string) => {
    applyOperation({ type: 'remove_avoid_note', note })
  }, [applyOperation])

  const updateBrandNotes = useCallback((brandNotes: string) => {
    applyOperation({ type: 'update_brand_notes', brandNotes })
  }, [applyOperation])

  const updateSpecialInstructions = useCallback((specialInstructions: string) => {
    applyOperation({ type: 'update_special_instructions', specialInstructions })
  }, [applyOperation])

  const updateReferenceUrls = useCallback((referenceUrls: string[]) => {
    applyOperation({ type: 'update_reference_urls', referenceUrls })
  }, [applyOperation])

  const resetBrief = useCallback(() => {
    if (!buildInput) return
    applyOperation({ type: 'reset_brief', rebuildInput: buildInput })
  }, [applyOperation, buildInput])

  const markReady = useCallback(() => {
    applyOperation({ type: 'mark_ready' })
  }, [applyOperation])

  return {
    editBriefState,
    editBrief,
    summary,
    readiness,
    activityEvents,
    isOpen,
    hasStarted,
    openBrief,
    closeBrief,
    updateGoal,
    updateAudience,
    updatePlatforms,
    updateTargetDuration,
    updateStyleKeywords,
    updatePacingPreference,
    updateCaptionPreference,
    updateMusicPreference,
    updateBRollPreference,
    addMustUseAsset,
    removeMustUseAsset,
    addAvoidAsset,
    removeAvoidAsset,
    addMustIncludeNote,
    removeMustIncludeNote,
    addAvoidNote,
    removeAvoidNote,
    updateBrandNotes,
    updateSpecialInstructions,
    updateReferenceUrls,
    resetBrief,
    markReady,
  }
}
