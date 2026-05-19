import type { SFXSourceFootagePolicy, SFXTargetLayer } from '../../types'

export interface SFXSourceFootagePolicyInput {
  targetLayer?: SFXTargetLayer
  userPrompt?: string
  userSFXInstructions?: string[]
  avoidSFXInstructions?: string[]
  audioEnvironmentSummary?: string
  transcriptSummary?: string
  sceneContext?: string
  realMotionSupport?: boolean
}

function textForPolicy(input: SFXSourceFootagePolicyInput): string {
  return [
    input.userPrompt,
    input.audioEnvironmentSummary,
    input.transcriptSummary,
    input.sceneContext,
    ...(input.userSFXInstructions ?? []),
    ...(input.avoidSFXInstructions ?? []),
  ].join(' ').toLowerCase()
}

export function shouldAllowSourceFootageSFX(input: SFXSourceFootagePolicyInput): boolean {
  const text = textForPolicy(input)

  return input.targetLayer === 'source_footage_repair' ||
    input.realMotionSupport === true ||
    /full sound design|foley|add natural sounds|silent b-?roll|missing audio|no original audio|repair ambience|ambience repair|restore ambience/.test(text)
}

export function shouldAvoidSourceActionSFX(input: SFXSourceFootagePolicyInput): boolean {
  const text = textForPolicy(input)

  return /no sfx|no sound effects|avoid sfx|simple edit|talking head|serious|faith|teaching|do not add fake|no fake/.test(text) ||
    /footsteps|doors|cars|water|plates|clothing|crowds|random ambience/.test((input.avoidSFXInstructions ?? []).join(' ').toLowerCase())
}

export function recommendSFXSourceFootagePolicy(
  input: SFXSourceFootagePolicyInput,
): SFXSourceFootagePolicy {
  if (shouldAvoidSourceActionSFX(input)) return 'avoid_source_action_sfx'
  if (input.targetLayer === 'source_footage_repair') return 'allow_source_repair'
  if (shouldAllowSourceFootageSFX(input)) {
    return /full sound design|foley|add natural sounds/.test(textForPolicy(input))
      ? 'allow_full_sound_design'
      : 'user_requested_source_sfx'
  }

  return 'edit_layer_only_default'
}

export function createSourceFootagePolicyReason(policy: SFXSourceFootagePolicy): string {
  if (policy === 'allow_source_repair') {
    return 'Source-footage-style SFX is allowed only as explicit audio repair for missing or silent source audio.'
  }

  if (policy === 'allow_full_sound_design') {
    return 'The user requested full sound design, so source-footage-style sounds may be planned with approval.'
  }

  if (policy === 'user_requested_source_sfx') {
    return 'The source-footage-style sound has an explicit user or professional justification.'
  }

  if (policy === 'avoid_source_action_sfx') {
    return 'Avoid fake source-action sounds by default, especially under speech or serious content.'
  }

  return 'Default SFX supports ReeditPro-created edit layers rather than every real-world source action.'
}
