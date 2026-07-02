import type {
  SFXAdjustmentDecisionRecord,
  SFXEventPlanRecord,
  SFXQAReportRecord,
  SFXRegenerationDecisionRecord,
  SFXReplacementDecisionRecord,
} from '../../types'

export interface SFXQAChatSummaryInput {
  qaReport: SFXQAReportRecord
  regenerationDecision?: SFXRegenerationDecisionRecord
  adjustmentDecision?: SFXAdjustmentDecisionRecord
  replacementDecision?: SFXReplacementDecisionRecord
  eventPlan: SFXEventPlanRecord
}

function targetLabel(eventPlan: SFXEventPlanRecord): string {
  return eventPlan.targetLayer.replaceAll('_', ' ')
}

export function createSFXRegenerationChatSummary(decision: SFXRegenerationDecisionRecord): string {
  if (!decision.shouldRegenerate) return 'Regeneration is not needed for this SFX.'

  return decision.userFacingSummary ??
    `Regenerate this SFX with this prompt adjustment: ${decision.promptAdjustment}.`
}

export function createSFXAdjustmentChatSummary(decision: SFXAdjustmentDecisionRecord): string {
  if (decision.adjustmentTypes.length === 0) return 'No trim, timing, or mix adjustment is recommended.'

  return decision.adjustmentSummary
}

export function createSFXRemovalChatSummary(params: {
  qaReport: SFXQAReportRecord
  eventPlan: SFXEventPlanRecord
}): string {
  if (params.eventPlan.decisionState === 'avoid') {
    return `I removed SFX from this ${targetLabel(params.eventPlan)} moment because the plan says sound should be avoided.`
  }
  if (params.eventPlan.decisionState === 'not_needed') {
    return `No SFX is needed for this ${targetLabel(params.eventPlan)} moment; keeping it clean is the better edit.`
  }

  return `This ${targetLabel(params.eventPlan)} SFX did not pass QA and should be removed before preview.`
}

export function createSFXQAChatSummary(input: SFXQAChatSummaryInput): string[] {
  const { qaReport, eventPlan, regenerationDecision, adjustmentDecision, replacementDecision } = input
  const base = `SFX QA scored ${qaReport.overallScore}/100 for the ${targetLabel(eventPlan)} cue.`

  if (qaReport.recommendedAction === 'remove_sfx') {
    return [
      base,
      createSFXRemovalChatSummary({ qaReport, eventPlan }),
    ]
  }

  if (replacementDecision?.shouldReplaceWithLibrary && replacementDecision.libraryAvailable) {
    return [
      base,
      replacementDecision.userFacingSummary,
      'This keeps the edit project-safe while avoiding another generation pass.',
    ]
  }

  if (regenerationDecision?.shouldRegenerate) {
    return [
      base,
      createSFXRegenerationChatSummary(regenerationDecision),
      'The current sound should not be used until a new mock output passes timing, mix, and style QA.',
    ]
  }

  if (adjustmentDecision?.canUseWithoutRegeneration) {
    return [
      base,
      createSFXAdjustmentChatSummary(adjustmentDecision),
      'This path keeps the existing sound but fixes timing, trim, ducking, or mix before preview.',
    ]
  }

  if (qaReport.recommendedAction === 'use') {
    return [
      base,
      `This ${targetLabel(eventPlan)} SFX passed QA and can be used in the project preview.`,
    ]
  }

  if (qaReport.recommendedAction === 'use_with_mix_adjustment') {
    return [
      base,
      'The SFX is usable, but it should receive a small mix adjustment before preview.',
    ]
  }

  return [
    base,
    `Recommended action: ${qaReport.recommendedAction.replaceAll('_', ' ')}.`,
  ]
}
