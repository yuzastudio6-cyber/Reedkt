import type {
  EditElement,
  EditGroup,
  EditMapSelectionSource,
  EditMapState,
  EditScope,
  EditSelection,
  EditSystem,
} from '../../types'

type ResolveEditMapSelectionInput = {
  state: EditMapState
  elementId?: string
  groupId?: string
  systemId?: string
  source: EditMapSelectionSource
}

type ResolvedEditMapSelection = {
  selection?: EditSelection
  resolvedElement?: EditElement
  resolvedGroup?: EditGroup
  resolvedSystem?: EditSystem
  defaultScope: EditScope
}

function scopeForElement(group?: EditGroup, system?: EditSystem): EditScope {
  if (group?.type === 'caption_group' || system?.kind === 'captions') return 'group'
  return group?.defaultEditScope ?? 'group'
}

export function resolveEditMapSelection({
  elementId,
  groupId,
  state,
  systemId,
}: ResolveEditMapSelectionInput): ResolvedEditMapSelection {
  if (elementId) {
    const resolvedElement = state.elements.find((element) => element.id === elementId)
    const resolvedGroup = resolvedElement
      ? state.groups.find((group) => group.id === resolvedElement.groupId)
      : undefined
    const resolvedSystem = resolvedElement
      ? state.systems.find((system) => system.id === resolvedElement.systemId)
      : undefined
    const defaultScope = scopeForElement(resolvedGroup, resolvedSystem)
    if (resolvedElement && resolvedGroup && resolvedSystem) {
      return {
        selection: {
          elementId: resolvedElement.id,
          groupId: resolvedGroup.id,
          systemId: resolvedSystem.id,
          activeScope: defaultScope,
        },
        resolvedElement,
        resolvedGroup,
        resolvedSystem,
        defaultScope,
      }
    }
  }

  if (groupId) {
    const resolvedGroup = state.groups.find((group) => group.id === groupId)
    const resolvedSystem = resolvedGroup
      ? state.systems.find((system) => system.id === resolvedGroup.systemId)
      : undefined
    if (resolvedGroup && resolvedSystem) {
      return {
        selection: {
          groupId: resolvedGroup.id,
          systemId: resolvedSystem.id,
          activeScope: 'group',
        },
        resolvedGroup,
        resolvedSystem,
        defaultScope: 'group',
      }
    }
  }

  if (systemId) {
    const resolvedSystem = state.systems.find((system) => system.id === systemId)
    if (resolvedSystem) {
      return {
        selection: {
          systemId: resolvedSystem.id,
          activeScope: 'system',
        },
        resolvedSystem,
        defaultScope: 'system',
      }
    }
  }

  return {
    selection: state.activeSelection,
    resolvedElement: getSelectedElement(state),
    resolvedGroup: getSelectedGroup(state),
    resolvedSystem: getSelectedSystem(state),
    defaultScope: state.activeSelection?.activeScope ?? state.defaultScope,
  }
}

export function getSelectedElement(state: EditMapState) {
  const elementId = state.activeSelection?.elementId
  return elementId ? state.elements.find((element) => element.id === elementId) : undefined
}

export function getSelectedGroup(state: EditMapState) {
  const selection = state.activeSelection
  if (!selection) return undefined
  if (selection.groupId) return state.groups.find((group) => group.id === selection.groupId)
  const element = getSelectedElement(state)
  return element ? state.groups.find((group) => group.id === element.groupId) : undefined
}

export function getSelectedSystem(state: EditMapState) {
  const selection = state.activeSelection
  if (!selection) return undefined
  if (selection.systemId) return state.systems.find((system) => system.id === selection.systemId)
  const group = getSelectedGroup(state)
  return group ? state.systems.find((system) => system.id === group.systemId) : undefined
}

export function getSelectionLabel(state: EditMapState) {
  const element = getSelectedElement(state)
  if (element) return element.label
  const group = getSelectedGroup(state)
  if (group) return group.name
  const system = getSelectedSystem(state)
  return system?.name
}

export function getAvailableScopesForSelection(state: EditMapState): EditScope[] {
  const selection = state.activeSelection
  const element = getSelectedElement(state)
  const group = getSelectedGroup(state)
  const system = getSelectedSystem(state)

  if (element) {
    if (group?.type === 'caption_group' || system?.kind === 'captions') {
      return ['single_element', 'sentence', 'group', 'system', 'whole_video']
    }
    if (system?.kind === 'b_roll' || system?.kind === 'overlays' || system?.kind === 'text_graphics') {
      return ['single_element', 'scene', 'group', 'system']
    }
    if (system?.kind === 'audio' || system?.kind === 'sound_sync') {
      return ['single_element', 'group', 'system', 'whole_video']
    }
    return ['single_element', 'group', 'system', 'whole_video']
  }

  if (selection?.groupId || group) return ['group', 'system', 'whole_video']
  if (selection?.systemId || system) return ['system', 'whole_video']

  return ['whole_video']
}
