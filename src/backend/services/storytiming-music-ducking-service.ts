import type { MusicCueSheetItemRecord, MusicMixPlanRecord } from '../../types/audio-music'
import type {
  MasterTimingMapRecord,
  MusicDuckingTimingPlanRecord,
  StoryTimingSegmentRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import { createMockId, nowIso } from '../mock/mock-database'

const DEFAULT_PRE_ROLL_MS = 300
const DEFAULT_RELEASE_MS = 500

const cueForSegment = (
  segment: StoryTimingSegmentRecord,
  musicCues: MusicCueSheetItemRecord[] = [],
): MusicCueSheetItemRecord | undefined =>
  musicCues.find(
    (cue) =>
      cue.timeRange &&
      segment.outputTimeRange.startSeconds < cue.timeRange.endSeconds &&
      cue.timeRange.startSeconds < segment.outputTimeRange.endSeconds,
  )

const mixAllowsDucking = (musicMixPlans: MusicMixPlanRecord[] = []): boolean =>
  musicMixPlans.length === 0 || musicMixPlans.some((mixPlan) => mixPlan.duckUnderSpeech)

export function createVoiceFirstDuckingPlan(
  masterTimingMap: MasterTimingMapRecord,
  segment: StoryTimingSegmentRecord,
  musicCue?: MusicCueSheetItemRecord,
  options: {
    preRollMs?: number
    releaseMs?: number
    forceLateDuck?: boolean
  } = {},
): MusicDuckingTimingPlanRecord {
  const preRollMs = options.preRollMs ?? DEFAULT_PRE_ROLL_MS
  const releaseMs = options.releaseMs ?? DEFAULT_RELEASE_MS
  const duckStartSeconds = options.forceLateDuck
    ? Number((segment.outputTimeRange.startSeconds + 0.2).toFixed(3))
    : Math.max(0, Number((segment.outputTimeRange.startSeconds - preRollMs / 1000).toFixed(3)))
  const duckEndSeconds = Number((segment.outputTimeRange.endSeconds + releaseMs / 1000).toFixed(3))

  return {
    id: createMockId('music-ducking-plan'),
    masterTimingMapId: masterTimingMap.id,
    projectId: masterTimingMap.projectId,
    editPlanId: masterTimingMap.editPlanId,
    musicCueId: musicCue?.id,
    speechSegmentId: segment.id,
    duckStartSeconds,
    speechStartSeconds: segment.outputTimeRange.startSeconds,
    speechEndSeconds: segment.outputTimeRange.endSeconds,
    duckEndSeconds,
    preRollMs,
    releaseMs,
    reason: `Voice-first ducking protects speech during ${segment.purpose}.`,
    notes: [
      'Mock ducking timing only; no audio automation was rendered.',
      musicCue ? `Linked to music cue ${musicCue.label}.` : 'No specific music cue was available.',
    ],
    createdAt: nowIso(),
  }
}

export function createDialogueDuckingWindows(
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[] = [],
  musicCues: MusicCueSheetItemRecord[] = [],
  musicMixPlans: MusicMixPlanRecord[] = [],
): MusicDuckingTimingPlanRecord[] {
  if (!mixAllowsDucking(musicMixPlans)) return []

  const forceLateDuck = musicMixPlans.some((mixPlan) =>
    mixPlan.mixNotes.some((note) => note.includes('force_music_duck_late')),
  )

  return segments
    .filter((segment) => segment.hasSpeech)
    .map((segment) =>
      createVoiceFirstDuckingPlan(masterTimingMap, segment, cueForSegment(segment, musicCues), {
        forceLateDuck,
        preRollMs: segment.preserveEmotionalPause ? 400 : DEFAULT_PRE_ROLL_MS,
        releaseMs: segment.preserveEmotionalPause ? 700 : DEFAULT_RELEASE_MS,
      }),
    )
}

export function createMusicDuckingTimingPlans(
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[] = [],
  musicCues: MusicCueSheetItemRecord[] = [],
  musicMixPlans: MusicMixPlanRecord[] = [],
): MusicDuckingTimingPlanRecord[] {
  if (musicCues.length === 0 && musicMixPlans.length === 0) return []
  return createDialogueDuckingWindows(masterTimingMap, segments, musicCues, musicMixPlans)
}

const createDuckingEvent = (
  masterTimingMap: MasterTimingMapRecord,
  plan: MusicDuckingTimingPlanRecord,
  eventType: 'music_duck_start' | 'music_duck_end',
): TimingEventRecord => {
  const timeSeconds = eventType === 'music_duck_start' ? plan.duckStartSeconds : plan.duckEndSeconds

  return {
    id: createMockId('music-ducking-event'),
    masterTimingMapId: masterTimingMap.id,
    projectId: masterTimingMap.projectId,
    editPlanId: masterTimingMap.editPlanId,
    segmentId: plan.speechSegmentId,
    sourceSystem: 'music_mix',
    sourceRecordId: plan.id,
    sourceRef: {
      sourceSystem: 'music_mix',
      sourceRecordId: plan.id,
      sourceTableName: 'mock_music_ducking_timing_plans',
      label: eventType === 'music_duck_start' ? 'Music duck start' : 'Music duck end',
    },
    eventType,
    trackType: 'music',
    label: eventType === 'music_duck_start'
      ? `Music ducks before speech at ${plan.speechStartSeconds.toFixed(3)}s`
      : `Music releases after speech at ${plan.speechEndSeconds.toFixed(3)}s`,
    startTimeSeconds: timeSeconds,
    endTimeSeconds: timeSeconds,
    durationSeconds: 0,
    frameStart: Math.round(timeSeconds * masterTimingMap.frameRate),
    frameEnd: Math.round(timeSeconds * masterTimingMap.frameRate),
    priority: eventType === 'music_duck_start' ? 'high' : 'medium',
    syncMode: 'speech_locked',
    canShift: true,
    locked: false,
    audioLayer: 'music',
    notes: plan.notes,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      preRollMs: plan.preRollMs,
      releaseMs: plan.releaseMs,
      speechStartSeconds: plan.speechStartSeconds,
      speechEndSeconds: plan.speechEndSeconds,
    },
  }
}

export function createMusicDuckingEvents(
  masterTimingMap: MasterTimingMapRecord,
  duckingPlans: MusicDuckingTimingPlanRecord[] = [],
): TimingEventRecord[] {
  return duckingPlans.flatMap((plan) => [
    createDuckingEvent(masterTimingMap, plan, 'music_duck_start'),
    createDuckingEvent(masterTimingMap, plan, 'music_duck_end'),
  ])
}

export function validateMusicDuckingAgainstSpeech(plan: MusicDuckingTimingPlanRecord): boolean {
  return plan.duckStartSeconds <= plan.speechStartSeconds - 0.15
}

export function createMusicDuckingTimingSummary(duckingPlans: MusicDuckingTimingPlanRecord[]): string {
  if (duckingPlans.length === 0) {
    return 'No music ducking windows were needed for this mock SoundSync pass.'
  }

  return `${duckingPlans.length} voice-safe music ducking window(s) were planned before speech.`
}
