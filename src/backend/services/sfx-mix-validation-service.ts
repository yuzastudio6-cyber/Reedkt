import type {
  SFXMixPlanRecord,
  SFXMixValidationIssue,
  SFXMixValidationResult,
} from '../../types'
import type {
  ValidateSFXMixPlanRequest,
  ValidateSFXMixPlanResponse,
} from '../contracts/sfx-director-contracts'

function createResult(
  issues: SFXMixValidationIssue[],
  warnings: string[],
  recommendedFixes: string[],
): SFXMixValidationResult {
  return {
    ok: issues.length === 0,
    issues,
    warnings,
    recommendedFixes,
  }
}

function mergeResults(results: SFXMixValidationResult[]): SFXMixValidationResult {
  const issues = Array.from(new Set(results.flatMap((result) => result.issues)))
  const warnings = Array.from(new Set(results.flatMap((result) => result.warnings)))
  const recommendedFixes = Array.from(new Set(results.flatMap((result) => result.recommendedFixes)))
  return createResult(issues, warnings, recommendedFixes)
}

export function validateSFXVolumeAgainstSpeech(
  mixPlan: SFXMixPlanRecord,
  speechPresent?: boolean,
): SFXMixValidationResult {
  if (!speechPresent) return createResult([], [], [])

  const issues: SFXMixValidationIssue[] = []
  const warnings: string[] = []
  const recommendedFixes: string[] = []

  if (mixPlan.volumeProfile === 'impact' || mixPlan.targetGainDb > -8) {
    issues.push('too_loud_for_dialogue')
    recommendedFixes.push('Lower SFX to whisper/subtle/premium-soft or move the hit away from speech.')
  }

  if (!mixPlan.duckUnderVoice || !mixPlan.sidechainToVoice) {
    issues.push('ducking_missing')
    recommendedFixes.push('Enable voice ducking and voice sidechain for speech-present SFX.')
  }

  if (mixPlan.stereoWidth > 60) {
    issues.push('too_wide_for_dialogue')
    recommendedFixes.push('Narrow stereo width while dialogue is present.')
  }

  if (issues.length === 0) warnings.push('Speech is present; final QA should still confirm voice clarity.')

  return createResult(issues, warnings, recommendedFixes)
}

export function validateSFXVolumeAgainstMusic(
  mixPlan: SFXMixPlanRecord,
  musicPresent?: boolean,
): SFXMixValidationResult {
  if (!musicPresent) {
    if (mixPlan.volumeProfile !== 'none' && mixPlan.targetGainDb < -32) {
      return createResult(
        ['too_quiet_to_notice'],
        ['SFX may be too quiet to serve its planned edit-layer purpose.'],
        ['Raise the gain hint or use no SFX if the cue should not be heard.'],
      )
    }

    return createResult([], [], [])
  }

  if (mixPlan.volumeProfile !== 'none' && mixPlan.targetGainDb < -32) {
    return createResult(
      ['too_quiet_to_notice'],
      ['SFX may disappear under the music bed.'],
      ['Raise the gain hint slightly or mark the cue as no SFX.'],
    )
  }

  if (!mixPlan.duckUnderMusic && mixPlan.fadeOutMs > 300 && mixPlan.mixPriority !== 'music_support') {
    return createResult(
      ['fights_music'],
      ['Sustained SFX may fight music because music ducking is off.'],
      ['Duck longer SFX under music after the hit point.'],
    )
  }

  return createResult([], ['Music is present; short hit accents may briefly sit above the bed.'], [])
}

export function validateSFXFadePlan(mixPlan: SFXMixPlanRecord): SFXMixValidationResult {
  const issues: SFXMixValidationIssue[] = []
  const recommendedFixes: string[] = []

  if (mixPlan.volumeProfile !== 'none' && mixPlan.fadeOutMs < 40) {
    issues.push('fade_too_short')
    recommendedFixes.push('Use a longer fade-out to avoid clipped or cheap-sounding tails.')
  }

  if (mixPlan.fadeInMs > 900 || mixPlan.fadeOutMs > 1200) {
    issues.push('fade_too_long')
    recommendedFixes.push('Shorten fade timing unless this is an intentional ambient bridge.')
  }

  return createResult(issues, [], recommendedFixes)
}

export function validateSFXEQGuidance(mixPlan: SFXMixPlanRecord): SFXMixValidationResult {
  if (
    mixPlan.eqProfile === 'tight_social' &&
    mixPlan.voicePresent &&
    mixPlan.volumeProfile !== 'whisper' &&
    mixPlan.volumeProfile !== 'subtle_polish'
  ) {
    return createResult(
      ['harsh_frequency_risk'],
      ['Tight/social EQ under dialogue can feel harsh.'],
      ['Use voice-safe EQ and soften highs under speech.'],
    )
  }

  return createResult([], [], [])
}

export function validateSFXStereoWidth(mixPlan: SFXMixPlanRecord): SFXMixValidationResult {
  if (mixPlan.voicePresent && mixPlan.stereoWidth > 60) {
    return createResult(
      ['too_wide_for_dialogue'],
      ['Stereo width may distract from dialogue.'],
      ['Use narrow or moderate stereo width under speech.'],
    )
  }

  return createResult([], [], [])
}

export function validateSFXReverbRoomMatch(
  mixPlan: SFXMixPlanRecord,
  ambienceImportant?: boolean,
): SFXMixValidationResult {
  const issues: SFXMixValidationIssue[] = []
  const warnings: string[] = []
  const recommendedFixes: string[] = []

  if (ambienceImportant && mixPlan.reverbProfile !== 'room_matched' && mixPlan.reverbProfile !== 'natural_air') {
    issues.push('reverb_mismatch')
    recommendedFixes.push('Use natural or room-matched reverb for ambience-important scenes.')
  }

  if (ambienceImportant && !/room match|ambience|source/i.test(`${mixPlan.roomMatch} ${mixPlan.reverbMatch}`)) {
    issues.push('room_mismatch')
    recommendedFixes.push('Add explicit room-match guidance before SFX QA.')
  }

  if (mixPlan.volumeProfile === 'impact' && mixPlan.voicePresent) {
    issues.push('manual_review_needed')
    warnings.push('Impact SFX under dialogue requires manual review.')
  }

  return createResult(issues, warnings, recommendedFixes)
}

export function validateSFXMixPlan(
  request: ValidateSFXMixPlanRequest,
): ValidateSFXMixPlanResponse {
  const validation = mergeResults([
    validateSFXVolumeAgainstSpeech(request.sfxMixPlan, request.speechPresent ?? request.sfxMixPlan.voicePresent),
    validateSFXVolumeAgainstMusic(request.sfxMixPlan, request.musicPresent ?? request.sfxMixPlan.musicPresent),
    validateSFXFadePlan(request.sfxMixPlan),
    validateSFXEQGuidance(request.sfxMixPlan),
    validateSFXStereoWidth(request.sfxMixPlan),
    validateSFXReverbRoomMatch(request.sfxMixPlan, request.ambienceImportant ?? request.sfxMixPlan.ambienceImportant),
  ])

  return { validation }
}

export function createSFXMixWarnings(request: ValidateSFXMixPlanRequest): string[] {
  return validateSFXMixPlan(request).validation.warnings
}

export function createSFXMixValidationSummary(validation: SFXMixValidationResult): string[] {
  return [
    validation.ok ? 'SFX mix validation passed.' : 'SFX mix validation found issues.',
    validation.issues.length > 0
      ? `Issues: ${validation.issues.join(', ')}.`
      : 'No mix issues were detected.',
    validation.recommendedFixes.length > 0
      ? `Recommended fixes: ${validation.recommendedFixes.join(' ')}`
      : 'No mix fix is required before SFX QA.',
  ]
}
