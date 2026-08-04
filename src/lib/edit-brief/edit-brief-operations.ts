import type {
  CaptionPreference,
  EditBrief,
  EditBriefOperation,
  EditBriefOperationType,
  EditBriefState,
  EditBriefTargetPlatform,
  MusicPreference,
  PacingPreference,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'
import {
  buildInitialEditBriefState,
  type BuildInitialEditBriefInput,
} from './edit-brief-builder'

export type EditBriefOperationInput =
  | {
      type: 'create_brief' | 'mark_ready'
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'update_goal'
      goal: string
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'update_audience'
      audience: string
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'update_platforms'
      platforms: EditBriefTargetPlatform[]
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'update_target_duration'
      targetDurationMs?: number
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'update_style_keywords'
      styleKeywords: string[]
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'update_pacing'
      pacingPreference: PacingPreference
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'update_caption_preference'
      captionPreference: CaptionPreference
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'update_music_preference'
      musicPreference: MusicPreference
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'update_broll_preference'
      bRollPreference: string
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'add_must_use_asset' | 'remove_must_use_asset' | 'add_avoid_asset' | 'remove_avoid_asset'
      mediaAssetId: string
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'add_must_include_note' | 'remove_must_include_note' | 'add_avoid_note' | 'remove_avoid_note'
      note: string
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'update_brand_notes'
      brandNotes: string
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'update_special_instructions'
      specialInstructions: string
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'update_reference_urls'
      referenceUrls: string[]
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'reset_brief'
      rebuildInput: BuildInitialEditBriefInput
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }

function operationId(state: EditBriefState) {
  return `${state.editBrief.id}-operation-${String(state.operations.length + 1).padStart(3, '0')}`
}

function cleanText(value: string) {
  return value.trim()
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.map(cleanText).filter(Boolean)))
}

function operationPatch(input: EditBriefOperationInput): Record<string, unknown> | undefined {
  if (input.type === 'update_goal') return { goal: input.goal }
  if (input.type === 'update_audience') return { audience: input.audience }
  if (input.type === 'update_platforms') return { targetPlatforms: input.platforms }
  if (input.type === 'update_target_duration') return { targetDurationMs: input.targetDurationMs }
  if (input.type === 'update_style_keywords') return { styleKeywords: input.styleKeywords }
  if (input.type === 'update_pacing') return { pacingPreference: input.pacingPreference }
  if (input.type === 'update_caption_preference') return { captionPreference: input.captionPreference }
  if (input.type === 'update_music_preference') return { musicPreference: input.musicPreference }
  if (input.type === 'update_broll_preference') return { bRollPreference: input.bRollPreference }
  if ('mediaAssetId' in input) return { mediaAssetId: input.mediaAssetId }
  if ('note' in input) return { note: input.note }
  if (input.type === 'update_brand_notes') return { brandNotes: input.brandNotes }
  if (input.type === 'update_special_instructions') return { specialInstructions: input.specialInstructions }
  if (input.type === 'update_reference_urls') return { userProvidedReferenceUrls: input.referenceUrls }
  return undefined
}

export function createEditBriefOperation(
  state: EditBriefState,
  input: EditBriefOperationInput,
): EditBriefOperation {
  return {
    id: operationId(state),
    projectId: state.projectId,
    workspaceId: state.workspaceId,
    userId: state.userId,
    editBriefId: state.editBrief.id,
    type: input.type,
    status: 'applied',
    createdBy: input.createdBy ?? 'user',
    createdAt: MOCK_CREATED_AT,
    patch: operationPatch(input),
    explanation: input.explanation,
  }
}

function nextEditedStatus(input: EditBriefOperationInput, editBrief: EditBrief): EditBrief['status'] {
  if (input.type === 'mark_ready') return 'ready'
  if (input.type === 'reset_brief') return 'draft'
  if (input.type === 'create_brief') return editBrief.status
  if (editBrief.status === 'ready') return 'draft'
  return editBrief.status
}

function applyBriefPatch(editBrief: EditBrief, input: EditBriefOperationInput): EditBrief {
  if (input.type === 'update_goal') return { ...editBrief, goal: input.goal }
  if (input.type === 'update_audience') return { ...editBrief, audience: input.audience }
  if (input.type === 'update_platforms') return { ...editBrief, targetPlatforms: input.platforms }
  if (input.type === 'update_target_duration') return { ...editBrief, targetDurationMs: input.targetDurationMs }
  if (input.type === 'update_style_keywords') return { ...editBrief, styleKeywords: uniqueValues(input.styleKeywords) }
  if (input.type === 'update_pacing') return { ...editBrief, pacingPreference: input.pacingPreference }
  if (input.type === 'update_caption_preference') return { ...editBrief, captionPreference: input.captionPreference }
  if (input.type === 'update_music_preference') return { ...editBrief, musicPreference: input.musicPreference }
  if (input.type === 'update_broll_preference') return { ...editBrief, bRollPreference: input.bRollPreference }

  if (input.type === 'add_must_use_asset') {
    return {
      ...editBrief,
      mustUseAssetIds: uniqueValues([...editBrief.mustUseAssetIds, input.mediaAssetId]),
      avoidAssetIds: editBrief.avoidAssetIds.filter((id) => id !== input.mediaAssetId),
    }
  }

  if (input.type === 'remove_must_use_asset') {
    return {
      ...editBrief,
      mustUseAssetIds: editBrief.mustUseAssetIds.filter((id) => id !== input.mediaAssetId),
    }
  }

  if (input.type === 'add_avoid_asset') {
    return {
      ...editBrief,
      avoidAssetIds: uniqueValues([...editBrief.avoidAssetIds, input.mediaAssetId]),
      mustUseAssetIds: editBrief.mustUseAssetIds.filter((id) => id !== input.mediaAssetId),
    }
  }

  if (input.type === 'remove_avoid_asset') {
    return {
      ...editBrief,
      avoidAssetIds: editBrief.avoidAssetIds.filter((id) => id !== input.mediaAssetId),
    }
  }

  if (input.type === 'add_must_include_note') {
    return {
      ...editBrief,
      mustIncludeNotes: uniqueValues([...editBrief.mustIncludeNotes, input.note]),
    }
  }

  if (input.type === 'remove_must_include_note') {
    return {
      ...editBrief,
      mustIncludeNotes: editBrief.mustIncludeNotes.filter((note) => note !== input.note),
    }
  }

  if (input.type === 'add_avoid_note') {
    return {
      ...editBrief,
      avoidNotes: uniqueValues([...editBrief.avoidNotes, input.note]),
    }
  }

  if (input.type === 'remove_avoid_note') {
    return {
      ...editBrief,
      avoidNotes: editBrief.avoidNotes.filter((note) => note !== input.note),
    }
  }

  if (input.type === 'update_brand_notes') return { ...editBrief, brandNotes: input.brandNotes }
  if (input.type === 'update_special_instructions') return { ...editBrief, specialInstructions: input.specialInstructions }
  if (input.type === 'update_reference_urls') {
    return { ...editBrief, userProvidedReferenceUrls: uniqueValues(input.referenceUrls) }
  }

  return editBrief
}

export function createInitialEditBriefState(input: BuildInitialEditBriefInput): EditBriefState {
  return buildInitialEditBriefState(input)
}

export function applyEditBriefOperation(
  state: EditBriefState,
  input: EditBriefOperationInput,
): EditBriefState {
  const operation = createEditBriefOperation(state, input)

  if (input.type === 'reset_brief') {
    const resetState = buildInitialEditBriefState(input.rebuildInput)

    return {
      ...resetState,
      operations: [operation],
      updatedAt: MOCK_CREATED_AT,
    }
  }

  const patchedBrief = applyBriefPatch(state.editBrief, input)
  const editBrief = {
    ...patchedBrief,
    status: nextEditedStatus(input, state.editBrief),
    updatedAt: MOCK_CREATED_AT,
  }
  const operations = [...state.operations, operation]

  return {
    ...state,
    editBrief,
    operations,
    updatedAt: MOCK_CREATED_AT,
  }
}

export function updateEditBriefGoal(state: EditBriefState, goal: string) {
  return applyEditBriefOperation(state, { type: 'update_goal', goal })
}

export function updateEditBriefAudience(state: EditBriefState, audience: string) {
  return applyEditBriefOperation(state, { type: 'update_audience', audience })
}

export function updateEditBriefPlatforms(state: EditBriefState, platforms: EditBriefTargetPlatform[]) {
  return applyEditBriefOperation(state, { type: 'update_platforms', platforms })
}

export function updateEditBriefTargetDuration(state: EditBriefState, targetDurationMs?: number) {
  return applyEditBriefOperation(state, { type: 'update_target_duration', targetDurationMs })
}

export function updateEditBriefStyleKeywords(state: EditBriefState, styleKeywords: string[]) {
  return applyEditBriefOperation(state, { type: 'update_style_keywords', styleKeywords })
}

export function updateEditBriefPacingPreference(state: EditBriefState, pacingPreference: PacingPreference) {
  return applyEditBriefOperation(state, { type: 'update_pacing', pacingPreference })
}

export function updateEditBriefCaptionPreference(state: EditBriefState, captionPreference: CaptionPreference) {
  return applyEditBriefOperation(state, { type: 'update_caption_preference', captionPreference })
}

export function updateEditBriefMusicPreference(state: EditBriefState, musicPreference: MusicPreference) {
  return applyEditBriefOperation(state, { type: 'update_music_preference', musicPreference })
}

export function updateEditBriefBRollPreference(state: EditBriefState, bRollPreference: string) {
  return applyEditBriefOperation(state, { type: 'update_broll_preference', bRollPreference })
}

export function addEditBriefMustUseAsset(state: EditBriefState, mediaAssetId: string) {
  return applyEditBriefOperation(state, { type: 'add_must_use_asset', mediaAssetId })
}

export function removeEditBriefMustUseAsset(state: EditBriefState, mediaAssetId: string) {
  return applyEditBriefOperation(state, { type: 'remove_must_use_asset', mediaAssetId })
}

export function addEditBriefAvoidAsset(state: EditBriefState, mediaAssetId: string) {
  return applyEditBriefOperation(state, { type: 'add_avoid_asset', mediaAssetId })
}

export function removeEditBriefAvoidAsset(state: EditBriefState, mediaAssetId: string) {
  return applyEditBriefOperation(state, { type: 'remove_avoid_asset', mediaAssetId })
}

export function addEditBriefMustIncludeNote(state: EditBriefState, note: string) {
  return applyEditBriefOperation(state, { type: 'add_must_include_note', note })
}

export function removeEditBriefMustIncludeNote(state: EditBriefState, note: string) {
  return applyEditBriefOperation(state, { type: 'remove_must_include_note', note })
}

export function addEditBriefAvoidNote(state: EditBriefState, note: string) {
  return applyEditBriefOperation(state, { type: 'add_avoid_note', note })
}

export function removeEditBriefAvoidNote(state: EditBriefState, note: string) {
  return applyEditBriefOperation(state, { type: 'remove_avoid_note', note })
}

export function updateEditBriefBrandNotes(state: EditBriefState, brandNotes: string) {
  return applyEditBriefOperation(state, { type: 'update_brand_notes', brandNotes })
}

export function updateEditBriefSpecialInstructions(state: EditBriefState, specialInstructions: string) {
  return applyEditBriefOperation(state, { type: 'update_special_instructions', specialInstructions })
}

export function updateEditBriefReferenceUrls(state: EditBriefState, referenceUrls: string[]) {
  return applyEditBriefOperation(state, { type: 'update_reference_urls', referenceUrls })
}

export function resetEditBrief(state: EditBriefState, rebuildInput: BuildInitialEditBriefInput) {
  return applyEditBriefOperation(state, { type: 'reset_brief', rebuildInput })
}

export function markEditBriefReady(state: EditBriefState) {
  return applyEditBriefOperation(state, { type: 'mark_ready' })
}

export type { EditBriefOperationType }
