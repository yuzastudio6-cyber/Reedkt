import type {
  RenderTimingManifestRecord,
  StoryTimingQACategory,
  StoryTimingQACheckRecord,
  TimingConflictRecord,
} from '../../types/storytiming'

export interface StoryTimingCategoryScoreInput {
  conflicts?: TimingConflictRecord[]
  qaChecks?: StoryTimingQACheckRecord[]
  renderTimingManifest?: RenderTimingManifestRecord
}

export interface StoryTimingScoreBreakdown {
  overallScore: number
  captionCutScore: number
  musicSfxScore: number
  signatureTimingScore: number
  overlaySafetyScore: number
  emotionalTimingScore: number
  overallRhythmScore: number
  renderManifestScore: number
}

const CONFLICT_PENALTIES: Record<TimingConflictRecord['severity'], number> = {
  low: 4,
  medium: 10,
  high: 22,
  critical: 45,
}

const CHECK_PENALTIES: Record<StoryTimingQACheckRecord['status'], number> = {
  pending: 6,
  passed: 0,
  warning: 8,
  failed: 35,
  requires_adjustment: 18,
  requires_manual_review: 22,
  waived: 2,
}

const clampScore = (score: number): number => Math.max(0, Math.min(100, Math.round(score)))

export function categoryForConflict(conflict: TimingConflictRecord): StoryTimingQACategory {
  if (
    conflict.conflictType === 'caption_overlay_collision' ||
    conflict.conflictType === 'stroke_motion_caption_overlap' ||
    conflict.conflictType.includes('blocks_') ||
    conflict.conflictType === 'too_many_events_same_moment'
  ) {
    return 'overlay_safety'
  }

  if (conflict.conflictType === 'emotional_pause_removed' || conflict.conflictType === 'signature_overlay_during_emotional_pause') {
    return 'emotional_timing'
  }

  if (
    conflict.conflictType.startsWith('caption_') ||
    conflict.conflictType.startsWith('cut_') ||
    conflict.conflictType === 'transition_cuts_story_beat'
  ) {
    return 'caption_cut'
  }

  if (conflict.conflictType.startsWith('music_') || conflict.conflictType.startsWith('sfx_')) {
    return 'music_sfx'
  }

  if (
    conflict.conflictType.startsWith('stroke_motion_') ||
    conflict.conflictType.startsWith('graphic_') ||
    conflict.conflictType.startsWith('real_motion_')
  ) {
    return 'signature_animation'
  }

  if (conflict.conflictType.startsWith('overall_')) {
    return 'overall_rhythm'
  }

  return 'overall_rhythm'
}

export function categoryForQACheck(check: StoryTimingQACheckRecord): StoryTimingQACategory {
  if (check.checkType === 'caption_overlay_collision' || check.checkType === 'signature_overlay_collisions') {
    return 'overlay_safety'
  }

  if (check.checkType === 'emotional_pause_preservation') {
    return 'emotional_timing'
  }

  if (
    check.checkType.startsWith('caption_') ||
    check.checkType === 'speech_cut_integrity' ||
    check.checkType === 'transition_timing'
  ) {
    return 'caption_cut'
  }

  if (
    check.checkType.startsWith('music_') ||
    check.checkType.startsWith('sfx_') ||
    check.checkType === 'signature_sfx_sync'
  ) {
    return 'music_sfx'
  }

  if (
    check.checkType.startsWith('stroke_motion_') ||
    check.checkType.startsWith('graphic_') ||
    check.checkType.startsWith('real_motion_') ||
    check.checkType === 'signature_timing_story_meaning'
  ) {
    return 'signature_animation'
  }

  if (check.checkType === 'overall_rhythm' || check.checkType === 'platform_pacing') {
    return 'overall_rhythm'
  }

  if (check.checkType === 'render_manifest_integrity') {
    return 'render_manifest'
  }

  return 'overall_rhythm'
}

const scoreCategory = (
  category: StoryTimingQACategory,
  input: StoryTimingCategoryScoreInput,
): number => {
  const conflicts = (input.conflicts ?? []).filter((conflict) => categoryForConflict(conflict) === category)
  const qaChecks = (input.qaChecks ?? []).filter((check) => categoryForQACheck(check) === category)
  const conflictPenalty = conflicts.reduce((sum, conflict) => sum + CONFLICT_PENALTIES[conflict.severity], 0)
  const qaPenalty = qaChecks.reduce((sum, check) => sum + CHECK_PENALTIES[check.status], 0)
  const blockingPenalty = conflicts.some((conflict) => conflict.blocksRender) || qaChecks.some((check) => check.blocksRender)
    ? 20
    : 0
  const baseScore = 100 - conflictPenalty - qaPenalty - blockingPenalty

  return blockingPenalty > 0 ? Math.min(49, clampScore(baseScore)) : clampScore(baseScore)
}

export function scoreCaptionCutTiming(input: StoryTimingCategoryScoreInput): number {
  return scoreCategory('caption_cut', input)
}

export function scoreMusicSFXTiming(input: StoryTimingCategoryScoreInput): number {
  return scoreCategory('music_sfx', input)
}

export function scoreSignatureAnimationTiming(input: StoryTimingCategoryScoreInput): number {
  return scoreCategory('signature_animation', input)
}

export function scoreOverlaySafety(input: StoryTimingCategoryScoreInput): number {
  return scoreCategory('overlay_safety', input)
}

export function scoreEmotionalTiming(input: StoryTimingCategoryScoreInput): number {
  return scoreCategory('emotional_timing', input)
}

export function scoreOverallRhythm(input: StoryTimingCategoryScoreInput): number {
  return scoreCategory('overall_rhythm', input)
}

export function scoreRenderManifestIntegrity(input: StoryTimingCategoryScoreInput): number {
  const base = scoreCategory('render_manifest', input)

  if (!input.renderTimingManifest) {
    return Math.min(base, 62)
  }

  if (!input.renderTimingManifest.readyForRender) {
    return Math.min(base, 68)
  }

  if (input.renderTimingManifest.tracks.length === 0 || input.renderTimingManifest.events.length === 0) {
    return Math.min(base, 70)
  }

  return base
}

export function calculateStoryTimingOverallScore(scores: Omit<StoryTimingScoreBreakdown, 'overallScore'>): number {
  return clampScore(
    scores.captionCutScore * 0.18 +
      scores.musicSfxScore * 0.16 +
      scores.signatureTimingScore * 0.16 +
      scores.overlaySafetyScore * 0.16 +
      scores.emotionalTimingScore * 0.14 +
      scores.overallRhythmScore * 0.1 +
      scores.renderManifestScore * 0.1,
  )
}

export function createStoryTimingScoreBreakdown(input: StoryTimingCategoryScoreInput): StoryTimingScoreBreakdown {
  const categoryScores = {
    captionCutScore: scoreCaptionCutTiming(input),
    musicSfxScore: scoreMusicSFXTiming(input),
    signatureTimingScore: scoreSignatureAnimationTiming(input),
    overlaySafetyScore: scoreOverlaySafety(input),
    emotionalTimingScore: scoreEmotionalTiming(input),
    overallRhythmScore: scoreOverallRhythm(input),
    renderManifestScore: scoreRenderManifestIntegrity(input),
  }

  return {
    ...categoryScores,
    overallScore: calculateStoryTimingOverallScore(categoryScores),
  }
}

export function createStoryTimingScoreSummary(scores: StoryTimingScoreBreakdown): string {
  return `Timing QA score ${scores.overallScore}/100: captions/cuts ${scores.captionCutScore}, music/SFX ${scores.musicSfxScore}, signatures ${scores.signatureTimingScore}, overlays ${scores.overlaySafetyScore}, emotion ${scores.emotionalTimingScore}, rhythm ${scores.overallRhythmScore}, render manifest ${scores.renderManifestScore}.`
}
