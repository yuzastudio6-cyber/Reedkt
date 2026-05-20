import type {
  RenderTimingManifestRecord,
  StoryTimingQACheckRecord,
  StoryTimingReadinessDecision,
  TimingConflictRecord,
} from '../../types/storytiming'

const hasRenderManifestFailure = (
  renderTimingManifest: RenderTimingManifestRecord | undefined,
  qaChecks: StoryTimingQACheckRecord[] = [],
): boolean =>
  !renderTimingManifest ||
  renderTimingManifest.readyForRender === false ||
  qaChecks.some((check) => check.checkType === 'render_manifest_integrity' && (check.blocksRender || check.status === 'failed'))

export function blocksRenderDueToTiming(
  conflicts: TimingConflictRecord[] = [],
  qaChecks: StoryTimingQACheckRecord[] = [],
  renderTimingManifest?: RenderTimingManifestRecord,
): boolean {
  return (
    conflicts.some((conflict) => conflict.severity === 'critical' || conflict.blocksRender) ||
    qaChecks.some((check) => check.blocksRender || check.status === 'failed') ||
    hasRenderManifestFailure(renderTimingManifest, qaChecks)
  )
}

export function requiresUserReviewForTiming(
  conflicts: TimingConflictRecord[] = [],
  qaChecks: StoryTimingQACheckRecord[] = [],
): boolean {
  return (
    conflicts.some((conflict) => conflict.requiresUserReview || conflict.status === 'needs_user_review') ||
    qaChecks.some((check) => check.requiresManualReview || check.status === 'requires_manual_review')
  )
}

export function requiresTimingAdjustment(
  conflicts: TimingConflictRecord[] = [],
  qaChecks: StoryTimingQACheckRecord[] = [],
  overallScore = 100,
): boolean {
  return (
    overallScore < 70 ||
    conflicts.some((conflict) => conflict.severity === 'high') ||
    qaChecks.some((check) => check.status === 'requires_adjustment' || check.status === 'failed')
  )
}

export function determineStoryTimingReadiness(input: {
  conflicts?: TimingConflictRecord[]
  qaChecks?: StoryTimingQACheckRecord[]
  overallScore?: number
  renderTimingManifest?: RenderTimingManifestRecord
}): StoryTimingReadinessDecision {
  const conflicts = input.conflicts ?? []
  const qaChecks = input.qaChecks ?? []
  const overallScore = input.overallScore ?? 100

  if (blocksRenderDueToTiming(conflicts, qaChecks, input.renderTimingManifest)) {
    return 'blocked_for_render'
  }

  if (requiresUserReviewForTiming(conflicts, qaChecks)) {
    return 'requires_user_review'
  }

  if (requiresTimingAdjustment(conflicts, qaChecks, overallScore)) {
    return 'requires_timing_adjustment'
  }

  if (
    conflicts.length > 0 ||
    qaChecks.some((check) => check.status === 'warning' || check.status === 'pending') ||
    overallScore < 90
  ) {
    return 'ready_with_warnings'
  }

  return 'ready_for_preview'
}

export function determinePreviewReadiness(decision: StoryTimingReadinessDecision): boolean {
  return decision === 'ready_for_preview' || decision === 'ready_with_warnings'
}

export function determineRenderReadiness(decision: StoryTimingReadinessDecision): boolean {
  return decision === 'ready_for_preview'
}

export function createReadinessSummary(decision: StoryTimingReadinessDecision): string {
  if (decision === 'ready_for_preview') {
    return 'Timing QA is ready for preview with no major timing conflicts.'
  }

  if (decision === 'ready_with_warnings') {
    return 'Timing QA is ready with warnings; preview can proceed, but timing notes should be reviewed.'
  }

  if (decision === 'requires_timing_adjustment') {
    return 'Timing QA found issues that should be adjusted before preview.'
  }

  if (decision === 'requires_user_review') {
    return 'Timing QA found subjective or instruction-related timing issues that need user review.'
  }

  return 'Timing QA is blocked for render until critical timing issues are fixed.'
}
