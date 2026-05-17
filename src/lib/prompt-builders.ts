import type { PlannerInput, ProfessionalEditingDirective, ReferenceDNA } from '../types/reeditpro'
import { getReferenceAdaptationSummary, getReferenceDoNotCopySummary } from './reference-dna'

function referenceGuidance(referenceDNA?: ReferenceDNA) {
  if (!referenceDNA) {
    return 'No reference DNA provided.'
  }

  return `Reference DNA guidance: ${getReferenceAdaptationSummary(referenceDNA)} Adapt the mood and editing language, but do not copy shot-for-shot. ${getReferenceDoNotCopySummary(referenceDNA)} User instructions override reference.`
}

export function buildProviderPromptGuidance(params: {
  input: PlannerInput
  directive: ProfessionalEditingDirective
  referenceDNA?: ReferenceDNA
}): string[] {
  const reference = referenceGuidance(params.referenceDNA)
  const guidance = [
    `Wan brief: primary future video provider only if generation is approved. ${reference}`,
    `Hailuo brief: fallback/alternate only; keep prompt concise and under 2000 characters. ${reference}`,
    `Graphic Design / VisualExplain brief: reference may guide layout rhythm and caption density, while ReeditPro owns exact text and composition.`,
    `Stroke Motion brief: reference may guide pacing and emotional tone, not exact scenes or character identity.`,
    `Real Motion brief: reference may guide mood and product motion style, not exact objects unless the user's content matches.`,
    `Remotion brief: final canvas and composition own frame layout; include reference pacing and transition hints only after approval.`,
  ]

  if (params.input.editLevel === 'advanced_viral') {
    guidance.push('Veo fallback note: never primary/default; future Premium-only final fallback/rescue after Wan/Hailuo, with approval.')
    guidance.push(`Directive guardrails: ${params.directive.tierModelRules.join(' ')}`)
  } else {
    guidance.push('Directive guardrails: Wan primary, Hailuo fallback/alternate, approval required before any provider work.')
  }

  return guidance
}
