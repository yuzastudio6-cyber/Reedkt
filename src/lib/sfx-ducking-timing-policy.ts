import type {
  CaptionVisualCueTimingPlan,
  DuckingReasonType,
  PlannerInput,
  RefinedMusicDuckingTimingItem,
  RefinedSfxTimingItem,
  RefinedTransitionTimingItem,
  SfxDensityLevel,
  SfxIntensity,
  SoundSyncCueType,
  TranscriptTimingLine,
  VisualCueTimingItem,
} from '../types/reeditpro'
import { createFrameTimeRangeFromFrames } from './timing-utils'

function restrained(input: PlannerInput) {
  return input.editingCategory === 'documentary_case_study' || /\b(calm|restrained|natural|no sfx|minimal sfx)\b/i.test(input.customInstructions)
}

export function getSfxDensityLevel(params: {
  input: PlannerInput
}): SfxDensityLevel {
  if (/\b(no sfx|voice only)\b/i.test(params.input.customInstructions)) return 'none'
  if (params.input.editLevel === 'basic') return restrained(params.input) ? 'none' : 'low'
  if (params.input.editLevel === 'pro') return restrained(params.input) ? 'low' : 'balanced'
  return restrained(params.input) ? 'balanced' : 'premium_refined'
}

export function shouldCreateSfxForCue(params: {
  input: PlannerInput
  densityLevel: SfxDensityLevel
  cue?: VisualCueTimingItem
  transition?: RefinedTransitionTimingItem
}) {
  if (params.densityLevel === 'none') return false
  if (params.input.editLevel === 'basic' && restrained(params.input)) return false
  if (params.input.editingCategory === 'documentary_case_study' && !(params.cue?.cueType.includes('evidence') || params.transition?.transitionType === 'documentary_cut')) {
    return false
  }
  if (params.transition?.riskLevel === 'high' || params.transition?.riskLevel === 'blocking') return false
  return Boolean(params.cue || params.transition)
}

function cueTypeForVisual(cue: VisualCueTimingItem): SoundSyncCueType {
  if (cue.cueType.includes('map_pin')) return 'map_pin_drop'
  if (cue.cueType.includes('chart')) return 'count_up'
  if (cue.cueType.includes('card')) return 'card_reveal'
  return 'visual_reveal'
}

function intensityForDensity(densityLevel: SfxDensityLevel): SfxIntensity {
  if (densityLevel === 'none') return 'none'
  if (densityLevel === 'low') return 'subtle'
  if (densityLevel === 'balanced') return 'balanced'
  return 'strong'
}

export function createSfxTimingForCue(params: {
  input: PlannerInput
  densityLevel: SfxDensityLevel
  cue?: VisualCueTimingItem
  transition?: RefinedTransitionTimingItem
  index: number
}): RefinedSfxTimingItem | undefined {
  if (!shouldCreateSfxForCue(params)) return undefined
  const sourceRange = params.cue?.timeRange ?? params.transition?.timeRange
  if (!sourceRange) return undefined
  const duration = Math.max(1, Math.round(sourceRange.fps * 0.12))
  const endFrame = Math.min(sourceRange.endFrame, sourceRange.startFrame + duration)

  return {
    id: `refined-sfx-${params.index + 1}`,
    cueType: params.cue ? cueTypeForVisual(params.cue) : 'transition',
    label: params.cue ? `${params.cue.label} SFX` : `${params.transition?.transitionType.replaceAll('_', ' ')} SFX`,
    timeRange: createFrameTimeRangeFromFrames(sourceRange.startFrame, endFrame, sourceRange.fps),
    linkedVisualCueTimingItemId: params.cue?.id,
    linkedTransitionTimingItemId: params.transition?.id,
    linkedBeatId: params.transition?.beatSnapDecision?.linkedBeatId,
    intensity: intensityForDensity(params.densityLevel),
    densityLevel: params.densityLevel,
    reason: params.cue
      ? `SFX is tied to the planned ${params.cue.cueType.replaceAll('_', ' ')} cue, not random.`
      : 'SFX is tied to the planned transition cue, not random.',
    avoidRules: [
      'Do not cover speech.',
      'Do not add random whooshes or impacts.',
      'Remove SFX if it competes with captions or documentary source labels.',
    ],
    qaChecks: [
      'SFX has linked visual/transition cue.',
      'SFX timing has a frame range.',
      'Voice clarity remains protected.',
    ],
  }
}

export function getDuckingStrength(params: {
  input: PlannerInput
  reasonType?: DuckingReasonType
}): RefinedMusicDuckingTimingItem['duckingStrength'] {
  if (params.input.editingCategory === 'documentary_case_study') return 'medium'
  if (params.reasonType === 'important_phrase' || params.reasonType === 'caption_heavy_section') return 'medium'
  if (params.input.editLevel === 'premium') return 'medium'
  return 'light'
}

function reasonTypeForSpeech(line: TranscriptTimingLine, captionVisualCueTimingPlan?: CaptionVisualCueTimingPlan): DuckingReasonType {
  if (line.lineType === 'proof' || line.lineType === 'claim') return 'documentary_source_line'
  if (line.lineType === 'emotion') return 'emotional_pause'
  const caption = captionVisualCueTimingPlan?.refinedCaptionTimings.find((item) => item.linkedTranscriptLineId === line.id)
  if ((caption?.captionText.split(/\s+/).filter(Boolean).length ?? 0) > 8) return 'caption_heavy_section'
  if (line.emphasisWords.length) return 'important_phrase'
  return 'voice_clarity'
}

export function createMusicDuckingTimingForSpeech(params: {
  input: PlannerInput
  speechLine: TranscriptTimingLine
  captionVisualCueTimingPlan?: CaptionVisualCueTimingPlan
  index: number
}): RefinedMusicDuckingTimingItem {
  const reasonType = reasonTypeForSpeech(params.speechLine, params.captionVisualCueTimingPlan)
  const range = params.speechLine.timeRange
  const attackFrames = Math.max(3, Math.round(range.fps * 0.12))
  const releaseFrames = Math.max(6, Math.round(range.fps * 0.22))
  const startFrame = Math.max(0, range.startFrame - attackFrames)
  const endFrame = range.endFrame + releaseFrames
  const linkedCaption = params.captionVisualCueTimingPlan?.refinedCaptionTimings.find((item) => item.linkedTranscriptLineId === params.speechLine.id)

  return {
    id: `refined-ducking-${params.index + 1}`,
    timeRange: createFrameTimeRangeFromFrames(startFrame, endFrame, range.fps),
    duckingStrength: getDuckingStrength({ input: params.input, reasonType }),
    reasonType,
    linkedSpeechLineId: params.speechLine.id,
    linkedCaptionTimingItemId: linkedCaption?.id,
    attackFrames,
    releaseFrames,
    preserveMusicDrop: reasonType === 'emotional_pause',
    voicePriority: true,
    reason: `Ducking protects ${reasonType.replaceAll('_', ' ')} while keeping music supportive.`,
    qaChecks: [
      'Voice clarity wins over music bed level.',
      'Ducking attack starts before the speech line needs clarity.',
      'Release is smooth and does not pump.',
    ],
  }
}
