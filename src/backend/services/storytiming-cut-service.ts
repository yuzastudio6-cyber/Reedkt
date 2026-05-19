import type {
  CutDecisionRecord,
  PacingAnalysisRecord,
} from '../../types/edit-quality'
import type { StoryBeatRecord } from '../../types/planning'
import type {
  CutTimingIntent,
  CutTimingPlanRecord,
  MasterTimingMapRecord,
  StoryTimingSegmentRecord,
  TimingAnchorRecord,
  TimingConflictRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import { createMockId, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'
import { decidePausePreservation } from './storytiming-pause-preservation-service'
import { createTimingConflict } from './storytiming-conflict-service'

const mapCutIntent = (cutDecision: CutDecisionRecord): CutTimingIntent => {
  if (cutDecision.cutType === 'remove_dead_space') return 'remove_dead_space'
  if (cutDecision.cutType === 'remove_mistake') return 'remove_mistake'
  if (cutDecision.cutType === 'tighten_pause') return 'tighten_pause'
  if (cutDecision.cutType === 'preserve_emotional_pause') return 'preserve_emotional_pause'
  if (cutDecision.cutType === 'j_cut') return 'j_cut'
  if (cutDecision.cutType === 'l_cut') return 'l_cut'
  if (cutDecision.cutType === 'match_cut') return 'match_cut'
  return 'story_transition'
}

const findSegmentForCut = (
  segments: StoryTimingSegmentRecord[],
  cutDecision: CutDecisionRecord,
): StoryTimingSegmentRecord | undefined =>
  segments.find((segment) => segment.editPlanSegmentId === cutDecision.editPlanSegmentId) ??
  segments.find(
    (segment) =>
      (cutDecision.outputTimeRange?.startSeconds ?? cutDecision.timeRange.startSeconds) >= segment.outputTimeRange.startSeconds &&
      (cutDecision.outputTimeRange?.startSeconds ?? cutDecision.timeRange.startSeconds) <= segment.outputTimeRange.endSeconds,
  )

export function validateCutAgainstSpeechMeaning(
  cutDecision: CutDecisionRecord,
  transcriptAnchors: TimingAnchorRecord[],
): boolean {
  if (cutDecision.affectsSentence) {
    return false
  }

  const cutTime = cutDecision.outputTimeRange?.startSeconds ?? cutDecision.timeRange.startSeconds
  return !transcriptAnchors.some(
    (anchor) =>
      (anchor.anchorType === 'phrase' || anchor.anchorType === 'sentence') &&
      cutTime > anchor.timeSeconds &&
      cutTime < (anchor.endTimeSeconds ?? anchor.timeSeconds),
  )
}

export function validateCutAgainstStoryBeat(
  cutDecision: CutDecisionRecord,
  storyBeats: StoryBeatRecord[] = [],
): boolean {
  const cutTime = cutDecision.outputTimeRange?.startSeconds ?? cutDecision.timeRange.startSeconds
  return !storyBeats.some(
    (beat) =>
      beat.timeRange &&
      cutTime > beat.timeRange.startSeconds &&
      cutTime < beat.timeRange.endSeconds &&
      beat.beatType !== 'transition',
  )
}

export function createCutTimingPlanFromCutDecision(input: {
  masterTimingMap: MasterTimingMapRecord
  cutDecision: CutDecisionRecord
  segments: StoryTimingSegmentRecord[]
  transcriptAnchors: TimingAnchorRecord[]
  pacingAnalysis?: PacingAnalysisRecord[]
  storyBeats?: StoryBeatRecord[]
}): CutTimingPlanRecord {
  const segment = findSegmentForCut(input.segments, input.cutDecision)
  const relatedPause = input.pacingAnalysis?.find(
    (analysis) =>
      analysis.editPlanSegmentId === input.cutDecision.editPlanSegmentId ||
      (
        (input.cutDecision.outputTimeRange?.startSeconds ?? input.cutDecision.timeRange.startSeconds) >= analysis.timeRange.startSeconds &&
        (input.cutDecision.outputTimeRange?.startSeconds ?? input.cutDecision.timeRange.startSeconds) <= analysis.timeRange.endSeconds
      ),
  )
  const preserveSentenceMeaning = validateCutAgainstSpeechMeaning(input.cutDecision, input.transcriptAnchors)
  const preserveStoryBeat = validateCutAgainstStoryBeat(input.cutDecision, input.storyBeats)
  const pauseDecision = relatedPause ? decidePausePreservation(relatedPause) : undefined
  const intent = mapCutIntent(input.cutDecision)

  return {
    id: createMockId('cut-timing-plan'),
    masterTimingMapId: input.masterTimingMap.id,
    projectId: input.masterTimingMap.projectId,
    editPlanId: input.masterTimingMap.editPlanId,
    segmentId: segment?.id,
    cutDecisionId: input.cutDecision.id,
    intent,
    sourceTimeRange: input.cutDecision.timeRange,
    outputTimeRange: input.cutDecision.outputTimeRange ?? input.cutDecision.timeRange,
    preserveAudioContinuity: input.cutDecision.preserveAudioContinuity,
    preserveSentenceMeaning,
    preserveEmotionalPause: pauseDecision === 'preserve' || intent === 'preserve_emotional_pause',
    pauseDecision,
    jCutLcutOffsetSeconds: intent === 'j_cut' ? -0.25 : intent === 'l_cut' ? 0.25 : undefined,
    notes: [
      input.cutDecision.reason,
      preserveStoryBeat ? 'Story beat validation passed.' : 'Cut may interrupt a story beat.',
      preserveSentenceMeaning ? 'Speech meaning validation passed.' : 'Cut may interrupt phrase meaning.',
    ],
    createdAt: nowIso(),
  }
}

export function createCutTimingPlans(
  masterTimingMap: MasterTimingMapRecord,
  segments: StoryTimingSegmentRecord[],
  transcriptAnchors: TimingAnchorRecord[],
  cutDecisions: CutDecisionRecord[] = [],
  pacingAnalysis: PacingAnalysisRecord[] = [],
  storyBeats: StoryBeatRecord[] = [],
): ServiceResult<{ cutTimingPlans: CutTimingPlanRecord[]; warnings: string[] }> {
  const cutTimingPlans = cutDecisions.map((cutDecision) =>
    createCutTimingPlanFromCutDecision({
      masterTimingMap,
      cutDecision,
      segments,
      transcriptAnchors,
      pacingAnalysis,
      storyBeats,
    }),
  )
  const warnings = cutTimingPlans.some((plan) => !plan.preserveSentenceMeaning)
    ? ['One or more cut timing plans need meaning-safety review.']
    : []

  return ok({ cutTimingPlans, warnings }, warnings)
}

export function createCutAnchors(
  masterTimingMap: MasterTimingMapRecord,
  cutTimingPlans: CutTimingPlanRecord[],
): TimingAnchorRecord[] {
  return cutTimingPlans.map((plan) => ({
    id: createMockId('cut-anchor'),
    masterTimingMapId: masterTimingMap.id,
    projectId: masterTimingMap.projectId,
    editPlanId: masterTimingMap.editPlanId,
    segmentId: plan.segmentId,
    sourceSystem: 'cut_decision',
    sourceRecordId: plan.cutDecisionId,
    sourceRef: {
      sourceSystem: 'cut_decision',
      sourceRecordId: plan.cutDecisionId,
      sourceTableName: 'cut_timing_plans',
      label: plan.intent,
    },
    anchorType: 'cut',
    anchorLabel: `Cut: ${plan.intent}`,
    timeSeconds: plan.outputTimeRange.startSeconds,
    endTimeSeconds: plan.outputTimeRange.endSeconds,
    frameNumber: Math.round(plan.outputTimeRange.startSeconds * masterTimingMap.frameRate),
    importance: plan.preserveSentenceMeaning ? 'high' : 'critical',
    primaryAuthority: 'speech_meaning',
    syncMode: 'frame_locked',
    locked: !plan.preserveSentenceMeaning || plan.preserveEmotionalPause,
    notes: plan.notes,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      cutTimingPlanId: plan.id,
      pauseDecision: plan.pauseDecision ?? 'none',
    },
  }))
}

export function createCutTimingEvents(
  masterTimingMap: MasterTimingMapRecord,
  cutTimingPlans: CutTimingPlanRecord[],
): TimingEventRecord[] {
  return cutTimingPlans.map((plan) => ({
    id: createMockId('cut-event'),
    masterTimingMapId: masterTimingMap.id,
    projectId: masterTimingMap.projectId,
    editPlanId: masterTimingMap.editPlanId,
    segmentId: plan.segmentId,
    sourceSystem: 'cut_decision',
    sourceRecordId: plan.cutDecisionId,
    sourceRef: {
      sourceSystem: 'cut_decision',
      sourceRecordId: plan.cutDecisionId,
      sourceTableName: 'cut_timing_plans',
      label: plan.intent,
    },
    eventType: 'cut',
    trackType: 'cuts',
    label: `Cut timing: ${plan.intent}`,
    startTimeSeconds: plan.outputTimeRange.startSeconds,
    endTimeSeconds: plan.outputTimeRange.startSeconds,
    durationSeconds: 0,
    frameStart: Math.round(plan.outputTimeRange.startSeconds * masterTimingMap.frameRate),
    frameEnd: Math.round(plan.outputTimeRange.startSeconds * masterTimingMap.frameRate),
    priority: plan.preserveSentenceMeaning ? 'high' : 'critical',
    syncMode: 'frame_locked',
    canShift: plan.preserveSentenceMeaning && !plan.preserveEmotionalPause,
    locked: !plan.preserveSentenceMeaning || plan.preserveEmotionalPause,
    audioLayer: plan.jCutLcutOffsetSeconds === undefined ? undefined : 'dialogue',
    notes: [
      ...plan.notes,
      plan.jCutLcutOffsetSeconds === undefined
        ? 'No J-cut/L-cut offset planned.'
        : `Mock audio offset: ${plan.jCutLcutOffsetSeconds}s.`,
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      cutTimingPlanId: plan.id,
      intent: plan.intent,
    },
  }))
}

export function createCutMeaningConflicts(
  masterTimingMap: MasterTimingMapRecord,
  cutTimingPlans: CutTimingPlanRecord[],
  cutEvents: TimingEventRecord[],
  transcriptAnchors: TimingAnchorRecord[],
): TimingConflictRecord[] {
  return cutTimingPlans
    .filter((plan) => !plan.preserveSentenceMeaning)
    .map((plan) => {
      const cutEvent = cutEvents.find((event) => event.sourceRecordId === plan.cutDecisionId)
      const relatedAnchor = transcriptAnchors.find(
        (anchor) =>
          (anchor.anchorType === 'phrase' || anchor.anchorType === 'sentence') &&
          plan.outputTimeRange.startSeconds > anchor.timeSeconds &&
          plan.outputTimeRange.startSeconds < (anchor.endTimeSeconds ?? anchor.timeSeconds),
      )

      return createTimingConflict(
        masterTimingMap,
        'cut_before_meaning_complete',
        'critical',
        plan.outputTimeRange,
        `Cut "${plan.intent}" occurs before inferred phrase meaning completes.`,
        'Cut timing must preserve speech meaning and story comprehension.',
        'shift_later',
        cutEvent ? [cutEvent] : [],
        relatedAnchor ? [relatedAnchor] : [],
      )
    })
}

export function createCutTimingSummary(cutTimingPlans: CutTimingPlanRecord[]): string {
  const unsafe = cutTimingPlans.filter((plan) => !plan.preserveSentenceMeaning || plan.preserveEmotionalPause).length

  return `${cutTimingPlans.length} cut timing plan(s) created; ${unsafe} need protected timing review.`
}
