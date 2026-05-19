import type {
  CaptionPlanRecord,
  PacingAnalysisRecord,
} from '../../types/edit-quality'
import type {
  EditPlanSegmentRecord,
  StoryBeatRecord,
  SignatureRouteRecord,
} from '../../types/planning'
import type { MusicCueSheetItemRecord } from '../../types/audio-music'
import type { SFXEventPlanRecord } from '../../types/sfx-director'
import type {
  MasterTimingMapRecord,
  StoryTimingAuthority,
  StoryTimingSegmentRecord,
} from '../../types/storytiming'
import type { TimeRange } from '../../types/shared'
import { createMockId, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'
import { choosePrimaryTimingAuthority } from './storytiming-authority-service'

export interface SegmentTimingSourceContext {
  storyBeats?: StoryBeatRecord[]
  pacingAnalysis?: PacingAnalysisRecord[]
  captionPlans?: CaptionPlanRecord[]
  musicCues?: MusicCueSheetItemRecord[]
  sfxEventPlans?: SFXEventPlanRecord[]
  signatureRoutes?: SignatureRouteRecord[]
}

export interface SegmentFlags {
  hasSpeech: boolean
  hasMusic: boolean
  hasSFX: boolean
  hasCaptions: boolean
  hasSignatureOverlay: boolean
  preserveEmotionalPause: boolean
}

const overlapsRange = (range: TimeRange | undefined, start: number, end: number): boolean => {
  if (!range) {
    return false
  }

  return range.startSeconds < end && range.endSeconds > start
}

const inOutputRange = (seconds: number | undefined, range: TimeRange): boolean =>
  seconds !== undefined && seconds >= range.startSeconds && seconds <= range.endSeconds

export function inferSegmentFlags(
  segment: EditPlanSegmentRecord,
  context: SegmentTimingSourceContext = {},
): SegmentFlags {
  const outputRange = {
    startSeconds: segment.outputStartSeconds,
    endSeconds: segment.outputEndSeconds,
  }
  const hasSpeech = Boolean(segment.transcriptText?.trim())
  const hasMusic = Boolean(context.musicCues?.some((cue) => overlapsRange(cue.timeRange, outputRange.startSeconds, outputRange.endSeconds)))
  const hasSFX = Boolean(
    context.sfxEventPlans?.some((eventPlan) =>
      eventPlan.editPlanSegmentId === segment.id || inOutputRange(eventPlan.hitTimeSeconds ?? eventPlan.anchorTimeSeconds, outputRange),
    ),
  )
  const hasCaptions = hasSpeech && Boolean(context.captionPlans?.some((caption) => caption.captionNeeded !== false))
  const hasSignatureOverlay = Boolean(
    segment.signatureSystem !== 'none' ||
      context.signatureRoutes?.some((route) => route.editPlanSegmentId === segment.id),
  )
  const preserveEmotionalPause = Boolean(
    context.pacingAnalysis?.some((analysis) =>
      analysis.editPlanSegmentId === segment.id &&
      (analysis.preserveEmotionalPauses || analysis.emotionalPauseSecondsToPreserve > 0),
    ),
  )

  return {
    hasSpeech,
    hasMusic,
    hasSFX,
    hasCaptions,
    hasSignatureOverlay,
    preserveEmotionalPause,
  }
}

export function inferSegmentTimingAuthority(
  segment: EditPlanSegmentRecord,
  flags: SegmentFlags,
): StoryTimingAuthority {
  return choosePrimaryTimingAuthority({
    label: segment.segmentPurpose,
    purpose: `${segment.recommendedAction} ${segment.signatureReason}`,
    hasSpeech: flags.hasSpeech,
    hasMusic: flags.hasMusic,
    preserveEmotionalPause: flags.preserveEmotionalPause,
    signatureFocused: flags.hasSignatureOverlay,
  })
}

export function createStoryTimingSegmentFromEditPlanSegment(
  masterTimingMap: MasterTimingMapRecord,
  segment: EditPlanSegmentRecord,
  segmentOrder: number,
  context: SegmentTimingSourceContext = {},
): StoryTimingSegmentRecord {
  const flags = inferSegmentFlags(segment, context)
  const linkedStoryBeat = context.storyBeats?.find(
    (beat) => beat.id === segment.storyBeatId || beat.linkedSegmentIds.includes(segment.id),
  )
  const sourceTimeRange = segment.sourceStartSeconds !== undefined && segment.sourceEndSeconds !== undefined
    ? {
        startSeconds: segment.sourceStartSeconds,
        endSeconds: segment.sourceEndSeconds,
      }
    : undefined

  return {
    id: createMockId('storytiming-segment'),
    masterTimingMapId: masterTimingMap.id,
    projectId: masterTimingMap.projectId,
    editPlanId: masterTimingMap.editPlanId,
    editPlanSegmentId: segment.id,
    storyBeatId: linkedStoryBeat?.id ?? segment.storyBeatId,
    segmentOrder,
    sourceTimeRange,
    outputTimeRange: {
      startSeconds: segment.outputStartSeconds,
      endSeconds: segment.outputEndSeconds,
    },
    purpose: segment.segmentPurpose,
    primaryAuthority: inferSegmentTimingAuthority(segment, flags),
    pacingStyle: context.pacingAnalysis?.find((analysis) => analysis.editPlanSegmentId === segment.id)?.recommendedPacing,
    hasSpeech: flags.hasSpeech,
    hasMusic: flags.hasMusic,
    hasSFX: flags.hasSFX,
    hasCaptions: flags.hasCaptions,
    hasSignatureOverlay: flags.hasSignatureOverlay,
    preserveEmotionalPause: flags.preserveEmotionalPause,
    notes: [
      'Segment timing is derived from the existing edit plan output range.',
      flags.preserveEmotionalPause ? 'Meaningful pause preservation is active for this segment.' : '',
    ].filter(Boolean),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      sourceSystem: 'edit_plan',
      sourceRecordId: segment.id,
    },
  }
}

export function createStoryTimingSegments(
  masterTimingMap: MasterTimingMapRecord,
  editPlanSegments: EditPlanSegmentRecord[],
  context: SegmentTimingSourceContext = {},
): ServiceResult<{ segments: StoryTimingSegmentRecord[]; warnings: string[] }> {
  const sortedSegments = [...editPlanSegments].sort((a, b) => a.segmentOrder - b.segmentOrder)
  const warnings = sortedSegments.length === 0
    ? ['No edit plan segments were provided, so the StoryTiming map has no segment windows.']
    : []
  const segments = sortedSegments.map((segment, index) =>
    createStoryTimingSegmentFromEditPlanSegment(masterTimingMap, segment, index + 1, context),
  )

  return ok({ segments, warnings }, warnings)
}

export function createSegmentTimingSummary(segments: StoryTimingSegmentRecord[]): string {
  const speechSegments = segments.filter((segment) => segment.hasSpeech).length
  const signatureSegments = segments.filter((segment) => segment.hasSignatureOverlay).length

  return `${segments.length} segment windows coordinated; ${speechSegments} protect speech timing and ${signatureSegments} include signature overlay timing.`
}
