import { playwrightSharpCaptureArtifactPrefix, playwrightSharpCaptureConfig, playwrightSharpCaptureSafetyFlags } from './playwright-sharp-capture-policy'
import type { ApprovedPlaywrightSharpCapturePlanSnapshot } from './playwright-sharp-capture-types'

export function buildApprovedPlaywrightSharpCapturePlanSnapshot(runId: string): ApprovedPlaywrightSharpCapturePlanSnapshot {
  const prefix = playwrightSharpCaptureArtifactPrefix(runId)
  return {
    planId: 'phase49c-playwright-sharp-generated-local-capture-plan',
    phase49CRunId: runId,
    fixtureMode: playwrightSharpCaptureConfig.fixtureMode,
    approvedPhase49BRunId: playwrightSharpCaptureConfig.approvedPhase49BRunId,
    approvedPhase49BSourceManifestUri: playwrightSharpCaptureConfig.approvedPhase49BSourceManifestUri,
    browser: 'chromium',
    captureUrlType: 'local_fixture_file_url',
    viewport: playwrightSharpCaptureConfig.viewport,
    previewMaxWidth: playwrightSharpCaptureConfig.previewMaxWidth,
    thumbnailWidth: playwrightSharpCaptureConfig.thumbnailWidth,
    rawPromptExecution: false,
    approvedPlanSnapshot: true,
    liveSearchAllowed: false,
    publicWebCaptureAllowed: false,
    paidProviderAllowed: false,
    readabilityExtractionAllowed: false,
    publicArtifactAllowed: false,
    outputPrefixes: {
      generatedAssets: `gs://${playwrightSharpCaptureConfig.generatedAssetsBucket}/${prefix}/`,
      qaArtifacts: `gs://${playwrightSharpCaptureConfig.qaBucket}/${prefix}/`,
    },
    safety: playwrightSharpCaptureSafetyFlags,
  }
}
