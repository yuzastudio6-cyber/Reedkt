import type {
  SFXEventPlanRecord,
  SFXPromptPlanRecord,
  SFXProviderRouteRecord,
} from '../../types'
import type { ValidateSFXPromptPlanResponse } from '../contracts/sfx-director-contracts'

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

function includesAny(text: string, terms: string[]): boolean {
  const value = text.toLowerCase()
  return terms.some((term) => value.includes(term))
}

export function validateProviderPromptStyle(
  promptPlan: SFXPromptPlanRecord,
  providerRoute: SFXProviderRouteRecord,
): string[] {
  if (providerRoute.recommendedProvider === 'mmaudio_v' && promptPlan.promptStyle !== 'video_conditioned_short_prompt') {
    return ['MMAudio prompts should use video_conditioned_short_prompt style.']
  }

  if (providerRoute.recommendedProvider === 'mirelo_sfx_v1_5' && promptPlan.promptStyle === 'video_conditioned_short_prompt') {
    return ['Mirelo production prompts should not use MMAudio short prompt style.']
  }

  if (providerRoute.recommendedProvider === 'reeditpro_internal_library' && promptPlan.promptStyle !== 'library_search_tags') {
    return ['Internal library search should use library_search_tags style.']
  }

  return []
}

export function validateSFXPromptDuration(promptPlan: SFXPromptPlanRecord): string[] {
  if (promptPlan.durationNeededSeconds <= 0) return ['Prompt plan is missing a positive needed duration.']

  if (promptPlan.provider !== 'reeditpro_internal_library' && promptPlan.durationToGenerateSeconds < promptPlan.durationNeededSeconds) {
    return ['Duration to generate is shorter than needed duration.']
  }

  if (promptPlan.provider !== 'reeditpro_internal_library' && promptPlan.durationToGenerateSeconds <= 0) {
    return ['Provider prompt plan is missing a positive generated duration.']
  }

  return []
}

export function validateSFXPromptSafety(
  promptPlan: SFXPromptPlanRecord,
  eventPlan: SFXEventPlanRecord,
): string[] {
  const warnings: string[] = []
  const prompt = `${promptPlan.prompt} ${promptPlan.negativePrompt}`.toLowerCase()

  if (includesAny(prompt, ['api key', 'secret', 'token', 'service role', 'signed url'])) {
    warnings.push('Prompt appears to contain secret-like text.')
  }

  if (includesAny(promptPlan.prompt, ['vocals', 'lyrics', 'music loop', 'song'])) {
    warnings.push('SFX prompt appears to request vocals, lyrics, music, or a loop.')
  }

  if (eventPlan.mixPriority === 'voice_first' && !includesAny(prompt, ['dialogue', 'speech', 'voice'])) {
    warnings.push('Voice-first event should mention dialogue, speech, or voice safety in prompt or negative prompt.')
  }

  return warnings
}

export function validateSFXPromptSpecificity(
  promptPlan: SFXPromptPlanRecord,
  providerRoute: SFXProviderRouteRecord,
): string[] {
  const warnings: string[] = []
  const count = wordCount(promptPlan.prompt)

  if (count < 2 && providerRoute.recommendedProvider !== 'reeditpro_internal_library') {
    warnings.push('Prompt may be too vague.')
  }

  if (providerRoute.recommendedProvider === 'mmaudio_v' && count > 10) {
    warnings.push('MMAudio prompt may be too long for the default video-conditioned style.')
  }

  if (
    providerRoute.recommendedProvider === 'mirelo_sfx_v1_5' &&
    promptPlan.promptStyle === 'structured_sentence' &&
    count < 10
  ) {
    warnings.push('Mirelo structured production prompt may be too short.')
  }

  return warnings
}

export function validateSFXPromptAgainstSourceFootagePolicy(
  promptPlan: SFXPromptPlanRecord,
  eventPlan: SFXEventPlanRecord,
): string[] {
  if (
    eventPlan.sourceFootagePolicy === 'edit_layer_only_default' &&
    includesAny(promptPlan.prompt, ['footstep', 'door', 'car', 'plate', 'clothing', 'crowd', 'water splash'])
  ) {
    return ['Prompt suggests source-footage action SFX while source policy is edit-layer-only default.']
  }

  return []
}

export function validateSFXPromptAgainstVolumeProfile(
  promptPlan: SFXPromptPlanRecord,
  eventPlan: SFXEventPlanRecord,
): string[] {
  if (
    (eventPlan.volumeProfile === 'whisper' || eventPlan.volumeProfile === 'subtle_polish' || eventPlan.volumeProfile === 'premium_soft') &&
    includesAny(promptPlan.prompt, ['loud', 'impact', 'boom', 'explosion', 'heavy hit'])
  ) {
    return [`Prompt conflicts with ${eventPlan.volumeProfile} volume profile.`]
  }

  return []
}

export function createSFXPromptValidationWarnings(
  promptPlan: SFXPromptPlanRecord,
  eventPlan: SFXEventPlanRecord,
  providerRoute: SFXProviderRouteRecord,
  avoidSFXInstructions: string[] = [],
): string[] {
  const noSFXConflict = avoidSFXInstructions.join(' ').toLowerCase().includes('no sfx') ||
    avoidSFXInstructions.join(' ').toLowerCase().includes('no sound effects')

  return [
    ...validateProviderPromptStyle(promptPlan, providerRoute),
    ...validateSFXPromptDuration(promptPlan),
    ...validateSFXPromptSafety(promptPlan, eventPlan),
    ...validateSFXPromptSpecificity(promptPlan, providerRoute),
    ...validateSFXPromptAgainstSourceFootagePolicy(promptPlan, eventPlan),
    ...validateSFXPromptAgainstVolumeProfile(promptPlan, eventPlan),
    ...(noSFXConflict ? ['Prompt conflicts with user no-SFX instruction.'] : []),
    ...(promptPlan.negativePrompt.length === 0 ? ['Prompt is missing avoid/negative prompt rules.'] : []),
  ]
}

export function validateSFXPromptPlan(params: {
  promptPlan: SFXPromptPlanRecord
  sfxEventPlan: SFXEventPlanRecord
  providerRoute: SFXProviderRouteRecord
  avoidSFXInstructions?: string[]
}): ValidateSFXPromptPlanResponse {
  const warnings = createSFXPromptValidationWarnings(
    params.promptPlan,
    params.sfxEventPlan,
    params.providerRoute,
    params.avoidSFXInstructions,
  )

  return {
    ok: warnings.length === 0,
    warnings,
    errors: [],
  }
}
