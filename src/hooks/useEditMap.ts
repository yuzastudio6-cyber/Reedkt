import { useCallback, useMemo, useState } from 'react'
import {
  buildEditMapState,
  changeEditScope,
  createEditMapActivityEvent,
  deleteEditElement,
  getAvailableScopesForSelection,
  getSelectablePreviewElements,
  getSelectedElement,
  getSelectedGroup,
  getSelectedSystem,
  getSelectionLabel,
  lockEditElement,
  lockEditGroup,
  moveEditElement,
  regenerateEditElement,
  replaceEditElementAsset,
  resetEditMap as resetEditMapState,
  restoreEditElement,
  selectEditElement,
  selectEditGroup,
  selectEditSystem,
  setEditElementVisibility,
  setEditGroupVisibility,
  setEditSystemVisibility,
  summarizeEditMapState,
  toggleSelectedLock as toggleSelectedLockState,
  toggleSelectedVisibility as toggleSelectedVisibilityState,
  unlockEditElement,
  unlockEditGroup,
  updateEditElement,
  updateEditGroupStyle,
} from '../lib/edit-map'
import { MOCK_CREATED_AT } from '../lib/footage-prep'
import type {
  BoundingBox,
  CleanAssembly,
  EditCuesState,
  EditMapSelectionSource,
  EditMapState,
  EditScope,
  MockPreviewJob,
  PlanningContext,
  ProfessionalIntegrationState,
  ProfessionalQaState,
  SourceLibraryState,
  WorkflowActivityEvent,
} from '../types'

type UseEditMapInput = {
  previewJob?: MockPreviewJob | null
  planningContext?: PlanningContext | null
  professionalIntegrationState?: ProfessionalIntegrationState | null
  professionalQaState?: ProfessionalQaState | null
  editCuesState?: EditCuesState | null
  sourceLibraryState?: SourceLibraryState | null
  cleanAssembly?: CleanAssembly | null
  enabled?: boolean
}

type EditMapStore = {
  contextKey: string
  state: EditMapState
  activityEvents: WorkflowActivityEvent[]
}

function getProjectId(input: UseEditMapInput) {
  return input.previewJob?.projectId ??
    input.planningContext?.projectId ??
    input.professionalIntegrationState?.projectId ??
    input.professionalQaState?.projectId ??
    input.editCuesState?.projectId ??
    input.sourceLibraryState?.sourceLibrary.projectId ??
    input.cleanAssembly?.projectId ??
    'mock-project'
}

function getWorkspaceId(input: UseEditMapInput) {
  return input.previewJob?.workspaceId ??
    input.planningContext?.workspaceId ??
    input.professionalIntegrationState?.workspaceId ??
    input.professionalQaState?.workspaceId ??
    input.editCuesState?.workspaceId ??
    input.sourceLibraryState?.sourceLibrary.workspaceId ??
    input.cleanAssembly?.workspaceId
}

function getUserId(input: UseEditMapInput) {
  return input.previewJob?.userId ??
    input.planningContext?.userId ??
    input.professionalIntegrationState?.userId ??
    input.professionalQaState?.userId ??
    input.editCuesState?.userId ??
    input.sourceLibraryState?.sourceLibrary.userId ??
    input.cleanAssembly?.userId
}

function buildContextKey(input: UseEditMapInput) {
  return [
    input.previewJob?.id ?? 'no-preview-job',
    input.previewJob?.status ?? 'idle',
    input.previewJob?.previewId ?? 'no-preview',
    input.previewJob?.completedAt ?? 'not-completed',
    input.planningContext?.id ?? 'no-planning-context',
    input.planningContext?.status ?? 'no-planning-status',
    input.professionalIntegrationState?.professionalIntegrationPlan?.id ?? 'no-professional-integration',
    input.professionalIntegrationState?.summary.status ?? 'no-professional-status',
    input.professionalQaState?.report?.id ?? 'no-qa-report',
    input.professionalQaState?.summary.status ?? 'no-qa-status',
    input.cleanAssembly?.id ?? input.planningContext?.cleanAssembly.cleanAssemblyId ?? 'no-clean-assembly',
  ].join('|')
}

function buildSafeState(input: UseEditMapInput): EditMapState {
  return {
    projectId: getProjectId(input),
    workspaceId: getWorkspaceId(input),
    userId: getUserId(input),
    status: 'not_created',
    editDocument: null,
    systems: [],
    groups: [],
    elements: [],
    versions: [],
    operations: [],
    defaultScope: 'group',
    previewJobId: input.previewJob?.id,
    planningContextId: input.planningContext?.id,
    professionalIntegrationPlanId: input.professionalIntegrationState?.professionalIntegrationPlan?.id,
    qaReportId: input.professionalQaState?.report?.id,
    updatedAt: MOCK_CREATED_AT,
  }
}

const nonRevisionOperationTypes = new Set([
  'create_edit_map',
  'select_element',
  'select_group',
  'select_system',
  'change_scope',
  'reset_edit_map',
])

function getPendingRevisionOperations(state: EditMapState) {
  return state.operations.filter((operation) =>
    operation.status !== 'reverted' && !nonRevisionOperationTypes.has(operation.type),
  )
}

export function useEditMap(input: UseEditMapInput) {
  const {
    cleanAssembly = null,
    editCuesState = null,
    enabled = true,
    planningContext = null,
    previewJob = null,
    professionalIntegrationState = null,
    professionalQaState = null,
    sourceLibraryState = null,
  } = input
  const contextKey = buildContextKey(input)
  const [store, setStore] = useState<EditMapStore | null>(null)
  const buildInput = useMemo(
    () => ({
      projectId: getProjectId(input),
      workspaceId: getWorkspaceId(input),
      userId: getUserId(input),
      previewJob,
      planningContext,
      professionalIntegrationState,
      professionalQaState,
      editCuesState,
      sourceLibraryState,
      cleanAssembly,
    }),
    [
      cleanAssembly,
      editCuesState,
      input,
      planningContext,
      previewJob,
      professionalIntegrationState,
      professionalQaState,
      sourceLibraryState,
    ],
  )
  const activeState = useMemo(
    () => enabled && store?.contextKey === contextKey
      ? store.state
      : buildSafeState(input),
    [contextKey, enabled, input, store],
  )
  const activityEvents = useMemo(
    () => enabled && store?.contextKey === contextKey
      ? store.activityEvents
      : [],
    [contextKey, enabled, store],
  )

  const commitState = useCallback((nextState: EditMapState, nextActivityEvents?: WorkflowActivityEvent[]) => {
    setStore({
      contextKey,
      state: nextState,
      activityEvents: nextActivityEvents ?? activityEvents,
    })
    return nextState
  }, [activityEvents, contextKey])

  const commitOperation = useCallback((nextState: EditMapState, previousState: EditMapState) => {
    const operation = nextState.operations.length > previousState.operations.length
      ? nextState.operations[nextState.operations.length - 1]
      : null
    const nextEvents = operation
      ? [
          ...activityEvents,
          createEditMapActivityEvent({
            projectId: nextState.projectId,
            workspaceId: nextState.workspaceId,
            userId: nextState.userId,
            operation,
            state: nextState,
          }),
        ]
      : activityEvents
    return commitState(nextState, nextEvents)
  }, [activityEvents, commitState])

  const createEditMap = useCallback(() => {
    if (!enabled) return null
    const nextState = buildEditMapState(buildInput)
    const nextEvents = nextState.editDocument
      ? [
          ...activityEvents,
          createEditMapActivityEvent({
            projectId: nextState.projectId,
            workspaceId: nextState.workspaceId,
            userId: nextState.userId,
            state: nextState,
            type: 'edit_map_created',
          }),
        ]
      : activityEvents
    return commitState(nextState, nextEvents)
  }, [activityEvents, buildInput, commitState, enabled])

  const selectElement = useCallback((elementId: string, source: EditMapSelectionSource = 'edit_map_panel') => {
    const nextState = selectEditElement(activeState, elementId, source)
    return commitOperation(nextState, activeState)
  }, [activeState, commitOperation])

  const selectGroup = useCallback((groupId: string, source: EditMapSelectionSource = 'edit_map_panel') => {
    const nextState = selectEditGroup(activeState, groupId, source)
    return commitOperation(nextState, activeState)
  }, [activeState, commitOperation])

  const selectSystem = useCallback((systemId: string, source: EditMapSelectionSource = 'edit_map_panel') => {
    const nextState = selectEditSystem(activeState, systemId, source)
    return commitOperation(nextState, activeState)
  }, [activeState, commitOperation])

  const changeScope = useCallback((scope: EditScope) => {
    const nextState = changeEditScope(activeState, scope)
    return commitOperation(nextState, activeState)
  }, [activeState, commitOperation])

  const setSystemVisibility = useCallback((systemId: string, visible: boolean) => {
    const nextState = setEditSystemVisibility(activeState, systemId, visible)
    return commitOperation(nextState, activeState)
  }, [activeState, commitOperation])

  const setGroupVisibility = useCallback((groupId: string, visible: boolean) => {
    const nextState = setEditGroupVisibility(activeState, groupId, visible)
    return commitOperation(nextState, activeState)
  }, [activeState, commitOperation])

  const setElementVisibility = useCallback((elementId: string, visible: boolean) => {
    const nextState = setEditElementVisibility(activeState, elementId, visible)
    return commitOperation(nextState, activeState)
  }, [activeState, commitOperation])

  const toggleSelectedVisibility = useCallback(() => {
    const nextState = toggleSelectedVisibilityState(activeState)
    return commitOperation(nextState, activeState)
  }, [activeState, commitOperation])

  const lockGroup = useCallback((groupId: string) => {
    const nextState = lockEditGroup(activeState, groupId)
    return commitOperation(nextState, activeState)
  }, [activeState, commitOperation])

  const unlockGroup = useCallback((groupId: string) => {
    const nextState = unlockEditGroup(activeState, groupId)
    return commitOperation(nextState, activeState)
  }, [activeState, commitOperation])

  const lockElement = useCallback((elementId: string) => {
    const nextState = lockEditElement(activeState, elementId)
    return commitOperation(nextState, activeState)
  }, [activeState, commitOperation])

  const unlockElement = useCallback((elementId: string) => {
    const nextState = unlockEditElement(activeState, elementId)
    return commitOperation(nextState, activeState)
  }, [activeState, commitOperation])

  const toggleSelectedLock = useCallback(() => {
    const nextState = toggleSelectedLockState(activeState)
    return commitOperation(nextState, activeState)
  }, [activeState, commitOperation])

  const updateGroupStyle = useCallback((groupId: string, patch: Record<string, unknown>) => {
    const nextState = updateEditGroupStyle(activeState, groupId, patch)
    return commitOperation(nextState, activeState)
  }, [activeState, commitOperation])

  const updateElement = useCallback((elementId: string, patch: Record<string, unknown>) => {
    const nextState = updateEditElement(activeState, elementId, patch)
    return commitOperation(nextState, activeState)
  }, [activeState, commitOperation])

  const moveElement = useCallback((elementId: string, boundsPatch: Partial<BoundingBox>) => {
    const nextState = moveEditElement(activeState, elementId, boundsPatch)
    return commitOperation(nextState, activeState)
  }, [activeState, commitOperation])

  const replaceElementAsset = useCallback((elementId: string, mediaAssetId: string) => {
    const nextState = replaceEditElementAsset(activeState, elementId, mediaAssetId)
    return commitOperation(nextState, activeState)
  }, [activeState, commitOperation])

  const regenerateElement = useCallback((elementId: string) => {
    const nextState = regenerateEditElement(activeState, elementId)
    return commitOperation(nextState, activeState)
  }, [activeState, commitOperation])

  const deleteElement = useCallback((elementId: string) => {
    const nextState = deleteEditElement(activeState, elementId)
    return commitOperation(nextState, activeState)
  }, [activeState, commitOperation])

  const restoreElement = useCallback((elementId: string) => {
    const nextState = restoreEditElement(activeState, elementId)
    return commitOperation(nextState, activeState)
  }, [activeState, commitOperation])

  const resetEditMap = useCallback(() => {
    const nextState = resetEditMapState(activeState, buildInput)
    const nextEvents = [
      ...activityEvents,
      createEditMapActivityEvent({
        projectId: nextState.projectId,
        workspaceId: nextState.workspaceId,
        userId: nextState.userId,
        state: nextState,
        type: 'edit_map_reset',
      }),
    ]
    return commitState(nextState, nextEvents)
  }, [activeState, activityEvents, buildInput, commitState])

  const createPrivateReviewRevisionOperation = useCallback((reviewNote: string) => {
    const note = reviewNote.trim().slice(0, 500)
    if (!enabled || !note) return null

    const baseState = activeState.editDocument
      ? activeState
      : buildEditMapState(buildInput)
    const targetElement = baseState.elements.find((element) => element.visible && !element.locked) ??
      baseState.elements.find((element) => !element.locked) ??
      baseState.elements[0]
    if (!targetElement) {
      if (!activeState.editDocument && baseState.editDocument) commitState(baseState)
      return null
    }

    const nextState = updateEditElement(baseState, targetElement.id, {
      privateReviewRevisionNote: note,
      privateReviewRevisionSource: 'verified_private_internal_review',
      properties: {
        privateReviewRevisionNote: note,
      },
    })
    return commitOperation(nextState, activeState)
  }, [activeState, buildInput, commitOperation, commitState, enabled])

  const selectedElement = useMemo(() => getSelectedElement(activeState), [activeState])
  const selectedGroup = useMemo(() => getSelectedGroup(activeState), [activeState])
  const selectedSystem = useMemo(() => getSelectedSystem(activeState), [activeState])
  const selectedLabel = useMemo(() => getSelectionLabel(activeState), [activeState])
  const availableScopes = useMemo(() => getAvailableScopesForSelection(activeState), [activeState])
  const selectablePreviewElements = useMemo(() => getSelectablePreviewElements(activeState), [activeState])
  const summary = useMemo(() => summarizeEditMapState(activeState), [activeState])
  const pendingOperations = useMemo(() => getPendingRevisionOperations(activeState), [activeState])
  const latestOperation = activeState.operations[activeState.operations.length - 1]

  return {
    editMapState: activeState,
    editDocument: activeState.editDocument,
    systems: activeState.systems,
    groups: activeState.groups,
    elements: activeState.elements,
    versions: activeState.versions,
    operations: activeState.operations,
    pendingOperations,
    latestOperation,
    getPendingRevisionOperations: () => getPendingRevisionOperations(activeState),
    activeSelection: activeState.activeSelection,
    selectedElement,
    selectedGroup,
    selectedSystem,
    selectedLabel,
    availableScopes,
    selectablePreviewElements,
    summary,
    activityEvents,
    createEditMap,
    selectElement,
    selectGroup,
    selectSystem,
    changeScope,
    setSystemVisibility,
    setGroupVisibility,
    setElementVisibility,
    toggleSelectedVisibility,
    lockGroup,
    unlockGroup,
    lockElement,
    unlockElement,
    toggleSelectedLock,
    updateGroupStyle,
    updateElement,
    moveElement,
    replaceElementAsset,
    regenerateElement,
    deleteElement,
    restoreElement,
    createPrivateReviewRevisionOperation,
    resetEditMap,
  }
}
