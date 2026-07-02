import type {
  SFXAnchorType,
  SFXTargetLayer,
  SFXTimingPriority,
} from '../../types'

export interface SFXTimingAnchorPolicyInput {
  targetLayer?: SFXTargetLayer
  label?: string
  sceneContext?: string
  anchorTimeSeconds?: number
  speechPresent?: boolean
  musicPresent?: boolean
}

function timingText(input: SFXTimingAnchorPolicyInput): string {
  return [input.label, input.sceneContext].join(' ').toLowerCase()
}

export function recommendSFXAnchorType(input: SFXTimingAnchorPolicyInput): SFXAnchorType {
  const text = timingText(input)

  if (input.targetLayer === 'transition') return 'cut'
  if (input.targetLayer === 'title_card') return 'title_reveal'
  if (input.targetLayer === 'chapter_card') return 'chapter_card_reveal'
  if (input.targetLayer === 'graphic_design') return 'graphic_reveal'
  if (input.targetLayer === 'stroke_motion') {
    if (/morph/.test(text)) return 'stroke_motion_morph'
    if (/start|draw/.test(text)) return 'stroke_motion_start'
    return 'stroke_motion_completion'
  }
  if (input.targetLayer === 'real_motion') {
    if (/enter|entry/.test(text)) return 'real_motion_object_enter'
    return 'real_motion_object_settle'
  }
  if (input.targetLayer === 'montage_hit') return input.musicPresent ? 'music_beat' : 'cut'
  if (input.targetLayer === 'cta_reveal') return 'cta_reveal'
  if (input.targetLayer === 'caption_emphasis') return 'caption_keyword'

  return 'manual'
}

export function recommendAnchorTime(input: SFXTimingAnchorPolicyInput): number {
  return input.anchorTimeSeconds ?? 0
}

export function recommendSFXPreRollMs(input: SFXTimingAnchorPolicyInput): number {
  if (input.targetLayer === 'transition') return 267
  if (input.targetLayer === 'title_card' || input.targetLayer === 'chapter_card') return 120
  if (input.targetLayer === 'stroke_motion') return 80
  if (input.targetLayer === 'montage_hit') return 40
  return 0
}

export function recommendSFXTailMs(input: SFXTimingAnchorPolicyInput): number {
  if (input.targetLayer === 'ambient_bridge') return 1200
  if (input.targetLayer === 'transition') return 400
  if (input.targetLayer === 'title_card' || input.targetLayer === 'chapter_card') return 500
  if (input.targetLayer === 'cta_reveal') return 600
  return 250
}

export function recommendSFXTimingPriority(input: SFXTimingAnchorPolicyInput): SFXTimingPriority {
  if (input.speechPresent) return 'speech_safe'
  if (input.targetLayer === 'montage_hit' && input.musicPresent) return 'beat_aligned'
  if (['transition', 'title_card', 'chapter_card', 'graphic_design', 'stroke_motion', 'real_motion', 'cta_reveal'].includes(input.targetLayer ?? 'none')) {
    return 'frame_accurate'
  }
  if (input.targetLayer === 'ambient_bridge') return 'loose_background'

  return 'manual_review'
}

export function createSFXTimingGuidance(input: SFXTimingAnchorPolicyInput): string[] {
  const anchorType = recommendSFXAnchorType(input)

  return [
    `Use ${anchorType} as the mock timing anchor.`,
    'RP-SFX-04 recommends anchor timing only; trim and hit alignment are later milestones.',
    'Future placement must be frame-accurate and protect speech clarity.',
  ]
}
