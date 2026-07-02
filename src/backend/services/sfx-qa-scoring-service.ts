import type { RunSFXQARequest } from '../contracts/sfx-director-contracts'

function text(input: RunSFXQARequest): string {
  return [
    input.videoTone,
    input.mockOutputSummary,
    input.sfxEventPlan.videoTone,
    input.sfxEventPlan.sceneContext,
    input.sfxPromptPlan?.prompt,
    input.sfxPromptPlan?.negativePrompt,
    ...(input.userSFXInstructions ?? []),
    ...(input.avoidSFXInstructions ?? []),
  ].join(' ').toLowerCase()
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)))
}

export function scoreSFXTiming(input: RunSFXQARequest): number {
  let score = 94

  if (input.sfxEventPlan.decisionState === 'needed' && !input.sfxTimingAlignment) score -= 30
  if (!input.sfxTimingAlignment && input.sfxEventPlan.decisionState !== 'not_needed') score -= 12
  if (input.sfxTimingAlignment) {
    const deltaMs = Math.round((input.sfxTimingAlignment.hitTimeSeconds - input.sfxTimingAlignment.anchorTimeSeconds) * 1000)
    if (deltaMs > 80) score -= 25
    if (deltaMs < -80) score -= 25
    if (!input.sfxTimingAlignment.frameAccurateRequired && input.sfxEventPlan.timingPriority === 'frame_accurate') score -= 12
  }

  if (input.sfxTrimPlan?.requiresManualReview) score -= 18
  if (input.sfxTrimPlan && input.sfxTrimPlan.trimEndSeconds - input.sfxTrimPlan.trimStartSeconds < 0.25) score -= 25
  if ((input.sfxTrimPlan?.tailMs ?? 0) > 1600 || (input.sfxTimingAlignment?.tailMs ?? 0) > 1600) score -= 16
  if (/late hit|hit late|early hit|bad timing|bad alignment/.test(text(input))) score -= 20
  if (/bad trim|cut off|tail too long/.test(text(input))) score -= 18

  return clampScore(score)
}

export function scoreSFXVolume(input: RunSFXQARequest): number {
  let score = 92
  const mixPlan = input.sfxMixPlan
  const content = text(input)

  if (!mixPlan && input.sfxEventPlan.decisionState === 'needed') score -= 24
  if (mixPlan?.volumeProfile === 'impact' && input.speechPresent) score -= 35
  if (mixPlan && input.speechPresent && (!mixPlan.duckUnderVoice || !mixPlan.sidechainToVoice)) score -= 28
  if (mixPlan && mixPlan.targetGainDb < -32 && mixPlan.volumeProfile !== 'none') score -= 18
  if (/too loud|impact under dialogue|fights voice/.test(content)) score -= 28
  if (/too quiet/.test(content)) score -= 16
  if (/faith|serious|teaching|emotional/.test(content) && mixPlan && !['none', 'whisper', 'subtle_polish'].includes(mixPlan.volumeProfile)) {
    score -= 26
  }

  return clampScore(score)
}

export function scoreSFXStyleFit(input: RunSFXQARequest): number {
  let score = 92
  const content = text(input)

  if (/cartoon|childish|cheap|viral beep|cheap beep/.test(content)) score -= 30
  if (/luxury|premium|real estate/.test(content) && /cartoon|cheap|harsh|hype|boom/.test(content)) score -= 25
  if (/faith|serious|teaching|emotional/.test(content) && /whoosh|impact|hype|boom/.test(content)) score -= 24
  if (input.sfxEventPlan.sourceFootagePolicy === 'edit_layer_only_default' && /footstep|door|car|plate|clothing|crowd/.test(content)) {
    score -= 30
  }
  if (/wrong style|wrong energy|not premium/.test(content)) score -= 24

  return clampScore(score)
}

export function scoreSFXVoiceSafety(input: RunSFXQARequest): number {
  let score = input.speechPresent ? 90 : 96
  const mixPlan = input.sfxMixPlan
  const content = text(input)

  if (input.speechPresent && mixPlan?.volumeProfile === 'impact') score -= 35
  if (input.speechPresent && mixPlan && (!mixPlan.duckUnderVoice || !mixPlan.sidechainToVoice)) score -= 30
  if (input.speechPresent && /over speech|covers dialogue|important speech|key word|fights voice/.test(content)) score -= 25
  if (input.speechPresent && (input.sfxTimingAlignment?.speechSafePlacement === false)) score -= 20

  return clampScore(score)
}

export function scoreSFXMusicFit(input: RunSFXQARequest): number {
  let score = input.musicPresent ? 90 : 95
  const mixPlan = input.sfxMixPlan
  const content = text(input)

  if (input.musicPresent && /fights music|beat mismatch|off beat/.test(content)) score -= 24
  if (input.musicPresent && mixPlan && !mixPlan.duckUnderMusic && mixPlan.fadeOutMs > 300 && mixPlan.mixPriority !== 'music_support') {
    score -= 18
  }
  if (input.sfxTimingAlignment?.musicBeatAligned && /late hit|early hit/.test(content)) score -= 18

  return clampScore(score)
}

export function scoreSFXArtifactQuality(input: RunSFXQARequest): number {
  let score = 95
  const content = text(input)

  if (/artifact|distort|clipping|muddy|bad ai|glitch|noisy/.test(content)) score -= 35
  if (/tail messy|unnatural cut|bad texture/.test(content)) score -= 18
  if (input.sfxGeneratedAsset?.qaStatus === 'failed') score -= 30

  return clampScore(score)
}

export function calculateSFXOverallScore(input: {
  timingScore: number
  volumeScore: number
  styleFitScore: number
  voiceSafetyScore: number
  musicFitScore: number
  artifactScore: number
}): number {
  return clampScore(
    input.timingScore * 0.18 +
      input.volumeScore * 0.2 +
      input.styleFitScore * 0.18 +
      input.voiceSafetyScore * 0.18 +
      input.musicFitScore * 0.12 +
      input.artifactScore * 0.14,
  )
}

export function createSFXScoreSummary(input: RunSFXQARequest): {
  overallScore: number
  timingScore: number
  volumeScore: number
  styleFitScore: number
  voiceSafetyScore: number
  musicFitScore: number
  artifactScore: number
  summary: string[]
} {
  const timingScore = scoreSFXTiming(input)
  const volumeScore = scoreSFXVolume(input)
  const styleFitScore = scoreSFXStyleFit(input)
  const voiceSafetyScore = scoreSFXVoiceSafety(input)
  const musicFitScore = scoreSFXMusicFit(input)
  const artifactScore = scoreSFXArtifactQuality(input)
  const overallScore = calculateSFXOverallScore({
    timingScore,
    volumeScore,
    styleFitScore,
    voiceSafetyScore,
    musicFitScore,
    artifactScore,
  })

  return {
    overallScore,
    timingScore,
    volumeScore,
    styleFitScore,
    voiceSafetyScore,
    musicFitScore,
    artifactScore,
    summary: [
      `Overall SFX QA score: ${overallScore}.`,
      `Timing ${timingScore}, volume ${volumeScore}, style ${styleFitScore}, voice safety ${voiceSafetyScore}, music fit ${musicFitScore}, artifacts ${artifactScore}.`,
    ],
  }
}
