import type { CompiledEditingIntent, PlannerInput, ReferenceAdaptationFocus } from '../types/reeditpro'

const referenceAvoidRules = [
  'Use reference DNA as style guidance, not shot-for-shot copy.',
  'Do not copy exact sequence, exact music, or copyrighted visual assets.',
  'User instructions override reference DNA when they conflict.',
]

function splitInstructions(customInstructions: string) {
  return customInstructions
    .split(/[.!?]+/)
    .map((instruction) => instruction.trim())
    .filter(Boolean)
}

function uniqueFocus(focus: ReferenceAdaptationFocus[]) {
  return Array.from(new Set(focus))
}

export function inferReferenceAdaptationFocus(input: PlannerInput): ReferenceAdaptationFocus[] {
  const text = `${input.customInstructions} ${(input.referenceNotes ?? []).join(' ')}`.toLowerCase()
  const focus = [...(input.referenceAdaptationFocus ?? [])]

  if (text.includes('ignore reference') || text.includes('skip reference')) {
    focus.push('ignore_reference')
  }

  if (text.includes('only captions') || text.includes('only caption') || text.includes('caption style')) {
    focus.push('caption_style')
  }

  if (text.includes('only pacing') || text.includes('pacing')) {
    focus.push('pacing')
  }

  if (text.includes('only transition') || text.includes('transition style')) {
    focus.push('transition_style')
  }

  if (text.includes('music') || text.includes('sound') || text.includes('soundsync')) {
    focus.push('music_sound')
  }

  if (text.includes('mood') || text.includes('tone') || text.includes('calmer')) {
    focus.push('color_mood')
  }

  return uniqueFocus(focus.length ? focus : ['overall_style'])
}

export function compileEditingIntent(input: PlannerInput): CompiledEditingIntent {
  const explicitInstructions = splitInstructions(input.customInstructions)
  const referenceUrlProvided = input.referenceUrl.trim().length > 0
  const referenceMode = input.referenceVideoMode ?? (referenceUrlProvided ? 'user_pasted_link' : 'no_reference')
  const referenceSkipped = referenceMode === 'reference_skipped' || inferReferenceAdaptationFocus(input).includes('ignore_reference')
  const text = input.customInstructions.toLowerCase()
  const referencePreferences: string[] = []
  const avoidRules: string[] = []
  const userOverrides: string[] = []
  const clarifyingNotes: string[] = []

  if ((referenceUrlProvided || input.referenceVideoMode === 'mock_reference') && !referenceSkipped) {
    referencePreferences.push('Use reference DNA as style guidance, not shot-for-shot copy.')
    avoidRules.push(...referenceAvoidRules)
  }

  if (text.includes('copy exactly') || text.includes('copy it exactly') || text.includes('same exact')) {
    referencePreferences.push('User wants a close style match, translated into ReeditPro-safe style adaptation.')
    avoidRules.push('Do not copy the reference shot-for-shot even when the user asks for a close match.')
    clarifyingNotes.push('Close match means pacing, caption language, mood, and edit logic, not exact scenes, music, or creator identity.')
  }

  if (text.includes('calmer') || text.includes('less aggressive')) {
    userOverrides.push('Make the reference influence calmer and less aggressive.')
  }

  if (text.includes('only captions') || text.includes('only caption')) {
    userOverrides.push('Use only caption style from the reference.')
  }

  if (text.includes('only pacing')) {
    userOverrides.push('Use only pacing from the reference.')
  }

  if (referenceSkipped) {
    userOverrides.push('Ignore reference video influence.')
    clarifyingNotes.push('Reference video is skipped for this plan.')
  }

  return {
    goalSummary: `Create a ${input.workflowType.replaceAll('_', ' ')} for ${input.targetPlatform.replaceAll('_', ' ')} with ${input.editLevel.replaceAll('_', ' ')} planning.`,
    explicitInstructions,
    referencePreferences: Array.from(new Set(referencePreferences)),
    avoidRules: Array.from(new Set(avoidRules)),
    userOverrides: Array.from(new Set(userOverrides)),
    clarifyingNotes,
    confidence: input.customInstructions.trim().length > 12 ? 'high' : 'medium',
  }
}
