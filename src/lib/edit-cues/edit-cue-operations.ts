import type {
  EditCue,
  EditCueAnchor,
  EditCueAsset,
  EditCueAudioBehavior,
  EditCueOperation,
  EditCueOperationType,
  EditCueRole,
  EditCueVisualBehavior,
  EditCuesState,
  PriorityLevel,
  TimingFlexibility,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'
import {
  buildInitialEditCuesState,
  createEmptyEditCue,
  normalizeEditCueTags,
  type BuildInitialEditCuesStateInput,
} from './edit-cue-builder'
import {
  validateEditCue,
  validateEditCuesState,
  type EditCueValidationContext,
} from './edit-cue-validation'

export type EditCueOperationInput =
  | {
      type: 'create_cue' | 'reset_all'
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'update_title'
      editCueId: string
      title: string
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'update_anchor'
      editCueId: string
      anchor: EditCueAnchor
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'update_role'
      editCueId: string
      role: EditCueRole
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'add_asset'
      editCueId: string
      asset: EditCueAsset
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'remove_asset'
      editCueId: string
      mediaAssetId: string
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'update_priority'
      editCueId: string
      priority: PriorityLevel
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'update_timing_flexibility'
      editCueId: string
      timingFlexibility: TimingFlexibility
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'update_audio_behavior'
      editCueId: string
      audioBehavior: EditCueAudioBehavior
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'update_visual_behavior'
      editCueId: string
      visualBehaviorPatch: Partial<EditCueVisualBehavior>
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'update_instructions'
      editCueId: string
      instructions: string
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'add_tag' | 'remove_tag'
      editCueId: string
      tag: string
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'mark_ready' | 'duplicate_cue' | 'delete_cue'
      editCueId: string
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }

export type ApplyEditCueOperationContext = EditCueValidationContext

function operationId(state: EditCuesState) {
  return `${state.projectId}-edit-cue-operation-${String(state.operations.length + 1).padStart(3, '0')}`
}

function nextCueIndex(state: EditCuesState) {
  return state.cues.length + state.operations.length + 1
}

function operationPatch(input: EditCueOperationInput): Record<string, unknown> | undefined {
  if (input.type === 'update_title') return { title: input.title }
  if (input.type === 'update_anchor') return { anchor: input.anchor }
  if (input.type === 'update_role') return { role: input.role }
  if (input.type === 'add_asset') return { asset: input.asset }
  if (input.type === 'remove_asset') return { mediaAssetId: input.mediaAssetId }
  if (input.type === 'update_priority') return { priority: input.priority }
  if (input.type === 'update_timing_flexibility') return { timingFlexibility: input.timingFlexibility }
  if (input.type === 'update_audio_behavior') return { audioBehavior: input.audioBehavior }
  if (input.type === 'update_visual_behavior') return { visualBehaviorPatch: input.visualBehaviorPatch }
  if (input.type === 'update_instructions') return { instructions: input.instructions }
  if (input.type === 'add_tag' || input.type === 'remove_tag') return { tag: input.tag }
  return undefined
}

export function createEditCueOperation(
  state: EditCuesState,
  input: EditCueOperationInput,
): EditCueOperation {
  return {
    id: operationId(state),
    projectId: state.projectId,
    workspaceId: state.workspaceId,
    userId: state.userId,
    editCueId: 'editCueId' in input ? input.editCueId : undefined,
    type: input.type,
    status: 'applied',
    createdBy: input.createdBy ?? 'user',
    createdAt: MOCK_CREATED_AT,
    patch: operationPatch(input),
    explanation: input.explanation,
  }
}

function touchCue(cue: EditCue, forceDraft = true): EditCue {
  return {
    ...cue,
    status: forceDraft && cue.status === 'ready' ? 'draft' : cue.status,
    updatedAt: MOCK_CREATED_AT,
  }
}

function addAsset(cue: EditCue, asset: EditCueAsset): EditCue {
  if (cue.assetRefs.some((item) => item.mediaAssetId === asset.mediaAssetId)) {
    return cue
  }

  return {
    ...cue,
    assetRefs: [...cue.assetRefs, asset],
  }
}

function updateCue(cue: EditCue, input: EditCueOperationInput): EditCue {
  if (!('editCueId' in input) || cue.id !== input.editCueId) return cue

  if (input.type === 'update_title') return touchCue({ ...cue, title: input.title })
  if (input.type === 'update_anchor') return touchCue({ ...cue, anchor: input.anchor })
  if (input.type === 'update_role') return touchCue({ ...cue, role: input.role })
  if (input.type === 'add_asset') return touchCue(addAsset(cue, input.asset))
  if (input.type === 'remove_asset') return touchCue({ ...cue, assetRefs: cue.assetRefs.filter((asset) => asset.mediaAssetId !== input.mediaAssetId) })
  if (input.type === 'update_priority') return touchCue({ ...cue, priority: input.priority })
  if (input.type === 'update_timing_flexibility') return touchCue({ ...cue, timingFlexibility: input.timingFlexibility })
  if (input.type === 'update_audio_behavior') return touchCue({ ...cue, audioBehavior: input.audioBehavior })
  if (input.type === 'update_visual_behavior') return touchCue({ ...cue, visualBehavior: { ...cue.visualBehavior, ...input.visualBehaviorPatch } })
  if (input.type === 'update_instructions') return touchCue({ ...cue, instructions: input.instructions })
  if (input.type === 'add_tag') return touchCue({ ...cue, tags: normalizeEditCueTags([...cue.tags, input.tag]) })
  if (input.type === 'remove_tag') return touchCue({ ...cue, tags: cue.tags.filter((tag) => tag !== input.tag.trim().toLowerCase()) })

  return cue
}

function createCopiedCue(state: EditCuesState, cue: EditCue): EditCue {
  return {
    ...cue,
    id: `${state.projectId}-edit-cue-${String(nextCueIndex(state)).padStart(3, '0')}`,
    title: `${cue.title} Copy`,
    status: 'draft',
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}

function applyMarkReady(cues: EditCue[], input: EditCueOperationInput, context: ApplyEditCueOperationContext): EditCue[] {
  if (input.type !== 'mark_ready') return cues

  return cues.map((cue) => {
    if (cue.id !== input.editCueId) return cue

    const blockingIssues = validateEditCue(cue, context).filter((issue) => issue.severity === 'blocking')
    return {
      ...cue,
      status: blockingIssues.length === 0 ? 'ready' : 'conflict',
      updatedAt: MOCK_CREATED_AT,
    }
  })
}

export function createInitialEditCuesState(input: BuildInitialEditCuesStateInput): EditCuesState {
  return buildInitialEditCuesState(input)
}

export function applyEditCueOperation(
  state: EditCuesState,
  input: EditCueOperationInput,
  context: ApplyEditCueOperationContext = {},
): EditCuesState {
  const operation = createEditCueOperation(state, input)

  if (input.type === 'reset_all') {
    return {
      ...state,
      cues: [],
      operations: [operation],
      validationIssues: [],
      updatedAt: MOCK_CREATED_AT,
    }
  }

  let cues = state.cues

  if (input.type === 'create_cue') {
    cues = [
      ...cues,
      createEmptyEditCue({
        projectId: state.projectId,
        workspaceId: state.workspaceId,
        userId: state.userId,
        cleanAssemblyId: state.cleanAssemblyId,
        editBriefId: state.editBriefId,
        cueIndex: nextCueIndex(state),
      }),
    ]
  } else if (input.type === 'duplicate_cue') {
    const sourceCue = state.cues.find((cue) => cue.id === input.editCueId)
    cues = sourceCue ? [...cues, createCopiedCue(state, sourceCue)] : cues
  } else if (input.type === 'delete_cue') {
    cues = cues.filter((cue) => cue.id !== input.editCueId)
  } else {
    cues = cues.map((cue) => updateCue(cue, input))
    cues = applyMarkReady(cues, input, context)
  }

  const operations = [...state.operations, operation]
  const nextState = {
    ...state,
    cues,
    operations,
    updatedAt: MOCK_CREATED_AT,
  }

  return {
    ...nextState,
    validationIssues: validateEditCuesState(nextState, context),
  }
}

export function createEditCue(state: EditCuesState, context?: ApplyEditCueOperationContext) {
  return applyEditCueOperation(state, { type: 'create_cue' }, context)
}

export function updateEditCueTitle(state: EditCuesState, editCueId: string, title: string, context?: ApplyEditCueOperationContext) {
  return applyEditCueOperation(state, { type: 'update_title', editCueId, title }, context)
}

export function updateEditCueAnchor(state: EditCuesState, editCueId: string, anchor: EditCueAnchor, context?: ApplyEditCueOperationContext) {
  return applyEditCueOperation(state, { type: 'update_anchor', editCueId, anchor }, context)
}

export function updateEditCueRole(state: EditCuesState, editCueId: string, role: EditCueRole, context?: ApplyEditCueOperationContext) {
  return applyEditCueOperation(state, { type: 'update_role', editCueId, role }, context)
}

export function addEditCueAsset(state: EditCuesState, editCueId: string, asset: EditCueAsset, context?: ApplyEditCueOperationContext) {
  return applyEditCueOperation(state, { type: 'add_asset', editCueId, asset }, context)
}

export function removeEditCueAsset(state: EditCuesState, editCueId: string, mediaAssetId: string, context?: ApplyEditCueOperationContext) {
  return applyEditCueOperation(state, { type: 'remove_asset', editCueId, mediaAssetId }, context)
}

export function updateEditCuePriority(state: EditCuesState, editCueId: string, priority: PriorityLevel, context?: ApplyEditCueOperationContext) {
  return applyEditCueOperation(state, { type: 'update_priority', editCueId, priority }, context)
}

export function updateEditCueTimingFlexibility(state: EditCuesState, editCueId: string, timingFlexibility: TimingFlexibility, context?: ApplyEditCueOperationContext) {
  return applyEditCueOperation(state, { type: 'update_timing_flexibility', editCueId, timingFlexibility }, context)
}

export function updateEditCueAudioBehavior(state: EditCuesState, editCueId: string, audioBehavior: EditCueAudioBehavior, context?: ApplyEditCueOperationContext) {
  return applyEditCueOperation(state, { type: 'update_audio_behavior', editCueId, audioBehavior }, context)
}

export function updateEditCueVisualBehavior(state: EditCuesState, editCueId: string, visualBehaviorPatch: Partial<EditCueVisualBehavior>, context?: ApplyEditCueOperationContext) {
  return applyEditCueOperation(state, { type: 'update_visual_behavior', editCueId, visualBehaviorPatch }, context)
}

export function updateEditCueInstructions(state: EditCuesState, editCueId: string, instructions: string, context?: ApplyEditCueOperationContext) {
  return applyEditCueOperation(state, { type: 'update_instructions', editCueId, instructions }, context)
}

export function addEditCueTag(state: EditCuesState, editCueId: string, tag: string, context?: ApplyEditCueOperationContext) {
  return applyEditCueOperation(state, { type: 'add_tag', editCueId, tag }, context)
}

export function removeEditCueTag(state: EditCuesState, editCueId: string, tag: string, context?: ApplyEditCueOperationContext) {
  return applyEditCueOperation(state, { type: 'remove_tag', editCueId, tag }, context)
}

export function markEditCueReady(state: EditCuesState, editCueId: string, context?: ApplyEditCueOperationContext) {
  return applyEditCueOperation(state, { type: 'mark_ready', editCueId }, context)
}

export function duplicateEditCue(state: EditCuesState, editCueId: string, context?: ApplyEditCueOperationContext) {
  return applyEditCueOperation(state, { type: 'duplicate_cue', editCueId }, context)
}

export function deleteEditCue(state: EditCuesState, editCueId: string, context?: ApplyEditCueOperationContext) {
  return applyEditCueOperation(state, { type: 'delete_cue', editCueId }, context)
}

export function resetEditCues(state: EditCuesState, context?: ApplyEditCueOperationContext) {
  return applyEditCueOperation(state, { type: 'reset_all' }, context)
}

export type { EditCueOperationType }
