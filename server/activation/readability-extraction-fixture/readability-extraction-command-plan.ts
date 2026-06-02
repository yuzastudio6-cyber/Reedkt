import { readabilityExtractionConfig } from './readability-extraction-policy'
import type { ReadabilityExtractionCommandPlan } from './readability-extraction-types'

export function buildReadabilityExtractionCommandPlan(): ReadabilityExtractionCommandPlan[] {
  return [
    {
      commandId: 'phase49d-static-report',
      phase: 'preflight',
      commandString: 'npm run activation:readability-extraction-fixture:report',
      requiresConfirmation: false,
      allowedInPhase49D: true,
    },
    {
      commandId: 'phase49d-iam-plan',
      phase: 'preflight',
      commandString: 'npm run activation:readability-extraction-fixture:iam-plan',
      requiresConfirmation: false,
      allowedInPhase49D: true,
    },
    {
      commandId: 'phase49d-generated-local-extraction-execution',
      phase: 'execute',
      commandString: `GCP_PROJECT_ID=${readabilityExtractionConfig.projectId} GCP_REGION=${readabilityExtractionConfig.region} REEDITPRO_ENV=${readabilityExtractionConfig.env} REEDITPRO_CONFIRM_READABILITY_EXTRACTION_FIXTURE=true LIVE_SEARCH_ALLOWED=false PUBLIC_WEB_EXTRACTION_ALLOWED=false BROWSER_CAPTURE_ALLOWED=false PAID_PROVIDERS_ALLOWED=false PUBLIC_ACCESS_ENABLED=false npm run activation:readability-extraction-fixture -- --execute`,
      requiresConfirmation: true,
      allowedInPhase49D: true,
    },
    {
      commandId: 'phase49d-public-web-extraction',
      phase: 'execute',
      commandString: 'TEXT ONLY: public web extraction remains blocked until a later explicit controlled policy.',
      requiresConfirmation: true,
      allowedInPhase49D: false,
      blockedReason: 'Phase 49D may extract only generated local HTML fixtures.',
    },
    {
      commandId: 'phase49d-validation',
      phase: 'validation',
      commandString: 'npm run smoke:activation-readability-extraction-fixture && npm run activation:readability-extraction-fixture:report && npm run lint && npm run build && npm run build:server && git diff --check',
      requiresConfirmation: false,
      allowedInPhase49D: true,
    },
  ]
}
