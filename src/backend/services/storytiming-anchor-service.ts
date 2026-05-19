import type {
  CutDecisionRecord,
  PacingAnalysisRecord,
  TransitionPlanRecord,
} from '../../types/edit-quality'
import type {
  EditPlanSegmentRecord,
  StoryBeatRecord,
} from '../../types/planning'
import type { MusicCueSheetItemRecord } from '../../types/audio-music'
import type {
  SFXEventPlanRecord,
  SFXTimingAlignmentRecord,
} from '../../types/sfx-director'
import type {
  StrokeMotionBeatRecord,
  StrokeMotionTimingAnchorRecord,
} from '../../types/stroke-motion'
import type {
  MasterTimingMapRecord,
  StoryTimingAnchorType,
  StoryTimingPriority,
  StoryTimingSegmentRecord,
  StoryTimingSourceSystem,
  TimingAnchorRecord,
} from '../../types/storytiming'
import { createMockId, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'
import {
  chooseAnchorAuthority,
  chooseTimingPriority,
} from './storytiming-authority-service'

export interface TimingAnchorSourceContext {
  editPlanSegments?: EditPlanSegmentRecord[]
  storyBeats?: StoryBeatRecord[]
  pacingAnalysis?: PacingAnalysisRecord[]
  cutDecisions?: CutDecisionRecord[]
  transitionPlans?: TransitionPlanRecord[]
  musicCues?: MusicCueSheetItemRecord[]
  sfxEventPlans?: SFXEventPlanRecord[]
  sfxTimingAlignments?: SFXTimingAlignmentRecord[]
  strokeMotionBeats?: StrokeMotionBeatRecord[]
  strokeMotionTimingAnchors?: StrokeMotionTimingAnchorRecord[]
}

interface AnchorInput {
  masterTimingMap: MasterTimingMapRecord
  segments?: StoryTimingSegmentRecord[]
  sourceSystem: StoryTimingSourceSystem
  sourceRecordId?: string
  sourceTableName?: string
  anchorType: StoryTimingAnchorType
  anchorLabel: string
  anchorText?: string
  timeSeconds: number
  endTimeSeconds?: number
  importance?: StoryTimingPriority
  locked?: boolean
  notes?: string[]
}

const findSegmentForTime = (
  segments: StoryTimingSegmentRecord[] | undefined,
  timeSeconds: number,
): StoryTimingSegmentRecord | undefined =>
  segments?.find(
    (segment) =>
      timeSeconds >= segment.outputTimeRange.startSeconds &&
      timeSeconds <= segment.outputTimeRange.endSeconds,
  )

const createAnchor = (input: AnchorInput): TimingAnchorRecord => {
  const authority = chooseAnchorAuthority(input.anchorType, input.sourceSystem)
  const segment = findSegmentForTime(input.segments, input.timeSeconds)

  return {
    id: createMockId('timing-anchor'),
    masterTimingMapId: input.masterTimingMap.id,
    projectId: input.masterTimingMap.projectId,
    editPlanId: input.masterTimingMap.editPlanId,
    segmentId: segment?.id,
    sourceSystem: input.sourceSystem,
    sourceRecordId: input.sourceRecordId,
    sourceRef: {
      sourceSystem: input.sourceSystem,
      sourceRecordId: input.sourceRecordId,
      sourceTableName: input.sourceTableName,
      label: input.anchorLabel,
    },
    anchorType: input.anchorType,
    anchorLabel: input.anchorLabel,
    anchorText: input.anchorText,
    timeSeconds: input.timeSeconds,
    endTimeSeconds: input.endTimeSeconds,
    frameNumber: Math.round(input.timeSeconds * input.masterTimingMap.frameRate),
    importance: input.importance ?? chooseTimingPriority(input.sourceSystem, authority),
    primaryAuthority: authority,
    syncMode: authority === 'music_rhythm' ? 'beat_locked' : authority === 'sfx_hit' ? 'frame_locked' : 'loose',
    locked: input.locked ?? false,
    notes: input.notes ?? [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {},
  }
}

export function createAnchorsFromStoryBeats(
  masterTimingMap: MasterTimingMapRecord,
  storyBeats: StoryBeatRecord[] = [],
  segments: StoryTimingSegmentRecord[] = [],
): TimingAnchorRecord[] {
  return storyBeats
    .filter((beat) => beat.timeRange)
    .map((beat) =>
      createAnchor({
        masterTimingMap,
        segments,
        sourceSystem: 'story_beat',
        sourceRecordId: beat.id,
        sourceTableName: 'story_beats',
        anchorType: beat.label.toLowerCase().includes('emotion') ? 'emotional_shift' : 'phrase',
        anchorLabel: beat.label,
        anchorText: beat.purpose,
        timeSeconds: beat.timeRange?.startSeconds ?? 0,
        endTimeSeconds: beat.timeRange?.endSeconds,
        importance: 'high',
        notes: ['Story beat timing preserves meaning structure.'],
      }),
    )
}

export function createAnchorsFromEditSegments(
  masterTimingMap: MasterTimingMapRecord,
  editPlanSegments: EditPlanSegmentRecord[] = [],
  segments: StoryTimingSegmentRecord[] = [],
): TimingAnchorRecord[] {
  return editPlanSegments.flatMap((segment) => [
    createAnchor({
      masterTimingMap,
      segments,
      sourceSystem: 'edit_plan',
      sourceRecordId: segment.id,
      sourceTableName: 'edit_plan_segments',
      anchorType: 'scene_change',
      anchorLabel: `${segment.segmentPurpose} starts`,
      anchorText: segment.transcriptText,
      timeSeconds: segment.outputStartSeconds,
      importance: 'medium',
      notes: ['Output segment start from the approved edit plan.'],
    }),
    createAnchor({
      masterTimingMap,
      segments,
      sourceSystem: 'edit_plan',
      sourceRecordId: segment.id,
      sourceTableName: 'edit_plan_segments',
      anchorType: segment.transcriptText ? 'sentence' : 'manual',
      anchorLabel: `${segment.segmentPurpose} ends`,
      anchorText: segment.transcriptText,
      timeSeconds: segment.outputEndSeconds,
      importance: 'medium',
      notes: ['Output segment end from the approved edit plan.'],
    }),
  ])
}

export function createAnchorsFromPacingAnalysis(
  masterTimingMap: MasterTimingMapRecord,
  pacingAnalysis: PacingAnalysisRecord[] = [],
  segments: StoryTimingSegmentRecord[] = [],
): TimingAnchorRecord[] {
  return pacingAnalysis
    .filter((analysis) => analysis.preserveEmotionalPauses || analysis.emotionalPauseSecondsToPreserve > 0)
    .map((analysis) =>
      createAnchor({
        masterTimingMap,
        segments,
        sourceSystem: 'pacing_analysis',
        sourceRecordId: analysis.id,
        sourceTableName: 'pacing_analysis',
        anchorType: 'pause',
        anchorLabel: 'Preserve emotional pause',
        timeSeconds: analysis.timeRange.startSeconds,
        endTimeSeconds: analysis.timeRange.endSeconds,
        importance: 'critical',
        locked: true,
        notes: [analysis.recommendedPaceSummary],
      }),
    )
}

export function createAnchorsFromCutDecisions(
  masterTimingMap: MasterTimingMapRecord,
  cutDecisions: CutDecisionRecord[] = [],
  segments: StoryTimingSegmentRecord[] = [],
): TimingAnchorRecord[] {
  return cutDecisions.map((cut) =>
    createAnchor({
      masterTimingMap,
      segments,
      sourceSystem: 'cut_decision',
      sourceRecordId: cut.id,
      sourceTableName: 'cut_decisions',
      anchorType: 'cut',
      anchorLabel: cut.reason,
      timeSeconds: cut.outputTimeRange?.startSeconds ?? cut.timeRange.startSeconds,
      importance: cut.affectsSentence ? 'critical' : 'high',
      locked: cut.preserveContext,
      notes: cut.workerNotes,
    }),
  )
}

export function createAnchorsFromTransitions(
  masterTimingMap: MasterTimingMapRecord,
  transitionPlans: TransitionPlanRecord[] = [],
  segments: StoryTimingSegmentRecord[] = [],
): TimingAnchorRecord[] {
  return transitionPlans.flatMap((transition, index) => {
    const fromSegment = segments.find((segment) => segment.editPlanSegmentId === transition.fromSegmentId)
    const toSegment = segments.find((segment) => segment.editPlanSegmentId === transition.toSegmentId)
    const start = Math.max(0, (toSegment?.outputTimeRange.startSeconds ?? fromSegment?.outputTimeRange.endSeconds ?? index) - transition.durationSeconds)
    const end = toSegment?.outputTimeRange.startSeconds ?? start + transition.durationSeconds

    return [
      createAnchor({
        masterTimingMap,
        segments,
        sourceSystem: 'transition_plan',
        sourceRecordId: transition.id,
        sourceTableName: 'transition_plans',
        anchorType: 'transition_start',
        anchorLabel: `${transition.transitionType} starts`,
        timeSeconds: start,
        importance: transition.musicBeatAligned ? 'high' : 'medium',
        notes: [transition.reason],
      }),
      createAnchor({
        masterTimingMap,
        segments,
        sourceSystem: 'transition_plan',
        sourceRecordId: transition.id,
        sourceTableName: 'transition_plans',
        anchorType: 'transition_end',
        anchorLabel: `${transition.transitionType} resolves`,
        timeSeconds: end,
        importance: transition.musicBeatAligned ? 'high' : 'medium',
        notes: [transition.musicSyncPoint ?? transition.reason],
      }),
    ]
  })
}

export function createAnchorsFromMusicCues(
  masterTimingMap: MasterTimingMapRecord,
  musicCues: MusicCueSheetItemRecord[] = [],
  segments: StoryTimingSegmentRecord[] = [],
): TimingAnchorRecord[] {
  return musicCues
    .filter((cue) => cue.timeRange)
    .map((cue) =>
      createAnchor({
        masterTimingMap,
        segments,
        sourceSystem: 'music_cue',
        sourceRecordId: cue.id,
        sourceTableName: 'music_cue_sheet_items',
        anchorType: cue.label.toLowerCase().includes('drop') ? 'music_drop' : 'music_beat',
        anchorLabel: cue.label,
        timeSeconds: cue.timeRange?.startSeconds ?? 0,
        endTimeSeconds: cue.timeRange?.endSeconds,
        importance: cue.speechSafety === 'speech_first' ? 'high' : 'medium',
        notes: cue.adaptationNotes,
      }),
    )
}

export function createAnchorsFromSFXTiming(
  masterTimingMap: MasterTimingMapRecord,
  sfxEventPlans: SFXEventPlanRecord[] = [],
  sfxTimingAlignments: SFXTimingAlignmentRecord[] = [],
  segments: StoryTimingSegmentRecord[] = [],
): TimingAnchorRecord[] {
  const alignmentAnchors = sfxTimingAlignments.map((alignment) =>
    createAnchor({
      masterTimingMap,
      segments,
      sourceSystem: 'sfx_alignment',
      sourceRecordId: alignment.id,
      sourceTableName: 'sfx_timing_alignments',
      anchorType: 'sfx_hit',
      anchorLabel: `${alignment.anchorType} SFX hit`,
      timeSeconds: alignment.hitTimeSeconds,
      endTimeSeconds: alignment.endTimeSeconds,
      importance: alignment.frameAccurateRequired ? 'critical' : 'high',
      locked: alignment.frameAccurateRequired,
      notes: alignment.notes,
    }),
  )

  const fallbackEventAnchors = sfxEventPlans
    .filter((eventPlan) => !sfxTimingAlignments.some((alignment) => alignment.sfxEventPlanId === eventPlan.id))
    .map((eventPlan) =>
      createAnchor({
        masterTimingMap,
        segments,
        sourceSystem: 'sfx_event',
        sourceRecordId: eventPlan.id,
        sourceTableName: 'sfx_event_plans',
        anchorType: 'sfx_hit',
        anchorLabel: eventPlan.userVisibleSummary,
        timeSeconds: eventPlan.hitTimeSeconds ?? eventPlan.anchorTimeSeconds,
        importance: 'high',
        notes: eventPlan.notes,
      }),
    )

  return [...alignmentAnchors, ...fallbackEventAnchors]
}

export function createAnchorsFromStrokeMotion(
  masterTimingMap: MasterTimingMapRecord,
  strokeMotionBeats: StrokeMotionBeatRecord[] = [],
  strokeMotionTimingAnchors: StrokeMotionTimingAnchorRecord[] = [],
  segments: StoryTimingSegmentRecord[] = [],
): TimingAnchorRecord[] {
  const beatAnchors = strokeMotionBeats
    .filter((beat) => beat.endTimeSeconds !== undefined || beat.startTimeSeconds !== undefined)
    .map((beat) =>
      createAnchor({
        masterTimingMap,
        segments,
        sourceSystem: 'stroke_motion',
        sourceRecordId: beat.id,
        sourceTableName: 'stroke_motion_beats',
        anchorType: beat.endTimeSeconds !== undefined ? 'stroke_motion_completion' : 'stroke_motion_start',
        anchorLabel: beat.storyBeatLabel,
        anchorText: beat.matchedWords,
        timeSeconds: beat.endTimeSeconds ?? beat.startTimeSeconds ?? 0,
        importance: 'high',
        notes: [beat.meaning],
      }),
    )

  const timingAnchors = strokeMotionTimingAnchors
    .filter((anchor) => anchor.startTimeSeconds !== undefined || anchor.endTimeSeconds !== undefined)
    .map((anchor) =>
      createAnchor({
        masterTimingMap,
        segments,
        sourceSystem: 'stroke_motion',
        sourceRecordId: anchor.id,
        sourceTableName: 'stroke_motion_timing_anchors',
        anchorType: anchor.endTimeSeconds !== undefined ? 'phrase' : 'word',
        anchorLabel: anchor.anchorLabel ?? anchor.anchorType,
        anchorText: anchor.matchedText,
        timeSeconds: anchor.endTimeSeconds ?? anchor.startTimeSeconds ?? 0,
        endTimeSeconds: anchor.endTimeSeconds,
        importance: 'high',
        notes: [anchor.manualNote ?? 'Stroke Motion timing anchor.'],
      }),
    )

  return [...beatAnchors, ...timingAnchors]
}

export function createManualTimingAnchor(input: AnchorInput): TimingAnchorRecord {
  return createAnchor({ ...input, sourceSystem: 'manual', anchorType: 'manual', locked: input.locked ?? true })
}

export function dedupeTimingAnchors(anchors: TimingAnchorRecord[]): TimingAnchorRecord[] {
  const seen = new Set<string>()

  return anchors.filter((anchor) => {
    const key = [
      anchor.sourceSystem,
      anchor.sourceRecordId ?? 'no-source',
      anchor.anchorType,
      Math.round(anchor.timeSeconds * 100),
    ].join(':')

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

export function createTimingAnchors(
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[],
  context: TimingAnchorSourceContext = {},
): ServiceResult<{ anchors: TimingAnchorRecord[]; warnings: string[] }> {
  const anchors = dedupeTimingAnchors([
    ...createAnchorsFromStoryBeats(masterTimingMap, context.storyBeats, segments),
    ...createAnchorsFromEditSegments(masterTimingMap, context.editPlanSegments, segments),
    ...createAnchorsFromPacingAnalysis(masterTimingMap, context.pacingAnalysis, segments),
    ...createAnchorsFromCutDecisions(masterTimingMap, context.cutDecisions, segments),
    ...createAnchorsFromTransitions(masterTimingMap, context.transitionPlans, segments),
    ...createAnchorsFromMusicCues(masterTimingMap, context.musicCues, segments),
    ...createAnchorsFromSFXTiming(masterTimingMap, context.sfxEventPlans, context.sfxTimingAlignments, segments),
    ...createAnchorsFromStrokeMotion(masterTimingMap, context.strokeMotionBeats, context.strokeMotionTimingAnchors, segments),
  ])
  const warnings = anchors.length === 0
    ? ['No source timing anchors were available; only future manual timing anchors can be used.']
    : []

  return ok({ anchors, warnings }, warnings)
}

export function createTimingAnchorSummary(anchors: TimingAnchorRecord[]): string {
  const lockedCount = anchors.filter((anchor) => anchor.locked).length

  return `${anchors.length} timing anchors created across ${new Set(anchors.map((anchor) => anchor.sourceSystem)).size} source systems; ${lockedCount} are locked.`
}
