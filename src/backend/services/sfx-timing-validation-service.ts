import type {
  SFXTimingValidationIssue,
  SFXTimingValidationResult,
  SFXTimingAlignmentRecord,
  SFXTimelinePlacement,
  SFXTrimPlanRecord,
} from '../../types'
import type {
  ValidateSFXTimingRequest,
  ValidateSFXTimingResponse,
} from '../contracts/sfx-director-contracts'

function createResult(
  issues: SFXTimingValidationIssue[],
  warnings: string[],
  recommendedFixes: string[],
): SFXTimingValidationResult {
  return {
    ok: issues.length === 0,
    issues,
    warnings,
    recommendedFixes,
  }
}

function mergeResults(results: SFXTimingValidationResult[]): SFXTimingValidationResult {
  const issues = Array.from(new Set(results.flatMap((result) => result.issues)))
  const warnings = Array.from(new Set(results.flatMap((result) => result.warnings)))
  const recommendedFixes = Array.from(new Set(results.flatMap((result) => result.recommendedFixes)))

  return createResult(issues, warnings, recommendedFixes)
}

export function validateSFXTrimPlan(trimPlan: SFXTrimPlanRecord): SFXTimingValidationResult {
  const issues: SFXTimingValidationIssue[] = []
  const warnings: string[] = []
  const recommendedFixes: string[] = []
  const trimDuration = trimPlan.trimEndSeconds - trimPlan.trimStartSeconds

  if (trimDuration < 0.25) {
    issues.push('trim_too_short')
    recommendedFixes.push('Choose a longer clean region so fade and tail are not cut off.')
  }

  if (trimDuration > trimPlan.neededDurationSeconds + 2.5) {
    issues.push('trim_too_long')
    recommendedFixes.push('Shorten the trim window before mix planning.')
  }

  if (trimPlan.hitOffsetInsideTrimMs < 0 || trimPlan.hitOffsetInsideTrimMs > Math.round(trimDuration * 1000)) {
    issues.push('bad_hit_offset')
    recommendedFixes.push('Move the hit offset inside the selected trim window.')
  }

  if (trimPlan.tailMs > 1600) {
    issues.push('tail_too_long')
    recommendedFixes.push('Shorten the tail or add a stronger fade before mix planning.')
  }

  if (trimPlan.requiresManualReview) {
    issues.push('manual_review_needed')
    warnings.push('Trim plan already requested manual review.')
  }

  return createResult(issues, warnings, recommendedFixes)
}

export function validateSFXPlacementAgainstAnchor(
  timingAlignment: SFXTimingAlignmentRecord,
  timelinePlacement?: SFXTimelinePlacement,
): SFXTimingValidationResult {
  const hitTime = timelinePlacement?.hitTimeSeconds ?? timingAlignment.hitTimeSeconds
  const differenceMs = Math.round((hitTime - timingAlignment.anchorTimeSeconds) * 1000)
  const issues: SFXTimingValidationIssue[] = []
  const recommendedFixes: string[] = []

  if (timingAlignment.anchorTimeSeconds === undefined || timingAlignment.anchorTimeSeconds < 0) {
    issues.push('missing_anchor')
    recommendedFixes.push('Set a valid timing anchor before SFX can be aligned.')
  }

  if (differenceMs > 40) {
    issues.push('hit_late')
    recommendedFixes.push('Move the SFX earlier so the chosen hit lands on the anchor.')
  }

  if (differenceMs < -40) {
    issues.push('hit_early')
    recommendedFixes.push('Move the SFX later so the chosen hit lands on the anchor.')
  }

  return createResult(
    issues,
    issues.length > 0 ? [`Hit differs from anchor by ${differenceMs}ms.`] : [],
    recommendedFixes,
  )
}

export function validateSFXPlacementAgainstSpeech(
  timingAlignment: SFXTimingAlignmentRecord,
  speechPresent?: boolean,
): SFXTimingValidationResult {
  if (!speechPresent) return createResult([], [], [])

  if (timingAlignment.timingPriority === 'speech_safe' || timingAlignment.speechSafePlacement) {
    return createResult([], ['Speech is present; RP-SFX-07 should duck this SFX under voice.'], [])
  }

  return createResult(
    ['speech_overlap_risk'],
    ['Speech is present and placement is not marked speech-safe.'],
    ['Move the hit away from important words or force ducking under voice in mix planning.'],
  )
}

export function validateSFXPlacementAgainstMusicBeat(
  timingAlignment: SFXTimingAlignmentRecord,
  musicBeatTimeSeconds?: number,
): SFXTimingValidationResult {
  if (!timingAlignment.musicBeatAligned || musicBeatTimeSeconds === undefined) {
    return createResult([], [], [])
  }

  const differenceMs = Math.round((timingAlignment.hitTimeSeconds - musicBeatTimeSeconds) * 1000)
  if (Math.abs(differenceMs) <= 40) return createResult([], [], [])

  return createResult(
    ['music_beat_mismatch'],
    [`Beat-aligned SFX differs from provided beat by ${differenceMs}ms.`],
    ['Snap the hit to the beat or downgrade timing priority from beat-aligned.'],
  )
}

export function validateSFXTimingAlignment(timingAlignment: SFXTimingAlignmentRecord): SFXTimingValidationResult {
  const issues: SFXTimingValidationIssue[] = []
  const recommendedFixes: string[] = []

  if (timingAlignment.hitOffsetInsideTrimMs < 0) {
    issues.push('bad_hit_offset')
    recommendedFixes.push('Recalculate hit offset inside the trim window.')
  }

  if (timingAlignment.preRollMs < 10 && timingAlignment.anchorType !== 'manual') {
    issues.push('pre_roll_too_short')
    recommendedFixes.push('Add enough pre-roll so the hit does not sound clipped.')
  }

  if (timingAlignment.frameAccurateRequired && !Number.isFinite(timingAlignment.hitTimeSeconds)) {
    issues.push('not_frame_accurate')
    recommendedFixes.push('Create a valid frame-snapped hit time.')
  }

  return createResult(issues, [], recommendedFixes)
}

export function createSFXTimingWarnings(request: ValidateSFXTimingRequest): string[] {
  return [
    ...validateSFXTrimPlan(request.sfxTrimPlan).warnings,
    ...validateSFXTimingAlignment(request.sfxTimingAlignment).warnings,
    ...validateSFXPlacementAgainstAnchor(request.sfxTimingAlignment, request.timelinePlacement).warnings,
    ...validateSFXPlacementAgainstSpeech(request.sfxTimingAlignment, request.speechPresent).warnings,
    ...validateSFXPlacementAgainstMusicBeat(request.sfxTimingAlignment, request.musicBeatTimeSeconds).warnings,
    ...(request.timelinePlacement?.warnings ?? []),
  ]
}

export function validateSFXTiming(
  request: ValidateSFXTimingRequest,
): ValidateSFXTimingResponse {
  const validation = mergeResults([
    validateSFXTrimPlan(request.sfxTrimPlan),
    validateSFXTimingAlignment(request.sfxTimingAlignment),
    validateSFXPlacementAgainstAnchor(request.sfxTimingAlignment, request.timelinePlacement),
    validateSFXPlacementAgainstSpeech(request.sfxTimingAlignment, request.speechPresent),
    validateSFXPlacementAgainstMusicBeat(request.sfxTimingAlignment, request.musicBeatTimeSeconds),
  ])

  validation.warnings = Array.from(new Set([
    ...validation.warnings,
    ...(request.timelinePlacement?.warnings ?? []),
  ]))

  return { validation }
}

export function createSFXTimingValidationSummary(
  validation: SFXTimingValidationResult,
): string[] {
  return [
    validation.ok ? 'Timing validation passed.' : 'Timing validation found issues.',
    validation.issues.length > 0
      ? `Issues: ${validation.issues.join(', ')}.`
      : 'No timing issues were detected.',
    validation.recommendedFixes.length > 0
      ? `Recommended fixes: ${validation.recommendedFixes.join(' ')}`
      : 'No timing fix is required before mix planning.',
  ]
}
