import type { ApprovedPlaywrightSharpCaptureEvidence } from './playwright-sharp-capture-types'
import { playwrightSharpCaptureConfig } from './playwright-sharp-capture-policy'

export const approvedPlaywrightSharpCaptureEvidence: ApprovedPlaywrightSharpCaptureEvidence = {
  phase: '49C',
  status: 'completed',
  runId: 'phase49c-20260602T022008',
  fixtureMode: playwrightSharpCaptureConfig.fixtureMode,
  localFixtureDescription: 'Generated local HTML page rendered through file:// only; no public web capture.',
  playwrightBrowser: 'chromium',
  viewport: playwrightSharpCaptureConfig.viewport,
  originalScreenshotUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49c/phase49c-20260602T022008/capture/screenshot-original.png',
  previewScreenshotUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49c/phase49c-20260602T022008/processed/screenshot-preview.png',
  thumbnailScreenshotUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49c/phase49c-20260602T022008/processed/screenshot-thumbnail.png',
  captureManifestUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49c/phase49c-20260602T022008/manifest/capture-artifact-manifest.json',
  qaReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49c/phase49c-20260602T022008/qa/playwright-sharp-capture-qa.json',
  phase49cReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49c/phase49c-20260602T022008/reports/phase49c-report.json',
  phase49DReadiness: 'ready_for_readability_extraction_fixture',
  blockers: [],
  warnings: [
    'Phase 49C proves only local generated Playwright capture and Sharp post-processing.',
    'No public pages were approved for capture.',
    'Phase 49D may begin only as a generated/local Readability extraction fixture.',
  ],
}

export function getApprovedPlaywrightSharpCaptureEvidence(): ApprovedPlaywrightSharpCaptureEvidence {
  return {
    ...approvedPlaywrightSharpCaptureEvidence,
    blockers: [...approvedPlaywrightSharpCaptureEvidence.blockers],
    warnings: [...approvedPlaywrightSharpCaptureEvidence.warnings],
  }
}
