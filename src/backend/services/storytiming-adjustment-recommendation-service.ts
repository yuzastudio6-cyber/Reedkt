import type {
  MasterTimingMapRecord,
  StoryTimingAdjustmentRecommendationRecord,
  StoryTimingAdjustmentType,
  StoryTimingQACheckRecord,
  StoryTimingQARecommendedAction,
  TimingConflictRecord,
} from '../../types/storytiming'
import { createMockId, nowIso } from '../mock/mock-database'

interface RecommendationInput {
  masterTimingMap: MasterTimingMapRecord
  conflict?: TimingConflictRecord
  qaCheck?: StoryTimingQACheckRecord
  recommendedAction: StoryTimingQARecommendedAction
  adjustmentType?: StoryTimingAdjustmentType
  reason: string
  userFacingSummary: string
  timeShiftSeconds?: number
  requiresUserApproval?: boolean
}

const createRecommendation = (input: RecommendationInput): StoryTimingAdjustmentRecommendationRecord => ({
  id: createMockId('timing-adjustment-recommendation'),
  masterTimingMapId: input.masterTimingMap.id,
  projectId: input.masterTimingMap.projectId,
  editPlanId: input.masterTimingMap.editPlanId,
  relatedConflictId: input.conflict?.id,
  relatedEventIds: input.conflict?.relatedEventIds ?? input.qaCheck?.relatedEventIds ?? [],
  relatedAnchorIds: input.conflict?.relatedAnchorIds ?? input.qaCheck?.relatedAnchorIds ?? [],
  recommendedAction: input.recommendedAction,
  adjustmentType: input.adjustmentType,
  timeShiftSeconds: input.timeShiftSeconds,
  reason: input.reason,
  userFacingSummary: input.userFacingSummary,
  requiresUserApproval: input.requiresUserApproval ?? input.conflict?.requiresUserReview ?? input.qaCheck?.requiresManualReview ?? false,
  createdAt: nowIso(),
  metadata: {
    mockOnly: true,
    source: input.conflict ? 'timing_conflict' : 'qa_check',
  },
})

export function recommendFixForCaptionConflict(
  masterTimingMap: MasterTimingMapRecord,
  conflict: TimingConflictRecord,
): StoryTimingAdjustmentRecommendationRecord {
  return createRecommendation({
    masterTimingMap,
    conflict,
    recommendedAction: conflict.conflictType === 'caption_too_fast' ? 'extend_duration' : 'move_caption',
    adjustmentType: conflict.conflictType === 'caption_too_fast' ? 'extend_duration' : 'reduce_overlap',
    reason: conflict.description,
    userFacingSummary: conflict.conflictType === 'caption_too_fast'
      ? 'Split or extend the caption so it stays readable.'
      : 'Move the caption or shift the overlay so the caption stays readable.',
  })
}

export function recommendFixForCutConflict(
  masterTimingMap: MasterTimingMapRecord,
  conflict: TimingConflictRecord,
): StoryTimingAdjustmentRecommendationRecord {
  return createRecommendation({
    masterTimingMap,
    conflict,
    recommendedAction: conflict.conflictType === 'emotional_pause_removed' ? 'preserve_pause' : 'shift_event',
    adjustmentType: conflict.conflictType === 'emotional_pause_removed' ? 'preserve_pause' : 'shift_later',
    reason: conflict.description,
    userFacingSummary: conflict.conflictType === 'emotional_pause_removed'
      ? 'Preserve the emotional pause unless the user approves tighter pacing.'
      : 'Move the cut later so the phrase or story beat can complete.',
    timeShiftSeconds: conflict.conflictType === 'emotional_pause_removed' ? undefined : 0.35,
    requiresUserApproval: conflict.conflictType === 'emotional_pause_removed' || conflict.requiresUserReview,
  })
}

export function recommendFixForMusicDuckingConflict(
  masterTimingMap: MasterTimingMapRecord,
  conflict: TimingConflictRecord,
): StoryTimingAdjustmentRecommendationRecord {
  return createRecommendation({
    masterTimingMap,
    conflict,
    recommendedAction: 'adjust_music_ducking',
    adjustmentType: 'shift_earlier',
    reason: conflict.description,
    userFacingSummary: 'Start music ducking before speech so voice clarity wins.',
    timeShiftSeconds: -0.3,
  })
}

export function recommendFixForSFXHitConflict(
  masterTimingMap: MasterTimingMapRecord,
  conflict: TimingConflictRecord,
): StoryTimingAdjustmentRecommendationRecord {
  return createRecommendation({
    masterTimingMap,
    conflict,
    recommendedAction: 'adjust_sfx_hit',
    adjustmentType: conflict.conflictType === 'sfx_hit_early' ? 'shift_later' : 'shift_earlier',
    reason: conflict.description,
    userFacingSummary: 'Re-align the SFX hit to its StoryTiming anchor.',
    timeShiftSeconds: conflict.conflictType === 'sfx_hit_early' ? 0.18 : -0.18,
  })
}

export function recommendFixForSignatureConflict(
  masterTimingMap: MasterTimingMapRecord,
  conflict: TimingConflictRecord,
): StoryTimingAdjustmentRecommendationRecord {
  const isReadability = conflict.conflictType === 'graphic_not_readable_long_enough'
  const isFace = conflict.conflictType === 'real_motion_blocks_face' || conflict.conflictType === 'real_motion_blocks_object'

  return createRecommendation({
    masterTimingMap,
    conflict,
    recommendedAction: isReadability ? 'extend_duration' : isFace ? 'move_overlay' : 'shift_event',
    adjustmentType: isReadability ? 'extend_duration' : isFace ? 'reduce_overlap' : 'shift_earlier',
    reason: conflict.description,
    userFacingSummary: isReadability
      ? 'Extend the Graphic Design hold or simplify the text.'
      : isFace
        ? 'Move or shorten the Real Motion overlay so it avoids face and proof zones.'
        : 'Re-time the signature animation so it lands on phrase or story meaning.',
    timeShiftSeconds: isReadability || isFace ? undefined : -0.25,
  })
}

export function recommendFixForOverlayConflict(
  masterTimingMap: MasterTimingMapRecord,
  conflict: TimingConflictRecord,
): StoryTimingAdjustmentRecommendationRecord {
  return createRecommendation({
    masterTimingMap,
    conflict,
    recommendedAction: conflict.conflictType === 'too_many_events_same_moment' ? 'remove_event' : 'move_overlay',
    adjustmentType: conflict.conflictType === 'too_many_events_same_moment' ? 'remove_event' : 'reduce_overlap',
    reason: conflict.description,
    userFacingSummary: conflict.conflictType === 'too_many_events_same_moment'
      ? 'Stagger or remove decorative events so one moment does not become crowded.'
      : 'Move the overlay away from captions, faces, or protected visual areas.',
  })
}

export function recommendFixForRhythmConflict(
  masterTimingMap: MasterTimingMapRecord,
  conflict: TimingConflictRecord,
): StoryTimingAdjustmentRecommendationRecord {
  return createRecommendation({
    masterTimingMap,
    conflict,
    recommendedAction: 'adjust_timing',
    adjustmentType: conflict.conflictType === 'overall_pacing_too_slow' ? 'shorten_duration' : 'extend_duration',
    reason: conflict.description,
    userFacingSummary: conflict.conflictType === 'overall_pacing_too_slow'
      ? 'Tighten the slow section while preserving meaning.'
      : 'Add breathing room so the edit remains understandable.',
  })
}

const recommendationForConflict = (
  masterTimingMap: MasterTimingMapRecord,
  conflict: TimingConflictRecord,
): StoryTimingAdjustmentRecommendationRecord => {
  if (conflict.conflictType.startsWith('caption_')) return recommendFixForCaptionConflict(masterTimingMap, conflict)
  if (conflict.conflictType.startsWith('cut_') || conflict.conflictType === 'emotional_pause_removed') return recommendFixForCutConflict(masterTimingMap, conflict)
  if (conflict.conflictType === 'music_ducking_misses_speech') return recommendFixForMusicDuckingConflict(masterTimingMap, conflict)
  if (conflict.conflictType.startsWith('sfx_')) return recommendFixForSFXHitConflict(masterTimingMap, conflict)
  if (
    conflict.conflictType.startsWith('stroke_motion_') ||
    conflict.conflictType.startsWith('graphic_') ||
    conflict.conflictType.startsWith('real_motion_')
  ) {
    return recommendFixForSignatureConflict(masterTimingMap, conflict)
  }
  if (conflict.conflictType === 'caption_overlay_collision' || conflict.conflictType === 'too_many_events_same_moment') {
    return recommendFixForOverlayConflict(masterTimingMap, conflict)
  }
  return recommendFixForRhythmConflict(masterTimingMap, conflict)
}

const recommendationForQACheck = (
  masterTimingMap: MasterTimingMapRecord,
  qaCheck: StoryTimingQACheckRecord,
): StoryTimingAdjustmentRecommendationRecord | undefined => {
  if (qaCheck.status === 'passed' || qaCheck.status === 'waived') return undefined

  return createRecommendation({
    masterTimingMap,
    qaCheck,
    recommendedAction: qaCheck.requiresManualReview ? 'manual_review' : qaCheck.status === 'warning' ? 'adjust_timing' : 'adjust_timing',
    reason: qaCheck.summary,
    userFacingSummary: qaCheck.recommendedFix ?? qaCheck.summary,
    requiresUserApproval: qaCheck.requiresManualReview,
  })
}

export function createTimingAdjustmentRecommendations(input: {
  masterTimingMap: MasterTimingMapRecord
  conflicts?: TimingConflictRecord[]
  qaChecks?: StoryTimingQACheckRecord[]
}): StoryTimingAdjustmentRecommendationRecord[] {
  const recommendations = [
    ...(input.conflicts ?? []).map((conflict) => recommendationForConflict(input.masterTimingMap, conflict)),
    ...(input.qaChecks ?? []).map((check) => recommendationForQACheck(input.masterTimingMap, check)).filter(
      (recommendation): recommendation is StoryTimingAdjustmentRecommendationRecord => Boolean(recommendation),
    ),
  ]
  const byKey = new Map<string, StoryTimingAdjustmentRecommendationRecord>()

  recommendations.forEach((recommendation) => {
    const key = recommendation.relatedConflictId ?? `${recommendation.recommendedAction}:${recommendation.relatedEventIds.join(',')}:${recommendation.reason}`
    if (!byKey.has(key)) {
      byKey.set(key, recommendation)
    }
  })

  return [...byKey.values()]
}

export function createAdjustmentRecommendationSummary(recommendations: StoryTimingAdjustmentRecommendationRecord[]): string {
  if (recommendations.length === 0) {
    return 'No timing adjustment recommendations are needed.'
  }

  const userApproval = recommendations.filter((recommendation) => recommendation.requiresUserApproval).length
  return `${recommendations.length} timing adjustment recommendation(s) created; ${userApproval} need user approval.`
}
