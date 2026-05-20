import type {
  MasterTimingMapRecord,
  SignatureTimingPlanRecord,
  StoryTimingQACheckRecord,
  StoryTimingQACheckStatus,
  StoryTimingQACheckType,
  TimingConflictRecord,
  TimingDependencyRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import type { TimeRange } from '../../types/shared'
import { createMockId, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'

interface SignatureQACheckInput {
  masterTimingMap: MasterTimingMapRecord
  checkType: StoryTimingQACheckType
  status: StoryTimingQACheckStatus
  summary: string
  score: number
  timeRange?: TimeRange
  relatedEventIds?: string[]
  relatedAnchorIds?: string[]
  recommendedFix?: string
  blocksRender?: boolean
  requiresManualReview?: boolean
}

const createQACheck = (input: SignatureQACheckInput): StoryTimingQACheckRecord => ({
  id: createMockId('signature-timing-qa'),
  masterTimingMapId: input.masterTimingMap.id,
  projectId: input.masterTimingMap.projectId,
  editPlanId: input.masterTimingMap.editPlanId,
  checkType: input.checkType,
  status: input.status,
  score: input.score,
  timeRange: input.timeRange,
  relatedEventIds: input.relatedEventIds ?? [],
  relatedAnchorIds: input.relatedAnchorIds ?? [],
  summary: input.summary,
  recommendedFix: input.recommendedFix,
  blocksRender: input.blocksRender ?? false,
  requiresManualReview: input.requiresManualReview ?? false,
  createdAt: nowIso(),
  updatedAt: nowIso(),
  metadata: { mockOnly: true },
})

const conflictsOf = (
  conflicts: TimingConflictRecord[],
  conflictTypes: TimingConflictRecord['conflictType'][],
): TimingConflictRecord[] => conflicts.filter((conflict) => conflictTypes.includes(conflict.conflictType))

const checkFromConflicts = (
  masterTimingMap: MasterTimingMapRecord,
  checkType: StoryTimingQACheckType,
  conflicts: TimingConflictRecord[],
  passingSummary: string,
  issueSummary: string,
  recommendedFix: string,
): StoryTimingQACheckRecord => {
  const blocksRender = conflicts.some((conflict) => conflict.blocksRender)
  return createQACheck({
    masterTimingMap,
    checkType,
    status: conflicts.length === 0 ? 'passed' : blocksRender ? 'failed' : 'warning',
    summary: conflicts.length === 0 ? passingSummary : `${issueSummary} ${conflicts.length} issue(s) found.`,
    score: conflicts.length === 0 ? 95 : blocksRender ? 58 : 76,
    timeRange: conflicts[0]?.timeRange,
    relatedEventIds: conflicts.flatMap((conflict) => conflict.relatedEventIds),
    relatedAnchorIds: conflicts.flatMap((conflict) => conflict.relatedAnchorIds),
    recommendedFix: conflicts.length === 0 ? undefined : recommendedFix,
    blocksRender,
    requiresManualReview: conflicts.some((conflict) => conflict.requiresUserReview),
  })
}

export function checkStrokeMotionWordSync(
  masterTimingMap: MasterTimingMapRecord,
  conflicts: TimingConflictRecord[] = [],
): StoryTimingQACheckRecord {
  return checkFromConflicts(
    masterTimingMap,
    'stroke_motion_word_sync',
    conflictsOf(conflicts, ['stroke_motion_late']),
    'Stroke Motion word/phrase sync follows the planned meaning anchors.',
    'Stroke Motion word/phrase sync needs adjustment.',
    'Shift or shorten Stroke Motion so completion lands on the phrase/key word.',
  )
}

export function checkStrokeMotionCompletionTiming(
  masterTimingMap: MasterTimingMapRecord,
  conflicts: TimingConflictRecord[] = [],
): StoryTimingQACheckRecord {
  return checkFromConflicts(
    masterTimingMap,
    'stroke_motion_completion_timing',
    conflictsOf(conflicts, ['stroke_motion_late', 'stroke_motion_too_fast']),
    'Stroke Motion completion timing supports viewer comprehension.',
    'Stroke Motion completion is late or too fast.',
    'Move completion to the phrase end or lengthen the draw enough to understand.',
  )
}

export function checkGraphicReadabilityTime(
  masterTimingMap: MasterTimingMapRecord,
  conflicts: TimingConflictRecord[] = [],
): StoryTimingQACheckRecord {
  return checkFromConflicts(
    masterTimingMap,
    'graphic_readability_time',
    conflictsOf(conflicts, ['graphic_not_readable_long_enough']),
    'Graphic Design overlays remain readable long enough.',
    'A Graphic Design overlay is not readable long enough.',
    'Extend the graphic hold, simplify text, or reveal items over multiple beats.',
  )
}

export function checkGraphicRevealTiming(
  masterTimingMap: MasterTimingMapRecord,
  conflicts: TimingConflictRecord[] = [],
): StoryTimingQACheckRecord {
  return checkFromConflicts(
    masterTimingMap,
    'graphic_reveal_timing',
    conflictsOf(conflicts, ['graphic_reveal_too_early', 'graphic_reveal_too_late', 'graphic_stays_after_topic']),
    'Graphic Design reveal/hide timing follows concept introduction and topic changes.',
    'Graphic Design reveal or hide timing needs adjustment.',
    'Reveal the graphic with the concept and hide it before the next idea gets crowded.',
  )
}

export function checkRealMotionEntryExitTiming(
  masterTimingMap: MasterTimingMapRecord,
  conflicts: TimingConflictRecord[] = [],
): StoryTimingQACheckRecord {
  return checkFromConflicts(
    masterTimingMap,
    'real_motion_entry_exit_timing',
    conflictsOf(conflicts, ['real_motion_enters_too_early', 'real_motion_settles_late', 'real_motion_distracts_during_speech']),
    'Real Motion enters, settles, and exits in a story-aware window.',
    'Real Motion entry, settle, or exit timing needs adjustment.',
    'Shift Real Motion to the concept mention and exit before it distracts.',
  )
}

export function checkRealMotionFaceSafety(
  masterTimingMap: MasterTimingMapRecord,
  conflicts: TimingConflictRecord[] = [],
): StoryTimingQACheckRecord {
  return checkFromConflicts(
    masterTimingMap,
    'real_motion_face_safety',
    conflictsOf(conflicts, ['real_motion_blocks_face', 'real_motion_blocks_object']),
    'Real Motion face/object safety is acceptable for mock planning.',
    'Real Motion face or object safety needs review.',
    'Move, shrink, or delay the Real Motion object so it avoids face and proof zones.',
  )
}

export function checkSignatureOverlayCollisions(
  masterTimingMap: MasterTimingMapRecord,
  conflicts: TimingConflictRecord[] = [],
): StoryTimingQACheckRecord {
  return checkFromConflicts(
    masterTimingMap,
    'signature_overlay_collisions',
    conflictsOf(conflicts, [
      'caption_overlay_collision',
      'stroke_motion_caption_overlap',
      'too_many_events_same_moment',
      'signature_overlay_during_emotional_pause',
    ]),
    'Signature overlay collision checks passed for mock timing.',
    'Signature overlay collision checks found crowded or unsafe timing.',
    'Move overlays away from captions, emotional pauses, or crowded timing buckets.',
  )
}

export function checkSignatureSFXSync(
  masterTimingMap: MasterTimingMapRecord,
  dependencies: TimingDependencyRecord[] = [],
  conflicts: TimingConflictRecord[] = [],
): StoryTimingQACheckRecord {
  const sfxConflicts = conflictsOf(conflicts, ['sfx_hit_late', 'sfx_hit_early', 'sfx_tail_over_speech'])
  const sfxDependencies = dependencies.filter((dependency) => dependency.reason.toLowerCase().includes('signature'))

  if (sfxConflicts.length > 0) {
    return checkFromConflicts(
      masterTimingMap,
      'signature_sfx_sync',
      sfxConflicts,
      'Signature SFX sync is aligned.',
      'Signature SFX sync needs timing adjustment.',
      'Move SFX hit timing to the signature reveal, completion, or settle frame.',
    )
  }

  return createQACheck({
    masterTimingMap,
    checkType: 'signature_sfx_sync',
    status: sfxDependencies.length > 0 ? 'passed' : 'warning',
    summary: sfxDependencies.length > 0
      ? 'Signature SFX sync dependencies are present and voice-safe in the mock map.'
      : 'No signature SFX sync dependencies were needed or available.',
    score: sfxDependencies.length > 0 ? 94 : 82,
  })
}

const checkSignatureStoryMeaning = (
  masterTimingMap: MasterTimingMapRecord,
  signatureTimingPlans: SignatureTimingPlanRecord[] = [],
  conflicts: TimingConflictRecord[] = [],
): StoryTimingQACheckRecord => {
  const meaningConflicts = conflictsOf(conflicts, [
    'stroke_motion_late',
    'graphic_reveal_too_early',
    'graphic_reveal_too_late',
    'real_motion_enters_too_early',
    'signature_overlay_during_emotional_pause',
  ])

  return createQACheck({
    masterTimingMap,
    checkType: 'signature_timing_story_meaning',
    status: meaningConflicts.length === 0 && signatureTimingPlans.length > 0 ? 'passed' : meaningConflicts.length > 0 ? 'warning' : 'warning',
    summary: meaningConflicts.length === 0 && signatureTimingPlans.length > 0
      ? 'Signature timing follows speech meaning, story beats, and comprehension hierarchy.'
      : signatureTimingPlans.length === 0
        ? 'No signature timing plans were created for this map.'
        : 'Some signature timing should move closer to speech meaning or protected emotional timing.',
    score: meaningConflicts.length === 0 && signatureTimingPlans.length > 0 ? 95 : 78,
    relatedEventIds: meaningConflicts.flatMap((conflict) => conflict.relatedEventIds),
    relatedAnchorIds: meaningConflicts.flatMap((conflict) => conflict.relatedAnchorIds),
    recommendedFix: meaningConflicts.length === 0 ? undefined : 'Re-anchor signature timing to the nearest phrase, story beat, or emotional timing marker.',
  })
}

export function createSignatureTimingQAChecks(input: {
  masterTimingMap: MasterTimingMapRecord
  signatureTimingPlans: SignatureTimingPlanRecord[]
  events: TimingEventRecord[]
  dependencies: TimingDependencyRecord[]
  conflicts: TimingConflictRecord[]
}): StoryTimingQACheckRecord[] {
  return [
    checkStrokeMotionWordSync(input.masterTimingMap, input.conflicts),
    checkStrokeMotionCompletionTiming(input.masterTimingMap, input.conflicts),
    checkGraphicReadabilityTime(input.masterTimingMap, input.conflicts),
    checkGraphicRevealTiming(input.masterTimingMap, input.conflicts),
    checkRealMotionEntryExitTiming(input.masterTimingMap, input.conflicts),
    checkRealMotionFaceSafety(input.masterTimingMap, input.conflicts),
    checkSignatureOverlayCollisions(input.masterTimingMap, input.conflicts),
    checkSignatureSFXSync(input.masterTimingMap, input.dependencies, input.conflicts),
    checkSignatureStoryMeaning(input.masterTimingMap, input.signatureTimingPlans, input.conflicts),
  ]
}

export function runSignatureTimingQA(input: {
  masterTimingMap: MasterTimingMapRecord
  signatureTimingPlans: SignatureTimingPlanRecord[]
  events: TimingEventRecord[]
  dependencies: TimingDependencyRecord[]
  conflicts: TimingConflictRecord[]
}): ServiceResult<{ qaChecks: StoryTimingQACheckRecord[]; warnings: string[] }> {
  const qaChecks = createSignatureTimingQAChecks(input)
  const warnings = qaChecks.some((check) => check.blocksRender || check.status === 'failed')
    ? ['Signature timing QA found blocking or failed checks.']
    : []

  return ok({ qaChecks, warnings }, warnings)
}

export function createSignatureTimingQASummary(qaChecks: StoryTimingQACheckRecord[]): string {
  const warnings = qaChecks.filter((check) => check.status === 'warning' || check.status === 'requires_adjustment').length
  const blockers = qaChecks.filter((check) => check.blocksRender).length

  return `${qaChecks.length} signature timing QA check(s) created; ${warnings} warning(s), ${blockers} blocker(s).`
}
