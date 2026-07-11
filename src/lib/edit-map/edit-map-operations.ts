import type {
  BoundingBox,
  EditMapLocalAction,
  EditMapLocalOperation,
  EditMapSelectionSource,
  EditMapState,
  EditScope,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'
import { buildEditMapState } from './edit-map-builder'
import {
  getSelectedElement,
  getSelectedGroup,
  getSelectedSystem,
  resolveEditMapSelection,
} from './edit-map-selection'

type BuildEditMapStateInput = Parameters<typeof buildEditMapState>[0]

type EditMapOperationInput = {
  type: EditMapLocalAction
  selectionSource?: EditMapSelectionSource
  scope?: EditScope
  systemId?: string
  groupId?: string
  elementId?: string
  visible?: boolean
  patch?: Record<string, unknown>
  explanation?: string
}

function operationId(state: EditMapState) {
  const editDocumentId = state.editDocument?.id ?? `${state.projectId}-edit-document`
  return `${editDocumentId}-operation-${String(state.operations.length + 1).padStart(3, '0')}`
}

function createOperation(
  state: EditMapState,
  input: EditMapOperationInput,
  status: EditMapLocalOperation['status'] = 'applied',
): EditMapLocalOperation {
  return {
    id: operationId(state),
    projectId: state.projectId,
    workspaceId: state.workspaceId,
    userId: state.userId,
    editDocumentId: state.editDocument?.id ?? `${state.projectId}-edit-document`,
    type: input.type,
    status,
    createdBy: 'user',
    createdAt: MOCK_CREATED_AT,
    selectionSource: input.selectionSource,
    scope: input.scope ?? state.activeSelection?.activeScope ?? state.defaultScope,
    targetSystemId: input.systemId,
    targetGroupId: input.groupId,
    targetElementId: input.elementId,
    patch: input.patch,
    explanation: input.explanation,
  }
}

function appendOperation(
  state: EditMapState,
  operation: EditMapLocalOperation,
  status: EditMapState['status'] = 'has_local_changes',
): EditMapState {
  const versions = state.versions.map((version, index) =>
    index === state.versions.length - 1
      ? { ...version, operationIds: [...version.operationIds, operation.id], updatedAt: MOCK_CREATED_AT }
      : version,
  )
  const editDocument = state.editDocument
    ? {
        ...state.editDocument,
        activeSelection: state.activeSelection,
        latestOperationId: operation.id,
        updatedAt: MOCK_CREATED_AT,
      }
    : state.editDocument

  return {
    ...state,
    status,
    editDocument,
    versions,
    operations: [...state.operations, operation],
    updatedAt: MOCK_CREATED_AT,
  }
}

function pendingLockedOperation(state: EditMapState, input: EditMapOperationInput, targetLabel: string) {
  return appendOperation(
    state,
    createOperation(state, {
      ...input,
      explanation: `${targetLabel} is locked. Unlock it before applying this local Edit Map change.`,
    }, 'pending'),
    state.status,
  )
}

function isStylePatch(patch: Record<string, unknown> | undefined): patch is Record<string, unknown> & { stylePresetId?: string } {
  return Boolean(patch)
}

function setSelection(
  state: EditMapState,
  input: EditMapOperationInput,
) {
  const resolved = resolveEditMapSelection({
    state,
    elementId: input.elementId,
    groupId: input.groupId,
    systemId: input.systemId,
    source: input.selectionSource ?? 'system',
  })
  if (!resolved.selection) return state
  const nextState: EditMapState = {
    ...state,
    status: 'editing',
    activeSelection: resolved.selection,
    editDocument: state.editDocument
      ? { ...state.editDocument, activeSelection: resolved.selection, updatedAt: MOCK_CREATED_AT }
      : state.editDocument,
    updatedAt: MOCK_CREATED_AT,
  }
  return appendOperation(
    nextState,
    createOperation(nextState, {
      ...input,
      scope: resolved.selection.activeScope,
      systemId: resolved.selection.systemId,
      groupId: resolved.selection.groupId,
      elementId: resolved.selection.elementId,
      explanation: 'Selection changed locally in the Edit Map.',
    }),
    'editing',
  )
}

function updateScope(state: EditMapState, input: EditMapOperationInput) {
  if (!state.activeSelection || !input.scope) return state
  const activeSelection = {
    ...state.activeSelection,
    activeScope: input.scope,
  }
  const nextState: EditMapState = {
    ...state,
    activeSelection,
    editDocument: state.editDocument
      ? { ...state.editDocument, activeSelection, updatedAt: MOCK_CREATED_AT }
      : state.editDocument,
    updatedAt: MOCK_CREATED_AT,
  }
  return appendOperation(
    nextState,
    createOperation(nextState, {
      ...input,
      explanation: `Edit scope changed to ${input.scope.replace(/_/g, ' ')}.`,
    }),
    'editing',
  )
}

function setSystemVisibility(state: EditMapState, input: EditMapOperationInput) {
  const system = state.systems.find((candidate) => candidate.id === input.systemId)
  if (!system || input.visible === undefined) return state
  if (system.locked) return pendingLockedOperation(state, input, system.name)

  const nextState = {
    ...state,
    systems: state.systems.map((candidate) =>
      candidate.id === system.id
        ? { ...candidate, visible: input.visible ?? candidate.visible, updatedAt: MOCK_CREATED_AT }
        : candidate,
    ),
  }
  return appendOperation(
    nextState,
    createOperation(nextState, {
      ...input,
      patch: { visible: input.visible },
      explanation: `${system.name} visibility set to ${input.visible ? 'shown' : 'hidden'}.`,
    }),
  )
}

function setGroupVisibility(state: EditMapState, input: EditMapOperationInput) {
  const group = state.groups.find((candidate) => candidate.id === input.groupId)
  if (!group || input.visible === undefined) return state
  if (group.locked) return pendingLockedOperation(state, input, group.name)

  const nextState = {
    ...state,
    groups: state.groups.map((candidate) =>
      candidate.id === group.id
        ? { ...candidate, visible: input.visible ?? candidate.visible, updatedAt: MOCK_CREATED_AT }
        : candidate,
    ),
  }
  return appendOperation(
    nextState,
    createOperation(nextState, {
      ...input,
      patch: { visible: input.visible },
      explanation: `${group.name} visibility set to ${input.visible ? 'shown' : 'hidden'}.`,
    }),
  )
}

function setElementVisibility(state: EditMapState, input: EditMapOperationInput) {
  const element = state.elements.find((candidate) => candidate.id === input.elementId)
  if (!element || input.visible === undefined) return state
  if (element.locked) return pendingLockedOperation(state, input, element.label)

  const nextState = {
    ...state,
    elements: state.elements.map((candidate) =>
      candidate.id === element.id
        ? { ...candidate, visible: input.visible ?? candidate.visible, updatedAt: MOCK_CREATED_AT }
        : candidate,
    ),
  }
  return appendOperation(
    nextState,
    createOperation(nextState, {
      ...input,
      patch: { visible: input.visible },
      explanation: `${element.label} visibility set to ${input.visible ? 'shown' : 'hidden'}.`,
    }),
  )
}

function setGroupLock(state: EditMapState, input: EditMapOperationInput, locked: boolean) {
  const group = state.groups.find((candidate) => candidate.id === input.groupId)
  if (!group) return state

  const nextState = {
    ...state,
    groups: state.groups.map((candidate) =>
      candidate.id === group.id
        ? { ...candidate, locked, updatedAt: MOCK_CREATED_AT }
        : candidate,
    ),
  }
  return appendOperation(
    nextState,
    createOperation(nextState, {
      ...input,
      patch: { locked },
      explanation: `${group.name} ${locked ? 'locked' : 'unlocked'} locally.`,
    }),
  )
}

function setElementLock(state: EditMapState, input: EditMapOperationInput, locked: boolean) {
  const element = state.elements.find((candidate) => candidate.id === input.elementId)
  if (!element) return state

  const nextState = {
    ...state,
    elements: state.elements.map((candidate) =>
      candidate.id === element.id
        ? { ...candidate, locked, updatedAt: MOCK_CREATED_AT }
        : candidate,
    ),
  }
  return appendOperation(
    nextState,
    createOperation(nextState, {
      ...input,
      patch: { locked },
      explanation: `${element.label} ${locked ? 'locked' : 'unlocked'} locally.`,
    }),
  )
}

function updateGroupStyle(state: EditMapState, input: EditMapOperationInput) {
  const group = state.groups.find((candidate) => candidate.id === input.groupId)
  if (!group) return state
  if (group.locked) return pendingLockedOperation(state, input, group.name)

  const stylePresetId = typeof input.patch?.stylePresetId === 'string'
    ? input.patch.stylePresetId
    : group.stylePresetId
  const nextState = {
    ...state,
    groups: state.groups.map((candidate) =>
      candidate.id === group.id
        ? { ...candidate, stylePresetId, updatedAt: MOCK_CREATED_AT }
        : candidate,
    ),
  }
  return appendOperation(
    nextState,
    createOperation(nextState, {
      ...input,
      explanation: `${group.name} style patched locally.`,
    }),
  )
}

function updateElement(state: EditMapState, input: EditMapOperationInput) {
  const element = state.elements.find((candidate) => candidate.id === input.elementId)
  if (!element) return state
  if (element.locked) return pendingLockedOperation(state, input, element.label)

  const nextState = {
    ...state,
    elements: state.elements.map((candidate) =>
      candidate.id === element.id
        ? {
            ...candidate,
            properties: { ...candidate.properties, ...(input.patch?.properties as Record<string, unknown> | undefined) },
            overrides: { ...candidate.overrides, ...input.patch },
            updatedAt: MOCK_CREATED_AT,
          }
        : candidate,
    ),
  }
  return appendOperation(
    nextState,
    createOperation(nextState, {
      ...input,
      explanation: `${element.label} updated locally.`,
    }),
  )
}

function moveElement(state: EditMapState, input: EditMapOperationInput) {
  const element = state.elements.find((candidate) => candidate.id === input.elementId)
  if (!element) return state
  if (element.locked) return pendingLockedOperation(state, input, element.label)
  const boundsPatch = input.patch?.visualBounds as Partial<BoundingBox> | undefined

  const nextState = {
    ...state,
    elements: state.elements.map((candidate) =>
      candidate.id === element.id
        ? {
            ...candidate,
            visualBounds: candidate.visualBounds
              ? { ...candidate.visualBounds, ...boundsPatch }
              : candidate.visualBounds,
            overrides: { ...candidate.overrides, movedLocally: true },
            updatedAt: MOCK_CREATED_AT,
          }
        : candidate,
    ),
  }
  return appendOperation(
    nextState,
    createOperation(nextState, {
      ...input,
      explanation: `${element.label} moved locally.`,
    }),
  )
}

function replaceAsset(state: EditMapState, input: EditMapOperationInput) {
  const element = state.elements.find((candidate) => candidate.id === input.elementId)
  if (!element) return state
  if (element.locked) return pendingLockedOperation(state, input, element.label)
  const replacementMediaAssetId = typeof input.patch?.replacementMediaAssetId === 'string'
    ? input.patch.replacementMediaAssetId
    : `${element.id}-replacement-placeholder`

  const nextState = {
    ...state,
    elements: state.elements.map((candidate) =>
      candidate.id === element.id
        ? {
            ...candidate,
            source: {
              ...candidate.source,
              mediaAssetId: replacementMediaAssetId,
            },
            overrides: {
              ...candidate.overrides,
              replacementMediaAssetId,
            },
            updatedAt: MOCK_CREATED_AT,
          }
        : candidate,
    ),
  }
  return appendOperation(
    nextState,
    createOperation(nextState, {
      ...input,
      patch: { replacementMediaAssetId },
      explanation: `${element.label} received a local replacement asset placeholder.`,
    }),
  )
}

function regenerateElement(state: EditMapState, input: EditMapOperationInput) {
  const element = state.elements.find((candidate) => candidate.id === input.elementId)
  if (!element) return state
  if (element.locked) return pendingLockedOperation(state, input, element.label)

  const nextState = {
    ...state,
    elements: state.elements.map((candidate) =>
      candidate.id === element.id
        ? {
            ...candidate,
            overrides: { ...candidate.overrides, regenerationRequested: true },
            updatedAt: MOCK_CREATED_AT,
          }
        : candidate,
    ),
  }
  return appendOperation(
    nextState,
    createOperation(nextState, {
      ...input,
      patch: { regenerationRequested: true },
      explanation: `${element.label} has a local regeneration request. No provider was called.`,
    }),
    'needs_revision',
  )
}

function setDeleted(state: EditMapState, input: EditMapOperationInput, deleted: boolean) {
  const element = state.elements.find((candidate) => candidate.id === input.elementId)
  if (!element) return state
  if (element.locked) return pendingLockedOperation(state, input, element.label)

  const nextState = {
    ...state,
    elements: state.elements.map((candidate) =>
      candidate.id === element.id
        ? {
            ...candidate,
            visible: !deleted,
            overrides: { ...candidate.overrides, deleted },
            updatedAt: MOCK_CREATED_AT,
          }
        : candidate,
    ),
  }
  return appendOperation(
    nextState,
    createOperation(nextState, {
      ...input,
      patch: { deleted, visible: !deleted },
      explanation: `${element.label} ${deleted ? 'deleted' : 'restored'} locally.`,
    }),
  )
}

export function createInitialEditMapState(input: BuildEditMapStateInput): EditMapState {
  return buildEditMapState(input)
}

export function applyEditMapOperation(state: EditMapState, input: EditMapOperationInput): EditMapState {
  if (!state.editDocument && input.type !== 'reset_edit_map') return state

  if (input.type === 'select_element' || input.type === 'select_group' || input.type === 'select_system') {
    return setSelection(state, input)
  }
  if (input.type === 'change_scope') return updateScope(state, input)
  if (input.type === 'set_system_visibility') return setSystemVisibility(state, input)
  if (input.type === 'set_group_visibility') return setGroupVisibility(state, input)
  if (input.type === 'set_element_visibility') return setElementVisibility(state, input)
  if (input.type === 'lock_group') return setGroupLock(state, input, true)
  if (input.type === 'unlock_group') return setGroupLock(state, input, false)
  if (input.type === 'lock_element') return setElementLock(state, input, true)
  if (input.type === 'unlock_element') return setElementLock(state, input, false)
  if (input.type === 'update_group_style' && isStylePatch(input.patch)) return updateGroupStyle(state, input)
  if (input.type === 'update_element') return updateElement(state, input)
  if (input.type === 'move_element') return moveElement(state, input)
  if (input.type === 'replace_asset') return replaceAsset(state, input)
  if (input.type === 'regenerate_element') return regenerateElement(state, input)
  if (input.type === 'delete_element') return setDeleted(state, input, true)
  if (input.type === 'restore_element') return setDeleted(state, input, false)
  if (input.type === 'reset_edit_map') return appendOperation(state, createOperation(state, input), 'ready')

  return state
}

export function selectEditElement(
  state: EditMapState,
  elementId: string,
  source: EditMapSelectionSource = 'edit_map_panel',
) {
  return applyEditMapOperation(state, { type: 'select_element', elementId, selectionSource: source })
}

export function selectEditGroup(
  state: EditMapState,
  groupId: string,
  source: EditMapSelectionSource = 'edit_map_panel',
) {
  return applyEditMapOperation(state, { type: 'select_group', groupId, selectionSource: source })
}

export function selectEditSystem(
  state: EditMapState,
  systemId: string,
  source: EditMapSelectionSource = 'edit_map_panel',
) {
  return applyEditMapOperation(state, { type: 'select_system', systemId, selectionSource: source })
}

export function changeEditScope(state: EditMapState, scope: EditScope) {
  return applyEditMapOperation(state, { type: 'change_scope', scope, selectionSource: 'inspector' })
}

export function setEditSystemVisibility(state: EditMapState, systemId: string, visible: boolean) {
  return applyEditMapOperation(state, { type: 'set_system_visibility', systemId, visible })
}

export function setEditGroupVisibility(state: EditMapState, groupId: string, visible: boolean) {
  return applyEditMapOperation(state, { type: 'set_group_visibility', groupId, visible })
}

export function setEditElementVisibility(state: EditMapState, elementId: string, visible: boolean) {
  return applyEditMapOperation(state, { type: 'set_element_visibility', elementId, visible })
}

export function lockEditGroup(state: EditMapState, groupId: string) {
  return applyEditMapOperation(state, { type: 'lock_group', groupId })
}

export function unlockEditGroup(state: EditMapState, groupId: string) {
  return applyEditMapOperation(state, { type: 'unlock_group', groupId })
}

export function lockEditElement(state: EditMapState, elementId: string) {
  return applyEditMapOperation(state, { type: 'lock_element', elementId })
}

export function unlockEditElement(state: EditMapState, elementId: string) {
  return applyEditMapOperation(state, { type: 'unlock_element', elementId })
}

export function updateEditGroupStyle(state: EditMapState, groupId: string, patch: Record<string, unknown>) {
  return applyEditMapOperation(state, { type: 'update_group_style', groupId, patch })
}

export function updateEditElement(state: EditMapState, elementId: string, patch: Record<string, unknown>) {
  return applyEditMapOperation(state, { type: 'update_element', elementId, patch })
}

export function moveEditElement(state: EditMapState, elementId: string, boundsPatch: Partial<BoundingBox>) {
  return applyEditMapOperation(state, {
    type: 'move_element',
    elementId,
    patch: { visualBounds: boundsPatch },
  })
}

export function replaceEditElementAsset(state: EditMapState, elementId: string, mediaAssetId: string) {
  return applyEditMapOperation(state, {
    type: 'replace_asset',
    elementId,
    patch: { replacementMediaAssetId: mediaAssetId },
  })
}

export function regenerateEditElement(state: EditMapState, elementId: string) {
  return applyEditMapOperation(state, { type: 'regenerate_element', elementId })
}

export function deleteEditElement(state: EditMapState, elementId: string) {
  return applyEditMapOperation(state, { type: 'delete_element', elementId })
}

export function restoreEditElement(state: EditMapState, elementId: string) {
  return applyEditMapOperation(state, { type: 'restore_element', elementId })
}

export function toggleSelectedVisibility(state: EditMapState) {
  const selection = state.activeSelection
  if (!selection) return state
  const element = getSelectedElement(state)
  const group = getSelectedGroup(state)
  const system = getSelectedSystem(state)

  if (selection.activeScope === 'system' && system) {
    return setEditSystemVisibility(state, system.id, !system.visible)
  }
  if ((selection.activeScope === 'group' || selection.groupId) && group && selection.activeScope !== 'single_element') {
    return setEditGroupVisibility(state, group.id, !group.visible)
  }
  if (element) {
    return setEditElementVisibility(state, element.id, !element.visible)
  }
  if (group) return setEditGroupVisibility(state, group.id, !group.visible)
  if (system) return setEditSystemVisibility(state, system.id, !system.visible)
  return state
}

export function toggleSelectedLock(state: EditMapState) {
  const selection = state.activeSelection
  if (!selection) return state
  const element = getSelectedElement(state)
  const group = getSelectedGroup(state)

  if (element && selection.activeScope === 'single_element') {
    return element.locked ? unlockEditElement(state, element.id) : lockEditElement(state, element.id)
  }
  if (group) return group.locked ? unlockEditGroup(state, group.id) : lockEditGroup(state, group.id)
  if (element) return element.locked ? unlockEditElement(state, element.id) : lockEditElement(state, element.id)
  return state
}

export function resetEditMap(_state: EditMapState, rebuildInput: BuildEditMapStateInput) {
  return buildEditMapState(rebuildInput)
}
