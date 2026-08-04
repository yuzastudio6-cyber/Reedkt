import type { MockFootagePrepResult } from '../footage-prep'
import { MOCK_CREATED_AT, mapRawRangeToCleanRange } from '../footage-prep'
import type {
  CleanAssemblySegment,
  EditBriefState,
  EditCue,
  EditCueAnchorOption,
  EditCueAssetOption,
  EditCuesState,
  EditCuesSummary,
  SceneSegment,
  SourceLibraryState,
  TranscriptSegment,
  WorkflowTimeRange,
} from '../../types'

export type BuildInitialEditCuesStateInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  cleanAssemblyId?: string
  editBriefId?: string
  result?: MockFootagePrepResult | null
  sourceLibraryState?: SourceLibraryState | null
  editBriefState?: EditBriefState | null
}

export type CreateEmptyEditCueInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  cleanAssemblyId?: string
  editBriefId?: string
  cueIndex: number
}

export type BuildEditCueAnchorOptionsInput = {
  result?: MockFootagePrepResult | null
  cleanAssemblySegments?: CleanAssemblySegment[]
  transcriptSegments?: TranscriptSegment[]
  sceneSegments?: SceneSegment[]
  sourceLibraryState?: SourceLibraryState | null
}

function padIndex(index: number) {
  return String(index).padStart(3, '0')
}

function formatSeconds(ms: number) {
  return `${Math.round(ms / 100) / 10}s`
}

function formatRange(range?: WorkflowTimeRange) {
  if (!range) return undefined
  return `${formatSeconds(range.startMs)}-${formatSeconds(range.endMs)}`
}

function cleanText(value: string) {
  return value.trim()
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.map(cleanText).filter(Boolean)))
}

function transcriptCleanRange(segment: TranscriptSegment, result?: MockFootagePrepResult | null) {
  if (!result) return undefined
  return mapRawRangeToCleanRange(segment.sourceRange, result.sourceTimeMappings)
}

function sceneCleanRange(segment: SceneSegment, result?: MockFootagePrepResult | null) {
  if (!result) return undefined
  return mapRawRangeToCleanRange(segment.sourceRange, result.sourceTimeMappings)
}

export function buildInitialEditCuesState(input: BuildInitialEditCuesStateInput): EditCuesState {
  const editBriefId = input.editBriefId ?? input.editBriefState?.editBrief.id
  const cleanAssemblyId = input.cleanAssemblyId ?? input.result?.cleanAssembly.id

  return {
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    cleanAssemblyId,
    editBriefId,
    cues: [],
    operations: [],
    validationIssues: [],
    updatedAt: MOCK_CREATED_AT,
  }
}

export function createEmptyEditCue(input: CreateEmptyEditCueInput): EditCue {
  return {
    id: `${input.projectId}-edit-cue-${padIndex(input.cueIndex)}`,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    editBriefId: input.editBriefId,
    cleanAssemblyId: input.cleanAssemblyId,
    title: 'New edit cue',
    status: 'draft',
    anchor: { type: 'global' },
    role: 'b_roll',
    priority: 'prefer',
    timingFlexibility: 'ai_can_adjust',
    assetRefs: [],
    audioBehavior: 'ai_decides',
    visualBehavior: {
      safeZoneAware: true,
      avoidFaces: true,
      avoidCaptions: true,
      allowAiToImproveComposition: true,
    },
    instructions: '',
    tags: [],
    version: 1,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}

export function buildEditCueAnchorOptions(input: BuildEditCueAnchorOptionsInput): EditCueAnchorOption[] {
  const result = input.result
  const cleanAssemblySegments = input.cleanAssemblySegments ?? result?.cleanAssemblySegments ?? []
  const transcriptSegments = input.transcriptSegments ?? result?.transcriptSegments ?? []
  const sceneSegments = input.sceneSegments ?? result?.sceneSegments ?? []
  const sourceLibraryAssets = input.sourceLibraryState?.assets ?? []

  return [
    {
      id: 'global',
      type: 'global',
      label: 'Global rule',
      description: 'Apply this instruction across the edit plan.',
    },
    ...cleanAssemblySegments.map((segment) => ({
      id: segment.id,
      type: 'time_range' as const,
      label: segment.label ?? 'Clean Assembly segment',
      description: formatRange(segment.cleanAssemblyRange),
      timeRange: segment.cleanAssemblyRange,
    })),
    ...transcriptSegments.map((segment) => {
      const cleanRange = transcriptCleanRange(segment, result)
      return {
        id: segment.id,
        type: 'transcript_range' as const,
        label: segment.text.slice(0, 64),
        description: cleanRange ? `Clean ${formatRange(cleanRange)}` : 'Transcript segment',
        timeRange: cleanRange,
        transcriptText: segment.text,
      }
    }),
    ...sceneSegments.map((segment) => {
      const cleanRange = sceneCleanRange(segment, result)
      return {
        id: segment.id,
        type: 'scene' as const,
        label: segment.label ?? 'Scene segment',
        description: segment.summary ?? formatRange(cleanRange),
        timeRange: cleanRange,
        sceneSegmentId: segment.id,
      }
    }),
    ...sourceLibraryAssets.map((asset) => ({
      id: asset.id,
      type: 'asset' as const,
      label: asset.label,
      description: asset.userRole.replaceAll('_', ' '),
      mediaAssetId: asset.mediaAssetId,
    })),
  ]
}

export function buildEditCueAssetOptions(sourceLibraryState?: SourceLibraryState | null): EditCueAssetOption[] {
  return sourceLibraryState?.assets.map((asset) => {
    const disabled = asset.userRole === 'do_not_use' || asset.priority === 'do_not_use'

    return {
      mediaAssetId: asset.mediaAssetId,
      sourceLibraryAssetId: asset.id,
      label: asset.label,
      role: asset.userRole,
      priority: asset.priority,
      disabled,
      reason: disabled ? 'Marked do-not-use in Source Library' : undefined,
    }
  }) ?? []
}

export function summarizeEditCues(state: EditCuesState): EditCuesSummary {
  const cuesWithWarnings = new Set(state.validationIssues
    .filter((issue) => issue.severity === 'warning' || issue.severity === 'blocking')
    .map((issue) => issue.editCueId))

  return {
    totalCues: state.cues.length,
    readyCues: state.cues.filter((cue) => cue.status === 'ready').length,
    draftCues: state.cues.filter((cue) => cue.status === 'draft').length,
    warningCues: cuesWithWarnings.size,
    blockingIssueCount: state.validationIssues.filter((issue) => issue.severity === 'blocking').length,
    mustFollowCues: state.cues.filter((cue) => cue.priority === 'must_follow').length,
    bRollCues: state.cues.filter((cue) => cue.role === 'b_roll').length,
    overlayCues: state.cues.filter((cue) => cue.role === 'overlay' || cue.role === 'picture_in_picture' || cue.role === 'split_screen' || cue.role === 'text_overlay' || cue.role === 'graphic').length,
    audioCues: state.cues.filter((cue) => cue.role === 'sound_effect' || cue.role === 'music').length,
    globalCues: state.cues.filter((cue) => cue.anchor.type === 'global').length,
    avoidCues: state.cues.filter((cue) => cue.role === 'avoid' || cue.priority === 'avoid' || cue.priority === 'do_not_use').length,
  }
}

export function normalizeEditCueTags(tags: string[]) {
  return uniqueValues(tags.map((tag) => tag.toLowerCase()))
}
