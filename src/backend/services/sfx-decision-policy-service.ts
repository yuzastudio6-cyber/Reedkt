import type {
  SFXDecisionState,
  SFXSourceFootagePolicy,
  SFXTargetLayer,
} from '../../types'
import type { EditComplexity } from '../../types/planning'
import type { EditQualityLevel } from '../../types/edit-quality'

export interface SFXDecisionPolicyInput {
  targetLayer?: SFXTargetLayer
  sourceFootagePolicy?: SFXSourceFootagePolicy
  editComplexity?: EditComplexity | EditQualityLevel
  userPrompt?: string
  userSFXInstructions?: string[]
  avoidSFXInstructions?: string[]
  transcriptSummary?: string
  sceneContext?: string
  videoTone?: string
  speechPresent?: boolean
  musicPresent?: boolean
  ambienceImportant?: boolean
}

export function normalizeEditQualityLevel(
  editComplexity?: EditComplexity | EditQualityLevel,
): EditQualityLevel {
  if (editComplexity === 'basic_edit') return 'basic'
  if (editComplexity === 'pro_edit') return 'pro'
  if (editComplexity === 'signature_edit') return 'signature'
  if (editComplexity === 'premium_signature_edit') return 'premium_signature'
  return editComplexity ?? 'pro'
}

function decisionText(input: SFXDecisionPolicyInput): string {
  return [
    input.userPrompt,
    input.transcriptSummary,
    input.sceneContext,
    input.videoTone,
    ...(input.userSFXInstructions ?? []),
    ...(input.avoidSFXInstructions ?? []),
  ].join(' ').toLowerCase()
}

export function shouldAvoidSFX(input: SFXDecisionPolicyInput): boolean {
  const text = decisionText(input)

  return input.targetLayer === 'none' ||
    input.sourceFootagePolicy === 'avoid_source_action_sfx' ||
    /no sfx|no sound effects|avoid sfx|simple clean edit|simple talking head|faith|bible|serious teaching|emotional pause|do not distract/.test(text) ||
    ((input.speechPresent ?? false) && /dialogue-heavy|important speech|teaching|serious/.test(text))
}

export function shouldAskUserForSFXConfirmation(input: SFXDecisionPolicyInput): boolean {
  const text = decisionText(input)

  return input.sourceFootagePolicy === 'allow_full_sound_design' ||
    input.sourceFootagePolicy === 'user_requested_source_sfx' ||
    /full sound design|foley|source action|expensive|premium production sfx|multiple sfx/.test(text)
}

export function shouldUseSFX(input: SFXDecisionPolicyInput): boolean {
  if (shouldAvoidSFX(input)) return false
  if (input.sourceFootagePolicy === 'allow_source_repair') return true
  if (input.targetLayer === 'stroke_motion' || input.targetLayer === 'real_motion') return true
  if (input.targetLayer === 'montage_hit' && input.musicPresent) return true
  if (input.targetLayer === 'transition' && !input.speechPresent) return true
  if (input.targetLayer === 'title_card' || input.targetLayer === 'chapter_card') return true
  if (input.targetLayer === 'cta_reveal') return true

  return input.targetLayer === 'graphic_design' || input.targetLayer === 'ambient_bridge'
}

export function decideSFXState(input: SFXDecisionPolicyInput): SFXDecisionState {
  if (shouldAvoidSFX(input)) return 'avoid'
  if (shouldAskUserForSFXConfirmation(input)) return 'needs_user_confirmation'

  const level = normalizeEditQualityLevel(input.editComplexity)

  if (!shouldUseSFX(input)) return 'not_needed'
  if (input.sourceFootagePolicy === 'allow_source_repair') return 'needed'
  if (level === 'premium_signature' && ['stroke_motion', 'real_motion', 'title_card', 'montage_hit'].includes(input.targetLayer ?? 'none')) {
    return 'needed'
  }
  if (level === 'signature' && ['stroke_motion', 'graphic_design', 'real_motion'].includes(input.targetLayer ?? 'none')) {
    return 'needed'
  }

  return 'optional'
}

export function createSFXAvoidRules(input: SFXDecisionPolicyInput): string[] {
  const rules = [
    'Do not add random SFX.',
    'Do not add fake source-action sounds by default.',
    'Do not cover speech or important dialogue.',
  ]

  if (input.speechPresent) rules.push('Keep SFX ducked or avoid SFX under speech.')
  if (/faith|serious|teaching/.test(decisionText(input))) {
    rules.push('Avoid cheap hits, loud whooshes, or distracting polish in serious teaching content.')
  }
  if (input.sourceFootagePolicy === 'edit_layer_only_default') {
    rules.push('Tie SFX to a planned edit layer and timing anchor.')
  }

  return rules
}

export function createSFXMustFollowRules(input: SFXDecisionPolicyInput): string[] {
  const rules = [
    'SFX must support the story, visual cue, or transition.',
    'SFX must remain subtle and voice-first by default.',
    'Any future generation must remain approval and credit gated.',
  ]

  if (input.targetLayer === 'stroke_motion') rules.push('Synchronize the sound to the Stroke Motion cue.')
  if (input.targetLayer === 'real_motion') rules.push('Use room-matched realistic sound, not a cinematic boom.')
  if (input.sourceFootagePolicy !== 'edit_layer_only_default') {
    rules.push('Document the explicit reason for source-footage-style sound.')
  }

  return rules
}
