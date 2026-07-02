import type {
  StoryTimingAnchorType,
  StoryTimingAuthority,
  StoryTimingEventType,
  StoryTimingPriority,
  StoryTimingSourceSystem,
  StoryTimingSyncMode,
  StoryTimingTrackType,
} from '../../types/storytiming'

interface AuthorityChoiceInput {
  label?: string
  purpose?: string
  hasSpeech?: boolean
  hasMusic?: boolean
  preserveEmotionalPause?: boolean
  signatureFocused?: boolean
  targetPlatform?: string
}

const includesAny = (value: string | undefined, tokens: string[]): boolean => {
  const normalized = value?.toLowerCase() ?? ''
  return tokens.some((token) => normalized.includes(token))
}

export function choosePrimaryTimingAuthority(input: AuthorityChoiceInput): StoryTimingAuthority {
  const text = `${input.label ?? ''} ${input.purpose ?? ''} ${input.targetPlatform ?? ''}`

  if (input.preserveEmotionalPause || includesAny(text, ['faith', 'serious', 'teaching', 'emotional', 'pause'])) {
    return 'emotional_timing'
  }

  if (!input.hasSpeech && (input.hasMusic || includesAny(text, ['montage', 'fitness', 'beat', 'high-energy']))) {
    return 'music_rhythm'
  }

  if (input.signatureFocused || includesAny(text, ['stroke', 'graphic', 'real motion', 'signature'])) {
    return 'signature_animation'
  }

  if (includesAny(text, ['luxury', 'real estate', 'walkthrough', 'lifestyle', 'vacation'])) {
    return 'visual_comprehension'
  }

  return 'speech_meaning'
}

export function chooseAnchorAuthority(
  anchorType: StoryTimingAnchorType,
  sourceSystem: StoryTimingSourceSystem,
): StoryTimingAuthority {
  if (sourceSystem === 'sfx_event' || sourceSystem === 'sfx_alignment' || anchorType === 'sfx_hit') {
    return 'sfx_hit'
  }

  if (sourceSystem === 'music_cue' || sourceSystem === 'music_mix' || anchorType.startsWith('music_')) {
    return 'music_rhythm'
  }

  if (anchorType === 'pause' || anchorType === 'breath' || anchorType === 'emotional_shift') {
    return 'emotional_timing'
  }

  if (
    sourceSystem === 'stroke_motion' ||
    anchorType === 'stroke_motion_start' ||
    anchorType === 'stroke_motion_completion'
  ) {
    return 'signature_animation'
  }

  if (
    sourceSystem === 'graphic_design' ||
    sourceSystem === 'real_motion' ||
    anchorType === 'graphic_reveal' ||
    anchorType.startsWith('real_motion_')
  ) {
    return 'visual_comprehension'
  }

  if (anchorType === 'caption_reveal' || anchorType === 'caption_emphasis') {
    return 'caption_readability'
  }

  return 'speech_meaning'
}

export function chooseEventSyncMode(
  eventType: StoryTimingEventType,
  trackType: StoryTimingTrackType,
): StoryTimingSyncMode {
  if (eventType.includes('sfx') || trackType === 'sfx') {
    return 'frame_locked'
  }

  if (eventType.includes('music') || trackType === 'music') {
    return 'beat_locked'
  }

  if (eventType.includes('caption') || trackType === 'captions') {
    return 'speech_locked'
  }

  if (eventType.includes('stroke')) {
    return 'phrase_locked'
  }

  if (trackType === 'graphic_design' || trackType === 'real_motion') {
    return 'visual_motion_locked'
  }

  if (eventType === 'cut' || eventType.includes('transition')) {
    return 'frame_locked'
  }

  return 'loose'
}

export function chooseTimingPriority(
  sourceSystem: StoryTimingSourceSystem,
  authority: StoryTimingAuthority,
): StoryTimingPriority {
  if (authority === 'user_instruction' || authority === 'speech_meaning' || authority === 'emotional_timing') {
    return 'high'
  }

  if (authority === 'sfx_hit' || sourceSystem === 'sfx_alignment') {
    return 'high'
  }

  if (authority === 'caption_readability' || sourceSystem === 'caption_plan') {
    return 'high'
  }

  if (authority === 'platform_pacing') {
    return 'medium'
  }

  return 'medium'
}
