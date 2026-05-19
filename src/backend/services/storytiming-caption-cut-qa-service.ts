import type {
  CaptionTimingPlanRecord,
  CutTimingPlanRecord,
  MasterTimingMapRecord,
  StoryTimingQACheckRecord,
  TimingAnchorRecord,
  TimingConflictRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import { createMockId, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'
import { createCaptionReadabilityCheck } from './storytiming-caption-readability-service'

const createQACheck = (input: {
  masterTimingMap: MasterTimingMapRecord
  checkType: StoryTimingQACheckRecord['checkType']
  status: StoryTimingQACheckRecord['status']
  summary: string
  score: number
  relatedEventIds?: string[]
  relatedAnchorIds?: string[]
  recommendedFix?: string
  blocksRender?: boolean
  requiresManualReview?: boolean
}): StoryTimingQACheckRecord => ({
  id: createMockId('caption-cut-qa'),
  masterTimingMapId: input.masterTimingMap.id,
  projectId: input.masterTimingMap.projectId,
  editPlanId: input.masterTimingMap.editPlanId,
  checkType: input.checkType,
  status: input.status,
  score: input.score,
  relatedEventIds: input.relatedEventIds ?? [],
  relatedAnchorIds: input.relatedAnchorIds ?? [],
  summary: input.summary,
  recommendedFix: input.recommendedFix,
  blocksRender: input.blocksRender ?? false,
  requiresManualReview: input.requiresManualReview ?? false,
  createdAt: nowIso(),
  updatedAt: nowIso(),
  metadata: {
    scope: 'caption_cut',
  },
})

export function checkCaptionSync(
  masterTimingMap: MasterTimingMapRecord,
  captionEvents: TimingEventRecord[],
): StoryTimingQACheckRecord {
  const lagging = captionEvents.filter((event) => event.eventType === 'caption_on' && event.notes.some((note) => note.includes('lags_speech')))

  return createQACheck({
    masterTimingMap,
    checkType: 'caption_sync',
    status: lagging.length > 0 ? 'requires_adjustment' : 'passed',
    summary: lagging.length > 0
      ? 'One or more captions lag speech in the mock timing plan.'
      : 'Caption reveal timing is close to inferred speech anchors.',
    score: lagging.length > 0 ? 74 : 96,
    relatedEventIds: lagging.map((event) => event.id),
    recommendedFix: lagging.length > 0 ? 'Shift caption reveal closer to the phrase anchor.' : undefined,
  })
}

export function checkCaptionReadability(
  masterTimingMap: MasterTimingMapRecord,
  captionTimingPlans: CaptionTimingPlanRecord[],
): StoryTimingQACheckRecord[] {
  return captionTimingPlans.map((plan) => createCaptionReadabilityCheck(masterTimingMap, plan))
}

export function checkCaptionOverlaySafety(
  masterTimingMap: MasterTimingMapRecord,
  conflicts: TimingConflictRecord[],
): StoryTimingQACheckRecord {
  const captionConflicts = conflicts.filter((conflict) => conflict.conflictType === 'caption_overlay_collision')
  const blocksRender = captionConflicts.some((conflict) => conflict.blocksRender)

  return createQACheck({
    masterTimingMap,
    checkType: 'caption_overlay_collision',
    status: captionConflicts.length === 0 ? 'passed' : blocksRender ? 'failed' : 'warning',
    summary: captionConflicts.length === 0
      ? 'No caption/overlay timing collisions were detected.'
      : `${captionConflicts.length} caption/overlay conflict(s) need adjustment.`,
    score: captionConflicts.length === 0 ? 96 : blocksRender ? 58 : 78,
    relatedEventIds: captionConflicts.flatMap((conflict) => conflict.relatedEventIds),
    relatedAnchorIds: captionConflicts.flatMap((conflict) => conflict.relatedAnchorIds),
    recommendedFix: captionConflicts.length === 0 ? undefined : 'Move the caption or shift/shorten the overlay timing.',
    blocksRender,
    requiresManualReview: captionConflicts.some((conflict) => conflict.requiresUserReview),
  })
}

export function checkCutMeaningIntegrity(
  masterTimingMap: MasterTimingMapRecord,
  cutTimingPlans: CutTimingPlanRecord[],
  conflicts: TimingConflictRecord[],
): StoryTimingQACheckRecord {
  const unsafePlans = cutTimingPlans.filter((plan) => !plan.preserveSentenceMeaning)
  const meaningConflicts = conflicts.filter((conflict) => conflict.conflictType === 'cut_before_meaning_complete')

  return createQACheck({
    masterTimingMap,
    checkType: 'speech_cut_integrity',
    status: unsafePlans.length === 0 && meaningConflicts.length === 0 ? 'passed' : 'requires_manual_review',
    summary: unsafePlans.length === 0 && meaningConflicts.length === 0
      ? 'Cut timing preserves inferred phrase and sentence meaning.'
      : 'One or more cuts may happen before meaning completes.',
    score: unsafePlans.length === 0 && meaningConflicts.length === 0 ? 96 : 62,
    relatedEventIds: meaningConflicts.flatMap((conflict) => conflict.relatedEventIds),
    recommendedFix: unsafePlans.length === 0 ? undefined : 'Move the cut after the phrase anchor or ask for manual review.',
    blocksRender: meaningConflicts.some((conflict) => conflict.blocksRender),
    requiresManualReview: unsafePlans.length > 0,
  })
}

export function checkPausePreservation(
  masterTimingMap: MasterTimingMapRecord,
  pauseAnchors: TimingAnchorRecord[],
  conflicts: TimingConflictRecord[],
): StoryTimingQACheckRecord {
  const pauseConflicts = conflicts.filter((conflict) => conflict.conflictType === 'emotional_pause_removed')
  const protectedPauses = pauseAnchors.filter((anchor) => anchor.locked)

  return createQACheck({
    masterTimingMap,
    checkType: 'emotional_pause_preservation',
    status: pauseConflicts.length === 0 ? 'passed' : 'failed',
    summary: pauseConflicts.length === 0
      ? `${protectedPauses.length} protected pause/breath anchor(s) are preserved.`
      : 'A cut removes a protected emotional pause or meaningful breath.',
    score: pauseConflicts.length === 0 ? 96 : 52,
    relatedEventIds: pauseConflicts.flatMap((conflict) => conflict.relatedEventIds),
    relatedAnchorIds: protectedPauses.map((anchor) => anchor.id),
    recommendedFix: pauseConflicts.length === 0 ? undefined : 'Preserve the pause or tighten it less aggressively.',
    blocksRender: pauseConflicts.some((conflict) => conflict.blocksRender),
    requiresManualReview: pauseConflicts.length > 0,
  })
}

export function checkCutPacing(
  masterTimingMap: MasterTimingMapRecord,
  cutTimingPlans: CutTimingPlanRecord[],
): StoryTimingQACheckRecord {
  const aggressive = cutTimingPlans.filter(
    (plan) => plan.intent === 'remove_dead_space' || plan.intent === 'tighten_pause' || plan.intent === 'remove_mistake',
  ).length
  const protectedCuts = cutTimingPlans.filter((plan) => plan.preserveEmotionalPause).length

  return createQACheck({
    masterTimingMap,
    checkType: 'platform_pacing',
    status: protectedCuts > 0 && aggressive > protectedCuts + 4 ? 'warning' : 'passed',
    summary: protectedCuts > 0
      ? 'Cut pacing balances cleanup with protected pauses.'
      : 'Cut pacing is acceptable for the mock edit context.',
    score: protectedCuts > 0 ? 88 : 94,
    recommendedFix: protectedCuts > 0 && aggressive > protectedCuts + 4
      ? 'Reduce aggressive cuts around emotional or teaching moments.'
      : undefined,
  })
}

export function createCaptionCutTimingQAChecks(input: {
  masterTimingMap: MasterTimingMapRecord
  transcriptAnchors: TimingAnchorRecord[]
  captionTimingPlans: CaptionTimingPlanRecord[]
  captionEvents: TimingEventRecord[]
  cutTimingPlans: CutTimingPlanRecord[]
  conflicts: TimingConflictRecord[]
}): StoryTimingQACheckRecord[] {
  const pauseAnchors = input.transcriptAnchors.filter((anchor) => anchor.anchorType === 'pause' || anchor.anchorType === 'breath')

  return [
    checkCaptionSync(input.masterTimingMap, input.captionEvents),
    ...checkCaptionReadability(input.masterTimingMap, input.captionTimingPlans),
    checkCaptionOverlaySafety(input.masterTimingMap, input.conflicts),
    checkCutMeaningIntegrity(input.masterTimingMap, input.cutTimingPlans, input.conflicts),
    checkPausePreservation(input.masterTimingMap, pauseAnchors, input.conflicts),
    checkCutPacing(input.masterTimingMap, input.cutTimingPlans),
  ]
}

export function runCaptionCutTimingQA(input: {
  masterTimingMap: MasterTimingMapRecord
  transcriptAnchors: TimingAnchorRecord[]
  captionTimingPlans: CaptionTimingPlanRecord[]
  captionEvents: TimingEventRecord[]
  cutTimingPlans: CutTimingPlanRecord[]
  cutEvents: TimingEventRecord[]
  conflicts: TimingConflictRecord[]
}): ServiceResult<{ qaChecks: StoryTimingQACheckRecord[]; warnings: string[] }> {
  const qaChecks = createCaptionCutTimingQAChecks(input)
  const warnings = qaChecks.some((check) => check.blocksRender)
    ? ['Caption/cut timing QA found blocking issues.']
    : []

  return ok({ qaChecks, warnings }, warnings)
}

export function createCaptionCutTimingQASummary(qaChecks: StoryTimingQACheckRecord[]): string {
  const blockers = qaChecks.filter((check) => check.blocksRender).length

  return `${qaChecks.length} caption/cut QA check(s) created; ${blockers} block render readiness.`
}
