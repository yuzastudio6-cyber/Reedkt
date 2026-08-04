import type {
  AssetUsageRole,
  PriorityLevel,
  SourceAssetOperation,
  SourceAssetOperationType,
  SourceLibraryAsset,
  SourceLibraryState,
} from '../../types'
import { MOCK_CREATED_AT, type MockFootagePrepResult } from '../footage-prep'
import {
  buildSourceLibraryFromFootagePrepResult,
  getDefaultAudioPolicyForRole,
  getDefaultPriorityForRole,
} from './source-library-builder'

export type SourceLibraryOperationInput =
  | {
      type: 'accept_ai_suggestion' | 'mark_do_not_use' | 'reset_asset'
      sourceLibraryAssetId: string
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'update_role'
      sourceLibraryAssetId: string
      role: AssetUsageRole
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'update_priority'
      sourceLibraryAssetId: string
      priority: PriorityLevel
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'update_notes'
      sourceLibraryAssetId: string
      notes: string
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'add_tag' | 'remove_tag'
      sourceLibraryAssetId: string
      tag: string
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }
  | {
      type: 'reset_all' | 'confirm_library'
      createdBy?: 'user' | 'ai' | 'system'
      explanation?: string
    }

function operationId(state: SourceLibraryState) {
  return `${state.sourceLibrary.id}-operation-${String(state.operations.length + 1).padStart(3, '0')}`
}

function operationPatch(input: SourceLibraryOperationInput): Record<string, unknown> | undefined {
  if (input.type === 'update_role') return { userRole: input.role }
  if (input.type === 'update_priority') return { priority: input.priority }
  if (input.type === 'update_notes') return { userNotes: input.notes }
  if (input.type === 'add_tag' || input.type === 'remove_tag') return { tag: input.tag }
  return undefined
}

export function createSourceAssetOperation(
  state: SourceLibraryState,
  input: SourceLibraryOperationInput,
): SourceAssetOperation {
  return {
    id: operationId(state),
    projectId: state.sourceLibrary.projectId,
    workspaceId: state.sourceLibrary.workspaceId,
    userId: state.sourceLibrary.userId,
    sourceLibraryId: state.sourceLibrary.id,
    sourceLibraryAssetId: 'sourceLibraryAssetId' in input ? input.sourceLibraryAssetId : undefined,
    type: input.type,
    createdBy: input.createdBy ?? 'user',
    createdAt: MOCK_CREATED_AT,
    patch: operationPatch(input),
    explanation: input.explanation,
  }
}

function resetAsset(asset: SourceLibraryAsset): SourceLibraryAsset {
  return {
    ...asset,
    userRole: asset.aiSuggestedRole,
    priority: getDefaultPriorityForRole(asset.aiSuggestedRole),
    reviewStatus: 'ai_suggested',
    audioPolicy: getDefaultAudioPolicyForRole(asset.aiSuggestedRole),
    userNotes: undefined,
    operationIds: [],
    updatedAt: MOCK_CREATED_AT,
  }
}

function updateAssetWithOperation(asset: SourceLibraryAsset, operation: SourceAssetOperation): SourceLibraryAsset {
  return {
    ...asset,
    operationIds: [...asset.operationIds, operation.id],
    updatedAt: MOCK_CREATED_AT,
  }
}

function applyAssetOperation(asset: SourceLibraryAsset, input: SourceLibraryOperationInput, operation: SourceAssetOperation): SourceLibraryAsset {
  if (!('sourceLibraryAssetId' in input) || input.sourceLibraryAssetId !== asset.id) {
    return asset
  }

  if (input.type === 'accept_ai_suggestion') {
    return updateAssetWithOperation({
      ...asset,
      userRole: asset.aiSuggestedRole,
      priority: getDefaultPriorityForRole(asset.aiSuggestedRole),
      audioPolicy: getDefaultAudioPolicyForRole(asset.aiSuggestedRole),
      reviewStatus: 'user_confirmed',
    }, operation)
  }

  if (input.type === 'update_role') {
    return updateAssetWithOperation({
      ...asset,
      userRole: input.role,
      priority: input.role === 'do_not_use' ? 'do_not_use' : asset.priority,
      audioPolicy: getDefaultAudioPolicyForRole(input.role),
      reviewStatus: input.role === 'do_not_use' ? 'do_not_use' : 'user_modified',
    }, operation)
  }

  if (input.type === 'update_priority') {
    return updateAssetWithOperation({
      ...asset,
      priority: input.priority,
      reviewStatus: asset.reviewStatus === 'do_not_use' ? 'do_not_use' : 'user_modified',
    }, operation)
  }

  if (input.type === 'update_notes') {
    return updateAssetWithOperation({
      ...asset,
      userNotes: input.notes,
      reviewStatus: asset.reviewStatus === 'do_not_use' ? 'do_not_use' : 'user_modified',
    }, operation)
  }

  if (input.type === 'add_tag') {
    return updateAssetWithOperation({
      ...asset,
      tags: Array.from(new Set([...asset.tags, input.tag])).sort(),
      reviewStatus: asset.reviewStatus === 'do_not_use' ? 'do_not_use' : 'user_modified',
    }, operation)
  }

  if (input.type === 'remove_tag') {
    return updateAssetWithOperation({
      ...asset,
      tags: asset.tags.filter((tag) => tag !== input.tag),
      reviewStatus: asset.reviewStatus === 'do_not_use' ? 'do_not_use' : 'user_modified',
    }, operation)
  }

  if (input.type === 'mark_do_not_use') {
    return updateAssetWithOperation({
      ...asset,
      userRole: 'do_not_use',
      priority: 'do_not_use',
      audioPolicy: 'reference_only',
      reviewStatus: 'do_not_use',
    }, operation)
  }

  if (input.type === 'reset_asset') {
    return updateAssetWithOperation(resetAsset(asset), operation)
  }

  return asset
}

function nextLibraryStatus(input: SourceLibraryOperationInput, state: SourceLibraryState) {
  if (input.type === 'confirm_library') return 'confirmed'
  if (input.type === 'reset_all') return 'ai_suggested'
  if (state.sourceLibrary.status === 'confirmed') return 'confirmed'
  return 'user_reviewing'
}

export function createInitialSourceLibraryState(result: MockFootagePrepResult): SourceLibraryState {
  return buildSourceLibraryFromFootagePrepResult(result)
}

export function applySourceLibraryOperation(
  state: SourceLibraryState,
  input: SourceLibraryOperationInput,
  initialState?: SourceLibraryState,
): SourceLibraryState {
  const operation = createSourceAssetOperation(state, input)

  if (input.type === 'reset_all') {
    const resetState = initialState ?? state

    return {
      ...resetState,
      sourceLibrary: {
        ...resetState.sourceLibrary,
        status: 'ai_suggested',
        operationIds: [operation.id],
        confirmedAt: undefined,
        updatedAt: MOCK_CREATED_AT,
      },
      assets: resetState.assets.map(resetAsset),
      operations: [operation],
      updatedAt: MOCK_CREATED_AT,
    }
  }

  const assets = state.assets.map((asset) => applyAssetOperation(asset, input, operation))
  const confirmedAssets = input.type === 'confirm_library'
    ? assets.map((asset) => asset.reviewStatus === 'ai_suggested'
      ? {
          ...asset,
          reviewStatus: 'user_confirmed' as const,
          updatedAt: MOCK_CREATED_AT,
        }
      : asset)
    : assets
  const operations = [...state.operations, operation]

  return {
    sourceLibrary: {
      ...state.sourceLibrary,
      status: nextLibraryStatus(input, state),
      operationIds: operations.map((item) => item.id),
      confirmedAt: input.type === 'confirm_library' ? MOCK_CREATED_AT : state.sourceLibrary.confirmedAt,
      updatedAt: MOCK_CREATED_AT,
    },
    assets: confirmedAssets,
    operations,
    updatedAt: MOCK_CREATED_AT,
  }
}

export function acceptAssetSuggestion(state: SourceLibraryState, sourceLibraryAssetId: string) {
  return applySourceLibraryOperation(state, { type: 'accept_ai_suggestion', sourceLibraryAssetId })
}

export function updateSourceAssetRole(state: SourceLibraryState, sourceLibraryAssetId: string, role: AssetUsageRole) {
  return applySourceLibraryOperation(state, { type: 'update_role', sourceLibraryAssetId, role })
}

export function updateSourceAssetPriority(state: SourceLibraryState, sourceLibraryAssetId: string, priority: PriorityLevel) {
  return applySourceLibraryOperation(state, { type: 'update_priority', sourceLibraryAssetId, priority })
}

export function updateSourceAssetNotes(state: SourceLibraryState, sourceLibraryAssetId: string, notes: string) {
  return applySourceLibraryOperation(state, { type: 'update_notes', sourceLibraryAssetId, notes })
}

export function addSourceAssetTag(state: SourceLibraryState, sourceLibraryAssetId: string, tag: string) {
  return applySourceLibraryOperation(state, { type: 'add_tag', sourceLibraryAssetId, tag })
}

export function removeSourceAssetTag(state: SourceLibraryState, sourceLibraryAssetId: string, tag: string) {
  return applySourceLibraryOperation(state, { type: 'remove_tag', sourceLibraryAssetId, tag })
}

export function markSourceAssetDoNotUse(state: SourceLibraryState, sourceLibraryAssetId: string) {
  return applySourceLibraryOperation(state, { type: 'mark_do_not_use', sourceLibraryAssetId })
}

export function resetSourceAsset(state: SourceLibraryState, sourceLibraryAssetId: string) {
  return applySourceLibraryOperation(state, { type: 'reset_asset', sourceLibraryAssetId })
}

export function resetSourceLibrary(state: SourceLibraryState, initialState?: SourceLibraryState) {
  return applySourceLibraryOperation(state, { type: 'reset_all' }, initialState)
}

export function confirmSourceLibrary(state: SourceLibraryState) {
  return applySourceLibraryOperation(state, { type: 'confirm_library' })
}

export type { SourceAssetOperationType }
