import type { ApprovedReadabilityExtractionEvidence } from './readability-extraction-types'
import { readabilityExtractionConfig } from './readability-extraction-policy'

export const approvedReadabilityExtractionEvidence: ApprovedReadabilityExtractionEvidence = {
  phase: '49D',
  status: 'blocked',
  runId: 'phase49d-20260602T132955',
  fixtureMode: readabilityExtractionConfig.fixtureMode,
  localFixtureDescription: 'Generated local article fixture was prepared, but execution stopped before Readability extraction because GCP preflight could not authenticate non-interactively.',
  phase49EReadiness: 'blocked',
  blockers: [
    'GCP preflight blocked Phase 49D before Readability extraction: active account aiediting@reeditpro.com requires non-interactive reauthentication for gcloud projects describe reeditpro.',
    'Alternate account yuzastudio6@gmail.com is authenticated but lacks reeditpro project and storage permissions.',
  ],
  warnings: [
    'No Readability extraction, public web request, browser capture, screenshot, paid provider call, GCS upload, Docker, Cloud Run deploy, production unlock, or external beta unlock occurred.',
    'Human reauthentication for aiediting@reeditpro.com or equivalent non-interactive GCP credentials is required before rerunning Phase 49D execution.',
  ],
}

export function getApprovedReadabilityExtractionEvidence(): ApprovedReadabilityExtractionEvidence {
  return {
    ...approvedReadabilityExtractionEvidence,
    blockers: [...approvedReadabilityExtractionEvidence.blockers],
    warnings: [...approvedReadabilityExtractionEvidence.warnings],
  }
}
