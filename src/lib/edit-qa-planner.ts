import type { BrowserCapturePlan, PlannerInput, ReferenceVideoPlan } from '../types/reeditpro'

export function createEditQAChecks(params: {
  input: PlannerInput
  referenceVideoPlan?: ReferenceVideoPlan
  browserCapturePlan?: BrowserCapturePlan
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

  if (params.browserCapturePlan?.active) {
    checks.push('Browser capture plan exists when browser/screen opportunity exists.')
    checks.push('Exact website/app/dashboard/product page visuals use controlled capture planning, not AI video.')
    checks.push('Source permission/status is represented.')
    checks.push('Source-needed and safe wording are represented.')
    checks.push('Mock/example browser visuals are labeled as mock/example when applicable.')
    checks.push('Redaction plan exists if privacy risk is medium/high.')
    checks.push('Browser visual must not cover faces or captions.')
    checks.push('Screenshot text/readability is planned.')
    checks.push('Highlight/zoom target is clear.')
    checks.push('Documentary evidence pages are not treated as verified unless status supports it.')
    checks.push('No Playwright execution before approval.')
    checks.push('No browser capture bypasses auth, paywalls, CAPTCHAs, site restrictions, or credentials.')
    checks.push('Browser capture does not use Veo.')
    checks.push('Browser plan does not bypass approval.')
  }

  if (!params.browserCapturePlan?.active && /website|webpage|dashboard|browser|product page|article|evidence page|screen capture/i.test(params.input.customInstructions)) {
    checks.push('Browser/app visual opportunity should be reviewed because the instructions mention web, app, page, dashboard, or screen capture.')
  }

  return checks
}
