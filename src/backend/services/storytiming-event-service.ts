import type {
  CaptionPlanRecord,
  CutDecisionRecord,
  TransitionPlanRecord,
} from '../../types/edit-quality'
import type {
  SignatureRouteRecord,
} from '../../types/planning'
import type {
  MusicCueSheetItemRecord,
  MusicMixPlanRecord,
} from '../../types/audio-music'
import type {
  SFXEventPlanRecord,
  SFXTimingAlignmentRecord,
} from '../../types/sfx-director'
import type {
  StrokeMotionBeatRecord,
} from '../../types/stroke-motion'
import type {
  QAReportRecord,
  RenderJobInputRecord,
} from '../../types/review-render-export'
import type {
  MasterTimingMapRecord,
  StoryTimingEventType,
  StoryTimingPriority,
  StoryTimingSegmentRecord,
  StoryTimingSourceSystem,
  StoryTimingTrackType,
  TimingAnchorRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import { createMockId, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'
import { chooseEventSyncMode } from './storytiming-authority-service'

export interface TimingEventSourceContext {
  captionPlans?: CaptionPlanRecord[]
  cutDecisions?: CutDecisionRecord[]
  transitionPlans?: TransitionPlanRecord[]
  musicCues?: MusicCueSheetItemRecord[]
  musicMixPlans?: MusicMixPlanRecord[]
  sfxEventPlans?: SFXEventPlanRecord[]
  sfxTimingAlignments?: SFXTimingAlignmentRecord[]
  strokeMotionBeats?: StrokeMotionBeatRecord[]
  signatureRoutes?: SignatureRouteRecord[]
  renderJobInputs?: RenderJobInputRecord[]
  qaReports?: QAReportRecord[]
}

interface EventInput {
  masterTimingMap: MasterTimingMapRecord
  segments?: StoryTimingSegmentRecord[]
  anchors?: TimingAnchorRecord[]
  sourceSystem: StoryTimingSourceSystem
  sourceRecordId?: string
  sourceTableName?: string
  eventType: StoryTimingEventType
  trackType: StoryTimingTrackType
  label: string
  startTimeSeconds: number
  hitTimeSeconds?: number
  endTimeSeconds: number
  priority?: StoryTimingPriority
  canShift?: boolean
  locked?: boolean
  visibilityLayer?: string
  audioLayer?: string
  notes?: string[]
}

const clampDuration = (start: number, end: number): number => Math.max(0, end - start)

const findSegmentForTime = (
  segments: StoryTimingSegmentRecord[] | undefined,
  timeSeconds: number,
): StoryTimingSegmentRecord | undefined =>
  segments?.find(
    (segment) =>
      timeSeconds >= segment.outputTimeRange.startSeconds &&
      timeSeconds <= segment.outputTimeRange.endSeconds,
  )

const findAnchorForEvent = (
  anchors: TimingAnchorRecord[] | undefined,
  eventType: StoryTimingEventType,
  timeSeconds: number,
): TimingAnchorRecord | undefined => {
  const expectedType =
    eventType === 'sfx_hit'
      ? 'sfx_hit'
      : eventType === 'caption_on'
        ? 'caption_reveal'
        : eventType === 'stroke_motion_complete'
          ? 'stroke_motion_completion'
          : eventType === 'transition_start'
            ? 'transition_start'
            : eventType === 'transition_end'
              ? 'transition_end'
              : undefined

  return anchors?.find(
    (anchor) =>
      (expectedType === undefined || anchor.anchorType === expectedType) &&
      Math.abs(anchor.timeSeconds - timeSeconds) <= 0.12,
  )
}

const createEvent = (input: EventInput): TimingEventRecord => {
  const segment = findSegmentForTime(input.segments, input.hitTimeSeconds ?? input.startTimeSeconds)
  const anchor = findAnchorForEvent(input.anchors, input.eventType, input.hitTimeSeconds ?? input.startTimeSeconds)
  const syncMode = chooseEventSyncMode(input.eventType, input.trackType)

  return {
    id: createMockId('timing-event'),
    masterTimingMapId: input.masterTimingMap.id,
    projectId: input.masterTimingMap.projectId,
    editPlanId: input.masterTimingMap.editPlanId,
    segmentId: segment?.id,
    anchorId: anchor?.id,
    sourceSystem: input.sourceSystem,
    sourceRecordId: input.sourceRecordId,
    sourceRef: {
      sourceSystem: input.sourceSystem,
      sourceRecordId: input.sourceRecordId,
      sourceTableName: input.sourceTableName,
      label: input.label,
    },
    eventType: input.eventType,
    trackType: input.trackType,
    label: input.label,
    startTimeSeconds: input.startTimeSeconds,
    hitTimeSeconds: input.hitTimeSeconds,
    endTimeSeconds: input.endTimeSeconds,
    durationSeconds: clampDuration(input.startTimeSeconds, input.endTimeSeconds),
    frameStart: Math.round(input.startTimeSeconds * input.masterTimingMap.frameRate),
    frameHit: input.hitTimeSeconds === undefined ? undefined : Math.round(input.hitTimeSeconds * input.masterTimingMap.frameRate),
    frameEnd: Math.round(input.endTimeSeconds * input.masterTimingMap.frameRate),
    priority: input.priority ?? 'medium',
    syncMode,
    canShift: input.canShift ?? true,
    locked: input.locked ?? false,
    visibilityLayer: input.visibilityLayer,
    audioLayer: input.audioLayer,
    notes: input.notes ?? [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {},
  }
}

export function createCaptionTimingEvents(
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[],
  captionPlans: CaptionPlanRecord[] = [],
  anchors: TimingAnchorRecord[] = [],
): TimingEventRecord[] {
  if (captionPlans.every((caption) => caption.captionNeeded === false)) {
    return []
  }

  return segments
    .filter((segment) => segment.hasSpeech && segment.hasCaptions)
    .flatMap((segment) => {
      const endTimeSeconds = Math.min(segment.outputTimeRange.endSeconds, segment.outputTimeRange.startSeconds + 4)
      return [
        createEvent({
          masterTimingMap,
          segments,
          anchors,
          sourceSystem: 'caption_plan',
          sourceRecordId: captionPlans[0]?.id,
          sourceTableName: 'caption_plans',
          eventType: 'caption_on',
          trackType: 'captions',
          label: `${segment.purpose} caption`,
          startTimeSeconds: segment.outputTimeRange.startSeconds,
          endTimeSeconds,
          priority: 'high',
          visibilityLayer: 'captions',
          notes: ['Caption window is derived from the speech segment timing.'],
        }),
        createEvent({
          masterTimingMap,
          segments,
          anchors,
          sourceSystem: 'caption_plan',
          sourceRecordId: captionPlans[0]?.id,
          sourceTableName: 'caption_plans',
          eventType: 'caption_off',
          trackType: 'captions',
          label: `${segment.purpose} caption off`,
          startTimeSeconds: endTimeSeconds,
          endTimeSeconds,
          priority: 'high',
          visibilityLayer: 'captions',
          notes: ['Caption leaves before the next timing window gets crowded.'],
        }),
      ]
    })
}

export function createCutTimingEvents(
  masterTimingMap: MasterTimingMapRecord,
  cutDecisions: CutDecisionRecord[] = [],
  segments: StoryTimingSegmentRecord[] = [],
  anchors: TimingAnchorRecord[] = [],
): TimingEventRecord[] {
  return cutDecisions.map((cut) => {
    const timeSeconds = cut.outputTimeRange?.startSeconds ?? cut.timeRange.startSeconds
    return createEvent({
      masterTimingMap,
      segments,
      anchors,
      sourceSystem: 'cut_decision',
      sourceRecordId: cut.id,
      sourceTableName: 'cut_decisions',
      eventType: 'cut',
      trackType: 'cuts',
      label: cut.reason,
      startTimeSeconds: timeSeconds,
      endTimeSeconds: timeSeconds,
      priority: cut.affectsSentence ? 'critical' : 'high',
      canShift: !cut.preserveContext,
      locked: cut.preserveContext,
      notes: cut.workerNotes,
    })
  })
}

export function createTransitionTimingEvents(
  masterTimingMap: MasterTimingMapRecord,
  transitionPlans: TransitionPlanRecord[] = [],
  segments: StoryTimingSegmentRecord[] = [],
  anchors: TimingAnchorRecord[] = [],
): TimingEventRecord[] {
  return transitionPlans.flatMap((transition, index) => {
    const fromSegment = segments.find((segment) => segment.editPlanSegmentId === transition.fromSegmentId)
    const toSegment = segments.find((segment) => segment.editPlanSegmentId === transition.toSegmentId)
    const end = toSegment?.outputTimeRange.startSeconds ?? fromSegment?.outputTimeRange.endSeconds ?? index
    const start = Math.max(0, end - transition.durationSeconds)

    return [
      createEvent({
        masterTimingMap,
        segments,
        anchors,
        sourceSystem: 'transition_plan',
        sourceRecordId: transition.id,
        sourceTableName: 'transition_plans',
        eventType: 'transition_start',
        trackType: 'transitions',
        label: `${transition.transitionType} starts`,
        startTimeSeconds: start,
        endTimeSeconds: start,
        priority: transition.musicBeatAligned ? 'high' : 'medium',
        notes: [transition.reason],
      }),
      createEvent({
        masterTimingMap,
        segments,
        anchors,
        sourceSystem: 'transition_plan',
        sourceRecordId: transition.id,
        sourceTableName: 'transition_plans',
        eventType: 'transition_end',
        trackType: 'transitions',
        label: `${transition.transitionType} resolves`,
        startTimeSeconds: end,
        endTimeSeconds: end,
        priority: transition.musicBeatAligned ? 'high' : 'medium',
        notes: [transition.musicSyncPoint ?? transition.reason],
      }),
    ]
  })
}

export function createMusicTimingEvents(
  masterTimingMap: MasterTimingMapRecord,
  musicCues: MusicCueSheetItemRecord[] = [],
  musicMixPlans: MusicMixPlanRecord[] = [],
  segments: StoryTimingSegmentRecord[] = [],
  anchors: TimingAnchorRecord[] = [],
): TimingEventRecord[] {
  const cueEvents = musicCues
    .filter((cue) => cue.timeRange)
    .flatMap((cue) => [
      createEvent({
        masterTimingMap,
        segments,
        anchors,
        sourceSystem: 'music_cue',
        sourceRecordId: cue.id,
        sourceTableName: 'music_cue_sheet_items',
        eventType: 'music_cue_start',
        trackType: 'music',
        label: `${cue.label} starts`,
        startTimeSeconds: cue.timeRange?.startSeconds ?? 0,
        endTimeSeconds: cue.timeRange?.startSeconds ?? 0,
        priority: 'medium',
        audioLayer: 'music',
        notes: cue.adaptationNotes,
      }),
      createEvent({
        masterTimingMap,
        segments,
        anchors,
        sourceSystem: 'music_cue',
        sourceRecordId: cue.id,
        sourceTableName: 'music_cue_sheet_items',
        eventType: 'music_cue_end',
        trackType: 'music',
        label: `${cue.label} ends`,
        startTimeSeconds: cue.timeRange?.endSeconds ?? 0,
        endTimeSeconds: cue.timeRange?.endSeconds ?? 0,
        priority: 'medium',
        audioLayer: 'music',
        notes: cue.doNotCopyNotes,
      }),
    ])

  const duckEvents = musicMixPlans
    .filter((mixPlan) => mixPlan.duckUnderSpeech)
    .flatMap((mixPlan) =>
      segments
        .filter((segment) => segment.hasSpeech)
        .flatMap((segment) => {
          const forceLateDuck = mixPlan.mixNotes.some((note) => note.includes('force_music_duck_late'))
          const duckStart = forceLateDuck
            ? segment.outputTimeRange.startSeconds + 0.2
            : Math.max(0, segment.outputTimeRange.startSeconds - 0.2)

          return [
          createEvent({
            masterTimingMap,
            segments,
            anchors,
            sourceSystem: 'music_mix',
            sourceRecordId: mixPlan.id,
            sourceTableName: 'music_mix_plans',
            eventType: 'music_duck_start',
            trackType: 'music',
            label: `Music duck before ${segment.purpose}`,
            startTimeSeconds: duckStart,
            endTimeSeconds: duckStart,
            priority: 'high',
            audioLayer: 'music',
            notes: mixPlan.mixNotes,
          }),
          createEvent({
            masterTimingMap,
            segments,
            anchors,
            sourceSystem: 'music_mix',
            sourceRecordId: mixPlan.id,
            sourceTableName: 'music_mix_plans',
            eventType: 'music_duck_end',
            trackType: 'music',
            label: `Music duck ends after ${segment.purpose}`,
            startTimeSeconds: segment.outputTimeRange.endSeconds + 0.1,
            endTimeSeconds: segment.outputTimeRange.endSeconds + 0.1,
            priority: 'medium',
            audioLayer: 'music',
            notes: mixPlan.mixNotes,
          }),
        ]
        }),
    )

  return [...cueEvents, ...duckEvents]
}

export function createSFXTimingEvents(
  masterTimingMap: MasterTimingMapRecord,
  sfxEventPlans: SFXEventPlanRecord[] = [],
  sfxTimingAlignments: SFXTimingAlignmentRecord[] = [],
  segments: StoryTimingSegmentRecord[] = [],
  anchors: TimingAnchorRecord[] = [],
): TimingEventRecord[] {
  const alignedEvents = sfxTimingAlignments.flatMap((alignment) => [
    createEvent({
      masterTimingMap,
      segments,
      anchors,
      sourceSystem: 'sfx_alignment',
      sourceRecordId: alignment.id,
      sourceTableName: 'sfx_timing_alignments',
      eventType: 'sfx_start',
      trackType: 'sfx',
      label: `${alignment.anchorType} SFX starts`,
      startTimeSeconds: alignment.startTimeSeconds,
      endTimeSeconds: alignment.startTimeSeconds,
      priority: 'high',
      audioLayer: 'sfx',
      notes: alignment.notes,
    }),
    createEvent({
      masterTimingMap,
      segments,
      anchors,
      sourceSystem: 'sfx_alignment',
      sourceRecordId: alignment.id,
      sourceTableName: 'sfx_timing_alignments',
      eventType: 'sfx_hit',
      trackType: 'sfx',
      label: `${alignment.anchorType} SFX hit`,
      startTimeSeconds: alignment.hitTimeSeconds,
      hitTimeSeconds: alignment.hitTimeSeconds,
      endTimeSeconds: alignment.hitTimeSeconds,
      priority: alignment.frameAccurateRequired ? 'critical' : 'high',
      canShift: !alignment.frameAccurateRequired,
      locked: alignment.frameAccurateRequired,
      audioLayer: 'sfx',
      notes: alignment.notes,
    }),
    createEvent({
      masterTimingMap,
      segments,
      anchors,
      sourceSystem: 'sfx_alignment',
      sourceRecordId: alignment.id,
      sourceTableName: 'sfx_timing_alignments',
      eventType: 'sfx_end',
      trackType: 'sfx',
      label: `${alignment.anchorType} SFX tail ends`,
      startTimeSeconds: alignment.endTimeSeconds,
      endTimeSeconds: alignment.endTimeSeconds,
      priority: 'medium',
      audioLayer: 'sfx',
      notes: alignment.notes,
    }),
  ])

  const fallbackEvents = sfxEventPlans
    .filter((eventPlan) => !sfxTimingAlignments.some((alignment) => alignment.sfxEventPlanId === eventPlan.id))
    .flatMap((eventPlan) => {
      const hit = eventPlan.hitTimeSeconds ?? eventPlan.anchorTimeSeconds
      const start = eventPlan.startTimeSeconds ?? Math.max(0, hit - 0.25)
      const end = eventPlan.endTimeSeconds ?? hit + 0.7

      return [
        createEvent({
          masterTimingMap,
          segments,
          anchors,
          sourceSystem: 'sfx_event',
          sourceRecordId: eventPlan.id,
          sourceTableName: 'sfx_event_plans',
          eventType: 'sfx_start',
          trackType: 'sfx',
          label: `${eventPlan.userVisibleSummary} starts`,
          startTimeSeconds: start,
          endTimeSeconds: start,
          priority: 'high',
          audioLayer: 'sfx',
          notes: eventPlan.notes,
        }),
        createEvent({
          masterTimingMap,
          segments,
          anchors,
          sourceSystem: 'sfx_event',
          sourceRecordId: eventPlan.id,
          sourceTableName: 'sfx_event_plans',
          eventType: 'sfx_hit',
          trackType: 'sfx',
          label: eventPlan.userVisibleSummary,
          startTimeSeconds: hit,
          hitTimeSeconds: hit,
          endTimeSeconds: hit,
          priority: 'high',
          audioLayer: 'sfx',
          notes: eventPlan.notes,
        }),
        createEvent({
          masterTimingMap,
          segments,
          anchors,
          sourceSystem: 'sfx_event',
          sourceRecordId: eventPlan.id,
          sourceTableName: 'sfx_event_plans',
          eventType: 'sfx_end',
          trackType: 'sfx',
          label: `${eventPlan.userVisibleSummary} tail ends`,
          startTimeSeconds: end,
          endTimeSeconds: end,
          priority: 'medium',
          audioLayer: 'sfx',
          notes: eventPlan.notes,
        }),
      ]
    })

  return [...alignedEvents, ...fallbackEvents]
}

export function createStrokeMotionTimingEvents(
  masterTimingMap: MasterTimingMapRecord,
  strokeMotionBeats: StrokeMotionBeatRecord[] = [],
  segments: StoryTimingSegmentRecord[] = [],
  anchors: TimingAnchorRecord[] = [],
): TimingEventRecord[] {
  return strokeMotionBeats
    .filter((beat) => beat.startTimeSeconds !== undefined || beat.endTimeSeconds !== undefined)
    .flatMap((beat) => {
      const start = beat.startTimeSeconds ?? Math.max(0, (beat.endTimeSeconds ?? 0) - 1)
      const end = beat.endTimeSeconds ?? start + 1

      return [
        createEvent({
          masterTimingMap,
          segments,
          anchors,
          sourceSystem: 'stroke_motion',
          sourceRecordId: beat.id,
          sourceTableName: 'stroke_motion_beats',
          eventType: 'stroke_motion_start',
          trackType: 'stroke_motion',
          label: `${beat.storyBeatLabel} Stroke Motion starts`,
          startTimeSeconds: start,
          endTimeSeconds: start,
          priority: 'high',
          visibilityLayer: 'stroke_motion',
          notes: [beat.meaning],
        }),
        createEvent({
          masterTimingMap,
          segments,
          anchors,
          sourceSystem: 'stroke_motion',
          sourceRecordId: beat.id,
          sourceTableName: 'stroke_motion_beats',
          eventType: 'stroke_motion_complete',
          trackType: 'stroke_motion',
          label: `${beat.storyBeatLabel} Stroke Motion completes`,
          startTimeSeconds: end,
          endTimeSeconds: end,
          priority: 'high',
          visibilityLayer: 'stroke_motion',
          notes: [beat.visualAction],
        }),
      ]
    })
}

export function createGraphicDesignTimingEvents(
  masterTimingMap: MasterTimingMapRecord,
  signatureRoutes: SignatureRouteRecord[] = [],
  segments: StoryTimingSegmentRecord[] = [],
  anchors: TimingAnchorRecord[] = [],
): TimingEventRecord[] {
  return signatureRoutes
    .filter((route) => route.signatureSystem === 'graphic_design')
    .map((route) =>
      createEvent({
        masterTimingMap,
        segments,
        anchors,
        sourceSystem: 'graphic_design',
        sourceRecordId: route.id,
        sourceTableName: 'signature_routes',
        eventType: 'graphic_reveal',
        trackType: 'graphic_design',
        label: route.reason,
        startTimeSeconds: route.timing.startSeconds,
        endTimeSeconds: route.timing.endSeconds,
        priority: 'high',
        visibilityLayer: 'graphic_design',
        notes: ['Graphic Design reveal timing comes from the signature route.'],
      }),
    )
}

export function createRealMotionTimingEvents(
  masterTimingMap: MasterTimingMapRecord,
  signatureRoutes: SignatureRouteRecord[] = [],
  segments: StoryTimingSegmentRecord[] = [],
  anchors: TimingAnchorRecord[] = [],
): TimingEventRecord[] {
  return signatureRoutes
    .filter((route) => route.signatureSystem === 'real_motion')
    .flatMap((route) => [
      createEvent({
        masterTimingMap,
        segments,
        anchors,
        sourceSystem: 'real_motion',
        sourceRecordId: route.id,
        sourceTableName: 'signature_routes',
        eventType: 'real_motion_enter',
        trackType: 'real_motion',
        label: `${route.reason} enters`,
        startTimeSeconds: route.timing.startSeconds,
        endTimeSeconds: route.timing.startSeconds,
        priority: 'high',
        visibilityLayer: 'real_motion',
        notes: ['Real Motion entrance follows the signature route timing.'],
      }),
      createEvent({
        masterTimingMap,
        segments,
        anchors,
        sourceSystem: 'real_motion',
        sourceRecordId: route.id,
        sourceTableName: 'signature_routes',
        eventType: 'real_motion_settle',
        trackType: 'real_motion',
        label: `${route.reason} settles`,
        startTimeSeconds: route.timing.endSeconds,
        endTimeSeconds: route.timing.endSeconds,
        priority: 'high',
        visibilityLayer: 'real_motion',
        notes: ['Real Motion settle timing must stay face-safe and speech-aware.'],
      }),
    ])
}

export function createRenderMarkerEvents(
  masterTimingMap: MasterTimingMapRecord,
  renderJobInputs: RenderJobInputRecord[] = [],
  segments: StoryTimingSegmentRecord[] = [],
  anchors: TimingAnchorRecord[] = [],
): TimingEventRecord[] {
  return renderJobInputs
    .filter((input) => input.timelineStartSeconds !== undefined && input.timelineEndSeconds !== undefined)
    .map((input) =>
      createEvent({
        masterTimingMap,
        segments,
        anchors,
        sourceSystem: 'render_job',
        sourceRecordId: input.id,
        sourceTableName: 'render_job_inputs',
        eventType: 'render_marker',
        trackType: 'render_markers',
        label: input.layerName ?? input.inputType,
        startTimeSeconds: input.timelineStartSeconds ?? 0,
        endTimeSeconds: input.timelineEndSeconds ?? input.timelineStartSeconds ?? 0,
        priority: 'medium',
        visibilityLayer: input.layerName,
        notes: ['Mock render marker only; no rendering occurs.'],
      }),
    )
}

export function createQAMarkerEvents(
  masterTimingMap: MasterTimingMapRecord,
  qaReports: QAReportRecord[] = [],
  segments: StoryTimingSegmentRecord[] = [],
  anchors: TimingAnchorRecord[] = [],
): TimingEventRecord[] {
  return qaReports.flatMap((report) =>
    [
      report.captionReadability,
      report.sfxBalance,
      report.signatureTiming,
      report.cutSmoothness,
    ]
      .filter((item) => item.timecodeSeconds !== undefined)
      .map((item) =>
        createEvent({
          masterTimingMap,
          segments,
          anchors,
          sourceSystem: 'qa_report',
          sourceRecordId: item.id,
          sourceTableName: 'qa_report_items',
          eventType: 'qa_marker',
          trackType: 'qa_markers',
          label: item.summary,
          startTimeSeconds: item.timecodeSeconds ?? 0,
          endTimeSeconds: item.timecodeSeconds ?? 0,
          priority: item.blocker ? 'critical' : 'medium',
          notes: [item.recommendedFix ?? item.recommendation ?? 'QA marker from mock report.'],
        }),
      ),
  )
}

export function sortTimingEvents(events: TimingEventRecord[]): TimingEventRecord[] {
  return [...events].sort((a, b) => a.startTimeSeconds - b.startTimeSeconds || a.label.localeCompare(b.label))
}

export function createTimingEvents(
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[],
  anchors: TimingAnchorRecord[],
  context: TimingEventSourceContext = {},
): ServiceResult<{ events: TimingEventRecord[]; warnings: string[] }> {
  const events = sortTimingEvents([
    ...createCaptionTimingEvents(masterTimingMap, segments, context.captionPlans, anchors),
    ...createCutTimingEvents(masterTimingMap, context.cutDecisions, segments, anchors),
    ...createTransitionTimingEvents(masterTimingMap, context.transitionPlans, segments, anchors),
    ...createMusicTimingEvents(masterTimingMap, context.musicCues, context.musicMixPlans, segments, anchors),
    ...createSFXTimingEvents(masterTimingMap, context.sfxEventPlans, context.sfxTimingAlignments, segments, anchors),
    ...createStrokeMotionTimingEvents(masterTimingMap, context.strokeMotionBeats, segments, anchors),
    ...createGraphicDesignTimingEvents(masterTimingMap, context.signatureRoutes, segments, anchors),
    ...createRealMotionTimingEvents(masterTimingMap, context.signatureRoutes, segments, anchors),
    ...createRenderMarkerEvents(masterTimingMap, context.renderJobInputs, segments, anchors),
    ...createQAMarkerEvents(masterTimingMap, context.qaReports, segments, anchors),
  ])
  const warnings = events.length === 0
    ? ['No timing events were derived from the supplied mock sources.']
    : []

  return ok({ events, warnings }, warnings)
}

export function createTimingEventSummary(events: TimingEventRecord[]): string {
  const trackCount = new Set(events.map((event) => event.trackType)).size

  return `${events.length} timing events created across ${trackCount} tracks.`
}
