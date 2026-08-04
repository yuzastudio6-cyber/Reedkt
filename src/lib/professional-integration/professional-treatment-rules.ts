import type {
  AssetTreatmentPlan,
  EditCue,
  EditCueRole,
  OverlayCompositionPlan,
  OverlayFrameStyle,
  ProfessionalQaRisk,
  SourceLibraryAsset,
  TransitionTreatment,
} from '../../types'

type RuleInput = {
  cue?: EditCue
  asset?: SourceLibraryAsset
  label?: string
  tags?: string[]
}

const treatmentRoles = new Set<EditCueRole>([
  'b_roll',
  'overlay',
  'picture_in_picture',
  'split_screen',
  'insert_clip',
  'text_overlay',
  'caption_instruction',
  'graphic',
  'sound_effect',
  'music',
])

const brollRoles = new Set<EditCueRole>([
  'b_roll',
  'insert_clip',
  'picture_in_picture',
  'split_screen',
])

const overlayRoles = new Set<EditCueRole>([
  'overlay',
  'picture_in_picture',
  'split_screen',
  'text_overlay',
  'caption_instruction',
  'graphic',
])

const audioRoles = new Set<EditCueRole>(['sound_effect', 'music'])

function combinedText(input: RuleInput) {
  return [
    input.label,
    input.asset?.label,
    input.asset?.mediaKind,
    input.asset?.userRole,
    input.asset?.aiSummary,
    ...(input.tags ?? []),
    ...(input.asset?.tags ?? []),
  ].filter(Boolean).join(' ').toLowerCase()
}

function isScreenshotLike(input: RuleInput) {
  const text = combinedText(input)
  return input.asset?.mediaKind === 'screenshot' ||
    input.asset?.mediaKind === 'screen_recording' ||
    input.asset?.userRole === 'screenshot' ||
    text.includes('screenshot') ||
    text.includes('screen')
}

function hasPrivacySignals(input: RuleInput) {
  const text = combinedText(input)
  return isScreenshotLike(input) &&
    /privacy|private|email|phone|address|account|login|dm|message|text|sensitive/.test(text)
}

export function roleRequiresProfessionalTreatment(role: EditCueRole) {
  return treatmentRoles.has(role)
}

export function roleUsesBrollTreatment(role: EditCueRole) {
  return brollRoles.has(role)
}

export function roleUsesOverlayTreatment(role: EditCueRole) {
  return overlayRoles.has(role)
}

export function roleUsesAudioTreatment(role: EditCueRole) {
  return audioRoles.has(role)
}

export function getDefaultOverlayFrameStyle(input: RuleInput): OverlayFrameStyle {
  const text = combinedText(input)

  if (input.asset?.mediaKind === 'screen_recording' || text.includes('browser')) return 'browser_frame'
  if (text.includes('mobile') || text.includes('phone')) return 'device_frame'
  if (isScreenshotLike(input) || input.asset?.mediaKind === 'image') return 'rounded_card'
  if (input.asset?.userRole === 'logo') return 'none'
  if (input.cue?.role === 'graphic') return 'glass_card'
  if (input.cue?.role === 'text_overlay' || input.cue?.role === 'caption_instruction') return 'soft_shadow'
  return 'ai_decides'
}

export function getDefaultTransitionTreatment(input: RuleInput): TransitionTreatment {
  const text = combinedText(input)

  if (input.cue?.role === 'overlay' || input.cue?.role === 'graphic' || input.cue?.role === 'text_overlay') return 'scale_pop'
  if (input.cue?.role === 'picture_in_picture' || input.cue?.role === 'split_screen') return 'smooth_push'
  if (text.includes('fast') || text.includes('dynamic') || text.includes('high-energy')) return 'smooth_push'
  if (text.includes('premium') || text.includes('subtle') || text.includes('clean')) return 'fade'
  if (input.cue?.role === 'b_roll' || input.cue?.role === 'insert_clip') return 'cut'
  return 'ai_decides'
}

export function getDefaultCropModeForRole(role: EditCueRole): NonNullable<AssetTreatmentPlan['cropMode']> {
  if (role === 'overlay' || role === 'text_overlay' || role === 'caption_instruction' || role === 'graphic') return 'fit'
  if (role === 'reference_only') return 'original'
  if (role === 'b_roll' || role === 'insert_clip') return 'fill'
  return 'safe_crop'
}

export function getDefaultPlacementForRole(role: EditCueRole): OverlayCompositionPlan['placement'] {
  if (role === 'b_roll' || role === 'insert_clip') return 'center'
  if (role === 'overlay' || role === 'picture_in_picture' || role === 'split_screen') return 'right'
  if (role === 'text_overlay' || role === 'caption_instruction') return 'lower_third'
  if (role === 'graphic') return 'center'
  return 'ai_decides'
}

export function getProfessionalQaRisksForCue(input: RuleInput): ProfessionalQaRisk[] {
  const risks = new Set<ProfessionalQaRisk>()
  const cue = input.cue
  const asset = input.asset

  if (!cue && !asset) return []

  if (cue && roleUsesOverlayTreatment(cue.role)) {
    risks.add('caption_collision')
    risks.add('face_collision')
    risks.add('unsafe_zone')
    if (isScreenshotLike(input)) risks.add('unreadable_text')
    risks.add('raw_edge_treatment')
  }

  if (hasPrivacySignals(input)) {
    risks.add('privacy_sensitive')
  }

  if (asset?.userRole === 'unknown' || asset?.mediaKind === 'unknown' || asset?.reviewStatus === 'needs_review') {
    risks.add('low_resolution')
  }

  if (cue && roleUsesBrollTreatment(cue.role)) {
    risks.add('bad_crop')
    risks.add('audio_conflict')
  }

  if (cue && roleUsesAudioTreatment(cue.role)) {
    risks.add('audio_conflict')
    risks.add('hard_audio_cut')
  }

  if (asset?.userRole === 'do_not_use' || asset?.priority === 'do_not_use') {
    risks.add('off_brand')
    risks.add('timing_mismatch')
  }

  return Array.from(risks)
}

export function shouldApplyPrivacyBlur(input: RuleInput) {
  return hasPrivacySignals(input)
}
