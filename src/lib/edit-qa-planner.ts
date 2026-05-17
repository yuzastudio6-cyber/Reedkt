import type { PlannerInput, ReferenceVideoPlan } from '../types/reeditpro'

export function createEditQAChecks(params: {
  input: PlannerInput
  referenceVideoPlan?: ReferenceVideoPlan
}): string[] {
  const checks = [
    'Approval and credit estimate must be accepted before generation begins.',
    'User instructions override dropdown context and reference DNA.',
    'Tier/model rules override reference DNA.',
    'Reference DNA must not force 1080P or change frame background rules.',
  ]

  if (params.input.editLevel === 'basic' || params.input.editLevel === 'pro') {
    checks.push('Reference DNA must not enable or mention Veo routing for Basic or Pro.')
  }

  if (params.referenceVideoPlan?.referenceProvided) {
    checks.push('Reference DNA used as guidance only.')
    checks.push('Exact shot-for-shot copy avoided.')
    checks.push('Exact music copy avoided.')
    checks.push('Style adaptation matches selected focus.')
    checks.push('Reference video does not bypass approval.')
  }

  if (params.referenceVideoPlan?.skipped) {
    checks.push('Reference skipped; no reference style influence should be applied.')
  }

  return checks
}
