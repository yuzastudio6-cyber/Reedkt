import type { PlaywrightSharpCaptureCommandPlan } from './playwright-sharp-capture-types'

export function buildPlaywrightSharpCaptureCommandPlan(): PlaywrightSharpCaptureCommandPlan[] {
  return [
    {
      commandId: 'phase49c-static-report',
      phase: 'preflight',
      commandString: 'npm run activation:playwright-sharp-capture-fixture:report',
      requiresConfirmation: false,
      textOnlyByDefault: false,
      warnings: ['Static report only; no browser launch, screenshot, GCP mutation, search, or paid provider call.'],
    },
    {
      commandId: 'phase49c-iam-plan',
      phase: 'preflight',
      commandString: 'npm run activation:playwright-sharp-capture-fixture:iam-plan',
      requiresConfirmation: false,
      textOnlyByDefault: false,
      warnings: ['Report-only IAM plan. Do not apply broad bucket grants or public principals.'],
    },
    {
      commandId: 'phase49c-generated-local-capture-execution',
      phase: 'execute',
      commandString: 'GCP_PROJECT_ID=reeditpro GCP_REGION=us-central1 REEDITPRO_ENV=staging REEDITPRO_CONFIRM_PLAYWRIGHT_SHARP_CAPTURE_FIXTURE=true npm run activation:playwright-sharp-capture-fixture -- --execute',
      requiresConfirmation: true,
      textOnlyByDefault: false,
      warnings: [
        'Executes local generated HTML capture only.',
        'Does not run live search, public web capture, paid providers, Readability extraction, Docker, or Cloud Run.',
      ],
    },
    {
      commandId: 'phase49c-post-validation',
      phase: 'validation',
      commandString: 'npm run smoke:activation-playwright-sharp-capture-fixture && npm run activation:playwright-sharp-capture-fixture:report && git diff --check',
      requiresConfirmation: false,
      textOnlyByDefault: false,
      warnings: ['Validation must not execute public web capture or live search.'],
    },
  ]
}
