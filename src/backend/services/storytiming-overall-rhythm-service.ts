import type {
  MasterTimingMapRecord,
  StoryTimingOverallRhythm,
  StoryTimingQACheckRecord,
  StoryTimingSegmentRecord,
  TimingConflictRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import { createMockId, nowIso } from '../mock/mock-database'

export interface OverallTimingRhythmAnalysis {
  rhythm: StoryTimingOverallRhythm
  averageEventsPerSecond: number
  crowdedMomentCount: number
  longGapCount: number
  summary: string
}

const signatureOrAudioEvent = (event: TimingEventRecord): boolean =>
  event.trackType === 'captions' ||
  event.trackType === 'cuts' ||
  event.trackType === 'transitions' ||
  event.trackType === 'music' ||
  event.trackType === 'sfx' ||
  event.trackType === 'stroke_motion' ||
  event.trackType === 'graphic_design' ||
  event.trackType === 'real_motion'

export function detectTooManyEventsAtOnce(events: TimingEventRecord[] = []): number {
  const buckets = new Map<number, number>()
  events.filter(signatureOrAudioEvent).forEach((event) => {
    const bucket = Math.round(event.startTimeSeconds * 2) / 2
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1)
  })

  return [...buckets.values()].filter((count) => count >= 5).length
}

export function detectRushedPacing(input: {
  masterTimingMap: MasterTimingMapRecord
  events?: TimingEventRecord[]
  conflicts?: TimingConflictRecord[]
  videoTone?: string
}): boolean {
  const events = input.events ?? []
  const eventsPerSecond = events.filter(signatureOrAudioEvent).length / Math.max(1, input.masterTimingMap.durationSeconds)
  const tone = input.videoTone?.toLowerCase() ?? ''
  const strictSpeechTone = tone.includes('faith') || tone.includes('teaching') || tone.includes('serious')

  return (
    eventsPerSecond > (strictSpeechTone ? 1.4 : 1.8) ||
    detectTooManyEventsAtOnce(events) > 0 ||
    (input.conflicts ?? []).some((conflict) => conflict.conflictType === 'overall_pacing_too_rushed')
  )
}

export function detectSlowPacing(input: {
  masterTimingMap: MasterTimingMapRecord
  segments?: StoryTimingSegmentRecord[]
  events?: TimingEventRecord[]
  conflicts?: TimingConflictRecord[]
}): boolean {
  const sorted = [...(input.events ?? [])].filter(signatureOrAudioEvent).sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)
  const gaps = sorted.slice(1).filter((event, index) => event.startTimeSeconds - sorted[index].endTimeSeconds > 5)
  const emptyLongSegments = (input.segments ?? []).filter(
    (segment) =>
      segment.outputTimeRange.endSeconds - segment.outputTimeRange.startSeconds > 7 &&
      !sorted.some(
        (event) =>
          event.startTimeSeconds >= segment.outputTimeRange.startSeconds &&
          event.startTimeSeconds <= segment.outputTimeRange.endSeconds,
      ),
  )

  return (
    gaps.length > 0 ||
    emptyLongSegments.length > 0 ||
    (input.conflicts ?? []).some((conflict) => conflict.conflictType === 'overall_pacing_too_slow')
  )
}

export function detectInconsistentRhythm(conflicts: TimingConflictRecord[] = []): boolean {
  return conflicts.some(
    (conflict) =>
      conflict.conflictType === 'too_many_events_same_moment' ||
      conflict.conflictType === 'overall_pacing_too_rushed' ||
      conflict.conflictType === 'overall_pacing_too_slow',
  )
}

export function analyzeOverallTimingRhythm(input: {
  masterTimingMap: MasterTimingMapRecord
  segments?: StoryTimingSegmentRecord[]
  events?: TimingEventRecord[]
  conflicts?: TimingConflictRecord[]
  videoTone?: string
}): OverallTimingRhythmAnalysis {
  const events = (input.events ?? []).filter(signatureOrAudioEvent)
  const averageEventsPerSecond = events.length / Math.max(1, input.masterTimingMap.durationSeconds)
  const crowdedMomentCount = detectTooManyEventsAtOnce(events)
  const longGapCount = detectSlowPacing(input) ? 1 : 0
  const rushed = detectRushedPacing(input)
  const slow = detectSlowPacing(input)
  const inconsistent = detectInconsistentRhythm(input.conflicts)
  const rhythm: StoryTimingOverallRhythm = inconsistent && (rushed || slow)
    ? 'inconsistent'
    : rushed
      ? averageEventsPerSecond > 2.2 || crowdedMomentCount > 1
        ? 'too_rushed'
        : 'slightly_rushed'
      : slow
        ? 'slightly_slow'
        : 'balanced'

  return {
    rhythm,
    averageEventsPerSecond: Number(averageEventsPerSecond.toFixed(2)),
    crowdedMomentCount,
    longGapCount,
    summary: `Overall rhythm is ${rhythm.replaceAll('_', ' ')} with ${events.length} timing event(s) across ${input.masterTimingMap.durationSeconds}s.`,
  }
}

export function createOverallRhythmQACheck(input: {
  masterTimingMap: MasterTimingMapRecord
  analysis: OverallTimingRhythmAnalysis
  conflicts?: TimingConflictRecord[]
}): StoryTimingQACheckRecord {
  const rhythmNeedsWork = input.analysis.rhythm !== 'balanced'
  const critical = (input.conflicts ?? []).some((conflict) => conflict.conflictType.startsWith('overall_') && conflict.severity === 'critical')

  return {
    id: createMockId('overall-rhythm-qa'),
    masterTimingMapId: input.masterTimingMap.id,
    projectId: input.masterTimingMap.projectId,
    editPlanId: input.masterTimingMap.editPlanId,
    checkType: 'overall_rhythm',
    status: rhythmNeedsWork ? critical ? 'failed' : 'warning' : 'passed',
    score: rhythmNeedsWork ? critical ? 52 : 78 : 94,
    relatedEventIds: (input.conflicts ?? []).flatMap((conflict) => conflict.relatedEventIds),
    relatedAnchorIds: (input.conflicts ?? []).flatMap((conflict) => conflict.relatedAnchorIds),
    summary: input.analysis.summary,
    recommendedFix: rhythmNeedsWork ? 'Stagger dense moments or add breathing room while preserving speech meaning.' : undefined,
    blocksRender: critical,
    requiresManualReview: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      rhythm: input.analysis.rhythm,
      averageEventsPerSecond: input.analysis.averageEventsPerSecond,
      crowdedMomentCount: input.analysis.crowdedMomentCount,
    },
  }
}

export function createOverallRhythmSummary(analysis: OverallTimingRhythmAnalysis): string {
  return `${analysis.summary} Crowded moments: ${analysis.crowdedMomentCount}; long gaps: ${analysis.longGapCount}.`
}
