import type { CompiledEditingIntent, PlannerInput, ProfessionalEditingDirective } from '../types/reeditpro'

function getBasePacing(input: PlannerInput) {
  if (input.workflowType === 'social_short_viral_clip' || input.moodStyle === 'viral_fast_paced') {
    return 'fast but readable'
  }

  if (input.workflowType === 'education_explainer') {
    return 'structured and clear'
  }

  if (input.workflowType === 'real_estate_property_tour' || input.moodStyle === 'luxury') {
    return 'premium smooth'
  }

  if (input.editLevel === 'basic') {
    return 'natural clean'
  }

  return 'tight clean'
}

function getCaptionStyle(input: PlannerInput) {
  if (input.workflowType === 'education_explainer') {
    return 'education labels with readable hierarchy'
  }

  if (input.workflowType === 'marketing_ad' || input.workflowType === 'product_demo') {
    return 'keyword emphasis with proof moments'
  }

  if (input.editLevel === 'basic') {
    return 'basic readable captions'
  }

  return 'premium subtle captions'
}

function getVisualDensity(input: PlannerInput) {
  if (input.visualPreference === 'no_extra_visuals' || input.visualPreference === 'keep_visuals_minimal') {
    return 'minimal'
  }

  if (input.visualPreference === 'more_graphic_design' || input.workflowType === 'education_explainer') {
    return 'structured graphic support'
  }

  if (input.visualPreference === 'real_motion_if_useful') {
    return 'selective premium overlays'
  }

  return input.editLevel === 'basic' ? 'low' : 'balanced'
}

function getTierModelRules(input: PlannerInput) {
  const sharedRules = [
    'Wan is the primary AI video generation provider when future generation is needed.',
    'Hailuo is fallback/alternate only.',
    'Veo must never be primary/default.',
    'Reference DNA must not change model eligibility.',
  ]

  if (input.editLevel === 'basic' || input.editLevel === 'pro') {
    return [...sharedRules, 'Basic and Pro must never show or route to Veo.']
  }

  return [
    ...sharedRules,
    'Advanced mock planning may mention future Premium-only Veo final fallback/rescue, but never as primary/default.',
  ]
}

export function createProfessionalEditingDirective(params: {
  input: PlannerInput
  compiledIntent: CompiledEditingIntent
}): ProfessionalEditingDirective {
  const { input, compiledIntent } = params
  const transitionFamilies =
    input.editLevel === 'basic'
      ? ['clean cuts', 'soft contextual transitions only if needed']
      : ['clean cuts', 'story-matched transitions', 'smooth premium transitions']

  return {
    editLevel: input.editLevel,
    pacingStyle: getBasePacing(input),
    transitionFamilies,
    captionStyle: getCaptionStyle(input),
    soundStyle:
      input.editLevel === 'basic'
        ? 'subtle voice-first cleanup and light bed only if useful'
        : 'SoundSync supports mood, beat timing, ducking, and polish while speech stays clear',
    visualDensity: getVisualDensity(input),
    signatureSystemGuidance: [
      'Dropdown workflow gives context only; route signature systems per segment.',
      'Basic is professional lower-compute editing, not lower quality.',
      'Real Motion remains optional, premium, face-safe, and credit-heavy.',
    ],
    customDirectives: [
      ...compiledIntent.referencePreferences,
      ...compiledIntent.userOverrides,
      ...compiledIntent.clarifyingNotes,
    ],
    avoidRules: compiledIntent.avoidRules,
    tierModelRules: getTierModelRules(input),
    approvalRequired: true,
  }
}
