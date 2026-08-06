import { useCallback, useMemo, useState } from 'react'
import type { MockFootagePrepResult } from '../lib/footage-prep'
import {
  applyEditCueOperation,
  applyEditCueConflictOperation,
  buildEditCueAnchorOptions,
  buildEditCueAssetOptions,
  createEditCueConflictActivityEvent,
  createEditCueActivityEvent,
  createEditCueOperation,
  createInitialEditCueConflictState,
  createInitialEditCuesState,
  hasBlockingCueConflicts,
  rebuildEditCueConflictState,
  summarizeEditCues,
  validateEditCuesState,
  type BuildInitialEditCuesStateInput,
  type EditCueConflictOperationInput,
  type EditCueOperationInput,
} from '../lib/edit-cues'
import type {
  CleanAssembly,
  EditBriefState,
  EditCueAnchor,
  EditCueAsset,
  EditCueAudioBehavior,
  EditCueConflictResolutionType,
  EditCueConflictState,
  EditCueRole,
  EditCueVisualBehavior,
  EditCuesState,
  PriorityLevel,
  SourceLibraryState,
  SourceTimeMapping,
  TimingFlexibility,
  WorkflowActivityEvent,
} from '../types'

type UseEditCuesOptions = {
  enabled?: boolean
  cleanAssembly?: CleanAssembly | null
  sourceTimeMappings?: SourceTimeMapping[]
}

type ResolveConflictOptions = {
  editCueId?: string
  patch?: Record<string, unknown>
}

export interface UseEditCuesResult {
  editCuesState: EditCuesState | null
  cues: EditCuesState['cues']
  summary: ReturnType<typeof summarizeEditCues> | null
  validationIssues: EditCuesState['validationIssues']
  anchorOptions: ReturnType<typeof buildEditCueAnchorOptions>
  assetOptions: ReturnType<typeof buildEditCueAssetOptions>
  conflictState: EditCueConflictState | null
  conflicts: EditCueConflictState['conflicts']
  conflictSummary: EditCueConflictState['summary'] | null
  remapResults: EditCueConflictState['remapResults']
  hasBlockingConflicts: boolean
  activityEvents: WorkflowActivityEvent[]
  isOpen: boolean
  openCues: () => void
  closeCues: () => void
  createCue: () => void
  updateTitle: (editCueId: string, title: string) => void
  updateAnchor: (editCueId: string, anchor: EditCueAnchor) => void
  updateRole: (editCueId: string, role: EditCueRole) => void
  addAsset: (editCueId: string, asset: EditCueAsset) => void
  removeAsset: (editCueId: string, mediaAssetId: string) => void
  updatePriority: (editCueId: string, priority: PriorityLevel) => void
  updateTimingFlexibility: (editCueId: string, value: TimingFlexibility) => void
  updateAudioBehavior: (editCueId: string, value: EditCueAudioBehavior) => void
  updateVisualBehavior: (editCueId: string, patch: Partial<EditCueVisualBehavior>) => void
  updateInstructions: (editCueId: string, instructions: string) => void
  addTag: (editCueId: string, tag: string) => void
  removeTag: (editCueId: string, tag: string) => void
  markReady: (editCueId: string) => void
  duplicateCue: (editCueId: string) => void
  deleteCue: (editCueId: string) => void
  resetCues: () => void
  resolveConflict: (conflictId: string, resolutionType: EditCueConflictResolutionType, options?: ResolveConflictOptions) => void
  ignoreConflict: (conflictId: string) => void
  resetConflict: (conflictId: string) => void
  resetAllConflicts: () => void
  remapCue: (editCueId: string) => void
  remapAllCues: () => void
}

type EditCuesStore = {
  resultKey: string | null
  editCuesState: EditCuesState | null
  conflictState: EditCueConflictState | null
  activityEvents: WorkflowActivityEvent[]
  isOpen: boolean
}

function findEventCue(state: EditCuesState, nextState: EditCuesState, input: EditCueOperationInput) {
  if ('editCueId' in input) {
    return nextState.cues.find((cue) => cue.id === input.editCueId) ?? state.cues.find((cue) => cue.id === input.editCueId)
  }

  if (input.type === 'create_cue') return nextState.cues[nextState.cues.length - 1]
  return undefined
}

function findConflictEventPayload(
  conflictState: EditCueConflictState,
  nextConflictState: EditCueConflictState,
  input: EditCueConflictOperationInput,
) {
  const conflict = 'conflictId' in input
    ? nextConflictState.conflicts.find((item) => item.id === input.conflictId) ?? conflictState.conflicts.find((item) => item.id === input.conflictId)
    : undefined
  const remapResult = 'editCueId' in input
    ? nextConflictState.remapResults.find((item) => item.editCueId === input.editCueId)
    : input.type === 'remap_all_cues'
      ? nextConflictState.remapResults.find((item) => item.status === 'failed' || item.status === 'removed_source')
      : undefined

  return { conflict, remapResult }
}

export function useEditCues(
  result: MockFootagePrepResult | null,
  sourceLibraryState?: SourceLibraryState | null,
  editBriefState?: EditBriefState | null,
  optionsOrEnabled: UseEditCuesOptions | boolean = true,
): UseEditCuesResult {
  const options = typeof optionsOrEnabled === 'boolean' ? null : optionsOrEnabled
  const enabled = typeof optionsOrEnabled === 'boolean' ? optionsOrEnabled : optionsOrEnabled.enabled ?? true
  const cleanAssembly = typeof optionsOrEnabled === 'boolean'
    ? result?.cleanAssembly ?? null
    : optionsOrEnabled.cleanAssembly ?? result?.cleanAssembly ?? null
  const sourceTimeMappings = useMemo(
    () => options?.sourceTimeMappings ?? result?.sourceTimeMappings ?? [],
    [options?.sourceTimeMappings, result?.sourceTimeMappings],
  )

  const [store, setStore] = useState<EditCuesStore>({
    resultKey: null,
    editCuesState: null,
    conflictState: null,
    activityEvents: [],
    isOpen: false,
  })

  const resultKey = result && enabled ? `${result.footagePrepSession.id}:${result.cleanAssembly.id}` : null

  const buildInput = useMemo<BuildInitialEditCuesStateInput | null>(() => {
    if (!result || !enabled) return null

    return {
      projectId: result.cleanupPlan.projectId,
      workspaceId: result.cleanupPlan.workspaceId,
      userId: result.cleanupPlan.userId,
      cleanAssemblyId: cleanAssembly?.id ?? result.cleanAssembly.id,
      editBriefId: editBriefState?.editBrief.id,
      result,
      sourceLibraryState,
      editBriefState,
    }
  }, [cleanAssembly, editBriefState, enabled, result, sourceLibraryState])

  const initialState = useMemo(() => buildInput ? createInitialEditCuesState(buildInput) : null, [buildInput])
  const editCuesState = store.resultKey === resultKey ? store.editCuesState : initialState
  const activityEvents = store.resultKey === resultKey ? store.activityEvents : []
  const isOpen = store.resultKey === resultKey ? store.isOpen : false
  const anchorOptions = useMemo(() => buildEditCueAnchorOptions({ result, sourceLibraryState }), [result, sourceLibraryState])
  const assetOptions = useMemo(() => buildEditCueAssetOptions(sourceLibraryState), [sourceLibraryState])
  const validationContext = useMemo(() => ({
    cleanAssembly,
    sourceLibraryState,
    assetOptions,
  }), [assetOptions, cleanAssembly, sourceLibraryState])
  const validationIssues = useMemo(
    () => editCuesState ? validateEditCuesState(editCuesState, validationContext) : [],
    [editCuesState, validationContext],
  )
  const stateWithCurrentValidation = useMemo(
    () => editCuesState ? { ...editCuesState, validationIssues } : null,
    [editCuesState, validationIssues],
  )
  const summary = stateWithCurrentValidation ? summarizeEditCues(stateWithCurrentValidation) : null
  const conflictContext = useMemo(() => ({
    cleanAssembly,
    sourceLibraryState,
    sourceTimeMappings,
  }), [cleanAssembly, sourceLibraryState, sourceTimeMappings])
  const initialConflictState = useMemo(() => {
    if (!initialState) return null

    return createInitialEditCueConflictState({
      projectId: initialState.projectId,
      workspaceId: initialState.workspaceId,
      userId: initialState.userId,
      cues: initialState.cues,
      cleanAssembly,
      sourceLibraryState,
      sourceTimeMappings,
    }).conflictState
  }, [cleanAssembly, initialState, sourceLibraryState, sourceTimeMappings])
  const storedConflictState = store.resultKey === resultKey ? store.conflictState : initialConflictState
  const conflictState = stateWithCurrentValidation
    ? rebuildEditCueConflictState(stateWithCurrentValidation, storedConflictState, conflictContext)
    : null
  const conflicts = conflictState?.conflicts ?? []
  const conflictSummary = conflictState?.summary ?? null
  const remapResults = conflictState?.remapResults ?? []
  const hasBlockingConflicts = hasBlockingCueConflicts(conflicts)

  const applyOperation = useCallback((operationInput: EditCueOperationInput) => {
    if (!editCuesState || !resultKey) {
      return
    }

    const operation = createEditCueOperation(editCuesState, operationInput)
    const nextState = applyEditCueOperation(editCuesState, operationInput, validationContext)
    const nextConflictState = rebuildEditCueConflictState(
      nextState,
      operationInput.type === 'reset_all' ? null : conflictState,
      conflictContext,
    )
    const eventCue = findEventCue(editCuesState, nextState, operationInput)
    const eventIssues = eventCue ? nextState.validationIssues.filter((issue) => issue.editCueId === eventCue.id) : []
    const nextActivityEvent = createEditCueActivityEvent({
      projectId: nextState.projectId,
      workspaceId: nextState.workspaceId,
      userId: nextState.userId,
      operation,
      cue: eventCue,
      validationIssues: eventIssues,
      progressPercent: 100,
    })

    setStore((current) => ({
      resultKey,
      editCuesState: nextState,
      conflictState: nextConflictState,
      activityEvents: operationInput.type === 'reset_all'
        ? [nextActivityEvent]
        : [
            ...(current.resultKey === resultKey ? current.activityEvents : []),
            nextActivityEvent,
          ],
      isOpen: true,
    }))
  }, [conflictContext, conflictState, editCuesState, resultKey, validationContext])

  const applyConflictOperation = useCallback((operationInput: EditCueConflictOperationInput) => {
    if (!stateWithCurrentValidation || !conflictState || !resultKey) {
      return
    }

    const next = applyEditCueConflictOperation({
      cueState: stateWithCurrentValidation,
      conflictState,
      operationInput,
      context: conflictContext,
    })
    const { conflict, remapResult } = findConflictEventPayload(conflictState, next.conflictState, operationInput)
    const nextActivityEvent = createEditCueConflictActivityEvent({
      projectId: next.cueState.projectId,
      workspaceId: next.cueState.workspaceId,
      userId: next.cueState.userId,
      operation: next.operation,
      conflict,
      remapResult,
      progressPercent: 100,
    })

    setStore((current) => ({
      resultKey,
      editCuesState: next.cueState,
      conflictState: next.conflictState,
      activityEvents: [
        ...(current.resultKey === resultKey ? current.activityEvents : []),
        nextActivityEvent,
      ],
      isOpen: true,
    }))
  }, [conflictContext, conflictState, resultKey, stateWithCurrentValidation])

  const openCues = useCallback(() => {
    if (!initialState || !resultKey) return

    setStore((current) => ({
      resultKey,
      editCuesState: editCuesState ?? initialState,
      conflictState: conflictState ?? initialConflictState,
      activityEvents: current.resultKey === resultKey ? current.activityEvents : [],
      isOpen: true,
    }))
  }, [conflictState, editCuesState, initialConflictState, initialState, resultKey])

  const closeCues = useCallback(() => {
    setStore((current) => ({ ...current, isOpen: false }))
  }, [])

  const createCue = useCallback(() => {
    applyOperation({ type: 'create_cue' })
  }, [applyOperation])

  const updateTitle = useCallback((editCueId: string, title: string) => {
    applyOperation({ type: 'update_title', editCueId, title })
  }, [applyOperation])

  const updateAnchor = useCallback((editCueId: string, anchor: EditCueAnchor) => {
    applyOperation({ type: 'update_anchor', editCueId, anchor })
  }, [applyOperation])

  const updateRole = useCallback((editCueId: string, role: EditCueRole) => {
    applyOperation({ type: 'update_role', editCueId, role })
  }, [applyOperation])

  const addAsset = useCallback((editCueId: string, asset: EditCueAsset) => {
    applyOperation({ type: 'add_asset', editCueId, asset })
  }, [applyOperation])

  const removeAsset = useCallback((editCueId: string, mediaAssetId: string) => {
    applyOperation({ type: 'remove_asset', editCueId, mediaAssetId })
  }, [applyOperation])

  const updatePriority = useCallback((editCueId: string, priority: PriorityLevel) => {
    applyOperation({ type: 'update_priority', editCueId, priority })
  }, [applyOperation])

  const updateTimingFlexibility = useCallback((editCueId: string, timingFlexibility: TimingFlexibility) => {
    applyOperation({ type: 'update_timing_flexibility', editCueId, timingFlexibility })
  }, [applyOperation])

  const updateAudioBehavior = useCallback((editCueId: string, audioBehavior: EditCueAudioBehavior) => {
    applyOperation({ type: 'update_audio_behavior', editCueId, audioBehavior })
  }, [applyOperation])

  const updateVisualBehavior = useCallback((editCueId: string, visualBehaviorPatch: Partial<EditCueVisualBehavior>) => {
    applyOperation({ type: 'update_visual_behavior', editCueId, visualBehaviorPatch })
  }, [applyOperation])

  const updateInstructions = useCallback((editCueId: string, instructions: string) => {
    applyOperation({ type: 'update_instructions', editCueId, instructions })
  }, [applyOperation])

  const addTag = useCallback((editCueId: string, tag: string) => {
    applyOperation({ type: 'add_tag', editCueId, tag })
  }, [applyOperation])

  const removeTag = useCallback((editCueId: string, tag: string) => {
    applyOperation({ type: 'remove_tag', editCueId, tag })
  }, [applyOperation])

  const markReady = useCallback((editCueId: string) => {
    applyOperation({ type: 'mark_ready', editCueId })
  }, [applyOperation])

  const duplicateCue = useCallback((editCueId: string) => {
    applyOperation({ type: 'duplicate_cue', editCueId })
  }, [applyOperation])

  const deleteCue = useCallback((editCueId: string) => {
    applyOperation({ type: 'delete_cue', editCueId })
  }, [applyOperation])

  const resetCues = useCallback(() => {
    applyOperation({ type: 'reset_all' })
  }, [applyOperation])

  const resolveConflict = useCallback((conflictId: string, resolutionType: EditCueConflictResolutionType, options?: ResolveConflictOptions) => {
    applyConflictOperation({
      type: 'resolve_conflict',
      conflictId,
      resolutionType,
      editCueId: options?.editCueId,
      patch: options?.patch,
    })
  }, [applyConflictOperation])

  const ignoreConflict = useCallback((conflictId: string) => {
    applyConflictOperation({ type: 'ignore_conflict', conflictId })
  }, [applyConflictOperation])

  const resetConflict = useCallback((conflictId: string) => {
    applyConflictOperation({ type: 'reset_conflict', conflictId })
  }, [applyConflictOperation])

  const resetAllConflicts = useCallback(() => {
    applyConflictOperation({ type: 'reset_all_conflicts' })
  }, [applyConflictOperation])

  const remapCue = useCallback((editCueId: string) => {
    applyConflictOperation({ type: 'remap_cue', editCueId })
  }, [applyConflictOperation])

  const remapAllCues = useCallback(() => {
    applyConflictOperation({ type: 'remap_all_cues' })
  }, [applyConflictOperation])

  return {
    editCuesState: stateWithCurrentValidation,
    cues: editCuesState?.cues ?? [],
    summary,
    validationIssues,
    anchorOptions,
    assetOptions,
    conflictState,
    conflicts,
    conflictSummary,
    remapResults,
    hasBlockingConflicts,
    activityEvents,
    isOpen,
    openCues,
    closeCues,
    createCue,
    updateTitle,
    updateAnchor,
    updateRole,
    addAsset,
    removeAsset,
    updatePriority,
    updateTimingFlexibility,
    updateAudioBehavior,
    updateVisualBehavior,
    updateInstructions,
    addTag,
    removeTag,
    markReady,
    duplicateCue,
    deleteCue,
    resetCues,
    resolveConflict,
    ignoreConflict,
    resetConflict,
    resetAllConflicts,
    remapCue,
    remapAllCues,
  }
}
