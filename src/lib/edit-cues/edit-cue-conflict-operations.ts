import type {
  CleanAssembly,
  EditCue,
  EditCueConflictOperation,
  EditCueConflictOperationType,
  EditCueConflictResolutionType,
  EditCueConflictState,
  EditCueConflictRecord,
  EditCuesState,
  PriorityLevel,
  SourceLibraryState,
  SourceTimeMapping,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'
import { buildEditCueAssetOptions } from './edit-cue-builder'
import {
  detectEditCueConflicts,
  summarizeEditCueConflicts,
} from './edit-cue-conflicts'
import { remapEditCueAnchorToCleanAssembly, remapEditCuesToCleanAssembly } from './edit-cue-remapping'
import { validateEditCuesState } from './edit-cue-validation'

export type EditCueConflictOperationInput =
  | {
      type: 'resolve_conflict'
      conflictId: string
      resolutionType: EditCueConflictResolutionType
      editCueId?: string
      patch?: Record<string, unknown>
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'ignore_conflict' | 'reset_conflict'
      conflictId: string
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'remap_cue'
      editCueId: string
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'reset_all_conflicts' | 'remap_all_cues'
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }

export type EditCueConflictOperationContext = {
  sourceLibraryState?: SourceLibraryState | null
  cleanAssembly?: CleanAssembly | null
  sourceTimeMappings?: SourceTimeMapping[]
}

type CreateInitialEditCueConflictStateInput = EditCueConflictOperationContext & {
  projectId: string
  workspaceId?: string
  userId?: string
  cues: EditCue[]
}

type ApplyEditCueConflictOperationInput = {
  cueState: EditCuesState
  conflictState: EditCueConflictState
  operationInput: EditCueConflictOperationInput
  context?: EditCueConflictOperationContext
}

function operationId(state: EditCueConflictState) {
  return `${state.projectId}-edit-cue-conflict-operation-${String(state.operations.length + 1).padStart(3, '0')}`
}

function conflictKey(conflict: Pick<EditCueConflictRecord, 'kind' | 'editCueIds' | 'message'>) {
  return `${conflict.kind}:${[...conflict.editCueIds].sort().join('+')}:${conflict.message}`
}

function mergeConflicts(
  detectedConflicts: EditCueConflictRecord[],
  previousConflicts: EditCueConflictRecord[] = [],
  preserveResolved = true,
) {
  const previousByKey = new Map(previousConflicts.map((conflict) => [conflictKey(conflict), conflict]))
  const detectedKeys = new Set(detectedConflicts.map(conflictKey))

  const merged = detectedConflicts.map((conflict) => {
    const previous = previousByKey.get(conflictKey(conflict))
    if (!previous || (!preserveResolved && previous.status !== 'open')) {
      return conflict
    }

    return {
      ...conflict,
      status: previous.status,
      resolutionType: previous.resolutionType,
      resolvedBy: previous.resolvedBy,
      resolvedAt: previous.resolvedAt,
      updatedAt: previous.updatedAt,
    }
  })

  if (!preserveResolved) {
    return merged
  }

  const historicalResolved = previousConflicts.filter((conflict) =>
    conflict.status !== 'open' && !detectedKeys.has(conflictKey(conflict)),
  )

  return [...merged, ...historicalResolved]
}

function buildConflictState(input: {
  cueState: Pick<EditCuesState, 'projectId' | 'workspaceId' | 'userId' | 'cues'>
  context?: EditCueConflictOperationContext
  operations?: EditCueConflictOperation[]
  previousConflicts?: EditCueConflictRecord[]
  preserveResolved?: boolean
}): EditCueConflictState {
  const sourceTimeMappings = input.context?.sourceTimeMappings ?? []
  const remapResults = input.cueState.cues.map((cue) =>
    remapEditCueAnchorToCleanAssembly({
      cue,
      sourceTimeMappings,
      cleanAssemblyId: input.context?.cleanAssembly?.id,
    }),
  )
  const detectedConflicts = detectEditCueConflicts({
    projectId: input.cueState.projectId,
    workspaceId: input.cueState.workspaceId,
    userId: input.cueState.userId,
    cues: input.cueState.cues,
    sourceLibraryState: input.context?.sourceLibraryState,
    cleanAssembly: input.context?.cleanAssembly,
    sourceTimeMappings,
    remapResults,
  })
  const conflicts = mergeConflicts(detectedConflicts, input.previousConflicts, input.preserveResolved)

  return {
    projectId: input.cueState.projectId,
    workspaceId: input.cueState.workspaceId,
    userId: input.cueState.userId,
    conflicts,
    remapResults,
    operations: input.operations ?? [],
    summary: summarizeEditCueConflicts(conflicts, remapResults),
    updatedAt: MOCK_CREATED_AT,
  }
}

function validationContext(context?: EditCueConflictOperationContext) {
  return {
    cleanAssembly: context?.cleanAssembly,
    sourceLibraryState: context?.sourceLibraryState,
    assetOptions: buildEditCueAssetOptions(context?.sourceLibraryState),
  }
}

function isPriorityLevel(value: unknown): value is PriorityLevel {
  return value === 'must_follow' || value === 'prefer' || value === 'optional' || value === 'avoid' || value === 'do_not_use'
}

function updateCuePriority(cues: EditCue[], cueIds: string[], priority: PriorityLevel) {
  return cues.map((cue) =>
    cueIds.includes(cue.id)
      ? { ...cue, priority, status: cue.status === 'ready' ? 'draft' : cue.status, updatedAt: MOCK_CREATED_AT }
      : cue,
  )
}

function markConflict(
  conflicts: EditCueConflictRecord[],
  conflictId: string,
  patch: Partial<EditCueConflictRecord>,
) {
  return conflicts.map((conflict) =>
    conflict.id === conflictId
      ? { ...conflict, ...patch, updatedAt: MOCK_CREATED_AT }
      : conflict,
  )
}

function createEditCueConflictOperation(
  state: EditCueConflictState,
  input: EditCueConflictOperationInput,
): EditCueConflictOperation {
  return {
    id: operationId(state),
    projectId: state.projectId,
    workspaceId: state.workspaceId,
    userId: state.userId,
    editCueId: 'editCueId' in input ? input.editCueId : undefined,
    conflictId: 'conflictId' in input ? input.conflictId : undefined,
    type: input.type,
    createdBy: input.createdBy ?? 'user',
    createdAt: MOCK_CREATED_AT,
    patch: 'patch' in input
      ? { ...input.patch, resolutionType: input.resolutionType }
      : 'resolutionType' in input
        ? { resolutionType: input.resolutionType }
        : undefined,
    explanation: input.explanation,
  }
}

function applyRemapToCue(cue: EditCue, sourceTimeMappings: SourceTimeMapping[]) {
  const remapResult = remapEditCueAnchorToCleanAssembly({ cue, sourceTimeMappings })

  if ((remapResult.status === 'mapped' || remapResult.status === 'partially_mapped') && remapResult.remappedAnchor) {
    return {
      cue: {
        ...cue,
        anchor: remapResult.remappedAnchor,
        updatedAt: MOCK_CREATED_AT,
      },
      remapResult,
    }
  }

  return { cue, remapResult }
}

function applyConflictResolution(
  cues: EditCue[],
  conflict: EditCueConflictRecord | undefined,
  operationInput: Extract<EditCueConflictOperationInput, { type: 'resolve_conflict' }>,
) {
  if (!conflict) return cues

  if (operationInput.resolutionType === 'make_optional') {
    return updateCuePriority(cues, conflict.editCueIds, 'optional')
  }

  if (operationInput.resolutionType === 'change_priority') {
    const priority = isPriorityLevel(operationInput.patch?.priority) ? operationInput.patch.priority : 'prefer'
    return updateCuePriority(cues, operationInput.editCueId ? [operationInput.editCueId] : conflict.editCueIds, priority)
  }

  if (operationInput.resolutionType === 'delete_cue') {
    const cueId = operationInput.editCueId ?? conflict.editCueIds[0]
    return cues.filter((cue) => cue.id !== cueId)
  }

  if (operationInput.resolutionType === 'use_first' || operationInput.resolutionType === 'use_second') {
    const preferredIndex = operationInput.resolutionType === 'use_first' ? 0 : 1
    const optionalCueIds = conflict.editCueIds.filter((_, index) => index !== preferredIndex)
    return updateCuePriority(cues, optionalCueIds, 'optional')
  }

  return cues
}

export function createInitialEditCueConflictState(input: CreateInitialEditCueConflictStateInput): {
  conflictState: EditCueConflictState
  cues: EditCue[]
} {
  const cueState = {
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    cues: input.cues,
  }

  return {
    cues: input.cues,
    conflictState: buildConflictState({
      cueState,
      context: input,
      operations: [],
    }),
  }
}

export function rebuildEditCueConflictState(
  cueState: Pick<EditCuesState, 'projectId' | 'workspaceId' | 'userId' | 'cues'>,
  previousConflictState: EditCueConflictState | null,
  context?: EditCueConflictOperationContext,
): EditCueConflictState {
  return buildConflictState({
    cueState,
    context,
    operations: previousConflictState?.operations ?? [],
    previousConflicts: previousConflictState?.conflicts,
  })
}

export function applyEditCueConflictOperation(input: ApplyEditCueConflictOperationInput): {
  cueState: EditCuesState
  conflictState: EditCueConflictState
  operation: EditCueConflictOperation
} {
  const operation = createEditCueConflictOperation(input.conflictState, input.operationInput)
  const context = input.context ?? {}
  let cues = input.cueState.cues
  let previousConflicts = input.conflictState.conflicts
  let preserveResolved = true
  let operations = [...input.conflictState.operations, operation]

  if (input.operationInput.type === 'remap_all_cues') {
    cues = remapEditCuesToCleanAssembly({
      cues,
      sourceTimeMappings: context.sourceTimeMappings ?? [],
    }).cues
  }

  if (input.operationInput.type === 'remap_cue') {
    const editCueId = input.operationInput.editCueId
    cues = cues.map((cue) =>
      cue.id === editCueId
        ? applyRemapToCue(cue, context.sourceTimeMappings ?? []).cue
        : cue,
    )
  }

  if (input.operationInput.type === 'resolve_conflict') {
    const conflictId = input.operationInput.conflictId
    const conflict = previousConflicts.find((item) => item.id === conflictId)
    cues = applyConflictResolution(cues, conflict, input.operationInput)
    previousConflicts = markConflict(previousConflicts, conflictId, {
      status: 'resolved',
      resolutionType: input.operationInput.resolutionType,
      resolvedBy: input.operationInput.createdBy ?? 'user',
      resolvedAt: MOCK_CREATED_AT,
    })
  }

  if (input.operationInput.type === 'ignore_conflict') {
    previousConflicts = markConflict(previousConflicts, input.operationInput.conflictId, {
      status: 'ignored',
      resolutionType: 'ignored',
      resolvedBy: input.operationInput.createdBy ?? 'user',
      resolvedAt: MOCK_CREATED_AT,
    })
  }

  if (input.operationInput.type === 'reset_conflict') {
    previousConflicts = markConflict(previousConflicts, input.operationInput.conflictId, {
      status: 'open',
      resolutionType: 'unresolved',
      resolvedBy: undefined,
      resolvedAt: undefined,
    })
  }

  if (input.operationInput.type === 'reset_all_conflicts') {
    previousConflicts = input.conflictState.conflicts.map((conflict) => ({
      ...conflict,
      status: 'open',
      resolutionType: 'unresolved',
      resolvedBy: undefined,
      resolvedAt: undefined,
      updatedAt: MOCK_CREATED_AT,
    }))
    operations = [operation]
    preserveResolved = false
  }

  const nextCueState = {
    ...input.cueState,
    cues,
    validationIssues: validateEditCuesState({ ...input.cueState, cues }, validationContext(context)),
    updatedAt: MOCK_CREATED_AT,
  }

  const nextConflictState = buildConflictState({
    cueState: nextCueState,
    context,
    operations,
    previousConflicts,
    preserveResolved,
  })

  return {
    cueState: nextCueState,
    conflictState: nextConflictState,
    operation,
  }
}

export function resolveCueConflict(
  cueState: EditCuesState,
  conflictState: EditCueConflictState,
  conflictId: string,
  resolutionType: EditCueConflictResolutionType,
  context?: EditCueConflictOperationContext,
  editCueId?: string,
  patch?: Record<string, unknown>,
) {
  return applyEditCueConflictOperation({
    cueState,
    conflictState,
    context,
    operationInput: { type: 'resolve_conflict', conflictId, resolutionType, editCueId, patch },
  })
}

export function ignoreCueConflict(
  cueState: EditCuesState,
  conflictState: EditCueConflictState,
  conflictId: string,
  context?: EditCueConflictOperationContext,
) {
  return applyEditCueConflictOperation({
    cueState,
    conflictState,
    context,
    operationInput: { type: 'ignore_conflict', conflictId },
  })
}

export function resetCueConflict(
  cueState: EditCuesState,
  conflictState: EditCueConflictState,
  conflictId: string,
  context?: EditCueConflictOperationContext,
) {
  return applyEditCueConflictOperation({
    cueState,
    conflictState,
    context,
    operationInput: { type: 'reset_conflict', conflictId },
  })
}

export function resetAllCueConflicts(
  cueState: EditCuesState,
  conflictState: EditCueConflictState,
  context?: EditCueConflictOperationContext,
) {
  return applyEditCueConflictOperation({
    cueState,
    conflictState,
    context,
    operationInput: { type: 'reset_all_conflicts' },
  })
}

export function remapOneCue(
  cueState: EditCuesState,
  conflictState: EditCueConflictState,
  editCueId: string,
  context?: EditCueConflictOperationContext,
) {
  return applyEditCueConflictOperation({
    cueState,
    conflictState,
    context,
    operationInput: { type: 'remap_cue', editCueId },
  })
}

export function remapAllCues(
  cueState: EditCuesState,
  conflictState: EditCueConflictState,
  context?: EditCueConflictOperationContext,
) {
  return applyEditCueConflictOperation({
    cueState,
    conflictState,
    context,
    operationInput: { type: 'remap_all_cues' },
  })
}

export type { EditCueConflictOperationType }
