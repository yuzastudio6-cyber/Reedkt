import type {
  EditBrief,
  EditBriefReadinessCheck,
  EditBriefState,
  EditBriefSummary,
  EditBriefTargetPlatform,
  PrepSummary,
  SourceLibraryState,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'

export type BuildInitialEditBriefInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  cleanAssemblyId?: string
  chatSessionId?: string
  sourceChatMessageId?: string
  sourceLibraryState?: SourceLibraryState | null
  prepSummary?: PrepSummary
}

const DEFAULT_TARGET_PLATFORMS: EditBriefTargetPlatform[] = ['tiktok', 'instagram_reels']

function getMustUseAssetIds(sourceLibraryState?: SourceLibraryState | null) {
  return sourceLibraryState?.assets
    .filter((asset) => asset.priority === 'must_follow' && asset.userRole !== 'do_not_use')
    .map((asset) => asset.mediaAssetId) ?? []
}

function getAvoidAssetIds(sourceLibraryState?: SourceLibraryState | null) {
  return sourceLibraryState?.assets
    .filter((asset) => asset.priority === 'do_not_use' || asset.userRole === 'do_not_use')
    .map((asset) => asset.mediaAssetId) ?? []
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

export function buildInitialEditBrief(input: BuildInitialEditBriefInput): EditBrief {
  return {
    id: `${input.projectId}-edit-brief`,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    status: 'draft',
    cleanAssemblyId: input.cleanAssemblyId,
    chatSessionId: input.chatSessionId,
    sourceChatMessageId: input.sourceChatMessageId,
    targetPlatforms: DEFAULT_TARGET_PLATFORMS,
    styleKeywords: [],
    pacingPreference: 'ai_decides',
    captionPreference: 'ai_decides',
    musicPreference: 'ai_decides',
    mustUseAssetIds: uniqueValues(getMustUseAssetIds(input.sourceLibraryState)),
    avoidAssetIds: uniqueValues(getAvoidAssetIds(input.sourceLibraryState)),
    mustIncludeNotes: [],
    avoidNotes: [],
    version: 1,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}

export function buildInitialEditBriefState(input: BuildInitialEditBriefInput): EditBriefState {
  const editBrief = buildInitialEditBrief(input)

  return {
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    editBrief,
    operations: [],
    updatedAt: MOCK_CREATED_AT,
  }
}

export function summarizeEditBrief(editBrief: EditBrief): EditBriefSummary {
  const trimmedGoal = editBrief.goal?.trim()

  return {
    title: trimmedGoal || 'Edit Brief',
    goal: trimmedGoal || undefined,
    targetPlatforms: editBrief.targetPlatforms,
    targetDurationMs: editBrief.targetDurationMs,
    styleKeywords: editBrief.styleKeywords,
    hasEditCues: false,
    cueCount: 0,
  }
}

export function getEditBriefReadiness(editBrief: EditBrief): EditBriefReadinessCheck {
  const hasGoal = Boolean(editBrief.goal?.trim())
  const hasStyle = editBrief.styleKeywords.length > 0
  const hasPlatform = editBrief.targetPlatforms.length > 0
  const missingRecommendedFields = [
    !hasGoal ? 'goal' : undefined,
    !hasPlatform ? 'target platform' : undefined,
    !hasStyle ? 'style' : undefined,
    !editBrief.targetDurationMs ? 'target duration' : undefined,
  ].filter((field): field is string => Boolean(field))

  return {
    ready: hasGoal && hasPlatform,
    warnings: missingRecommendedFields.length > 0
      ? ['Add a goal and platform only when you want this optional brief used as structured planning direction. Style and duration improve the brief.']
      : [],
    missingRecommendedFields,
  }
}
