import type {
  CaptionPreference,
  EditBrief,
  EditBriefOperation,
  EditBriefOperationStatus,
  EditBriefOperationType,
  EditBriefState,
  EditBriefStatus,
  EditBriefTargetPlatform,
  MusicPreference,
  PacingPreference,
} from '../../types'

const briefStatuses = new Set<EditBriefStatus>(['draft', 'ready', 'used_in_plan', 'superseded'])
const targetPlatforms = new Set<EditBriefTargetPlatform>([
  'tiktok',
  'instagram_reels',
  'youtube_shorts',
  'youtube',
  'linkedin',
  'facebook',
  'x',
  'website',
  'custom',
])
const pacingPreferences = new Set<PacingPreference>(['slow', 'natural', 'tight', 'fast', 'very_fast', 'ai_decides'])
const captionPreferences = new Set<CaptionPreference>(['none', 'minimal', 'standard', 'dynamic', 'bold_creator', 'premium_subtle', 'ai_decides'])
const musicPreferences = new Set<MusicPreference>(['none', 'subtle', 'energetic', 'cinematic', 'corporate', 'trend_based', 'ai_decides'])
const operationStatuses = new Set<EditBriefOperationStatus>(['pending', 'applied', 'reverted'])
const operationTypes = new Set<EditBriefOperationType>([
  'create_brief',
  'update_goal',
  'update_audience',
  'update_platforms',
  'update_target_duration',
  'update_style_keywords',
  'update_pacing',
  'update_caption_preference',
  'update_music_preference',
  'update_broll_preference',
  'add_must_use_asset',
  'remove_must_use_asset',
  'add_avoid_asset',
  'remove_avoid_asset',
  'add_must_include_note',
  'remove_must_include_note',
  'add_avoid_note',
  'remove_avoid_note',
  'update_brand_notes',
  'update_special_instructions',
  'update_reference_urls',
  'reset_brief',
  'mark_ready',
])

export function parseEditBriefStateForHandoff(
  value: unknown,
  expectedProjectId: string,
  expectedWorkspaceId: string,
): EditBriefState | undefined {
  if (!isRecord(value)) return undefined
  const editBrief = parseEditBrief(value.editBrief, expectedProjectId, expectedWorkspaceId)
  if (!editBrief || value.projectId !== expectedProjectId || typeof value.updatedAt !== 'string') return undefined
  if (value.workspaceId !== undefined && value.workspaceId !== expectedWorkspaceId) return undefined

  return {
    projectId: expectedProjectId,
    workspaceId: expectedWorkspaceId,
    userId: optionalString(value.userId),
    editBrief,
    operations: Array.isArray(value.operations)
      ? value.operations.flatMap((operation) => {
          const parsed = parseEditBriefOperation(operation, expectedProjectId, editBrief.id, expectedWorkspaceId)
          return parsed ? [parsed] : []
        })
      : [],
    updatedAt: value.updatedAt,
  }
}

function parseEditBrief(
  value: unknown,
  expectedProjectId: string,
  expectedWorkspaceId: string,
): EditBrief | undefined {
  if (!isRecord(value)) return undefined
  if (
    typeof value.id !== 'string' ||
    value.projectId !== expectedProjectId ||
    typeof value.status !== 'string' ||
    !briefStatuses.has(value.status as EditBriefStatus) ||
    typeof value.version !== 'number' ||
    !Number.isInteger(value.version) ||
    value.version < 1 ||
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string' ||
    !Array.isArray(value.targetPlatforms) ||
    !Array.isArray(value.styleKeywords) ||
    !Array.isArray(value.mustUseAssetIds) ||
    !Array.isArray(value.avoidAssetIds) ||
    !Array.isArray(value.mustIncludeNotes) ||
    !Array.isArray(value.avoidNotes)
  ) return undefined
  if (value.workspaceId !== undefined && value.workspaceId !== expectedWorkspaceId) return undefined

  const parsedPlatforms = value.targetPlatforms.filter(
    (item): item is EditBriefTargetPlatform => typeof item === 'string' && targetPlatforms.has(item as EditBriefTargetPlatform),
  )
  if (parsedPlatforms.length !== value.targetPlatforms.length) return undefined

  return {
    id: value.id,
    projectId: expectedProjectId,
    workspaceId: expectedWorkspaceId,
    userId: optionalString(value.userId),
    status: value.status as EditBriefStatus,
    cleanAssemblyId: optionalString(value.cleanAssemblyId),
    chatSessionId: optionalString(value.chatSessionId),
    sourceChatMessageId: optionalString(value.sourceChatMessageId),
    goal: optionalString(value.goal),
    audience: optionalString(value.audience),
    targetPlatforms: parsedPlatforms,
    targetDurationMs: optionalPositiveNumber(value.targetDurationMs),
    styleKeywords: stringArray(value.styleKeywords),
    pacingPreference: optionalEnum(value.pacingPreference, pacingPreferences),
    captionPreference: optionalEnum(value.captionPreference, captionPreferences),
    musicPreference: optionalEnum(value.musicPreference, musicPreferences),
    bRollPreference: optionalString(value.bRollPreference),
    mustUseAssetIds: stringArray(value.mustUseAssetIds),
    avoidAssetIds: stringArray(value.avoidAssetIds),
    mustIncludeNotes: stringArray(value.mustIncludeNotes),
    avoidNotes: stringArray(value.avoidNotes),
    brandNotes: optionalString(value.brandNotes),
    specialInstructions: optionalString(value.specialInstructions),
    userProvidedReferenceUrls: Array.isArray(value.userProvidedReferenceUrls)
      ? stringArray(value.userProvidedReferenceUrls)
      : undefined,
    version: value.version,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }
}

function parseEditBriefOperation(
  value: unknown,
  expectedProjectId: string,
  expectedEditBriefId: string,
  expectedWorkspaceId: string,
): EditBriefOperation | undefined {
  if (!isRecord(value)) return undefined
  if (
    typeof value.id !== 'string' ||
    value.projectId !== expectedProjectId ||
    value.editBriefId !== expectedEditBriefId ||
    typeof value.type !== 'string' ||
    !operationTypes.has(value.type as EditBriefOperationType) ||
    typeof value.status !== 'string' ||
    !operationStatuses.has(value.status as EditBriefOperationStatus) ||
    !['user', 'ai', 'system'].includes(String(value.createdBy)) ||
    typeof value.createdAt !== 'string'
  ) return undefined
  if (value.workspaceId !== undefined && value.workspaceId !== expectedWorkspaceId) return undefined

  return {
    id: value.id,
    projectId: expectedProjectId,
    workspaceId: expectedWorkspaceId,
    userId: optionalString(value.userId),
    editBriefId: expectedEditBriefId,
    type: value.type as EditBriefOperationType,
    status: value.status as EditBriefOperationStatus,
    createdBy: value.createdBy as EditBriefOperation['createdBy'],
    createdAt: value.createdAt,
    patch: isRecord(value.patch) ? value.patch : undefined,
    explanation: optionalString(value.explanation),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function optionalPositiveNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined
}

function stringArray(value: unknown[]): string[] {
  return value.filter((item): item is string => typeof item === 'string')
}

function optionalEnum<T extends string>(value: unknown, allowed: Set<T>): T | undefined {
  return typeof value === 'string' && allowed.has(value as T) ? value as T : undefined
}
