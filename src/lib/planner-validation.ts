import type { EditPlan, PlannerInput } from '../types/reeditpro'

export function validateMockEditPlan(plan: EditPlan, input: PlannerInput): EditPlan['plannerValidation'] {
  const checks: string[] = []
  const warnings: string[] = []

  if (plan.referenceVideoPlan?.referenceProvided) {
    const referenceDNA = plan.referenceVideoPlan.referenceDNA

    if (referenceDNA) {
      checks.push('Reference DNA exists for the provided reference.')
    } else {
      warnings.push('Reference was provided but Reference DNA is missing.')
    }

    if (referenceDNA?.adaptationRules.length) {
      checks.push('Reference adaptation rules exist.')
    } else {
      warnings.push('Reference adaptation rules are missing.')
    }

    if (referenceDNA?.doNotCopyRules.length) {
      checks.push('Reference do-not-copy rules exist.')
    } else {
      warnings.push('Reference do-not-copy rules are missing.')
    }

    if (plan.qaChecks?.some((check) => check.toLowerCase().includes('shot-for-shot'))) {
      checks.push('QA includes no shot-for-shot copy policy.')
    } else {
      warnings.push('QA does not explicitly mention shot-for-shot copy avoidance.')
    }
  }

  const promptText = (plan.providerPromptGuidance ?? []).join(' ').toLowerCase()

  if ((input.editLevel === 'basic' || input.editLevel === 'pro') && promptText.includes('veo')) {
    warnings.push('Basic/Pro plan includes Veo guidance.')
  } else {
    checks.push('Reference did not introduce Veo for Basic/Pro.')
  }

  if (promptText.includes('1080p')) {
    warnings.push('Prompt guidance includes a 1080P default.')
  } else {
    checks.push('Reference did not force a 1080P default.')
  }

  if (plan.approvalRequired) {
    checks.push('Approval remains required.')
  } else {
    warnings.push('Approval gate was removed.')
  }

  checks.push('Reference did not change matching frame/panel background defaults.')

  return {
    passed: warnings.length === 0,
    checks,
    warnings,
  }
}
